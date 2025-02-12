"use client";
import { useAuth } from '@/app/auth/verify/index';
import { initDraw } from '@/app/draw'
import React, { useEffect, useRef, useState } from 'react'

const CanvasComponent = ({roomId,socket}:{roomId:string,socket:WebSocket}) => {
    const canvasref = useRef<HTMLCanvasElement>(null)
    const [type,setType] = useState("circle")
    const {userId} = useAuth()
    useEffect(()=>{
        const canvas = canvasref.current
        if(!canvas)
            return
        console.log(userId)
        initDraw(canvas,roomId,socket,userId,type)
    },[canvasref,type])

  return (
    <div >
        <div>
            <button onClick={()=>setType("circle")}>Circle</button>
            <button onClick={()=>setType("rect")}>Rect</button>
            <button onClick={()=>setType("pencil")}>Pencil</button>
        </div>
        <div>
            <canvas ref={canvasref} height={800} width={2000} className='bg-white'></canvas>
        </div>
    </div>
  )
}

export default CanvasComponent
