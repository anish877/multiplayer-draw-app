import axios from "axios"
import { BACKEND_URL } from "../config"
import ChatRoomClient from "./ChatRoomClient"


async function getChat(roomId:string){
   const response = await axios.get(`${BACKEND_URL}/chats/${roomId}`)
   console.log(response.data.messages)
   return response.data.messages
}

const ChatRoomComponent = async ({id}:{id:string}) => {
    const messages = await getChat(id)
    return <ChatRoomClient messages={messages} id={`${id}`}></ChatRoomClient>
}

export default ChatRoomComponent
