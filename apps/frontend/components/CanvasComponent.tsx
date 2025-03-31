import { useAuth } from '@/app/auth/verify/index';
import { initDraw } from '@/app/draw';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import ChatSection from './ChatSection';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Circle, Square, Pencil, MousePointer, FileImage, Type, Check, X, MessageCircle, MinimizeIcon, ZoomIn, ZoomOut, Move, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import OnlineUsersDropdown from './OnlineUsersComponent';
import AnimatedChalkDust from '@/components/AnimatedChalkDust';
import AIDrawingGenerator from './AIDrawingGenerator';

type ToolType = "select" | "circle" | "rect" | "pencil" | "image" | "text" | "pan";

const CHALK_COLORS = [
    '#ffffff', // white with glow/translucency
    '#f9eaa9', // soft yellow with glow
    '#a0c0ff', // brighter blue with glow
    '#ffb0d0', // brighter pink with glow
    '#ffa599', // brighter salmon with glow
    '#a0ffa0', // brighter green with glow
    '#a0ffff', // brighter cyan with glow
    '#e0a0ff', // brighter lavender with glow
    '#ffe0a0', // brighter gold with glow
    '#e0e0e0', // brighter gray with glow
    '#ffbf99', // brighter peach with glow
    '#a0ffe0', // brighter turquoise with glow
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
    const [isChatVisible, setIsChatVisible] = useState(true);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [,setCanvasObjects] = useState<{[id: string]: unknown}>({});
    const [isMovingObject, setIsMovingObject] = useState(false);
    const [,setSelectedObjectId] = useState<string | null>(null);
    const {username} = useAuth();

    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [startPanPoint, setStartPanPoint] = useState({ x: 0, y: 0 });
    const [minZoom] = useState(0.1);
    const [maxZoom] = useState(5);
    const [showAIDrawingModal, setShowAIDrawingModal] = useState(false);

    useEffect(() => {
        if (!socket || socket.readyState !== WebSocket.OPEN) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'users_update') {
                    setOnlineUsers(data.users);
                } else if (data.type === 'chat_message' && !isChatVisible) {
                    setUnreadMessages(prev => prev + 1);
                } else if (data.type === 'canvas_update') {
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

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;
        
        const handleResize = () => {
            if (!canvasRef.current || !containerRef.current) return;
            
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            let imageData = null;
            
            if (context && canvasInitialized) {
                imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            }
            
            const container = containerRef.current;
            const rect = container.getBoundingClientRect();
            
            canvas.width = rect.width;
            canvas.height = rect.height;
            
            if (imageData && context) {
                context.putImageData(imageData, 0, 0);
            }
            
            setCanvasInitialized(true);
        };
        let resizeTimeout: NodeJS.Timeout | null = null;
        const debouncedResize = () => {
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            resizeTimeout = setTimeout(handleResize, 250);
        };
        handleResize();
        window.addEventListener('resize', debouncedResize);
        
        return () => {
            window.removeEventListener('resize', debouncedResize);
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
        };
    }, [canvasInitialized]);

    const applyTransformations = useCallback((ctx: CanvasRenderingContext2D) => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        ctx.setTransform(
            scale, 0, 0, scale, 
            offset.x, offset.y
        );
    }, [scale, offset]);

    const screenToCanvasCoords = useCallback((screenX: number, screenY: number) => {
        if (!canvasRef.current) return { x: 0, y: 0 };
        
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (screenX - rect.left - offset.x) / scale;
        const y = (screenY - rect.top - offset.y) / scale;
        
        return { x, y };
    }, [scale, offset]);

    const handlePanning = useCallback((e: MouseEvent) => {
        if (!isPanning || type !== "pan") return;
        
        const dx = e.clientX - startPanPoint.x;
        const dy = e.clientY - startPanPoint.y;
        
        setOffset(prev => ({
            x: prev.x + dx,
            y: prev.y + dy
        }));
        
        setStartPanPoint({
            x: e.clientX,
            y: e.clientY
        });
        
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                applyTransformations(ctx);
            }
        }
    }, [isPanning, type, startPanPoint, applyTransformations]);

    const startPanning = useCallback((e: MouseEvent) => {
        if (type !== "pan") return;
        
        setIsPanning(true);
        setStartPanPoint({
            x: e.clientX,
            y: e.clientY
        });
    }, [type]);

    const endPanning = useCallback(() => {
        setIsPanning(false);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        canvas.addEventListener('mousedown', startPanning);
        window.addEventListener('mousemove', handlePanning);
        window.addEventListener('mouseup', endPanning);
        
        return () => {
            canvas.removeEventListener('mousedown', startPanning);
            window.removeEventListener('mousemove', handlePanning);
            window.removeEventListener('mouseup', endPanning);
        };
    }, [startPanning, handlePanning, endPanning]);

    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const pointXBeforeZoom = (mouseX - offset.x) / scale;
        const pointYBeforeZoom = (mouseY - offset.y) / scale;
        
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newScale = Math.max(minZoom, Math.min(maxZoom, scale * zoomFactor));
        
        const newOffsetX = mouseX - pointXBeforeZoom * newScale;
        const newOffsetY = mouseY - pointYBeforeZoom * newScale;
        
        setScale(newScale);
        setOffset({
            x: newOffsetX,
            y: newOffsetY
        });
    }, [scale, offset, minZoom, maxZoom]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        canvas.addEventListener('wheel', handleWheel, { passive: false });
        
        return () => {
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, [handleWheel]);

    useEffect(() => {
        if (!canvasRef.current) return;
        
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
            applyTransformations(ctx);
        }
    }, [scale, offset, applyTransformations]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const handleCanvasClick = (e: MouseEvent) => {
            if ((type === "select" && isMovingObject) || type === "pan") {
                return;
            }
            
            const canvasCoords = screenToCanvasCoords(e.clientX, e.clientY);
            
            if (type === "text") {
                setTextPosition(canvasCoords);
                setShowTextInput(true);
                setTimeout(() => {
                    if (textInputRef.current) {
                        textInputRef.current.focus();
                    }
                }, 0);
            } else if (type === "image") {
                setImagePosition(canvasCoords);
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
    }, [type, isMovingObject, screenToCanvasCoords]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !socket || socket.readyState !== WebSocket.OPEN) return;
        
        const setupCanvas = async () => {
            if (cleanupFunctionRef.current) {
                cleanupFunctionRef.current();
                cleanupFunctionRef.current = null;
            }
            
            try {
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
    }, [roomId, socket, userId, type, selectedColor, scale, offset, screenToCanvasCoords, username]);

    const zoomIn = () => {
        const newScale = Math.min(maxZoom, scale * 1.2);
        setScale(newScale);
        
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            const scaleDiff = newScale - scale;
            const deltaX = (centerX - offset.x) * (scaleDiff / scale);
            const deltaY = (centerY - offset.y) * (scaleDiff / scale);
            
            setOffset({
                x: offset.x - deltaX,
                y: offset.y - deltaY
            });
        }
    };
    
    const zoomOut = () => {
        const newScale = Math.max(minZoom, scale / 1.2);
        setScale(newScale);
        
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            const scaleDiff = newScale - scale;
            const deltaX = (centerX - offset.x) * (scaleDiff / scale);
            const deltaY = (centerY - offset.y) * (scaleDiff / scale);
            
            setOffset({
                x: offset.x - deltaX,
                y: offset.y - deltaY
            });
        }
    };
    
    const resetView = () => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };

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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !socket || socket.readyState !== WebSocket.OPEN) return;
        
        const file = e.target.files[0];
        if (!file.type.startsWith('image/')) {
            console.error('Selected file is not an image');
            return;
        }

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
            const img = new Image();
            img.onload = () => {
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
                
                const imageObject = {
                    type: "image",
                    x: imagePosition.x,
                    y: imagePosition.y,
                    width,
                    height,
                    src: imageData,
                    id: imageId
                };

                setCanvasObjects(prev => ({
                    ...prev,
                    [imageId]: imageObject
                }));
                
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
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

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
        { type: "image", icon: FileImage, label: "Image" },
        { type: "pan", icon: Move, label: "Pan" }
    ] as const;

    const handleTextKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowTextInput(false);
        } else if (e.key === 'Enter' && e.ctrlKey) {
            handleTextSubmit();
        }
    };
    const toggleChat = () => {
        setIsChatVisible(!isChatVisible);
        if (!isChatVisible) {
            setUnreadMessages(0);
        }
    };

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
                    className="absolute top-0 left-0 w-full h-full cursor-crosshair"
                    // Add cursor style based on selected tool
                    style={{
                        cursor: type === 'pan' ? 'grab' : 
                                isPanning ? 'grabbing' : 
                                type === 'select' ? 'default' : 'crosshair'
                    }}
                />

                {/* AI Drawing Generator Modal */}
                {showAIDrawingModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                        <AIDrawingGenerator 
                            roomId={roomId} 
                            socket={socket} 
                            onClose={() => setShowAIDrawingModal(false)} 
                        />
                    </div>
                )}
                
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
                            left: offset.x + textPosition.x * scale,
                            top: offset.y + textPosition.y * scale,
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

                {/* Zoom controls panel */}
                <Card className="absolute right-4 top-1/2 -translate-y-1/2 bg-[#1a1a1a] w-auto z-10 border-[#555555] font-sans">
                    <CardContent className="flex flex-col gap-2 p-2 justify-center items-center">
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={zoomIn}
                            className="w-10 h-10 bg-[#1a1a1a] hover:bg-[#333333] text-[#ffffff]"
                            aria-label="Zoom in"
                        >
                            <ZoomIn className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={zoomOut}
                            className="w-10 h-10 bg-[#1a1a1a] hover:bg-[#333333] text-[#ffffff]"
                            aria-label="Zoom out"
                        >
                            <ZoomOut className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={resetView}
                            className="w-10 h-10 bg-[#1a1a1a] hover:bg-[#333333] text-[#ffffff]"
                            aria-label="Reset view"
                        >
                            <span className="text-xs">Reset</span>
                        </Button>
                        <div className="text-[#eeeeee] text-xs mt-1">
                            {Math.round(scale * 100)}%
                        </div>
                         {/* Add AI Drawing Generator button */}
                         <Button
                            variant="secondary"
                            size="icon"
                            onClick={() => setShowAIDrawingModal(true)}
                            className="w-10 h-10 bg-[#1a1a1a] hover:bg-[#333333] text-yellow-400 mt-2"
                            aria-label="AI Drawing Generator"
                        >
                            <Sparkles className="h-5 w-5" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Chat toggle button with unread message indicator */}
                <Button
                    variant="secondary"
                    size="icon"
                    onClick={toggleChat}
                    className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-[#333333] hover:bg-[#444444] text-white z-10"
                    aria-label={isChatVisible ? "Hide chat" : "Show chat"}
                >
                    {isChatVisible ? (
                        <MinimizeIcon className="h-5 w-5" />
                    ) : (
                        <div className="relative">
                            <MessageCircle className="h-5 w-5" />
                            {unreadMessages > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {unreadMessages > 9 ? '9+' : unreadMessages}
                                </span>
                            )}
                        </div>
                    )}
                </Button>

                {/* Chat panel */}
                {isChatVisible && (
                    <div className="absolute bottom-4 right-20 w-80 z-10 font-sans">
                        <ChatSection
                            socket={socket}
                            roomId={roomId}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CanvasComponent;
