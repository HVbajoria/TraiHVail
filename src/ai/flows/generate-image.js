import * as fs from "node:fs";
import axios from "axios";
import path from "node:path";

async function saveAllBase64Images(responseData, slideNumber) {
  const filename = `temp_video_gen/temp_assets/gemini-native-image_slide${slideNumber}.jpeg`;
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
    "quality": "high",
    "output_format": "jpeg"
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
  const imagePrompt = `Generate a visually compelling, accurate, and educational image based on the input string provided in `+ process.argv[3] +`. This image will be used in professional course slides, so precision, clarity, and aesthetics are critical. Follow all the instructions below carefully and strictly.

---

### Visual & Design Guidelines

1. Prompt Interpretation

   * Analyze the content of `+ process.argv[3] +` in full.
   * Identify and visually represent its main themes, concepts, and objects.
   * Ensure the image translates the essence of the topic clearly and accurately.

2. Background Requirements

   * Use only a dark blue or white background—whichever enhances contrast and readability of content in the image.
   * Avoid gradients or other background effects.

3. Visual Clarity & Elegance

   * Maintain a clean, organized layout with clear spacing and visual hierarchy.
   * Use icons, illustrations, or diagrams to reinforce the theme of `+ process.argv[3] +`.

4. Color Palette

   * Apply a consistent, harmonious color scheme that complements the theme.
   * Avoid clutter or visual noise. Prioritize simplicity and clarity.

5. Textual Content

   * Include all relevant text, labels, headers, or short definitions derived from `+ process.argv[3] +`.
   * Ensure text is:

     * Correctly spelled
     * Grammatically accurate
     * Legible, using appropriate contrast and font size
   * Avoid unnecessary or excessive text.

---

### Execution Steps (internal to model)

1. Parse the full input string from `+ process.argv[3] +`.
2. Visually translate it into an educational illustration or diagram, maintaining thematic integrity.
3. Choose either a dark blue or white background for optimal presentation.
4. Apply a clean, consistent design suited for academic slide decks.
5. Include key terms and text labels that are essential to understanding the image topic.

---

### Output Format

* A single, high-resolution image designed for immediate use in slides or course content.
* Use of white or dark blue background only.
* All relevant labeled text from `+ process.argv[3] +` must be included.
* Visually aligned to clarity, instructional value, and modern design standards.`;

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