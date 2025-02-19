import axios from "axios";
import { BACKEND_URL } from "../config";
import rough from 'roughjs';
import { RoughCanvas } from "roughjs/bin/canvas";

type Point = {
    x: number;
    y: number;
}

type Shape = {
    type: "rect";
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
    id?: string; // Add unique ID for each shape
} | {
    type: "circle";
    startx: number;
    starty: number;
    clientx: number;
    clienty: number;
    color?: string;
    id?: string; // Add unique ID for each shape
} | {
    type: "pencil";
    points: Point[];
    color?: string;
    id?: string; // Add unique ID for each shape
} | {
    type: "text";
    x: number;
    y: number;
    content: string;
    color?: string;
    id?: string;
    style?: {
        fontSize: number;
        isBold: boolean;
        isItalic: boolean;
    };
}

const CHALK_COLORS = [
    '#ffffff', // white
    '#f5c431', // yellow
    '#f59331', // orange
    '#f55031', // red
    '#31f550', // green
    '#31f5f5', // cyan
    '#3165f5', // blue
    '#9e31f5', // purple
];

// Generate a simple unique ID
function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}

// Check if point is inside rectangle
function isPointInRect(x: number, y: number, rect: Extract<Shape, {type: "rect"}>): boolean {
    return x >= rect.x && x <= rect.x + rect.width && 
           y >= rect.y && y <= rect.y + rect.height;
}

// Check if point is inside circle
function isPointInCircle(x: number, y: number, circle: Extract<Shape, {type: "circle"}>): boolean {
    const radiusX = Math.abs(circle.clientx - circle.startx) * 0.5;
    const radiusY = Math.abs(circle.clienty - circle.starty) * 0.5;
    const centerX = circle.startx + (circle.clientx - circle.startx) * 0.5;
    const centerY = circle.starty + (circle.clienty - circle.starty) * 0.5;
    
    // Calculate normalized distance
    const dx = (x - centerX) / radiusX;
    const dy = (y - centerY) / radiusY;
    return (dx * dx + dy * dy) <= 1;
}

// Check if point is inside pencil shape (approximation using bounding box of points)
function isPointInPencil(x: number, y: number, pencil: Extract<Shape, {type: "pencil"}>): boolean {
    if (pencil.points.length < 2) return false;
    
    // Find bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pencil.points.forEach(point => {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
    });
    
    // Add some padding for easier selection
    const padding = 5;
    return x >= minX - padding && x <= maxX + padding && 
           y >= minY - padding && y <= maxY + padding;
}

// Check if point is inside text
function isPointInText(x: number, y: number, text: Extract<Shape, {type: "text"}>): boolean {
    // Approximate text area (could be improved with actual text measurements)
    const lineHeight = 20;
    const lines = text.content.split('\n');
    const height = lines.length * lineHeight;
    const width = Math.max(...lines.map(line => line.length * 10)); // rough estimate
    
    return x >= text.x && x <= text.x + width && 
           y >= text.y && y <= text.y + height;
}

export async function initDraw(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket, userId: string, type: string, selectedColor: string = CHALK_COLORS[0]): Promise<() => void> {
    let isDrawing = false;
    let isDragging = false;
    let currentShape: Shape | null = null;
    let selectedShape: Shape | null = null;
    let oldSelectedShape: Shape | null = null; // Store original state for deletion
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let ctx = canvas.getContext("2d");
    if (!ctx) return () => {}; // Return empty cleanup function if no context

    // Initialize RoughJS
    const roughCanvas = rough.canvas(canvas);
    
    // Set up drawing style
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;
    ctx.font = '16px sans-serif';
    
    let existingShapes: Shape[] = await getExistingShapes(roomId);
    clearCanvas(existingShapes, canvas, ctx, roughCanvas, selectedShape);

    // Store message handler reference so we can remove it later
    const handleSocketMessage = (e: MessageEvent) => {
        const message = JSON.parse(e.data);
        if (message.type === "chat") {
            const parsedShape = JSON.parse(message.message);
            
            // Check if this is an update to an existing shape
            const existingIndex = existingShapes.findIndex(s => s.id === parsedShape.id);
            if (existingIndex >= 0) {
                existingShapes[existingIndex] = parsedShape;
            } else {
                existingShapes.push(parsedShape);
            }
            
            clearCanvas(existingShapes, canvas, ctx, roughCanvas, selectedShape);
        } else if (message.type === "delete_chat") {
            try {
                const deletedShape = JSON.parse(message.message);
                existingShapes = existingShapes.filter(s => s.id !== deletedShape.id);
                
                // If the deleted shape was selected, deselect it
                if (selectedShape && selectedShape.id === deletedShape.id) {
                    selectedShape = null;
                }
                
                clearCanvas(existingShapes, canvas, ctx, roughCanvas, selectedShape);
            } catch (err) {
                console.error("Error parsing deleted shape:", err);
            }
        }
    };

    // Add the message handler
    socket.addEventListener("message", handleSocketMessage);

    // Define event handler functions
    const handleMouseDown = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if we're clicking on an existing shape
        if (type === "select") {
            let found = false;
            // Iterate in reverse to select the topmost shape first
            for (let i = existingShapes.length - 1; i >= 0; i--) {
                const shape = existingShapes[i];
                if (isPointInShape(x, y, shape)) {
                    selectedShape = shape;
                    // Store original shape for deletion
                    oldSelectedShape = JSON.parse(JSON.stringify(shape));
                    isDragging = true;
                    found = true;
                    
                    // Calculate drag offset
                    if (shape.type === "rect") {
                        dragOffsetX = x - shape.x;
                        dragOffsetY = y - shape.y;
                    } else if (shape.type === "circle") {
                        const centerX = shape.startx + (shape.clientx - shape.startx) * 0.5;
                        const centerY = shape.starty + (shape.clienty - shape.starty) * 0.5;
                        dragOffsetX = x - centerX;
                        dragOffsetY = y - centerY;
                    } else if (shape.type === "pencil") {
                        // Find bounding box center for pencil
                        let minX = Infinity, minY = Infinity;
                        shape.points.forEach(point => {
                            minX = Math.min(minX, point.x);
                            minY = Math.min(minY, point.y);
                        });
                        dragOffsetX = x - minX;
                        dragOffsetY = y - minY;
                    } else if (shape.type === "text") {
                        dragOffsetX = x - shape.x;
                        dragOffsetY = y - shape.y;
                    }
                    
                    // Redraw with selected shape
                    clearCanvas(existingShapes, canvas, ctx, roughCanvas, selectedShape);
                    break;
                }
            }
            
            if (!found) {
                selectedShape = null;
                oldSelectedShape = null;
                clearCanvas(existingShapes, canvas, ctx, roughCanvas, null);
            }
            return;
        }
        
        // If not in select mode, start drawing
        isDrawing = true;
        
        switch (type) {
            case "pencil":
                currentShape = {
                    type: "pencil",
                    points: [{x, y}],
                    color: selectedColor,
                    id: generateId()
                };
                break;
            case "rect":
                currentShape = {
                    type: "rect",
                    x,
                    y,
                    width: 0,
                    height: 0,
                    color: selectedColor,
                    id: generateId()
                };
                break;
            case "circle":
                currentShape = {
                    type: "circle",
                    startx: x,
                    starty: y,
                    clientx: x,
                    clienty: y,
                    color: selectedColor,
                    id: generateId()
                };
                break;
            case "text":
                // Text handling is done in the React component
                break;
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (isDragging && selectedShape) {
            // Move the selected shape
            if (selectedShape.type === "rect") {
                selectedShape.x = x - dragOffsetX;
                selectedShape.y = y - dragOffsetY;
            } else if (selectedShape.type === "circle") {
                const dx = selectedShape.clientx - selectedShape.startx;
                const dy = selectedShape.clienty - selectedShape.starty;
                selectedShape.startx = x - dragOffsetX - dx/2;
                selectedShape.starty = y - dragOffsetY - dy/2;
                selectedShape.clientx = selectedShape.startx + dx;
                selectedShape.clienty = selectedShape.starty + dy;
            } else if (selectedShape.type === "pencil") {
                // Find current bounding box for pencil
                let minX = Infinity, minY = Infinity;
                selectedShape.points.forEach(point => {
                    minX = Math.min(minX, point.x);
                    minY = Math.min(minY, point.y);
                });
                
                // Calculate translation
                const dx = (x - dragOffsetX) - minX;
                const dy = (y - dragOffsetY) - minY;
                
                // Move all points
                selectedShape.points = selectedShape.points.map(point => ({
                    x: point.x + dx,
                    y: point.y + dy
                }));
            } else if (selectedShape.type === "text") {
                selectedShape.x = x - dragOffsetX;
                selectedShape.y = y - dragOffsetY;
            }
            
            clearCanvas(existingShapes, canvas, ctx, roughCanvas, selectedShape);
            return;
        }
        
        if (!isDrawing || !ctx || !currentShape) return;

        switch (currentShape.type) {
            case "pencil":
                currentShape.points.push({x, y});
                break;
            case "rect":
                currentShape.width = x - currentShape.x;
                currentShape.height = y - currentShape.y;
                break;
            case "circle":
                currentShape.clientx = x;
                currentShape.clienty = y;
                break;
        }

        clearCanvas(existingShapes, canvas, ctx, roughCanvas, selectedShape);
        drawShape(currentShape, ctx, roughCanvas);
    };

    const handleMouseUp = () => {
        if (isDragging && selectedShape && oldSelectedShape) {
            isDragging = false;
            
            // Delete old shape position first
            socket.send(JSON.stringify({
                type: "delete_chat",
                message: JSON.stringify(oldSelectedShape),
                roomId,
                userId
            }));
            
            // Send updated shape to server
            socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify(selectedShape),
                roomId,
                userId
            }));
            
            // Update the oldSelectedShape to match current position
            oldSelectedShape = JSON.parse(JSON.stringify(selectedShape));
            return;
        }
        
        if (!currentShape || !isDrawing || currentShape.type !== type) return;
        
        isDrawing = false;
        existingShapes.push(currentShape);
        
        socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify(currentShape),
            roomId,
            userId
        }));
        
        currentShape = null;
    };

    const handleMouseLeave = () => {
        isDrawing = false;
        isDragging = false;
        currentShape = null;
    };
    
    // Add event listeners
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    
    // Add event listener for delete key
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Delete" && selectedShape) {
            // Remove from existing shapes
            existingShapes = existingShapes.filter(s => s.id !== selectedShape?.id);
            
            // Send delete message to server
            socket.send(JSON.stringify({
                type: "delete_chat",
                message: JSON.stringify(selectedShape),
                roomId,
                userId
            }));
            
            // Clear selection and redraw
            selectedShape = null;
            oldSelectedShape = null;
            clearCanvas(existingShapes, canvas, ctx, roughCanvas, null);
        }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    
    // Helper function to check if point is inside any shape
    function isPointInShape(x: number, y: number, shape: Shape): boolean {
        switch (shape.type) {
            case "rect":
                return isPointInRect(x, y, shape);
            case "circle":
                return isPointInCircle(x, y, shape);
            case "pencil":
                return isPointInPencil(x, y, shape);
            case "text":
                return isPointInText(x, y, shape);
            default:
                return false;
        }
    }
    
    // Return the cleanup function
    return () => {
        canvas.removeEventListener("mousedown", handleMouseDown);
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseup", handleMouseUp);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
        document.removeEventListener("keydown", handleKeyDown);
        socket.removeEventListener("message", handleSocketMessage);
    };
}

export function clearCanvas(
    existingShapes: Shape[], 
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    roughCanvas: RoughCanvas,
    selectedShape: Shape | null
) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all shapes
    existingShapes.forEach(shape => {
        // Skip selected shape - we'll draw it last
        if (selectedShape && shape.id === selectedShape.id) return;
        drawShape(shape, ctx, roughCanvas);
    });
    
    // Draw selected shape last (so it appears on top)
    if (selectedShape) {
        // Draw selection indicator
        drawSelectionIndicator(selectedShape, ctx);
        drawShape(selectedShape, ctx, roughCanvas);
    }
}

function drawSelectionIndicator(shape: Shape, ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.strokeStyle = '#00ff00'; // Green selection indicator
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]); // Dashed line
    
    if (shape.type === "rect") {
        ctx.strokeRect(
            shape.x - 5, 
            shape.y - 5, 
            shape.width + 10, 
            shape.height + 10
        );
    } else if (shape.type === "circle") {
        const radiusX = Math.abs(shape.clientx - shape.startx) * 0.5;
        const radiusY = Math.abs(shape.clienty - shape.starty) * 0.5;
        const centerX = shape.startx + (shape.clientx - shape.startx) * 0.5;
        const centerY = shape.starty + (shape.clienty - shape.starty) * 0.5;
        
        ctx.beginPath();
        ctx.ellipse(
            centerX, 
            centerY, 
            radiusX + 5, 
            radiusY + 5, 
            0, 0, Math.PI * 2
        );
        ctx.stroke();
    } else if (shape.type === "pencil") {
        if (shape.points.length < 2) return;
        
        // Find bounding box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        shape.points.forEach(point => {
            minX = Math.min(minX, point.x);
            minY = Math.min(minY, point.y);
            maxX = Math.max(maxX, point.x);
            maxY = Math.max(maxY, point.y);
        });
        
        ctx.strokeRect(
            minX - 5, 
            minY - 5, 
            maxX - minX + 10, 
            maxY - minY + 10
        );
    } else if (shape.type === "text") {
        const lineHeight = 20;
        const lines = shape.content.split('\n');
        const height = lines.length * lineHeight;
        const width = Math.max(...lines.map(line => line.length * 10)); // rough estimate
        
        ctx.strokeRect(
            shape.x - 5,
            shape.y - 5,
            width + 10,
            height + 10
        );
    }
    
    ctx.restore();
}

async function getExistingShapes(roomId: string): Promise<Shape[]> {
    const response = await axios.get(`${BACKEND_URL}/chats/${roomId}`);
    const messages = response.data.messages;
    return messages.map((x: {message: string}) => {
        try {
            const shape = JSON.parse(x.message);
            // Ensure each shape has an ID
            if (!shape.id) {
                shape.id = generateId();
            }
            return shape;
        } catch (err) {
            console.error("Error parsing shape:", err);
            return null;
        }
    }).filter((shape: Shape | null) => shape !== null);
}

function drawShape(shape: Shape, ctx: CanvasRenderingContext2D, roughCanvas: RoughCanvas) {
    const options = {
        roughness: 1.5,
        stroke: shape.color || '#ffffff',
        strokeWidth: 2,
        bowing: 2,
        seed: 1
    };

    switch (shape.type) {
        case "rect":
            drawRectangle(shape, roughCanvas, options);
            break;
        case "circle":
            drawEllipse(shape, roughCanvas, options);
            break;
        case "pencil":
            drawPencil(shape, ctx, options);
            break;
        case "text":
            drawText(shape, ctx);
            break;
    }
}

function drawRectangle(shape: Extract<Shape, {type: "rect"}>, roughCanvas: RoughCanvas, options: any) {
    roughCanvas.rectangle(
        shape.x,
        shape.y,
        shape.width,
        shape.height,
        options
    );
}

function drawEllipse(shape: Extract<Shape, {type: "circle"}>, roughCanvas: RoughCanvas, options: any) {
    const radiusX = Math.abs(shape.clientx - shape.startx) * 0.5;
    const radiusY = Math.abs(shape.clienty - shape.starty) * 0.5;
    const centerX = shape.startx + (shape.clientx - shape.startx) * 0.5;
    const centerY = shape.starty + (shape.clienty - shape.starty) * 0.5;
    
    roughCanvas.ellipse(
        centerX,
        centerY,
        radiusX * 2,
        radiusY * 2,
        options
    );
}

function drawPencil(shape: Extract<Shape, {type: "pencil"}>, ctx: CanvasRenderingContext2D, options: any) {
    if (shape.points.length < 2) return;

    ctx.save();
    ctx.strokeStyle = options.stroke;
    ctx.lineWidth = options.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Add some roughness to the line
    ctx.beginPath();
    ctx.moveTo(shape.points[0].x, shape.points[0].y);
    
    for (let i = 1; i < shape.points.length; i++) {
        const point = shape.points[i];
        const prevPoint = shape.points[i - 1];
        
        // Add slight random offset to create roughness
        const offsetX = (Math.random() - 0.5) * 0.5;
        const offsetY = (Math.random() - 0.5) * 0.5;
        
        // Create control points for quadratic curve
        const cp1x = prevPoint.x + offsetX;
        const cp1y = prevPoint.y + offsetY;
        
        ctx.quadraticCurveTo(cp1x, cp1y, point.x, point.y);
    }
    
    ctx.stroke();
    ctx.restore();
}

function drawText(shape: Extract<Shape, {type: "text"}>, ctx: CanvasRenderingContext2D) {
    ctx.save();
    
    // Apply text styles
    const style = shape.style || { fontSize: 16, isBold: false, isItalic: false };
    const fontWeight = style.isBold ? 'bold' : 'normal';
    const fontStyle = style.isItalic ? 'italic' : 'normal';
    ctx.font = `${fontStyle} ${fontWeight} ${style.fontSize}px sans-serif`;
    
    ctx.fillStyle = shape.color || '#ffffff';
    ctx.textBaseline = 'top';
    
    // Split text into lines and draw each line
    const lines = shape.content.split('\n');
    const lineHeight = style.fontSize * 1.2; // Add some line spacing
    
    lines.forEach((line, index) => {
        ctx.fillText(line, shape.x, shape.y + (index * lineHeight));
    });
    
    ctx.restore();
}


export default {
    initDraw,
    clearCanvas,
    CHALK_COLORS,
};