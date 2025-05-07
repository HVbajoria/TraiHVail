
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Check, X } from 'lucide-react';
import type { SlidesOutput } from '@/ai/flows/generate-slides';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

type Slide = SlidesOutput['slides'][number];

interface EditSlidesViewProps {
  initialSlides: Slide[];
  onSave: (editedSlides: Slide[]) => void;
  onCancel: () => void;
  courseName: string;
  lessonName?: string;
}

export default function EditSlidesView({
  initialSlides,
  onSave,
  onCancel,
  courseName,
  lessonName,
}: EditSlidesViewProps) {
  const [jsonString, setJsonString] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isValidJson, setIsValidJson] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      setJsonString(JSON.stringify({ slides: initialSlides }, null, 2));
      setParseError(null);
      setIsValidJson(true);
    } catch (error) {
      console.error("Error stringifying initial slides:", error);
      setJsonString('// Error loading slides. Please check the console.');
      setParseError('Could not load initial slide structure.');
      setIsValidJson(false);
    }
  }, [initialSlides]);

  const handleJsonChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newJsonString = event.target.value;
    setJsonString(newJsonString);
    try {
      const parsed = JSON.parse(newJsonString);
      if (parsed && Array.isArray(parsed.slides)) {
          setParseError(null);
          setIsValidJson(true);
      } else {
          throw new Error("Invalid structure: Missing 'slides' array.");
      }
    } catch (error) {
      setParseError(error instanceof Error ? error.message : 'Invalid JSON format.');
      setIsValidJson(false);
    }
  };

  const handleSaveChanges = () => {
    if (!isValidJson) {
      toast({
        title: 'Validation Error',
        description: 'Cannot save, the JSON is invalid.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const parsedData = JSON.parse(jsonString);
      if (parsedData && Array.isArray(parsedData.slides)) {
        onSave(parsedData.slides);
      } else {
        throw new Error("Invalid structure after parsing: Missing 'slides' array.");
      }
    } catch (error) {
      console.error("Error saving edited slides:", error);
      toast({
        title: 'Save Error',
        description: error instanceof Error ? error.message : 'Failed to save changes.',
        variant: 'destructive',
      });
    }
  };

  const fullTitle = lessonName ? `${courseName} - ${lessonName}` : courseName;

  return (
    // This div will now take the height from its parent, which is set by contentWrapperClasses in page.tsx
    <div className="w-full h-full flex flex-col animate-fade-in bg-card/70 backdrop-blur-md rounded-lg shadow-xl border border-primary/20 p-4">
      <div className="flex items-center justify-between mb-4 px-2 pt-2 flex-shrink-0">
        <h1 className="text-xl md:text-2xl font-bold text-primary header-glow">
          Edit Slides: {fullTitle}
        </h1>
      </div>
      <Card className="flex-grow flex flex-col overflow-hidden border-none shadow-none bg-transparent">
        <CardContent className="flex-grow flex flex-col p-0 relative">
          {parseError && (
            <div className="absolute top-2 right-2 z-10 flex items-center gap-2 bg-destructive/90 text-destructive-foreground p-2 rounded-md text-xs shadow-lg">
              <AlertTriangle className="w-4 h-4" />
              <span>{parseError}</span>
            </div>
          )}
           <ScrollArea className="flex-grow">
              <Textarea
                value={jsonString}
                onChange={handleJsonChange}
                placeholder="Enter or paste slide JSON here..."
                className={cn(
                  "w-full h-full min-h-[calc(100vh-16rem)] resize-none font-mono text-sm p-4 rounded-md", // Ensure textarea takes available height
                  "bg-muted/30 border focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50",
                  !isValidJson ? "border-destructive focus:ring-destructive/50 focus:border-destructive/50" : "border-border/50"
                )}
                aria-invalid={!isValidJson}
              />
           </ScrollArea>
        </CardContent>
      </Card>
      <div className="flex justify-end items-center gap-4 mt-4 pt-4 border-t border-border/30 flex-shrink-0">
        <Button
          variant="outline"
          onClick={onCancel}
          size="lg"
          className="flex items-center gap-2"
        >
          <X className="w-5 h-5" /> Cancel
        </Button>
        <Button
          onClick={handleSaveChanges}
          size="lg"
          disabled={!isValidJson}
          className={cn("flex items-center gap-2", isValidJson && "glow-button")}
        >
          <Check className="w-5 h-5" /> Save Changes
        </Button>
      </div>
    </div>
  );
}
