import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, QrCode, Link as LinkIcon, UserPlus } from "lucide-react";
import { useChatStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export function ConnectionDialog() {
  const [open, setOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [peerIdToConnect, setPeerIdToConnect] = useState("");
  const { peerId, peer, username, addConnection } = useChatStore();
  const { toast } = useToast();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const shareLink = `${window.location.origin}?connect=${encodeURIComponent(JSON.stringify({ peerId, username }))}`;

  const handleConnect = () => {
    if (!peer || !peerIdToConnect) return;
    
    try {
      if (peerIdToConnect.includes('?connect=')) {
        const url = new URL(peerIdToConnect);
        const connectParam = url.searchParams.get('connect');
        if (connectParam) {
          const { peerId: targetPeerId, username: targetUsername } = JSON.parse(decodeURIComponent(connectParam));
          const conn = peer.connect(targetPeerId);
          
          conn.on("open", () => {
            conn.send({ type: "USER_INFO", username });
            addConnection(targetPeerId, { connection: conn, username: targetUsername });
            toast({
              title: "Connected!",
              description: `Connected to ${targetUsername}`,
            });
            setOpen(false);
          });

          conn.on("error", () => {
            toast({
              title: "Connection Failed",
              description: "Failed to connect to peer",
              variant: "destructive",
            });
          });

          conn.on("data", (data: any) => {
            if (data.type === "USER_INFO") {
              addConnection(conn.peer, { connection: conn, username: data.username });
            }
          });
          return;
        }
      }
      
      const conn = peer.connect(peerIdToConnect);
      
      conn.on("open", () => {
        conn.send({ type: "USER_INFO", username });
        addConnection(peerIdToConnect, { connection: conn, username: "Unknown" });
        toast({
          title: "Connected!",
          description: "Connected successfully",
        });
        setOpen(false);
      });

      conn.on("error", () => {
        toast({
          title: "Connection Failed",
          description: "Failed to connect to peer",
          variant: "destructive",
        });
      });

      conn.on("data", (data: any) => {
        if (data.type === "USER_INFO") {
          addConnection(conn.peer, { connection: conn, username: data.username });
        }
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Invalid peer ID or share link",
        variant: "destructive",
      });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: "Copied!",
      description: "Share link copied to clipboard",
    });
  };

  const content = (
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
          <Button onClick={handleConnect} className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-white">
            Connect
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
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
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button className="w-full bg-[#00a884] hover:bg-[#00a884]/90 text-white">
          <UserPlus className="w-5 h-5 mr-2" />
          New Chat
        </Button>
      </DrawerTrigger>
      <DrawerContent className="bg-[#202c33] text-[#e9edef] border-t-[#2a373f]">
        <DrawerHeader>
          <DrawerTitle className="text-[#e9edef]">Connect with Friends</DrawerTitle>
          <DrawerDescription className="text-[#8696a0]">
            Share your details or connect with others
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4">
          {content}
        </div>
      </DrawerContent>
    </Drawer>
  );
}