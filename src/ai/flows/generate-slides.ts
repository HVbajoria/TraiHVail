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

                            Create a comprehensive course module script designed to be both engaging and easy to understand. The script should be informative, insightful, and visually dynamic to aid learning. The module should be suitable for students and professionals in business, MBA, engineering, or coding disciplines. It should include a mix of explanatory content, real-world examples, interactive exercises, and dynamic visualizations (e.g., charts, formulas, code snippets).
                                        Make sure that the ImagePrompt should always have 4 distinct sections: Prompt telling how the image should be generated, Image Description which should have background, elements and text that needs to be included. The prompt should be clear and concise, ensuring that the image generated is relevant to the content of the slide. The ImageRatio should always be mentioned in the prompt.
                                        Each course module section should consist of clear content slides that introduce and break down topics, followed by interactive and demonstration slides to keep learners engaged.

                                        ### Slide Types:

                                        1. Title Slide: 
                                        - Use an introductory slide to set the tone and welcome students to the course.
                                        - Content includes the course title, a brief subtitle, and an engaging description of the module content.
                                        - ImagePrompt includes the prompt to generate the background image for the title slide which should be visually appealing and modern, representing the course topic and no text. It should have prompt, background, elements and no text mentioned clearly.
                                        - ImageRation: 9:16
                                        - Transition: Use \`dissolve\` for an engaging entrance.
                                        - Should always have the imagePrompt and ImageRatio mentioned.

                                        2. Content Slides: 
                                        - Explains core concepts in a structured way, includes descriptions, and may incorporate images or diagrams.
                                        - These slides should be informative and provide a clear understanding of the topic while being concise.
                                        - ImagePrompt includes a detailed, effective and accurate prompt to generate a relevant and related image that can be used to explain the concept in the content slide in an effective way. It should have very minimal text which should be mentioned seprately in the prompt clearly. It should have prompt, background, elements and text that needs to be included mentioned clearly.
                                        - ImageRatio: 9:16 / 1:1 / 3:4
                                        - Transition: Use \`fade_in\` to introduce each concept smoothly.

                                        3. Unordered List Slide:
                                        - Used to highlight key points or concepts in a list format.
                                        - This slide is best for summarizing multiple key concepts.
                                        - Transition: Use \`fade_out\` for a dynamic entry.
                                        - Note: Make sure that the points are listed as strings.

                                        4. Code Slides: 
                                        - Contains code snippets (if applicable) to demonstrate programming concepts or examples.
                                        - Transition: Use \`dissolve\` for showing the code smoothly.
                                        - If the code exceeds 20 lines, break it into parts and spread them across different slides, ensuring no slide contains more than 20 lines of code.

                                        5. Quiz Slides: 
                                        - Includes questions and multiple-choice options to test learners' understanding.
                                        - Transition: Use \`fade_in\` for the question slide to offer a shift in focus.
                                        - After the question slide, use a \`content_slide\` to explain the answer and provide an explanation.

                                        6. Chart Slides:
                                        - Visualize data using charts like bar graphs, pie charts, or line graphs to support conceptual learning. These slides help visualize complex concepts in a simple and engaging way.
                                        - Transition: Use \`fade_out\` for smooth entry of data charts.
                                        - The charts can be of the type line, bar or pie and have two labels one for x and one for y axis.

                                        7. Formula Slides:
                                        - Used for mathematical or statistical concepts. These slides show a formula and provide an explanation of how it is used in the context of the topic.
                                        - Transition: Use \`fade_out\` for the formula to keep it engaging.

                                        ---

                                        ### JSON Format Example:

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
                                                    \"transition\": \"dissolve\",
                                                    \"imagePrompt\": \"Prompt: A visually appealing and modern background image representing Business Analytics, featuring graphs, charts, and data visualizations. No text.\nImage Description:\nBackground: Dark blue.\nElements: The image should feature a dynamic and modern visual representation of business analytics. This includes a variety of graphs (line, bar, pie), charts, and data visualizations (e.g., heatmaps, dashboards). The visualizations should be clean, with a professional aesthetic, and incorporate a cohesive color scheme (e.g., using shades of blue, green, and orange for data differentiation). The overall composition should suggest data flow, connections, and insights.\nText: None. The focus is entirely on the visual representation of data.\",
                                                    \"imageRatio\": \"9:16\"
                                                },
                                                {
                                                    \"slideNumber\": 2,
                                                    \"type\": \"content_slide\",
                                                    \"title\": \"What is Business Analytics?\",
                                                    \"content\": \"Business analytics refers to the process of using data to make informed business decisions. It involves statistical analysis, predictive modeling, and data visualization.\",
                                                    \"voiceover\": \"In this section, we'll dive into the concept of Business Analytics, its importance, and the tools commonly used in the field.\",
                                                    \"transition\": \"fade_in\",
                                                    \"imagePrompt\": \"Prompt: An infographic showing the process of Business Analytics, including data collection, analysis, and decision-making. No text should be there at all. \nImage Description:\nBackground: Light grey.\nElements: The infographic should visually represent the process of Business Analytics. It should include elements like data collection (e.g., databases, spreadsheets), analysis (e.g., charts, graphs), and decision-making (e.g., business strategy, reports). The design should be clean and modern, using a color palette that is easy on the eyes (e.g., blues and greens). The flow should be logical and easy to follow.\nText: None. The focus is entirely on the visual representation of the process.\",
                                                    \"imageRatio\": \"1:1\"
                                                },
                                                {
                                                    \"slideNumber\": 3,
                                                    \"type\": \"unordered_list_slide\",
                                                    \"title\": \"Where is Business Analytics Applied\",
                                                    \"points\": [
                                                        \"Statistical Analysis\"
                                                    ],
                                                    \"voiceover\": \"Business analytics involves several key areas, such as statistical analysis.\",
                                                    \"transition\": \"fade_out\"
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
                                                    \"transition\": \"fade_out\"
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
                                                    \"transition\": \"fade_out\"
                                                },
                                                {
                                                    \"slideNumber\": 6,
                                                    \"type\": \"code_slide\",
                                                    \"title\": \"Code Example: Predictive Modeling in Python - Part 1\",
                                                    \"code\": \"import pandas as pd\\nfrom sklearn.linear_model import LinearRegression\\n\\n# Load data\\ndata = pd.read_csv('business_data.csv')\",
                                                    \"lexer\": \"python\",
                                                    \"voiceover\": \"In this part of the example, we begin by importing the necessary libraries and loading the business data.\",
                                                    \"transition\": \"fade_in\"
                                                },
                                                {
                                                    \"slideNumber\": 7,
                                                    \"type\": \"code_slide\",
                                                    \"title\": \"Code Example: Predictive Modeling in Python - Part 2\",
                                                    \"code\": \"model = LinearRegression()\\nmodel.fit(data[['feature1', 'feature2']], data['target'])\",
                                                    \"lexer\": \"python\",
                                                    \"voiceover\": \"Here we create a linear regression model and fit it to the data for predicting business outcomes.\",
                                                    \"transition\": \"fade_in\"
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
                                                    \"transition\": \"fade_in\"
                                                },
                                                {
                                                    \"slideNumber\": 9,
                                                    \"type\": \"content_slide\",
                                                    \"title\": \"Answer and Explanation\",
                                                    \"content\": \"The correct answer is: To analyze data for better business decisions. Business analytics focuses on analyzing data to extract actionable insights that help businesses make informed decisions.\",
                                                    \"voiceover\": \"The correct answer is 'To analyze data for better business decisions.' Business analytics is not just about collecting data; it's about transforming that data into meaningful insights for decision-making.\",
                                                    \"transition\": \"fade_in\",
                                                    \"imagePrompt\": \"Prompt: A visual representation of data analysis leading to business decisions, with charts and graphs. No text should be there at all. \nImage Description:\nBackground: Light blue.\nElements: The image should depict the process of data analysis leading to business decisions. This includes elements like charts, graphs, and decision-making icons (e.g., lightbulb, checkmark). The design should be modern and professional, using a color palette that is easy on the eyes (e.g., blues and greens). The flow should be logical and easy to follow.\nText: None. The focus is entirely on the visual representation of the process.\",
                                                    \"imageRatio\": \"4:3\"
                                                },
                                                {
                                                    \"slideNumber\": 10,
                                                    \"type\": \"content_slide\",
                                                    \"title\": \"Key Takeaways\",
                                                    \"content\": \"Business analytics enables data-driven decision making through techniques like statistical analysis and predictive modeling.\",
                                                    \"voiceover\": \"To summarize, Business Analytics helps organizations make informed decisions using data analysis techniques like statistical analysis, predictive modeling, and data visualization.\",
                                                    \"transition\": \"fade_in\"
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
                                                    \"transition\": \"fade_out\"
                                                },
                                                {
                                                    \"slideNumber\": 12,
                                                    \"type\": \"formula_slide\",
                                                    \"title\": \"Linear Regression Formula\",
                                                    \"formula\": \"y = mx + b\",
                                                    \"explanation\": \"The formula represents a straight line where 'm' is the slope and 'b' is the y-intercept. It's used in linear regression to model relationships between variables.\"
                                                    \"voiceover\": \"The equation 'y = mx + b' is the basis for linear regression, where 'm' determines the slope of the line, and 'b' represents the y-intercept.\",
                                                    \"transition\": \"fade_out\"
                                                }
                                            ]
                                        }

                                        ### Notes:
                                        - Make sure that only in case of technical topics a code snippet in respective required language like Java, Python, HTML, CPP is added. Else only use the formula slide.
                                        - Make sure that the unordered slides are divided so that each slides get one point added while showing the rest of the points with voiceover explaining the new point in each slide.
                                        - Ensure that each slide has a title.
                                        - We only have this types of slides: title_slide, content_slide, quiz_slide, unordered_list_slide, code_slide, chart_slide, formula_slide
                                        - If it's a long code having. more than 20 lines then break it into parts in different slides so that each slide contains at the maximum 20 lines of code
                                        - Also, in case of quiz make two slides one containig just options and giving questions and options and the other slide giving answer and explaining it which would be content_slide where the content would be the answer and the explaination of the answer.
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
