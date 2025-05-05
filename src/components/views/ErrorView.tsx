'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ErrorViewProps {
  onBack: () => void;
  message?: string;
}

export default function ErrorView({ onBack, message }: ErrorViewProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 animate-fade-in">
      <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-2xl font-semibold text-destructive mb-2">Oops! Something went wrong.</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        {message || "An unexpected error occurred or the state is invalid."}
      </p>
      <Button onClick={onBack} variant="outline" className="mt-4">
        Go Back
      </Button>
    </div>
  );
}
