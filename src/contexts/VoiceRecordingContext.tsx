"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Define event type for better type checking
export type EventType = 'feeding' | 'sleep' | 'diaper' | 'milestone';

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
  // State
  recordingState: RecordingState;
  recordingDuration: number;
  capturedEvent: TimelineEvent | null;
  
  // Actions
  startRecording: () => void;
  stopRecording: () => void;
  resetRecording: () => void;
  
  // Utilities
  formatDuration: (seconds: number) => string;
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
  const [recordingState, setRecordingState] = useState<RecordingState>(initialState);
  const [recordingDuration, setRecordingDuration] = useState(0);
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
  
  // Format recording duration as MM:SS
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  // Actions
  const startRecording = useCallback(() => {
    setRecordingState('recording');
    setRecordingDuration(0);
    
    // Simulate haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, []);
  
  const stopRecording = useCallback(() => {
    setRecordingState('processing');
    
    // Simulate processing delay
    setTimeout(() => {
      // Randomly select an event type to demonstrate different types
      const eventTypes: EventType[] = ['feeding', 'sleep', 'diaper'];
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      // Create event data based on type
      let description = '';
      switch (randomType) {
        case 'feeding':
          description = 'Bottle feeding, 5oz formula, baby seemed hungry';
          break;
        case 'sleep':
          description = 'Nap time, slept for 1 hour 20 minutes';
          break;
        case 'diaper':
          description = 'Wet diaper, changed';
          break;
        default:
          description = 'New event recorded';
      }
      
      // Create new event data
      const newEvent: TimelineEvent = {
        id: `event-${Date.now()}`,
        type: randomType,
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        description: description,
        hasDetails: true,
        isNew: true
      };
      
      // Store the event in localStorage to retrieve it in the timeline
      try {
        const existingEvents = localStorage.getItem('timelineEvents');
        const events = existingEvents ? JSON.parse(existingEvents) : [];
        events.push(newEvent);
        localStorage.setItem('timelineEvents', JSON.stringify(events));
      } catch (error) {
        console.error('Failed to store event in localStorage:', error);
      }
      
      setCapturedEvent(newEvent);
      setRecordingState('completion');
    }, 1500);
  }, [router]);
  
  const resetRecording = useCallback(() => {
    setRecordingState('idle');
    setRecordingDuration(0);
    setCapturedEvent(null);
  }, []);
  
  const value = {
    // State
    recordingState,
    recordingDuration,
    capturedEvent,
    
    // Actions
    startRecording,
    stopRecording,
    resetRecording,
    
    // Utilities
    formatDuration
  };
  
  return (
    <VoiceRecordingContext.Provider value={value}>
      {children}
    </VoiceRecordingContext.Provider>
  );
};
