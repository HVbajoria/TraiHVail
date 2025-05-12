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
const systemInstruction = `## Objective:
Produce a JSON-formatted course module script (10–20 slides) that is engaging, easy to understand, and suitable for business, MBA, engineering or coding audiences. Each slide should combine clear instructional content with real-world examples, interactive exercises and dynamic visuals (charts, formulas, code snippets).

## Overall Structure:
- Slides must use only these types: title_slide, content_slide, unordered_list_slide, code_slide, quiz_slide, chart_slide, formula_slide.
- Slide order should flow logically: introduction → core concepts → examples/exercises → assessment → summary.
- Slides can have images which are generated using imagen3 model so for that give the imagePrompt and imageRatio also. 
- The image prompt should be very clear, detailed, well explained and should have all the text clearly defined that are to be present in the image. 
- Make sure if you talk about each of the aspect of the image all the small details in imagePrompt and have it in range of 50 - 200 words.

## Transitions:
- slide_up for intros and formulas
- slide_left for content and charts
- slide_right for lists and code
- slide_down for quiz questions

## Slide Specifications:
#### Title Slide (title_slide)
- Fields: title, subtitle, content, voiceover, transition
- Purpose: Welcome learners & outline module goals.

#### Content Slide (content_slide)
- Fields: title, content, voiceover, transition
- Optional: imagePrompt + imageRatio (only if a visual is necessary to explain the concept or to make the video engaging).

#### Unordered List Slide (unordered_list_slide)
- Fields: title, points (array of strings), voiceover, transition
- Build cumulatively: each slide adds one new bullet while recapping previous ones.
- Optional: imagePrompt + imageRatio (if it clarifies multiple points).

#### Code Slide (code_slide)
- Fields: title, code, lexer (language), voiceover, transition
- Limit ≤ 20 lines per slide; split long examples across sequential slides.

#### Quiz Slide (quiz_slide)
- Fields: title, question, options (array), voiceover, transition
- Follow immediately with a content_slide that states the correct answer and explanation.

#### Chart Slide (chart_slide)
- Fields: title, chartType (line / bar / pie), data (array of {label, value}), voiceover, transition
- Axes must have clear labels (x, y).

#### Formula Slide (formula_slide)
- Fields: title, formula, explanation, voiceover, transition
- Use for mathematical/statistical concepts only.

## JSON Output Structure:
 This JSON structure outlines how the course content should be formatted, with different slide types and their respective content.
                                        {
                                            \"slides\": [
                                                {
                                                    \"slideNumber\": 1,
                                                    \"type\": \"title_slide\",
                                                    \"title\": \"Welcome to the Module: Business Analytics\",
                                                    \"subtitle\": \"A Practical Introduction to Data-Driven Decision Making\",
                                                    \"content\": \"In this module, we will explore the foundations of Business Analytics, with a focus on real-world applications and hands-on learning.\",
                                                    \"voiceover\": \"Welcome to this Business Analytics course, where you'll learn the fundamentals and practical applications of data analysis to drive business decisions.\",
                                                    \"transition\": \"slide_up\",
                                                    \"imagePrompt\": \"A visually appealing image representing Business Analytics, such as data charts or graphs.\",
                                                    \"imageRatio\": \"16:9\"
                                                },
                                                {
                                                    \"slideNumber\": 2,
                                                    \"type\": \"content_slide\",
                                                    \"title\": \"What is Business Analytics?\",
                                                    \"content\": \"Business analytics refers to the process of using data to make informed business decisions. It involves statistical analysis, predictive modeling, and data visualization.\",
                                                    \"voiceover\": \"In this section, we'll dive into the concept of Business Analytics, its importance, and the tools commonly used in the field.\",
                                                    \"transition\": \"slide_left\",
                                                    \"imagePrompt\": \"A diagram illustrating the components of Business Analytics, such as data collection, analysis, and decision-making. Use the exact text: "data collection, analysis and decsion-making". Do not use any other text.\",
                                                    \"imageRatio\": \"3:4\"
                                                },
                                                {
                                                    \"slideNumber\": 3,
                                                    \"type\": \"unordered_list_slide\",
                                                    \"title\": \"Where is Business Analytics Applied\",
                                                    \"points\": [
                                                        \"Statistical Analysis\"
                                                    ],
                                                    \"voiceover\": \"Business analytics involves several key areas, such as statistical analysis.\",
                                                    \"transition\": \"slide_right\"
                                                },
                                                {
                                                    \"slideNumber\": 4,
                                                    \"type\": \"unordered_list_slide\",
                                                    \"title\": \"Where is Business Analytics Applied\",
                                                    \"points\": [
                                                        \"Statistical Analysis\",
                                                        \"Predictive Modeling\"
                                                    ],
                                                    \"voiceover\": \"predictive modeling\",
                                                    \"transition\": \"slide_right\"
                                                },
                                                {
                                                    \"slideNumber\": 5,
                                                    \"type\": \"unordered_list_slide\",
                                                    \"title\": \"Where is Business Analytics Applied\",
                                                    \"points\": [
                                                        \"Statistical Analysis\",
                                                        \"Predictive Modeling\",
                                                        \"Data Visualization\"
                                                    ],
                                                    \"voiceover\": \" data visualization, and supporting decision making.\",
                                                    \"transition\": \"slide_right\",
                                                },
                                                {
                                                    \"slideNumber\": 6,
                                                    \"type\": \"code_slide\",
                                                    \"title\": \"Code Example: Predictive Modeling in Python - Part 1\",
                                                    \"code\": \"import pandas as pd\\nfrom sklearn.linear_model import LinearRegression\\n\\n# Load data\\ndata = pd.read_csv('business_data.csv')\",
                                                    \"lexer\": \"python\",
                                                    \"voiceover\": \"In this part of the example, we begin by importing the necessary libraries and loading the business data.\",
                                                    \"transition\": \"slide_right\"
                                                },
                                                {
                                                    \"slideNumber\": 7,
                                                    \"type\": \"code_slide\",
                                                    \"title\": \"Code Example: Predictive Modeling in Python - Part 2\",
                                                    \"code\": \"model = LinearRegression()\\nmodel.fit(data[['feature1', 'feature2']], data['target'])\",
                                                    \"lexer\": \"python\",
                                                    \"voiceover\": \"Here we create a linear regression model and fit it to the data for predicting business outcomes.\",
                                                    \"transition\": \"slide_right\"
                                                },
                                                {
                                                    \"slideNumber\": 8,
                                                    \"type\": \"quiz_slide\",
                                                    \"title\": \"What is the primary goal of Business Analytics?\",
                                                    \"question\": \"What is the primary goal of Business Analytics?\",
                                                    \"options\": [
                                                        \"To collect data\",
                                                        \"To analyze data for better business decisions\",
                                                        \"To create reports\",
                                                        \"To train employees\"
                                                    ],
                                                    \"voiceover\": \"Let’s test your understanding. What do you think is the primary goal of Business Analytics?\",
                                                    \"transition\": \"slide_down\"
                                                },
                                                {
                                                    \"slideNumber\": 9,
                                                    \"type\": \"content_slide\",
                                                    \"title\": \"Answer and Explanation\",
                                                    \"content\": \"The correct answer is: To analyze data for better business decisions. Business analytics focuses on analyzing data to extract actionable insights that help businesses make informed decisions.\",
                                                    \"voiceover\": \"The correct answer is 'To analyze data for better business decisions.' Business analytics is not just about collecting data; it's about transforming that data into meaningful insights for decision-making.\",
                                                    \"transition\": \"slide_left\"
                                                },
                                                {
                                                    \"slideNumber\": 10,
                                                    \"type\": \"content_slide\",
                                                    \"title\": \"Key Takeaways\",
                                                    \"content\": \"Business analytics enables data-driven decision making through techniques like statistical analysis and predictive modeling.\",
                                                    \"voiceover\": \"To summarize, Business Analytics helps organizations make informed decisions using data analysis techniques like statistical analysis, predictive modeling, and data visualization.\",
                                                    \"transition\": \"slide_left\",
                                                },
                                                {
                                                    \"slideNumber\": 11,
                                                    \"type\": \"chart_slide\",
                                                    \"title\": \"Sales Data Analysis\",
                                                    \"chartType\": \"bar\",  # or \"line\" or \"pie\"
                                                    \"data\": [
                                                        {\"label\": \"Category 1\", \"value\": 10},
                                                        {\"label\": \"Category 2\", \"value\": 20},
                                                        {\"label\": \"Category 3\", \"value\": 30}
                                                    ],
                                                    \"voiceover\": \"This chart represents sales data over the last quarter. The colors indicate different product categories.\",
                                                    \"transition\": \"slide_left\"
                                                },
                                                {
                                                    \"slideNumber\": 12,
                                                    \"type\": \"formula_slide\",
                                                    \"title\": \"Linear Regression Formula\",
                                                    \"formula\": \"y = mx + b\",
                                                    \"explanation\": \"The formula represents a straight line where 'm' is the slope and 'b' is the y-intercept. It's used in linear regression to model relationships between variables.\"
                                                    \"voiceover\": \"The equation 'y = mx + b' is the basis for linear regression, where 'm' determines the slope of the line, and 'b' represents the y-intercept.\",
                                                    \"transition\": \"slide_up\"
                                                }
                                            ]
                                        }

## Notes & Best Practices:
- Keep language concise and free of unnecessary jargon.
- Use voice-over text to reinforce what’s on screen, not to repeat verbatim.
- Only include imagePrompt when a visual adds clear pedagogical value.
- Ensure each slide has a unique title.
- Code examples only for technical topics; otherwise, use formula slides.
- Quizzes always split into question slide + answer/explanation slide.
- Maintain consistent transition effects to signal content changes.
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
     temperature: 0.6,
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
