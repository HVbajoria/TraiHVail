
'use client';

import React, { Suspense } from 'react';
import { Loader2, Video, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatInterface, { type Message, type ChatInterfaceHandle } from '@/components/chat/ChatInterface';
import { VideoPlayer } from '@/components/video/VideoPlayer'; // Ensure correct import path
import CourseLoadingAnimation from '@/components/course/CourseLoadingAnimation';
import { cn } from '@/lib/utils';
import type { AppState, VideoPanelState } from '@/types/app'; // Import shared types

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
    generatedSlidesCount: number; // Pass slide count for loading animation
    onRegenerateVideo: () => void; // Callback to reset video state to 'idle'
    onDownloadVideo: () => void; // Callback to handle video download
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
    generatedSlidesCount,
    onRegenerateVideo,
    onDownloadVideo
}: LearningViewProps) {
    return (
        <div className="w-full h-full flex flex-col md:flex-row bg-gradient-to-br from-background via-background/95 to-secondary/10">
            {/* Left Panel: Chat Interface */}
            <div className={cn(
                "w-full h-full flex flex-col p-2 md:p-4 border-r border-border/20 transition-all duration-700 ease-in-out",
                isChatSetupComplete ? "md:w-1/2 lg:w-1/3" : "md:w-full" // Adjust width based on chat setup
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
                        initialContentSummary={contentSummary} // Pass the summary here
                        initialLearnerName={learnerName}
                        messages={messages}
                        setMessages={setMessages}
                        addMessage={addMessage}
                        onSetupComplete={onSetupComplete}
                        isGeneratingVideo={isGeneratingVideo}
                    />
                </div>
            </div>

            {/* Right Panel: Video Area */}
            <div className={cn(
                "h-full flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden transition-all duration-700 ease-in-out",
                isChatSetupComplete ? "w-full md:w-1/2 lg:w-2/3" : "w-0 md:w-0", // Expand when chat setup is complete
                !isChatSetupComplete && "opacity-0 pointer-events-none" // Hide initially
            )}>
                <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                    <div className="absolute inset-0 bg-grid-pattern animate-grid-scroll animation-delay-500ms"></div>
                </div>

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
                        itemCount={generatedSlidesCount} // Display slide count if needed
                        countdownDuration={videoGenerationDuration} // Pass countdown duration
                    />
                )}

                {videoPanelState === 'video_ready' && videoUrl && (
                    <div className="w-full h-full flex flex-col items-center justify-center animate-fade-in z-10">
                        <h3 className="text-lg md:text-xl text-muted-foreground mb-4">Lesson Video</h3>
                        <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
                            <VideoPlayer videoUrl={videoUrl} />
                        </Suspense>
                        <div className="mt-6 flex flex-col sm:flex-row gap-4">
                            {/* Button to generate again */}
                            <Button
                                onClick={onRegenerateVideo}
                                variant="outline"
                                disabled={isGeneratingVideo}
                            >
                                Generate New Video
                            </Button>
                            {/* Download Button */}
                            <Button
                                onClick={onDownloadVideo}
                                size="lg"
                                className="glow-button"
                                disabled={isGeneratingVideo}
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
                            onClick={onRegenerateVideo} // Allow retry by setting state back to 'idle'
                            variant="outline"
                            disabled={isGeneratingVideo}
                        >
                            Try Again?
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
