import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Mic, 
  MicOff, 
  PhoneOff, 
  Video, 
  VideoOff,
  Maximize2,
  Minimize2
} from "lucide-react";
import { useChatStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Ringtone } from "./Ringtone";

export function VideoCallDialog() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  
  const {
    activeVideoCall,
    connections,
    localStream,
    remoteStream,
    setActiveVideoCall,
    setCallStatus,
    setLocalStream,
    setRemoteStream,
    setMediaConnection,
    connectionStatus,
    callStatus,
    mediaConnection,
    incomingVideoCall,
    setIncomingVideoCall,
  } = useChatStore();

  const activePeer = activeVideoCall ? connections.get(activeVideoCall) : null;
  const incomingPeer = incomingVideoCall ? connections.get(incomingVideoCall.peerId) : null;
  const isDisconnected = activeVideoCall ? connectionStatus.get(activeVideoCall) === 'disconnected' : false;
  const currentCallStatus = activeVideoCall ? callStatus.get(activeVideoCall) : 'none';

  // Handle local video stream
  useEffect(() => {
    const setupLocalVideo = async () => {
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
        try {
          // Ensure video playback starts
          await localVideoRef.current.play();
        } catch (error) {
          console.error('Local video playback failed:', error);
          // Retry play on user interaction if needed
          const playOnInteraction = async () => {
            try {
              await localVideoRef.current?.play();
              document.removeEventListener('click', playOnInteraction);
            } catch (e) {
              console.error('Retry local video playback failed:', e);
            }
          };
          document.addEventListener('click', playOnInteraction);
        }
      }
    };

    setupLocalVideo();
  }, [localStream]);

  // Handle remote video stream
  useEffect(() => {
    const setupRemoteVideo = async () => {
      if (remoteVideoRef.current && remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
        try {
          // Ensure video playback starts
          await remoteVideoRef.current.play();
        } catch (error) {
          console.error('Remote video playback failed:', error);
          // Retry play on user interaction if needed
          const playOnInteraction = async () => {
            try {
              await remoteVideoRef.current?.play();
              document.removeEventListener('click', playOnInteraction);
            } catch (e) {
              console.error('Retry remote video playback failed:', e);
            }
          };
          document.addEventListener('click', playOnInteraction);
        }
      }
    };

    setupRemoteVideo();
  }, [remoteStream]);

  useEffect(() => {
    if (isDisconnected) {
      handleEndCall();
    }
  }, [isDisconnected]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const handleEndCall = async () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    setLocalStream(null);
    setRemoteStream(null);
    setMediaConnection(null);
    if (activeVideoCall) {
      setCallStatus(activeVideoCall, 'ended');
      const peer = connections.get(activeVideoCall);
      if (peer && peer.connection.open) {
        peer.connection.send({ type: "VIDEO_CALL_END" });
      }
    }
    setActiveVideoCall(null);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
  };

  const handleAcceptCall = async () => {
    if (!incomingVideoCall) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      incomingVideoCall.call.answer(stream);
      setLocalStream(stream);
      setMediaConnection(incomingVideoCall.call);
      setCallStatus(incomingVideoCall.peerId, 'ongoing');
      setActiveVideoCall(incomingVideoCall.peerId);

      incomingVideoCall.call.on('stream', (remoteStream) => {
        setRemoteStream(remoteStream);
      });

      incomingVideoCall.call.on('close', () => {
        stream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        setRemoteStream(null);
        setMediaConnection(null);
        setCallStatus(incomingVideoCall.peerId, 'ended');
        setActiveVideoCall(null);
      });

      setIncomingVideoCall(null);
    } catch (error) {
      console.error('Camera/Microphone access error:', error);
    }
  };

  const handleRejectCall = () => {
    if (!incomingVideoCall) return;
    incomingVideoCall.call.close();
    setCallStatus(incomingVideoCall.peerId, 'ended');
    setIncomingVideoCall(null);
  };

  const handleCallTimeout = () => {
    if (incomingVideoCall) {
      handleRejectCall();
    } else if (currentCallStatus === 'ringing') {
      handleEndCall();
    }
  };

  if (!activeVideoCall && !incomingVideoCall) return null;

  const dialogContent = (
    <div className={cn(
      "relative flex flex-col",
      isDesktop ? "h-[600px]" : "h-screen"
    )}>
      {incomingVideoCall && incomingPeer ? (
        <>
          <Ringtone play={true} onEnd={handleCallTimeout} />
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-4xl text-primary">
                {incomingPeer.username.slice(0, 2).toUpperCase()}
              </span>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-semibold">
                {incomingPeer.username}
              </h3>
              <p className="text-muted-foreground animate-pulse">
                Incoming video call...
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="destructive"
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={handleRejectCall}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                onClick={handleAcceptCall}
              >
                <Video className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </>
      ) : activePeer && (
        <>
          <Ringtone play={currentCallStatus === 'ringing'} onEnd={handleCallTimeout} />
          
          <div className="relative flex-1 bg-black">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-4xl text-primary">
                    {activePeer.username.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {localStream && (
              <div className="absolute bottom-4 right-4 w-32 h-48 bg-black rounded-lg overflow-hidden shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                  style={{ transform: 'scaleX(-1)' }} // Mirror effect for selfie view
                />
              </div>
            )}
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 p-4 rounded-full bg-black/50 backdrop-blur-sm">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-12 w-12 rounded-full",
                isMuted && "bg-destructive/10 text-destructive hover:bg-destructive/20"
              )}
              onClick={toggleMute}
            >
              {isMuted ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="destructive"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={handleEndCall}
            >
              <PhoneOff className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-12 w-12 rounded-full",
                !isVideoEnabled && "bg-destructive/10 text-destructive hover:bg-destructive/20"
              )}
              onClick={toggleVideo}
            >
              {isVideoEnabled ? (
                <Video className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );

  if (isDesktop && !isFullscreen) {
    return (
      <Dialog 
        open={!!(activeVideoCall || incomingVideoCall)} 
        onOpenChange={() => {
          if (activeVideoCall) handleEndCall();
          if (incomingVideoCall) handleRejectCall();
        }}
      >
        <DialogContent className="sm:max-w-[800px]">
          {dialogContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-background",
      !(activeVideoCall || incomingVideoCall) && "hidden"
    )}>
      {dialogContent}
    </div>
  );
}