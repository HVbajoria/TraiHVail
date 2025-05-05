
'use client';

import React, { useState, useEffect, useCallback, useRef, useContext, Suspense } from 'react';
import { Loader2, LogIn, LogOut, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SlidesOutput } from '@/ai/flows/generate-slides';
import type { SummarizeLearningContentOutput } from '@/ai/flows/summarize-learning-content';
import { AuthContext } from '@/context/AuthContext'; // Import Auth Context
import type { Message, ChatInterfaceHandle } from '@/components/chat/ChatInterface';
import { generateSlidesAction, summarizeSlidesAction } from '@/actions/courseActions';
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
import EditSlidesView from '@/components/views/EditSlidesView'; // Import EditSlidesView
import SummarizingContentView from '@/components/views/SummarizingContentView';
import LearningView from '@/components/views/LearningView';
import ErrorView from '@/components/views/ErrorView';

// Import type definitions
import type { CourseModule } from '@/components/course/CourseStructureDisplay';
import type { AppState, VideoPanelState } from '@/types/app'; // Import shared types

export default function Home() {
  const { user, logout } = useContext(AuthContext);
  const [appState, setAppState] = useState<AppState>('landing');
  const [isClient, setIsClient] = useState(false);
  const [courseName, setCourseName] = useState<string>('');
  const [courseStructure, setCourseStructure] = useState<CourseModule[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<{ name: string; type: 'Module' | 'Sub Module'; description?: string } | null>(null);
  const [generatedSlides, setGeneratedSlides] = useState<SlidesOutput['slides'] | null>(null);
  const [contentSummary, setContentSummary] = useState<string | null>(null);
  const chatInterfaceRef = useRef<ChatInterfaceHandle>(null);
  const { toast } = useToast();

  // --- State specific to Learning View ---
  const [videoPanelState, setVideoPanelState] = useState<VideoPanelState>('hidden');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoGenerationDuration, setVideoGenerationDuration] = useState<number | null>(null);
  const [isChatSetupComplete, setIsChatSetupComplete] = useState(false);
  const isGeneratingVideoRef = useRef(false); // Use ref to track the process state without causing re-renders
  const [messages, setMessages] = useState<Message[]>([]);
  // --- End Learning View State ---

  const logoUrl = "https://d8it4huxumps7.cloudfront.net/uploads/images/unstop/branding-guidelines/logos/white/Unstop-Logo-White-Large.png";

  useEffect(() => {
    setIsClient(true);
    // Redirect to landing if user logs out while in an authenticated state
    if (!user && appState !== 'landing' && appState !== 'login' && appState !== 'launching') {
        setAppState('landing');
        resetAppState();
    }
  }, [user, appState]); // Added appState dependency

   // Reset relevant state when app state changes *away* from learning view
   useEffect(() => {
     if (appState !== 'learning_view') {
       setVideoPanelState('hidden');
       setVideoUrl(null);
       setVideoError(null);
       setVideoGenerationDuration(null);
       setIsChatSetupComplete(false);
       isGeneratingVideoRef.current = false;
       setMessages([]); // Clear messages when leaving learning view
     }
   }, [appState]);

   // --- Navigation and State Transition Handlers ---

   const handleStart = () => {
    if (user) {
       setAppState('launching');
       setTimeout(() => setAppState('setup'), 2000); // Transition after animation
    } else {
        setAppState('login');
    }
  };

  const handleLoginSuccess = () => {
    setAppState('launching'); // Show launching animation
    setTimeout(() => setAppState('setup'), 2000); // Transition to setup after animation
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
    setContentSummary(null);
    // Reset LearningView specific state via useEffect based on appState change
  }

  const handleBackToLanding = () => {
    setAppState('landing');
    resetAppState();
  }

  const handleBackToStructure = () => {
    setAppState('structure');
    setSelectedLesson(null);
    setGeneratedSlides(null);
    setContentSummary(null);
    // Message state reset is handled by useEffect
  }

   const handleBackFromLearningView = () => {
     setAppState('slides'); // Go back to slides view from learning view
     // Message state reset is handled by useEffect
  }

  // --- Slide Editing Handlers ---
  const handleEditSlides = () => {
      if (!generatedSlides) {
          toast({ title: "Error", description: "No slides available to edit.", variant: "destructive" });
          return;
      }
      setAppState('editing_slides');
  }

  const handleSaveSlides = (editedSlides: SlidesOutput['slides']) => {
      setGeneratedSlides(editedSlides);
      setAppState('slides'); // Go back to viewing slides after saving
      toast({ title: "Success", description: "Slide structure updated.", variant: "default" });
  }

  const handleCancelEdit = () => {
      setAppState('slides'); // Go back to viewing slides without saving
  }
  // --- End Slide Editing Handlers ---


  // --- Data Processing and Action Handlers ---

   // Function to add messages for the LearningView
   const addMessage = useCallback((sender: 'user' | 'ai' | 'system', text: string | React.ReactNode, hidden: boolean = false) => {
        setMessages((prev) => {
            const newMessage: Message = {
                id: `${sender}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                sender,
                text,
                timestamp: Date.now(),
                hidden,
            };
            // Basic uniqueness check
            let uniqueId = newMessage.id;
            let attempts = 0;
            while (prev.some(msg => msg.id === uniqueId) && attempts < 10) {
                uniqueId = `${sender}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${attempts}`;
                attempts++;
            }
            newMessage.id = uniqueId;
            return [...prev, newMessage];
        });
    }, []); // No dependencies needed as setMessages updates based on previous state


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
            const rowIndex = index + 2; // Actual row number in the spreadsheet

            if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || cell === '')) {
                console.warn(`[Row ${rowIndex}] Skipping: Row appears empty.`);
                return null;
            }
            const maxIndex = Math.max(contentIndex, typeIndex, detailsIndex === -1 ? -1 : detailsIndex);
            if (row.length <= maxIndex) {
                 console.warn(`[Row ${rowIndex}] Skipping: Row has fewer columns (${row.length}) than required. Needs at least ${maxIndex + 1} columns for Content/Type${detailsIndex !== -1 ? '/Details' : ''}.`);
                 return null;
            }

            const content = row[contentIndex]?.toString().trim();
            const typeRaw = row[typeIndex]?.toString().trim();
            const details = detailsIndex !== -1 ? (row[detailsIndex]?.toString().trim() || '') : '';

            let type: 'Module' | 'Sub Module' | null = null;
            const normalizedType = typeRaw?.toLowerCase().replace(/[-\s]+/g, ''); // Normalize 'Sub Module' -> 'submodule'
            if (normalizedType === 'module') {
                type = 'Module';
            } else if (normalizedType === 'submodule') { // Match normalized 'submodule'
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
             description: "No valid 'Module' or 'Sub Module' rows found. Please check the 'Type' column and ensure 'Content' is not empty.",
             variant: 'destructive',
             duration: 8000,
           });
            return [];
         }
        return parsedStructure;
    };


    const handleCourseSubmit = (name: string, file: File | null) => {
        setCourseName(name);
        setAppState('parsing');
        setCourseStructure([]); // Reset structure before parsing

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
              // Handle potential BOM (Byte Order Mark) in CSV files
              const cleanText = text.charCodeAt(0) === 0xFEFF ? text.substring(1) : text;
              const workbook = XLSX.read(cleanText, { type: 'string', raw: false });
              const sheetName = workbook.SheetNames[0];
              if (!sheetName) throw new Error("Could not process CSV data (No sheet found).");
              const worksheet = workbook.Sheets[sheetName];
              // Use sheet_to_json with header: 1 to get array of arrays, raw: false for formatted values
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
              // Use sheet_to_json with header: 1 to get array of arrays, raw: false for formatted values
              const excelData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: false });
              if (!excelData || excelData.length === 0) throw new Error("Excel sheet appears empty or could not be parsed.");
              parsedStructure = parseDataToStructure(excelData);
            } else {
              throw new Error("Unsupported file type. Please upload an Excel (.xlsx, .xls) or CSV (.csv) file.");
            }

            if (parsedStructure.length > 0) {
              console.log(`Successfully parsed ${parsedStructure.length} modules/sub-modules.`);
              setCourseStructure(parsedStructure);
              setTimeout(() => setAppState('structure'), 500); // Add slight delay for better UX
            } else {
               // Toast/Error already handled in parseDataToStructure if no valid rows found
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
        setSelectedLesson({ name: module.content, type: module.type, description: module.details });
        setGeneratedSlides(null);
        setContentSummary(null);
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
            setAppState('structure'); // Go back to structure on error
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

        setAppState('summarizing_content');

        try {
          const summaryResult = await summarizeSlidesAction({
            slides: generatedSlides,
            submoduleName: selectedLesson.name,
          });

          if (summaryResult.success && summaryResult.data?.summary) {
            console.log("Content summarized successfully.");
            setContentSummary(summaryResult.data.summary);
            const learnerName = user?.fullName || ''; // Use empty string if no user name
            const initialMsgs = getInitialMessages(courseName, selectedLesson.name, summaryResult.data.summary, learnerName);
            setMessages(initialMsgs);
            setAppState('learning_view');
          } else {
            throw new Error(summaryResult.error || 'Content summarization failed or returned empty summary.');
          }
        } catch (error) {
          console.error('Error summarizing content:', error);
          toast({ title: 'Content Summarization Failed', description: error instanceof Error ? error.message : 'Unknown error.', variant: 'destructive' });
          setAppState('slides'); // Go back to slides on error
        }
    };

    // Function to get initial messages for the chat
    const getInitialMessages = (course: string, lesson: string, summary: string, learnerName: string): Message[] => {
        const baseMessages: Message[] = [
            {
                id: `system-summary-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                sender: 'system',
                text: summary,
                timestamp: Date.now(),
                hidden: true,
            },
        ];

        if (learnerName) {
            baseMessages.push({
                id: `ai-intro-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                sender: 'ai',
                text: `Hey ${learnerName.split(' ')[0]}! I'm Rookie & Pookie, ready to help with **${lesson}** in **${course}**. What's your main goal or question for this lesson? 🤔`,
                timestamp: Date.now(),
                hidden: false,
            });
        } else {
             baseMessages.push({
                id: `ai-intro-name-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                sender: 'ai',
                text: `Hey there! I'm Rookie & Pookie, ready to help with **${lesson}** in **${course}**. What name do you go by? 🧑‍🎓`,
                timestamp: Date.now(),
                hidden: false,
            });
        }
        return baseMessages;
    };

    // --- LearningView Specific Handlers ---

    const handleChatSetupComplete = () => {
        console.log("Chat setup complete, showing video panel.");
        setIsChatSetupComplete(true);
        setVideoPanelState('idle');
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

        // Set state for UI changes *first*
        setVideoPanelState('generating_video');
        setVideoUrl(null);
        setVideoError(null);

        // Calculate estimated duration
        const estimatedDuration = Math.max(10, generatedSlides.length * 4); // Minimum 10 seconds
        setVideoGenerationDuration(estimatedDuration);

        // Set ref *after* state updates to avoid race conditions if user clicks multiple times quickly
        isGeneratingVideoRef.current = true;

        // Send hidden message to assistant *without* awaiting its response
        const systemMessageText = `The video generation process has begun! It will take approximately ${estimatedDuration} seconds.`;
        console.log("Simulating hidden system input for video generation start:", systemMessageText);
        if (chatInterfaceRef.current) {
            chatInterfaceRef.current.simulateUserInput(systemMessageText, true);
        } else {
            console.warn("ChatInterface ref not available to send video generation system message.");
        }

        // Run the video generation in the background (DO NOT await here)
        generateVideoAction({ slides: generatedSlides })
            .then(videoResult => {
                if (videoResult.success && videoResult.videoUrl) {
                    console.log("Video Generation Successful:", videoResult.videoUrl ? 'URL received' : 'No URL');
                    setVideoUrl(videoResult.videoUrl);
                    setVideoPanelState('video_ready'); // Update state on success
                    const completionMessage = "<<Unstop>> Video generation complete.";
                    if (chatInterfaceRef.current) {
                        chatInterfaceRef.current.simulateUserInput(completionMessage, true);
                    }
                } else {
                    console.error('Video Generation Action Error:', videoResult.error);
                    const errorMsg = videoResult.error || 'Failed to generate video. The process may have timed out or encountered an error.';
                    setVideoError(errorMsg);
                    setVideoPanelState('video_error'); // Update state on failure
                    toast({ title: 'Video Generation Failed', description: errorMsg, variant: 'destructive', duration: 10000 });
                    const failureMessage = `<<Unstop>> Video generation failed: ${errorMsg}`;
                    if (chatInterfaceRef.current) {
                        chatInterfaceRef.current.simulateUserInput(failureMessage, true);
                    }
                }
            })
            .catch(error => {
                // Handle unexpected errors during the action call itself
                console.error('Exception during video generation process:', error);
                const errorMsg = error instanceof Error ? error.message : 'An unknown error occurred during video generation.';

                 if (errorMsg.includes('command not found') || errorMsg.includes('/usr/bin/env: python3:') || errorMsg.includes('no such file or directory')) {
                     const detailedError = "Could not find 'python3' command or required dependencies. Ensure Python 3 and necessary libraries (moviepy, Wand, etc.) are installed and in your system's PATH for video generation.";
                     setVideoError(detailedError);
                     toast({ title: 'Python/Dependency Error', description: detailedError, variant: 'destructive', duration: 10000 });
                      const errorMessageText = `<<Unstop>> Video generation error: ${detailedError}`;
                      if (chatInterfaceRef.current) {
                          chatInterfaceRef.current.simulateUserInput(errorMessageText, true);
                      }
                 } else {
                    setVideoError(errorMsg);
                    toast({ title: 'Video Generation Error', description: errorMsg, variant: 'destructive', duration: 10000 });
                      const errorMessageText = `<<Unstop>> Video generation error: ${errorMsg}`;
                      if (chatInterfaceRef.current) {
                          chatInterfaceRef.current.simulateUserInput(errorMessageText, true);
                      }
                 }
                 setVideoPanelState('video_error'); // Update state on exception
            })
            .finally(() => {
                // Reset the ref and duration regardless of outcome
                isGeneratingVideoRef.current = false;
                setVideoGenerationDuration(null);
                console.log("Video generation process finished (or failed).");
            });

        // Return immediately after starting the process
        console.log("Video generation started in the background.");
    };


    // --- Render Logic ---

    if (!isClient) {
        return (
          <main className="flex min-h-screen flex-col items-center justify-center p-12 bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
          </main>
        );
    }

    // Adjust container classes based on state
    const isFullScreenState = ['learning_view', 'editing_slides'].includes(appState);
    const mainContainerClasses = cn(
        "flex flex-col items-center perspective overflow-hidden",
        "pt-16", // Adjust for fixed header height
        isFullScreenState
            ? "w-full h-screen p-0 justify-start" // Full screen for specific views
            : "min-h-screen p-4 md:p-8 lg:p-12 justify-center",
        appState === 'landing' ? "p-0 md:p-0 lg:p-0 pt-16" : "" // Specific padding for landing
    );
    const contentWrapperClasses = cn(
        "relative w-full transition-all duration-700 ease-in-out",
        isFullScreenState
            ? "h-full max-w-none" // Full width for specific views
            : "max-w-lg", // Default max-width for forms
        appState === 'landing' && "max-w-none", // Full width for landing
        (appState === 'structure' || appState === 'slides' || appState === 'generating_slides' || appState === 'summarizing_content') && "max-w-4xl", // Wider for structure/slides
        appState === 'parsing' && "max-w-2xl" // Medium for parsing
    );

    const renderContent = () => {
        // Force login check for authenticated states
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
                        onEdit={handleEditSlides} // Pass edit handler
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
             case 'learning_view':
                if (!selectedLesson || !courseName || !contentSummary) {
                    console.error("Missing data for learning view, returning to structure.");
                    // Attempt to recover gracefully
                    if (generatedSlides) setAppState('slides');
                    else if (courseStructure.length > 0) setAppState('structure');
                    else setAppState('setup');
                    toast({ title: "Error", description: "Could not load learning environment data.", variant: "destructive"});
                    return null; // Or render an error component
                }
                return (
                     <LearningView
                        courseName={courseName}
                        lessonName={selectedLesson.name}
                        contentSummary={contentSummary}
                        learnerName={user?.fullName || ''} // Pass empty string if no name
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
                        generatedSlidesCount={generatedSlides?.length ?? 0}
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
                            }
                        }}
                    />
                );
            case 'error': // General error state if needed
            default:
                return <ErrorView onBack={handleBackToLanding} message="An unexpected application error occurred." />;
        }
    };

    return (
        <>
          {/* Header */}
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

          {/* Main Content */}
          <main className={mainContainerClasses}>
            <div className={contentWrapperClasses}>
              <Suspense fallback={
                <div className="flex items-center justify-center h-[85vh]">
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
