
'use client';

import React from 'react';
import CourseLoadingAnimation from '@/components/course/CourseLoadingAnimation';

interface GeneratingTextualContentViewProps {
  courseName: string;
  lessonName?: string;
}

export default function GeneratingTextualContentView({ courseName, lessonName }: GeneratingTextualContentViewProps) {
  const fullTitle = lessonName ? `${courseName} - ${lessonName}` : courseName;
  return (
    <CourseLoadingAnimation courseName={fullTitle} loadingText="Crafting textual lesson content..." />
  );
}
