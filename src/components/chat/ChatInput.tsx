
"use client";

import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SendHorizonal, Smile } from 'lucide-react'; // Using SendHorizonal
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from '@/lib/utils'; // Import cn

interface ChatInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onSubmit: (input: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// Simple list of emojis - can be expanded or use a library
const emojis = ["😀", "😂", "😊", "😍", "🤔", "👍", "🎉", "💡", "📚", "🚀", "✨", "🧠", "🧑‍🎓", "🎯", "😕"];


const ChatInput = React.forwardRef<HTMLInputElement, ChatInputProps>(
    ({ onSubmit, disabled = false, placeholder = "Send a message...", className, ...props }, ref) => {
      const [input, setInput] = useState('');

      const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (input.trim() && !disabled) {
          onSubmit(input.trim());
          setInput('');
        }
      };

      const handleEmojiSelect = (emoji: string) => {
        setInput(prev => prev + emoji);
         // Keep focus on input after emoji select
        if (ref && 'current' in ref && ref.current) {
          ref.current.focus();
        }
      };

      return (
        <form
          onSubmit={handleSubmit}
          className={cn("flex items-center gap-2 border-t border-border p-3 bg-background", className)}
        >
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" type="button" className="text-muted-foreground hover:text-primary" disabled={disabled}>
                <Smile className="w-5 h-5" />
                <span className="sr-only">Add emoji</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2 grid grid-cols-5 gap-1 bg-popover border-popover shadow-lg">
              {emojis.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEmojiSelect(emoji)}
                  className="text-xl hover:bg-accent"
                >
                  {emoji}
                </Button>
              ))}
            </PopoverContent>
          </Popover>

          <Input
            ref={ref} // Attach the forwarded ref here
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-input border-input focus-visible:ring-primary focus-visible:ring-offset-0"
            aria-label="Chat message input"
            {...props}
          />
          <Button type="submit" disabled={disabled || !input.trim()} size="icon" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <SendHorizonal className="w-5 h-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      );
    }
);

ChatInput.displayName = 'ChatInput'; // Set display name for the forwarded ref component

export default ChatInput;
