import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Message, useChatStore } from "@/lib/store";
import { useState, useRef, useEffect } from "react";
import { AlertCircle, MessageSquare } from "lucide-react";
import { ChatHeader } from "./ChatHeader";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { TooltipProvider } from "./ui/tooltip";
import { Card } from "./ui/card";

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
      <div className="h-full w-full flex items-center justify-center bg-background">
        <div className="w-full h-full flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full p-8 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-4">Welcome to PeerPulse</h3>
            <p className="text-lg text-muted-foreground">
              Connect with friends securely using peer-to-peer technology. 
              Your messages stay between you and your friends.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const activePeer = connections.get(activeChat);
  if (!activePeer) return null;

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background">
        <ChatHeader 
          peer={activePeer}
          isTyping={isTyping}
          isDisconnected={isDisconnected}
          onBack={() => setActiveChat(null)}
        />
        
        {isDisconnected && (
          <Alert variant="destructive" className="mx-4 mt-4">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <AlertDescription className="text-xs sm:text-sm break-words">
              Connection lost. Messages cannot be sent until reconnected.
            </AlertDescription>
          </Alert>
        )}
        
        <ScrollArea className="flex-1 px-4">
          <div className="max-w-3xl mx-auto py-6 space-y-4">
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
        
        <div className="p-4 max-w-3xl mx-auto w-full">
          <Card>
            <ChatInput
              message={message}
              onChange={(value) => {
                setMessage(value);
                handleTyping();
              }}
              onSend={handleSendMessage}
              isDisabled={isDisconnected}
            />
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}