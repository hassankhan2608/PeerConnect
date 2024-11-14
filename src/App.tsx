import { useEffect } from "react";
import { Peer } from "peerjs";
import { uniqueNamesGenerator, adjectives, colors, animals } from "unique-names-generator";
import { useChatStore } from "./lib/store";
import { Sidebar } from "./components/Sidebar";
import { Chat } from "./components/Chat";
import { CallDialog } from "./components/CallDialog";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";

function App() {
  const { toast } = useToast();
  const { 
    username, 
    setUsername, 
    setPeerId, 
    setPeer, 
    addConnection, 
    removeConnection,
    addMessage,
    activeChat,
    updateConnectionStatus,
    setTypingStatus,
    incrementUnread,
    setCallStatus,
    setActiveCall,
    setMediaConnection,
    setLocalStream,
    setRemoteStream,
  } = useChatStore();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connectParam = urlParams.get('connect');
    
    if (!username) {
      const randomName = uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals],
        separator: "",
        style: "capital",
        seed: Date.now(),
      });
      setUsername(randomName);
    }

    const peer = new Peer({
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peer.on("open", (id) => {
      setPeerId(id);
      setPeer(peer);
      
      if (connectParam) {
        try {
          const { peerId: targetPeerId, username: targetUsername } = JSON.parse(decodeURIComponent(connectParam));
          const conn = peer.connect(targetPeerId);
          
          conn.on("open", () => {
            conn.send({ type: "USER_INFO", username });
            addConnection(targetPeerId, { connection: conn, username: targetUsername });
            updateConnectionStatus(targetPeerId, 'connected');
          });

          conn.on("close", () => {
            updateConnectionStatus(targetPeerId, 'disconnected');
          });

          conn.on("error", () => {
            updateConnectionStatus(targetPeerId, 'disconnected');
          });

          setupConnectionHandlers(conn);
        } catch (e) {
          console.error("Invalid connection parameters");
        }
      }
    });

    peer.on("connection", (conn) => {
      conn.on("open", () => {
        conn.send({ type: "USER_INFO", username });
        updateConnectionStatus(conn.peer, 'connected');
      });

      conn.on("close", () => {
        updateConnectionStatus(conn.peer, 'disconnected');
      });

      conn.on("error", () => {
        updateConnectionStatus(conn.peer, 'disconnected');
      });

      setupConnectionHandlers(conn);
    });

    peer.on("call", async (call) => {
      const caller = useChatStore.getState().connections.get(call.peer);
      const callerName = caller?.username || "Someone";

      const toastId = toast({
        title: "Incoming Call",
        description: `${callerName} is calling you`,
        duration: 30000,
        action: (
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                      echoCancellation: true,
                      noiseSuppression: true,
                      autoGainControl: true
                    }
                  });
                  
                  call.answer(stream);
                  setLocalStream(stream);
                  setMediaConnection(call);
                  setCallStatus(call.peer, 'ongoing');
                  setActiveCall(call.peer);

                  call.on('stream', (remoteStream) => {
                    setRemoteStream(remoteStream);
                  });

                  call.on('close', () => {
                    stream.getTracks().forEach(track => track.stop());
                    setLocalStream(null);
                    setRemoteStream(null);
                    setMediaConnection(null);
                    setCallStatus(call.peer, 'ended');
                    setActiveCall(null);
                  });

                  toast.dismiss(toastId);
                } catch (error) {
                  console.error('Microphone access error:', error);
                  toast({
                    title: "Call Failed",
                    description: "Please allow microphone access in your browser settings",
                    variant: "destructive",
                  });
                }
              }}
              className="bg-[#00a884] text-white px-3 py-1 rounded-md hover:bg-[#00a884]/90"
            >
              Accept
            </button>
            <button
              onClick={() => {
                call.close();
                setCallStatus(call.peer, 'ended');
                toast.dismiss(toastId);
              }}
              className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600"
            >
              Decline
            </button>
          </div>
        ),
      });
    });

    peer.on("disconnected", () => {
      const activeConnections = useChatStore.getState().connections;
      Array.from(activeConnections.keys()).forEach(peerId => {
        updateConnectionStatus(peerId, 'disconnected');
      });
    });

    return () => {
      peer.destroy();
    };
  }, [username]);

  const setupConnectionHandlers = (conn: any) => {
    conn.on("data", (data: any) => {
      if (data.type === "USER_INFO") {
        addConnection(conn.peer, { connection: conn, username: data.username });
      } else if (data.type === "TYPING_START") {
        setTypingStatus(conn.peer, true);
      } else if (data.type === "TYPING_END") {
        setTypingStatus(conn.peer, false);
      } else if (data.type === "CALL_REQUEST") {
        setCallStatus(conn.peer, 'ringing');
      } else if (data.type === "CALL_END") {
        setCallStatus(conn.peer, 'ended');
        setActiveCall(null);
        const mediaConn = useChatStore.getState().mediaConnection;
        if (mediaConn) {
          mediaConn.close();
        }
      } else {
        addMessage(conn.peer, data);
        if (activeChat !== conn.peer) {
          incrementUnread(conn.peer);
        }
      }
    });

    // Monitor connection state
    conn.peerConnection.addEventListener('connectionstatechange', () => {
      const state = conn.peerConnection.connectionState;
      updateConnectionStatus(conn.peer, state === 'connected' ? 'connected' : 'disconnected');
    });
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <div className="h-screen w-full bg-[#111b21] flex overflow-hidden">
        <div className={cn(
          "h-full transition-all duration-300 ease-in-out flex-shrink-0 border-r border-[#2a373f]",
          activeChat ? "hidden md:block w-[380px] 2xl:w-[420px]" : "w-full md:w-[380px] 2xl:w-[420px]"
        )}>
          <Sidebar />
        </div>
        <div className={cn(
          "h-full transition-all duration-300 ease-in-out flex-grow min-w-0",
          activeChat ? "w-full" : "hidden md:block"
        )}>
          <Chat />
        </div>
        <CallDialog />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;