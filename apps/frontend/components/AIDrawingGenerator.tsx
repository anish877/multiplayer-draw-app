import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Check, X, Info, Eraser } from "lucide-react";
import { useAuth } from '@/app/auth/verify/index';
import axios from 'axios';
import { BACKEND_URL } from '@/app/config';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Shape types from your backend
type ShapeType = 'rect' | 'circle' | 'pencil' | 'text';

interface BaseShape {
  type: ShapeType;
  id: string;
  color: string;
  iseditable: boolean;
  userId: string;
}

interface RectShape extends BaseShape {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CircleShape extends BaseShape {
  type: 'circle';
  startx: number;
  starty: number;
  clientx: number;
  clienty: number;
}

interface PencilShape extends BaseShape {
  type: 'pencil';
  points: Array<{x: number, y: number}>;
}

interface TextShape extends BaseShape {
  type: 'text';
  x: number;
  y: number;
  content: string;
  style: {
    fontSize: number;
    isBold: boolean;
    isItalic: boolean;
  };
}

type Shape = RectShape | CircleShape | PencilShape | TextShape;

interface AIDrawingGeneratorProps {
  roomId: string;
  socket: WebSocket;
  onClose: () => void;
}

const AIDrawingGenerator: React.FC<AIDrawingGeneratorProps> = ({ roomId, socket, onClose }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const { userId } = useAuth();
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Example prompts to help users
  const examplePrompts: string[] = [
    "A simple landscape with mountains and a lake",
    "A cartoon character with a big smile",
    "A house with a garden and trees",
    "An abstract geometric pattern"
  ];

  // Draw shapes on preview canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || shapes.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw each shape
    shapes.forEach(shape => {
      ctx.strokeStyle = shape.color;
      ctx.fillStyle = shape.color;
      ctx.lineWidth = 2;
      
      switch (shape.type) {
        case 'rect':
          ctx.beginPath();
          ctx.rect(shape.x, shape.y, shape.width, shape.height);
          ctx.stroke();
          break;
          
        case 'circle':
          const radius = Math.sqrt(
            Math.pow(shape.clientx - shape.startx, 2) + 
            Math.pow(shape.clienty - shape.starty, 2)
          );
          ctx.beginPath();
          ctx.arc(shape.startx, shape.starty, radius, 0, 2 * Math.PI);
          ctx.stroke();
          break;
          
        case 'pencil':
          if (shape.points.length > 0) {
            ctx.beginPath();
            ctx.moveTo(shape.points[0].x, shape.points[0].y);
            for (let i = 1; i < shape.points.length; i++) {
              ctx.lineTo(shape.points[i].x, shape.points[i].y);
            }
            ctx.stroke();
          }
          break;
          
        case 'text':
          ctx.font = `${shape.style.isBold ? 'bold ' : ''}${shape.style.isItalic ? 'italic ' : ''}${shape.style.fontSize}px sans-serif`;
          ctx.fillText(shape.content, shape.x, shape.y);
          break;
      }
    });
  }, [shapes]);

  // Clear any error or success messages when prompt changes
  useEffect(() => {
    setError(null);
    setSuccessMessage(null);
  }, [prompt]);

  // Handle form submission
  const generateDrawing = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }
    
    setIsLoading(true);
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await axios.post<{ drawing: Shape[] }>(`${BACKEND_URL}/api/generate-drawing`, {
        prompt: prompt.trim(),
        userId
      });
      
      if (response.data.drawing && Array.isArray(response.data.drawing)) {
        setShapes(response.data.drawing);
        setSuccessMessage(`Successfully generated ${response.data.drawing.length} shapes!`);
      } else {
        setError('Invalid response from the server');
      }
    } catch (err: unknown) {
      console.error('Error generating drawing:', err);
      setError('Failed to generate drawing. Please try again.');
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  // Send shapes to the socket
  const sendShapesToCanvas = async () => {
    if (!socket || socket.readyState !== WebSocket.OPEN || shapes.length === 0) {
      setError('Cannot send shapes. Connection issue or no shapes available.');
      return;
    }
    
    setIsSending(true);
    
    try {
      // Send each shape to the socket
      for (const shape of shapes) {
        await new Promise<void>((resolve) => {
          socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify(shape),
            roomId,
            userId
          }));
          // Small delay to prevent overwhelming the socket
          setTimeout(resolve, 10);
        });
      }
      
      // Close the dialog after sending
      onClose();
    } catch (err : unknown) {
      console.log(err)
      setError('Error sending shapes to canvas');
    } finally {
      setIsSending(false);
    }
  };

  // Use an example prompt
  const useExamplePrompt = (example: string) => {
    setPrompt(example);
  };

  // Clear the canvas and shapes
  const clearCanvas = () => {
    setShapes([]);
    setSuccessMessage(null);
  };

  return (
    <Card className="w-full max-w-lg bg-[#1a1a1a] border-[#444444] shadow-xl font-sans">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-yellow-400" />
            AI Drawing Generator
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-[#333333] text-white border-[#444444]">
                <p className="text-xs max-w-xs">
                  Generate AI drawings from text prompts that will be converted to vector shapes on your canvas
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="text-gray-400">
          Describe what you want to draw, and AI will create it for you
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-200">
                Your Prompt
              </label>
              <span className="text-xs text-gray-400">
                {prompt.length}/200 characters
              </span>
            </div>
            <Textarea
              id="prompt"
              placeholder="E.g., A simple house with a tree and sun"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 200))}
              className="bg-[#333333] text-white border-[#555555] placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {examplePrompts.map((example, index) => (
                <Badge 
                  key={index}
                  className="bg-[#333333] hover:bg-[#444444] text-gray-300 cursor-pointer"
                  // eslint-disable-next-line react-hooks/rules-of-hooks
                  onClick={() => useExamplePrompt(example)}
                >
                  {example}
                </Badge>
              ))}
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive" className="bg-red-900/30 border border-red-500">
              <AlertDescription className="text-red-200 text-sm">
                {error}
              </AlertDescription>
            </Alert>
          )}
          
          {successMessage && !error && (
            <Alert className="bg-green-900/30 border border-green-500">
              <AlertDescription className="text-green-200 text-sm">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}
          
          {shapes.length > 0 && (
            <div className="bg-[#252525] rounded-md p-3 border border-[#444444]">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-300">Preview:</p>
                {shapes.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearCanvas}
                    className="h-7 text-xs text-gray-400 hover:text-white"
                  >
                    <Eraser className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              <div className="relative">
                <canvas 
                  ref={previewCanvasRef} 
                  width={400} 
                  height={300} 
                  className="w-full h-64 bg-black rounded"
                />
                {!shapes.length && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                    No shapes generated yet
                  </div>
                )}
              </div>
              {shapes.length > 0 && (
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-400">
                    {shapes.length} shape{shapes.length !== 1 ? 's' : ''} generated
                  </p>
                  <Badge variant="outline" className="text-xs border-[#555555] text-gray-300">
                    {shapes.filter(s => s.type === 'rect').length} rectangles • 
                    {shapes.filter(s => s.type === 'circle').length} circles • 
                    {shapes.filter(s => s.type === 'pencil').length} lines • 
                    {shapes.filter(s => s.type === 'text').length} texts
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t border-[#444444] pt-4">
        <Button
          variant="secondary"
          onClick={onClose}
          className="bg-[#333333] hover:bg-[#444444] text-white"
          disabled={isGenerating || isSending}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        
        <div className="space-x-2">
          <Button
            variant="outline"
            onClick={generateDrawing}
            disabled={isLoading || !prompt.trim() || isSending}
            className="bg-[#333333] hover:bg-[#444444] text-white border-[#555555]"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2 text-yellow-400" />
            )}
            Generate
          </Button>
          
          <Button
            onClick={sendShapesToCanvas}
            disabled={isLoading || shapes.length === 0 || isSending}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Apply to Canvas
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default AIDrawingGenerator;