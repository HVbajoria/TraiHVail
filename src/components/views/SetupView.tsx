'use client';

import React from 'react';
import CourseSetupForm from '@/components/course/CourseSetupForm';

interface SetupViewProps {
  onSubmit: (courseName: string, file: File | null) => void;
  onBack: () => void;
}

export default function SetupView({ onSubmit, onBack }: SetupViewProps) {
  return (
    <CourseSetupForm onSubmit={onSubmit} onBack={onBack} />
  );
}
