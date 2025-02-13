import {WebSocket, WebSocketServer } from "ws"
import jwt, { JwtPayload } from "jsonwebtoken"
const wss = new WebSocketServer({port:8080})
import { JWT_SECRET } from "backend-common/config"
import { prismaClient } from "db/config"

interface Users {
    rooms: String[],
    userId: String,
    ws: WebSocket
}

const users : Users[] = []

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
        ws: ws
    })
    ws.on("error",(error)=>console.log(error))
    ws.on("message",async (data : string)=>{
        const parsedData = await JSON.parse(data)
        console.log(parsedData)
        if(parsedData.type==="join_room"){
            const user = users.find(user=>user.ws===ws)
            user?.rooms.push(parsedData.roomId)
        }
        else if(parsedData.type==="leave_room"){
            const user = users.find(user=>user.ws===ws)
            if(!user)
                return
            user.rooms = user?.rooms.filter(room=>room!==parsedData.roomId)
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
        else if(parsedData.type==="text_chat"){
            users.forEach(user=>{
                if(user.rooms.includes(parsedData.roomId)){
                    user.ws.send(JSON.stringify({type:"text_chat",message:parsedData.message, name:parsedData.name}))
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
        console.log(users)
    })
})