'use client';
import { initDraw } from '@/app/draw';
import React, { useEffect, useRef } from 'react'

const Canvas = () => {
    const canvasref = useRef<HTMLCanvasElement>(null)
    useEffect(()=>{
        const canvas = canvasref.current
        if(!canvas)
            return
        initDraw(canvas)
    },[canvasref])
  return (
    <div >
      <canvas ref={canvasref} height={800} width={2000} className='bg-white'></canvas>
    </div>
  )
}

export default Canvas
