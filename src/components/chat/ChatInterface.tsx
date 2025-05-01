

"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { generateLearningGoalAction, tutorLearnerAction } from '@/actions/chatActions'; // Import server actions
import { Loader2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { GenerateLearningGoalOutput } from '@/ai/flows/generate-learning-goal';
import type { TutorLearnerOutput } from '@/ai/flows/tutor-learner'; // Import tutor types
import { cn } from '@/lib/utils'; // Import cn for conditional classes

// Export type for ChatMessage and internal use
export type Message = {
  id: string;
  sender: 'user' | 'ai' | 'system'; // Added system sender for internal/hidden messages
  text: string | React.ReactNode;
  timestamp: number;
  hidden?: boolean; // Flag to hide system messages from UI
};

// Type for messages passed to the AI flow history
type HistoryMessage = {
    role: 'user' | 'ai';
    text: string;
}

type CollectionStage =
  | 'welcome'
  | 'awaiting_course'
  | 'awaiting_lesson'
  | 'awaiting_name'
  | 'awaiting_goal'
  | 'processing_goal'
  | 'goal_generated'
  | 'tutoring' // New stage for the tutoring phase
  | 'processing_tutor' // New stage while waiting for tutor response
  | 'error';

type FormData = {
  courseName: string;
  lessonName: string;
  learnerName: string;
  instructionGoal: string;
  learningGoal?: string; // Store the generated learning goal
};

const initialMessages: Message[] = [
  {
    id: `ai-${Date.now()}-${Math.random()}`, // Use more unique ID
    sender: 'ai',
    text: "Hey there! I'm Rookie & Pookie, your AI mentor from Unstop. Ready to level up?",
    timestamp: Date.now(),
  },
  {
    id: `ai-${Date.now() + 1}-${Math.random()}`, // Use more unique ID
    sender: 'ai',
    text: 'First things first, which Unstop course are you diving into today?',
    timestamp: Date.now() + 1,
  },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [stage, setStage] = useState<CollectionStage>('awaiting_course');
  const [formData, setFormData] = useState<FormData>({
    courseName: '',
    lessonName: '',
    learnerName: '',
    instructionGoal: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the chat input
  const { toast } = useToast();

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Effect to focus the input when the stage requires user text input
  useEffect(() => {
    if (
        (stage === 'awaiting_course' ||
         stage === 'awaiting_lesson' ||
         stage === 'awaiting_name' ||
         stage === 'awaiting_goal' ||
         stage === 'tutoring') &&
        !isLoading &&
        inputRef.current
    ) {
      inputRef.current.focus();
    }
  }, [stage, isLoading]); // Re-run when stage or loading state changes

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Helper to add messages, including hidden system messages
  const addMessage = (sender: 'user' | 'ai' | 'system', text: string | React.ReactNode, hidden: boolean = false) => {
    const newMessage: Message = {
      // Generate a more unique ID using Math.random() to avoid collisions
      id: `${sender}-${Date.now()}-${Math.random()}`,
      sender,
      text,
      timestamp: Date.now(),
      hidden,
    };
    setMessages((prev) => [...prev, newMessage]);
    // Ensure scroll after adding message
    setTimeout(scrollToBottom, 0);
  };

    // Helper to add loading indicator
  const addLoadingIndicator = () => {
      addMessage('ai', (
          <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Rookie & Pookie is thinking...</span>
          </div>
      ));
  }

  // Helper to remove the last message (used to remove loading indicator)
  const removeLastMessage = () => {
      setMessages(prev => prev.slice(0, -1));
  }

  const handleUserInput = async (input: string) => {
    if (isLoading || stage === 'processing_goal' || stage === 'processing_tutor') return;

    addMessage('user', input);
    setIsLoading(true);

    let nextStage: CollectionStage = stage;
    let nextPrompt: string | null = null;
    const updatedFormData = { ...formData };

    try {
      if (stage === 'tutoring') {
        // Handle user input during the tutoring phase
        setStage('processing_tutor');
        addLoadingIndicator();

        // Prepare chat history for the AI (only user and AI messages, skip system/hidden)
        const history: HistoryMessage[] = messages
            .filter(msg => !msg.hidden && (msg.sender === 'user' || msg.sender === 'ai'))
            // Convert ReactNode to string if necessary (basic case)
            .map(msg => ({
                role: msg.sender as 'user' | 'ai',
                text: typeof msg.text === 'string' ? msg.text : String(msg.text) // Simplistic conversion
            }));

        // Add the current user input to the history being sent
        // Note: The flow template already includes the current userInput separately.
        // We only need to pass the history *before* the current input.

        const tutorResult = await tutorLearnerAction({
            courseName: updatedFormData.courseName,
            lessonName: updatedFormData.lessonName,
            learnerName: updatedFormData.learnerName,
            learningGoal: updatedFormData.learningGoal || updatedFormData.instructionGoal, // Use generated goal if available
            userInput: input, // The current user input
            chatHistory: history, // Pass the conversation history
        });

        removeLastMessage(); // Remove loading indicator

        if (tutorResult.success && tutorResult.data) {
            addMessage('ai', tutorResult.data.response);
            nextStage = 'tutoring'; // Stay in tutoring mode
        } else {
            // Handle tutor error
            console.error('Tutor Action Error:', tutorResult.error, tutorResult.errors);
             addMessage('ai', 'Hmm, my circuits got a bit tangled. Could you rephrase that? 😕');
             toast({
                title: "Tutoring Error",
                description: tutorResult.error || "Couldn't get a response from the tutor.",
                variant: "destructive",
            });
            nextStage = 'tutoring'; // Allow user to try again
        }
        setStage(nextStage);
        setIsLoading(false);


      } else {
         // Handle input collection stages
        switch (stage) {
            case 'awaiting_course':
            updatedFormData.courseName = input;
            nextStage = 'awaiting_lesson';
            nextPrompt = `"${input}", cool! Which lesson are we tackling? 📚`;
            break;
            case 'awaiting_lesson':
            updatedFormData.lessonName = input;
            nextStage = 'awaiting_name';
            nextPrompt = `Lesson "${input}", gotcha. And what name do you go by? 🧑‍🎓`;
            break;
            case 'awaiting_name':
            updatedFormData.learnerName = input;
            nextStage = 'awaiting_goal';
            // Updated prompt to avoid the specific phrase the user disliked
            nextPrompt = `Nice to meet you, ${input}! What would you like to focus on regarding the lesson "${updatedFormData.lessonName}" today?`;
            break;
            case 'awaiting_goal':
            updatedFormData.instructionGoal = input;
            nextStage = 'processing_goal';
            setStage(nextStage); // Update stage immediately for loading state
            addLoadingIndicator();

            const goalResult = await generateLearningGoalAction(updatedFormData);
            removeLastMessage(); // Remove loading

            if (goalResult.success && goalResult.data) {
                updatedFormData.learningGoal = goalResult.data.learningGoal; // Store the generated goal
                addMessage('ai', `Alright, ${updatedFormData.learnerName}! Based on that, here's a clear learning goal for you: **${goalResult.data.learningGoal}** 🎯`);
                // Removed the prompt "Ready to start learning with me?" as requested.
                // nextPrompt will be handled by the startTutoring button press.
                nextStage = 'goal_generated'; // Move to the stage where user can initiate tutoring
                 nextPrompt = null; // No automatic prompt, wait for button click
            } else {
                console.error("Goal Generation Error:", goalResult.error, goalResult.errors);
                addMessage('ai', 'Oops! I had a little glitch trying to create your goal. Could you tell me your goal again?');
                toast({
                    title: "Goal Generation Failed",
                    description: goalResult.error || "Couldn't generate learning goal.",
                    variant: "destructive",
                });
                nextStage = 'awaiting_goal'; // Go back to asking for the goal
            }
            break;
            default:
            nextPrompt = "I'm ready when you are.";
            break;
        }

        setFormData(updatedFormData);
        setStage(nextStage);

         // Add AI response message (if there's a nextPrompt)
        if (nextPrompt) {
            // Use setTimeout to allow UI to update before adding AI message
            setTimeout(() => {
                addMessage('ai', nextPrompt!);
                setIsLoading(false); // Reset loading after AI responds
                // Focus input after AI response in collection stages
                 if(inputRef.current) inputRef.current.focus();
            }, 100); // Short delay
        } else {
             // Focus input if no prompt is needed but stage requires input (like after goal generation fails)
            if(inputRef.current && (nextStage === 'awaiting_goal')) {
                inputRef.current.focus();
            }
            setIsLoading(false); // Reset loading if no prompt needed immediately
        }
      }

    } catch (error) {
        // Attempt to remove loading indicator even if it wasn't the last message (edge case)
        setMessages(prev => prev.filter(msg => typeof msg.text !== 'object')); // Remove loading indicator by checking type
        console.error('Error handling user input:', error);
        addMessage('ai', 'Apologies, I encountered an unexpected issue. Let\'s try again. 😕');
        // Attempt to revert to a safe state, e.g., the last input stage
        const previousStage = stage === 'processing_goal' ? 'awaiting_goal' : stage === 'processing_tutor' ? 'tutoring' : 'awaiting_course';
        setStage(previousStage);
        toast({
            title: "Unexpected Error",
            description: error instanceof Error ? error.message : "An unknown error occurred.",
            variant: "destructive",
        });
        setIsLoading(false); // Reset loading on error
         // Refocus input on error
        setTimeout(() => { if(inputRef.current) inputRef.current.focus(); }, 0);
    }
  };

  const startTutoring = async () => {
    if (stage !== 'goal_generated' || !formData.learningGoal) return;

    setIsLoading(true);
    setStage('processing_tutor'); // Indicate processing before the first tutor call
    addLoadingIndicator();

    // No need for a separate <<Unstop>> system message here; context is passed with each tutor call.

    // Add a message indicating the tutoring session is starting
    removeLastMessage(); // Remove loading indicator
    addMessage('ai', "Great! Let's dive into your goal. Ask me anything or tell me where you'd like to start. 🚀");
    setStage('tutoring'); // Officially enter tutoring mode
    setIsLoading(false);

     // Focus input after starting tutoring
     setTimeout(() => { // Timeout ensures DOM is updated
        if(inputRef.current) {
            inputRef.current.focus();
        }
     }, 0);
  };

  const getPlaceholderText = () => {
      if (isLoading) return "Rookie & Pookie is thinking...";
      switch (stage) {
          case 'awaiting_course': return 'Enter course name (e.g., Python Basics)...';
          case 'awaiting_lesson': return 'Enter lesson name (e.g., Introduction)...';
          case 'awaiting_name': return 'Enter your name...';
          // Updated placeholder for the goal input stage
          case 'awaiting_goal': return 'What would you like to learn or practice?';
          case 'goal_generated': return 'Click "Start Tutoring" or type your first question...'; // Changed placeholder
          case 'tutoring': return `Ask about "${formData.learningGoal || 'your goal'}"...`; // Use goal in placeholder
          case 'error': return 'An error occurred. Try sending a message again.';
          default: return 'Send a message...';
      }
  }

  return (
    <div className={cn(
        "flex flex-col h-full bg-card/80 backdrop-blur-md rounded-lg shadow-2xl shadow-primary/10 border border-primary/20 overflow-hidden",
        "transform-style-3d transition-transform duration-500 hover:rotate-x-5 hover:rotate-y-1" // Simplified hover effect class names
     )}>
      {/* Animated Grid Background inside chat */}
       <div className="absolute inset-0 z-0 overflow-hidden opacity-10 pointer-events-none">
         <div className="absolute inset-0 bg-grid-pattern animate-grid-scroll"></div>
       </div>

       {/* Chat Content Area */}
      <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
         {/* Filter out hidden messages before mapping */}
        {messages.filter(msg => !msg.hidden).map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={chatEndRef} />
      </div>

       {/* Show Start Tutoring button only when goal is generated */}
      {stage === 'goal_generated' && !isLoading && (
        <div className="relative z-10 p-3 border-t border-primary/20 flex justify-center bg-card/80 backdrop-blur-md"> {/* Ensure button is above grid */}
          <Button onClick={startTutoring} disabled={isLoading} className="glow-button bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg transition-shadow duration-300">
            <Play className="mr-2 h-4 w-4" /> Start Tutoring Session
          </Button>
        </div>
      )}

      {/* Always show chat input, but disable based on state */}
      <div className="relative z-10"> {/* Ensure input is above grid */}
         <ChatInput
           ref={inputRef} // Pass the ref to ChatInput
           onSubmit={handleUserInput}
           disabled={isLoading || stage === 'processing_goal' || stage === 'processing_tutor'}
           placeholder={getPlaceholderText()}
           // AutoFocus logic is handled by useEffect based on stage/isLoading
         />
      </div>
    </div>
  );
}
