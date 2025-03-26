"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const wss = new ws_1.WebSocketServer({ port: 8080 });
const config_1 = require("backend-common/config");
const config_2 = require("db/config");
const cloudinary_1 = require("cloudinary");
const users = [];
cloudinary_1.v2.config({
    cloud_name: 'dyxsai3xf',
    api_key: '247246481321692',
    api_secret: 'FWr9b-GToAKYxT5Hs36Fumz7sKQ'
});
wss.on("connection", (ws, request) => {
    const url = request.url;
    if (!url) { // Added check for undefined URL
        ws.close();
        return;
    }
    const urlPramas = new URLSearchParams(url.split("?")[1]);
    const token = urlPramas.get("token") || "";
    try { // Added try/catch for JWT verification
        const decoded = jsonwebtoken_1.default.verify(token, config_1.JWT_SECRET);
        if (!decoded || !decoded.id || !decoded.email || !decoded.name) { // Added check for required fields
            ws.close();
            return;
        }
        users.push({
            rooms: [],
            userId: decoded.id,
            ws: ws,
            name: decoded.name
        });
        const broadcastUsers = (roomId) => {
            const roomUsers = users
                .filter(user => user.rooms.includes(roomId))
                .map(user => ({
                userId: user.userId,
                name: user.name
            }));
            users.forEach(user => {
                if (user.rooms.includes(roomId)) {
                    user.ws.send(JSON.stringify({
                        type: "users_update",
                        users: roomUsers
                    }));
                }
            });
        };
        ws.on("error", (error) => console.log(error));
        ws.on("message", async (data) => {
            try { // Added try/catch for JSON parsing
                const parsedData = JSON.parse(data.toString());
                if (parsedData.type === "join_room") {
                    const user = users.find(user => user.ws === ws);
                    if (user && !user.rooms.includes(parsedData.roomId)) { // Prevent duplicate room entries
                        user.rooms.push(parsedData.roomId);
                        broadcastUsers(parsedData.roomId);
                    }
                }
                else if (parsedData.type === "leave_room") {
                    const user = users.find(user => user.ws === ws);
                    if (!user)
                        return;
                    user.rooms = user.rooms.filter(room => room !== parsedData.roomId);
                    broadcastUsers(parsedData.roomId);
                }
                else if (parsedData.type === "chat") {
                    // Validate required fields
                    if (!parsedData.roomId || !parsedData.message || !parsedData.userId) {
                        return;
                    }
                    users.forEach(user => {
                        if (user.rooms.includes(parsedData.roomId)) {
                            user.ws.send(JSON.stringify({
                                type: "chat",
                                message: parsedData.message,
                                userId: parsedData.userId
                            }));
                        }
                    });
                    await config_2.prismaClient.chat.create({
                        data: {
                            roomId: parseInt(parsedData.roomId),
                            message: parsedData.message,
                            userId: parsedData.userId
                        }
                    });
                }
                else if (parsedData.type === "delete_chat") {
                    // Validate required fields
                    if (!parsedData.roomId || !parsedData.message || !parsedData.userId) {
                        return;
                    }
                    users.forEach(user => {
                        if (user.rooms.includes(parsedData.roomId)) {
                            user.ws.send(JSON.stringify({
                                type: "delete_chat",
                                message: parsedData.message,
                                userId: parsedData.userId
                            }));
                        }
                    });
                    await config_2.prismaClient.chat.deleteMany({
                        where: {
                            roomId: parseInt(parsedData.roomId),
                            message: parsedData.message,
                            userId: parsedData.userId
                        }
                    });
                }
                else if (parsedData.type === "text_chat") {
                    // Validate required fields
                    if (!parsedData.roomId || !parsedData.message || !parsedData.userId || !parsedData.name) {
                        return;
                    }
                    users.forEach(user => {
                        if (user.rooms.includes(parsedData.roomId)) {
                            user.ws.send(JSON.stringify({
                                type: "text_chat",
                                message: parsedData.message,
                                userId: parsedData.userId,
                                user: { name: parsedData.name }
                            }));
                        }
                    });
                    await config_2.prismaClient.text_Chat.create({
                        data: {
                            roomId: parseInt(parsedData.roomId),
                            message: parsedData.message,
                            userId: parsedData.userId
                        }
                    });
                }
                else if (parsedData.type === "image_element") {
                    // Validate required fields
                    if (!parsedData.roomId || !parsedData.message || !parsedData.userId || !parsedData.name) {
                        return;
                    }
                    try {
                        const message = JSON.parse(parsedData.message);
                        if (!message.src) {
                            return;
                        }
                        const uploadResponse = await cloudinary_1.v2.uploader.upload(message.src, {
                            folder: 'chat_images',
                        });
                        message.src = uploadResponse.secure_url;
                        const updatedMessage = JSON.stringify(message);
                        users.forEach(user => {
                            if (user.rooms.includes(parsedData.roomId)) {
                                user.ws.send(JSON.stringify({
                                    type: "image_element",
                                    message: updatedMessage,
                                    userId: parsedData.userId,
                                    user: { name: parsedData.name }
                                }));
                            }
                        });
                        await config_2.prismaClient.chat.create({
                            data: {
                                roomId: parseInt(parsedData.roomId),
                                message: updatedMessage,
                                userId: parsedData.userId
                            }
                        });
                    }
                    catch (error) {
                        console.error('Error handling image upload:', error);
                    }
                }
            }
            catch (error) {
                console.error('Error parsing message data:', error);
            }
        });
        ws.on("close", () => {
            const userIndex = users.findIndex(user => user.ws === ws);
            if (userIndex === -1)
                return;
            if (!users[userIndex])
                return;
            // Make a copy of the user's rooms before removing them
            const userRooms = [...users[userIndex].rooms];
            // Remove the user
            users.splice(userIndex, 1);
            // Broadcast updated user list to all rooms the user was in
            userRooms.forEach(roomId => {
                broadcastUsers(roomId);
            });
        });
    }
    catch (error) {
        console.error('Error verifying token:', error);
        ws.close();
    }
});
