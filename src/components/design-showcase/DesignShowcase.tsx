"use client";

import React, { useState } from 'react';

/**
 * DesignShowcase component
 * 
 * This component displays the different screens of the application in a showcase format.
 * It uses iframes to load the actual screens, ensuring that we're using the real components
 * rather than duplicating code.
 */
export default function DesignShowcase() {
  // Base URL for the screens
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="flex flex-col items-center p-8 bg-[#1F2937]">
      <h1 className="text-3xl font-bold mb-8 text-[#F9FAFB]">AI Super-Nanny Design Showcase</h1>
      
      {/* Idle State */}
      <div className="mb-16">
        <h2 className="text-center text-2xl font-bold mb-4 text-[#F9FAFB]">1. Idle State</h2>
        <div className="border-2 border-[#4B5563] rounded-3xl overflow-hidden h-[812px] w-[375px] shadow-lg relative">
          <iframe 
            src="/screens/voice-capture-idle" 
            className="w-full h-full border-0"
            title="Voice Capture - Idle State"
          />
        </div>
      </div>
      
      {/* Recording State */}
      <div className="mb-16">
        <h2 className="text-center text-2xl font-bold mb-4 text-[#F9FAFB]">2. Recording State</h2>
        <div className="border-2 border-[#4B5563] rounded-3xl overflow-hidden h-[812px] w-[375px] shadow-lg relative">
          <iframe 
            src="/screens/voice-capture-recording" 
            className="w-full h-full border-0"
            title="Voice Capture - Recording State"
          />
        </div>
      </div>
      
      {/* Processing State */}
      <div className="mb-16">
        <h2 className="text-center text-2xl font-bold mb-4 text-[#F9FAFB]">3. Processing State</h2>
        <div className="border-2 border-[#4B5563] rounded-3xl overflow-hidden h-[812px] w-[375px] shadow-lg relative">
          <iframe 
            src="/screens/voice-capture-processing" 
            className="w-full h-full border-0"
            title="Voice Capture - Processing State"
          />
        </div>
      </div>
      
      {/* Completion State */}
      <div className="mb-16">
        <h2 className="text-center text-2xl font-bold mb-4 text-[#F9FAFB]">4. Completion State</h2>
        <div className="border-2 border-[#4B5563] rounded-3xl overflow-hidden h-[812px] w-[375px] shadow-lg relative">
          <iframe 
            src="/screens/voice-capture-completion" 
            className="w-full h-full border-0"
            title="Voice Capture - Completion State"
          />
        </div>
      </div>
    </div>
  );
}
