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
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="share">Share</TabsTrigger>
        <TabsTrigger value="connect">Connect</TabsTrigger>
      </TabsList>
      <TabsContent value="share" className="space-y-4">
        <div className="space-y-4">
          <div className="p-4 rounded-lg space-y-2 bg-primary/5">
            <div className="text-sm font-medium text-muted-foreground">Your Details</div>
            <div className="text-2xl font-bold">{username}</div>
            <div className="text-sm text-muted-foreground font-mono break-all">
              {peerId}
            </div>
          </div>
          
          <div className="grid gap-2">
            <Button 
              variant="outline" 
              onClick={copyLink}
              className="bg-primary/10 hover:bg-primary/20 text-primary-800 border-primary/20"
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Copy Share Link
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowQR(!showQR)}
              className="bg-primary/10 hover:bg-primary/20 text-primary-800 border-primary/20"
            >
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
          />
          <Button 
            onClick={handleConnect} 
            className="w-full bg-primary/10 hover:bg-primary/20 text-primary-800 border-primary/20"
          >
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
          <Button className="w-full bg-primary/10 hover:bg-primary/20 text-primary-800 border-primary/20">
            <UserPlus className="w-5 h-5 mr-2" />
            New Chat
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect with Friends</DialogTitle>
            <DialogDescription>
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
        <Button className="w-full bg-primary/10 hover:bg-primary/20 text-primary-800 border-primary/20">
          <UserPlus className="w-5 h-5 mr-2" />
          New Chat
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Connect with Friends</DrawerTitle>
          <DrawerDescription>
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