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
    id?: string;
} | {
    type: "circle";
    startx: number;
    starty: number;
    clientx: number;
    clienty: number;
    color?: string;
    id?: string;
} | {
    type: "pencil";
    points: Point[];
    color?: string;
    id?: string;
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
} | {
    type: "image";
    x: number;
    y: number;
    width: number;
    height: number;
    src: string;
    id?: string;
};

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

// Add isPointInImage function for selection
function isPointInImage(x: number, y: number, image: Extract<Shape, {type: "image"}>): boolean {
    return x >= image.x && x <= image.x + image.width && 
           y >= image.y && y <= image.y + image.height;
}

// Generate a simple unique ID
function generateId(): string {
    return Math.random().toString(36).substring(2, 9)+Date.now().toString;
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
    // Approximate text area based on content and font size
    const style = text.style || { fontSize: 16, isBold: false, isItalic: false };
    const lineHeight = style.fontSize * 1.2;
    const lines = text.content.split('\n');
    const height = lines.length * lineHeight;
    const width = Math.max(...lines.map(line => line.length * (style.fontSize * 0.6))); // better estimate
    
    return x >= text.x && x <= text.x + width && 
           y >= text.y && y <= text.y + height;
}

function drawImage(shape: Extract<Shape, {type: "image"}>, ctx: CanvasRenderingContext2D) {
    // Create a new image element
    const img = new Image();
    
    // Set the image source to trigger loading
    img.src = shape.src;
    
    // Set a onload handler to draw the image once it's loaded
    img.onload = () => {
        ctx.drawImage(img, shape.x, shape.y, shape.width, shape.height);
    };
    
    // Handle potential errors
    img.onerror = () => {
        console.error('Error loading image');
        // Draw a placeholder with an error message
        ctx.save();
        ctx.fillStyle = '#ff6666';
        ctx.fillRect(shape.x, shape.y, shape.width, shape.height);
        ctx.fillStyle = '#000000';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Image Load Error', shape.x + shape.width/2, shape.y + shape.height/2);
        ctx.restore();
    };
}

// Update the isPointInShape function to include image type
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
        case "image":
            return isPointInImage(x, y, shape);
        default:
            return false;
    }
}

export async function initDraw(
    canvas: HTMLCanvasElement, 
    roomId: string, 
    socket: WebSocket, 
    userId: string, 
    type: string, 
    selectedColor: string = CHALK_COLORS[0]
): Promise<() => void> {
    let isDrawing = false;
    let isDragging = false;
    let currentShape: Shape | null = null;
    let selectedShape: Shape | null = null;
    let oldSelectedShape: Shape | null = null; // Store original state for deletion
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return () => {}; // Return empty cleanup function if no context

    // Initialize RoughJS
    const roughCanvas = rough.canvas(canvas);
    
    // Set up drawing style
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;
    ctx.font = '16px sans-serif';
    
    let existingShapes: Shape[] = await getExistingShapes(roomId);
    clearCanvasAndDrawAll(existingShapes, canvas, ctx, roughCanvas, selectedShape, currentShape);

    // Store message handler reference so we can remove it later
    // Update handleSocketMessage in initDraw to handle image_element messages
const handleSocketMessage = (e: MessageEvent) => {
    try {
        const message = JSON.parse(e.data);
        
        if (message.type === "chat" || message.type === "image_element") {
            const parsedMessage = message.type === "chat" ? message.message : JSON.stringify(JSON.parse(message.message));
            const parsedShape = JSON.parse(parsedMessage);
            
            // Check if this is an update to an existing shape
            const existingIndex = existingShapes.findIndex(s => s.id === parsedShape.id);
            if (existingIndex >= 0) {
                existingShapes[existingIndex] = parsedShape;
            } else {
                existingShapes.push(parsedShape);
            }
            
            clearCanvasAndDrawAll(existingShapes, canvas, ctx, roughCanvas, selectedShape, currentShape);
        } else if (message.type === "delete_chat") {
            try {
                const deletedShape = JSON.parse(message.message);
                existingShapes = existingShapes.filter(s => s.id !== deletedShape.id);
                
                // If the deleted shape was selected, deselect it
                if (selectedShape && selectedShape.id === deletedShape.id) {
                    selectedShape = null;
                }
                
                clearCanvasAndDrawAll(existingShapes, canvas, ctx, roughCanvas, selectedShape, currentShape);
            } catch (err) {
                console.error("Error parsing deleted shape:", err);
            }
        }
    } catch (err) {
        console.error("Error processing message:", err);
    }
};

    // Add the message handler
    socket.addEventListener("message", handleSocketMessage);

    // Define event handler functions
    const handleMouseDown = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if we're clicking on an existing shape, but only in select mode
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
                if (shape.type === "rect" || shape.type === "image") {
                    dragOffsetX = x - shape.x;
                    dragOffsetY = y - shape.y;
                } else if (shape.type === "circle") {
                    const centerX = shape.startx + (shape.clientx - shape.startx) * 0.5;
                    const centerY = shape.starty + (shape.clienty - shape.starty) * 0.5;
                    dragOffsetX = x - centerX;
                    dragOffsetY = y - centerY;
                } else if (shape.type === "pencil") {
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
                
                clearCanvasAndDrawAll(existingShapes, canvas, ctx, roughCanvas, selectedShape, currentShape);
                break;
            }
        }
        
        if (!found) {
            selectedShape = null;
            oldSelectedShape = null;
            clearCanvasAndDrawAll(existingShapes, canvas, ctx, roughCanvas, null, currentShape);
        }
        return;
        }
        
        // If not in select mode, start drawing
        isDrawing = true;
        selectedShape = null; // Clear any selection when starting to draw
        oldSelectedShape = null;
        
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
                currentShape = {
                    type: "text",
                    x,
                    y,
                    content: "",
                    color: selectedColor,
                    id: generateId(),
                    style: {
                        fontSize: 16,
                        isBold: false,
                        isItalic: false
                    }
                };
                
                // Show a prompt to enter text
                const textContent = prompt("Enter text:", "");
                if (textContent !== null) {
                    currentShape.content = textContent;
                    existingShapes.push(currentShape);
                    
                    socket.send(JSON.stringify({
                        type: "chat",
                        message: JSON.stringify(currentShape),
                        roomId,
                        userId
                    }));
                }
                currentShape = null;
                isDrawing = false;
                break;
        }
        
        // Draw the initial state of the current shape
        if (currentShape) {
            clearCanvasAndDrawAll(existingShapes, canvas, ctx, roughCanvas, selectedShape, currentShape);
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
    
        // Only allow dragging in select mode
        if (isDragging && selectedShape && type === "select") {
            // Move the selected shape
            if (selectedShape.type === "rect" || selectedShape.type === "image" || selectedShape.type === "text") {
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
                let minX = Infinity, minY = Infinity;
                selectedShape.points.forEach(point => {
                    minX = Math.min(minX, point.x);
                    minY = Math.min(minY, point.y);
                });
                
                const dx = (x - dragOffsetX) - minX;
                const dy = (y - dragOffsetY) - minY;
                
                selectedShape.points = selectedShape.points.map(point => ({
                    x: point.x + dx,
                    y: point.y + dy
                }));
            }
            
            clearCanvasAndDrawAll(existingShapes, canvas, ctx, roughCanvas, selectedShape, currentShape);
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
    
        clearCanvasAndDrawAll(existingShapes, canvas, ctx, roughCanvas, selectedShape, currentShape);
    };
    
    const handleMouseUp = () => {
        // Only handle shape movement in select mode
        if (isDragging && selectedShape && oldSelectedShape && type === "select") {
            isDragging = false;
            
            // Don't send updates if nothing changed
            if (JSON.stringify(selectedShape) === JSON.stringify(oldSelectedShape)) {
                return;
            }
            
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
            
            oldSelectedShape = JSON.parse(JSON.stringify(selectedShape));
            return;
        }
        
        if (!currentShape || !isDrawing) return;
        
        // Ensure we're only saving shapes with actual content
        if (currentShape.type === "pencil" && currentShape.points.length <= 1) {
            isDrawing = false;
            currentShape = null;
            clearCanvasAndDrawAll(existingShapes, canvas, ctx, roughCanvas, selectedShape, null);
            return;
        }
        
        if (currentShape.type === "rect" && 
           (Math.abs(currentShape.width) < 3 || Math.abs(currentShape.height) < 3)) {
            isDrawing = false;
            currentShape = null;
            clearCanvasAndDrawAll(existingShapes, canvas, ctx, roughCanvas, selectedShape, null);
            return;
        }
        
        if (currentShape.type === "circle" && 
           (Math.abs(currentShape.clientx - currentShape.startx) < 3 || 
            Math.abs(currentShape.clienty - currentShape.starty) < 3)) {
            isDrawing = false;
            currentShape = null;
            clearCanvasAndDrawAll(existingShapes, canvas, ctx, roughCanvas, selectedShape, null);
            return;
        }
        
        isDrawing = false;
        existingShapes.push(currentShape);
        
        socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify(currentShape),
            roomId,
            userId
        }));
        
        const completedShape = currentShape;
        currentShape = null;
        clearCanvasAndDrawAll(existingShapes, canvas, ctx, roughCanvas, selectedShape, null);
    };

    const handleMouseLeave = () => {
        // If we're in the middle of drawing, finish the shape
        if (isDrawing && currentShape) {
            handleMouseUp();
        }
        
        isDrawing = false;
        isDragging = false;
    };
    
    // Add event listeners
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    
    // Add event listener for delete key
    const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.key === "Delete" || e.key === "Backspace") && selectedShape) {
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
            clearCanvasAndDrawAll(existingShapes, canvas, ctx, roughCanvas, null, currentShape);
            
            // Prevent default behavior (page navigation on backspace)
            if (e.key === "Backspace") {
                e.preventDefault();
            }
        }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    
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

// New function that handles both existing shapes and the current shape being drawn
export function clearCanvasAndDrawAll(
    existingShapes: Shape[], 
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    roughCanvas: RoughCanvas,
    selectedShape: Shape | null,
    currentShape: Shape | null
) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw all existing shapes
    existingShapes.forEach(shape => {
        // Skip selected shape - we'll draw it last
        if (selectedShape && shape.id === selectedShape.id) return;
        drawShape(shape, ctx, roughCanvas);
    });
    
    // Draw the current shape being created (if any)
    if (currentShape) {
        drawShape(currentShape, ctx, roughCanvas);
    }
    
    // Draw selected shape last (so it appears on top with selection indicator)
    if (selectedShape) {
        drawSelectionIndicator(selectedShape, ctx);
        drawShape(selectedShape, ctx, roughCanvas);
    }
}

// Keep the original clearCanvas for compatibility
export function clearCanvas(
    existingShapes: Shape[], 
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D, 
    roughCanvas: RoughCanvas,
    selectedShape: Shape | null
) {
    clearCanvasAndDrawAll(existingShapes, canvas, ctx, roughCanvas, selectedShape, null);
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
        const style = shape.style || { fontSize: 16, isBold: false, isItalic: false };
        const lineHeight = style.fontSize * 1.2;
        const lines = shape.content.split('\n');
        const height = lines.length * lineHeight;
        const width = Math.max(...lines.map(line => line.length * (style.fontSize * 0.6)));
        
        ctx.strokeRect(
            shape.x - 5,
            shape.y - 5,
            width + 10,
            height + 10
        );
    } else if (shape.type === "image") {
        ctx.strokeRect(
            shape.x - 5,
            shape.y - 5,
            shape.width + 10,
            shape.height + 10
        );
    }
    
    ctx.restore();
}

async function getExistingShapes(roomId: string): Promise<Shape[]> {
    try {
        const response = await axios.get(`${BACKEND_URL}/chats/${roomId}`);
        const messages = response.data.messages;
        
        if (!Array.isArray(messages)) {
            console.error("Expected messages to be an array:", messages);
            return [];
        }
        
        return messages
            .filter((x: any) => x && typeof x.message === 'string')
            .map((x: {message: string}) => {
                try {
                    const shape = JSON.parse(x.message);
                    console.log(shape)
                    // Ensure each shape has an ID
                    if (!shape.id) {
                        shape.id = generateId();
                    }
                    // Validate shape type
                    if (!['rect', 'circle', 'pencil', 'text','image'].includes(shape.type)) {
                        return null;
                    }
                    return shape;
                } catch (err) {
                    console.error("Error parsing shape:", err);
                    return null;
                }
            })
            .filter((shape: Shape | null) => shape !== null);
    } catch (err) {
        console.error("Error fetching existing shapes:", err);
        return [];
    }
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
        case "image":
            drawImage(shape, ctx);
            break;
    }
}

function drawRectangle(shape: Extract<Shape, {type: "rect"}>, roughCanvas: RoughCanvas, options: any) {
    // Ensure width and height are positive (for proper rendering)
    const x = shape.width < 0 ? shape.x + shape.width : shape.x;
    const y = shape.height < 0 ? shape.y + shape.height : shape.y;
    const width = Math.abs(shape.width);
    const height = Math.abs(shape.height);
    
    roughCanvas.rectangle(x, y, width, height, options);
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
    if (!shape.content) return;
    
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
    clearCanvasAndDrawAll,
    CHALK_COLORS,
};