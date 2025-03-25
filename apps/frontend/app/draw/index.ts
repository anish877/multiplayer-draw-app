import axios from "axios";
import { BACKEND_URL } from "../config";
import rough from 'roughjs';
import { RoughCanvas } from "roughjs/bin/canvas";

// Define a more specific type for drawing options
interface DrawingOptions {
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    fillStyle?: 'solid' | 'hachure' | 'cross-hatch' | 'zigzag' | 'dots';
    roughness?: number;
    bowing?: number;
}

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
    iseditable: boolean;
    userId: string;
} | {
    type: "circle";
    startx: number;
    starty: number;
    clientx: number;
    clienty: number;
    color?: string;
    id?: string;
    iseditable: boolean;
    userId: string
} | {
    type: "pencil";
    points: Point[];
    color?: string;
    id?: string;
    iseditable: boolean;
    userId: string
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
    iseditable: boolean;
    userId: string
} | {
    type: "image";
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
    src: string;
    id?: string;
    iseditable: boolean;
    userId: string
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

// Add these to your state variables
let showingUserId: Shape | null = null; // Will store the shape we're showing the userId for
let userIdTimeout: string | number | NodeJS.Timeout | null | undefined = null; // For clearing the timeout when needed

// Add isPointInImage function for selection
function isPointInImage(x: number, y: number, image: Extract<Shape, {type: "image"}>): boolean {
    return x >= image.x && x <= image.x + image.width && 
           y >= image.y && y <= image.y + image.height;
}

// Generate a simple unique ID
function generateId(): string {
    // Fixed: Return the actual value instead of concatenating functions
    return Math.random().toString(36).substring(2, 9) + Date.now().toString();
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

function isPointInShape(x: number, y: number, shape: Shape): { isInside: boolean, isEditable: boolean } {
    console.log(shape);
    
    let isInside = false;
    
    switch (shape.type) {
        case "rect":
            isInside = isPointInRect(x, y, shape);
            break;
        case "circle":
            isInside = isPointInCircle(x, y, shape);
            break;
        case "pencil":
            isInside = isPointInPencil(x, y, shape);
            break;
        case "text":
            isInside = isPointInText(x, y, shape);
            break;
        case "image":
            isInside = isPointInImage(x, y, shape);
            break;
        default:
            isInside = false;
    }
    
    return { 
        isInside: isInside,
        isEditable: shape.iseditable 
    };
}

export async function initDraw(
canvas: HTMLCanvasElement, roomId: string, socket: WebSocket, userId: string, type: string, selectedColor: string = CHALK_COLORS[0], _p0: (id: string) => void, _p1: () => void, username: string): Promise<() => void> {
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
    
    let existingShapes: Shape[] = await getExistingShapes(roomId, userId);
    clearCanvasAndDrawAll(existingShapes, canvas, ctx, roughCanvas, selectedShape, currentShape);

    // Store message handler reference so we can remove it later
    // Update handleSocketMessage to properly parse and handle messages
    const handleSocketMessage = (e: MessageEvent) => {
        try {
            const message = JSON.parse(e.data);
            
            if (message.type === "chat" || message.type === "image_element") {
                // Fixed: Proper parsing of messages
                let parsedShape: Shape;
                
                if (message.type === "chat") {
                    try {
                        parsedShape = JSON.parse(message.message);
                    } catch (err) {
                        console.error("Error parsing chat message:", err);
                        return;
                    }
                } else {
                    try {
                        parsedShape = JSON.parse(message.message);
                    } catch (err) {
                        console.error("Error parsing image element:", err);
                        return;
                    }
                }
                
                // Check if this is an update to an existing shape
                const existingIndex = existingShapes.findIndex(s => s.id === parsedShape.id);
                if (existingIndex >= 0) {
                    existingShapes[existingIndex] = parsedShape;
                } else {
                    // Fixed: Set iseditable properly
                    if (message.userId === userId) {
                        parsedShape.iseditable = true;
                    } else {
                        parsedShape.iseditable = false;
                    }
                    existingShapes.push(parsedShape);
                }
                
                clearCanvasAndDrawAll(existingShapes, canvas, ctx, roughCanvas, selectedShape, currentShape);
            } else if (message.type === "delete_chat") {
                try {
                    // Fixed: Proper parsing of deleted shape
                    const deletedShape = JSON.parse(message.message);
                    
                    // Find and remove the shape with matching ID
                    existingShapes = existingShapes.filter(s => s.id !== deletedShape.id);
                    
                    // If the deleted shape was selected, deselect it
                    if (selectedShape && selectedShape.id === deletedShape.id) {
                        selectedShape = null;
                        oldSelectedShape = null;
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
    
        // Clear any existing userId display timeout
        if (userIdTimeout) {
            clearTimeout(userIdTimeout);
            userIdTimeout = null;
        }
        showingUserId = null;
    
        // Check if we're clicking on an existing shape, but only in select mode
        if (type === "select") {
            let found = false;
            // Iterate in reverse to select the topmost shape first
            for (let i = existingShapes.length - 1; i >= 0; i--) {
                const shape = existingShapes[i];
                const result = isPointInShape(x, y, shape);
                
                if (result.isInside) {
                    found = true;
                    
                    if (result.isEditable) {
                        // Handle editable shape (existing code)
                        selectedShape = shape;
                        // Store original shape for deletion
                        oldSelectedShape = JSON.parse(JSON.stringify(shape));
                        isDragging = true;
                        
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
                    } else {
                        // Show userId for non-editable shape directly on canvas
                        selectedShape = null;
                        oldSelectedShape = null;
                        isDragging = false;
                        
                        // Display userId on the shape
                        if (shape.userId) {
                            showingUserId = shape;
                            
                            // Set a timeout to hide the userId after a few seconds
                            userIdTimeout = setTimeout(() => {
                                showingUserId = null;
                                clearCanvasAndDrawAll(existingShapes, canvas, ctx, roughCanvas, selectedShape, currentShape);
                            }, 3000); // Show for 3 seconds
                        }
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
                    id: generateId(),
                    iseditable: true,
                    userId: username
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
                    id: generateId(),
                    iseditable: true,
                    userId: username
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
                    id: generateId(),
                    iseditable: true,
                    userId: username
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
                    },
                    iseditable: true,
                    userId: username
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
        // Fixed: Check if we have a selected shape and ensure it's editable
        if ((e.key === "Delete" || e.key === "Backspace") && selectedShape && selectedShape.iseditable) {
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

// New modified function that includes drawing userId text
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
    
    // Draw userId if we are showing it
    if (showingUserId) {
        drawUserId(showingUserId, ctx);
    }
}

// Function to draw the userId on the shape
function drawUserId(shape: Shape, ctx: CanvasRenderingContext2D) {
  // Save context for restoring later
  ctx.save();
  
  // Calculate position for the userId text
  let textX, textY;
  switch (shape.type) {
    case "rect":
    case "image":
      textX = shape.x + (shape.width / 2);
      textY = shape.y + (shape.height / 2);
      break;
    case "circle":
      // For circle, find center point
      const radiusX = Math.abs(shape.clientx - shape.startx) / 2;
      const radiusY = Math.abs(shape.clienty - shape.starty) / 2;
      textX = shape.startx + (shape.clientx - shape.startx > 0 ? radiusX : -radiusX);
      textY = shape.starty + (shape.clienty - shape.starty > 0 ? radiusY : -radiusY);
      break;
    case "pencil":
      // For pencil, find center point of all points
      let sumX = 0, sumY = 0;
      shape.points.forEach((point: { x: number; y: number; }) => {
        sumX += point.x;
        sumY += point.y;
      });
      textX = sumX / shape.points.length;
      textY = sumY / shape.points.length;
      break;
    case "text":
      textX = shape.x + (ctx.measureText(shape.content).width / 2);
      textY = shape.y;
      break;
    default:
      textX = 0;
      textY = 0;
  }
  
  // Ensure coordinates are integers for crisp rendering
  textX = Math.round(textX);
  textY = Math.round(textY);
  
  // Format the user ID
  const userId = `@${shape.userId}`;
  
  // Set text styling with a more modern font stack
  ctx.font = "500 14px 'SF Pro Display', 'Inter', system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  
  // Calculate text dimensions
  const textMetrics = ctx.measureText(userId);
  const textWidth = textMetrics.width;
  const textHeight = 14; // Approximate height based on font size
  
  // Define modern styling with reduced padding for a sleeker look
  const paddingX = 12;
  const paddingY = 8;
  
  // Calculate rectangle dimensions and position
  const rectWidth = textWidth + (paddingX * 2);
  const rectHeight = textHeight + (paddingY * 2);
  const rectX = textX - (rectWidth / 2);
  const rectY = textY - (rectHeight / 2);
  
  // Generate a vibrant but dark color suitable for a blackish canvas
  // Using HSL for better control over luminosity
  const hue = Math.floor(Math.random() * 360); // Random hue (0-359)
  const saturation = 70 + Math.floor(Math.random() * 30); // High saturation (70-99%)
  const lightness = 40 + Math.floor(Math.random() * 15); // Medium-low lightness (40-54%)
  const badgeColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  
  // Add subtle glow effect instead of shadow
  ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness + 20}%, 0.4)`;
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // Draw pill-shaped badge (fully rounded rectangle)
  ctx.beginPath();
  const arcRadius = rectHeight / 2; // Make it pill-shaped
  
  // Draw the pill shape
  ctx.moveTo(rectX + arcRadius, rectY);
  ctx.lineTo(rectX + rectWidth - arcRadius, rectY);
  ctx.arcTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + arcRadius, arcRadius);
  ctx.lineTo(rectX + rectWidth, rectY + rectHeight - arcRadius);
  ctx.arcTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - arcRadius, rectY + rectHeight, arcRadius);
  ctx.lineTo(rectX + arcRadius, rectY + rectHeight);
  ctx.arcTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - arcRadius, arcRadius);
  ctx.lineTo(rectX, rectY + arcRadius);
  ctx.arcTo(rectX, rectY, rectX + arcRadius, rectY, arcRadius);
  ctx.closePath();
  
  // Add gradient fill for a more modern look
  const gradient = ctx.createLinearGradient(rectX, rectY, rectX, rectY + rectHeight);
  gradient.addColorStop(0, badgeColor);
  gradient.addColorStop(1, `hsl(${(hue + 20) % 360}, ${saturation}%, ${Math.max(25, lightness - 15)}%)`);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Add subtle inner border
  ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness + 15}%, 0.6)`;
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Reset shadow settings before drawing text
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // Draw text in white with subtle text shadow for better readability
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;
  ctx.fillText(userId, textX, textY);
  
  // Restore context
  ctx.restore();
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

async function getExistingShapes(roomId: string, userId: string): Promise<Shape[]> {
    try {
        const response = await axios.get(`${BACKEND_URL}/chats/${roomId}`);
        const messages = response.data.messages;
        
        if (!Array.isArray(messages)) {
            console.error("Expected messages to be an array:", messages);
            return [];
        }
        
        return messages
            .filter((x: {message:string}) => x && typeof x.message === 'string')
            .map((x: {message: string, userId: string}) => {
                try {
                    // Fixed: Better error handling for parsing
                    let shape: Shape;
                    try {
                        shape = JSON.parse(x.message);
                    } catch (err) {
                        console.error("Failed to parse shape:", x.message,err);
                        return null;
                    }
                    
                    // Set editable flag based on ownership
                    if(x.userId === userId) {
                        shape.iseditable = true;
                    } else {
                        shape.iseditable = false;
                    }
                    
                    // Ensure each shape has an ID
                    if (!shape.id) {
                        shape.id = generateId();
                    }
                    
                    // Validate shape type
                    if (!['rect', 'circle', 'pencil', 'text', 'image'].includes(shape.type)) {
                        return null;
                    }
                    
                    return shape;
                } catch (err) {
                    console.error("Error processing shape:", err);
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

function drawRectangle(shape: Extract<Shape, {type: "rect"}>, roughCanvas: RoughCanvas, options: DrawingOptions) {
    // Ensure width and height are positive (for proper rendering)
    const x = shape.width < 0 ? shape.x + shape.width : shape.x;
    const y = shape.height < 0 ? shape.y + shape.height : shape.y;
    const width = Math.abs(shape.width);
    const height = Math.abs(shape.height);
    
    roughCanvas.rectangle(x, y, width, height, options);
}

function drawEllipse(shape: Extract<Shape, {type: "circle"}>, roughCanvas: RoughCanvas, options: DrawingOptions) {
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

function drawPencil(shape: Extract<Shape, {type: "pencil"}>, ctx: CanvasRenderingContext2D, options: DrawingOptions) {
    if (shape.points.length < 2) return;

    ctx.save();
    ctx.strokeStyle = options.stroke || '';
    ctx.lineWidth = options.strokeWidth || 0;
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