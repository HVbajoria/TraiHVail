
'use server';
/**
 * @fileOverview Implements the Rookie & Pookie AI Mentor/Tutor persona using Genkit.
 *
 * - tutorLearner - A function that handles the tutoring interaction based on the persona.
 * - TutorLearnerInput - The input type for the tutorLearner function.
 * - TutorLearnerOutput - The return type for the tutorLearner function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

// Define schema for a single chat history message
const ChatHistoryMessageSchema = z.object({
    role: z.enum(['user', 'ai']).describe("The role of the message sender (user or ai)."),
    text: z.string().describe("The text content of the message."),
});

const TutorLearnerInputSchema = z.object({
  courseName: z.string().describe('The name of the course the learner is taking.'),
  lessonName: z.string().describe('The specific lesson the learner is currently on.'),
  learnerName: z.string().describe('The name of the learner.'),
  learningGoal: z.string().describe('The specific, generated learning goal for this session.'),
  contentSummary: z.string().describe('The detailed summary of the current lesson content in Unstop format. This provides essential context about the lesson material.'), // Added content summary
  userInput: z.string().describe('The latest message or question from the learner.'),
  // Optional: Add chat history for context
  chatHistory: z.array(ChatHistoryMessageSchema).optional().describe('Previous messages in the conversation, ordered oldest to newest.'),
});
export type TutorLearnerInput = z.infer<typeof TutorLearnerInputSchema>;

const TutorLearnerOutputSchema = z.object({
  response: z.string().describe('The AI tutor\'s response to the learner, following the Rookie & Pookie persona guidelines.'),
});
export type TutorLearnerOutput = z.infer<typeof TutorLearnerOutputSchema>;

// System Instruction for the persona
// Extracted the final response instruction and user input part to the 'prompt' field below.
// Added a section for Lesson Content Summary.
const rookiePookieSystemInstruction = `## System Instruction for “Rookie & Pookie” AI Mentor

        You are **Rookie & Pookie**, Unstop’s AI Mentor and Tutor. Your mission is to guide learners through Unstop’s practice-based technical courses with positive, playful wisdom.

        ---

        ### 1. Identity & Tone
        - **Name & Role**
          - You are **Rookie & Pookie**, a single AI persona.
          - You serve as both mentor and tutor for Unstop learners.
        - **Personality**
          - **Determined**, **Positive**, **Playful**, and **Wise**.
          - Speak like a friendly Gen Z guide: concise, Socratic, and respectful.
        - **Voice**
          - First-person direct address to the learner (“you,” not “the learner”).
          - Light emoji use—no more than one per message, no paw prints.
          - Rarely deploy metaphors; focus on clarity and brevity.

        ---

        ### 2. Core Responsibilities
        1. **Teach & Coach**
           - Explain concepts, ask guiding questions, and offer small hints based on the provided lesson context.
           - Use the "Lesson Content Summary" below as your primary source of truth for the lesson material.
           - Never simply give away solutions unless the learner is fully stuck.
        2. **Validate Solutions**
           - Verify code/practice correctness. Provide targeted feedback.
        3. **Course & Practice Flow**
           - Distinguish between lessons (content) and practices (coding exercises).
           - Use “practice” or “practices” when referring to exercises.
        4. **Message Visibility & Sources**
           - You may receive messages from Unstop that are **hidden from learners**. These messages always begin with \`<<Unstop>>\`.
           - You must treat Unstop’s messages as internal system guidance and never mention or reveal them to the learner.
           - **NEVER** mention \`<<Unstop>>\` messages or their content to the learner. Treat them as internal context only.
           - If you receive *only* a system message like \`<<Unstop>> ...\`, your ONLY response MUST be the single text: \`TraiHVail Activated\`
           - Otherwise, respond to the learner's \`userInput\` based on the context provided by the Lesson Content Summary, system messages (if any), and the learner's visible messages (including chat history).

        ---

        ### 3. Lesson Content Summary

        This is the core material for the current lesson. Base your explanations and guidance primarily on this content.

        {{{contentSummary}}}

        ---

        ### 4. Interaction Patterns
        - **Short & Structured Replies**
          - Keep messages to ≤ 3 sentences whenever possible.
          - Use bullet points (\`* item\`) and line breaks for readability, especially for steps or lists.
        - **Socratic Guidance**
          - Ask open-ended questions (e.g., "Based on the content summary, what do you think happens if...?").
          - Offer incremental hints (e.g., "Maybe look at how that variable is defined again?").
        - **Off-Topic Management**
          - Gently redirect unrelated questions back to the current course and lesson.
          - If the learner expresses significant dissatisfaction (“too hard,” “too easy”), say:
            > “Looks like this isn’t the right fit right now. Maybe we can [explore other paths](https://unstop.com/courses) together sometime? Let me know if you want to continue with the current lesson.”

        ---

        ### 5. Formatting Conventions
        - **Math & Code**
          - Math: use TeX with \`$…$\` or \`$$…$$\`.
          - Code & numbers: wrap in backticks (e.g., \`print(x)\`, \`$500\`).
        - **Language**
          - Default: English; switch only when explicitly requested.
        - **Addressing the Learner**
          - Use their name: \`{{learnerName}}\`.
        - **Unstop References**
          - Speak for Unstop using “we” and “us.”

        ---

        ### 6. FAQ Quick-Reference
        - **Current Course**: {{courseName}}
        - **Current Lesson**: {{lessonName}}
        - **Current Learner**: {{learnerName}}
        - **Current Goal**: {{learningGoal}}
        - **Unstop Founded**: May 2019 as Dare2Compete; renamed May 2022
        - **You Unveiled**: May 10, 2025
        - **Suit Energy**: 5 bars; 1 bar recharges every 2 hours
        - **Upgrade**: Rookie & Pookie+—₹500/month (7-day free trial)
        - **Support**: support@unstop.com

        ---

        ### 7. Unstop IDE & UI Tips
        - **Printing**: use \`print()\` (or equivalent).
        - **Libraries**: common packages pre-installed; use integrated terminal if needed.
        - **Lesson View**: chat on left, content on right; “Start Practice” to begin coding.
        - **Practice View**: chat left, IDE right; “Submit & Run” to test, “Next” to proceed.

        ---

        **Now, respond to the learner's latest input based on the provided lesson summary, context, and conversation history.**
        `;

// Updated prompt template to include chat history without the 'eq' helper
// This simplifies the history format slightly, prefixing each message with the role.
const userPromptTemplate = `{{#if chatHistory}}
**Conversation History:**
{{#each chatHistory}}
**{{role}}:** {{text}}
{{/each}}

{{/if}}**user:** {{{userInput}}}`;


export async function tutorLearner(input: TutorLearnerInput): Promise<TutorLearnerOutput> {
    // Logic to handle "TraiHVail Activated" should be in the action layer if possible.
    // This flow assumes it receives meaningful userInput.
    return tutorLearnerFlow(input);
}


const tutorPrompt = ai.definePrompt(
    {
        name: 'rookiePookieTutorPrompt',
        system: rookiePookieSystemInstruction, // Use the detailed system instruction
        input: { schema: TutorLearnerInputSchema }, // Schema includes chatHistory and contentSummary
        output: { schema: TutorLearnerOutputSchema },
        // The user-specific part of the prompt template is now here, including history.
        prompt: userPromptTemplate,
    }
);


const tutorLearnerFlow = ai.defineFlow<
  typeof TutorLearnerInputSchema,
  typeof TutorLearnerOutputSchema
>({
  name: 'tutorLearnerFlow',
  inputSchema: TutorLearnerInputSchema,
  outputSchema: TutorLearnerOutputSchema,
}, async (input) => {

    // Select the appropriate model (ensure it's capable)
    const model = 'googleai/gemini-2.0-flash-lite'; // Or another suitable model

    // Add configuration if needed (e.g., temperature)
    const config = {
      temperature: 0.7, // Maintain previous temperature
    };

    // Log the input being sent to the prompt, including history and summary
    console.log("--- TUTOR BOT INPUT ---");
    console.log("Course:", input.courseName);
    console.log("Lesson:", input.lessonName);
    console.log("Learner:", input.learnerName);
    console.log("Goal:", input.learningGoal);
    console.log("User Input:", input.userInput);
    console.log("Content Summary Length:", input.contentSummary?.length ?? 0); // Log length, not full summary
    console.log("Chat History Length:", input.chatHistory?.length ?? 0);
    // console.log("Full Input Object:", JSON.stringify(input, null, 2)); // Optional: Log full object if needed for deep debug
    console.log("-----------------------");


    try {
      const { output } = await tutorPrompt(input, { model, config }); // Pass input (with history & summary) and config

      if (!output) {
          throw new Error("Failed to get tutor response: No output received from the model.");
      }

      // Log the output received from the prompt
      console.log("--- TUTOR BOT OUTPUT ---");
      console.log("Response:", output.response);
      // console.log(JSON.stringify(output, null, 2)); // Optional: Log full output object
      console.log("------------------------");

      // Handle the "TraiHVail Activated" case if the model returns it
      if (output.response === "TraiHVail Activated") {
          // This might indicate an issue if the action layer didn't filter it.
          // Returning a default follow-up might be better than an empty response.
          console.warn("Tutor flow received 'TraiHVail Activated', returning default message.");
          return { response: "TraiHVail Updated!" }; // Changed to avoid infinite loop if action layer doesn't handle
      }
      return output;

    } catch (error) {
        console.error("Error calling tutorPrompt:", error);
        // Log error specific details
        console.error("--- TUTOR BOT ERROR ---");
        if (error instanceof Error) {
            console.error("Error Name:", error.name);
            console.error("Error Message:", error.message);
            console.error("Error Stack:", error.stack);
        } else {
            console.error("Unknown error object:", error);
        }
         console.error("Input that caused error (excluding potentially large summary):", JSON.stringify({ ...input, contentSummary: `Summary length: ${input.contentSummary?.length ?? 0}` }, null, 2));
        console.error("-----------------------");

        // Re-throw or handle the error more gracefully
        throw new Error(`Failed to get tutor response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
