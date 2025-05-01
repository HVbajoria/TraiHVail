import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  // promptDir: './prompts', // Removed as prompts are defined inline
  plugins: [
    googleAI({
      apiKey: 'AIzaSyDHGWLeiroFLiCqfahIWCrDkWEjpjbFcMI',
    }),
  ],
  // Updated default model - ensure GOOGLE_GENAI_API_KEY is set for this model family
  model: 'googleai/gemini-2.0-flash-lite',
  // Consider adding logLevel for debugging if needed:
  // logLevel: 'debug',
});
