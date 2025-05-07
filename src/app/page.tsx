
'use client';

import React, { useState, useEffect, useCallback, useRef, useContext, Suspense } from 'react';
import { Loader2, LogIn, LogOut, ArrowLeft, Video, Bot, BookOpen, Rocket, ChevronRight, Edit3, FileSpreadsheet, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SlidesOutput } from '@/ai/flows/generate-slides';
// import type { SummarizeLearningContentOutput } from '@/ai/flows/summarize-learning-content'; // Not directly needed
import { AuthContext } from '@/context/AuthContext';
import type { Message, ChatInterfaceHandle } from '@/components/chat/ChatInterface';
import { generateSlidesAction, summarizeContentAction, generateTextualContentAction } from '@/actions/courseActions';
import { generateVideoAction } from '@/actions/videoActions';
import { VideoPlayer } from '@/components/video/VideoPlayer';

// Import view components
import LandingView from '@/components/views/LandingView';
import LoginView from '@/components/views/LoginView';
import LaunchingView from '@/components/views/LaunchingView';
import SetupView from '@/components/views/SetupView';
import ParsingView from '@/components/views/ParsingView';
import StructureView from '@/components/views/StructureView';
import GeneratingSlidesView from '@/components/views/GeneratingSlidesView';
import SlidesView from '@/components/views/SlidesView';
import EditSlidesView from '@/components/views/EditSlidesView';
import SummarizingContentView from '@/components/views/SummarizingContentView';
import GeneratingTextualContentView from '@/components/views/GeneratingTextualContentView';
import LearningView from '@/components/views/LearningView';
import ErrorView from '@/components/views/ErrorView';

// Import type definitions
import type { CourseModule } from '@/components/course/CourseStructureDisplay';
import type { AppState, VideoPanelState } from '@/types/app';

export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const [appState, setAppState] = useState<AppState>('landing');
  const [isClient, setIsClient] = useState(false);
  const [courseName, setCourseName] = useState<string>('');
  const [courseStructure, setCourseStructure] = useState<CourseModule[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<{ name: string; type: 'Module' | 'Sub Module'; description?: string; id?: string } | null>(null);
  const [generatedSlides, setGeneratedSlides] = useState<SlidesOutput['slides'] | null>(null);
  
  // Store separate summaries
  const [videoContentSummary, setVideoContentSummary] = useState<string | null>(null);
  const [textContentSummary, setTextContentSummary] = useState<string | null>(null);
  
  const [textualLessonContent, setTextualLessonContent] = useState<string | null>(null);
  const chatInterfaceRef = useRef<ChatInterfaceHandle>(null);
  const { toast } = useToast();

  const [videoPanelState, setVideoPanelState] = useState<VideoPanelState>('hidden');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoGenerationDuration, setVideoGenerationDuration] = useState<number | null>(null);
  const [isChatSetupComplete, setIsChatSetupComplete] = useState(false);
  const isGeneratingVideoRef = useRef(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rightPanelDisplayMode, setRightPanelDisplayMode] = useState<'text' | 'video'>('text');


  const logoUrl = "https://d8it4huxumps7.cloudfront.net/uploads/images/unstop/branding-guidelines/logos/white/Unstop-Logo-White-Large.png";

  useEffect(() => {
    setIsClient(true);
    if (!user && appState !== 'landing' && appState !== 'login' && appState !== 'launching') {
        setAppState('landing');
        resetAppState();
    }
  }, [user, appState]);

   useEffect(() => {
     if (appState !== 'learning_view') {
       setVideoPanelState('hidden');
       setVideoUrl(null);
       setVideoError(null);
       setVideoGenerationDuration(null);
       isGeneratingVideoRef.current = false;
     }
   }, [appState]);

    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.sender === 'ai' && typeof lastMessage.text === 'string') {
                // Check for AI message indicating video generation failure and suggesting to switch to notes
                if (lastMessage.text.includes("Let's stick with the lesson notes for now; I'll make sure you're on the 'Read Lesson' tab.")) {
                    setRightPanelDisplayMode('text');
                    setVideoPanelState('idle'); // Reset video panel so user can try generating again if they wish
                    toast({
                        title: "Switched to Lesson Notes",
                        description: "There was an issue with video generation. Please use the lesson notes.",
                        variant: "default",
                    });
                }
            }
        }
    }, [messages, toast]);


   const handleStart = () => {
    if (user) {
       setAppState('launching');
       setTimeout(() => setAppState('setup'), 2000);
    } else {
        setAppState('login');
    }
  };

  const handleLoginSuccess = () => {
    setAppState('launching');
    setTimeout(() => setAppState('setup'), 2000);
  }

  const handleLogout = () => {
    logout();
    setAppState('landing');
    resetAppState();
  }

  const resetAppState = () => {
    setCourseName('');
    setCourseStructure([]);
    setSelectedLesson(null);
    setGeneratedSlides(null);
    setVideoContentSummary(null);
    setTextContentSummary(null);
    setTextualLessonContent(null);
    setMessages([]);
    setIsChatSetupComplete(false);
    setRightPanelDisplayMode('text');
  }

  const handleBackToLanding = () => {
    setAppState('landing');
    resetAppState();
  }

  const handleBackToStructure = () => {
    setAppState('structure');
    setSelectedLesson(null);
    setGeneratedSlides(null);
    setVideoContentSummary(null);
    setTextContentSummary(null);
    setTextualLessonContent(null);
  }

   const handleBackFromLearningView = () => {
     setAppState('slides');
  }

  const handleEditSlides = () => {
      if (!generatedSlides) {
          toast({ title: "Error", description: "No slides available to edit.", variant: "destructive" });
          return;
      }
      setAppState('editing_slides');
  }

  const handleSaveSlides = (editedSlides: SlidesOutput['slides']) => {
      setGeneratedSlides(editedSlides);
      setAppState('slides');
      toast({ title: "Success", description: "Slide structure updated.", variant: "default" });
      setVideoContentSummary(null); // Invalidate previous summaries
      setTextContentSummary(null);
      setTextualLessonContent(null);
  }

  const handleCancelEdit = () => {
      setAppState('slides');
  }

   const addMessage = useCallback((sender: 'user' | 'ai' | 'system', text: string | React.ReactNode, hidden: boolean = false) => {
        setMessages((prev) => {
            const newMessage: Message = {
                id: `${sender}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                sender,
                text,
                timestamp: Date.now(),
                hidden,
            };
            let uniqueId = newMessage.id;
            let attempts = 0;
            while (prev.some(msg => msg.id === uniqueId) && attempts < 10) {
                uniqueId = `${sender}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${attempts}`;
                attempts++;
            }
            newMessage.id = uniqueId;
            return [...prev, newMessage];
        });
    }, []);


    const parseDataToStructure = (data: any[][]): CourseModule[] => {
        console.log("--- Starting Data Parsing ---");
        console.log("Raw data row count:", data.length);

        if (data.length < 2) {
          console.warn("Data has less than 2 rows (Header + Data). Cannot parse structure.");
          return [];
        }

        const headers = data[0].map((h: any) => h?.toString().trim().toLowerCase() || '');
        console.log("Detected Headers (lowercase, trimmed):", headers);

        const contentIndex = headers.indexOf('content');
        const typeIndex = headers.indexOf('type');
        const detailsIndex = headers.indexOf('details');

        if (contentIndex === -1 || typeIndex === -1) {
          console.error("Required headers 'content' or 'type' not found in:", headers);
          toast({
            title: 'Parsing Error',
            description: "Required headers 'Content' or 'Type' not found. Please check the file.",
            variant: 'destructive',
            duration: 8000,
          });
          return [];
        }
        console.log(`Column indexes -> Content: ${contentIndex}, Type: ${typeIndex}, Details: ${detailsIndex !== -1 ? detailsIndex : 'Not Found'}`);

        const parsedStructure: CourseModule[] = data.slice(1).map((row: any[], index) => {
            const rowIndex = index + 2;

            if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || cell === '')) {
                console.warn(`[Row ${rowIndex}] Skipping: Row appears empty.`);
                return null;
            }
            const maxIndex = Math.max(contentIndex, typeIndex, detailsIndex === -1 ? -1 : detailsIndex);
            if (row.length <= maxIndex) {
                 console.warn(`[Row ${rowIndex}] Skipping: Row has fewer columns (${row.length}) than required for all specified headers. Content=${row[contentIndex]}, Type=${row[typeIndex]}, Details=${row[detailsIndex]}`);
                 return null;
            }

            const content = row[contentIndex]?.toString().trim();
            const typeRaw = row[typeIndex]?.toString().trim();
            const details = detailsIndex !== -1 ? (row[detailsIndex]?.toString().trim() || '') : '';

            let type: 'Module' | 'Sub Module' | null = null;
            const normalizedType = typeRaw?.toLowerCase().replace(/[-\s]+/g, '');
            if (normalizedType === 'module') {
                type = 'Module';
            } else if (normalizedType === 'submodule' || normalizedType === 'sub-module') {
                type = 'Sub Module';
            }


            if (!content) {
                 console.warn(`[Row ${rowIndex}] Skipping: Missing or empty 'Content'. Value was: '${row[contentIndex]}'`);
                return null;
            }
            if (!type) {
                console.warn(`[Row ${rowIndex}] Skipping: Invalid or missing 'Type'. Expected 'Module' or 'Sub Module' (case-insensitive, space/hyphen optional), got '${typeRaw}'. Normalized: '${normalizedType}'`);
                return null;
            }

            const module: CourseModule = {
                 id: `${type.replace(' ','')}-${index}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                content: content,
                type: type,
                details: details,
                completed: false,
            };
            console.log(`[Row ${rowIndex}] Parsed: Type='${type}', Content='${content}', Details='${details ? 'Yes' : 'No'}'`);
            return module;
        }).filter((module): module is CourseModule => module !== null);

        console.log("\n--- Parsing Finished ---");
        console.log("Total valid modules/sub-modules parsed:", parsedStructure.length);

         if (parsedStructure.length === 0 && data.length > 1) {
           console.error("No valid Module or Sub Module rows found after parsing. Check data rows and headers.");
           toast({
             title: 'Parsing Issue',
             description: "No valid 'Module' or 'Sub Module' rows found. Please check the 'Type' column (should be 'Module' or 'Sub Module') and ensure 'Content' is not empty.",
             variant: 'destructive',
             duration: 8000,
           });
         }
        return parsedStructure;
    };


    const handleCourseSubmit = (name: string, file: File | null) => {
        setCourseName(name);
        setAppState('parsing');
        setCourseStructure([]); 

        if (!file) {
          toast({ title: 'File Error', description: 'No file was selected.', variant: 'destructive' });
          setAppState('setup');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const fileData = e.target?.result;
            if (!fileData) throw new Error('Failed to read file data.');

            let parsedStructure: CourseModule[] = [];
            const fileType = file.type;
            const fileNameLower = file.name.toLowerCase();

            if (fileType.includes('csv') || fileNameLower.endsWith('.csv')) {
              console.log("Parsing CSV file...");
              const text = new TextDecoder("utf-8").decode(fileData as ArrayBuffer);
              const cleanText = text.charCodeAt(0) === 0xFEFF ? text.substring(1) : text;
              const workbook = XLSX.read(cleanText, { type: 'string', raw: false }); 
              const sheetName = workbook.SheetNames[0];
              if (!sheetName) throw new Error("Could not process CSV data (No sheet found).");
              const worksheet = workbook.Sheets[sheetName];
              const csvData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: false });
              if (!csvData || csvData.length === 0) throw new Error("CSV file appears empty or could not be parsed.");
              parsedStructure = parseDataToStructure(csvData);
            } else if (fileType.includes('spreadsheetml') || fileType.includes('ms-excel') || fileNameLower.endsWith('.xlsx') || fileNameLower.endsWith('.xls')) {
              console.log("Parsing Excel file...");
              const workbook = XLSX.read(fileData, { type: 'array' });
              const sheetName = workbook.SheetNames[0];
              if (!sheetName) throw new Error("Could not find any sheets in the Excel file.");
              const worksheet = workbook.Sheets[sheetName];
              if (!worksheet) throw new Error(`Sheet "${sheetName}" could not be accessed.`);
              const excelData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: false }); 
              if (!excelData || excelData.length === 0) throw new Error("Excel sheet appears empty or could not be parsed.");
              parsedStructure = parseDataToStructure(excelData);
            } else {
              throw new Error("Unsupported file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.");
            }

            if (parsedStructure.length > 0) {
              console.log(`Successfully parsed ${parsedStructure.length} modules/sub-modules.`);
              setCourseStructure(parsedStructure);
              setTimeout(() => setAppState('structure'), 500); 
            } else {
               console.log("Parsing resulted in empty structure, returning to setup.");
               setTimeout(() => setAppState('setup'), 500);
            }

          } catch (error) {
            console.error('Error processing file:', error);
            toast({
              title: 'Processing Error',
              description: error instanceof Error ? error.message : 'Failed to process the file.',
              variant: 'destructive',
              duration: 7000,
            });
            setAppState('setup'); 
          }
        };
        reader.onerror = (error) => {
          console.error('Error reading file:', error);
          toast({ title: 'File Reading Error', description: 'Could not read the selected file.', variant: 'destructive' });
          setAppState('setup');
        };
        reader.readAsArrayBuffer(file); 
    };

    const handleStartLesson = async (module: CourseModule) => {
        if (module.type !== 'Sub Module') {
          toast({ title: "Information", description: "AI features are available for Sub Modules.", variant: "default" });
          return;
        }
        setSelectedLesson({ name: module.content, type: module.type, description: module.details, id: module.id });
        setGeneratedSlides(null); 
        setVideoContentSummary(null);
        setTextContentSummary(null);
        setTextualLessonContent(null);
        setMessages([]); 
        setIsChatSetupComplete(false); 
        setAppState('generating_slides');

        try {
          const result = await generateSlidesAction({
            submoduleName: module.content,
            submoduleDescription: module.details,
          });

          if (result.success && result.data?.slides && result.data.slides.length > 0) {
            console.log(`Generated ${result.data.slides.length} slides successfully.`);
            setGeneratedSlides(result.data.slides);
            setAppState('slides');
          } else {
            const errorMessage = result.error || (result.errors?.[0]?.message) || 'Slide generation returned no slides or an unknown error.';
            throw new Error(errorMessage);
          }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown slide generation error.';
            console.error('Slide Generation Error:', errorMessage, error);
            toast({
                title: 'Slide Generation Failed',
                description: errorMessage,
                variant: 'destructive',
                duration: 7000,
            });
            setAppState('structure'); 
        }
    };

    const handleLaunchLearningView = async () => {
        if (!selectedLesson || !courseName || !generatedSlides) {
          toast({ title: "Error", description: "Missing required data (lesson, course name, or slides).", variant: "destructive" });
          console.error("Missing data for Learning View:", { selectedLesson, courseName, generatedSlides: !!generatedSlides });
          if (generatedSlides) setAppState('slides');
          else if (courseStructure.length > 0) setAppState('structure');
          else setAppState('setup');
          return;
        }

        setAppState('summarizing_content'); // This state now covers all summary and content generation

        try {
          // 1. Generate Textual Content (Markdown) from Slides
          setAppState('generating_textual_content'); // Indicate textual content generation
          const textualContentResult = await generateTextualContentAction({
            slides: generatedSlides,
            lessonName: selectedLesson.name,
          });

          if (!textualContentResult.success || !textualContentResult.data?.markdownContent) {
             throw new Error(textualContentResult.error || 'Textual lesson content generation failed.');
          }
          const currentTextualLessonContent = textualContentResult.data.markdownContent;
          setTextualLessonContent(currentTextualLessonContent);
          console.log("Displayable textual lesson content generated successfully.");

          // 2. Summarize Slides for Video Context
          setAppState('summarizing_content'); // Switch back to summarizing for UI text
          const slideSummaryResult = await summarizeContentAction({
            slides: generatedSlides,
            submoduleName: selectedLesson.name,
          });

          if (!slideSummaryResult.success || !slideSummaryResult.data?.summary) {
            throw new Error(slideSummaryResult.error || 'Content summarization for video context failed.');
          }
          setVideoContentSummary(slideSummaryResult.data.summary);
          console.log("AI Tutor content summary for video/slides generated successfully.");

          // 3. Summarize Textual Content for Text Context
          const textSummaryResult = await summarizeContentAction({
            textualLessonContent: currentTextualLessonContent,
            submoduleName: selectedLesson.name,
          });
           if (!textSummaryResult.success || !textSummaryResult.data?.summary) {
            throw new Error(textSummaryResult.error || 'Content summarization for textual lesson failed.');
          }
          setTextContentSummary(textSummaryResult.data.summary);
          console.log("AI Tutor content summary for textual lesson generated successfully.");


          const learnerNameForChat = user?.fullName || '';
          // Initialize with textual content summary as "Read Lesson" is default
          const initialMsgs = getInitialMessages(courseName, selectedLesson.name, textSummaryResult.data.summary, learnerNameForChat);
          setMessages(initialMsgs);

          setAppState('learning_view');
          setRightPanelDisplayMode('text'); // Default to text view

        } catch (error) {
          console.error('Error during pre-learning setup:', error);
          toast({ title: 'Learning Environment Setup Failed', description: error instanceof Error ? error.message : 'Unknown error.', variant: "destructive" });
          setAppState('slides'); 
        }
    };

    const getInitialMessages = (course: string, lesson: string, summaryForTutor: string, learnerName: string): Message[] => {
        const baseMessages: Message[] = [
            {
                id: `system-summary-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                sender: 'system',
                text: summaryForTutor,
                timestamp: Date.now(),
                hidden: true, 
            },
        ];

        if (learnerName) {
             const isQuizLesson = lesson.toLowerCase().includes('quiz');
             const introText = isQuizLesson
                ? `Hey ${learnerName.split(' ')[0]}! I'm Rookie & Pookie. We're about to start the quiz for **${lesson}** in **${course}**. You can ask me any questions before you begin or during the quiz! Ready?`
                : `Hey ${learnerName.split(' ')[0]}! I'm Rookie & Pookie, ready to help with **${lesson}** in **${course}**. What are you curious about first? You can read the lesson content on the right, or click 'Generate Video' for an overview! ✨`;

            baseMessages.push({
                id: `ai-initial-intro-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                sender: 'ai',
                text: introText,
                timestamp: Date.now(),
                hidden: false,
            });
        }
        return baseMessages;
    };


    const handleChatSetupComplete = () => {
        console.log("Chat setup complete, showing video/quiz/text panel.");
        setIsChatSetupComplete(true);
    };

     const handleGenerateVideo = async () => {
        if (!generatedSlides || generatedSlides.length === 0) {
            toast({ title: "Error", description: "Slide data is not available to generate video.", variant: "destructive" });
            setVideoPanelState('idle'); 
            return;
        }
        if (isGeneratingVideoRef.current) {
            toast({ title: "In Progress", description: "Video generation is already running.", variant: "default" });
            return;
        }

        setVideoPanelState('generating_video');
        setVideoUrl(null); 
        setVideoError(null);

        const estimatedDuration = Math.max(10, generatedSlides.length * 4); 
        setVideoGenerationDuration(estimatedDuration);
        isGeneratingVideoRef.current = true;

        const systemMessageText = `<<Unstop>> The video generation process has begun! It will take approximately ${estimatedDuration} seconds.`;
        if (chatInterfaceRef.current) {
            chatInterfaceRef.current.simulateUserInput(systemMessageText, true); 
        } else {
            console.warn("ChatInterface ref not available to send video generation system message.");
        }

        try {
            const videoResult = await generateVideoAction({ slides: generatedSlides });
            if (videoResult.success && videoResult.videoUrl) {
                console.log("Video Generation Successful:", videoResult.videoUrl ? 'URL received' : 'No URL');
                setVideoUrl(videoResult.videoUrl);
                setVideoPanelState('video_ready');
                const completionMessage = "<<Unstop>> Video generation complete.";
                if (chatInterfaceRef.current) {
                    chatInterfaceRef.current.simulateUserInput(completionMessage, true);
                }
            } else {
                console.error('Video Generation Action Error:', videoResult.error, videoResult.errors);
                const errorMsg = videoResult.error || (videoResult.errors?.[0]?.message) || 'Failed to generate video. The process may have timed out or encountered an error.';
                setVideoError(errorMsg); // Not used directly by user, but good for debugging
                // The AI will handle telling the user to switch to notes.
                const failureMessage = `<<Unstop>> Video generation failed: ${errorMsg}`;
                if (chatInterfaceRef.current) {
                    chatInterfaceRef.current.simulateUserInput(failureMessage, true);
                }
                // UI will switch based on AI's response via useEffect
            }
        } catch (error) {
            console.error('Exception during video generation process:', error);
            const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred during video generation.';
            const detailedError = errorMsg.includes('python3: not found') || errorMsg.includes('/usr/bin/env: ‘python3’: No such file or directory') || errorMsg.includes('python: command not found')
                ? "Could not find 'python3' command. Ensure Python 3 and necessary libraries (moviepy, Wand, etc.) are installed and in your system's PATH for video generation."
                : errorMsg;
            setVideoError(detailedError); // For debugging
            // The AI will handle telling the user to switch to notes.
            const errorMessageText = `<<Unstop>> Video generation error: ${detailedError}`;
            if (chatInterfaceRef.current) {
                chatInterfaceRef.current.simulateUserInput(errorMessageText, true);
            }
             // UI will switch based on AI's response via useEffect
        } finally {
            isGeneratingVideoRef.current = false;
            setVideoGenerationDuration(null); 
            console.log("Video generation process finished (or failed).");
        }
    };

    const handleGoToNextSubmodule = (markCurrentCompleted: boolean = true) => {
        if (!selectedLesson || !courseStructure) {
            toast({ title: "Error", description: "Cannot determine the next submodule.", variant: "destructive" });
            setAppState('structure'); 
            return;
        }
        
        if (markCurrentCompleted) {
            const updatedStructure = courseStructure.map(mod => {
                if (mod.id === selectedLesson.id && mod.type === 'Sub Module') {
                    return { ...mod, completed: true };
                }
                return mod;
            });
            setCourseStructure(updatedStructure);
             console.log(`Marked submodule ${selectedLesson.name} (ID: ${selectedLesson.id}) as completed.`);
        }


        const currentIndex = courseStructure.findIndex(
            (mod) => mod.type === 'Sub Module' && mod.id === selectedLesson.id
        );

        if (currentIndex === -1) {
            toast({ title: "Error", description: "Current submodule not found in course structure.", variant: "destructive" });
            setAppState('structure');
            return;
        }

        let nextSubmodule: CourseModule | null = null;
        for (let i = currentIndex + 1; i < courseStructure.length; i++) {
            if (courseStructure[i].type === 'Sub Module') {
                nextSubmodule = courseStructure[i];
                break;
            }
        }

        if (nextSubmodule) {
            toast({ title: "Moving to Next Submodule", description: `Loading: ${nextSubmodule.content}`, variant: "default" });
            handleStartLesson(nextSubmodule); 
        } else {
            toast({ title: "Course Complete!", description: "You've finished all submodules in this course.", variant: "default" });
            setAppState('structure'); 
        }
    };


    if (!isClient) {
        return (
          <main className="flex min-h-screen flex-col items-center justify-center p-12 bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </main>
        );
    }

    const isPageLikeFullScreenHeight = [
        'structure', 'slides', 'editing_slides',
        'generating_slides', 'summarizing_content', 'generating_textual_content'
    ].includes(appState);

    const isTrueFullScreenState = ['learning_view'].includes(appState);


    const mainContainerClasses = cn(
        "flex flex-col items-center perspective overflow-hidden w-full",
        "pt-16", 
        (isTrueFullScreenState || isPageLikeFullScreenHeight)
            ? "h-[calc(100vh-4rem)] justify-start" 
            : "min-h-[calc(100vh-4rem)] justify-center", 
        (isTrueFullScreenState || appState === 'landing')
            ? "px-0 pb-0" 
            : "px-4 pb-4 md:px-8 md:pb-8 lg:px-12 lg:pb-12" 
    );

    const contentWrapperClasses = cn(
        "relative w-full transition-all duration-700 ease-in-out",
        (isTrueFullScreenState || isPageLikeFullScreenHeight) ? "h-full" : "", 
        (isTrueFullScreenState || appState === 'landing')
            ? "max-w-none" 
            : (appState === 'structure' || appState === 'slides' || appState === 'editing_slides' || appState === 'generating_slides' || appState === 'summarizing_content' || appState === 'generating_textual_content')
                ? "max-w-4xl" 
                : (appState === 'parsing')
                    ? "max-w-2xl" 
                    : "max-w-lg" 
    );


    const renderContent = () => {
        if (!user && appState !== 'landing' && appState !== 'login' && appState !== 'launching') {
          return <LoginView onLoginSuccess={handleLoginSuccess} onBack={handleBackToLanding} />;
        }

        switch (appState) {
            case 'landing':
                return <LandingView onStart={handleStart} />;
            case 'login':
                return <LoginView onLoginSuccess={handleLoginSuccess} onBack={handleBackToLanding} />;
            case 'launching':
                return <LaunchingView />;
            case 'setup':
                return <SetupView onSubmit={handleCourseSubmit} onBack={handleBackToLanding} />;
            case 'parsing':
                return <ParsingView courseName={courseName} />;
            case 'structure':
                 return (
                    <StructureView
                        courseName={courseName}
                        modules={courseStructure}
                        onStartLesson={handleStartLesson}
                        onBack={handleBackToLanding} 
                     />
                 );
            case 'generating_slides':
                return <GeneratingSlidesView courseName={courseName} lessonName={selectedLesson?.name} />;
            case 'slides':
                return (
                    <SlidesView
                        courseName={courseName}
                        lessonName={selectedLesson?.name}
                        slides={generatedSlides}
                        onBack={handleBackToStructure}
                        onEdit={handleEditSlides}
                        onLaunchLearning={handleLaunchLearningView}
                    />
                );
            case 'editing_slides':
                if (!generatedSlides) return <ErrorView onBack={handleBackToStructure} message="No slides to edit." />;
                return (
                    <EditSlidesView
                        initialSlides={generatedSlides}
                        onSave={handleSaveSlides}
                        onCancel={handleCancelEdit}
                        courseName={courseName}
                        lessonName={selectedLesson?.name}
                    />
                );
            case 'summarizing_content':
                 return <SummarizingContentView courseName={courseName} lessonName={selectedLesson?.name} />;
            case 'generating_textual_content':
                 return <GeneratingTextualContentView courseName={courseName} lessonName={selectedLesson?.name} />;
             case 'learning_view':
                if (!selectedLesson || !courseName || !textContentSummary || !videoContentSummary || textualLessonContent === null) {
                    console.error("Missing data for learning view, returning to structure.", {
                        selectedLesson: !!selectedLesson,
                        courseName: !!courseName,
                        textContentSummary: !!textContentSummary,
                        videoContentSummary: !!videoContentSummary,
                        textualLessonContent: textualLessonContent !== null,
                    });
                    if (generatedSlides) setAppState('slides');
                    else if (courseStructure.length > 0) setAppState('structure');
                    else setAppState('setup');
                    toast({ title: "Error", description: "Could not load learning environment data.", variant: "destructive"});
                    return null; 
                }
                return (
                     <LearningView
                        courseName={courseName}
                        lessonName={selectedLesson.name}
                        textContentSummary={textContentSummary}
                        videoContentSummary={videoContentSummary}
                        textualLessonContent={textualLessonContent}
                        learnerName={user?.fullName || ''} 
                        messages={messages}
                        setMessages={setMessages}
                        addMessage={addMessage}
                        chatInterfaceRef={chatInterfaceRef}
                        onSetupComplete={handleChatSetupComplete}
                        isChatSetupComplete={isChatSetupComplete}
                        videoPanelState={videoPanelState}
                        videoUrl={videoUrl}
                        videoError={videoError}
                        isGeneratingVideo={isGeneratingVideoRef.current}
                        videoGenerationDuration={videoGenerationDuration}
                        onBack={handleBackFromLearningView}
                        onGenerateVideo={handleGenerateVideo}
                        generatedSlides={generatedSlides} 
                        onRegenerateVideo={() => setVideoPanelState('idle')} 
                        onDownloadVideo={() => {
                             if (videoUrl && videoUrl.startsWith('data:')) { 
                                const link = document.createElement('a');
                                link.href = videoUrl;
                                link.download = `${courseName.replace(/[^a-zA-Z0-9]/g, '_')}_${selectedLesson.name.replace(/[^a-zA-Z0-9]/g, '_')}_video.mp4`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                toast({ title: "Downloading...", description: "Video download started. Large files may take time." });
                            } else if (videoUrl) { 
                                window.open(videoUrl, '_blank');
                            } else {
                                toast({ title: "Download Error", description: "No video URL available to download.", variant: "destructive"});
                            }
                        }}
                        onNextSubmodule={handleGoToNextSubmodule}
                        rightPanelDisplayMode={rightPanelDisplayMode}
                        setRightPanelDisplayMode={setRightPanelDisplayMode}
                    />
                );
            case 'error': 
            default:
                return <ErrorView onBack={handleBackToLanding} message="An unexpected application error occurred." />;
        }
    };

    return (
        <>
          <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-lg border-b border-border/30 z-50 flex items-center justify-between px-4 md:px-6 shadow-sm">
            <div className="flex items-center gap-2">
              <img src={logoUrl} alt="Unstop Logo" className="h-8 w-auto" /> 
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground hidden sm:inline">Welcome, {user.fullName.split(' ')[0]}!</span>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </Button>
                </>
              ) : (
                 appState !== 'login' && appState !== 'landing' && (
                  <Button variant="ghost" size="sm" onClick={() => setAppState('login')}>
                    <LogIn className="mr-2 h-4 w-4" /> Login
                  </Button>
                 )
              )}
            </div>
          </header>

          <main className={mainContainerClasses}>
            <div className={contentWrapperClasses}>
              <Suspense fallback={ 
                <div className={cn("flex items-center justify-center", (isTrueFullScreenState || isPageLikeFullScreenHeight) ? "h-full" : "h-[calc(100vh-8rem)]")}>
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
              }>
                {renderContent()}
              </Suspense>
            </div>
          </main>
        </>
    );
}

