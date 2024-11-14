import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Message } from "@/lib/store";

interface MessageBubbleProps {
  message: Message;
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  showAvatar: boolean;
  isCurrentUser: boolean;
}

export function MessageBubble({
  message,
  isFirstInGroup,
  isLastInGroup,
  isCurrentUser
}: MessageBubbleProps) {
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