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


export function initDraw(canvas:HTMLCanvasElement){
        let clicked = false
        let startX = 0
        let startY = 0
        let width = 0
        let height = 0
        let ctx = canvas.getContext("2d")
        let existingShapes : Shape[] = []
        if(!ctx)
            return
        canvas.addEventListener("mousedown",(e)=>{
            clicked = true
            startX = e.clientX
            startY = e.clientY

        })
        canvas.addEventListener("mouseup",(e)=>{
            clicked = false
            existingShapes.push({
                type: "rect",
                x: startX,
                y: startY,
                width: e.clientX-startX,
                height: e.clientY-startY
            })
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