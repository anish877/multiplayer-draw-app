'use client';
import { initDraw } from '@/app/draw';
import React, { useEffect, useRef, useState } from 'react'

const Canvas = () => {
    const canvasref = useRef<HTMLCanvasElement>(null)
    const [type,setType] = useState("rect")
    useEffect(()=>{
        const canvas = canvasref.current
        if(!canvas)
            return
        initDraw(canvas)
    },[canvasref])
  return (
    <div >
        <div>
            <button onClick={()=>setType("circle")}>Circle</button>
            <button onClick={()=>setType("rect")}>Rect</button>
        </div>
        <div>
            <canvas ref={canvasref} height={800} width={2000} className='bg-white'></canvas>
        </div>
    </div>
  )
}

export default Canvas
