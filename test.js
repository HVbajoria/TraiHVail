import * as fs from "node:fs";
import axios from "axios";

async function saveAllBase64Images(responseData, filenamePrefix) {
  const arr = responseData["data"];
  for (let i = 0; i < arr.length; ++i) {
    const b64 = arr[i]["b64_json"];
    const filename = `${filenamePrefix}_${i + 1}.png`;
    fs.writeFileSync(filename, Buffer.from(b64, "base64"));
    console.log("Image saved to: " + filename);
  }
}

async function main() {
  // You will need to set these environment variables or edit the following values.
  const endpoint = "https://hvbaj-mbutm191-westus3.cognitiveservices.azure.com/";
  const deployment = "gpt-image-1";
  const apiVersion = "2025-04-01-preview";
  const subscriptionKey = 'Bex1TLnUNtQMNrbl4ASwZ9C3MYonvI5QUuHmbpvSTgBFrMmqqlYOJQQJ99BFACMsfrFXJ3w3AAAAACOGrKuV';

  const generationsPath = `openai/deployments/${deployment}/images/generations`;
  const params = `?api-version=${apiVersion}`;
  const generationsUrl = `${endpoint}${generationsPath}${params}`;
  
  const generationBody = {
    "prompt": "Hi Create",
    "n": 1,
    "size": "1024x1024",
    "quality": "medium",
    "output_format": "png"
  };
  const generationResponse = await axios.post(generationsUrl, generationBody, { headers : {
    'Api-Key': subscriptionKey,
    'Content-Type': 'application/json'
  }});
  await saveAllBase64Images(generationResponse.data, "generated_image");
}

main().catch((err) => {  
  console.error("This sample encountered an error:", err);  
});