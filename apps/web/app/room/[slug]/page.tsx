import axios from 'axios'
import React from 'react'
import { BACKEND_URL } from '../../config'
import ChatRoomComponent from '../../components/ChatRoom'

async function getRoomId(slug:string) {
    console.log(`${BACKEND_URL}/room/${slug}`)
    const response = await axios.get(`${BACKEND_URL}/room/${slug}`)
    console.log(response)
    return response.data.room.id
}

const ChatRoom = async ({params}:{params:{slug:string}}) => {
    const slug = (await params).slug
    const roomId = await getRoomId(slug)
    return <ChatRoomComponent id={roomId} />
}

export default ChatRoom
