'use client';

import React from 'react';
import CourseLoadingAnimation from '@/components/course/CourseLoadingAnimation';

interface ParsingViewProps {
  courseName: string;
}

export default function ParsingView({ courseName }: ParsingViewProps) {
  return (
    <CourseLoadingAnimation courseName={courseName} loadingText="Parsing course file..." />
  );
}
