'use client';

import React from 'react';
import { Rocket } from 'lucide-react';

export default function LaunchingView() {
  return (
    <div className="flex flex-col items-center justify-center h-[85vh] text-center p-6 animate-fade-in">
      {/* Full screen rocket launch animation */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Rocket className="w-24 h-24 text-primary animate-rocket-launch-fullscreen" />
      </div>
      <p className="text-lg text-muted-foreground mt-32 animate-fade-in-delay">
        Powering up TraiHVail... engaging AI protocols...
      </p>
    </div>
  );
}
