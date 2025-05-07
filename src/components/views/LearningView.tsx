
'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { Loader2, Video, BookOpen, Lightbulb, HelpCircle, Zap, Download, RefreshCw, ChevronRight, CheckSquare, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatInterface, { type Message, type ChatInterfaceHandle } from '@/components/chat/ChatInterface';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import CourseLoadingAnimation from '@/components/course/CourseLoadingAnimation';
import QuizPlayer, { type QuizQuestionData } from '@/components/quiz/QuizPlayer';
import SlideTextContentView from '@/components/slides/SlideTextContentView';
import type { SlidesOutput } from '@/ai/flows/generate-slides';
import { cn } from '@/lib/utils';
import type { VideoPanelState } from '@/types/app';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LearningViewProps {
    courseName: string;
    lessonName: string;
    textContentSummary: string; // Summary based on textual lesson content
    videoContentSummary: string; // Summary based on slides (for video context)
    textualLessonContent: string | null;
    learnerName: string;
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    addMessage: (sender: 'user' | 'ai' | 'system', text: string | React.ReactNode, hidden?: boolean) => void;
    chatInterfaceRef: React.Ref<ChatInterfaceHandle>;
    onSetupComplete: () => void;
    isChatSetupComplete: boolean;
    videoPanelState: VideoPanelState;
    videoUrl: string | null;
    videoError: string | null;
    isGeneratingVideo: boolean;
    videoGenerationDuration: number | null;
    onBack: () => void;
    onGenerateVideo: () => void;
    generatedSlides: SlidesOutput['slides'] | null;
    onRegenerateVideo: () => void;
    onDownloadVideo: () => void;
    onNextSubmodule: (markCurrentCompleted?: boolean) => void;
    rightPanelDisplayMode: 'text' | 'video';
    setRightPanelDisplayMode: (mode: 'text' | 'video') => void;
}

interface QuizInteractionDataForView {
  questionId: string;
  questionTitle: string;
  questionText: string;
  userAnswer: string;
  isCorrect: boolean;
  correctAnswerDisplay: string;
  incorrectAttemptsCount?: number;
}


export default function LearningView({
    courseName,
    lessonName,
    textContentSummary, // Use this for "Read Lesson" context
    videoContentSummary, // Use this for "Watch Video" context
    textualLessonContent,
    learnerName,
    messages,
    setMessages,
    addMessage,
    chatInterfaceRef,
    onSetupComplete,
    isChatSetupComplete,
    videoPanelState,
    videoUrl,
    videoError,
    isGeneratingVideo,
    videoGenerationDuration,
    onBack,
    onGenerateVideo,
    generatedSlides,
    onRegenerateVideo,
    onDownloadVideo,
    onNextSubmodule,
    rightPanelDisplayMode,
    setRightPanelDisplayMode,
}: LearningViewProps) {
    const { toast } = useToast();
    const [isQuizMode, setIsQuizMode] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestionData[]>([]);
    // const [rightPanelDisplayMode, setRightPanelDisplayMode] = useState<'text' | 'video'>('text'); // Managed by parent

    const generatedSlidesCount = generatedSlides?.length ?? 0;

    useEffect(() => {
        const quizModeActive = lessonName.toLowerCase().includes('quiz');
        setIsQuizMode(quizModeActive);

        if (quizModeActive && generatedSlides) {
            const extractedQuizQuestions: QuizQuestionData[] = [];
            generatedSlides.forEach((slide, index) => {
                if (slide.type === 'quiz_slide') {
                    const answerSlide = generatedSlides[index + 1];
                    if (answerSlide && answerSlide.type === 'content_slide') {
                        extractedQuizQuestions.push({
                            id: slide.slideNumber.toString(),
                            questionTitle: slide.title,
                            questionText: slide.question,
                            options: slide.options,
                            correctAnswerText: answerSlide.content,
                        });
                    } else {
                         console.warn(`Quiz slide ${slide.slideNumber} found, but no subsequent answer explanation slide of type 'content_slide'.`);
                    }
                }
            });
            if (extractedQuizQuestions.length > 0) {
                setQuizQuestions(extractedQuizQuestions);
            } else if (quizModeActive) {
                 toast({ title: "Quiz Setup", description: "No valid quiz questions found in the slides for this lesson.", variant: "default" });
            }
        }
    }, [lessonName, generatedSlides, toast]);

    // Effect to update chat context when display mode changes
    useEffect(() => {
        if (isChatSetupComplete && chatInterfaceRef && 'current' in chatInterfaceRef && chatInterfaceRef.current) {
            const newSummary = rightPanelDisplayMode === 'text' ? textContentSummary : videoContentSummary;
            if (newSummary) {
                 // Simulate a system message to update the context for the AI
                const systemMessage = `<<Unstop>> Context updated. Learner is now viewing ${rightPanelDisplayMode === 'text' ? 'the textual lesson' : 'the video section'}. Use the following summary for guidance: ${newSummary.substring(0,1000)}...`; // Limit summary length for system message
                chatInterfaceRef.current.simulateUserInput(systemMessage, true); // true for hidden message
                console.log(`Chat context updated for ${rightPanelDisplayMode} view.`);
            }
        }
    }, [rightPanelDisplayMode, textContentSummary, videoContentSummary, isChatSetupComplete, chatInterfaceRef]);


    const handleQuizInteraction = (interactionData: QuizInteractionDataForView) => {
        const { questionTitle, questionText, userAnswer, isCorrect, correctAnswerDisplay, incorrectAttemptsCount } = interactionData;

        if (chatInterfaceRef && 'current' in chatInterfaceRef && chatInterfaceRef.current) {
            let botMessage: string;
            if (isCorrect) {
                const attemptsText = incorrectAttemptsCount !== undefined && incorrectAttemptsCount > 0
                    ? ` after ${incorrectAttemptsCount} incorrect attempt${incorrectAttemptsCount > 1 ? 's' : ''}`
                    : "";
                botMessage = `<<Unstop>> Learner correctly answered question: "${questionText}" (from "${questionTitle}")${attemptsText}. User's answer: "${userAnswer}".`;
            } else {
                botMessage = `<<Unstop>> Learner answered question: "${questionText}" (from "${questionTitle}"). User's incorrect answer: "${userAnswer}". The correct option is actually related to: "${correctAnswerDisplay}". Please provide a hint.`;
            }
            chatInterfaceRef.current.simulateUserInput(botMessage, true);
        } else {
            console.warn("ChatInterface ref not available to send quiz interaction system message.");
        }
    };

    const renderNonQuizContent = () => {
        if (videoPanelState === 'generating_video' && rightPanelDisplayMode === 'video') { // Only show this if video tab is active
            return (
                <CourseLoadingAnimation
                    courseName={`Lesson: ${lessonName}`}
                    loadingText="Generating video..."
                    countdownDuration={videoGenerationDuration}
                    itemCount={generatedSlidesCount}
                />
            );
        }

        // This is now handled by the AI response and useEffect in page.tsx
        // if (videoPanelState === 'video_error' && rightPanelDisplayMode === 'video') { 
        //     // ...
        // }
        
        return (
          <div className="w-full h-full flex flex-col">
            <Tabs 
                value={rightPanelDisplayMode} 
                onValueChange={(value) => setRightPanelDisplayMode(value as 'text' | 'video')}
                className="flex-grow flex flex-col mt-1 overflow-hidden"
            >
                <TabsList className="grid w-full grid-cols-2 h-9 md:h-10 mx-auto max-w-md flex-shrink-0">
                    <TabsTrigger value="text" className="text-xs md:text-sm px-2 py-1 md:px-3 md:py-1.5">
                        <BookOpen className="mr-1 md:mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" /> Read Lesson
                    </TabsTrigger>
                    <TabsTrigger value="video" className="text-xs md:text-sm px-2 py-1 md:px-3 md:py-1.5">
                        <Video className="mr-1 md:mr-1.5 h-3.5 w-3.5 md:h-4 md:w-4" /> Watch Video
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="mt-2 flex-grow overflow-hidden">
                    <SlideTextContentView markdownContent={textualLessonContent} lessonName={lessonName} />
                </TabsContent>
                <TabsContent value="video" className="mt-2 flex-grow overflow-hidden flex flex-col items-center justify-center">
                    {videoPanelState === 'generating_video' ? (
                        <CourseLoadingAnimation
                            courseName={`Lesson: ${lessonName}`}
                            loadingText="Generating video..."
                            countdownDuration={videoGenerationDuration}
                            itemCount={generatedSlidesCount}
                        />
                    ) : videoPanelState === 'video_error' ? ( 
                        // This case will likely be preempted by the AI's response guiding to 'text' tab.
                        // Keeping a fallback UI here just in case.
                         <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 animate-fade-in space-y-4">
                            <HelpCircle className="w-16 h-16 text-destructive" />
                            <h3 className="text-xl font-semibold text-destructive-foreground">Video Generation Error</h3>
                            <p className="text-sm text-muted-foreground max-w-md">{videoError || "An unexpected error occurred. Please try the 'Read Lesson' tab or regenerate."}</p>
                            <Button onClick={onRegenerateVideo} variant="outline" size="lg" disabled={isGeneratingVideo}>
                                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                            </Button>
                        </div>
                    ) : videoUrl ? ( 
                        <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in p-1 md:p-2">
                            <Suspense fallback={<Loader2 className="h-6 w-6 md:h-8 md:h-8 animate-spin text-primary" />} >
                                <VideoPlayer videoUrl={videoUrl} />
                            </Suspense>
                            <div className="mt-3 flex flex-wrap justify-center gap-2 md:gap-3">
                                 <Button onClick={onDownloadVideo} size="sm" variant="outline" className="glow-button text-xs md:text-sm">
                                     <Download className="mr-1 h-3.5 w-3.5 md:h-4 md:w-4" /> Download
                                 </Button>
                                 <Button onClick={onRegenerateVideo} variant="outline" size="sm" disabled={isGeneratingVideo} className="text-xs md:text-sm">
                                    <RefreshCw className="mr-1 h-3.5 w-3.5 md:h-4 md:w-4" /> Regenerate
                                </Button>
                            </div>
                        </div>
                    ) : ( 
                         <div className="text-center py-6 md:py-8 h-full flex flex-col items-center justify-center space-y-3 md:space-y-4">
                            <Video className="w-12 h-12 md:w-16 md:h-16 text-primary opacity-70" />
                            <p className="text-base md:text-lg text-foreground">
                                Ready to watch the lesson?
                            </p>
                            <p className="text-xs md:text-sm text-muted-foreground max-w-xs">
                                Click below to generate an AI-powered video summary of this lesson.
                            </p>
                            <Button
                                onClick={onGenerateVideo}
                                size="lg"
                                className="glow-button text-sm md:text-base"
                                disabled={isGeneratingVideo || generatedSlidesCount === 0}
                            >
                                <Zap className="mr-1.5 md:mr-2 h-4 w-4 md:h-5 md:w-5" />
                                {isGeneratingVideo ? "Generating..." : "Generate Video Lesson"}
                            </Button>
                            {generatedSlidesCount === 0 && <p className="text-xs text-destructive mt-1">No slides available to generate video.</p>}
                         </div>
                    )}
                </TabsContent>
            </Tabs>

            <div className="p-3 md:p-4 border-t border-border/30 flex-shrink-0 text-center mt-auto">
                <Button
                    onClick={() => onNextSubmodule(true)}
                    size="lg"
                    variant="default"
                    className="glow-button text-sm md:text-base"
                >
                    <CheckSquare className="mr-2 h-4 w-4 md:h-5 md:h-5"/> Mark Complete & Next
                </Button>
            </div>
          </div>
        );
    };


    const rightPanelContent = () => {
      if (isQuizMode) {
        return (
          <div className="w-full h-full flex flex-col items-center justify-center z-10 animate-fade-in p-2 md:p-0">
            {quizQuestions.length > 0 ? (
              <QuizPlayer
                questions={quizQuestions}
                onQuizInteraction={handleQuizInteraction}
                onNextSubmodule={() => onNextSubmodule(true)}
              />
            ) : (
              <div className="text-center p-4 md:p-6 bg-card/80 backdrop-blur-md rounded-lg shadow-lg border border-border/30">
                <Zap className="w-10 h-10 md:w-16 md:h-16 text-primary mx-auto mb-2 md:mb-4" />
                <p className="text-sm md:text-lg text-muted-foreground">Quiz content is loading or not available for this lesson.</p>
                {onNextSubmodule && (
                  <Button onClick={() => onNextSubmodule(true)} size="lg" className="glow-button mt-4 md:mt-6 text-sm md:text-base">
                    Next Submodule <ChevronRight className="ml-2 h-4 w-4 md:h-5 md:h-5" />
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      }
      return renderNonQuizContent();
    };


    return (
        <div className="w-full h-full flex flex-col md:flex-row bg-gradient-to-br from-background via-background/95 to-secondary/10">
            <div className={cn(
                "relative flex flex-col border-r border-border/20 transition-all duration-700 ease-in-out",
                isChatSetupComplete ? (isQuizMode ? "md:w-[40%] lg:w-1/3" : "md:w-[45%] lg:w-2/5") : "w-full md:w-full",
                "h-1/2 md:h-full p-1.5 md:p-2.5"
            )}>
                 <div className="flex items-center justify-between mb-1.5 md:mb-2 flex-shrink-0 px-1">
                    <h1 className="text-md md:text-lg font-bold text-primary header-glow truncate max-w-[calc(100%-100px)]">
                        TraiHVail
                    </h1>
                    <Button variant="ghost" size="sm" onClick={onBack} className="px-1.5 py-1 md:px-2">
                        <Edit3 className="mr-1 h-3.5 w-3.5 md:h-4 md:w-4" />
                        <span className="hidden sm:inline text-xs md:text-sm">Slides</span>
                    </Button>
                </div>
                <h2 className="text-xs md:text-sm text-muted-foreground mb-1.5 md:mb-2 text-center flex-shrink-0 px-1 truncate">
                    {courseName} - {lessonName}
                </h2>
                <div className="flex-grow overflow-hidden relative rounded-md border border-border/10 shadow-inner bg-background/30">
                     {textContentSummary || videoContentSummary || learnerName ? ( // Ensure one of the summaries or learnerName is present
                        <ChatInterface
                            ref={chatInterfaceRef}
                            initialCourseName={courseName}
                            initialLessonName={lessonName}
                            initialContentSummary={rightPanelDisplayMode === 'text' ? textContentSummary : videoContentSummary} // Pass the relevant summary
                            initialLearnerName={learnerName}
                            messages={messages}
                            setMessages={setMessages}
                            addMessage={addMessage}
                            onSetupComplete={onSetupComplete}
                            isGeneratingVideo={isGeneratingVideo}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 md:h-8 md:h-8 animate-spin text-primary" />
                            <p className="ml-2 text-muted-foreground text-sm md:text-base">Initializing Assistant...</p>
                        </div>
                    )}
                </div>
            </div>

            <div className={cn(
                "relative flex flex-col items-center justify-start overflow-hidden transition-all duration-700 ease-in-out",
                isChatSetupComplete ? (isQuizMode ? "md:w-[60%] lg:w-2/3" : "md:w-[55%] lg:w-3/5") : "w-0 md:w-0 opacity-0 pointer-events-none", 
                "h-1/2 md:h-full p-1.5 md:p-2.5" 
            )}>
                <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
                    <div className="absolute inset-0 bg-grid-pattern animate-grid-scroll animation-delay-500ms"></div>
                </div>
                {isChatSetupComplete && rightPanelContent()}
            </div>
        </div>
    );
}

