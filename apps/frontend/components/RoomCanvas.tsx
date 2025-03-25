'use client';
import { WS_URL } from '@/app/config'
import React, { useEffect, useState } from 'react'
import CanvasComponent from './CanvasComponent'
import { useAuth } from '@/app/auth/verify/index'

const RoomCanvas = ({roomId}:{roomId:string}) => {
    const [socket,setSocket] = useState<WebSocket|null>(null)
    const {token} = useAuth()
    useEffect(()=>{
        if(token==='')
            return
        console.log(WS_URL+`?token=`+token)
        const ws = new WebSocket(WS_URL + `?token=` + token)
        ws.onopen=()=>{
            setSocket(ws)
            ws.send(JSON.stringify({
                type:"join_room",
                roomId
            }))
        }
    },[token,roomId])

    if(!socket)
        return (
            <div>
                Conecting to server....
            </div>
        )
    
    return <div>
        <CanvasComponent roomId={roomId} socket={socket}/>
    </div>
}

export default RoomCanvas
