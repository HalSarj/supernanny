"use client";

import React, { useState, useEffect } from 'react';
import { Icon } from '../ui/Icon';
import { cn } from '@/utils/cn';

interface VoiceCaptureButtonProps {
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  isProcessing: boolean;
  className?: string;
}

const VoiceCaptureButton: React.FC<VoiceCaptureButtonProps> = ({
  onStartRecording,
  onStopRecording,
  isRecording,
  isProcessing,
  className,
}) => {
  const [showHint, setShowHint] = useState(true);
  
  // Hide the hint text after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHint(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  const handlePress = () => {
    if (isProcessing) return;
    
    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {showHint && !isRecording && !isProcessing && (
        <span className="text-[14px] font-normal text-[#F9FAFB] opacity-80 mb-3 animate-fadeOut">
          Tap to record
        </span>
      )}
      
      {/* Removed timer display */}
      
      {isProcessing && (
        <span className="text-[15px] font-medium text-[#D1D5DB] mb-3">
          Processing...
        </span>
      )}
      
      <button
        onClick={handlePress}
        className={cn(
          "relative flex items-center justify-center",
          "rounded-full",
          isProcessing ? "bg-[#374151]" : "bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6]",
          "shadow-lg shadow-[#7C3AED]/20",
          "transition-all duration-200 ease-out",
          "focus:outline-none",
          "w-[56px] h-[56px]",
          !isRecording && !isProcessing && "animate-pulse",
          isRecording && "w-[62px] h-[62px]"
        )}
      >
        {isRecording && (
          <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#E11D48] animate-pulse"></div>
        )}
        
        {!isProcessing ? (
          <Icon 
            name={isRecording ? "Square" : "Mic"}
            size={24} 
            color="#FFFFFF" 
            strokeWidth={2} 
            className={cn(
              isRecording ? "" : "animate-pulse"
            )}
          />
        ) : (
          <div className="w-5 h-5 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
        )}
      </button>
    </div>
  );
};

export default VoiceCaptureButton;
