"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVoiceRecording } from "@/contexts/VoiceRecordingContext";
import useAudioWaveform from "@/hooks/useAudioWaveform";

interface VoiceCaptureButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const VoiceCaptureButton: React.FC<VoiceCaptureButtonProps> = ({
  isRecording,
  isProcessing,
  onStartRecording,
  onStopRecording,
}) => {
  // Use our custom hook for audio waveform animation
  const { bars } = useAudioWaveform({ isRecording });

  return (
    <div className="relative">
      {/* Main button */}
      <motion.button
        className={`relative flex items-center justify-center rounded-full w-[72px] h-[72px] ${isRecording
          ? "bg-[#F04438] shadow-lg"
          : "bg-[#F04438] shadow-lg"
          }`}
        whileTap={{ scale: 0.95 }}
        onClick={isRecording ? onStopRecording : onStartRecording}
        disabled={isProcessing}
      >
        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div
              key="stop"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-[24px] h-[24px] bg-white rounded-sm"
            />
          ) : (
            <motion.div
              key="mic"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14ZM11 5C11 4.45 11.45 4 12 4C12.55 4 13 4.45 13 5V11C13 11.55 12.55 12 12 12C11.45 12 11 11.55 11 11V5ZM17 11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11H5C5 14.53 7.61 17.43 11 17.92V21H13V17.92C16.39 17.43 19 14.53 19 11H17Z"
                  fill="white"
                />
              </svg>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* No audio waveform animation here - it's now in the RecordingWaveform component */}

      {/* Processing spinner */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-[72px] h-[72px] rounded-full border-4 border-t-4 border-t-[#F04438] border-[rgba(255,255,255,0.3)]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ position: "absolute" }}
          />
        </div>
      )}
    </div>
  );
};

// Create a connected version that uses the context directly
export const ConnectedVoiceCaptureButton: React.FC = () => {
  const { recordingState, startRecording, stopRecording } = useVoiceRecording();
  
  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';
  
  return (
    <VoiceCaptureButton
      isRecording={isRecording}
      isProcessing={isProcessing}
      onStartRecording={startRecording}
      onStopRecording={stopRecording}
    />
  );
};

export default VoiceCaptureButton;
