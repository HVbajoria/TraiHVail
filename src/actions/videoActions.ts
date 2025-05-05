
'use server';

import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import type { SlidesOutput } from '@/ai/flows/generate-slides';

const execPromise = promisify(exec);

// Input schema for the video generation action, expects the slides structure
const GenerateVideoActionInputSchema = z.object({
    slides: z.array(z.any()).min(1, "Slide data is required for video generation."), // Expects the array of slide objects
});

type GenerateVideoActionResult = {
    success: boolean;
    videoUrl?: string; // URL to the generated video (e.g., a temporary public URL or base64 data URI)
    error?: string;
    errors?: z.ZodIssue[];
};

export async function generateVideoAction(input: { slides: SlidesOutput['slides'] }): Promise<GenerateVideoActionResult> {
    const validationResult = GenerateVideoActionInputSchema.safeParse(input);
    if (!validationResult.success) {
        return { success: false, errors: validationResult.error.issues };
    }

    const slidesData = validationResult.data.slides;
    const tempDir = path.join(process.cwd(), 'temp_video_gen');
    const scriptInputPath = path.join(tempDir, 'course_script.json');
    const pythonScriptPath = path.join(process.cwd(), 'src', 'scripts', 'generate_video.py'); // Adjust path as needed
    const videoOutputPath = path.join(tempDir, 'final_course.mp4');
    const assetsDir = path.join(tempDir, 'temp_assets'); // Directory for Python script assets

    try {
        // 1. Ensure temp directory exists
        await fs.mkdir(tempDir, { recursive: true });
        await fs.mkdir(assetsDir, { recursive: true }); // Ensure assets dir also exists

        // 2. Write the slides data to a JSON file for the Python script
        await fs.writeFile(scriptInputPath, JSON.stringify({ slides: slidesData }, null, 2));
        console.log(`Slides data written to ${scriptInputPath}`);

        // 3. Execute the Python script
        // Make sure Python environment has necessary libraries (moviepy, wand, azure-cognitiveservices-speech, etc.)
        // Ensure SPEECH_KEY and SPEECH_REGION are set as environment variables for the Python script
        console.log(`Executing Python script: ${pythonScriptPath}`);
        // Use /usr/bin/env python3 to potentially find python3 in the PATH more reliably
        const command = `/usr/bin/env python3 ${pythonScriptPath} ${scriptInputPath} ${videoOutputPath} ${assetsDir}`; // Pass paths as arguments

        // Log the PATH for debugging
        console.log("Current PATH:", process.env.PATH);

        // Check if necessary ENV vars are set
        if (!process.env.SPEECH_KEY || !process.env.SPEECH_REGION) {
            console.warn("SPEECH_KEY or SPEECH_REGION environment variable is not set. Python script might fail.");
            // Optionally, return an error immediately:
            // return { success: false, error: "Missing required environment variables for video generation (SPEECH_KEY, SPEECH_REGION)." };
        }


        // Execute with environment variables (ensure they are available in the Node.js env)
        const { stdout, stderr } = await execPromise(command, {
             env: {
                 ...process.env, // Pass all current env vars
                 // SPEECH_KEY and SPEECH_REGION should be inherited if set in the Node.js env
             },
             cwd: process.cwd() // Execute from project root
        });

        console.log('Python script stdout:', stdout);
        if (stderr) {
            console.error('Python script stderr:', stderr);
             // Check if stderr contains actual errors vs warnings
             if (stderr.toLowerCase().includes('error') || stderr.toLowerCase().includes('traceback')) {
                throw new Error(`Video generation script failed: ${stderr}`);
             }
        }

        // 4. Check if the video file was created
        try {
            await fs.access(videoOutputPath);
            console.log(`Video file generated successfully at ${videoOutputPath}`);
        } catch (err) {
            throw new Error(`Video file not found after script execution. Path: ${videoOutputPath}. Stdout: ${stdout}`);
        }

        // 5. Convert video to Base64 Data URI to send to client
        // Note: This can be very memory intensive for large videos!
        // Consider serving the file statically or using cloud storage for production.
        const videoBuffer = await fs.readFile(videoOutputPath);
        const videoBase64 = videoBuffer.toString('base64');
        const videoDataUri = `data:video/mp4;base64,${videoBase64}`;

        // 6. Clean up temporary files (optional, depends on deployment)
        // Consider doing this asynchronously or via a separate cleanup task
        // await fs.rm(tempDir, { recursive: true, force: true });

        return { success: true, videoUrl: videoDataUri };

    } catch (error) {
        console.error("Video Generation Action Error:", error);
        // Clean up on error as well
        // await fs.rm(tempDir, { recursive: true, force: true }).catch(cleanupErr => console.error("Cleanup error:", cleanupErr));

        let errorMessage = "An unexpected error occurred during video generation.";
        if (error instanceof Error) {
            // Provide more specific feedback if python3 isn't found
            if (error.message.includes('command not found')) {
                 errorMessage = `Could not find the 'python3' command. Ensure Python 3 is installed and in the system's PATH. Error: ${error.message}`;
            } else {
                errorMessage = error.message;
            }
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        return { success: false, error: errorMessage };
    }
}

