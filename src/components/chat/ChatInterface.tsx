
'use client';

import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { tutorLearnerAction } from '@/actions/chatActions';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { TutorLearnerInput, TutorLearnerOutput } from '@/ai/flows/tutor-learner';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// Export Message type for parent component
export type Message = {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string | React.ReactNode;
  timestamp: number;
  hidden?: boolean;
};

type HistoryMessage = {
    role: 'user' | 'ai';
    text: string;
}

type CollectionStage =
  | 'awaiting_name'
  | 'tutoring'
  | 'processing_tutor' 
  | 'error';

type FormData = {
  courseName: string;
  lessonName: string;
  learnerName: string;
  contentSummary: string; // This will now be updated dynamically
};

interface ChatInterfaceProps {
    initialCourseName: string;
    initialLessonName: string;
    initialContentSummary: string; // Initial summary (e.g., for textual content)
    initialLearnerName: string;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    addMessage: (sender: 'user' | 'ai' | 'system', text: string | React.ReactNode, hidden?: boolean) => void;
    onSetupComplete: () => void;
    isGeneratingVideo: boolean;
}

export interface ChatInterfaceHandle {
    simulateUserInput: (text: string, hidden?: boolean) => void;
    updateContentSummary: (newSummary: string) => void; // Method to update summary
}


const ChatInterface = forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(({
    initialCourseName,
    initialLessonName,
    initialContentSummary,
    initialLearnerName,
    messages,
    setMessages,
    addMessage,
    onSetupComplete,
    isGeneratingVideo
}, ref) => {

  const [formData, setFormData] = useState<FormData>({
    courseName: initialCourseName,
    lessonName: initialLessonName,
    learnerName: initialLearnerName || '',
    contentSummary: initialContentSummary, // Initialize with the provided summary
  });

  const [stage, setStage] = useState<CollectionStage>(initialLearnerName ? 'tutoring' : 'awaiting_name');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  useEffect(() => {
    if (initialLearnerName && stage === 'tutoring' && messages.some(m => m.id.startsWith('ai-initial-intro'))) {
        console.log("ChatInterface: Initial learner name provided, setup complete. Stage: tutoring.");
        onSetupComplete();
    }
  }, [initialLearnerName, stage, onSetupComplete, messages]);


  useEffect(() => {
    if (
        (stage === 'awaiting_name' || stage === 'tutoring') &&
        !isLoading &&
        inputRef.current
    ) {
      inputRef.current.focus();
    }
  }, [stage, isLoading]);


  const addLoadingIndicator = () => {
      addMessage('ai', (
          <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Rookie & Pookie is thinking...</span>
          </div>
      ));
  }

   const removeLastMessage = useCallback(() => {
       setMessages(prev => {
            const lastLoadingIndex = [...prev].reverse().findIndex(
                msg => !msg.hidden && msg.sender === 'ai' && React.isValidElement(msg.text) && (msg.text.type === 'div' && msg.text.props?.children?.[0]?.type === Loader2)
            );
            if (lastLoadingIndex !== -1) {
                const indexToRemove = prev.length - 1 - lastLoadingIndex;
                return [...prev.slice(0, indexToRemove), ...prev.slice(indexToRemove + 1)];
            }
            return prev;
       });
   }, [setMessages]);


  const handleUserInput = useCallback(async (input: string, hidden: boolean = false) => {
    if (isLoading && !hidden) {
        console.warn("Already processing a chat response. Ignoring new visible input.");
        toast({ title: "Processing...", description: "Rookie & Pookie is thinking, please wait.", variant: "default" });
        return;
    }

    console.log(`Handling input. Is hidden: ${hidden}, isLoading: ${isLoading}, Current Stage: ${stage}`);

    if (!hidden || (hidden && input.startsWith("<<Unstop>>"))) {
      addMessage(hidden ? 'system' : 'user', input, hidden);
    }

    let currentStage = stage;
    let nextStage: CollectionStage = stage;
    let nextPrompt: string | null = null;
    let updatedFormData = { ...formData }; // Use current formData which might have an updated summary

    if (!hidden) {
        setIsLoading(true);
        if (stage !== 'awaiting_name') { 
             addLoadingIndicator();
        }
    }

    try {
        if (currentStage === 'awaiting_name') {
            updatedFormData.learnerName = input.trim();
            setFormData(updatedFormData); // Update formData state with new learner name
            setStage('tutoring'); 
            console.log("ChatInterface: Name collected, setup complete. Stage: tutoring.");
            onSetupComplete(); 

            const isQuizLesson = updatedFormData.lessonName.toLowerCase().includes('quiz');
            if (isQuizLesson) {
                nextPrompt = `Nice to meet you, ${updatedFormData.learnerName}! The quiz for "${updatedFormData.lessonName}" is on the right. Feel free to ask any questions before you start or during the quiz.`;
            } else {
                nextPrompt = `Nice to meet you, ${updatedFormData.learnerName}! We're ready to explore "${updatedFormData.lessonName}". You can ask me questions, or click 'Generate Video' on the right for a visual overview. What would you like to do? ✨`;
            }
             if (!hidden && nextPrompt) { 
                removeLastMessage();
             }

        } else if (currentStage === 'tutoring' || currentStage === 'processing_tutor') {
            console.log("Processing 'tutoring' stage input.");
            const historyForFlow: HistoryMessage[] = messages
                .concat(hidden ? [] : [{ id: `temp-current-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, sender: 'user', text: input, timestamp: Date.now() }])
                .filter(msg => typeof msg.text === 'string' && msg.sender !== 'system')
                .map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'ai',
                    text: msg.text as string,
                }));

            if (!updatedFormData.contentSummary) {
                // This check is crucial. Ensure formData.contentSummary is up-to-date.
                console.error("CRITICAL: Content summary is missing in ChatInterface's formData before calling tutorLearnerAction.");
                throw new Error("Content summary is missing for the AI tutor. Please ensure it's loaded and updated correctly.");
            }

            const tutorInput: TutorLearnerInput = {
                courseName: updatedFormData.courseName,
                lessonName: updatedFormData.lessonName,
                learnerName: updatedFormData.learnerName || 'Learner',
                contentSummary: updatedFormData.contentSummary, // Use the potentially updated summary
                userInput: input,
                chatHistory: historyForFlow,
            };

            console.log("--- TUTOR BOT INPUT (Pre-Action) ---");
            console.log("Course:", tutorInput.courseName);
            console.log("Lesson:", tutorInput.lessonName);
            console.log("Learner:", tutorInput.learnerName);
            console.log("User Input (or system msg):", JSON.stringify(tutorInput.userInput.substring(0,70) + "..."));
            console.log("Content Summary (first 100 chars):", tutorInput.contentSummary?.substring(0, 100) + "...");
            console.log("Chat History Length:", tutorInput.chatHistory?.length ?? 0);
            if (tutorInput.chatHistory && tutorInput.chatHistory.length > 0) {
                console.log("Last historical message:", JSON.stringify(tutorInput.chatHistory[tutorInput.chatHistory.length -1].text.substring(0,70) + "..."));
            }
            console.log("--------------------------------------");


            const tutorResult = await tutorLearnerAction(tutorInput);

             if (!hidden) { removeLastMessage(); }

            if (tutorResult.success && tutorResult.data) {
                const responseText = tutorResult.data.response.trim();
                if (responseText && responseText !== "TraiHVail Activated" && responseText !== "TraiHVail Updated!") {
                    addMessage('ai', responseText);
                } else {
                    console.log(`Received '${responseText}' or empty, hiding AI response for this interaction.`);
                }
                nextStage = 'tutoring';
            } else {
                console.error('Tutor Action Error:', tutorResult.error, tutorResult.errors);
                if (!hidden) {
                    addMessage('ai', 'Hmm, my circuits got a bit tangled. Could you rephrase that? 😕');
                    toast({
                        title: "Tutoring Error",
                        description: tutorResult.error || "Couldn't get a response from the tutor.",
                        variant: "destructive",
                    });
                }
                nextStage = 'tutoring';
            }
        } else {
             if (!hidden) { removeLastMessage(); } 
            console.warn("Reached unexpected stage in handleUserInput:", currentStage);
             if (!hidden) { nextPrompt = "How can I help you today with " + updatedFormData.lessonName + "?"; }
            nextStage = 'tutoring'; 
        }

        setStage(nextStage);

        if (nextPrompt && !hidden) { 
            setTimeout(() => {
                addMessage('ai', nextPrompt!);
                 if (inputRef.current) {
                   inputRef.current.focus();
                }
            }, 100);
        }

    } catch (error) {
        if (!hidden) {
             try { removeLastMessage(); } catch {}
        }
        console.error('Error handling user input:', error);
         if (!hidden) {
            addMessage('ai', 'Apologies, I encountered an unexpected issue. Let\'s try again. 😕');
            toast({ title: "Unexpected Error", description: error instanceof Error ? error.message : "An unknown error occurred.", variant: "destructive" });
         }
        const previousStage = stage === 'processing_tutor' ? 'tutoring' : stage;
        setStage(previousStage); 
         if (!hidden && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50);
         }
    } finally {
        if (!hidden) {
             setIsLoading(false);
              if (inputRef.current && (nextStage === 'tutoring' || nextStage === 'awaiting_name')) {
                 setTimeout(() => inputRef.current?.focus(), 50);
             }
        } else {
            console.log("Finished processing hidden message.");
        }
    }
  }, [isLoading, stage, formData, messages, addMessage, setMessages, toast, onSetupComplete, removeLastMessage]);


  useImperativeHandle(ref, () => ({
      simulateUserInput(text: string, hidden: boolean = false) {
          handleUserInput(text, hidden);
      },
      updateContentSummary(newSummary: string) {
          console.log("ChatInterface: Updating content summary internally.");
          setFormData(prevData => ({
              ...prevData,
              contentSummary: newSummary,
          }));
          // Optionally send a system message to AI that context changed (if needed and not done by parent)
          // handleUserInput(`<<Unstop>> Context updated. New summary is: ${newSummary.substring(0,50)}...`, true);
      }
  }), [handleUserInput]);


  const getPlaceholderText = () => {
      if (isLoading && stage !== 'awaiting_name') return "Rookie & Pookie is thinking...";
      switch (stage) {
          case 'awaiting_name': return 'Enter your name to get started...';
          case 'tutoring':
            const isQuizLesson = formData.lessonName.toLowerCase().includes('quiz');
            return isQuizLesson
                ? `Ask about "${formData.lessonName}" or start the quiz...`
                : `Ask about "${formData.lessonName}" or generate video...`;
          case 'processing_tutor':
            return "Processing...";
          case 'error': return 'An error occurred. Try sending a message again.';
          default: return `Chat about ${formData.lessonName}...`;
      }
  }

  return (
    <div className={cn(
        "flex flex-col h-full bg-card/80 backdrop-blur-md rounded-lg shadow-xl shadow-primary/10 border border-primary/20 overflow-hidden", 
        "transform-style-3d transition-transform duration-500 hover:rotate-x-2 hover:rotate-y-0.5" 
     )}>
       <div className="absolute inset-0 z-0 overflow-hidden opacity-10 pointer-events-none">
         <div className="absolute inset-0 bg-grid-pattern animate-grid-scroll"></div>
       </div>

       <ScrollArea className="relative z-10 flex-1 w-full overflow-y-auto">
         <div className="p-2 md:p-3 space-y-3">
            {messages.filter(msg => !msg.hidden).map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={chatEndRef} />
         </div>
       </ScrollArea>

      <div className="relative z-10 mt-auto border-t border-border/20">
         <ChatInput
           ref={inputRef}
           onSubmit={(input) => handleUserInput(input, false)}
           disabled={isLoading && stage !== 'awaiting_name'}
           placeholder={getPlaceholderText()}
           className="p-2 md:p-2.5" 
         />
      </div>
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface';

export default ChatInterface;
