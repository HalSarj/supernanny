"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VoiceCaptureButton from './VoiceCaptureButton';
import AudioWaveform from './AudioWaveform';
import { cn } from '@/utils/cn';

interface VoiceCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VoiceCaptureModal: React.FC<VoiceCaptureModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const router = useRouter();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Start recording immediately when modal opens
  useEffect(() => {
    if (isOpen) {
      // Start recording immediately
      setIsRecording(true);
      setIsProcessing(false);
      setRecordingDuration(0);
      
      // Simulate haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  }, [isOpen]);
  
  // Handle recording duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleStartRecording = () => {
    setIsRecording(true);
    // Simulate haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      setIsProcessing(false);
      
      // Close the modal
      onClose();
      
      // Navigate to timeline page with a new event parameter
      // Use window.location for a full page reload to ensure state is reset
      window.location.href = '/timeline?newEvent=true';
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm transition-all animate-fadeIn">
      <div className="w-full max-w-md h-full max-h-[80vh] flex flex-col items-center justify-center p-6">
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Status text */}
          {isRecording && (
            <div className="mb-8 text-white text-xl font-medium animate-fadeIn">
              <span className="inline-flex items-center">
                Recording <span className="ml-2 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
              </span>
              <div className="mt-2 text-sm text-gray-300 text-center">
                {recordingDuration > 0 && (
                  <span>{Math.floor(recordingDuration / 60).toString().padStart(2, '0')}:{(recordingDuration % 60).toString().padStart(2, '0')}</span>
                )}
              </div>
            </div>
          )}
          
          {isProcessing && (
            <div className="mb-8 text-white text-xl font-medium animate-fadeIn">
              <span className="inline-flex items-center">
                Processing
                <span className="ml-2 inline-block">
                  <span className="inline-block h-1 w-1 bg-white rounded-full animate-bounce"></span>
                  <span className="inline-block ml-1 h-1 w-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="inline-block ml-1 h-1 w-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </span>
              </span>
            </div>
          )}
          
          {/* Audio waveform (only visible when recording) */}
          {isRecording && (
            <AudioWaveform 
              isRecording={true} 
              className="mb-12"
            />
          )}
          
          {/* Voice capture button */}
          <div className="relative">
            {isRecording && (
              <div className="absolute -inset-4 rounded-full border-2 border-purple-500 opacity-75 animate-ping"></div>
            )}
            <VoiceCaptureButton
              isRecording={isRecording}
              isProcessing={isProcessing}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              className="mb-8 relative z-10"
            />
          </div>
          
          {/* Cancel button (only shown when not processing) */}
          {!isProcessing && (
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded-full bg-gray-800 text-white text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceCaptureModal;
