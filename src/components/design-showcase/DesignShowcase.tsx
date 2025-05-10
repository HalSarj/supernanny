"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import components with SSR disabled to prevent hydration errors
const VoiceCaptureScreen = dynamic(
  () => import('../voice-capture/VoiceCaptureScreen'),
  { ssr: false }
);

export default function DesignShowcase() {
  const [loaded, setLoaded] = useState(false);
  
  // Set loaded to true after component mounts
  React.useEffect(() => {
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <div className="flex flex-col items-center p-8 bg-[#1F2937] min-h-screen">
        <h1 className="text-3xl font-bold mb-8 text-[#F9FAFB]">AI Super-Nanny Design Showcase</h1>
        <div className="flex items-center justify-center w-full">
          <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-8 bg-[#1F2937]">
      <h1 className="text-3xl font-bold mb-8 text-[#F9FAFB]">AI Super-Nanny Design Showcase</h1>
      
      {/* Idle State */}
      <div className="mb-16">
        <h2 className="text-center text-2xl font-bold mb-4 text-[#F9FAFB]">1. Idle State</h2>
        <div className="border-2 border-[#4B5563] rounded-3xl overflow-hidden h-[812px] w-[375px] shadow-lg">
          <VoiceCaptureScreen initialState="idle" />
        </div>
      </div>
      
      {/* Recording State */}
      <div className="mb-16">
        <h2 className="text-center text-2xl font-bold mb-4 text-[#F9FAFB]">2. Recording State</h2>
        <div className="border-2 border-[#4B5563] rounded-3xl overflow-hidden h-[812px] w-[375px] shadow-lg">
          <VoiceCaptureScreen initialState="recording" />
        </div>
      </div>
      
      {/* Processing State */}
      <div className="mb-16">
        <h2 className="text-center text-2xl font-bold mb-4 text-[#F9FAFB]">3. Processing State</h2>
        <div className="border-2 border-[#4B5563] rounded-3xl overflow-hidden h-[812px] w-[375px] shadow-lg">
          <VoiceCaptureScreen initialState="processing" />
        </div>
      </div>
      
      {/* Completion State */}
      <div className="mb-16">
        <h2 className="text-center text-2xl font-bold mb-4 text-[#F9FAFB]">4. Completion State</h2>
        <div className="border-2 border-[#4B5563] rounded-3xl overflow-hidden h-[812px] w-[375px] shadow-lg">
          <VoiceCaptureScreen initialState="completion" />
        </div>
      </div>
    </div>
  );
}
