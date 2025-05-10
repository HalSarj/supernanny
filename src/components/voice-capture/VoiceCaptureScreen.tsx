"use client";

import React, { useState, useEffect } from 'react';
import VoiceCaptureButton from './VoiceCaptureButton';
import AudioWaveform from './AudioWaveform';
import EventPreviewCard from './EventPreviewCard';
import { Icon } from '../ui/Icon';
import { cn } from '@/utils/cn';

// Define event type for better type checking
type EventType = 'feeding' | 'sleep' | 'diaper' | 'milestone';

interface TimelineEvent {
  id: string;
  type: EventType;
  time: string;
  description: string;
}

// Mock recent events data
const defaultEvents: TimelineEvent[] = [
  { 
    id: '1', 
    type: 'feeding', 
    time: '2:30 PM', 
    description: 'Bottle feeding, 4oz formula' 
  },
  { 
    id: '2', 
    type: 'sleep', 
    time: '12:15 PM', 
    description: 'Nap time, slept for 1 hour 20 minutes' 
  },
  { 
    id: '3', 
    type: 'diaper', 
    time: '11:30 AM', 
    description: 'Wet diaper, changed' 
  }
];

interface VoiceCaptureScreenProps {
  initialState?: 'idle' | 'recording' | 'processing' | 'completion';
}

const VoiceCaptureScreen: React.FC<VoiceCaptureScreenProps> = ({ 
  initialState = 'idle'
}) => {
  // Initialize state based on initialState prop
  const [isRecording, setIsRecording] = useState(initialState === 'recording');
  const [isProcessing, setIsProcessing] = useState(initialState === 'processing');
  const [showCompletionState, setShowCompletionState] = useState(initialState === 'completion');
  const [recordingDuration, setRecordingDuration] = useState(initialState === 'recording' ? 12 : 0);
  
  // Initialize timeline events
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(() => {
    // If we're in completion state, add the demo event to the top of the timeline
    if (initialState === 'completion') {
      return [
        {
          id: '0',
          type: 'feeding',
          time: '3:45 PM',
          description: 'Bottle feeding, 5oz formula, baby seemed hungry'
        },
        ...defaultEvents
      ];
    }
    return [...defaultEvents];
  });
  
  const [capturedEvent, setCapturedEvent] = useState<{
    type: EventType;
    time: string;
    description: string;
  } | null>(initialState === 'completion' ? {
    type: 'feeding',
    time: '3:45 PM',
    description: 'Bottle feeding, 5oz formula, baby seemed hungry'
  } : null);

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

  // Format recording duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    // Simulate haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Start with a fresh recording duration
    setRecordingDuration(0);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsProcessing(true);
    
    // Simulate processing delay
    setTimeout(() => {
      setIsProcessing(false);
      setShowCompletionState(true);
      
      // Create new event data
      const newEvent = {
        id: `event-${Date.now()}`, // Generate unique ID
        type: 'feeding' as EventType,
        time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        description: 'Bottle feeding, 5oz formula, baby seemed hungry'
      };
      
      // Set as captured event for preview
      setCapturedEvent(newEvent);
      
      // Add to timeline at the top
      setTimelineEvents(prev => [newEvent, ...prev]);
      
      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setShowCompletionState(false);
      }, 3000);
    }, 2000);
  };

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-gradient-radial from-[#1F2937] to-[#111827] px-5">
      {/* Apply subtle haptic feedback when screen loads */}
      <div className="hidden" onLoad={() => navigator.vibrate && navigator.vibrate(20)}></div>
      {/* Full-screen takeover overlay for recording state */}
      {isRecording && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#1F2937]/85 to-[#111827]/85 backdrop-blur-sm z-10 transition-opacity duration-300">
          {/* Subtle radial gradient for depth - 3% lighter at center */}
          <div className="absolute inset-0 bg-gradient-radial from-[#7C3AED]/5 to-transparent opacity-30"></div>
          
          {/* Pulsing circles animation */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute w-[300px] h-[300px] rounded-full border border-[#7C3AED]/10 animate-ping-slow"></div>
            <div className="absolute w-[200px] h-[200px] rounded-full border border-[#7C3AED]/20 animate-ping-slow animation-delay-300"></div>
            <div className="absolute w-[100px] h-[100px] rounded-full border border-[#7C3AED]/30 animate-ping-slow animation-delay-600"></div>
          </div>
          
          {/* Listening indicator */}
          <div className="absolute top-1/3 left-0 right-0 flex flex-col items-center z-20">
            <div className="w-16 h-16 rounded-full bg-[#7C3AED]/20 flex items-center justify-center mb-4">
              <Icon name="Mic" size={32} color="#7C3AED" />
            </div>
            <p className="text-[18px] font-medium text-[#F9FAFB] mb-2">Listening...</p>
            <p className="text-[14px] text-[#D1D5DB] text-center max-w-[250px] mb-8">
              Tell me what happened with your baby
            </p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className={cn(
        "w-full flex justify-between items-center pt-12 pb-4",
        isRecording ? "opacity-50 z-20" : ""
      )}>
        <div className="flex items-center gap-2">
          <Icon name="Baby" size={24} color="#7C3AED" />
          <h1 className="text-[20px] font-semibold text-[#F9FAFB]">AI Super-Nanny</h1>
        </div>
        <button className="w-10 h-10 rounded-full flex items-center justify-center bg-[#374151]">
          <Icon name="Menu" size={20} color="#D1D5DB" />
        </button>
      </header>

      {/* Recent events with timeline (dimmed when recording) */}
      <div className={cn(
        "w-full flex-1 transition-opacity duration-300",
        isRecording ? "opacity-70" : isProcessing ? "opacity-70" : "opacity-100"
      )}>
        <h2 className="text-[18px] font-semibold text-[#F9FAFB] mb-6">Today's Events</h2>
        
        {/* Date header */}
        <div className="flex items-center mb-4">
          <div className="h-4 w-4 rounded-full bg-[#7C3AED] flex-shrink-0"></div>
          <div className="ml-3">
            <span className="text-[16px] font-medium text-[#F9FAFB]">
              Today
            </span>
          </div>
        </div>
        
        {/* Timeline events */}
        <div className="relative pl-8">
          {/* Timeline vertical line */}
          <div className="absolute left-[7px] top-0 bottom-0 w-[2px] bg-[#4B5563]"></div>
          
          {timelineEvents.map((event, index) => {
            const eventColor = 
              event.type === 'feeding' ? '#10B981' : 
              event.type === 'sleep' ? '#3B82F6' : 
              event.type === 'diaper' ? '#F59E0B' : '#8B5CF6';
              
            const eventIcon = 
              event.type === 'feeding' ? 'Baby' : 
              event.type === 'sleep' ? 'Moon' : 
              event.type === 'diaper' ? 'Sparkles' : 'Star';
            
            return (
              <div key={event.id} className="mb-6 relative">
                {/* Timeline dot */}
                <div 
                  className="absolute -left-8 top-0 h-4 w-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: eventColor }}
                ></div>
                
                {/* Event card */}
                <div className="rounded-xl bg-[#374151] shadow-sm overflow-hidden">
                  {/* Event header */}
                  <div className="flex justify-between items-center p-3 border-b border-[#4B5563]">
                    <div className="flex items-center gap-2">
                      <Icon name={eventIcon} size={18} color={eventColor} />
                      <span className="text-[15px] font-medium text-[#F9FAFB]">
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </span>
                    </div>
                    <span className="text-[14px] text-[#9CA3AF]">{event.time}</span>
                  </div>
                  
                  {/* Event content */}
                  <div className="p-3">
                    <p className="text-[14px] text-[#D1D5DB]">{event.description}</p>
                  </div>
                  
                  {/* Action button for events that need it */}
                  {(event.type === 'feeding' || event.type === 'diaper') && (
                    <div className="px-3 pb-3">
                      <button 
                        className="text-[14px] font-medium text-[#7C3AED] hover:underline focus:outline-none"
                      >
                        {event.type === 'feeding' ? 'Log Details' : 'View Change'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Audio waveform (only visible when recording) */}
      {(isRecording || initialState === 'recording') && (
        <AudioWaveform 
          isRecording={true} 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 z-20"
        />
      )}

      {/* Completion state with event preview */}
      {showCompletionState && capturedEvent && (
        <div className="absolute bottom-28 left-0 right-0 px-5 flex flex-col items-center">
          <div className="mb-4 flex items-center justify-center w-10 h-10 rounded-full bg-[#059669]/20">
            <Icon name="Check" size={24} color="#059669" className="animate-scaleIn" />
          </div>
          <div className="animate-slideUp">
            <EventPreviewCard
              eventType={capturedEvent.type}
              time={capturedEvent.time}
              description={capturedEvent.description}
              onViewDetails={() => console.log('View details clicked')}
            />
          </div>
          {/* 3-second auto-dismiss countdown indicator */}
          <div className="mt-4 w-24 h-1 bg-[#4B5563] rounded-full overflow-hidden">
            <div className="h-full bg-[#7C3AED] animate-shrink"></div>
          </div>
        </div>
      )}

      {/* Voice capture button - always visible in all states */}
      <div className="w-full flex justify-center pb-10 pt-4 mt-auto z-50">
        <VoiceCaptureButton
          isRecording={isRecording}
          isProcessing={isProcessing}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
        />
      </div>
    </div>
  );
};

export default VoiceCaptureScreen;
