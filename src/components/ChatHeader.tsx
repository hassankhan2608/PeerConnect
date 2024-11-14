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

      // Request microphone access with explicit constraints
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
      
      peer.connection.send({ type: "CALL_REQUEST" });
      setCallStatus(peer.connection.peer, 'ringing');

      call.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
        setCallStatus(peer.connection.peer, 'ongoing');
        setActiveCall(peer.connection.peer);
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

      // Set a timeout to end the call if not answered
      setTimeout(() => {
        if (callStatus.get(peer.connection.peer) === 'ringing') {
          call.close();
          stream.getTracks().forEach(track => track.stop());
          setLocalStream(null);
          setMediaConnection(null);
          setCallStatus(peer.connection.peer, 'ended');
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
    <div className="border-b border-[#2a373f] bg-[#202c33] z-10">
      <div className="flex items-center h-16 px-4">
        <Button 
          variant="ghost" 
          size="icon"
          className="md:hidden mr-2 text-[#aebac1] hover:text-[#e9edef] hover:bg-[#384147]"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-10 w-10 cursor-pointer">
          <AvatarFallback className={cn(
            isDisconnected ? "bg-[#202c33] text-[#8696a0]" : "bg-[#00a884]/10 text-[#00a884]"
          )}>
            {peer.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="ml-3 flex-1 cursor-pointer">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#e9edef]">
              {peer.username}
            </h3>
            {isDisconnected && (
              <span className="text-xs text-[#8696a0]">(Offline)</span>
            )}
          </div>
          {isTyping && (
            <p className="text-sm text-[#00a884]">typing...</p>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-[#aebac1]">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-[#384147]">
                <Search className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search in chat</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-[#384147]">
                <Video className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Video call</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-[#384147]"
                onClick={isInCall ? handleEndCall : handleCall}
                disabled={isDisconnected || currentCallStatus === 'ringing'}
              >
                {isInCall ? (
                  <PhoneOff className="h-5 w-5 text-red-500" />
                ) : (
                  <Phone className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isInCall ? 'End call' : 'Voice call'}
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-[#384147]">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>More options</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}