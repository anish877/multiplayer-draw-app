export function initDraw(canvas:HTMLCanvasElement){
    let clicked = false
        let startX = 0
        let startY = 0
        let ctx = canvas.getContext("2d")

        canvas.addEventListener("mousedown",(e)=>{
            clicked = true
            startX = e.clientX
            startY = e.clientY

        })
        canvas.addEventListener("mouseup",(e)=>{
            clicked = false
        })
        canvas.addEventListener("mousemove",(e)=>{
            if(clicked){
                const width = e.clientX-startX
                const height = e.clientY - startY
                console.log(width,height)
                ctx?.clearRect(0,0,canvas.width||0,canvas.height||0)
                ctx?.strokeRect(startX,startY,width,height)
            }
        })
}
