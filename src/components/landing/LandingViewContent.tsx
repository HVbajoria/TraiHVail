
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Rocket, Sparkles, Bot, BookOpen, Video } from 'lucide-react';

interface LandingViewContentProps {
  onStart: () => void;
  logoUrl: string;
}

// Feature component (remains the same)
const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
  <div className="flex flex-col items-center p-4 rounded-lg bg-card/30 backdrop-blur-sm border border-primary/10 shadow-lg transition-transform duration-300 hover:scale-105 hover:border-primary/30 h-full">
    <Icon className="w-10 h-10 text-primary mb-3" />
    <h3 className="text-lg font-semibold mb-1 text-foreground text-center">{title}</h3>
    <p className="text-sm text-muted-foreground text-center">{description}</p>
  </div>
);

export default function LandingViewContent({ onStart, logoUrl }: LandingViewContentProps) {
  return (
    // Container styling applied in page.tsx now, this just holds the content
    <div className="relative flex flex-col items-center justify-center w-full min-h-[calc(100vh-4rem)] text-center p-4 md:p-6 lg:p-8 animate-fade-in">
      {/* Content Wrapper */}
      <div className="relative z-10 max-w-4xl w-full">
         <Sparkles className="w-12 md:w-16 h-12 md:h-16 text-primary mb-4 mx-auto animate-pulse-glow" />
         <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 text-primary header-glow">
          Welcome to TraiHVail
         </h1>
         <p className="text-base md:text-xl text-muted-foreground mb-8 md:mb-10 max-w-2xl mx-auto">
          Your intelligent assistant for practice-based technical learning. Upload your course, get interactive slides, video summaries, and AI tutoring!
         </p>

         {/* Features Section */}
         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-10 md:mb-12">
           <FeatureCard
             icon={BookOpen}
             title="Interactive Slides"
             description="Generate engaging slides from your course structure automatically."
           />
           <FeatureCard
             icon={Bot}
             title="AI Tutoring"
             description="Get personalized help and guidance from our AI assistant, Rookie & Pookie."
           />
           <FeatureCard
             icon={Video}
             title="Video Summaries"
             description="Create concise video overviews of your lessons with AI voiceover."
           />
         </div>

         {/* Call to Action Button */}
         <Button
            onClick={onStart}
            size="lg"
            className="relative overflow-hidden group bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 ease-in-out shadow-lg hover:shadow-primary/40 transform hover:scale-105 active:scale-95 glow-button px-6 py-3 md:px-8 md:py-6 text-base md:text-lg"
         >
            <div className="radar-spinner group-hover:animate-radar-spin"></div>
            <span className="relative z-10 flex items-center gap-2">
              <Rocket className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:animate-rocket-takeoff-button" />
              Unstop Learn
            </span>
         </Button>
      </div>
    </div>
  );
}
