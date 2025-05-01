
import React from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react'; // Keep User icon
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Message } from './ChatInterface'; // Import Message type

// Simple inline SVG for Gemini Logo (replace with a more accurate one if available)
const GeminiLogo = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-5 h-5 text-primary" // Use text-primary for color
    aria-hidden="true"
  >
    {/* Simplified representation */}
    <path d="M12 2L14.5 9H21.5L15.5 13.5L18 21L12 16.5L6 21L8.5 13.5L2.5 9H9.5L12 2Z"
          fill="currentColor" // Fills with the text color (primary)
          stroke="currentColor" // Stroke with the text color
          strokeWidth="1"
          strokeLinejoin="round"/>
  </svg>
);

interface ChatMessageProps {
  message: Message;
}

// Enhanced parsing for various elements including basic math (inline/block), lists, bold/italic
const parseText = (text: string | React.ReactNode): React.ReactNode => {
    if (typeof text !== 'string') return text; // Return if already a ReactNode

    // Split the text into segments based on ```, `, $, **, *, and newlines
    const segments = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|```[\s\S]*?```|`[^`]+`|\*\*.*?\*\*|\*.*?\*|(?:\r\n|\r|\n))/g).filter(Boolean);

    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] | null = null;

    segments.forEach((segment, index) => {
        // Match block math ($$...$$)
        if (segment.startsWith('$$') && segment.endsWith('$$')) {
            if (currentList) { elements.push(<ul key={`list-${index-1}`} className="list-disc pl-5 space-y-1 my-1">{currentList}</ul>); currentList = null; }
            const mathContent = segment.slice(2, -2).trim();
            elements.push(
                 <div key={index} className="block my-2 p-2 border border-border/30 rounded bg-muted/20 overflow-x-auto text-center text-sm">
                    <span>{mathContent}</span> {/* Placeholder */}
                 </div>
            );
        }
        // Match inline math ($...$)
        else if (segment.startsWith('$') && segment.endsWith('$')) {
             if (currentList) { elements.push(<ul key={`list-${index-1}`} className="list-disc pl-5 space-y-1 my-1">{currentList}</ul>); currentList = null; }
            const mathContent = segment.slice(1, -1).trim();
            elements.push(<span key={index} className="mx-1 px-1 py-0.5 bg-muted/30 rounded text-sm font-mono">{mathContent}</span>);
        }
        // Match code blocks (```...```)
        else if (segment.startsWith('```') && segment.endsWith('```')) {
             if (currentList) { elements.push(<ul key={`list-${index-1}`} className="list-disc pl-5 space-y-1 my-1">{currentList}</ul>); currentList = null; }
            const codeBlock = segment.slice(3, -3).trim();
            const lines = codeBlock.split('\n');
            const language = lines[0].match(/^[a-z]+$/i) ? lines[0] : null;
            const code = language ? lines.slice(1).join('\n') : codeBlock;
            elements.push(
                <pre key={index} className="bg-muted/30 p-3 rounded-md my-2 overflow-x-auto text-xs font-mono border border-border/50 shadow-inner backdrop-blur-sm">
                    {language && <code className="block text-muted-foreground mb-1 text-xs">{language}</code>}
                    <code>{code.trim()}</code>
                </pre>
            );
        }
        // Match inline code (`...`)
        else if (segment.startsWith('`') && segment.endsWith('`')) {
             if (currentList) { elements.push(<ul key={`list-${index-1}`} className="list-disc pl-5 space-y-1 my-1">{currentList}</ul>); currentList = null; }
            const codeContent = segment.slice(1, -1);
            elements.push(<code key={index} className="bg-muted/40 text-foreground px-1.5 py-0.5 rounded text-xs font-mono mx-0.5 border border-border/30">{codeContent}</code>);
        }
         // Match bold text (**...**)
        else if (segment.startsWith('**') && segment.endsWith('**')) {
             if (currentList) { elements.push(<ul key={`list-${index-1}`} className="list-disc pl-5 space-y-1 my-1">{currentList}</ul>); currentList = null; }
            const boldContent = segment.slice(2, -2);
            elements.push(<strong key={index}>{parseText(boldContent)}</strong>); // Recursively parse content within bold
        }
        // Match italic text (*...*)
        else if (segment.startsWith('*') && segment.endsWith('*')) {
             if (currentList) { elements.push(<ul key={`list-${index-1}`} className="list-disc pl-5 space-y-1 my-1">{currentList}</ul>); currentList = null; }
            const italicContent = segment.slice(1, -1);
             // Handle simple list case vs italic
             if (segment.trim().startsWith('* ') && !segment.endsWith(' *')) { // Check if it looks like a list item
                const listItemContent = segment.trim().substring(2);
                 if (!currentList) currentList = [];
                 currentList.push(<li key={index}>{parseText(listItemContent)}</li>);
             } else {
                elements.push(<em key={index}>{parseText(italicContent)}</em>); // Recursive parsing
             }
        }
        // Match list items (simple unordered list for now)
        else if (segment.trim().startsWith('* ')) {
            const listItemContent = segment.trim().substring(2);
            if (!currentList) currentList = [];
            currentList.push(<li key={index}>{parseText(listItemContent)}</li>); // Recursive parsing
        }
        // Match newlines
         else if (/^(\r\n|\r|\n)$/.test(segment)) {
            // If we are inside a list, newline doesn't necessarily end it
            if (!currentList) {
                elements.push(<br key={index} />);
            } else {
                 // Add a space or handle multi-line list items if needed.
                 // For simplicity, treating newline as potentially ending the list item text for now.
            }
        }
         // Default text, potentially containing emojis
        else {
             if (currentList) { elements.push(<ul key={`list-${index-1}`} className="list-disc pl-5 space-y-1 my-1">{currentList}</ul>); currentList = null; }
            const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
            if (emojiRegex.test(segment)) {
                const parts = segment.split(emojiRegex).filter(part => part);
                parts.forEach((part, partIndex) => {
                    if (part.match(emojiRegex)) {
                        elements.push(
                            <span key={`${index}-${partIndex}`} className="text-lg inline-block mx-0.5 align-middle">
                                {part}
                            </span>
                        );
                    } else {
                        elements.push(<span key={`${index}-${partIndex}`}>{part}</span>);
                    }
                });
            } else {
                elements.push(<span key={index}>{segment}</span>);
            }
        }
    });

    // Add any remaining list items
    if (currentList) {
        elements.push(<ul key={`list-end`} className="list-disc pl-5 space-y-1 my-1">{currentList}</ul>);
    }


    // Wrap inline elements in paragraphs if needed (simple heuristic)
    // This is basic; more sophisticated grouping might be needed.
    const result: React.ReactNode[] = [];
    let inlineBuffer: React.ReactNode[] = [];

    elements.forEach((el, idx) => {
      const elType = (el as React.ReactElement)?.type;
      // Check if element is likely block-level
      const isBlock = elType === 'div' || elType === 'pre' || elType === 'ul' || elType === 'br';

      if (isBlock) {
        if (inlineBuffer.length > 0) {
          result.push(<p key={`p-${idx}-prev`} className="my-1">{inlineBuffer}</p>);
          inlineBuffer = [];
        }
        if (elType !== 'br') { // Don't push standalone <br> if it was handled
             result.push(el);
        } else if (inlineBuffer.length === 0 && result.length > 0 && (result[result.length-1] as React.ReactElement)?.type !== 'p') {
            // Add <br> only if it makes sense (e.g., not after a block)
             // result.push(el); // Maybe omit <br> if it's just separating blocks already
        }
      } else {
        inlineBuffer.push(el);
      }
    });

    if (inlineBuffer.length > 0) {
      result.push(<p key="p-last" className="my-1">{inlineBuffer}</p>);
    }


    // If only one paragraph, return its children directly to avoid nested <p>
    if (result.length === 1 && (result[0] as React.ReactElement)?.type === 'p') {
        return (result[0] as React.ReactElement).props.children;
    }

    return result; // Return array of elements
};


export default function ChatMessage({ message }: ChatMessageProps) {
  // Do not render hidden messages
  if (message.hidden) {
    return null;
  }

  const isUser = message.sender === 'user';
  const isAI = message.sender === 'ai';

  // Unique animation delay for each message
  const [animationDelay] = React.useState(`${Math.random() * 0.2 + 0.1}s`);

  return (
    <div
      className={cn(
        'flex items-start gap-3 animate-fade-in', // Consistent base animation
        isUser ? 'justify-end' : 'justify-start',
      )}
      style={{ animationDelay }} // Apply unique delay
    >
      {isAI && (
        <Avatar className="w-9 h-9 border-2 border-primary/40 shadow-lg bg-gradient-to-br from-primary/30 to-background/80 backdrop-blur-sm flex-shrink-0 transform transition-transform duration-300 hover:scale-110">
          <AvatarFallback className="text-primary bg-transparent">
            {/* Updated Icon to Gemini Logo */}
            <GeminiLogo />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[80%] rounded-xl px-4 py-2.5 shadow-lg transition-all duration-300 transform-gpu hover:scale-[1.02] hover:shadow-primary/20', // Enhanced hover shadow
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-gradient-to-br from-secondary/90 to-card/80 text-card-foreground rounded-bl-sm border border-border/50 backdrop-blur-sm',
          isAI ? 'ai-message-glow' : ''
        )}
      >
        <div className="text-sm break-words leading-relaxed whitespace-pre-wrap">
          {parseText(message.text)}
        </div>
      </div>
      {isUser && (
        <Avatar className="w-9 h-9 border border-muted/50 shadow-md bg-background/80 backdrop-blur-sm flex-shrink-0 transform transition-transform duration-300 hover:scale-110">
          <AvatarFallback className="text-muted-foreground bg-transparent">
            <User className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}

// No need for styled-jsx, remove the style tag
