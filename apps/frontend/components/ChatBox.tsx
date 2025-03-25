
import { useState } from "react";
import { Send, ChevronDown } from "lucide-react";

const ChatBox = () => {
  const [message, setMessage] = useState("");
  const [showUserList, setShowUserList] = useState(false);

  // Mockup online users - in a real app this would come from your backend
  const onlineUsers = [
    { id: 1, name: "John Doe" },
    { id: 2, name: "Jane Smith" },
    { id: 3, name: "Alex Johnson" },
    { id: 4, name: "Sarah Wilson" }
  ];

  return (
    <div className="chat-panel animate-slide-in">
      <div className="p-3 border-b border-toolbar-border flex items-center justify-between">
        <h3 className="font-medium text-sm text-white/90">Team Chat</h3>
        <div className="relative">
          <button 
            onClick={() => setShowUserList(!showUserList)}
            className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors"
          >
            <span>{onlineUsers.length} online</span>
            <ChevronDown size={14} />
          </button>
          
          {showUserList && (
            <div className="absolute right-0 top-6 w-48 glass-panel p-2 space-y-1 animate-fade-in z-50">
              {onlineUsers.map(user => (
                <div 
                  key={user.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-white/5"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm text-white/80">{user.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin">
        <div className="space-y-1">
          <p className="text-xs text-white/60 font-medium">John Doe</p>
          <p className="text-sm bg-white/5 p-2 rounded-lg inline-block max-w-[85%] break-words">
            Hey, nice drawing!
          </p>
        </div>
        
        <div className="space-y-1 flex flex-col items-end">
          <p className="text-xs text-white/60 font-medium">You</p>
          <p className="text-sm bg-white/10 p-2 rounded-lg inline-block max-w-[85%] break-words">
            Thanks! I&apos;m working on the UI layout
          </p>
        </div>
      </div>
      
      <div className="p-3 border-t border-toolbar-border">
        <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 text-sm rounded-md px-3 py-2 
                     placeholder:text-white/30 focus:outline-none focus:ring-1 
                     focus:ring-white/20 border border-white/10"
          />
          <button 
            className="tool-button hover:bg-white/10 p-2 rounded-md 
                     transition-colors duration-200"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatBox