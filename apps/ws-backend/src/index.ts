import {WebSocketServer } from "ws"
import jwt, { JwtPayload } from "jsonwebtoken"
const wss = new WebSocketServer({port:8080})
import { JWT_SECRET } from "backend-common/config"


wss.on("connection",(ws,request)=>{
    const url = request.url
    const urlPramas = new URLSearchParams(url?.split("?")[1])
    const token = urlPramas.get("token") || ""
    const decoded = jwt.verify(token,JWT_SECRET) as JwtPayload
    if(!decoded || !decoded.username){
        ws.close()
        return
    }
    ws.on("error",(error)=>console.log(error))
    ws.on("message",(data)=>{
        ws.send("something")
    })
})