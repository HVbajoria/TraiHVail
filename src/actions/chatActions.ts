
// src/actions/chatActions.ts
"use server";

import { tutorLearner, type TutorLearnerInput, type TutorLearnerOutput } from "@/ai/flows/tutor-learner"; // Import tutor flow
import { z } from 'zod';

// --- Generate Learning Goal (REMOVED) ---
// The generateLearningGoalAction, its input schema, and result type have been removed
// as the goal-setting step is being bypassed in the chat interface.

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
    learningGoal: z.string().optional(), // Made learningGoal optional
    contentSummary: z.string().min(1, "Lesson content summary is required."),
    userInput: z.string().min(1, "Your message cannot be empty."),
    chatHistory: z.array(ActionChatHistoryMessageSchema).optional(),
});

type TutorLearnerActionResult = {
    success: boolean;
    data?: TutorLearnerOutput;
    error?: string;
    errors?: z.ZodIssue[];
};

export async function tutorLearnerAction(input: TutorLearnerInput): Promise<TutorLearnerActionResult> {
    const validationResult = TutorLearnerActionInputSchema.safeParse(input);
    if (!validationResult.success) {
        console.error("TutorLearner Action Input Validation Failed:", validationResult.error.issues);
        return { success: false, errors: validationResult.error.issues };
    }

    const flowInput: TutorLearnerInput = validationResult.data;

    try {
        const result = await tutorLearner(flowInput);
        return { success: true, data: result };
    } catch (error) {
        console.error("AI Action Error (tutorLearner):", error);
        let errorMessage = "An unexpected error occurred during tutoring.";
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        return { success: false, error: errorMessage };
    }
}
