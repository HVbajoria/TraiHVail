
'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, BrainCircuit, DatabaseZap } from 'lucide-react'; // More thematic icons

interface CourseLoadingAnimationProps {
  courseName: string;
  duration?: number; // Kept for potential future use, but countdownDuration takes precedence
  loadingText?: string; // Optional custom loading text
  itemCount?: number; // Kept for other loading scenarios
  countdownDuration?: number | null; // Duration in seconds for countdown timer
}

export default function CourseLoadingAnimation({
    courseName,
    duration, // Legacy duration prop
    loadingText = "Processing...", // Generic default text
    itemCount, // Kept for potential non-countdown uses
    countdownDuration, // New prop for countdown
}: CourseLoadingAnimationProps) {

  const [countdown, setCountdown] = useState<number | null>(countdownDuration);

  useEffect(() => {
    if (countdownDuration && countdownDuration > 0) {
        setCountdown(countdownDuration); // Initialize countdown
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000); // Update every second

        return () => clearInterval(interval); // Cleanup interval on unmount
    } else {
         setCountdown(null); // Ensure countdown is null if no duration provided
    }
  }, [countdownDuration]); // Re-run effect if countdownDuration changes

  const displayValue = countdown !== null ? countdown : itemCount;
  const showIcon = displayValue === undefined || displayValue === null || countdownDuration === undefined; // Show icon if no countdown or item count

  return (
    <div className="flex flex-col items-center justify-center h-[85vh] text-center p-6 animate-fade-in">
      <div className="relative w-64 h-64 mb-8">
        {/* Outer spinning ring */}
        <div className="absolute inset-0 border-4 border-primary/30 rounded-full animate-spin animation-duration-3s"></div>
        {/* Inner pulsing ring */}
        <div className="absolute inset-4 border-2 border-primary/50 rounded-full animate-pulse animation-delay-100ms"></div>
        {/* Central element: Display countdown, count, or icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {!showIcon ? ( // If we have a displayValue (countdown or item count)
            <span className="text-6xl font-bold text-primary animate-pulse-glow animation-duration-2s tabular-nums">
              {/* Display countdown or item count */}
              {displayValue}
              {/* Add 's' suffix only for countdown */}
              {countdown !== null && countdownDuration !== null && 's'}
            </span>
          ) : (
             // Fallback to the icon
             <BrainCircuit className="w-24 h-24 text-primary animate-pulse-glow animation-duration-2s" />
          )}
        </div>
         {/* Orbiting icons */}
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

// Add necessary keyframes if not already in globals.css
/*
@keyframes orbit {
    from { transform: rotate(0deg) translateX(110px) rotate(0deg); }
    to   { transform: rotate(360deg) translateX(110px) rotate(-360deg); }
}
.animate-orbit {
    animation: orbit linear infinite;
}
.animation-duration-3s { animation-duration: 3s; }
.animation-duration-6s { animation-duration: 6s; }
.animation-duration-8s { animation-duration: 8s; }
.animation-reverse { animation-direction: reverse; }
.animation-delay-100ms { animation-delay: 100ms; }
.animation-delay-500ms { animation-delay: 500ms; }
*/

