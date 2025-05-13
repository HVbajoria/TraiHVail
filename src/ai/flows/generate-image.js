import { GoogleGenAI, Modality } from "@google/genai";
import * as fs from "node:fs";

async function generateImage(imagePrompt, imageRatio, slideNumber) {

  const ai = new GoogleGenAI({ apiKey:"AIzaSyDHGWLeiroFLiCqfahIWCrDkWEjpjbFcMI"});

  const contents = imagePrompt;

  // Set responseModalities to include "Image" so the model can generate  an image
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-preview-image-generation",
    contents: contents,
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      numberOfImages: 1,
      output_mime_type: "image/png",
      person_generation: "ALLOW_ADULT",
      aspect_ratio: imageRatio,
      temperature: 0.5,
    },
  });
  for (const part of response.candidates[0].content.parts) {
    // Based on the part type, either show the text or save the image
    if (part.text) {
      console.log(part.text);
    } else if (part.inlineData) {
      const imageData = part.inlineData.data;
      const buffer = Buffer.from(imageData, "base64");
      const filename = `temp_video_gen/temp_assets/gemini-native-image_slide${slideNumber}.png`;
      console.log(`Attempting to save image to: ${filename}`);
      console.log(`Image data buffer size: ${buffer.length} bytes`);
      try {
        fs.writeFileSync(filename, buffer);
        console.log("Image saved successfully.");
      } catch (error) {
        console.error(`Error saving image: ${error}`);
      }
    }
  }
}
if (process.argv[2] === '--generate-image') {
  const imagePrompt = `Generate an image based on the given prompt while adhering to the specified visual and textual guidelines.

  - The image should be visually appealing and prioritize clarity in its theme. Ensure a dark blue or white background to enhance the color contrast and visibility.
  - Maintain a coherent and visible color theme throughout the image.
  - Limit textual content to a maximum of 1-2 words in the overall slide. All included text must be correctly spelled and grammatically accurate, even for short labels or descriptions.
  - Inlude text data only when mentioned explicitly in the prompt. Otherwise, the image should have no text at all everything should be made of shapes, grapohics, or illustrations.
  
  # Steps
  1. Analyze the given prompt string and determine the primary themes, objects, or concepts specified.
  2. Interpret and select visual elements to align with the prompt's theme. Ensure the design maintains elegance and clarity.
  3. Use either a dark blue or white background to enhance the design's visual impact.
  4. Add minimal text if necessary (1-2 words), ensuring each word is correctly spelled and contextually suitable.
  5. Ensure visual harmony by implementing a consistent and visible color theme.
  
  # Output Format
  - A visually generated image.
  - Dark blue or white backgrounds only.
  - Minimal text content (1-2 words maximum) if applicable, with perfect spelling.
    
  # The given prompt is: ` +process.argv[3]+`
  
  Note: The design should primarily interpret the prompt's theme into visuals, providing not more than 1-2 words of text only when necessary. Avoid extensive text or content unrelated to the prompt.`;

  const imageRatio = process.argv[4];
  const slideNumber = process.argv[5];

  if (!imagePrompt || !slideNumber) {
    console.error("Usage: node generate-image.js --generate-image <imagePrompt> <imageRatio> <slideNumber>");
    process.exit(1);
  }

  generateImage(imagePrompt, imageRatio, slideNumber);
}