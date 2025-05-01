'use server';

/**
 * @fileOverview Generates a clear and concise learning goal based on course, lesson, learner, and their initial instruction.
 *
 * - generateLearningGoal - A function that handles the learning goal generation process.
 * - GenerateLearningGoalInput - The input type for the generateLearningGoal function.
 * - GenerateLearningGoalOutput - The return type for the generateLearningGoal function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const GenerateLearningGoalInputSchema = z.object({
  courseName: z.string().describe('The name of the course.'),
  lessonName: z.string().describe('The name of the lesson within the course.'),
  learnerName: z.string().describe('The name of the learner.'),
  instructionGoal: z.string().describe('The initial instruction, question, or goal provided by the learner.'),
});
export type GenerateLearningGoalInput = z.infer<typeof GenerateLearningGoalInputSchema>;

const GenerateLearningGoalOutputSchema = z.object({
  learningGoal: z.string().describe('A clear, concise, and actionable learning goal (1-2 sentences) tailored to the learner.'),
});
export type GenerateLearningGoalOutput = z.infer<typeof GenerateLearningGoalOutputSchema>;

export async function generateLearningGoal(input: GenerateLearningGoalInput): Promise<GenerateLearningGoalOutput> {
  return generateLearningGoalFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLearningGoalPrompt',
  input: {
    schema: GenerateLearningGoalInputSchema, // Use the defined schema
  },
  output: {
    schema: GenerateLearningGoalOutputSchema, // Use the defined schema
  },
  // Updated prompt for better goal generation
  prompt: `You are an expert instructional designer assisting an AI Tutor (Rookie & Pookie).
Your task is to refine a learner's initial input into a clear, concise, and actionable learning goal for a specific lesson.

**Context:**
*   **Course:** {{{courseName}}}
*   **Lesson:** {{{lessonName}}}
*   **Learner:** {{{learnerName}}}
*   **Learner's Input:** {{{instructionGoal}}}

**Instructions:**
1.  Analyze the learner's input in the context of the course and lesson.
2.  Generate a learning goal that is:
    *   **Specific:** Clearly defines what the learner will be able to do.
    *   **Measurable:** (Implicitly) Achievable within the scope of the lesson/tutoring session.
    *   **Achievable:** Realistic for the lesson context.
    *   **Relevant:** Directly related to the learner's input and the lesson topic.
    *   **Concise:** No more than 1-2 sentences.
    *   **Action-oriented:** Starts with an action verb (e.g., "Understand...", "Implement...", "Explain...").
3.  The goal should focus on what the learner wants to achieve *during this specific interaction/lesson*.
4.  Phrase the goal from the learner's perspective (e.g., "Understand how to use...")

**Example:**
*   Learner Input: "how dictionaries work"
*   Learning Goal: "Understand the basic operations of Python dictionaries, including adding, accessing, and removing key-value pairs."

**Generate the learning goal:**
`,
});


const generateLearningGoalFlow = ai.defineFlow<
  typeof GenerateLearningGoalInputSchema,
  typeof GenerateLearningGoalOutputSchema
>({
  name: 'generateLearningGoalFlow',
  inputSchema: GenerateLearningGoalInputSchema,
  outputSchema: GenerateLearningGoalOutputSchema,
}, async input => {
  // Ensure the correct model is used if not the default
  const {output} = await prompt(input);
  if (!output) {
    throw new Error("Failed to generate learning goal: No output received from the model.");
  }
  return output;
});
