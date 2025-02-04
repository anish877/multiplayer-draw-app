import {WebSocketServer } from "ws"

const wss = new WebSocketServer({port:8080})

wss.on("connection",(ws)=>{
    ws.on("error",(error)=>console.log(error))
    ws.on("message",(data)=>{
        ws.send("something")
    })
})