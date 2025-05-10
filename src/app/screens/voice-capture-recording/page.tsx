"use client";

import React from 'react';
import VoiceCaptureScreen from '@/components/voice-capture/VoiceCaptureScreen';

export default function VoiceCaptureRecordingPage() {
  return (
    <div className="h-screen w-full">
      <VoiceCaptureScreen initialState="recording" />
    </div>
  );
}
