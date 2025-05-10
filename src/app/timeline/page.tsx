"use client";

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import Link from 'next/link';

// Define event type for better type checking
type EventType = 'feeding' | 'sleep' | 'diaper' | 'milestone';

interface TimelineEvent {
  id: string;
  type: EventType;
  time: string;
  description: string;
  hasDetails?: boolean;
  isNew?: boolean;
}

// Mock recent events data
const defaultTimelineEvents: TimelineEvent[] = [
  { 
    id: '1', 
    type: 'feeding', 
    time: '2:30 PM', 
    description: 'Bottle feeding, 4oz formula',
    hasDetails: true
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
    description: 'Wet diaper, changed',
    hasDetails: true
  }
];

export default function Timeline() {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]); 
  const [showNewEvent, setShowNewEvent] = useState(false);
  
  // Stop the animation after 600ms
  useEffect(() => {
    if (showNewEvent) {
      const timer = setTimeout(() => {
        setShowNewEvent(false);
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [showNewEvent]);
  
  useEffect(() => {
    // Initialize with default events
    setTimelineEvents(defaultTimelineEvents);
    
    // Check if there's a new event parameter in the URL
    const checkForNewEvent = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hasNewEvent = urlParams.get('newEvent') === 'true';
      
      if (hasNewEvent) {
        // Create a new event to add to the timeline
        const newEvent: TimelineEvent = {
          id: `event-${Date.now()}`,
          type: 'feeding',
          time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          description: 'Bottle feeding, 5oz formula, baby seemed hungry',
          hasDetails: true,
          isNew: true // Mark this as a new event
        };
        
        // Add the new event to the top of the timeline
        setTimelineEvents(prevEvents => [newEvent, ...prevEvents]);
        setShowNewEvent(true);
        
        // Clean up the URL parameter without causing a page reload
        window.history.replaceState({}, '', '/timeline');
      }
    };
    
    // Check immediately on mount
    checkForNewEvent();
    
    // Also set up a listener for URL changes
    const handleUrlChange = () => {
      checkForNewEvent();
    };
    
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);
  return (
    <div className="min-h-screen bg-[#1e293b] text-white p-4">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Icon name="Baby" size={24} color="#a855f7" />
          <h1 className="text-xl font-semibold">AI Super-Nanny</h1>
        </div>
      </header>
      
      <h2 className="text-lg font-medium mb-4">Today's Events</h2>
      
      <div className="relative">
        {/* Today label */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-4 rounded-full bg-[#a855f7]"></div>
          <span className="text-[15px]">Today</span>
        </div>
        
        {/* Timeline line */}
        <div className="absolute left-2 top-4 bottom-0 w-0.5 bg-gradient-to-b from-[#a855f7] to-transparent"></div>
        
        {/* Timeline events */}
        <div className="ml-8">
          {timelineEvents.map((event) => {
            const eventColor = 
              event.type === 'feeding' ? '#10B981' : 
              event.type === 'sleep' ? '#3B82F6' : 
              event.type === 'diaper' ? '#F59E0B' : '#8B5CF6';
              
            const eventIcon = 
              event.type === 'feeding' ? 'Baby' : 
              event.type === 'sleep' ? 'Moon' : 
              event.type === 'diaper' ? 'Sparkles' : 'Star';
            
            return (
              <div 
                key={event.id} 
                className={`mb-6 relative ${event.isNew && showNewEvent ? 'animate-pulse' : ''}`}
              >
                {/* Timeline dot */}
                <div 
                  className="absolute -left-8 top-0 h-4 w-4 rounded-full"
                  style={{ backgroundColor: eventColor }}
                ></div>
                
                {/* Event card */}
                <div className={`rounded-xl bg-[#374151] shadow-sm overflow-hidden ${event.isNew && showNewEvent ? 'ring-2 ring-[#7C3AED] shadow-md shadow-[#7C3AED]/20' : ''}`}>
                  {/* Event header */}
                  <div className="flex justify-between items-center p-3 border-b border-[#4B5563]">
                    <div className="flex items-center gap-2">
                      <Icon name={eventIcon} size={18} color={eventColor} />
                      <span className="text-[15px] font-medium">
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </span>
                    </div>
                    <span className="text-[14px] text-[#9CA3AF]">{event.time}</span>
                  </div>
                  
                  {/* Event content */}
                  <div className="p-3">
                    <p className="text-[14px] text-[#D1D5DB]">{event.description}</p>
                  </div>
                  
                  {/* Action button for events that have details */}
                  {event.hasDetails && (
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
    </div>
  );
}
