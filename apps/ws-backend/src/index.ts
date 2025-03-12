import {WebSocket, WebSocketServer } from "ws"
import jwt, { JwtPayload } from "jsonwebtoken"
const wss = new WebSocketServer({port:8080})
import { JWT_SECRET } from "backend-common/config"
import { prismaClient } from "db/config"
import { v2 as cloudinary } from "cloudinary"

interface Users {
    rooms: String[],
    userId: String,
    ws: WebSocket,
    name: string
}

const users : Users[] = []

cloudinary.config({
    cloud_name: 'dyxsai3xf',
    api_key: '247246481321692',
    api_secret: 'FWr9b-GToAKYxT5Hs36Fumz7sKQ'
  });

wss.on("connection",(ws,request)=>{
    const url = request.url
    const urlPramas = new URLSearchParams(url?.split("?")[1])
    const token = urlPramas.get("token") || ""
    console.log(token)
    const decoded = jwt.verify(token,JWT_SECRET) as JwtPayload
    console.log(decoded)
    if(!decoded || !decoded.email){
        ws.close()
        return
    }
    users.push({
        rooms: [],
        userId: decoded.id,
        ws: ws,
        name: decoded.name
    })
    const broadcastUsers = (roomId: String) => {
        const roomUsers = users
            .filter(user => user.rooms.includes(roomId))
            .map(user => ({
                userId: user.userId,
                name: user.name // You'll need to store user names when they connect
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
    ws.on("error",(error)=>console.log(error))
    ws.on("message",async (data : string)=>{
        const parsedData = await JSON.parse(data)
        console.log(parsedData)
        if (parsedData.type === "join_room") {
            const user = users.find(user => user.ws === ws);
            user?.rooms.push(parsedData.roomId);
            broadcastUsers(parsedData.roomId);
        }
        else if (parsedData.type === "leave_room") {
            const user = users.find(user => user.ws === ws);
            if (!user) return;
            user.rooms = user.rooms.filter(room => room !== parsedData.roomId);
            broadcastUsers(parsedData.roomId);
        }
        else if(parsedData.type==="chat"){
            users.forEach(user=>{
                if(user.rooms.includes(parsedData.roomId)){
                    user.ws.send(JSON.stringify({type:"chat",message:parsedData.message}))
                }
            })
            await prismaClient.chat.create({
                data:{
                    roomId: parseInt(parsedData.roomId),
                    message: parsedData.message,
                    userId: parsedData.userId
                }
            })
            
        }
        else if(parsedData.type==="delete_chat"){
            users.forEach(user=>{
                if(user.rooms.includes(parsedData.roomId)){
                    user.ws.send(JSON.stringify({type:"delete_chat",message:parsedData.message}))
                }
            })

            await prismaClient.chat.deleteMany({
                where:{
                    roomId: parseInt(parsedData.roomId),
                    message: parsedData.message,
                    userId: parsedData.userId
                }
            })
            
        }
        else if(parsedData.type==="text_chat"){
            users.forEach(user=>{
                if(user.rooms.includes(parsedData.roomId)){
                    user.ws.send(JSON.stringify({type:"text_chat",message:parsedData.message, userId:parsedData.userId, user:{name:parsedData.name}}))
                }
            })

            await prismaClient.text_Chat.create({
                data:{
                    roomId: parseInt(parsedData.roomId),
                    message: parsedData.message,
                    userId: parsedData.userId
                }
            })
        }
        else if(parsedData.type === "image_element") {
            try {
              const message = JSON.parse(parsedData.message)
              const uploadResponse = await cloudinary.uploader.upload(message.src, {
                folder: 'chat_images',
              });
              message.src = uploadResponse.secure_url
              parsedData.message = JSON.stringify(message)
              console.log(uploadResponse.secure_url)
              users.forEach(user => {
                if(user.rooms.includes(parsedData.roomId)) {
                  user.ws.send(JSON.stringify({
                    type: "image_element",message:parsedData.message, userId:parsedData.userId, user:{name:parsedData.name}}))
                }
              });
              await prismaClient.chat.create({
                data: {
                    roomId: parseInt(parsedData.roomId),
                    message: parsedData.message,
                    userId: parsedData.userId
                }
              });
          
            } catch (error) {
              console.error('Error handling image upload:', error);
              // Handle error appropriately
            }
        }          
        console.log(users)
    })

    ws.on("close", () => {
        const userIndex = users.findIndex(user => user.ws === ws);
        if (userIndex === -1) return;
        if(!users[userIndex]) return
        const userRooms = [...users[userIndex].rooms];
        users.splice(userIndex, 1);
        
        // Broadcast updated user list to all rooms the user was in
        userRooms.forEach(roomId => {
            broadcastUsers(roomId);
        });
    });
})