"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceRecording } from "@/contexts/VoiceRecordingContext";
import { ConnectedVoiceCaptureButton, RecordingWaveform, CompletionOverlay, IdleStateContent } from "./index";
import { Icon } from "../ui/Icon";

interface VoiceCaptureOverlayProps {
  onClose: () => void;
}

export const VoiceCaptureOverlay: React.FC<VoiceCaptureOverlayProps> = ({ onClose }) => {
  const { recordingState, recordingDuration, formatDuration } = useVoiceRecording();
  
  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';
  const showCompletion = recordingState === 'completion';
  
  // No auto-close for completion state - let the user decide when to close
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 transition-all animate-fadeIn">
      <div className="relative flex flex-col w-full h-full bg-[#0F172A] text-white overflow-hidden">
        {/* Status bar without back button */}
        <div className="flex items-center justify-center p-4 z-50">
          <div className="flex items-center">
            {isRecording && (
              <span className="flex items-center text-[15px] font-medium text-[#F9FAFB]">
                <span className="w-2 h-2 rounded-full bg-[#F04438] mr-2 animate-pulse"></span>
                Recording
              </span>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-20 pt-10">
          {/* Completion state overlay */}
          <AnimatePresence>
            {showCompletion && <CompletionOverlay onClose={onClose} />}
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
              
              {/* Tips for recording */}
              <div className="w-full max-w-md bg-[#1E293B] rounded-xl p-4 mt-4 mx-4">
                <div className="flex items-center mb-3">
                  <Icon name="Lightbulb" size={18} color="#9CA3AF" className="mr-2" />
                  <span className="text-[15px] font-medium text-[#F9FAFB]">
                    Tips for best results
                  </span>
                </div>
                <ul className="text-[14px] text-[#D1D5DB] space-y-2">
                  <li className="flex items-start">
                    <span className="inline-block w-1 h-1 rounded-full bg-[#9CA3AF] mt-2 mr-2"></span>
                    Speak clearly and include key details
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1 h-1 rounded-full bg-[#9CA3AF] mt-2 mr-2"></span>
                    Mention the type of activity (feeding, sleep, etc.)
                  </li>
                  <li className="flex items-start">
                    <span className="inline-block w-1 h-1 rounded-full bg-[#9CA3AF] mt-2 mr-2"></span>
                    Include time if it's not happening right now
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Voice capture button - only visible when not in completion state */}
        {!showCompletion && (
          <div className="w-full flex flex-col items-center pb-10 pt-4 mt-auto z-50">
            <span className="text-[22px] font-medium mb-3 h-[28px]" style={{ color: isRecording ? '#F9FAFB' : 'transparent' }}>
              {formatDuration(recordingDuration)}
            </span>
            <ConnectedVoiceCaptureButton />
          </div>
        )}
      </div>
    </div>
  );
};
