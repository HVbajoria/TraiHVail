
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Rocket, Sparkles } from 'lucide-react'; // Using Sparkles for a magical AI feel

interface LandingPageProps {
  onStartChat: () => void;
}

export default function LandingPage({ onStartChat }: LandingPageProps) {
  return (
    <div className="relative flex flex-col items-center justify-center h-[85vh] text-center p-6 rounded-lg bg-card/80 backdrop-blur-lg border border-primary/20 shadow-2xl shadow-primary/20 transform-style-3d transition-transform duration-700 hover:scale-[1.02] hover:rotate-x-2 hover:rotate-y-1 animate-fade-in"> {/* Enhanced styling and 3D hover */}
       {/* Animated Futuristic Grid Background (Handled globally) */}

      {/* Content */}
      <div className="relative z-10">
         <Sparkles className="w-20 h-20 text-primary mb-6 animate-pulse-glow" /> {/* Changed icon */}
         <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-primary header-glow">
          Welcome to TraiHVail {/* Updated App Name */}
         </h1>
         <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Your intelligent assistant for practice-based technical learning. Ready to accelerate your skills?
         </p>
         <Button
            onClick={onStartChat}
            size="lg"
            className="relative overflow-hidden group bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-300 ease-in-out shadow-lg hover:shadow-primary/40 transform hover:scale-105 active:scale-95 glow-button px-8 py-6 text-lg" // Enhanced button styling, ADDED group class
         >
            {/* Radar Spinner - Animates by default and speeds up on hover via CSS */}
            <div className="radar-spinner"></div>
            <span className="relative z-10 flex items-center gap-2"> {/* Added relative and z-10 */}
              {/* Added group-hover:animate-rocket-takeoff-button back */}
              <Rocket className="w-5 h-5 group-hover:animate-rocket-takeoff-button" />
              Launch Assistant
            </span>
         </Button>
      </div>

      {/* Subtle 3D decorative elements - handled globally */}
    </div>
  );
}

