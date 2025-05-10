"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import VoiceCaptureScreen from '@/components/voice-capture/VoiceCaptureScreen';

export default function VoiceCapturePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [initialState, setInitialState] = useState<'idle' | 'recording' | 'processing' | 'completion'>('idle');
  
  useEffect(() => {
    // Get the state from URL parameters
    const stateParam = searchParams.get('state');
    
    if (stateParam === 'recording' || stateParam === 'processing' || stateParam === 'completion') {
      setInitialState(stateParam);
    }
    
    // If we're in recording state, we'll automatically transition to processing after some time
    if (stateParam === 'recording') {
      const timer = setTimeout(() => {
        // Navigate to processing state
        router.replace('/voice-capture?state=processing');
      }, 5000); // Allow 5 seconds of recording
      
      return () => clearTimeout(timer);
    }
    
    // If we're in processing state, we'll automatically transition to completion
    if (stateParam === 'processing') {
      const timer = setTimeout(() => {
        // Navigate to completion state
        router.replace('/voice-capture?state=completion');
      }, 2000); // 2 seconds of processing
      
      return () => clearTimeout(timer);
    }
    
    // If we're in completion state, we'll automatically navigate back to timeline after some time
    if (stateParam === 'completion') {
      const timer = setTimeout(() => {
        // Navigate back to timeline
        router.replace('/timeline');
      }, 3000); // Show completion for 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);
  
  return (
    <div className="w-full h-screen flex items-center justify-center bg-[#1F2937]">
      <div className="w-full max-w-md h-full max-h-[812px] overflow-hidden rounded-3xl border-2 border-[#4B5563] shadow-lg">
        <VoiceCaptureScreen initialState={initialState} />
      </div>
    </div>
  );
}
