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
      temperature: 0.1,
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
  const imagePrompt = process.argv[3] + "\nMake sure that all the text in the image are correctly spelled and grammatically correct.";
  const imageRatio = process.argv[4];
  const slideNumber = process.argv[5];

  if (!imagePrompt || !slideNumber) {
    console.error("Usage: node generate-image.js --generate-image <imagePrompt> <imageRatio> <slideNumber>");
    process.exit(1);
  }

  generateImage(imagePrompt, imageRatio, slideNumber);
}