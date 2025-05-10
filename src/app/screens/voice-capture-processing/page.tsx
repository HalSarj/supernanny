"use client";

import React from 'react';
import VoiceCaptureScreen from '@/components/voice-capture/VoiceCaptureScreen';

export default function VoiceCaptureProcessingPage() {
  return (
    <div className="h-screen w-full">
      <VoiceCaptureScreen initialState="processing" />
    </div>
  );
}
