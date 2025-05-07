
'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, BrainCircuit, DatabaseZap } from 'lucide-react'; // More thematic icons

interface CourseLoadingAnimationProps {
  courseName: string;
  duration?: number; 
  loadingText?: string;
  itemCount?: number; 
  countdownDuration?: number | null;
}

export default function CourseLoadingAnimation({
    courseName,
    duration, 
    loadingText = "Processing...", 
    itemCount, 
    countdownDuration, 
}: CourseLoadingAnimationProps) {

  const [countdown, setCountdown] = useState<number | null>(countdownDuration);

  useEffect(() => {
    if (countdownDuration && countdownDuration > 0) {
        setCountdown(countdownDuration); 
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000); 

        return () => clearInterval(interval); 
    } else {
         setCountdown(null); 
    }
  }, [countdownDuration]); 

  const displayValue = countdown !== null ? countdown : itemCount;
  const showIcon = displayValue === undefined || displayValue === null || countdownDuration === undefined;

  return (
    // This div will now take the height from its parent (e.g., contentWrapper in page.tsx or view components)
    <div className="flex flex-col items-center justify-center h-full text-center p-6 animate-fade-in">
      <div className="relative w-64 h-64 mb-8">
        <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-spin animation-duration-3s"></div>
        <div className="absolute inset-4 border-2 border-primary/50 rounded-full animate-pulse animation-delay-100ms"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          {!showIcon ? ( 
            <span className="text-6xl font-bold text-primary animate-pulse-glow animation-duration-2s tabular-nums">
              {displayValue}
              {countdown !== null && countdownDuration !== null && 's'}
            </span>
          ) : (
             <BrainCircuit className="w-24 h-24 text-primary animate-pulse-glow animation-duration-2s" />
          )}
        </div>
         <DatabaseZap className="absolute w-8 h-8 text-accent top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 animate-orbit" style={{ animationDuration: '8s', animationDelay: '0s' }} />
         <Loader2 className="absolute w-8 h-8 text-accent bottom-0 left-1/2 transform -translate-x-1/2 translate-y-4 animate-orbit animation-reverse" style={{ animationDuration: '6s', animationDelay: '-2s' }} />
      </div>
      <h2 className="text-2xl md:text-3xl font-semibold text-primary mb-2 header-glow">
        {loadingText}
      </h2>
      <p className="text-lg text-muted-foreground mb-4">
        Processing: <span className="font-medium text-foreground">{courseName}</span>
      </p>
      <p className="text-sm text-muted-foreground animate-pulse">
        Engaging AI protocols... mapping learning pathways... (This might take a moment)
      </p>
    </div>
  );
}
