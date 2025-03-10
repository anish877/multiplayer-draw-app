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
    const cleanupFunctionRef = useRef<(() => void) | null>(null);
    const [type, setType] = useState<ToolType>("select");
    const [showTextInput, setShowTextInput] = useState(false);
    const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
    const [selectedColor, setSelectedColor] = useState(CHALK_COLORS[0]);
    const [fontSize, setFontSize] = useState(16);
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const { userId } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState<Array<{ name: string; userId: string }>>([]);

    // Fix 1: Added a dependency array to useEffect for socket event listener
    useEffect(() => {
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

    // Handle canvas resize
    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;
        
        const handleResize = () => {
            if (!canvasRef.current || !containerRef.current) return;
            
            // Get container dimensions
            const container = containerRef.current;
            const rect = container.getBoundingClientRect();
            
            // Set canvas size to match container
            canvasRef.current.width = rect.width;
            canvasRef.current.height = rect.height;
        };

        // Initial resize
        handleResize();

        // Listen for window resize
        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Fix 2: Separate text input handling from drawing initialization
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        let cleanupTextListener: (() => void) | null = null;
        
        const handleCanvasClick = (e: MouseEvent) => {
            if (type === "text") {
                const rect = canvas.getBoundingClientRect();
                setTextPosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                });
                setShowTextInput(true);
                setTimeout(() => {
                    if (textInputRef.current) {
                        textInputRef.current.focus();
                    }
                }, 0);
            }
        };

        if (type === "text") {
            canvas.addEventListener("click", handleCanvasClick);
            cleanupTextListener = () => {
                canvas.removeEventListener("click", handleCanvasClick);
            };
        }
        
        return () => {
            if (cleanupTextListener) cleanupTextListener();
        };
    }, [type]);
    
    // Fix 3: Separate drawing initialization to its own effect
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const setupCanvas = async () => {
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
        
        setupCanvas();

        return () => {
            if (cleanupFunctionRef.current) {
                cleanupFunctionRef.current();
                cleanupFunctionRef.current = null;
            }
        };
    }, [roomId, socket, userId, type, selectedColor]);

    const handleTextSubmit = () => {
        if (!textInputRef.current?.value.trim()) return;
        
        const textContent = textInputRef.current.value;
        const textStyle = {
            fontSize,
            isBold,
            isItalic,
        };

        // Fix 4: Added error handling for socket messaging
        try {
            socket.send(JSON.stringify({
                type: "text_element", // Fix 5: Changed message type for clarity
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

    // Fix 6: Extracted ColorPicker as a separate component
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

    // Fix 7: Handle keyboard events for text input
    const handleTextKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setShowTextInput(false);
        } else if (e.key === 'Enter' && e.ctrlKey) {
            handleTextSubmit();
        }
    };

    // Fix 8: Added handling for the image tool type which was defined but not implemented
    const handleImageUpload = () => {
        // Implementation would go here
        console.log("Image upload functionality not yet implemented");
    };

    useEffect(() => {
        if (type === "image") {
            // For now, just log that it's not implemented
            console.log("Image tool selected but not yet implemented");
            // Alternatively, could open a file dialog here
        }
    }, [type]);

    return (
        <div ref={containerRef} className="relative h-screen w-screen overflow-hidden">
            <canvas 
                ref={canvasRef} 
                className="absolute top-0 left-0 w-full h-full bg-[#222222]"
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
                                color: selectedColor // Fix 9: Added color preview to textarea
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