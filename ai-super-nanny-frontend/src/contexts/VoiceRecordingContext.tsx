"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { audioProcessingService, TranscriptionResult } from '@/services/audioProcessingService';

// Define event type for better type checking
export type EventType = 'feeding' | 'sleep' | 'diaper' | 'milestone' | 'measurement' | 'bath' | 'medication' | 'activity' | 'note';

export interface TimelineEvent {
  id: string;
  type: EventType;
  time: string;
  description: string;
  fullNarrative?: string;
  relatedPatterns?: string[];
  hasDetails?: boolean;
  isNew?: boolean;
}

export type RecordingState = 'idle' | 'recording' | 'processing' | 'completion';

interface VoiceRecordingContextType {
  recordingState: RecordingState;
  recordingDuration: number;
  formatDuration: (seconds: number) => string;
  startRecording: () => void;
  stopRecording: () => void;
  lastEventId: string | null;
  resetRecordingState: () => void;
  processingError: string | null;
}

const VoiceRecordingContext = createContext<VoiceRecordingContextType | undefined>(undefined);

export const useVoiceRecording = () => {
  const context = useContext(VoiceRecordingContext);
  if (context === undefined) {
    throw new Error('useVoiceRecording must be used within a VoiceRecordingProvider');
  }
  return context;
};

interface VoiceRecordingProviderProps {
  children: ReactNode;
  initialState?: RecordingState;
}

export const VoiceRecordingProvider: React.FC<VoiceRecordingProviderProps> = ({ 
  children, 
  initialState = 'idle' 
}) => {
  const router = useRouter();
  
  // State
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [capturedEvent, setCapturedEvent] = useState<TimelineEvent | null>(
    initialState === 'completion' ? {
      id: `event-${Date.now()}`,
      type: 'feeding',
      time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      description: 'Bottle feeding, 5oz formula, baby seemed hungry',
      hasDetails: true,
      isNew: true
    } : null
  );
  
  // Media recorder references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Handle recording duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (recordingState === 'recording') {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else if (recordingState !== 'processing') {
      setRecordingDuration(0);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingState]);
  
  // Clean up media resources when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      }
    };
  }, []);
  
  // Add a timeout to prevent getting stuck in processing state
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (recordingState === 'processing') {
      timeout = setTimeout(() => {
        if (recordingState === 'processing') {
          console.error('Processing timeout - falling back to idle state');
          setProcessingError('Processing timeout - please try again');
          setRecordingState('idle');
        }
      }, 30000); // 30 seconds timeout
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [recordingState]);
  
  // Format recording duration as MM:SS
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  // Handle recording completion
  const handleRecordingComplete = async (audioBlob: Blob) => {
    try {
      setProcessingError(null);
      setRecordingState('processing');
      
      // Process the audio recording
      const result = await audioProcessingService.processAudioRecording(audioBlob, recordingDuration);
      
      if (result.success && result.eventId) {
        setLastEventId(result.eventId);
        setRecordingState('completion');
      } else {
        console.error('Failed to process recording:', result.error);
        setProcessingError(result.error || 'Failed to process recording');
        setRecordingState('idle');
      }
    } catch (error) {
      console.error('Error in handleRecordingComplete:', error);
      setProcessingError(error instanceof Error ? error.message : 'Unknown error occurred');
      setRecordingState('idle');
    }
  };
  
  // Actions
  const startRecording = useCallback(async () => {
    try {
      setProcessingError(null);
      setRecordingDuration(0);
      audioChunksRef.current = [];
      setRecordingState('recording');
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create a new MediaRecorder instance
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        // Create a blob from the recorded audio chunks
        const blob = new Blob(audioChunksRef.current, { type: 'audio/m4a' });
        handleRecordingComplete(blob);
      };
      
      // Start the recording
      mediaRecorder.start();
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error: any) {
      console.error('Error starting recording:', error);
      setProcessingError(error.message || 'Could not access microphone');
    }
  }, [handleRecordingComplete, recordingDuration]);
  
  const stopRecording = useCallback(() => {
    setRecordingState('processing');
    
    // Stop the media recorder if it's active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
    }
  }, []);
  
  const resetRecordingState = useCallback(() => {
    setRecordingState('idle');
    setRecordingDuration(0);
    setLastEventId(null);
    setCapturedEvent(null);
    setProcessingError(null);
  }, []);
  
  const value = {
    recordingState,
    recordingDuration,
    formatDuration,
    startRecording,
    stopRecording,
    lastEventId,
    resetRecordingState,
    processingError
  };
  
  return (
    <VoiceRecordingContext.Provider value={value}>
      {children}
    </VoiceRecordingContext.Provider>
  );
};
