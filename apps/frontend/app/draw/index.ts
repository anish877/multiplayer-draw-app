import axios from "axios"
import { BACKEND_URL } from "../config"

type Point = {
    x: number;
    y: number;
}

type Shape = {
    type: "rect",
    x: number,
    y: number,
    width: number,
    height: number,
} | {
    type: "circle",
    startx: number,
    starty: number,
    clientx: number,
    clienty: number
} | {
    type: "pencil",
    points: Point[]
}

export async function initDraw(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket, userId: string, type: string) {
    let isDrawing = false;
    let currentShape: Shape | null = null;
    let ctx = canvas.getContext("2d");
    console.log(type)
    if (!ctx) return;
    
    // Set up drawing style
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;
    
    let existingShapes: Shape[] = await getExistingShapes(roomId);
    clearCanvas(existingShapes, canvas, ctx);

    socket.onmessage = (e => {
        const message = JSON.parse(e.data);
        if (message.type === "chat") {
            const parsedShape = JSON.parse(message.message);
            existingShapes.push(parsedShape);
            clearCanvas(existingShapes, canvas, ctx);
        }
    });

    canvas.addEventListener("mousedown", (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        switch (type) {
            case "pencil":
                currentShape = {
                    type: "pencil",
                    points: [{x, y}]
                };
                break;
            case "rect":
                currentShape = {
                    type: "rect",
                    x,
                    y,
                    width: 0,
                    height: 0
                };
                break;
            case "circle":
                currentShape = {
                    type: "circle",
                    startx: x,
                    starty: y,
                    clientx: x,
                    clienty: y
                };
                break;
        }
    });

    canvas.addEventListener("mousemove", (e) => {
        if (!isDrawing || !ctx || !currentShape) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

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

        clearCanvas(existingShapes, canvas, ctx);
        drawShape(currentShape, ctx);
    });

    canvas.addEventListener("mouseup", () => {
        if (!currentShape || !isDrawing) return;
        
        isDrawing = false;
        existingShapes.push(currentShape);
        
        socket.send(JSON.stringify({
            type: "chat",
            message: JSON.stringify(currentShape),
            roomId,
            userId
        }));
        
        currentShape = null;
    });

    canvas.addEventListener("mouseleave", () => {
        isDrawing = false;
        currentShape = null;
    });
}

export function clearCanvas(existingShapes: Shape[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    existingShapes.forEach(shape => drawShape(shape, ctx));
}

async function getExistingShapes(roomId: string): Promise<Shape[]> {
    const response = await axios.get(`${BACKEND_URL}/chats/${roomId}`);
    const messages = response.data.messages;
    return messages.map((x: {message: string}) => JSON.parse(x.message));
}

function drawShape(shape: Shape, ctx: CanvasRenderingContext2D) {
    switch (shape.type) {
        case "rect":
            drawRectangle(shape, ctx);
            break;
        case "circle":
            drawEllipse(shape, ctx);
            break;
        case "pencil":
            drawPencil(shape, ctx);
            break;
    }
}

function drawRectangle(shape: Extract<Shape, {type: "rect"}>, ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
}

function drawEllipse(shape: Extract<Shape, {type: "circle"}>, ctx: CanvasRenderingContext2D) {
    const radiusX = (shape.clientx - shape.startx) * 0.5;
    const radiusY = (shape.clienty - shape.starty) * 0.5;
    const centerX = shape.startx + radiusX;
    const centerY = shape.starty + radiusY;
    const step = 0.01;
    
    ctx.beginPath();
    
    for (let angle = 0; angle < Math.PI * 2; angle += step) {
        const x = centerX + radiusX * Math.cos(angle);
        const y = centerY + radiusY * Math.sin(angle);
        
        if (angle === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.closePath();
    ctx.stroke();
}

function drawPencil(shape: Extract<Shape, {type: "pencil"}>, ctx: CanvasRenderingContext2D) {
    if (shape.points.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(shape.points[0].x, shape.points[0].y);
    
    for (let i = 1; i < shape.points.length; i++) {
        const point = shape.points[i];
        ctx.lineTo(point.x, point.y);
    }
    
    ctx.stroke();
}