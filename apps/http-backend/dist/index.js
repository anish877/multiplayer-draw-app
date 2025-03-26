"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const config_1 = require("db/config");
const config_2 = require("backend-common/config");
const authenticate_1 = require("./middleware/authenticate");
const cors_1 = __importDefault(require("cors"));
const axios_1 = __importDefault(require("axios"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: "*",
    credentials: true
}));
app.post("/signup", async (req, res) => {
    const { email, password, name } = req.body;
    if (!email || !name || !password) {
        res.status(400).json({ message: "Email, name, and password are required" });
        return;
    }
    try {
        const existingUser = await config_1.prismaClient.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(400).json({ message: "Email already registered" });
            return;
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        await config_1.prismaClient.user.create({
            data: { email, password: hashedPassword, name }
        });
        res.status(201).json({ name, email });
        return;
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating user" });
        return;
    }
});
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
    }
    try {
        const user = await config_1.prismaClient.user.findUnique({ where: { email } });
        if (!user) {
            res.status(400).json({ message: "User not found" });
            return;
        }
        const isPasswordCorrect = await bcrypt_1.default.compare(password, user.password);
        if (!isPasswordCorrect) {
            res.status(400).json({ message: "Wrong password" });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, email, name: user.name }, config_2.JWT_SECRET, { expiresIn: "1d" });
        res.cookie("uuid", token, { httpOnly: true, secure: true, sameSite: "none" });
        res.status(200).json({ email, name: user.name, token, userId: user.id });
        return;
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error logging in" });
        return;
    }
});
app.post("/create-room", authenticate_1.authenticate, async (req, res) => {
    const { name } = req.body;
    if (!name) {
        res.status(400).json({ message: "Room name is required" });
        return;
    }
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    try {
        const existingRoom = await config_1.prismaClient.room.findUnique({ where: { slug } });
        if (existingRoom) {
            res.status(400).json({ message: "Room already exists" });
            return;
        }
        await config_1.prismaClient.room.create({
            //@ts-ignore
            data: { slug, adminId: req.user.id }
        });
        res.status(201).json({ message: "Room created successfully" });
        return;
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error creating room" });
        return;
    }
});
app.get("/chats/:roomdId", async (req, res) => {
    if (!req.params.roomdId) {
        res.status(400).json({ message: "room id required" });
        return;
    }
    const roomId = parseInt(req.params.roomdId);
    const messages = await config_1.prismaClient.chat.findMany({
        where: {
            roomId: roomId
        },
        orderBy: {
            id: "desc"
        }
    });
    console.log(messages);
    res.status(200).json({ messages });
});
app.get("/chats/text_chats/:roomdId", async (req, res) => {
    if (!req.params.roomdId) {
        res.status(400).json({ message: "room id required" });
        return;
    }
    const roomId = parseInt(req.params.roomdId);
    const messages = await config_1.prismaClient.text_Chat.findMany({
        where: {
            roomId: roomId,
        },
        take: 50,
        include: {
            user: {
                select: {
                    name: true
                },
            },
        },
    });
    res.status(200).json({ messages });
});
app.get("/room/:slug", async (req, res) => {
    if (!req.params.slug) {
        res.status(400).json({ message: "room name required" });
        return;
    }
    const slug = req.params.slug;
    const room = await config_1.prismaClient.room.findUnique({
        where: {
            slug: slug
        }
    });
    res.status(200).json({ room });
});
app.get("/rooms", async (req, res) => {
    try {
        const rooms = await config_1.prismaClient.room.findMany({
            orderBy: {
                id: "desc"
            },
            include: {
                admin: {
                    select: {
                        name: true
                    }
                }
            }
        });
        res.status(200).json({ rooms });
        return;
    }
    catch (error) {
        console.error("Error fetching rooms:", error);
        res.status(500).json({ message: "Error fetching rooms" });
        return;
    }
});
app.post("/api/generate-drawing", async (req, res) => {
    const { prompt, userId } = req.body;
    console.log(prompt, userId);
    if (!prompt) {
        res.status(400).json({ message: "Drawing prompt is required" });
        return;
    }
    if (!userId) {
        // @ts-ignore
        const authenticatedUserId = req.user?.id;
        if (!authenticatedUserId) {
            res.status(400).json({ message: "User ID is required" });
            return;
        }
    }
    try {
        const systemPrompt = `
You are an AI that generates structured JSON arrays of shapes to create simple drawings. You must only use these exact shape types with their specified properties:

1. Rectangle:
{
  "type": "rect",
  "x": number,
  "y": number,
  "width": number,
  "height": number,
  "color": string,
  "id": string,
  "iseditable": boolean,
  "userId": string
}

2. Circle:
{
  "type": "circle",
  "startx": number,
  "starty": number,
  "clientx": number,
  "clienty": number,
  "color": string,
  "id": string,
  "iseditable": boolean,
  "userId": string
}

3. Pencil:
{
  "type": "pencil",
  "points": Array<{"x": number, "y": number}>,
  "color": string,
  "id": string,
  "iseditable": boolean,
  "userId": string
}

4. Text:
{
  "type": "text",
  "x": number,
  "y": number,
  "content": string,
  "color": string,
  "id": string,
  "style": {
    "fontSize": number,
    "isBold": boolean,
    "isItalic": boolean
  },
  "iseditable": boolean,
  "userId": string
}

For each shape, generate a unique ID using a timestamp string (e.g., Date.now().toString()).
Set all shapes to "iseditable": true.
Use appropriate coordinates and sizes to create a meaningful drawing.
**Strict Color Palette**  
    Every shape **MUST** use only the following predefined chalk-like colors with a glowing effect:
    [
        "#ffffff", "#f9eaa9", "#a0c0ff", "#ffb0d0", "#ffa599",
        "#a0ffa0", "#a0ffff", "#e0a0ff", "#ffe0a0", "#e0e0e0",
        "#ffbf99", "#a0ffe0"
    ]
`;
        const userPrompt = `Generate a JSON array of shapes to draw: ${prompt}. 
Use the userId: "${userId}" for all shapes.
For pencil shapes, include at least 5 points.
For text, include appropriate content and style.
Return ONLY valid JSON with no explanations.`;
        // Using Google's Gemini API
        const response = await axios_1.default.post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", {
            contents: [
                {
                    parts: [
                        {
                            text: `${systemPrompt}\n\n${userPrompt}`
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2000
            }
        }, {
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": 'AIzaSyAsZ7bQiqUZdrAn9FVW1zUUjx6h1JsPZzg' // Make sure to store your API key in environment variables
            }
        });
        // Extract the response text from the Gemini API response
        const responseContent = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        // Extract JSON from the response
        // Gemini might include markdown code blocks or extra text, so we need to extract just the JSON part
        let jsonContent = responseContent;
        // If response contains a markdown code block, extract it
        const jsonMatch = responseContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
            jsonContent = jsonMatch[1];
        }
        // Try to parse the JSON response
        try {
            const parsedResponse = JSON.parse(jsonContent);
            const drawingData = Array.isArray(parsedResponse.shapes) ?
                parsedResponse.shapes :
                (Array.isArray(parsedResponse) ? parsedResponse : []);
            // Validate that each shape matches our expected types
            const validatedDrawing = drawingData.map((shape) => {
                // Ensure each shape has a unique ID
                if (!shape.id) {
                    shape.id = Date.now().toString();
                }
                // Ensure iseditable is set
                shape.iseditable = true;
                // Ensure userId is set
                shape.userId = userId;
                return shape;
            });
            res.status(200).json({ drawing: validatedDrawing });
            return;
        }
        catch (parseError) {
            console.error("Failed to parse response:", parseError);
            res.status(500).json({
                message: "Failed to parse drawing data",
                rawResponse: responseContent
            });
            return;
        }
    }
    catch (error) {
        console.error("API error:", error);
        res.status(500).json({ message: "Error generating drawing" });
        return;
    }
});
app.listen(3001, () => {
    console.log(`Server started at port 3001.`);
});
