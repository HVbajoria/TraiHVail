import * as fs from "node:fs";
import axios from "axios";
import path from "node:path";

async function saveAllBase64Images(responseData, slideNumber) {
  const filename = `temp_video_gen/temp_assets/gemini-native-image_slide${slideNumber}.png`;
  const arr = responseData["data"];
  for (let i = 0; i < arr.length; ++i) {
    const b64 = arr[i]["b64_json"];
    // Ensure the directory exists before writing the file
    const directory = path.dirname(filename);

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    fs.writeFileSync(filename, Buffer.from(b64, "base64"));
    console.log("Image saved to: " + filename);
  }
}

async function main(imagePrompt, imageRatio, slideNumber) {
  // You will need to set these environment variables or edit the following values.
  const endpoint = "https://hvbaj-mbutm191-westus3.cognitiveservices.azure.com/";
  const deployment = "gpt-image-1";
  const apiVersion = "2025-04-01-preview";
  const subscriptionKey = 'Bex1TLnUNtQMNrbl4ASwZ9C3MYonvI5QUuHmbpvSTgBFrMmqqlYOJQQJ99BFACMsfrFXJ3w3AAAAACOGrKuV';

  const generationsPath = `openai/deployments/${deployment}/images/generations`;
  const params = `?api-version=${apiVersion}`;
  const generationsUrl = `${endpoint}${generationsPath}${params}`;

  if (imageRatio == "1x1")
    imageRatio = "1024x1024";
  else
    imageRatio = "1536x1024";
  
  const generationBody = {
    "prompt": imagePrompt,
    "n": 1,
    "size": imageRatio,
    "quality": "medium",
    "output_format": "png"
  };
  const generationResponse = await axios.post(generationsUrl, generationBody, { headers : {
    'Api-Key': subscriptionKey,
    'Content-Type': 'application/json'
  }});
  await saveAllBase64Images(generationResponse.data, slideNumber);
  console.log("Image generation completed successfully.");
}

// Check if this script is being run directly
if (process.argv[2] === '--generate-image') {
  const imagePrompt = `Generate an image based on the given prompt while adhering to the specified visual and textual guidelines.

  - The image should be visually appealing and prioritize clarity in its theme. Ensure a dark blue or white background to enhance the color contrast and visibility.
  - Maintain a coherent and visible color theme throughout the image.
  - All included text must be correctly spelled and grammatically accurate, even for short labels or descriptions. Also make sure to add any text that should be included in the image.
  
  # Steps
  1. Analyze the given prompt string and determine the primary themes, objects, or concepts specified.
  2. Interpret and select visual elements to align with the prompt's theme. Ensure the design maintains elegance and clarity.
  3. Use either a dark blue or white background to enhance the design's visual impact.
  4. Ensure visual harmony by implementing a consistent and visible color theme.
  
  # Output Format
  - A visually generated image.
  - Dark blue or white backgrounds only.
  - All the text that is relevant to the prompt should be included in the image.
    
  # The given prompt is: ` + process.argv[3] + `
  
  Note: The design should primarily interpret the prompt's theme into visuals, providing all the neccessary content. Avoid extensive text or content unrelated to the prompt.`;

  const imageRatio = process.argv[4];
  const slideNumber = process.argv[5];

  if (!imagePrompt || !slideNumber) {
    console.error("Usage: node generate-image.js --generate-image <imagePrompt> <imageRatio> <slideNumber>");
    process.exit(1);
  }

  main(imagePrompt, imageRatio, slideNumber).catch((err) => {
    console.error("Error in main function:", err);
    process.exit(1);
  });
}