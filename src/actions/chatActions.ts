
// src/actions/chatActions.ts
"use server";

import { generateLearningGoal, type GenerateLearningGoalInput, type GenerateLearningGoalOutput } from "@/ai/flows/generate-learning-goal";
import { tutorLearner, type TutorLearnerInput, type TutorLearnerOutput } from "@/ai/flows/tutor-learner"; // Import tutor flow
import { z } from 'zod';

// --- Generate Learning Goal ---

const GenerateLearningGoalActionInputSchema = z.object({
  courseName: z.string().min(1, "Course name is required."),
  lessonName: z.string().min(1, "Lesson name is required."),
  learnerName: z.string().min(1, "Learner name is required."),
  instructionGoal: z.string().min(1, "Instruction/Goal is required."),
});

type GenerateLearningGoalActionResult = {
    success: boolean;
    data?: GenerateLearningGoalOutput;
    error?: string;
    errors?: z.ZodIssue[]; // For validation errors
};

export async function generateLearningGoalAction(input: GenerateLearningGoalInput): Promise<GenerateLearningGoalActionResult> {
  const validationResult = GenerateLearningGoalActionInputSchema.safeParse(input);
  if (!validationResult.success) {
    return { success: false, errors: validationResult.error.issues };
  }

  try {
    const result = await generateLearningGoal(validationResult.data);
    return { success: true, data: result };
  } catch (error) {
    console.error("AI Action Error (generateLearningGoal):", error);
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred while generating the learning goal." };
  }
}

// --- Tutor Learner ---

// Define schema for a single chat history message for the action layer
const ActionChatHistoryMessageSchema = z.object({
    role: z.enum(['user', 'ai']),
    text: z.string(),
});

const TutorLearnerActionInputSchema = z.object({
    courseName: z.string().min(1),
    lessonName: z.string().min(1),
    learnerName: z.string().min(1),
    learningGoal: z.string().min(1),
    contentSummary: z.string().min(1, "Lesson content summary is required."), // Added contentSummary validation
    userInput: z.string().min(1, "Your message cannot be empty."),
    // Add chatHistory matching the flow's input schema
    chatHistory: z.array(ActionChatHistoryMessageSchema).optional(),
});

type TutorLearnerActionResult = {
    success: boolean;
    data?: TutorLearnerOutput;
    error?: string;
    errors?: z.ZodIssue[];
};

// Type assertion to bridge the gap if necessary, though Zod schemas should match.
// If ActionChatHistoryMessageSchema and the flow's ChatHistoryMessageSchema are identical, this isn't needed.
// type ActionTutorLearnerInput = z.infer<typeof TutorLearnerActionInputSchema>;

export async function tutorLearnerAction(input: TutorLearnerInput): Promise<TutorLearnerActionResult> {
    // Validate the input received by the action
    const validationResult = TutorLearnerActionInputSchema.safeParse(input);
    if (!validationResult.success) {
        console.error("TutorLearner Action Input Validation Failed:", validationResult.error.issues); // Log validation errors
        return { success: false, errors: validationResult.error.issues };
    }

    // The input structure now matches the flow's expected input, including chatHistory and contentSummary
    const flowInput: TutorLearnerInput = validationResult.data;

    try {
        const result = await tutorLearner(flowInput); // Pass the validated data (with history and summary)
        return { success: true, data: result };
    } catch (error) {
        console.error("AI Action Error (tutorLearner):", error);
        // Provide more specific error feedback if possible
        let errorMessage = "An unexpected error occurred during tutoring.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        return { success: false, error: errorMessage };
    }
}
