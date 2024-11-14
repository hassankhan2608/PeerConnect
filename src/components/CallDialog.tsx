import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { PhoneOff } from "lucide-react";
import { useChatStore } from "@/lib/store";
import { AudioVisualizer } from "./AudioVisualizer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { format } from "date-fns";

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

export function CallDialog() {
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [callDuration, setCallDuration] = useState<number>(0);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  const {
    activeCall,
    connections,
    localStream,
    remoteStream,
    setActiveCall,
    setCallStatus,
    setLocalStream,
    setRemoteStream,
    setMediaConnection,
    connectionStatus,
    addMessage,
    setCallStartTime,
    setCallEndTime,
    callStartTime,
  } = useChatStore();

  const activePeer = activeCall ? connections.get(activeCall) : null;
  const isDisconnected = activeCall ? connectionStatus.get(activeCall) === 'disconnected' : false;
  const startTime = activeCall ? callStartTime.get(activeCall) : null;

  useEffect(() => {
    if (startTime) {
      const interval = setInterval(() => {
        setCallDuration(Date.now() - startTime);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime]);

  useEffect(() => {
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      if (activeCall) {
        setCallStartTime(activeCall, Date.now());
        addMessage(activeCall, {
          id: crypto.randomUUID(),
          content: "Call started",
          sender: "system",
          timestamp: Date.now(),
          type: "call_started"
        });
      }
    }
  }, [remoteStream, activeCall]);

  useEffect(() => {
    if (isDisconnected) {
      handleEndCall();
    }
  }, [isDisconnected]);

  const handleEndCall = async () => {
    if (activeCall) {
      const startTime = callStartTime.get(activeCall);
      const endTime = Date.now();
      setCallEndTime(activeCall, endTime);

      if (startTime) {
        const duration = Math.floor((endTime - startTime) / 1000);
        addMessage(activeCall, {
          id: crypto.randomUUID(),
          content: "Call ended",
          sender: "system",
          timestamp: endTime,
          type: "call_ended",
          duration
        });
      }

      const peer = connections.get(activeCall);
      if (peer && peer.connection.open) {
        peer.connection.send({ type: "CALL_END" });
      }
      setCallStatus(activeCall, 'ended');
    }

    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setMediaConnection(null);
    setActiveCall(null);
  };

  if (!activeCall || !activePeer) return null;

  const CallContent = () => (
    <div className="flex flex-col items-center space-y-6 p-4">
      <div className="w-24 h-24 rounded-full bg-[#00a884]/10 flex items-center justify-center">
        <span className="text-4xl text-[#00a884]">
          {activePeer.username.slice(0, 2).toUpperCase()}
        </span>
      </div>

      <div className="text-center">
        <h3 className="text-xl font-semibold text-[#e9edef]">
          {activePeer.username}
        </h3>
        <p className="text-[#8696a0] mt-1">
          {formatDuration(callDuration)}
        </p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <div className="flex items-center justify-between gap-4 bg-[#111b21]/50 p-3 rounded-lg">
          <span className="text-sm text-[#8696a0]">Your audio</span>
          <AudioVisualizer 
            stream={localStream} 
            className="bg-[#111b21] rounded-full"
          />
        </div>
        
        <div className="flex items-center justify-between gap-4 bg-[#111b21]/50 p-3 rounded-lg">
          <span className="text-sm text-[#8696a0]">{activePeer.username}'s audio</span>
          <AudioVisualizer 
            stream={remoteStream}
            className="bg-[#111b21] rounded-full"
          />
        </div>
      </div>

      <audio ref={localAudioRef} autoPlay muted className="hidden" />
      <audio ref={remoteAudioRef} autoPlay className="hidden" />
      
      <Button
        variant="destructive"
        size="icon"
        className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700"
        onClick={handleEndCall}
      >
        <PhoneOff className="h-6 w-6" />
      </Button>

      {isDisconnected && (
        <div className="text-red-400 text-sm text-center">
          Connection lost. Call will end automatically.
        </div>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={!!activeCall} onOpenChange={() => handleEndCall()}>
        <DialogContent className="sm:max-w-md bg-[#202c33] text-[#e9edef] border-[#2a373f]">
          <DialogHeader>
            <DialogTitle className="text-[#e9edef]">
              Call with {activePeer.username}
            </DialogTitle>
            <DialogDescription className="text-[#8696a0]">
              {isDisconnected ? "Connection lost" : "Connected"}
            </DialogDescription>
          </DialogHeader>
          <CallContent />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={!!activeCall} onOpenChange={() => handleEndCall()}>
      <DrawerContent className="bg-[#202c33] text-[#e9edef] border-t-[#2a373f]">
        <DrawerHeader>
          <DrawerTitle className="text-[#e9edef]">
            Call with {activePeer.username}
          </DrawerTitle>
          <DrawerDescription className="text-[#8696a0]">
            {isDisconnected ? "Connection lost" : "Connected"}
          </DrawerDescription>
        </DrawerHeader>
        <CallContent />
      </DrawerContent>
    </Drawer>
  );
}