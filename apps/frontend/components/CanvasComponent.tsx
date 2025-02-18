import { useAuth } from '@/app/auth/verify/index';
import { initDraw } from '@/app/draw';
import React, { useEffect, useRef, useState } from 'react';
import ChatSection from './ChatSection';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Circle, Square, Pencil, MousePointer, FileImage, Type } from "lucide-react";
import { cn } from "@/lib/utils";

type ToolType = "select" | "circle" | "rect" | "pencil" | "image" | "text";

const CanvasComponent = ({roomId, socket}: {roomId: string, socket: WebSocket}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);
    const cleanupFunctionRef = useRef<(() => void) | null>(null);
    const [type, setType] = useState<ToolType>("select");
    const [showTextInput, setShowTextInput] = useState(false);
    const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
    const { userId } = useAuth();

    // Handle canvas resize
    useEffect(() => {
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

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        let cleanupTextListener: (() => void) | null = null;
        
        // Handle text tool click
        const handleCanvasClick = (e: MouseEvent) => {
            if (type === "text") {
                const rect = canvas.getBoundingClientRect();
                setTextPosition({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                });
                setShowTextInput(true);
                if (textInputRef.current) {
                    textInputRef.current.focus();
                }
            }
        };

        if (type === "text") {
            canvas.addEventListener("click", handleCanvasClick);
            cleanupTextListener = () => {
                canvas.removeEventListener("click", handleCanvasClick);
            };
        }

        // Initialize drawing and get the cleanup function
        const setupCanvas = async () => {
            // If there's an existing cleanup function, call it first
            if (cleanupFunctionRef.current) {
                cleanupFunctionRef.current();
                cleanupFunctionRef.current = null;
            }
            
            // Initialize drawing and store the new cleanup function
            const cleanup = await initDraw(canvas, roomId, socket, userId, type);
            cleanupFunctionRef.current = cleanup;
        };
        
        setupCanvas();

        // Return combined cleanup function
        return () => {
            if (cleanupTextListener) cleanupTextListener();
            if (cleanupFunctionRef.current) cleanupFunctionRef.current();
        };
    }, [canvasRef, type, roomId, socket, userId]);

    const handleTextSubmit = () => {
        if (!textInputRef.current?.value) return;
        
        const textContent = textInputRef.current.value;
        socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify({
                type: "text",
                x: textPosition.x,
                y: textPosition.y,
                content: textContent,
                color: "#ffffff", // You can add color selection later
                id: Math.random().toString(36).substr(2, 9) // Add unique ID
            }),
            roomId,
            userId
        }));

        setShowTextInput(false);
        textInputRef.current.value = "";
    };

    const tools = [
        { type: "select", icon: MousePointer },
        { type: "circle", icon: Circle },
        { type: "rect", icon: Square },
        { type: "pencil", icon: Pencil },
        { type: "text", icon: Type },
        { type: "image", icon: FileImage }
    ] as const;

    return (
        <div ref={containerRef} className="relative h-screen w-screen overflow-hidden">
            <canvas 
                ref={canvasRef} 
                className="absolute top-0 left-0 w-full h-full bg-[#222222]"
            />

            {/* Text input overlay */}
            {showTextInput && (
                <div 
                    style={{
                        position: "absolute",
                        left: textPosition.x,
                        top: textPosition.y,
                        zIndex: 20
                    }}
                >
                    <textarea
                        ref={textInputRef}
                        className="bg-[#333333] text-white border border-[#444444] p-2 rounded-md"
                        rows={4}
                        cols={30}
                        placeholder="Enter text here..."
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleTextSubmit();
                            }
                            if (e.key === "Escape") {
                                setShowTextInput(false);
                            }
                        }}
                        onBlur={handleTextSubmit}
                    />
                </div>
            )}

            {/* Tools overlay using shadcn Card */}
            <Card className="absolute left-4 top-1/2 -translate-y-1/2 bg-[#272727] w-auto z-10 border-[#3d3d3d]">
                <CardContent className="flex flex-col gap-2 p-2">
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
                        >
                            <tool.icon className="h-5 w-5" />
                        </Button>
                    ))}
                </CardContent>
            </Card>

            {/* Chat box overlay using shadcn Card */}
            <Card className="absolute bottom-2 right-4 w-80 h-96 bg-[#222222] z-10 border-0 overflow-auto scrollbar-hide">
                <ChatSection roomId={roomId} socket={socket}/>
            </Card>
        </div>
    );
};

export default CanvasComponent;