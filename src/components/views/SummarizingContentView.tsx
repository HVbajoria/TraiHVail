'use client';

import React from 'react';
import CourseLoadingAnimation from '@/components/course/CourseLoadingAnimation';

interface SummarizingContentViewProps {
  courseName: string;
  lessonName?: string;
}

export default function SummarizingContentView({ courseName, lessonName }: SummarizingContentViewProps) {
  const fullTitle = lessonName ? `${courseName} - ${lessonName}` : courseName;
  return (
    <CourseLoadingAnimation courseName={fullTitle} loadingText="Preparing the learning environment..." />
  );
}
