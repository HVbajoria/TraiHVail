
'use server';

import { generateSlides, type GenerateSlidesInput, type SlidesOutput } from '@/ai/flows/generate-slides';
import { summarizeLearningContent, type SummarizeLearningContentInput, type SummarizeLearningContentOutput } from '@/ai/flows/summarize-learning-content';
import { generateTextualContent, type GenerateTextualContentInput, type GenerateTextualContentOutput } from '@/ai/flows/generate-textual-content'; // Import new flow
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


// --- Summarize Learning Content Action (for AI tutor context) ---

// Updated: This action now handles summarizing either slides or textual content.
const SummarizeContentActionInputSchema = z.object({
    slides: z.array(z.any()).optional(),
    textualLessonContent: z.string().optional(),
    submoduleName: z.string().min(1, "Submodule name is required."),
}).refine(data => data.slides || data.textualLessonContent, {
  message: "Either 'slides' or 'textualLessonContent' must be provided for summarization.",
  path: ["slides"], // Arbitrary path for error message
});


type SummarizeContentActionResult = {
    success: boolean;
    data?: SummarizeLearningContentOutput;
    error?: string;
    errors?: z.ZodIssue[];
};

export async function summarizeContentAction(input: SummarizeLearningContentInput): Promise<SummarizeContentActionResult> {
  const validationResult = SummarizeContentActionInputSchema.safeParse(input);
  if (!validationResult.success) {
    console.error("Validation Error (summarizeContentAction):", validationResult.error.issues);
    return { success: false, errors: validationResult.error.issues };
  }

  try {
    // The input is already compliant with SummarizeLearningContentInput type due to Zod schema
    const result = await summarizeLearningContent(validationResult.data as SummarizeLearningContentInput);
    return { success: true, data: result };
  } catch (error) {
    console.error("AI Action Error (summarizeContentAction):", error);
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred while summarizing the content." };
  }
}


// --- Generate Textual Content Action (for displayable lesson content) ---

const GenerateTextualContentActionInputSchema = z.object({
  slides: z.array(z.any()).min(1, "Slide data is required."),
  lessonName: z.string().min(1, "Lesson name is required."),
});

type GenerateTextualContentActionResult = {
    success: boolean;
    data?: GenerateTextualContentOutput;
    error?: string;
    errors?: z.ZodIssue[];
};

export async function generateTextualContentAction(input: GenerateTextualContentInput): Promise<GenerateTextualContentActionResult> {
  const validationResult = GenerateTextualContentActionInputSchema.safeParse(input);
  if (!validationResult.success) {
    console.error("Validation Error (generateTextualContentAction):", validationResult.error.issues);
    return { success: false, errors: validationResult.error.issues };
  }

  try {
    const result = await generateTextualContent(validationResult.data);
    return { success: true, data: result };
  } catch (error) {
    console.error("AI Action Error (generateTextualContentAction):", error);
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred while generating textual lesson content." };
  }
}

