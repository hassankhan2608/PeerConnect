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
      "flex w-full",
      isCurrentUser ? "justify-end" : "justify-start",
      !isFirstInGroup && "mt-1.5"
    )}>
      <div className={cn(
        "relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%]",
        isCurrentUser ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground",
        "rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm",
        isCurrentUser ? "rounded-br-sm" : "rounded-bl-sm",
        "transition-all duration-200 hover:shadow-md"
      )}>
        <p className="text-[13px] sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>
        <div className="flex items-center justify-end gap-1 mt-0.5">
          <span className="text-[10px] sm:text-[11px] opacity-70">
            {format(message.timestamp, "HH:mm")}
          </span>
        </div>
      </div>
    </div>
  );
}