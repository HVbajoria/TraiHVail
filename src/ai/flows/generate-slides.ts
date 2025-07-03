'use server';
/**
 * @fileOverview Generates a structured JSON representing course slides for a submodule.
 *
 * - generateSlides - A function that handles the slide generation process.
 * - GenerateSlidesInput - The input type for the generateSlides function.
 * - SlidesOutput - The return type (JSON structure) for the generateSlides function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

// --- Input Schema ---
const GenerateSlidesInputSchema = z.object({
  submoduleName: z.string().describe('The name of the submodule.'),
  submoduleDescription: z.string().optional().describe('The detailed description of the submodule.'),
});
export type GenerateSlidesInput = z.infer<typeof GenerateSlidesInputSchema>;

// --- Output Schema ---

const BaseSlideSchema = z.object({
  slideNumber: z.number().describe('Sequential number of the slide.'),
  type: z.string().describe('The type of the slide (e.g., title_slide, content_slide).'),
  title: z.string().describe('The main title of the slide.'),
  voiceover: z.string().optional().describe('Suggested voiceover text for the slide.'),
  transition: z.string().optional().describe('Suggested transition effect for the slide (e.g., slide_up, slide_left).'),
  imagePrompt: z.string().optional().describe('An optional prompt for generating an image related to the slide content.'),
  imageRatio: z.string().optional().describe('An optional aspect ratio for the generated image (e.g., 16:9, 4:3).'),
});

// Updated Schemas: Use z.enum instead of z.literal for the 'type' field
const TitleSlideSchema = BaseSlideSchema.extend({
  type: z.enum(['title_slide']),
  subtitle: z.string().optional().describe('An optional subtitle for the title slide.'),
  content: z.string().describe('The main introductory content of the title slide.'),
});

const ContentSlideSchema = BaseSlideSchema.extend({
  type: z.enum(['content_slide']),
  content: z.string().describe('The textual content of the slide.'),
});

const UnorderedListSlideSchema = BaseSlideSchema.extend({
    type: z.enum(['unordered_list_slide']),
    points: z.array(z.string()).describe('An array of strings, each representing a bullet point.'),
});

const CodeSlideSchema = BaseSlideSchema.extend({
    type: z.enum(['code_slide']),
    code: z.string().describe('A string containing the code snippet.'),
    lexer: z.string().optional().describe('The programming language for syntax highlighting (e.g., python, javascript).'),
});

const QuizSlideSchema = BaseSlideSchema.extend({
    type: z.enum(['quiz_slide']),
    question: z.string().describe('The quiz question text.'),
    options: z.array(z.string()).describe('An array of strings representing the multiple-choice options.'),
});

const ChartSlideSchema = BaseSlideSchema.extend({
    type: z.enum(['chart_slide']),
    chartType: z.enum(['bar', 'line', 'pie']).describe('The type of chart to display.'),
    data: z.array(z.object({ label: z.string(), value: z.number() })).describe('Data for the chart, usually an array of objects with label and value.'),
    xLabel: z.string().optional().describe('Label for the X-axis (if applicable).'),
    yLabel: z.string().optional().describe('Label for the Y-axis (if applicable).'),
});

const FormulaSlideSchema = BaseSlideSchema.extend({
    type: z.enum(['formula_slide']),
    formula: z.string().describe('The mathematical or scientific formula as a string (potentially LaTeX formatted).'),
    explanation: z.string().optional().describe('Explanation of the formula and its components.'),
});

// Discriminated union for all possible slide types
const SlideSchema = z.discriminatedUnion('type', [
    TitleSlideSchema,
    ContentSlideSchema,
    UnorderedListSlideSchema,
    CodeSlideSchema,
    QuizSlideSchema,
    ChartSlideSchema,
    FormulaSlideSchema,
]);

// Final output schema containing an array of slides
const SlidesOutputSchema = z.object({
    slides: z.array(SlideSchema).describe('An array of slide objects representing the course module content.'),
});
export type SlidesOutput = z.infer<typeof SlidesOutputSchema>;


// --- System Instruction ---
const systemInstruction = `## Objective
Produce a JSON‑formatted, 10–20‑slide course module script that’s engaging, easy to understand, and tailored for business, MBA, engineering, or coding audiences. Each slide must combine clear instructional content with real‑world examples, interactive exercises, and dynamic visuals (charts, formulas, code snippets). Quizzes must pair each question with its own illustrative image and clearly labeled options.

## Slide Types & Rules
You may only use these slide types:
- title_slide
- content_slide
- unordered_list_slide
- code_slide
- quiz_slide
- chart_slide
- formula_slide

### 1. Title Slide
- **Fields**: \`slideNumber\`, \`type=title_slide\`, \`title\`, \`subtitle\`, \`content\`, \`voiceover\`
- **imagePrompt** (object) must have:
  - \`prompt\`: clear generation instruction  
  - \`background\`: \`"dark blue"\` or \`"white"\`  
  - \`elements\`: visual elements to include  
  - \`text\`: exact short labels or \`"None"\`  
- **imageRatio**: \`"9:16"\`  
- **transition**: \`"dissolve"\`

### 2. Content Slides
- **Fields**: \`slideNumber\`, \`type=content_slide\`, \`title\`, \`content\`, \`voiceover\`
- **imagePrompt** (object), which **must be especially detailed, easy to interpret, and visually appealing**, including:
  - A clear \`prompt\` describing composition and educational goal  
  - \`background\`: \`"dark blue"\` or \`"white"\`  
  - \`elements\`: every icon, diagram component, or annotation needed to explain the concept  
  - \`text\`: any short labels or legends, spelled and punctuated correctly  
- **imageRatio**: \`"9:16"\`, \`"1:1"\`, or \`"3:4"\`  
- **transition**: \`"fade_in"\`

### 3. Unordered List Slides
- **Fields**: \`slideNumber\`, \`type=unordered_list_slide\`, \`title\`, \`points\` (array of strings), \`voiceover\`
- One point per slide; list builds over successive slides  
- **transition**: \`"fade_out"\`

### 4. Code Slides
- **Fields**: \`slideNumber\`, \`type=code_slide\`, \`title\`, \`code\`, \`lexer\`, \`voiceover\`
- ≤ 20 lines per slide; split longer examples  
- **transition**: \`"dissolve"\`

### 5. Quiz Slides
- **Question Slide Fields**: \`slideNumber\`, \`type=quiz_slide\`, \`title\`, \`question\`, \`options\` (array), \`voiceover\`
- **imagePrompt** (object) **must be detailed**, **visually appealing**, and **directly contextualize the question**, including:
  - A precise \`prompt\` that sets up the scenario or data  
  - \`background\`: \`"dark blue"\` or \`"white"\`  
  - \`elements\`: relevant icons, diagrams, or graphical hints  
  - \`text\`: labeled options or annotations as needed  
- **transition**: \`"fade_in"\`
- **Follow with** a \`content_slide\` titled \`"Answer & Explanation"\`

### 6. Chart Slides
- **Fields**: \`slideNumber\`, \`type=chart_slide\`, \`title\`, \`chartType\` (\`"bar"|"line"|"pie"\`), \`data\` (array of \`{label,value}\`), \`voiceover\`
- **transition**: \`"fade_out"\`

### 7. Formula Slides
- **Fields**: \`slideNumber\`, \`type=formula_slide\`, \`title\`, \`formula\`, \`explanation\`, \`voiceover\`
- **transition**: \`"fade_out"\`

## Global Requirements
- All **text** in images must be spelled correctly and grammatically accurate.  
- **Background** for every image: \`"dark blue"\` or \`"white"\` only.  
- **Images** must directly illustrate the slide’s core concept or quiz question.  
- **Use real‑world examples** in content slides.  
- **Embed interactive exercises** where learners actively apply concepts.  
- **Sequential flow**: each slide builds on the last.  

## Output Format
Return **only** a single JSON object with a top‑level key \`"slides"\` whose value is an array of slide objects. **Do not** emit any additional text, commentary, or explanations.

### JSON Format Example:
{
  "slides": [
    {
      "slideNumber": 1,
      "type": "title_slide",
      "title": "Welcome to the Module: Business Analytics",
      "subtitle": "A Practical Introduction to Data-Driven Decision Making",
      "content": "In this module, we will explore the foundations of Business Analytics, with a focus on real-world applications and hands-on learning.",
      "voiceover": "Welcome to this Business Analytics course, where you'll learn the fundamentals and practical applications of data analysis to drive business decisions.",
      "transition": "dissolve",
      "imagePrompt": {
        "prompt": "A visually appealing and modern background image representing Business Analytics, featuring graphs, charts, and data visualizations.",
        "background": "dark blue",
        "elements": "Dynamic line, bar, and pie charts; dashboard widgets; subtle data flow arcs",
        "text": "None"
      },
      "imageRatio": "9:16"
    },
    {
      "slideNumber": 2,
      "type": "content_slide",
      "title": "What is Business Analytics?",
      "content": "Business analytics refers to the process of using data to make informed business decisions. It involves statistical analysis, predictive modeling, and data visualization.",
      "voiceover": "In this section, we'll dive into the concept of Business Analytics, its importance, and the tools commonly used in the field.",
      "transition": "fade_in",
      "imagePrompt": {
        "prompt": "An easy-to-follow infographic showing the three stages of Business Analytics: data collection (database icons), analysis (charts and graphs), and decision-making (lightbulb icon).",
        "background": "white",
        "elements": "Database icon, line chart, pie chart, arrow to lightbulb icon",
        "text": "None"
      },
      "imageRatio": "1:1"
    },
    {
      "slideNumber": 3,
      "type": "quiz_slide",
      "title": "What is the primary goal of Business Analytics?",
      "question": "What is the primary goal of Business Analytics?",
      "options": [
        "To collect data",
        "To analyze data for better business decisions",
        "To create reports",
        "To train employees"
      ],
      "voiceover": "Let’s test your understanding. What do you think is the primary goal of Business Analytics?",
      "transition": "fade_in",
      "imagePrompt": {
        "prompt": "A clear visual showing a data pipeline leading to a business decision icon, with placeholders for multiple-choice labels.",
        "background": "dark blue",
        "elements": "Data database, processing gears, decision checkmark icon, option labels",
        "text": "Option A, Option B, Option C, Option D"
      }
    }
    // …additional slides up to 10–20 total…
  ]
}
`;


// --- Prompt Definition ---
const slidesPrompt = ai.definePrompt({
  name: 'generateSlidesPrompt',
  system: systemInstruction,
  input: {
    schema: GenerateSlidesInputSchema,
  },
  output: {
    format: 'json', // Request JSON output
    schema: SlidesOutputSchema, // Use the corrected schema
  },
  prompt: `Generate the course module slides in the specified JSON format for the following submodule:

Submodule Name: {{{submoduleName}}}
{{#if submoduleDescription}}Submodule Description: {{{submoduleDescription}}}{{/if}}
`,
  // Model configuration can be added here if needed, e.g., temperature
   config: {
     temperature: 0.93,
     // Safety settings can be adjusted if defaults are not suitable
      safetySettings: [
            {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_NONE',
            },
            // Keep Civic Integrity stricter if needed, or change to BLOCK_NONE
            // {
            //     category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
            //     threshold: 'BLOCK_LOW_AND_ABOVE',
            // },
      ],
   },
});

// --- Flow Definition ---
const generateSlidesFlow = ai.defineFlow(
    {
        name: 'generateSlidesFlow',
        inputSchema: GenerateSlidesInputSchema,
        outputSchema: SlidesOutputSchema,
    },
    async (input) => {
        // Optionally select a specific model variant if needed
        const model = 'googleai/gemini-2.0-flash-lite'; // Use 2.0 flash as requested

        const response = await slidesPrompt(input, { model }); // Pass input and optional model override

        const output = response.output; // Access the parsed JSON output

        if (!output) {
            throw new Error('Failed to generate slides: No output received from the model.');
        }

        // Add validation or post-processing if needed
        // e.g., ensure slide numbers are sequential
        if (output.slides) {
             output.slides.forEach((slide, index) => {
                if (slide.slideNumber !== index + 1) {
                     console.warn(`Slide number mismatch found: Expected ${index + 1}, got ${slide.slideNumber}. Adjusting...`);
                     slide.slideNumber = index + 1; // Correct the slide number
                }
             });
        } else {
             throw new Error('Failed to generate slides: Output format is incorrect.');
        }

        return output;
    }
);


// --- Exported Function ---
export async function generateSlides(input: GenerateSlidesInput): Promise<SlidesOutput> {
    console.log("Generating slides for:", input.submoduleName);
    try {
         const result = await generateSlidesFlow(input);
         console.log(`Successfully generated ${result.slides?.length ?? 0} slides.`);
         return result;
    } catch (error) {
         console.error("Error in generateSlides flow:", error);
         // Improve error message detail
         let errorMessage = 'Unknown error';
         if (error instanceof Error) {
            errorMessage = error.message;
            // Check for specific API errors if possible (e.g., based on error message content)
            if (error.message.includes('400 Bad Request') && error.message.includes('Invalid JSON payload')) {
                errorMessage = `API schema validation error: ${error.message}. Please check the flow's output schema definition.`;
            }
         }
         throw new Error(`Failed to generate slides: ${errorMessage}`);
    }
}
