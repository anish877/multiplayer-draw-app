import { BACKEND_URL } from '@/app/config';
import axios from 'axios';
import React, { useEffect, useState, useRef } from 'react';
import { Send } from 'lucide-react';

interface Message {
  userId: string;
  user: { name: string };
  message: string;
  type?: string;
}

interface ChatSectionProps {
  roomId: string;
  socket: WebSocket | null;
}

const ChatSection: React.FC<ChatSectionProps> = ({ roomId, socket }) => {
  const [messageToSend, setMessageToSend] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchChatData(roomId);

    if (socket) {
      const messageHandler = (event: MessageEvent) => {
        try {
          const newMessage = JSON.parse(event.data);
          if (newMessage.type === "text_chat") {
            setMessages((prev) => [...prev, newMessage]);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.addEventListener('message', messageHandler);

      return () => {
        socket.removeEventListener('message', messageHandler);
      };
    }
  }, [roomId, socket]);

  async function fetchChatData(roomId: string) {
    try {
      const response = await axios.get(`${BACKEND_URL}/chats/text_chats/${roomId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching chat data:', error);
    }
  }

  function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    
    if (!socket || !messageToSend.trim()) {
      return;
    }

    const messageData = {
      type: "text_chat",
      roomId: roomId,
      message: messageToSend,
      userId: localStorage.getItem("userId"),
      name: localStorage.getItem('username')
    };
    
    socket.send(JSON.stringify(messageData));
    setMessageToSend('');
  }

  return (
    <div className="flex flex-col h-full bg-[#222222] text-white">
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3">
          {messages.map((msg, index) => (
            (!msg.type || msg.type === "text_chat") ? (
              <div
                key={index}
                className={`flex flex-col max-w-[75%] ${
                  msg.userId === localStorage.getItem("userId")
                    ? 'ml-auto items-end'
                    : 'mr-auto items-start'
                }`}
              >
                <span className="text-sm text-[#a7a7a7] mb-0.5">
                  {msg.user?.name || 'Unknown'}
                </span>
                <div className="bg-[#2d2d2d] px-4 py-2 rounded-lg break-words">
                  <p className="text-base leading-6">{msg.message}</p>
                </div>
              </div>
            ) : null
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-[#2d2d2d] p-4 bg-[#222222]">
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={messageToSend}
            onChange={(e) => setMessageToSend(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-[#2d2d2d] text-base text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#444444]"
          />
          <button
            type="submit"
            className="bg-[#2d2d2d] p-2 rounded-lg hover:bg-[#363636] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#444444]"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatSection;