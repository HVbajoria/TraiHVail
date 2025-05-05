'use client';

import React from 'react';
import CourseStructureDisplay, { type CourseModule } from '@/components/course/CourseStructureDisplay';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StructureViewProps {
  courseName: string;
  modules: CourseModule[];
  onStartLesson: (module: CourseModule) => void;
  onBack: () => void;
}

export default function StructureView({ courseName, modules, onStartLesson, onBack }: StructureViewProps) {
  return (
    <div className="h-[calc(100vh-6rem)] w-full">
      <ScrollArea className="h-full w-full rounded-lg border border-border/30 bg-card/50 backdrop-blur-sm p-1 shadow-lg">
        <CourseStructureDisplay
          courseName={courseName}
          modules={modules}
          onStartLesson={onStartLesson}
          onBack={onBack}
        />
      </ScrollArea>
    </div>
  );
}
