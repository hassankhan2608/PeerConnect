import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, PhoneOff, Phone } from "lucide-react";
import { useChatStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AudioVisualizer } from "./AudioVisualizer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Ringtone } from "./Ringtone";
import { ScrollArea } from "./ui/scroll-area";

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
    mediaConnection,
    incomingCall,
    setIncomingCall,
  } = useChatStore();

  const activePeer = activeCall ? connections.get(activeCall) : null;
  const incomingPeer = incomingCall ? connections.get(incomingCall.peerId) : null;
  const isDisconnected = activeCall ? connectionStatus.get(activeCall) === 'disconnected' : false;
  const currentCallStatus = activeCall ? callStatus.get(activeCall) : 'none';

  useEffect(() => {
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream;
      localAudioRef.current.play().catch(error => {
        console.error('Local audio playback failed:', error);
      });
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(error => {
        console.error('Remote audio playback failed:', error);
      });
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
    if (!incomingCall) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      incomingCall.call.answer(stream);
      setLocalStream(stream);
      setMediaConnection(incomingCall.call);
      setCallStatus(incomingCall.peerId, 'ongoing');
      setActiveCall(incomingCall.peerId);

      incomingCall.call.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
      });

      incomingCall.call.on('close', () => {
        stream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        setRemoteStream(null);
        setMediaConnection(null);
        setCallStatus(incomingCall.peerId, 'ended');
        setActiveCall(null);
      });

      setIncomingCall(null);
    } catch (error) {
      console.error('Microphone access error:', error);
    }
  };

  const handleRejectCall = () => {
    if (!incomingCall) return;
    incomingCall.call.close();
    setCallStatus(incomingCall.peerId, 'ended');
    setIncomingCall(null);
  };

  const handleCallTimeout = () => {
    if (incomingCall) {
      handleRejectCall();
    } else if (currentCallStatus === 'ringing') {
      handleEndCall();
    }
  };

  if (!activeCall && !incomingCall) return null;

  const dialogContent = (
    <ScrollArea className="max-h-[80vh] overflow-y-auto">
      <div className="flex flex-col items-center space-y-4 p-4">
        {incomingCall && incomingPeer ? (
          <>
            <Ringtone play={true} onEnd={handleCallTimeout} />
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <span className="text-3xl sm:text-4xl text-primary-800">
                {incomingPeer.username.slice(0, 2).toUpperCase()}
              </span>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-semibold truncate max-w-[200px] sm:max-w-[300px]">
                {incomingPeer.username}
              </h3>
              <p className="text-sm text-muted-foreground animate-pulse">
                Incoming call...
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="destructive"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={handleRejectCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full bg-primary/10 hover:bg-primary/20 text-primary-800 border-primary/20"
                onClick={handleAcceptCall}
              >
                <Phone className="h-6 w-6" />
              </Button>
            </div>
          </>
        ) : activePeer && (
          <>
            <Ringtone play={currentCallStatus === 'ringing'} onEnd={handleCallTimeout} />
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl sm:text-4xl text-primary-800">
                {activePeer.username.slice(0, 2).toUpperCase()}
              </span>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base sm:text-lg font-semibold truncate max-w-[200px] sm:max-w-[300px]">
                {activePeer.username}
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentCallStatus === 'ringing' ? 'Calling...' : 'Connected'}
              </p>
            </div>

            {currentCallStatus !== 'ringing' && (
              <div className="space-y-2 w-full">
                <div className="flex items-center justify-between px-4">
                  <span className="text-sm text-muted-foreground">Your audio</span>
                  <AudioVisualizer 
                    stream={localStream} 
                    className="bg-primary/5 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between px-4">
                  <span className="text-sm text-muted-foreground truncate max-w-[100px]">
                    {activePeer.username}'s audio
                  </span>
                  <AudioVisualizer 
                    stream={remoteStream}
                    className="bg-primary/5 rounded"
                  />
                </div>
              </div>
            )}

            <audio ref={localAudioRef} autoPlay muted className="hidden" />
            <audio ref={remoteAudioRef} autoPlay className="hidden" />
            
            <div className="flex gap-4">
              <Button
                variant="destructive"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={handleEndCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>

            {isDisconnected && (
              <div className="text-destructive text-sm text-center">
                Connection lost. Call will end automatically.
              </div>
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );

  if (isDesktop) {
    return (
      <Dialog open={!!(activeCall || incomingCall)} onOpenChange={() => {
        if (activeCall) handleEndCall();
        if (incomingCall) handleRejectCall();
      }}>
        <DialogContent className="sm:max-w-md">
          {dialogContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={!!(activeCall || incomingCall)} onOpenChange={() => {
      if (activeCall) handleEndCall();
      if (incomingCall) handleRejectCall();
    }}>
      <DrawerContent>
        {dialogContent}
      </DrawerContent>
    </Drawer>
  );
}