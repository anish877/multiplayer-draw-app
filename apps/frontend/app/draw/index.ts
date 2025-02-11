import axios from "axios"
import { BACKEND_URL } from "../config"

type Shape = {
    type: "rect",
    x: number,
    y: number,
    width: number,
    height: number,
} | {
    type: "circle",
    centerx: number,
    centery: number,
    radius: number,
}


export async function initDraw(canvas:HTMLCanvasElement,roomId:string,socket: WebSocket, userId: string){
        let clicked = false
        let startX = 0
        let startY = 0
        let width = 0
        let height = 0
        let ctx = canvas.getContext("2d")
        
        let existingShapes : Shape[] = await getExistingShapes(roomId)
        if(!ctx)
            return
        clearCanvas(existingShapes,canvas,ctx)
        socket.onmessage=(e=>{
            const message = JSON.parse(e.data)
            console.log(message)
            if(message.type==="chat"){
                const parsedShape = JSON.parse(message.message)
                existingShapes.push(parsedShape)
                clearCanvas(existingShapes,canvas,ctx)
            }
        })
        canvas.addEventListener("mousedown",(e)=>{
            clicked = true
            startX = e.clientX
            startY = e.clientY

        })
        canvas.addEventListener("mouseup",(e)=>{
            clicked = false
            const shape : Shape = {
                type: "rect",
                x: startX,
                y: startY,
                width: e.clientX-startX,
                height: e.clientY-startY
            }
            existingShapes.push(shape)

            socket.send(JSON.stringify({
                type: "chat",
                message: JSON.stringify(shape),
                roomId,
                userId

            }))
        })
        canvas.addEventListener("mousemove",(e)=>{
            if(clicked){
                width = e.clientX-startX
                height = e.clientY - startY
                clearCanvas(existingShapes,canvas,ctx)
                ctx?.strokeRect(startX,startY,width,height)
            }
        })
}

export function clearCanvas(existingShapes: Shape[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D ){
    ctx.clearRect(0,0,canvas.width,canvas.height)
    existingShapes.map(shape=>{
        if(shape.type==="rect"){
            ctx.strokeRect(shape.x,shape.y,shape.width,shape.height)
        }
    })
}

async function getExistingShapes(roomId:string){
    const response = await axios.get(`${BACKEND_URL}/chats/${roomId}`)
    console.log(response)
    const messages = response.data.messages
    const shapes = messages.map((x:{message:string})=>{
        const parsedData = JSON.parse(x.message)
        return parsedData 
    })
    return shapes
}