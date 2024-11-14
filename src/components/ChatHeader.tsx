import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { 
  MoreVertical, 
  Phone, 
  Video, 
  Search, 
  ArrowLeft,
  PhoneOff
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConnectionInfo, useChatStore } from "@/lib/store";
import { Card } from "./ui/card";

interface ChatHeaderProps {
  peer: ConnectionInfo;
  isTyping: boolean;
  isDisconnected: boolean;
  onBack: () => void;
}

export function ChatHeader({ peer, isTyping, isDisconnected, onBack }: ChatHeaderProps) {
  const { 
    peer: peerInstance,
    setCallStatus,
    setActiveCall,
    setMediaConnection,
    setLocalStream,
    setRemoteStream,
    activeCall,
    callStatus,
    mediaConnection
  } = useChatStore();

  const isInCall = activeCall === peer.connection.peer;
  const currentCallStatus = callStatus.get(peer.connection.peer);

  const handleCall = async () => {
    try {
      if (!peerInstance) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      setLocalStream(stream);
      const call = peerInstance.call(peer.connection.peer, stream);
      setMediaConnection(call);
      
      setActiveCall(peer.connection.peer);
      peer.connection.send({ type: "CALL_REQUEST" });
      setCallStatus(peer.connection.peer, 'ringing');

      call.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
        setCallStatus(peer.connection.peer, 'ongoing');
      });

      call.on('close', () => {
        stream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        setRemoteStream(null);
        setMediaConnection(null);
        setCallStatus(peer.connection.peer, 'ended');
        setActiveCall(null);
        peer.connection.send({ type: "CALL_END" });
      });

      setTimeout(() => {
        if (callStatus.get(peer.connection.peer) === 'ringing') {
          call.close();
          stream.getTracks().forEach(track => track.stop());
          setLocalStream(null);
          setMediaConnection(null);
          setCallStatus(peer.connection.peer, 'ended');
          setActiveCall(null);
        }
      }, 30000);

    } catch (error) {
      console.error('Microphone access error:', error);
    }
  };

  const handleEndCall = () => {
    if (!peerInstance || !mediaConnection) return;
    mediaConnection.close();
    peer.connection.send({ type: "CALL_END" });
    setCallStatus(peer.connection.peer, 'ended');
    setActiveCall(null);
  };

  return (
    <Card className="mx-4 mt-4 mb-2">
      <div className="flex items-center h-16 px-2 sm:px-4">
        <Button 
          variant="ghost" 
          size="icon"
          className="md:hidden mr-1 sm:mr-2 text-muted-foreground hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
          <AvatarFallback className={cn(
            isDisconnected ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
          )}>
            {peer.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="ml-2 sm:ml-3 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">
              {peer.username}
            </h3>
            {isDisconnected && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">(Offline)</span>
            )}
          </div>
          {isTyping && (
            <p className="text-sm text-primary">typing...</p>
          )}
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground hover:text-foreground"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search in chat</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground hover:text-foreground"
              >
                <Video className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Video call</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground hover:text-foreground"
                onClick={isInCall ? handleEndCall : handleCall}
                disabled={isDisconnected || currentCallStatus === 'ringing'}
              >
                {isInCall ? (
                  <PhoneOff className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                ) : (
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isInCall ? 'End call' : 'Voice call'}
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>More options</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </Card>
  );
}