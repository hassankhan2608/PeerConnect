import { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ConnectionDialog } from './ConnectionDialog';
import { useChatStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { MessageSquarePlus, Github, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/components/theme-provider';
import { ModeToggle } from './mode-toggle';
import { Card } from '@/components/ui/card';

export function Sidebar() {
  const {
    connections,
    activeChat,
    setActiveChat,
    username,
    connectionStatus,
    unreadCounts,
    messages,
  } = useChatStore();

  const { setTheme } = useTheme();

  useEffect(() => {
    setTheme('dark');
  }, []);

  return (
    <div className="h-full flex flex-col bg-background">
      <Card className="m-4 mb-0">
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                PeerPulse
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="https://github.com/stackblitz/bolt-chat"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <ModeToggle />
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="font-medium truncate">{username}</h2>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm text-muted-foreground">Online</p>
              </div>
            </div>
          </div>

          <ConnectionDialog />
        </div>
      </Card>

      <div className="px-4 py-2">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          Active Chats
        </h3>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-2">
          {Array.from(connections.entries()).map(([peerId, info]) => {
            const isDisconnected = connectionStatus.get(peerId) === 'disconnected';
            const unreadCount = unreadCounts.get(peerId) || 0;
            const peerMessages = messages.get(peerId) || [];
            const lastMessage = peerMessages[peerMessages.length - 1];

            return (
              <Card
                key={peerId}
                className={cn(
                  'transition-all hover:shadow-md cursor-pointer',
                  activeChat === peerId && 'ring-2 ring-primary/20',
                  isDisconnected && 'opacity-70'
                )}
                onClick={() => setActiveChat(peerId)}
              >
                <div className="p-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback
                        className={cn(
                          'font-medium',
                          isDisconnected
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-primary/10 text-primary'
                        )}
                      >
                        {info.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">
                          {info.username}
                        </span>
                        {lastMessage && (
                          <span className="text-xs text-muted-foreground">
                            {format(lastMessage.timestamp, 'HH:mm')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isDisconnected ? (
                          <span className="text-destructive text-xs">
                            Offline
                          </span>
                        ) : lastMessage ? (
                          <p className="text-sm text-muted-foreground truncate">
                            {lastMessage.sender === username ? 'You: ' : ''}
                            {lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No messages yet
                          </p>
                        )}
                        {unreadCount > 0 && (
                          <Badge
                            variant="default"
                            className="ml-auto bg-primary hover:bg-primary"
                          >
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {connections.size === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <MessageSquarePlus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">Start Chatting</h3>
              <p className="text-sm text-muted-foreground max-w-[15rem]">
                Click "New Chat" above to connect with someone and start a conversation
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}