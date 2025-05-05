'use client';

import React from 'react';

interface VideoPlayerProps {
  videoUrl: string | null;
}

export const VideoPlayer = ({ videoUrl }: VideoPlayerProps) => {
  if (!videoUrl) {
    return <p className="text-muted-foreground text-center">No video available.</p>;
  }

  return (
    // Make the container responsive
    <div className="w-full max-w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
      <video controls className="w-full h-full object-contain">
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};
