
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import SlideDisplay from '@/components/slides/SlideDisplay';
import { ArrowLeft, Bot, Pencil } from 'lucide-react';
import type { SlidesOutput } from '@/ai/flows/generate-slides';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SlidesViewProps {
  courseName: string;
  lessonName?: string;
  slides: SlidesOutput['slides'] | null;
  onBack: () => void;
  onEdit: () => void;
  onLaunchLearning: () => void;
}

export default function SlidesView({
  courseName,
  lessonName,
  slides,
  onBack,
  onEdit,
  onLaunchLearning,
}: SlidesViewProps) {
  const fullTitle = lessonName ? `${courseName} - ${lessonName}` : courseName;

  return (
    // This div will now take the height from its parent, which is set by contentWrapperClasses in page.tsx
    <div className="w-full h-full flex flex-col animate-fade-in bg-card/70 backdrop-blur-md rounded-lg shadow-xl border border-primary/20 p-4">
      <div className="flex items-center justify-between mb-4 px-2 pt-2 flex-shrink-0">
        <h1 className="text-xl md:text-2xl font-bold text-primary header-glow">
          {fullTitle}
        </h1>
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course Structure
        </Button>
      </div>
      <ScrollArea className="flex-grow mb-4">
        {slides ? <SlideDisplay slides={slides} /> : <p>Loading slides...</p>}
      </ScrollArea>
      <div className="flex justify-center items-center gap-4 mt-auto pt-4 border-t border-border/30">
        <Button
          onClick={onEdit}
          size="lg"
          variant="outline"
          className="relative overflow-hidden group"
          disabled={!slides}
        >
          <span className="relative z-10 flex items-center">
            <Pencil className="mr-2 h-5 w-5 group-hover:animate-pulse" />
            Edit Slides
          </span>
        </Button>

        <Button
          onClick={onLaunchLearning}
          size="lg"
          className="glow-button relative overflow-hidden group"
          disabled={!slides}
        >
          <div className="radar-spinner"></div>
          <span className="relative z-10 flex items-center">
            <Bot className="mr-2 h-5 w-5 group-hover:animate-pulse" />
            Let's Learn
          </span>
        </Button>
      </div>
    </div>
  );
}
