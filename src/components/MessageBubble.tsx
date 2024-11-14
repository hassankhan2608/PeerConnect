import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Message } from "@/lib/store";
import { Phone, PhoneOff } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  showAvatar: boolean;
  isCurrentUser: boolean;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function MessageBubble({
  message,
  isFirstInGroup,
  isLastInGroup,
  isCurrentUser
}: MessageBubbleProps) {
  if (message.type === 'system' || message.type === 'call_started' || message.type === 'call_ended') {
    return (
      <div className="flex justify-center px-4 py-2">
        <div className="flex items-center gap-2 bg-[#202c33] px-3 py-1.5 rounded-lg text-sm text-[#8696a0]">
          {message.type === 'call_started' && <Phone className="w-4 h-4" />}
          {message.type === 'call_ended' && <PhoneOff className="w-4 h-4" />}
          <span>
            {message.content}
            {message.duration && ` • ${formatDuration(message.duration)}`}
          </span>
          <span className="text-xs">
            {format(message.timestamp, "HH:mm")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex w-full px-4 md:px-8 lg:px-16 xl:px-24 2xl:px-32",
      isCurrentUser ? "justify-end" : "justify-start",
      !isFirstInGroup && "mt-1"
    )}>
      <div className={cn(
        "min-w-0 break-words",
        isCurrentUser ? "bg-[#005c4b]" : "bg-[#202c33]",
        "px-3 py-2 rounded-lg",
        "max-w-[85%] sm:max-w-[75%] md:max-w-[65%] lg:max-w-[60%]",
        isFirstInGroup && isCurrentUser && "rounded-tr-sm",
        isFirstInGroup && !isCurrentUser && "rounded-tl-sm",
        isLastInGroup && isCurrentUser && "rounded-br-sm",
        isLastInGroup && !isCurrentUser && "rounded-bl-sm"
      )}>
        <p className="text-[#e9edef] text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[11px] text-[#8696a0] shrink-0">
            {format(message.timestamp, "HH:mm")}
          </span>
        </div>
      </div>
    </div>
  );
}