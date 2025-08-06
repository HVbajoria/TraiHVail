# TraiHVail: The AI-Powered Learning Assistant

Welcome to TraiHVail, a sophisticated, AI-driven learning application built with Next.js, Firebase Genkit, and ShadCN UI. This platform transforms structured course data from simple spreadsheets into a rich, interactive learning experience, complete with AI-generated slides, textual lessons, video summaries, and a personalized AI tutor named "Rookie & Pookie."

This document provides a comprehensive overview of the application's architecture, core functionalities, and the underlying logic that powers its features.

## Table of Contents

1.  [Core Technologies](#1-core-technologies)
2.  [Application Flow & State Management](#2-application-flow--state-management)
3.  [Feature Deep Dive](#3-feature-deep-dive)
    -   [Course Creation from a File](#31-course-creation-from-a-file)
    -   [AI-Powered Slide Generation](#32-ai-powered-slide-generation)
    -   [Textual Lesson Generation](#33-textual-lesson-generation)
    -   [Video Generation](#34-video-generation)
    -   [AI Tutor: Rookie & Pookie](#35-ai-tutor-rookie--pookie)
    -   [Interactive Quizzes](#36-interactive-quizzes)
4.  [Key File Locations](#4-key-file-locations)

---

## 1. Core Technologies

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Generative AI**: [Firebase Genkit](https://firebase.google.com/docs/genkit)
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Video Generation (Backend)**: Python with `moviepy` and `Wand`
-   **Text-to-Speech (TTS)**: Microsoft Azure Cognitive Services

---

## 2. Application Flow & State Management

The entire user journey is managed by a central state machine within the main page component. This design ensures a linear and predictable user experience, guiding them from one stage to the next.

-   **Location**: `src/app/page.tsx`
-   **State Variable**: `appState: AppState`
-   **State Type**: Defined in `src/types/app.ts`

The application progresses through states like `landing`, `setup`, `parsing`, `structure`, `generating_slides`, `slides`, `learning_view`, etc. UI components are conditionally rendered based on the current value of `appState`, creating a seamless single-page application feel.

---

## 3. Feature Deep Dive

### 3.1. Course Creation from a File

The process begins with the user uploading a course structure file.

1.  **UI**: The user interacts with `src/components/views/SetupView.tsx`, which contains the `CourseSetupForm`.
2.  **Input**: An Excel (`.xlsx`, `.xls`) or CSV (`.csv`) file is required. This file must contain the following columns as the first row (headers):
    -   `Content`: The name of the module or submodule.
    -   `Type`: Must be either `Module` or `Sub Module`.
    -   `Details` (Optional): A brief description of the submodule.
3.  **Parsing Logic**:
    -   In `src/app/page.tsx`, the `handleCourseSubmit` function is triggered.
    -   It uses the `xlsx` library to read the file data.
    -   The `parseDataToStructure` function then iterates through the rows, validating them and converting them into a structured array of `CourseModule` objects.
4.  **Display**: The parsed structure is displayed in `src/components/views/StructureView.tsx`, which uses a custom `CourseStructureDisplay` component to group submodules under their parent modules.

### 3.2. AI-Powered Slide Generation

From the course structure view, a user can start a submodule lesson, which initiates slide generation.

1.  **Action Trigger**: The `handleStartLesson` function in `page.tsx` calls the `generateSlidesAction` server action.
    -   **Action File**: `src/actions/courseActions.ts`
2.  **Genkit Flow**: The action invokes the `generateSlides` flow.
    -   **Flow File**: `src/ai/flows/generate-slides.ts`
3.  **The Prompt**:
    -   A highly detailed system prompt (`systemInstruction`) instructs the AI model on its objective: to produce a structured JSON array representing a course script of 10-20 slides.
    -   The prompt specifies various slide types (`title_slide`, `content_slide`, `code_slide`, `quiz_slide`, etc.), their required fields, and structural rules (e.g., a quiz slide must be followed by an answer slide).
    -   It also guides the AI on generating `imagePrompt` fields for slides where a visual would be beneficial.
4.  **Zod Schema**:
    -   The flow uses Zod schemas (`SlidesOutputSchema`) to define the exact JSON structure it expects back from the LLM. This ensures the output is type-safe and predictable.
    -   The LLM is explicitly asked to return its output in this JSON format.
5.  **Output**: The result is a JSON array of slide objects, which is then stored in the `generatedSlides` state in `page.tsx` and displayed using the `SlidesView` and `SlideDisplay` components.

### 3.3. Textual Lesson Generation

Before entering the main learning view, the application generates a comprehensive Markdown lesson from the slides.

1.  **Action Trigger**: In `page.tsx`, `handleLaunchLearningView` calls the `generateTextualContentAction`.
    -   **Action File**: `src/actions/courseActions.ts`
2.  **Genkit Flow**: This action calls the `generateTextualContent` flow.
    -   **Flow File**: `src/ai/flows/generate-textual-content.ts`
3.  **The Prompt**:
    -   The system prompt instructs the AI to act as a content creator, transforming the slide JSON into a complete, well-structured Markdown lesson.
    -   It emphasizes an engaging, learner-centric tone, the inclusion of real-world examples, and interactive elements.
    -   The slide JSON is passed as a string within the final user prompt.
4.  **Output**: The flow returns a single Markdown string, which is stored in the `textualLessonContent` state and rendered in the "Read Lesson" tab of the `LearningView` using `ReactMarkdown`.

### 3.4. Video Generation

The application can generate a video summary of the lesson, complete with voiceover and visuals.

1.  **UI Trigger**: In the `LearningView`, the user clicks the "Generate Video Lesson" button. This calls `handleGenerateVideo` in `page.tsx`.
2.  **Action**: `generateVideoAction` is invoked.
    -   **Action File**: `src/actions/videoActions.ts`
3.  **Python Script**: This Node.js action executes a Python script to handle the complex video processing.
    -   **Script File**: `src/scripts/generate_video.py`
    -   **Communication**: The slide JSON data is written to a temporary file (`course_script.json`), and its path is passed as an argument to the Python script.
4.  **Video Processing Steps (in Python)**:
    -   **Text-to-Speech**: For each slide's `voiceover` text, the script calls the Azure Speech SDK to generate an `.mp3` audio file.
    -   **Image Generation**: The script checks for `imagePrompt` in the slide data. If found, it executes a Node.js script (`src/ai/flows/generate_image.js`) to call the Gemini image generation model. The resulting image is saved locally.
    -   **Slide Image Creation**: Using the `Wand` (ImageMagick) library, the script creates a base image for each slide, rendering titles, content, code blocks (using `Pygments`), and charts (using `matplotlib`) according to a `template3.json` file.
    -   **Image Composition**: If a generative image was created for a slide, it is composited onto the base slide image.
    -   **Clip Assembly**: Using `moviepy`, each slide image is combined with its corresponding audio file to create an `ImageClip`. The duration of the clip is determined by the length of the audio.
    -   **Concatenation**: All individual slide clips are stitched together, applying transitions (`slide_left`, `slide_up`, etc.) as specified in the slide JSON.
5.  **Output**: The final `.mp4` video is saved to a temporary directory. The `generateVideoAction` then reads this file, encodes it as a Base64 data URI, and sends it back to the client to be played in the `VideoPlayer` component.

### 3.5. AI Tutor: Rookie & Pookie

The chat interface provides a personalized AI tutor to guide the learner.

1.  **UI**: The `LearningView` contains the `ChatInterface` component.
2.  **Content Summarization**: Before the chat starts, the application generates two summaries using the `summarizeLearningContent` flow (`src/ai/flows/summarize-learning-content.ts`):
    -   One summary from the slide JSON (for video context).
    -   One summary from the textual Markdown content (for reading context).
    These summaries are provided to the AI tutor as its primary source of knowledge for the lesson.
3.  **Genkit Flow**: All chat interactions are handled by the `tutorLearner` flow.
    -   **Flow File**: `src/ai/flows/tutor-learner.ts`
4.  **The Persona (System Prompt)**:
    -   A detailed system prompt defines the AI's persona: **"Rookie & Pookie"**, a determined, playful, and wise Gen Z guide.
    -   It has strict rules on tone, message length, emoji use, and how to handle various situations (e.g., off-topic questions, quiz interactions, video generation status).
5.  **Context Switching**: The `LearningView` monitors which tab ("Read Lesson" or "Watch Video") is active. When the user switches tabs, it calls the `updateContentSummary` method on the `ChatInterface` ref. This dynamically provides the AI tutor with the correct context summary (either from the textual content or the video slides), ensuring its responses are always relevant to what the user is seeing.
6.  **System Messages**: The application communicates internal state changes (like video generation starting or failing) to the AI tutor via hidden system messages prefixed with `<<Unstop>>`. The AI is instructed to interpret these messages and respond to the user in a friendly, conversational way without revealing the system message itself.

### 3.6. Interactive Quizzes

If a lesson is identified as a quiz, the right-hand panel displays an interactive quiz player instead of the lesson content.

1.  **Quiz Detection**: The `LearningView` component checks if the `lessonName` contains the word "quiz".
2.  **Question Extraction**: It then parses the `generatedSlides` array, looking for pairs of `quiz_slide` and subsequent `content_slide` (which contains the answer/explanation). This data is formatted into an array of `QuizQuestionData`.
3.  **UI**: The `QuizPlayer` component (`src/components/quiz/QuizPlayer.tsx`) renders the questions, options, and progress.
4.  **Interaction with AI Tutor**: When a user answers a question, the `handleQuizInteraction` function is called.
    -   It constructs a detailed system message (e.g., `<<Unstop>> Learner answered question... User's incorrect answer...`) and sends it to the `ChatInterface`.
    -   The Rookie & Pookie AI, guided by its system prompt, interprets this message and provides either a subtle hint (for an incorrect answer) or a congratulatory message (for a correct answer). This creates a seamless, interactive feedback loop between the quiz and the AI tutor.

---

## 4. Key File Locations

-   **Main Page & State Logic**: `src/app/page.tsx`
-   **AI Genkit Flows**: `src/ai/flows/`
-   **Server Actions**: `src/actions/`
-   **UI View Components**: `src/components/views/`
-   **Reusable UI Components**: `src/components/ui/`
-   **Chat & Quiz Components**: `src/components/chat/`, `src/components/quiz/`
-   **Video Generation Script**: `src/scripts/generate_video.py`
-   **Application State Types**: `src/types/app.ts`
