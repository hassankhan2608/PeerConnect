import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, QrCode, Link as LinkIcon, UserPlus } from "lucide-react";
import { useChatStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export function ConnectionDialog() {
  const [showQR, setShowQR] = useState(false);
  const [peerIdToConnect, setPeerIdToConnect] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const { peerId, peer, username, addConnection } = useChatStore();
  const { toast } = useToast();

  const shareLink = `${window.location.origin}${window.location.pathname}?connect=${encodeURIComponent(JSON.stringify({ peerId, username }))}`;

  const handleConnect = async () => {
    if (!peer || !peerIdToConnect || isConnecting) return;
    
    setIsConnecting(true);
    const toastId = toast({
      title: "Connecting...",
      description: "Please wait while we establish the connection",
    });

    try {
      if (peerIdToConnect.includes('?connect=')) {
        const url = new URL(peerIdToConnect);
        const connectParam = url.searchParams.get('connect');
        if (connectParam) {
          const { peerId: targetPeerId, username: targetUsername } = JSON.parse(decodeURIComponent(connectParam));
          const conn = peer.connect(targetPeerId);
          
          // Set a connection timeout
          const timeout = setTimeout(() => {
            conn.close();
            throw new Error("Connection timed out");
          }, 15000);

          await new Promise((resolve, reject) => {
            conn.on("open", () => {
              clearTimeout(timeout);
              conn.send({ type: "USER_INFO", username });
              addConnection(targetPeerId, { connection: conn, username: targetUsername });
              toast.dismiss(toastId);
              toast({
                title: "Connected!",
                description: `Connected to ${targetUsername}`,
              });
              // Clear the connect param from URL
              const newUrl = new URL(window.location.href);
              newUrl.searchParams.delete('connect');
              window.history.replaceState({}, '', newUrl);
              resolve(null);
            });

            conn.on("error", (err) => {
              clearTimeout(timeout);
              reject(err);
            });
          });

          return;
        }
      }
      
      const conn = peer.connect(peerIdToConnect);
      
      // Set a connection timeout
      const timeout = setTimeout(() => {
        conn.close();
        throw new Error("Connection timed out");
      }, 15000);

      await new Promise((resolve, reject) => {
        conn.on("open", () => {
          clearTimeout(timeout);
          conn.send({ type: "USER_INFO", username });
          addConnection(peerIdToConnect, { connection: conn, username: "Unknown" });
          toast.dismiss(toastId);
          toast({
            title: "Connected!",
            description: "Connected successfully",
          });
          resolve(null);
        });

        conn.on("error", (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

    } catch (error) {
      toast.dismiss(toastId);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to peer",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
      setPeerIdToConnect("");
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Copied!",
      description: "Share link copied to clipboard",
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-white">
          <UserPlus className="w-5 h-5 mr-2" />
          New Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#202c33] text-[#e9edef] border-[#2a373f]">
        <DialogHeader>
          <DialogTitle className="text-[#e9edef]">Connect with Friends</DialogTitle>
          <DialogDescription className="text-[#8696a0]">
            Share your details or connect with others
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="share" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#111b21]">
            <TabsTrigger value="share" className="data-[state=active]:bg-[#2a3942]">Share</TabsTrigger>
            <TabsTrigger value="connect" className="data-[state=active]:bg-[#2a3942]">Connect</TabsTrigger>
          </TabsList>
          <TabsContent value="share" className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg space-y-2 bg-[#111b21]">
                <div className="text-sm font-medium text-[#8696a0]">Your Details</div>
                <div className="text-2xl font-bold text-[#e9edef]">{username}</div>
                <div className="text-sm text-[#8696a0] font-mono break-all">
                  {peerId}
                </div>
              </div>
              
              <div className="grid gap-2">
                <Button variant="outline" onClick={copyLink} className="bg-[#2a3942] border-[#2a373f] text-[#e9edef] hover:bg-[#384147]">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Copy Share Link
                </Button>
                <Button variant="outline" onClick={() => setShowQR(!showQR)} className="bg-[#2a3942] border-[#2a373f] text-[#e9edef] hover:bg-[#384147]">
                  <QrCode className="w-4 h-4 mr-2" />
                  {showQR ? "Hide QR Code" : "Show QR Code"}
                </Button>
              </div>
              
              {showQR && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <QRCodeSVG value={shareLink} size={200} />
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="connect" className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Paste share link or enter Peer ID"
                value={peerIdToConnect}
                onChange={(e) => setPeerIdToConnect(e.target.value)}
                className="bg-[#2a3942] border-[#2a373f] text-[#e9edef] placeholder:text-[#8696a0] focus-visible:ring-[#00a884] focus-visible:ring-offset-0"
              />
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-white disabled:opacity-50"
              >
                {isConnecting ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}