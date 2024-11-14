import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Mic, Smile } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  message: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isDisabled: boolean;
}

export function ChatInput({ message, onChange, onSend, isDisabled }: ChatInputProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
      className="flex items-center gap-2 p-2"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            type="button" 
            size="icon" 
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            <Smile className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Emoji</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            type="button" 
            size="icon" 
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Attach</TooltipContent>
      </Tooltip>

      <Input
        value={message}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a message"
        className="flex-1"
        disabled={isDisabled}
      />

      <Button 
        type="submit" 
        size="icon"
        variant="ghost"
        disabled={!message.trim() || isDisabled}
        className={cn(
          "text-muted-foreground hover:text-foreground",
          message.trim() && "text-primary hover:text-primary"
        )}
      >
        {message.trim() ? (
          <Send className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>
    </form>
  );
}