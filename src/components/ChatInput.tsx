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
    <div className="border-t border-[#2a373f] bg-[#202c33] p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
        className="flex gap-2 max-w-3xl mx-auto items-center"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              type="button" 
              size="icon" 
              variant="ghost"
              className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#384147]"
            >
              <Smile className="h-6 w-6" />
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
              className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#384147]"
            >
              <Paperclip className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Attach</TooltipContent>
        </Tooltip>

        <Input
          value={message}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type a message"
          className="flex-1 bg-[#2a3942] border-0 text-[#d1d7db] placeholder:text-[#8696a0] focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={isDisabled}
        />

        <Button 
          type="submit" 
          size="icon"
          variant="ghost"
          disabled={!message.trim() || isDisabled}
          className={cn(
            "text-[#8696a0] hover:text-[#e9edef] hover:bg-[#384147]",
            message.trim() && "text-[#00a884] hover:text-[#00a884]"
          )}
        >
          {message.trim() ? (
            <Send className="h-6 w-6" />
          ) : (
            <Mic className="h-6 w-6" />
          )}
        </Button>
      </form>
    </div>
  );
}