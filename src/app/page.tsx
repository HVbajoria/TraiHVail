
'use client';

import React, { useState, useEffect } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import LandingPage from '@/components/home/LandingPage'; // Import the new LandingPage component
import { Loader2, Rocket } from 'lucide-react'; // Keep Rocket for transition

export default function Home() {
  const [showChat, setShowChat] = useState(false);
  const [isLoadingTransition, setIsLoadingTransition] = useState(false);
  const [showRocket, setShowRocket] = useState(false); // State for rocket animation
  const [isClient, setIsClient] = useState(false);

  // Ensure component runs only on the client to avoid hydration issues with state
  useEffect(() => {
    setIsClient(true);
  }, []);


  const handleStartChat = () => {
    setIsLoadingTransition(true);
    setShowRocket(true); // Show rocket immediately
    // Simulate loading/animation time
    setTimeout(() => {
      setShowChat(true);
      setIsLoadingTransition(false);
      // Rocket animation ends implicitly after duration
    }, 2500); // Increased delay for rocket + loading text
  };

  // Render nothing or a basic loader until client-side is confirmed
   if (!isClient) {
     return (
       <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 lg:p-12 bg-background">
         <Loader2 className="h-16 w-16 animate-spin text-primary" />
       </main>
     );
   }


  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8 lg:p-12 perspective overflow-hidden"> {/* Added perspective class and overflow hidden */}
      <div className={`relative w-full max-w-4xl transition-all duration-1000 ease-in-out ${isLoadingTransition && !showChat ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {isLoadingTransition && !showChat && (
          <div className="absolute inset-0 flex flex-col items-center justify-center h-[85vh] text-center z-20">
             {/* Rocket Animation */}
            {showRocket && (
              <Rocket className="h-24 w-24 text-primary mb-8 animate-rocket-launch-fullscreen" />
            )}
            {/* Loading Text after rocket */}
            <p className="text-2xl text-primary animate-fade-in-delay font-semibold">
              Powering up TraiHVail engines...
            </p>
          </div>
        )}
        {!showChat && !isLoadingTransition && (
          <LandingPage onStartChat={handleStartChat} />
        )}
        {showChat && ( // No need for !isLoadingTransition here if handled by parent opacity
           <div className="w-full h-[85vh] flex flex-col animate-fade-in"> {/* Ensure fade-in on chat view */}
              <h1
                className="text-3xl md:text-4xl font-bold mb-6 text-center text-primary header-glow" // Use class for glow
              >
                TraiHVail {/* Updated App Name */}
              </h1>
              <ChatInterface />
           </div>
        )}
      </div>
    </main>
  );
}
