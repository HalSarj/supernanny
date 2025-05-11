"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Icon } from "../ui/Icon";
import { useVoiceRecording } from "@/contexts/VoiceRecordingContext";
import { ConnectedVoiceCaptureButton, RecordingWaveform, CompletionOverlay, IdleStateContent, ProcessingErrorDisplay } from "./index";

// Component has been extracted to RecordingWaveform.tsx

// Component has been extracted to CompletionOverlay.tsx
// Main VoiceCaptureScreen component
const VoiceCaptureScreen: React.FC = () => {
  const router = useRouter();
  const { recordingState, recordingDuration, lastEventId, formatDuration, processingError } = useVoiceRecording();
  
  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';
  const showCompletion = recordingState === 'completion';
  
  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-[#0F172A] to-[#1E293B] text-white overflow-hidden">
      {/* Status bar with back button */}
      <div className="flex items-center justify-between p-4 z-50">
        <button 
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1E293B]/50 backdrop-blur-sm"
        >
          <Icon name="ChevronLeft" size={20} color="#F9FAFB" />
        </button>
        
        <div className="flex items-center">
          {isRecording && (
            <span className="flex items-center text-[15px] font-medium text-[#F9FAFB]">
              <span className="w-2 h-2 rounded-full bg-[#F04438] mr-2 animate-pulse"></span>
              Recording
            </span>
          )}
        </div>
        
        <div className="w-8 h-8"></div> {/* Empty div for balance */}
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20 pt-10">
        {/* Completion state overlay */}
        <AnimatePresence>
          {showCompletion && lastEventId && (
            <CompletionOverlay />
          )}
          {processingError && (
            <ProcessingErrorDisplay />
          )}
        </AnimatePresence>

        {/* Placeholder content when not recording */}
        {!isRecording && !isProcessing && !showCompletion && (
          <IdleStateContent />
        )}

        {/* Waveform visualization when recording */}
        {isRecording && (
          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <RecordingWaveform />
            
            <div className="text-center mb-4">
              <h3 className="text-xl font-medium text-[#F9FAFB] mb-2">
                Listening...
              </h3>
              <p className="text-[15px] text-[#D1D5DB]">
                Describe what's happening with your baby
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Voice capture button - always visible in all states */}
      <div className="w-full flex flex-col items-center pb-10 pt-4 mt-auto z-50">
        <span className="text-[22px] font-medium mb-3 h-[28px]" style={{ color: isRecording ? '#F9FAFB' : 'transparent' }}>
          {formatDuration(recordingDuration)}
        </span>
        <ConnectedVoiceCaptureButton />
      </div>
    </div>
  );
};

export default VoiceCaptureScreen;
