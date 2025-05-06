
'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { Loader2, Video, BookOpen, Lightbulb, HelpCircle, Zap } from 'lucide-react'; // Added Zap for quiz
import { Button } from '@/components/ui/button';
import ChatInterface, { type Message, type ChatInterfaceHandle } from '@/components/chat/ChatInterface';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import CourseLoadingAnimation from '@/components/course/CourseLoadingAnimation';
import QuizPlayer, { type QuizQuestionData } from '@/components/quiz/QuizPlayer'; // Import QuizPlayer
import type { SlidesOutput } from '@/ai/flows/generate-slides';
import { cn } from '@/lib/utils';
import type { VideoPanelState } from '@/types/app';
import { useToast } from '@/hooks/use-toast';

interface LearningViewProps {
    courseName: string;
    lessonName: string;
    contentSummary: string;
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
    generatedSlides: SlidesOutput['slides'] | null; // Pass full slides for quiz
    onRegenerateVideo: () => void;
    onDownloadVideo: () => void;
}

export default function LearningView({
    courseName,
    lessonName,
    contentSummary,
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
    generatedSlides, // Receive generatedSlides
    onRegenerateVideo,
    onDownloadVideo
}: LearningViewProps) {
    const { toast } = useToast();
    const [isQuizMode, setIsQuizMode] = useState(false);
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestionData[]>([]);

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
                            // Attempt to parse the correct answer from the explanation slide
                            // This is a basic parsing and might need refinement based on actual AI output.
                            correctAnswerText: answerSlide.content, // Store full explanation for now
                        });
                    } else {
                         console.warn(`Quiz slide ${slide.slideNumber} found, but no subsequent answer slide.`);
                    }
                }
            });
            if (extractedQuizQuestions.length > 0) {
                setQuizQuestions(extractedQuizQuestions);
            } else {
                 toast({ title: "Quiz Setup", description: "No quiz questions found in the slides for this lesson.", variant: "default" });
            }
        }
    }, [lessonName, generatedSlides, toast]);

    const handleQuizInteraction = (interactionData: {
        questionTitle: string;
        questionText: string;
        userAnswer: string;
        isCorrect: boolean;
        correctAnswerDisplay: string; // Text of the correct option or full explanation
    }) => {
        const { questionTitle, questionText, userAnswer, isCorrect, correctAnswerDisplay } = interactionData;
        const botMessage = `<<Unstop>> Learner answered question: "${questionText}" (from "${questionTitle}"). User's answer: "${userAnswer}". Correct: ${isCorrect}. Correct answer/explanation: "${correctAnswerDisplay}"`;
        
        if (chatInterfaceRef && 'current' in chatInterfaceRef && chatInterfaceRef.current) {
            chatInterfaceRef.current.simulateUserInput(botMessage, true);
        } else {
            console.warn("ChatInterface ref not available to send quiz interaction system message.");
        }
        // Optionally, add a visible message to the chat?
        // addMessage('ai', `For "${questionTitle}", you answered ${userAnswer}. That was ${isCorrect ? 'correct!' : 'not quite right.'}`);
    };

    const generatedSlidesCount = generatedSlides?.length ?? 0;

    return (
        <div className="w-full h-full flex flex-col md:flex-row bg-gradient-to-br from-background via-background/95 to-secondary/10">
            {/* Left Panel: Chat Interface */}
            <div className={cn(
                "w-full h-full flex flex-col p-2 md:p-4 border-r border-border/20 transition-all duration-700 ease-in-out",
                isChatSetupComplete ? (isQuizMode ? "md:w-1/2 lg:w-2/5" : "md:w-1/2 lg:w-1/3") : "md:w-full"
            )}>
                <div className="flex items-center justify-between mb-2 md:mb-4 flex-shrink-0 px-2">
                    <h1 className="text-xl md:text-2xl font-bold text-primary header-glow">
                        TraiHVail Assistant
                    </h1>
                    <Button variant="ghost" size="sm" onClick={onBack}>
                        <BookOpen className="mr-1 md:mr-2 h-4 w-4" />
                        <span className="hidden md:inline">Back to Slides</span>
                    </Button>
                </div>
                <h2 className="text-base md:text-lg text-muted-foreground mb-2 text-center flex-shrink-0">
                    {courseName} - {lessonName}
                </h2>
                <div className="flex-grow overflow-hidden relative">
                    <ChatInterface
                        ref={chatInterfaceRef}
                        initialCourseName={courseName}
                        initialLessonName={lessonName}
                        initialContentSummary={contentSummary}
                        initialLearnerName={learnerName}
                        messages={messages}
                        setMessages={setMessages}
                        addMessage={addMessage}
                        onSetupComplete={onSetupComplete}
                        isGeneratingVideo={isGeneratingVideo}
                    />
                </div>
            </div>

            {/* Right Panel: Video or Quiz Area */}
            <div className={cn(
                "h-full flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden transition-all duration-700 ease-in-out",
                isChatSetupComplete ? (isQuizMode ? "w-full md:w-1/2 lg:w-3/5" : "w-full md:w-1/2 lg:w-2/3") : "w-0 md:w-0",
                !isChatSetupComplete && "opacity-0 pointer-events-none"
            )}>
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                    <div className="absolute inset-0 bg-grid-pattern animate-grid-scroll animation-delay-500ms"></div>
                </div>

                {isQuizMode ? (
                    // Quiz Panel
                    <div className="w-full h-full flex flex-col items-center justify-center z-10 animate-fade-in">
                        <h3 className="text-xl md:text-2xl font-semibold text-primary mb-4 header-glow">Quiz: {lessonName}</h3>
                        {quizQuestions.length > 0 ? (
                            <QuizPlayer
                                questions={quizQuestions}
                                onQuizInteraction={handleQuizInteraction}
                            />
                        ) : (
                            <div className="text-center p-6 bg-card/80 backdrop-blur-md rounded-lg shadow-lg border border-border/30">
                                <Zap className="w-16 h-16 text-primary mx-auto mb-4" />
                                <p className="text-lg text-muted-foreground">Quiz content is loading or not available for this lesson.</p>
                                <p className="text-sm text-muted-foreground mt-2">Feel free to ask the assistant any questions you have!</p>
                            </div>
                        )}
                    </div>
                ) : (
                    // Video Panel
                    <>
                        {videoPanelState === 'idle' && (
                            <div className="text-center z-10 animate-fade-in">
                                <h3 className="text-lg md:text-xl text-muted-foreground mb-6">Ready to visualize the lesson?</h3>
                                <Button
                                    onClick={onGenerateVideo}
                                    size="lg"
                                    variant="secondary"
                                    className="glow-button relative overflow-hidden group"
                                    disabled={isGeneratingVideo}
                                >
                                    <span className="absolute inset-0 overflow-hidden rounded-md">
                                        <span className="absolute inset-0 translate-x-0 translate-y-0 bg-primary transition-transform duration-500 ease-out group-hover:translate-x-full group-hover:translate-y-full"></span>
                                        <span className="absolute inset-0 translate-x-full translate-y-full bg-primary/80 transition-transform duration-500 ease-out group-hover:translate-x-0 group-hover:translate-y-0"></span>
                                    </span>
                                    <span className="relative z-10 flex items-center">
                                        <Video className="mr-2 h-5 w-5 group-hover:animate-pulse" />
                                        Generate Course Video
                                    </span>
                                </Button>
                            </div>
                        )}

                        {videoPanelState === 'generating_video' && (
                            <CourseLoadingAnimation
                                courseName={`Lesson: ${lessonName}`}
                                loadingText={`Generating video... `}
                                itemCount={generatedSlidesCount}
                                countdownDuration={videoGenerationDuration}
                            />
                        )}

                        {videoPanelState === 'video_ready' && videoUrl && (
                            <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in z-10">
                                <h3 className="text-lg md:text-xl text-muted-foreground mb-4">Lesson Video</h3>
                                <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
                                    <VideoPlayer videoUrl={videoUrl} />
                                </Suspense>
                                <div className="mt-6 flex flex-col sm:flex-row gap-4">
                                    <Button
                                        onClick={onRegenerateVideo}
                                        variant="outline"
                                        disabled={isGeneratingVideo}
                                    >
                                        Generate New Video
                                    </Button>
                                    <Button
                                        onClick={onDownloadVideo}
                                        size="lg"
                                        className="glow-button"
                                        disabled={isGeneratingVideo || !videoUrl}
                                    >
                                        <Video className="mr-2 h-5 w-5" /> Download Video
                                    </Button>
                                </div>
                            </div>
                        )}
                        {videoPanelState === 'video_error' && (
                            <div className="w-full max-w-md text-center z-10 animate-fade-in">
                                <h3 className="text-xl md:text-2xl font-semibold text-destructive mb-4">Video Generation Failed</h3>
                                <p className="text-destructive-foreground mb-6 px-2">{videoError || "An unknown error occurred."}</p>
                                <Button
                                    onClick={onRegenerateVideo}
                                    variant="outline"
                                    disabled={isGeneratingVideo}
                                >
                                    Try Again?
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
