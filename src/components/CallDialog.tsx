import { useEffect, useRef } from "react";
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
import { Mic, MicOff, PhoneOff, Phone } from "lucide-react";
import { useChatStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AudioVisualizer } from "./AudioVisualizer";
import { useMediaQuery } from "@/hooks/use-media-query";

export function CallDialog() {
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
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
    callStatus,
  } = useChatStore();

  const activePeer = activeCall ? connections.get(activeCall) : null;
  const isDisconnected = activeCall ? connectionStatus.get(activeCall) === 'disconnected' : false;
  const currentCallStatus = activeCall ? callStatus.get(activeCall) : null;
  const isIncomingCall = currentCallStatus === 'ringing' && !localStream;

  useEffect(() => {
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (isDisconnected) {
      handleEndCall();
    }
  }, [isDisconnected]);

  const handleEndCall = async () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setMediaConnection(null);
    if (activeCall) {
      setCallStatus(activeCall, 'ended');
      const peer = connections.get(activeCall);
      if (peer && peer.connection.open) {
        peer.connection.send({ type: "CALL_END" });
      }
    }
    setActiveCall(null);
  };

  const handleAcceptCall = async () => {
    if (!activePeer) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      setLocalStream(stream);
      setCallStatus(activePeer.connection.peer, 'ongoing');
    } catch (error) {
      console.error('Microphone access error:', error);
      handleEndCall();
    }
  };

  const CallContent = () => (
    <div className="flex flex-col items-center space-y-4">
      <div className="w-24 h-24 rounded-full bg-[#00a884]/10 flex items-center justify-center">
        <span className="text-4xl text-[#00a884]">
          {activePeer?.username.slice(0, 2).toUpperCase()}
        </span>
      </div>

      <div className="text-center">
        <h3 className="text-lg font-semibold text-[#e9edef]">
          {activePeer?.username}
        </h3>
        <p className="text-[#8696a0]">
          {isIncomingCall ? "Incoming call..." : "On call"}
        </p>
      </div>

      {!isIncomingCall && (
        <div className="space-y-2 w-full">
          <div className="flex items-center justify-between px-4">
            <span className="text-sm text-[#8696a0]">Your audio</span>
            <AudioVisualizer 
              stream={localStream} 
              className="bg-[#111b21] rounded"
            />
          </div>
          
          <div className="flex items-center justify-between px-4">
            <span className="text-sm text-[#8696a0]">{activePeer?.username}'s audio</span>
            <AudioVisualizer 
              stream={remoteStream}
              className="bg-[#111b21] rounded"
            />
          </div>
        </div>
      )}

      <audio ref={localAudioRef} autoPlay muted className="hidden" />
      <audio ref={remoteAudioRef} autoPlay className="hidden" />
      
      <div className="flex gap-4">
        {isIncomingCall ? (
          <>
            <Button
              variant="default"
              size="icon"
              className="h-12 w-12 rounded-full bg-[#00a884] hover:bg-[#00a884]/90"
              onClick={handleAcceptCall}
            >
              <Phone className="h-6 w-6" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={handleEndCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </>
        ) : (
          <Button
            variant="destructive"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={handleEndCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        )}
      </div>

      {isDisconnected && (
        <div className="text-red-400 text-sm">
          Connection lost. Call will end automatically.
        </div>
      )}
    </div>
  );

  if (!activeCall || !activePeer) return null;

  if (isDesktop) {
    return (
      <Dialog open={!!activeCall} onOpenChange={() => handleEndCall()}>
        <DialogContent className="sm:max-w-md bg-[#202c33] text-[#e9edef] border-[#2a373f]">
          <DialogHeader>
            <DialogTitle className="text-[#e9edef]">
              {isIncomingCall ? "Incoming Call" : "Call in Progress"}
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
            {isIncomingCall ? "Incoming Call" : "Call in Progress"}
          </DrawerTitle>
          <DrawerDescription className="text-[#8696a0]">
            {isDisconnected ? "Connection lost" : "Connected"}
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4">
          <CallContent />
        </div>
      </DrawerContent>
    </Drawer>
  );
}