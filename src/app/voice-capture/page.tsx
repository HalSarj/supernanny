"use client";

import React from 'react';
import VoiceCaptureScreen from '@/components/voice-capture/VoiceCaptureScreen';

export default function VoiceCapturePage() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-[#1F2937]">
      <div className="w-full max-w-md h-full max-h-[812px] overflow-hidden rounded-3xl border-2 border-[#4B5563] shadow-lg">
        <VoiceCaptureScreen initialState="idle" />
      </div>
    </div>
  );
}
