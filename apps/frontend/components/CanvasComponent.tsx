import { useAuth } from '@/app/auth/verify/index';
import { initDraw } from '@/app/draw';
import React, { useEffect, useRef, useState } from 'react';
import ChatSection from './ChatSection';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Circle, Square, Pencil, MousePointer, FileImage, Type, Check, X, MessageCircle, MinimizeIcon, MaximizeIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import OnlineUsersDropdown from './OnlineUsersComponent';
import AnimatedChalkDust from '@/components/AnimatedChalkDust';

type ToolType = "select" | "circle" | "rect" | "pencil" | "image" | "text";

// Colors that mimic chalk on a green blackboard
const CHALK_COLORS = [
    '#ffffff', // white - classic chalk
    '#f9eaa9', // soft yellow - muted chalk
    '#c4d8f5', // light blue - softer blue
    '#f7c4d8', // pale pink - dusty chalk pink
    '#f7bdb4', // pale red/salmon - more chalk-like
    '#c2e6c8', // light green - visible on dark green
    '#c2e6e6', // pale cyan - dusty chalk cyan
    '#e2c8f0', // lavender - dusty chalk purple
    '#f0e6c0', // soft gold - more natural chalk gold
    '#c8c8c8', // light gray - natural chalk gray
    '#f7d9c4', // peach - softer orange tone
    '#c0e8e0', // pale turquoise - chalk-like turquoise
];

const CanvasComponent = ({roomId, socket}: {roomId: string, socket: WebSocket}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cleanupFunctionRef = useRef<(() => void) | null>(null);
    const [type, setType] = useState<ToolType>("select");
    const [showTextInput, setShowTextInput] = useState(false);
    const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
    const [selectedColor, setSelectedColor] = useState(CHALK_COLORS[0]);
    const [fontSize, setFontSize] = useState(16);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const { userId } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState<Array<{ name: string; userId: string }>>([]);
    const [canvasInitialized, setCanvasInitialized] = useState(false);
    // Chat toggle state
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [unreadMessages, setUnreadMessages] = useState(0);
    // Track objects on canvas to prevent duplications
    const [canvasObjects, setCanvasObjects] = useState<{[id: string]: any}>({});
    // Track when an object is being moved
    const [isMovingObject, setIsMovingObject] = useState(false);
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
    const {username} = useAuth()

    // Socket event listener
    useEffect(() => {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'users_update') {
                    setOnlineUsers(data.users);
                } else if (data.type === 'chat_message' && !isChatVisible) {
                    // Increment unread count if chat is hidden
                    setUnreadMessages(prev => prev + 1);
                } else if (data.type === 'canvas_update') {
                    // Track objects being added to the canvas
                    try {
                        const canvasData = JSON.parse(data.message);
                        if (canvasData.id) {
                            setCanvasObjects(prev => ({
                                ...prev,
                                [canvasData.id]: canvasData
                            }));
                        }
                    } catch (err) {
                        console.error('Error parsing canvas update:', err);
                    }
                } else if (data.type === 'move_object') {
                    // Handle object movement updates
                    try {
                        const moveData = JSON.parse(data.message);
                        if (moveData.id) {
                            setCanvasObjects(prev => ({
                                ...prev,
                                [moveData.id]: {
                                    ...prev[moveData.id],
                                    x: moveData.x,
                                    y: moveData.y
                                }
                            }));
                        }
                    } catch (err) {
                        console.error('Error parsing move update:', err);
                    }
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };

        socket.addEventListener('message', handleMessage);

        return () => {
            socket.removeEventListener('message', handleMessage);
        };
    }, [socket, isChatVisible]);

    // Handle canvas resize with proper debouncing
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;
        
        const handleResize = () => {
            if (!canvasRef.current || !containerRef.current) return;
            
            // Store the current canvas content
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            let imageData = null;
            
            if (context && canvasInitialized) {
                imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            }
            
            // Get container dimensions
            const container = containerRef.current;
            const rect = container.getBoundingClientRect();
            
            // Set canvas size to match container
            canvas.width = rect.width;
            canvas.height = rect.height;
            
            // Restore the canvas content if we saved it
            if (imageData && context) {
                context.putImageData(imageData, 0, 0);
            }
            
            setCanvasInitialized(true);
        };

        // Create a debounced version of handleResize
        let resizeTimeout: NodeJS.Timeout | null = null;
        const debouncedResize = () => {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            resizeTimeout = setTimeout(handleResize, 250);
        };

        // Initial resize
        handleResize();

        // Listen for window resize with debounce
        window.addEventListener('resize', debouncedResize);
        
        return () => {
            window.removeEventListener('resize', debouncedResize);
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
        };
    }, [canvasInitialized]);

    // Handle text and image tool clicks
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const handleCanvasClick = (e: MouseEvent) => {
            // Skip if we're in selection mode and moving an object
            if (type === "select" && isMovingObject) {
                return;
            }
            
            const rect = canvas.getBoundingClientRect();
            const clickPosition = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            
            if (type === "text") {
                setTextPosition(clickPosition);
                setShowTextInput(true);
                setTimeout(() => {
                    if (textInputRef.current) {
                        textInputRef.current.focus();
                    }
                }, 0);
            } else if (type === "image") {
                setImagePosition(clickPosition);
                if (fileInputRef.current) {
                    fileInputRef.current.click();
                }
            }
        };

        if (type === "text" || type === "image") {
            canvas.addEventListener("click", handleCanvasClick);
            return () => {
                canvas.removeEventListener("click", handleCanvasClick);
            };
        }
        
        return undefined;
    }, [type, isMovingObject]);
    
    // Drawing initialization - with prevention of multiple initializations
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !socket || socket.readyState !== WebSocket.OPEN) return;
        
        const setupCanvas = async () => {
            // Clean up previous drawing instance if it exists
            if (cleanupFunctionRef.current) {
                cleanupFunctionRef.current();
                cleanupFunctionRef.current = null;
            }
            
            try {
                // Pass additional parameters for object selection and movement tracking
                const cleanup = await initDraw(
                    canvas, 
                    roomId, 
                    socket, 
                    userId, 
                    type, 
                    selectedColor, 
                    (id: string) => {
                        setSelectedObjectId(id);
                        setIsMovingObject(true);
                    },
                    () => {
                        setIsMovingObject(false);
                        setSelectedObjectId(null);
                    },
                    username
                );
                cleanupFunctionRef.current = cleanup;
            } catch (error) {
                console.error("Error initializing drawing:", error);
            }
        };
        
        // Delay setup to ensure canvas is ready
        const timeoutId = setTimeout(() => {
            setupCanvas();
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            if (cleanupFunctionRef.current) {
                cleanupFunctionRef.current();
                cleanupFunctionRef.current = null;
            }
        };
    }, [roomId, socket, userId, type, selectedColor]);

    // Handle window focus/blur events to prevent drawing issues when switching tabs
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // Page is hidden (blur), clean up drawing
                if (cleanupFunctionRef.current) {
                    cleanupFunctionRef.current();
                    cleanupFunctionRef.current = null;
                }
            } else {
                // Page is visible again (focus), reinitialize drawing
                const canvas = canvasRef.current;
                if (canvas && socket && socket.readyState === WebSocket.OPEN) {
                    initDraw(
                        canvas, 
                        roomId, 
                        socket, 
                        userId, 
                        type, 
                        selectedColor,
                        (id: string) => {
                            setSelectedObjectId(id);
                            setIsMovingObject(true);
                        },
                        () => {
                            setIsMovingObject(false);
                            setSelectedObjectId(null);
                        },
                        username
                    )
                        .then(cleanup => {
                            cleanupFunctionRef.current = cleanup;
                        })
                        .catch(error => {
                            console.error("Error reinitializing drawing:", error);
                        });
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [roomId, socket, userId, type, selectedColor]);

    const handleTextSubmit = () => {
        if (!textInputRef.current?.value.trim() || !socket || socket.readyState !== WebSocket.OPEN) return;
        
        const textContent = textInputRef.current.value;
        const textStyle = {
            fontSize,
            isBold,
            isItalic,
        };

        const textId = Math.random().toString(36).substr(2, 9);

        try {
            const textObject = {
                type: "text",
                x: textPosition.x,
                y: textPosition.y,
                content: textContent,
                color: selectedColor,
                style: textStyle,
                id: textId
            };

            // Update local state first
            setCanvasObjects(prev => ({
                ...prev,
                [textId]: textObject
            }));

            socket.send(JSON.stringify({
                type: "text_element",
                message: JSON.stringify(textObject),
                roomId,
                userId
            }));

            setShowTextInput(false);
            textInputRef.current.value = "";
        } catch (error) {
            console.error("Error sending text message:", error);
        }
    };

    // Handle image file selection with size validation
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !socket || socket.readyState !== WebSocket.OPEN) return;
        
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) {
            console.error('Selected file is not an image');
            return;
        }

        // Check file size (limit to 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size too large. Please select an image under 5MB.');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (!event.target || typeof event.target.result !== 'string') return;
            
            const imageData = event.target.result;
            
            // Create an image element to get dimensions
            const img = new Image();
            img.onload = () => {
                // Calculate scaled dimensions to prevent oversized images
                const maxWidth = 800;
                const maxHeight = 600;
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    const ratio = maxWidth / width;
                    width = maxWidth;
                    height = height * ratio;
                }

                if (height > maxHeight) {
                    const ratio = maxHeight / height;
                    height = maxHeight;
                    width = width * ratio;
                }

                const imageId = Math.random().toString(36).substr(2, 9);
                
                // Create image object
                const imageObject = {
                    type: "image",
                    x: imagePosition.x,
                    y: imagePosition.y,
                    width,
                    height,
                    src: imageData,
                    id: imageId
                };

                // Update local state first
                setCanvasObjects(prev => ({
                    ...prev,
                    [imageId]: imageObject
                }));
                
                // Send image data to other users
                try {
                    socket.send(JSON.stringify({
                        type: "image_element",
                        message: JSON.stringify(imageObject),
                        roomId,
                        userId
                    }));
                } catch (error) {
                    console.error("Error sending image message:", error);
                }
            };
            img.src = imageData;
        };
        
        reader.readAsDataURL(file);
        
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Color picker component
    const ColorPicker = () => (
        <div className="grid grid-cols-6 gap-2 p-2">
            {CHALK_COLORS.map((color) => (
                <button
                    key={color}
                    className={cn(
                        "w-6 h-6 rounded-full border-2",
                        color === selectedColor ? "border-white" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                    aria-label={`Select color ${color}`}
                />
            ))}
        </div>
    );

    const tools = [
        { type: "select", icon: MousePointer, label: "Select" },
        { type: "circle", icon: Circle, label: "Circle" },
        { type: "rect", icon: Square, label: "Rectangle" },
        { type: "pencil", icon: Pencil, label: "Pencil" },
        { type: "text", icon: Type, label: "Text" },
        { type: "image", icon: FileImage, label: "Image" }
    ] as const;

    // Handle keyboard events for text input
    const handleTextKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowTextInput(false);
        } else if (e.key === 'Enter' && e.ctrlKey) {
            handleTextSubmit();
        }
    };

    // Toggle chat visibility
    const toggleChat = () => {
        setIsChatVisible(!isChatVisible);
        // Reset unread count when opening chat
        if (!isChatVisible) {
            setUnreadMessages(0);
        }
    };

    // Socket connection status check
    const isSocketConnected = socket && socket.readyState === WebSocket.OPEN;

    return (
        <div className="min-h-screen chalkboard overflow-hidden">
            {/* Add chalk dust animation for consistency with landing page */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
                <AnimatedChalkDust intensity="low" />
            </div>
            
            <OnlineUsersDropdown users={onlineUsers} />
            
            <div ref={containerRef} className="relative h-screen w-screen overflow-hidden">
                <canvas 
                    ref={canvasRef} 
                    className="absolute top-0 left-0 w-full h-full"
                    // Remove the dark background color - the chalkboard class will provide the background
                />
                
                {/* Connection status indicator - styled to match chalk theme */}
                {!isSocketConnected && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md z-50 border-2 border-white">
                        Disconnected - Trying to reconnect...
                    </div>
                )}
                
                {/* Hidden file input for image uploads */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    aria-label="Upload image"
                />

                {/* Text input overlay with formatting controls - styled to match chalk theme */}
                {showTextInput && (
                    <Card className="absolute z-20 bg-[#1a1a1a] border-[#444444]"
                        style={{
                            left: textPosition.x,
                            top: textPosition.y,
                        }}>
                        <CardContent className="p-4">
                            <div className="flex gap-2 mb-2">
                                <select
                                    className="bg-[#333333] text-white px-2 py-1 rounded border border-[#555555]"
                                    value={fontSize}
                                    onChange={(e) => setFontSize(Number(e.target.value))}
                                    aria-label="Font size"
                                >
                                    {[12, 14, 16, 18, 20, 24, 28, 32].map(size => (
                                        <option key={size} value={size}>{size}px</option>
                                    ))}
                                </select>
                                <Button
                                    variant={isBold ? "default" : "secondary"}
                                    size="sm"
                                    onClick={() => setIsBold(!isBold)}
                                    className="font-bold"
                                    aria-label="Bold"
                                    aria-pressed={isBold}
                                >
                                    B
                                </Button>
                                <Button
                                    variant={isItalic ? "default" : "secondary"}
                                    size="sm"
                                    onClick={() => setIsItalic(!isItalic)}
                                    className="italic"
                                    aria-label="Italic"
                                    aria-pressed={isItalic}
                                >
                                    I
                                </Button>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="w-8 h-8"
                                            style={{ backgroundColor: selectedColor }}
                                            aria-label="Select color"
                                        />
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-[#333333] border-[#555555]">
                                        <ColorPicker />
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <textarea
                                ref={textInputRef}
                                className="bg-[#333333] text-white border border-[#555555] p-2 rounded-md w-full min-w-[200px]"
                                rows={4}
                                placeholder="Enter text here..."
                                style={{
                                    fontSize: `${fontSize}px`,
                                    fontWeight: isBold ? 'bold' : 'normal',
                                    fontStyle: isItalic ? 'italic' : 'normal',
                                    color: selectedColor
                                }}
                                onKeyDown={handleTextKeyDown}
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => setShowTextInput(false)}
                                    aria-label="Cancel"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleTextSubmit}
                                    aria-label="Submit text"
                                >
                                    <Check className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tools panel - styled to match chalk theme */}
                <Card className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#1a1a1a] w-auto z-10 border-[#555555]">
                    <CardContent className="flex flex-col gap-2 p-2 justify-center items-center">
                        {tools.map((tool) => (
                            <Button
                                key={tool.type}
                                variant={type === tool.type ? "default" : "secondary"}
                                size="icon"
                                onClick={() => setType(tool.type)}
                                className={cn(
                                    "w-10 h-10 bg-[#1a1a1a]",
                                    type === tool.type ? "bg-[#444444] hover:bg-[#444444]" : "hover:bg-[#333333]",
                                    "text-[#ffffff]"
                                )}
                                aria-label={tool.label}
                                aria-pressed={type === tool.type}
                            >
                                <tool.icon className="h-5 w-5" />
                            </Button>
                        ))}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="w-7 h-7 m-1 rounded-full flex justify-center items-center"
                                    style={{ backgroundColor: selectedColor }}
                                    aria-label="Color picker"
                                />
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-[#333333] border-[#555555]">
                                <ColorPicker />
                            </PopoverContent>
                        </Popover>
                    </CardContent>
                </Card>

                {/* Chat toggle button */}
                <Button
                    variant="secondary"
                    onClick={toggleChat}
                    className="absolute bottom-2 right-4 z-20 bg-[#333333] hover:bg-[#444444] text-white m-5 mr-0 font-sans"
                    aria-label={isChatVisible ? "Hide chat" : "Show chat"}
                >
                    {isChatVisible ? (
                        <MinimizeIcon className="h-4 w-4 mr-1" />
                    ) : (
                        <>
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {unreadMessages > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                    {unreadMessages > 9 ? '9+' : unreadMessages}
                                </span>
                            )}
                        </>
                    )}
                    {isChatVisible ? "Hide Chat" : "Chat"}
                </Button>

                {/* Chat section - with toggle functionality and normal text style */}
                {isChatVisible && (
                    <Card className="absolute bottom-10 right-4 w-80 h-96 bg-[#1a1a1a] z-10 border border-[#555555] rounded-md overflow-hidden mb-8">
                        <CardContent className="p-0 h-full font-sans">
                            <div className="w-full h-full">
                                <ChatSection roomId={roomId} socket={socket} />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default CanvasComponent;