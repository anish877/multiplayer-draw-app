import { useAuth } from '@/app/auth/verify/index';
import { initDraw } from '@/app/draw';
import React, { useEffect, useRef, useState } from 'react';
import ChatSection from './ChatSection';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Circle, Square, Pencil, MousePointer, FileImage, Type, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import OnlineUsersDropdown from './OnlineUsersComponent';

type ToolType = "select" | "circle" | "rect" | "pencil" | "image" | "text";

// Consistent colors array
const CHALK_COLORS = [
    '#ffffff', // white
    '#f5c431', // yellow
    '#f59331', // orange
    '#f55031', // red
    '#31f550', // green
    '#31f5f5', // cyan
    '#3165f5', // blue
    '#9e31f5', // purple
    '#ff69b4', // pink
    '#808080', // gray
    '#d4af37', // gold
    '#40e0d0', // turquoise
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

    // Socket event listener
    useEffect(() => {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'users_update') {
                    setOnlineUsers(data.users);
                }
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };

        socket.addEventListener('message', handleMessage);

        return () => {
            socket.removeEventListener('message', handleMessage);
        };
    }, [socket]);

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
    }, [type]);
    
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
                const cleanup = await initDraw(canvas, roomId, socket, userId, type, selectedColor);
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
                    initDraw(canvas, roomId, socket, userId, type, selectedColor)
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

        try {
            socket.send(JSON.stringify({
                type: "text_element",
                message: JSON.stringify({
                    type: "text",
                    x: textPosition.x,
                    y: textPosition.y,
                    content: textContent,
                    color: selectedColor,
                    style: textStyle,
                    id: Math.random().toString(36).substr(2, 9)
                }),
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

                // Send image data to other users
                try {
                    socket.send(JSON.stringify({
                        type: "image_element",
                        message: JSON.stringify({
                            type: "image",
                            x: imagePosition.x,
                            y: imagePosition.y,
                            width,
                            height,
                            src: imageData,
                            id: Math.random().toString(36).substr(2, 9)
                        }),
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

    // Socket connection status check
    const isSocketConnected = socket && socket.readyState === WebSocket.OPEN;

    return (
        <div ref={containerRef} className="relative h-screen w-screen overflow-hidden">
            <canvas 
                ref={canvasRef} 
                className="absolute top-0 left-0 w-full h-full bg-[#222222]"
            />
            
            {/* Connection status indicator */}
            {!isSocketConnected && (
                <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md z-50">
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

            {/* Text input overlay with formatting controls */}
            {showTextInput && (
                <Card className="absolute z-20 bg-[#333333] border-[#444444]"
                    style={{
                        left: textPosition.x,
                        top: textPosition.y,
                    }}>
                    <CardContent className="p-4">
                        <div className="flex gap-2 mb-2">
                            <select
                                className="bg-[#444444] text-white px-2 py-1 rounded"
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
                                <PopoverContent className="w-auto p-0">
                                    <ColorPicker />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <textarea
                            ref={textInputRef}
                            className="bg-[#444444] text-white border border-[#555555] p-2 rounded-md w-full min-w-[200px]"
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

            {/* Tools panel */}
            <Card className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#272727] w-auto z-10 border-[#3d3d3d]">
                <CardContent className="flex flex-col gap-2 p-2 justify-center items-center">
                    {tools.map((tool) => (
                        <Button
                            key={tool.type}
                            variant={type === tool.type ? "default" : "secondary"}
                            size="icon"
                            onClick={() => setType(tool.type)}
                            className={cn(
                                "w-10 h-10 bg-[#272727]",
                                type === tool.type ? "bg-[#444444] hover:bg-[#444444]" : "hover:bg-[#444444]",
                                "text-[#d4d4d4]"
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
                        <PopoverContent className="w-auto p-0">
                            <ColorPicker />
                        </PopoverContent>
                    </Popover>
                </CardContent>
            </Card>

            <Card className="absolute bottom-2 right-4 w-80 h-96 bg-[#222222] z-10 border-0 overflow-auto scrollbar-hide">
                <OnlineUsersDropdown users={onlineUsers} />
                <ChatSection roomId={roomId} socket={socket} />
            </Card>
        </div>
    );
};

export default CanvasComponent;