import { useEffect } from "react";
import { Peer } from "peerjs";
import { uniqueNamesGenerator, Config } from "unique-names-generator";
import { useChatStore } from "./lib/store";
import { Sidebar } from "./components/Sidebar";
import { Chat } from "./components/Chat";
import { CallDialog } from "./components/CallDialog";
import { VideoCallDialog } from "./components/VideoCallDialog";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

// Custom dictionaries for more interesting names
const heroes = [
  "Phoenix", "Shadow", "Storm", "Frost", "Nova", "Echo", "Blade", "Spark",
  "Quantum", "Cipher", "Vector", "Zenith", "Nebula", "Pulse", "Crystal", "Volt",
  "Atlas", "Omega", "Apex", "Titan", "Luna", "Solar", "Cosmic", "Star"
];

const mysteriousAdjectives = [
  "Mystic", "Astral", "Ethereal", "Cosmic", "Phantom", "Enigma", "Shadow",
  "Crystal", "Celestial", "Quantum", "Nebula", "Void", "Stellar", "Aurora",
  "Infinity", "Dream", "Echo", "Cyber", "Neo", "Prime", "Ultra", "Meta"
];

const nameConfig: Config = {
  dictionaries: [mysteriousAdjectives, heroes],
  separator: "",
  style: "capital",
  length: 2,
  maxLength: 16
};

function App() {
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
    setActiveVideoCall,
    setIncomingCall,
    setIncomingVideoCall,
    setMediaConnection,
    setLocalStream,
    setRemoteStream,
  } = useChatStore();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connectParam = urlParams.get('connect');
    
    if (!username) {
      let randomName;
      do {
        randomName = uniqueNamesGenerator({
          ...nameConfig,
          seed: Date.now() + Math.random(),
        });
      } while (randomName.length > nameConfig.maxLength);
      
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

    peer.on("call", (call) => {
      const isVideoCall = call.metadata?.type === 'video';
      
      if (isVideoCall) {
        setIncomingVideoCall({ peerId: call.peer, call });
      } else {
        setIncomingCall({ peerId: call.peer, call });
      }
      setCallStatus(call.peer, 'ringing');
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
      } else if (data.type === "VIDEO_CALL_REQUEST") {
        setCallStatus(conn.peer, 'ringing');
      } else if (data.type === "VIDEO_CALL_END") {
        setCallStatus(conn.peer, 'ended');
        setActiveVideoCall(null);
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
          activeChat ? "hidden md:block md:w-[380px] 2xl:w-[420px]" : "w-full md:w-[380px] 2xl:w-[420px]"
        )}>
          <Sidebar />
        </div>
        <div className={cn(
          "h-full transition-all duration-300 ease-in-out flex-grow min-w-0",
          activeChat ? "block w-full" : "hidden md:block"
        )}>
          <Chat />
        </div>
        <CallDialog />
        <VideoCallDialog />
        <Toaster />
      </div>
    </ThemeProvider>
  );
}

export default App;