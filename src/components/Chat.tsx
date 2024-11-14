import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Message, useChatStore } from "@/lib/store";
import { useState, useRef, useEffect } from "react";
import { AlertCircle, User2 } from "lucide-react";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { TooltipProvider } from "./ui/tooltip";

let typingTimeout: NodeJS.Timeout;

export function Chat() {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { 
    activeChat, 
    connections, 
    messages, 
    username,
    addMessage,
    setActiveChat,
    connectionStatus,
    typingStatus,
    setTypingStatus,
    clearUnread
  } = useChatStore();
  
  const chatMessages = messages.get(activeChat || "") || [];
  const connection = activeChat ? connections.get(activeChat) : null;
  const isDisconnected = activeChat ? connectionStatus.get(activeChat) === 'disconnected' : false;
  const isTyping = activeChat ? typingStatus.get(activeChat) : false;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    if (activeChat) {
      clearUnread(activeChat);
    }
  }, [activeChat, clearUnread]);

  const handleTyping = () => {
    if (!connection || !activeChat) return;

    connection.connection.send({ type: "TYPING_START" });
    clearTimeout(typingTimeout);
    
    typingTimeout = setTimeout(() => {
      connection.connection.send({ type: "TYPING_END" });
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!message.trim() || !connection || !activeChat || isDisconnected) return;

    const newMessage: Message = {
      id: crypto.randomUUID(),
      content: message.trim(),
      sender: username,
      timestamp: Date.now(),
    };

    connection.connection.send(newMessage);
    addMessage(activeChat, newMessage);
    setMessage("");
    
    clearTimeout(typingTimeout);
    connection.connection.send({ type: "TYPING_END" });
  };

  if (!activeChat) {
    return (
      <div className="h-full flex items-center justify-center bg-[#222e35]">
        <div className="text-center space-y-4 p-8 max-w-lg">
          <div className="w-20 h-20 bg-[#00a884]/10 rounded-full flex items-center justify-center mx-auto">
            <User2 className="w-10 h-10 text-[#00a884]/60" />
          </div>
          <h3 className="text-2xl font-bold text-[#e9edef]">Welcome to P2P Chat</h3>
          <p className="text-lg text-[#8696a0]">
            Connect with friends securely using peer-to-peer technology. 
            Your messages stay between you and your friends.
          </p>
        </div>
      </div>
    );
  }

  const activePeer = connections.get(activeChat);
  if (!activePeer) return null;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-[#0b141a]">
        <ChatHeader 
          peer={activePeer}
          isTyping={isTyping}
          isDisconnected={isDisconnected}
          onBack={() => setActiveChat(null)}
        />
        
        {isDisconnected && (
          <Alert variant="destructive" className="mx-4 mt-4 bg-red-900/20 border-red-900/50 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Connection lost. Messages cannot be sent until reconnected.
            </AlertDescription>
          </Alert>
        )}
        
        <ScrollArea className="flex-1 bg-[#0b141a]">
          <div className="space-y-1 py-4">
            {chatMessages.map((msg, index) => {
              const isFirstInGroup = index === 0 || chatMessages[index - 1].sender !== msg.sender;
              const isLastInGroup = index === chatMessages.length - 1 || chatMessages[index + 1].sender !== msg.sender;
              
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isFirstInGroup={isFirstInGroup}
                  isLastInGroup={isLastInGroup}
                  showAvatar={isLastInGroup}
                  isCurrentUser={msg.sender === username}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <ChatInput
          message={message}
          onChange={(value) => {
            setMessage(value);
            handleTyping();
          }}
          onSend={handleSendMessage}
          isDisabled={isDisconnected}
        />
      </div>
    </TooltipProvider>
  );
}