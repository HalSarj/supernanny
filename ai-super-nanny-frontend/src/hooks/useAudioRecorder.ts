"use client";

import { useState, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

// Define types for the hook
interface UseAudioRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, duration: number) => void;
  maxDuration?: number; // Maximum recording duration in seconds
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingDuration: number;
  audioBlob: Blob | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  isProcessing: boolean;
  error: string | null;
}

/**
 * Hook for recording audio using the MediaRecorder API
 */
export const useAudioRecorder = ({
  onRecordingComplete,
  maxDuration = 120 // Default max duration: 2 minutes
}: UseAudioRecorderProps = {}): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Refs to store non-state values
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const maxDurationTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up function to stop all recording processes
  const cleanupRecording = useCallback(() => {
    // Clear timers
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    
    // Stop the media recorder if it's active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
  }, []);
  
  // Stop recording audio - declaring this first to avoid reference issues
  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    
    cleanupRecording();
  }, [cleanupRecording, isRecording]);
  
  // Start recording audio
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setAudioBlob(null);
      audioChunksRef.current = [];
      setRecordingDuration(0);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create a new MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Create a blob from the recorded audio chunks
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/m4a' });
        setAudioBlob(audioBlob);
        
        // Call the callback if provided
        if (onRecordingComplete) {
          onRecordingComplete(audioBlob, recordingDuration);
        }
      };
      
      // Start the recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start a timer to track recording duration
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      // Set a timeout to automatically stop recording after maxDuration
      maxDurationTimerRef.current = setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, maxDuration * 1000);
      
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError(err.message || 'Could not access microphone');
      cleanupRecording();
    }
  }, [cleanupRecording, isRecording, maxDuration, onRecordingComplete, recordingDuration, stopRecording]);
  
  // Clean up on unmount
  useState(() => {
    return () => {
      cleanupRecording();
    };
  });
  
  return {
    isRecording,
    recordingDuration,
    audioBlob,
    startRecording,
    stopRecording,
    isProcessing,
    error
  };
};

export default useAudioRecorder;
