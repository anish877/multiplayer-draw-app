'use client';
import React, { useEffect, useState } from 'react'
import useSocket from '../hooks/useSocket'

const ChatRoomClient = ({messages,id}:{messages:{message:string}[],id :string}) => {
    const [chats,setChat] = useState(messages)
    const {socket,loading} = useSocket()
    const [currentMessage,setCurrentMessage] = useState("")
    useEffect(()=>{
        if(socket && !loading){

            socket.send(JSON.stringify({
                type: "join_room",
                roomId: id
            }))

            socket.onmessage = (e)=>{
                const parsedData = JSON.parse(e.data as string)
                console.log(parsedData)
                if(parsedData.type==="chat"){
                    setChat(c=>[...c,{message: parsedData.message}])
                }
            }
        }
    },[socket,loading,id])

    return(
        <div>
            {chats.map((m,index)=><div key={index}>{m.message}</div>)}
            <input type="text" value={currentMessage} onChange={e=>{
                setCurrentMessage(e.target.value)
            }}/>
            <button onClick={()=>{
                socket?.send(JSON.stringify({
                    type: "chat",
                    roomId: id,
                    message: currentMessage,
                    userId: "d88cdefb-d194-4e37-aedc-c8907c6917d9"
                }))
                setCurrentMessage("")
            }}>Send message</button>
        </div>
    )
}

export default ChatRoomClient
