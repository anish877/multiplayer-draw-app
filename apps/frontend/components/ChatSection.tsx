import React, { useState } from 'react'

const ChatSection = () => {
    
    const [messageToSend,setMessageToSend] = useState("")
  return (
    <div>
        <div>

        </div>
      <input type="text"  onChange={(e)=>setMessageToSend(e.target.value)} value={messageToSend}/>
    </div>
  )
}

export default ChatSection
