'use client';

import React from 'react';
import CourseLoadingAnimation from '@/components/course/CourseLoadingAnimation';

interface GeneratingSlidesViewProps {
  courseName: string;
  lessonName?: string;
}

export default function GeneratingSlidesView({ courseName, lessonName }: GeneratingSlidesViewProps) {
  const fullTitle = lessonName ? `${courseName} - ${lessonName}` : courseName;
  return (
    <CourseLoadingAnimation courseName={fullTitle} loadingText="Generating interactive slides..." />
  );
}
