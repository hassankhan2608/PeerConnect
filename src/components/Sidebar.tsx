import { useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ConnectionDialog } from './ConnectionDialog';
import { useChatStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { User2, AlertCircle, MessageSquarePlus } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/components/theme-provider';

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
  }, [setTheme]);

  return (
    <div className="h-full flex flex-col bg-[#111b21]">
      <div className="p-4 bg-[#202c33] sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-[#00a884]/10 text-[#00a884]">
                {username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-[#e9edef] font-semibold">{username}</h2>
              <p className="text-sm text-[#8696a0]">Online</p>
            </div>
          </div>
        </div>
        <ConnectionDialog />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {Array.from(connections.entries()).map(([peerId, info]) => {
            const isDisconnected =
              connectionStatus.get(peerId) === 'disconnected';
            const unreadCount = unreadCounts.get(peerId) || 0;
            const peerMessages = messages.get(peerId) || [];
            const lastMessage = peerMessages[peerMessages.length - 1];

            return (
              <Button
                key={peerId}
                variant="ghost"
                className={cn(
                  'w-full justify-start px-3 py-3 h-auto space-y-1',
                  activeChat === peerId ? 'bg-[#2a3942]' : 'hover:bg-[#202c33]',
                  'transition-colors'
                )}
                onClick={() => setActiveChat(peerId)}
              >
                <div className="flex items-start w-full gap-3">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback
                      className={cn(
                        'text-lg',
                        isDisconnected
                          ? 'bg-[#202c33] text-[#8696a0]'
                          : 'bg-[#00a884]/10 text-[#00a884]'
                      )}
                    >
                      {info.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[#e9edef] truncate">
                        {info.username}
                      </span>
                      {lastMessage && (
                        <span className="text-xs text-[#8696a0]">
                          {format(lastMessage.timestamp, 'HH:mm')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {isDisconnected ? (
                        <span className="text-red-400 text-xs flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Offline
                        </span>
                      ) : lastMessage ? (
                        <p className="text-[#8696a0] truncate">
                          {lastMessage.sender === username ? 'You: ' : ''}
                          {lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-[#8696a0] text-sm italic">
                          No messages yet
                        </p>
                      )}
                      {unreadCount > 0 && (
                        <Badge className="ml-auto bg-[#00a884] hover:bg-[#00a884]/90 text-white">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}

          {connections.size === 0 && (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center text-[#8696a0]">
              <MessageSquarePlus className="h-12 w-12 mb-4 text-[#00a884]" />
              <h3 className="text-lg font-semibold text-[#e9edef] mb-2">
                Start a conversation
              </h3>
              <p className="text-sm">
                Click "New Chat" to connect with someone
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
