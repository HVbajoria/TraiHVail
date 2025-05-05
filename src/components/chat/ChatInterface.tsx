
'use client';

import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { generateLearningGoalAction, tutorLearnerAction } from '@/actions/chatActions';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { GenerateLearningGoalOutput } from '@/ai/flows/generate-learning-goal';
import type { TutorLearnerInput, TutorLearnerOutput } from '@/ai/flows/tutor-learner';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area'; // Import ScrollArea

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
  | 'awaiting_goal'
  | 'processing_goal'
  | 'goal_generated'
  | 'tutoring'
  | 'processing_tutor'
  | 'error';

type FormData = {
  courseName: string;
  lessonName: string;
  learnerName: string;
  instructionGoal: string;
  learningGoal?: string;
  contentSummary: string; // Store the content summary
};

interface ChatInterfaceProps {
    initialCourseName: string;
    initialLessonName: string;
    initialContentSummary: string; // Passed from parent
    initialLearnerName: string; // Added prop for initial learner name
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    addMessage: (sender: 'user' | 'ai' | 'system', text: string | React.ReactNode, hidden?: boolean) => void;
    onSetupComplete: () => void;
    isGeneratingVideo: boolean; // New prop to indicate video generation state
}

// Define the type for the imperative handle
export interface ChatInterfaceHandle {
    simulateUserInput: (text: string, hidden?: boolean) => void;
}


const ChatInterface = forwardRef<ChatInterfaceHandle, ChatInterfaceProps>(({
    initialCourseName,
    initialLessonName,
    initialContentSummary, // Receive the summary
    initialLearnerName, // Use the initial learner name
    messages,
    setMessages,
    addMessage,
    onSetupComplete,
    isGeneratingVideo // Destructure the new prop
}, ref) => {

  const [formData, setFormData] = useState<FormData>({
    courseName: initialCourseName,
    lessonName: initialLessonName,
    learnerName: initialLearnerName || '', // Initialize with provided name or empty string
    instructionGoal: '',
    learningGoal: '',
    contentSummary: initialContentSummary, // Initialize with the passed summary
  });

  // Determine initial stage based on whether learner name is already known
  const [stage, setStage] = useState<CollectionStage>(initialLearnerName ? 'awaiting_goal' : 'awaiting_name');
  const [isLoading, setIsLoading] = useState(false); // Tracks AI response loading
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
    // Focus input when chat is ready for user input (setup or tutoring) and not loading
    if (
        (stage === 'awaiting_name' || stage === 'awaiting_goal' || stage === 'goal_generated' || stage === 'tutoring') &&
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
            // Find the last visible AI thinking message and remove it
            const lastLoadingIndex = [...prev].reverse().findIndex(
                msg => !msg.hidden && msg.sender === 'ai' && React.isValidElement(msg.text) && (msg.text.type === 'div' && msg.text.props?.children?.[0]?.type === Loader2)
            );
            if (lastLoadingIndex !== -1) {
                const indexToRemove = prev.length - 1 - lastLoadingIndex;
                return [...prev.slice(0, indexToRemove), ...prev.slice(indexToRemove + 1)];
            }
            return prev; // Return unchanged if no loading message found
       });
   }, [setMessages]);


  const handleUserInput = useCallback(async (input: string, hidden: boolean = false) => {
    // Only block NEW VISIBLE user input if already processing a chat response.
    // Allow hidden system messages and new visible input if chat is idle.
    if (isLoading && !hidden) {
        console.warn("Already processing a chat response. Ignoring new visible input.");
        toast({ title: "Processing...", description: "Rookie & Pookie is thinking, please wait.", variant: "default" });
        return;
    }

    console.log(`Handling input. Is hidden: ${hidden}, isLoading: ${isLoading}, Current Stage: ${stage}`);

    // Add user or system message
    if (!hidden || input.startsWith("<<Unstop>>")) { // Add hidden system messages too
      addMessage(hidden ? 'system' : 'user', input, hidden);
    }

    let currentStage = stage; // Capture stage at the start of handling
    let nextStage: CollectionStage = stage;
    let nextPrompt: string | null = null;
    let updatedFormData = { ...formData };
    let aiPromptAdded = false;

    // Only set loading for visible messages needing an AI response
    if (!hidden) {
        setIsLoading(true); // Set loading for this specific response
        addLoadingIndicator();
    }

    try {
        // If chat setup is complete (goal generated), go directly to tutoring
        if (currentStage === 'goal_generated') {
            console.log("Already in 'goal_generated', transitioning to 'tutoring' for processing.");
            currentStage = 'tutoring'; // Update effective stage for this interaction
        }

        // --- TUTORING STAGE ---
        if (currentStage === 'tutoring') {
            console.log("Processing 'tutoring' stage input.");
            // Don't change stage until processing finishes
            // setStage('processing_tutor'); // Indicate processing starts for tutor response

            const historyForFlow: HistoryMessage[] = messages
                 // Filter out non-string and system messages (including the hidden <<Unstop>> ones) from history sent to LLM
                 // Include the *current* user input in the history ONLY if it wasn't hidden
                .concat(hidden ? [] : [{ id: `temp-current-${Date.now()}`, sender: 'user', text: input, timestamp: Date.now() }]) // Add current input if not hidden
                .filter(msg => typeof msg.text === 'string' && msg.sender !== 'system')
                .map(msg => ({
                    role: msg.sender === 'user' ? 'user' : 'ai',
                    text: msg.text as string,
                }));

            // Ensure contentSummary exists before calling the action
            if (!updatedFormData.contentSummary) {
                throw new Error("Content summary is missing in form data.");
            }

            const tutorInput: TutorLearnerInput = {
                courseName: updatedFormData.courseName,
                lessonName: updatedFormData.lessonName,
                learnerName: updatedFormData.learnerName || 'Learner', // Use fallback if name missing
                learningGoal: updatedFormData.learningGoal || updatedFormData.instructionGoal || 'Complete the lesson', // Use fallbacks
                contentSummary: updatedFormData.contentSummary, // Pass the content summary
                userInput: input, // The current user input
                chatHistory: historyForFlow,
            };

            console.log("--- TUTOR BOT INPUT (Pre-Action) ---");
            console.log("Course:", tutorInput.courseName);
            console.log("Lesson:", tutorInput.lessonName);
            console.log("Learner:", tutorInput.learnerName);
            console.log("Goal:", tutorInput.learningGoal);
            console.log("User Input:", tutorInput.userInput);
            console.log("Content Summary Provided:", !!tutorInput.contentSummary);
            console.log("Chat History Length:", tutorInput.chatHistory?.length ?? 0);
            // console.log(JSON.stringify(tutorInput, null, 2)); // Optional: Full object for debugging
            console.log("--------------------------------------");

            const tutorResult = await tutorLearnerAction(tutorInput);

            if (!hidden) { removeLastMessage(); } // Remove indicator only if it was added

            if (tutorResult.success && tutorResult.data) {
                const responseText = tutorResult.data.response.trim();
                 // Only add AI response if it's not the activation message
                if (responseText !== "TraiHVail Activated" && responseText !== "TraiHVail Updated!") {
                    addMessage('ai', responseText);
                } else {
                    console.log(`Received '${responseText}', hiding AI response.`);
                }
                nextStage = 'tutoring'; // Stay in tutoring stage
            } else {
                console.error('Tutor Action Error:', tutorResult.error, tutorResult.errors);
                 // Only add error message if the input wasn't hidden
                if (!hidden) {
                    addMessage('ai', 'Hmm, my circuits got a bit tangled. Could you rephrase that? 😕');
                    toast({
                        title: "Tutoring Error",
                        description: tutorResult.error || "Couldn't get a response from the tutor.",
                        variant: "destructive",
                    });
                }
                nextStage = 'tutoring'; // Go back to tutoring stage on error
            }
            setStage(nextStage); // Update stage after processing

        }
        // --- INITIAL SETUP STAGES ---
        else {
             console.log(`Processing setup stage: ${currentStage}`);
             if (currentStage !== 'processing_goal') { // Avoid nested processing state
                // Don't change stage until processing finishes
                // setStage('processing_goal'); // Indicate processing starts for setup step
             }

            switch (currentStage) {
                case 'awaiting_name':
                    updatedFormData.learnerName = input;
                    setFormData(updatedFormData); // Update state immediately for prompt
                    nextStage = 'awaiting_goal';
                    nextPrompt = `Nice to meet you, ${input}! What's your main goal or question for this lesson ("${updatedFormData.lessonName}")? 🤔`;
                    if (!hidden) { removeLastMessage(); }
                    break;

                case 'awaiting_goal':
                    updatedFormData.instructionGoal = input;
                    setFormData(updatedFormData); // Update state
                    // nextStage remains 'processing_goal' while calling the action

                    const goalResult = await generateLearningGoalAction({
                        courseName: updatedFormData.courseName,
                        lessonName: updatedFormData.lessonName,
                        learnerName: updatedFormData.learnerName || 'Learner', // Use fallback
                        instructionGoal: updatedFormData.instructionGoal,
                    });

                    if (!hidden) { removeLastMessage(); } // Remove indicator

                    if (goalResult.success && goalResult.data) {
                        updatedFormData.learningGoal = goalResult.data.learningGoal;
                        setFormData(updatedFormData); // Update state with generated goal
                        addMessage('ai', `Alright, ${updatedFormData.learnerName || 'there'}! Based on that, here's a refined goal: **${goalResult.data.learningGoal}** 🎯`);
                        nextPrompt = "Okay, goal set! Click the 'Generate Video' button for a visual overview, or start asking questions! ✨";
                        nextStage = 'goal_generated'; // Move to goal generated state
                        console.log("Setup complete, calling onSetupComplete.");
                        onSetupComplete(); // Signal parent that setup is done
                    } else {
                        console.error("Goal Generation Error:", goalResult.error, goalResult.errors);
                         if (!hidden) { // Only show error message for visible user input
                            addMessage('ai', 'Oops! I had a little glitch refining your goal. Could you tell me what you want to focus on again?');
                            toast({ title: "Goal Generation Failed", description: goalResult.error || "Couldn't generate learning goal.", variant: "destructive" });
                         }
                        nextStage = 'awaiting_goal'; // Go back to awaiting goal
                    }
                    break;

                default:
                    // Should not happen in setup, but handle defensively
                    if (!hidden) { removeLastMessage(); }
                    console.warn("Reached default case in handleUserInput during setup stage:", currentStage);
                    if (!hidden) { nextPrompt = "How can I help you today?"; }
                    nextStage = 'tutoring'; // Move to tutoring
                    break;
            }

            setStage(nextStage); // Update stage after processing setup step

            if (nextPrompt) {
                 // Use a small timeout to ensure the message appears after the state update
                 // and after potential loading indicator removal
                setTimeout(() => {
                    addMessage('ai', nextPrompt!);
                    // Refocus input after AI prompt in setup stages only if it was a visible interaction
                    if (!hidden && inputRef.current && (nextStage === 'awaiting_goal' || nextStage === 'goal_generated')) {
                       inputRef.current.focus();
                    }
                }, 100); // Small delay
            }
        }

    } catch (error) {
        // Handle unexpected errors during processing
        if (!hidden) {
             try { removeLastMessage(); } catch {} // Attempt to remove loading indicator
        }
        console.error('Error handling user input:', error);
         if (!hidden) { // Only show error message to user for visible interactions
            addMessage('ai', 'Apologies, I encountered an unexpected issue. Let\'s try again. 😕');
            toast({ title: "Unexpected Error", description: error instanceof Error ? error.message : "An unknown error occurred.", variant: "destructive" });
         }
        // Attempt to reset to a reasonable previous state
        const previousStage = stage === 'processing_goal' ? 'awaiting_goal' : stage === 'processing_tutor' ? 'tutoring' : stage === 'goal_generated' ? 'awaiting_goal' : 'awaiting_name';
        setStage(previousStage);
         if (!hidden && inputRef.current) { // Refocus input only if it was user input
            setTimeout(() => inputRef.current?.focus(), 50);
         }
    } finally {
        // Always reset loading state if the input was from the user (not hidden)
        if (!hidden) {
             setIsLoading(false);
             // Ensure input focus is managed correctly after processing
              if (inputRef.current && (nextStage === 'tutoring' || nextStage === 'awaiting_goal' || nextStage === 'awaiting_name' || nextStage === 'goal_generated')) {
                // Small delay to ensure DOM updates before focusing
                 setTimeout(() => inputRef.current?.focus(), 50);
             }
        } else {
            console.log("Finished processing hidden message."); // Log completion for hidden messages
        }
    }
  }, [isLoading, stage, formData, messages, addMessage, setMessages, toast, onSetupComplete, removeLastMessage]); // removeLastMessage added


  useImperativeHandle(ref, () => ({
      simulateUserInput(text: string, hidden: boolean = false) {
          handleUserInput(text, hidden);
      }
  }), [handleUserInput]);


  const getPlaceholderText = () => {
      // Only show "thinking" if it's a response to user input and chat is loading
      if (isLoading) return "Rookie & Pookie is thinking...";
      // Otherwise, show the prompt relevant to the current stage
      switch (stage) {
          case 'awaiting_name': return 'Enter your name...';
          case 'awaiting_goal': return `What about "${formData.lessonName}" interests you most?`;
          case 'goal_generated': return `Click 'Generate Video' or ask about "${formData.learningGoal || formData.lessonName}"...`;
          case 'tutoring': return `Ask about "${formData.learningGoal || formData.lessonName}"...`;
          case 'processing_goal': // These shouldn't display if isLoading is false
          case 'processing_tutor':
            return "Processing...";
          case 'error': return 'An error occurred. Try sending a message again.';
          default: return 'Send a message...';
      }
  }

  return (
    <div className={cn(
        "flex flex-col h-full bg-card/80 backdrop-blur-md rounded-lg shadow-2xl shadow-primary/10 border border-primary/20 overflow-hidden",
        "transform-style-3d transition-transform duration-500 hover:rotate-x-5 hover:rotate-y-1"
     )}>
       <div className="absolute inset-0 z-0 overflow-hidden opacity-10 pointer-events-none">
         <div className="absolute inset-0 bg-grid-pattern animate-grid-scroll"></div>
       </div>

       {/* Use ScrollArea for the chat messages */}
       <ScrollArea className="relative z-10 flex-1 w-full overflow-y-auto">
         <div className="p-3 md:p-4 space-y-4"> {/* Add padding inside ScrollArea */}
            {/* Filter out hidden messages before mapping */}
            {messages.filter(msg => !msg.hidden).map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={chatEndRef} />
         </div>
       </ScrollArea>

      <div className="relative z-10 mt-auto border-t border-border/20"> {/* Ensure input is at bottom */}
         <ChatInput
           ref={inputRef}
           onSubmit={(input) => handleUserInput(input, false)}
           // Disable input only when the CHAT is loading a response. Do NOT disable for video generation.
           disabled={isLoading}
           placeholder={getPlaceholderText()}
         />
      </div>
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface';

export default ChatInterface;
