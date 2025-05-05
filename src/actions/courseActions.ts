'use server';

import { generateSlides, type GenerateSlidesInput, type SlidesOutput } from '@/ai/flows/generate-slides';
import { summarizeLearningContent, type SummarizeLearningContentInput, type SummarizeLearningContentOutput } from '@/ai/flows/summarize-learning-content'; // Import summary flow
import { z } from 'zod';

// --- Generate Slides Action ---

const GenerateSlidesActionInputSchema = z.object({
  submoduleName: z.string().min(1, "Submodule name is required."),
  submoduleDescription: z.string().optional(),
});

type GenerateSlidesActionResult = {
    success: boolean;
    data?: SlidesOutput;
    error?: string;
    errors?: z.ZodIssue[]; // For validation errors
};

export async function generateSlidesAction(input: GenerateSlidesInput): Promise<GenerateSlidesActionResult> {
  const validationResult = GenerateSlidesActionInputSchema.safeParse(input);
  if (!validationResult.success) {
    return { success: false, errors: validationResult.error.issues };
  }

  try {
    const result = await generateSlides(validationResult.data);
    return { success: true, data: result };
  } catch (error) {
    console.error("AI Action Error (generateSlides):", error);
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred while generating the slides." };
  }
}


// --- Summarize Slides Action ---

// Input schema mirrors the SummarizeLearningContentInput, accepting the SlidesOutput structure
const SummarizeSlidesActionInputSchema = z.object({
    slides: z.array(z.any()).min(1, "Slide data is required."), // Expects the array of slide objects
    submoduleName: z.string().min(1, "Submodule name is required."),
});

type SummarizeSlidesActionResult = {
    success: boolean;
    data?: SummarizeLearningContentOutput;
    error?: string;
    errors?: z.ZodIssue[];
};

export async function summarizeSlidesAction(input: SummarizeLearningContentInput): Promise<SummarizeSlidesActionResult> {
  // Validate the input structure (slides array and submodule name)
  const validationResult = SummarizeSlidesActionInputSchema.safeParse(input);
  if (!validationResult.success) {
    return { success: false, errors: validationResult.error.issues };
  }

  try {
    // Pass the validated slides data and submodule name to the summarizeLearningContent flow
    const result = await summarizeLearningContent(validationResult.data);
    return { success: true, data: result };
  } catch (error) {
    console.error("AI Action Error (summarizeSlides):", error);
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred while summarizing the slides." };
  }
}
