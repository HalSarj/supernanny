"use client";

import React, { useState, useEffect } from 'react';
import Icon from '@/components/ui/Icon';
import Link from 'next/link';
import { format, addDays, subDays, isToday } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';

// Define event type for better type checking
type EventType = 'feeding' | 'sleep' | 'diaper' | 'milestone';

interface TimelineEvent {
  id: string;
  type: EventType;
  time: string;
  description: string;
  fullNarrative?: string;
  relatedPatterns?: string[];
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
    fullNarrative: 'Baby took a full 4oz bottle of formula. Feeding went smoothly with no spitting up. Baby seemed satisfied after feeding and was alert for about 30 minutes before showing signs of tiredness.',
    relatedPatterns: ['Usually feeds 4-5oz every 3-4 hours', 'Often more hungry in the afternoon'],
    hasDetails: true
  },
  { 
    id: '2', 
    type: 'sleep', 
    time: '12:15 PM', 
    description: 'Nap time, slept for 1 hour 20 minutes',
    fullNarrative: 'Baby fell asleep quickly after being put down. Sleep was uninterrupted for the full duration. Woke up calm and happy, showing good signs of being well-rested.',
    relatedPatterns: ['Afternoon naps typically last 1-2 hours', 'Usually needs a feeding after waking up']
  },
  { 
    id: '3', 
    type: 'diaper', 
    time: '11:30 AM', 
    description: 'Wet diaper, changed',
    fullNarrative: 'Regular wet diaper with normal color and amount. No signs of irritation or discomfort. Applied diaper cream preventatively.',
    relatedPatterns: ['Typically has 6-8 wet diapers daily', 'Usually needs changing before nap time'],
    hasDetails: true
  }
];

export default function Timeline() {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]); 
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  
  // Reset new event highlight after 2 seconds
  useEffect(() => {
    if (showNewEvent) {
      const timer = setTimeout(() => {
        setShowNewEvent(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [showNewEvent]);
  
  useEffect(() => {
    // Load events from localStorage if available, otherwise use default events
    const loadEvents = () => {
      try {
        const storedEvents = localStorage.getItem('timelineEvents');
        if (storedEvents) {
          const parsedEvents = JSON.parse(storedEvents);
          // Combine stored events with default events, avoiding duplicates by ID
          const combinedEvents = [...parsedEvents, ...defaultTimelineEvents];
          const uniqueEvents = combinedEvents.filter((event, index, self) => 
            index === self.findIndex(e => e.id === event.id)
          );
          setTimelineEvents(uniqueEvents);
        } else {
          setTimelineEvents(defaultTimelineEvents);
        }
      } catch (error) {
        console.error('Failed to load events from localStorage:', error);
        setTimelineEvents(defaultTimelineEvents);
      }
    };
    
    // Load events initially
    loadEvents();
    
    // Check if there's a new event parameter in the URL
    const checkForNewEvent = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const hasNewEvent = urlParams.get('newEvent') === 'true';
      
      if (hasNewEvent) {
        // Check if there are any new events in localStorage
        try {
          const storedEvents = localStorage.getItem('timelineEvents');
          if (storedEvents) {
            const parsedEvents = JSON.parse(storedEvents);
            // Get the most recent event (last one added)
            const latestEvent = parsedEvents[parsedEvents.length - 1];
            if (latestEvent) {
              // Mark it as new for animation
              latestEvent.isNew = true;
              
              // Add the new event to the top of the timeline with animation
              setTimelineEvents(prevEvents => {
                // Avoid duplicates
                const filteredEvents = prevEvents.filter(e => e.id !== latestEvent.id);
                return [latestEvent, ...filteredEvents];
              });
              setShowNewEvent(true);
            }
          }
        } catch (error) {
          console.error('Failed to get latest event from localStorage:', error);
        }
        
        // Clean up the URL parameter without causing a page reload
        window.history.replaceState({}, '', '/timeline');
      }
    };
    
    // Check immediately on mount
    checkForNewEvent();
    
    // Set up a listener for URL changes
    const handleUrlChange = () => {
      checkForNewEvent();
    };
    
    // Set up a listener for custom events from the voice capture completion
    const handleNewEventAdded = () => {
      // Reload events from localStorage immediately
      try {
        const storedEvents = localStorage.getItem('timelineEvents');
        if (storedEvents) {
          const parsedEvents = JSON.parse(storedEvents);
          // Get the most recent event (last one added)
          const latestEvent = parsedEvents[parsedEvents.length - 1];
          if (latestEvent) {
            // Mark it as new for animation
            latestEvent.isNew = true;
            
            // Add the new event to the top of the timeline with animation
            setTimelineEvents(prevEvents => {
              // Avoid duplicates
              const filteredEvents = prevEvents.filter(e => e.id !== latestEvent.id);
              return [latestEvent, ...filteredEvents];
            });
            setShowNewEvent(true);
          }
        }
      } catch (error) {
        console.error('Failed to get latest event from localStorage:', error);
      }
    };
    
    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('newEventAdded', handleNewEventAdded);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('newEventAdded', handleNewEventAdded);
    };
  }, []);
  // Mock statistics data for demonstration
  const statistics = {
    sleep: {
      count: 4,
      change: 1,
      icon: "Moon" as const,
      color: "#3B82F6", // Calm Blue
      label: "Sleeps"
    },
    feeding: {
      count: 6,
      change: -1,
      icon: "Baby" as const, // Using Baby icon instead of Milk which isn't in Lucide
      color: "#10B981", // Gentle Mint
      label: "Feeds"
    },
    diaper: {
      count: 8,
      change: 2,
      icon: "Star" as const, // Using Star icon instead of Sparkles which isn't in Lucide
      color: "#F59E0B", // Warm Amber
      label: "Diapers"
    }
  };

  // Handle date navigation
  const goToPreviousDay = () => {
    setSelectedDate(prevDate => subDays(prevDate, 1));
  };

  const goToNextDay = () => {
    // Only allow navigation to future dates if the current selected date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDateCopy = new Date(selectedDate);
    selectedDateCopy.setHours(0, 0, 0, 0);
    
    if (selectedDateCopy < today) {
      const nextDate = addDays(selectedDate, 1);
      // Ensure we don't go beyond today
      if (nextDate <= today) {
        setSelectedDate(nextDate);
      } else {
        setSelectedDate(today);
      }
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };
  
  // Check if the selected date is today
  const isSelectedDateToday = () => {
    const today = new Date();
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="min-h-screen bg-[#1e293b] text-white p-4">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Icon name="Baby" size={24} color="#a855f7" />
          <h1 className="text-xl font-semibold">AI Super-Nanny</h1>
        </div>
      </header>
      
      {/* Date Navigation */}
      <div className="px-5 flex items-center justify-between mb-8">
        <button 
          onClick={goToPreviousDay}
          className="text-[#9CA3AF] p-2"
          aria-label="Previous day"
        >
          <Icon name="ChevronLeft" size={24} />
        </button>
        
        <div className="flex items-center gap-3">
          <h2 className="text-[20px] font-semibold text-[#F8FAFC]">
            {isSelectedDateToday() ? 'Today' : format(selectedDate, 'MMMM d')}
          </h2>
          
          {/* Today Button - now beside the date */}
          {!isSelectedDateToday() && (
            <button 
              onClick={goToToday}
              className="px-3 py-1 rounded-full border border-[#7C3AED] text-[13px] font-medium text-[#7C3AED]"
            >
              Today
            </button>
          )}
        </div>
        
        <button 
          onClick={goToNextDay}
          className={`p-2 ${isSelectedDateToday() ? 'text-[#4B5563] cursor-not-allowed' : 'text-[#9CA3AF]'}`}
          aria-label="Next day"
          disabled={isSelectedDateToday()}
        >
          <Icon name="ChevronRight" size={24} />
        </button>
      </div>
      
      {/* Summary Statistics - Responsive */}
      <div className="flex flex-row justify-between gap-2 mb-8 mt-4 px-2">
        {Object.entries(statistics).map(([key, stat]) => (
          <div 
            key={key} 
            className="rounded-full py-1.5 px-3 flex items-center justify-between flex-1"
            style={{ backgroundColor: stat.color }}
          >
            <div className="flex items-center gap-1.5">
              <Icon name={stat.icon} size={20} color="white" strokeWidth={1.5} />
              <div className="flex flex-col">
                <span className="text-[14px] font-semibold text-white">{stat.label}</span>
                <div className="flex items-center">
                  <span className="text-[18px] font-bold text-white mr-1">{stat.count}</span>
                  {stat.change > 0 ? (
                    <div className="flex items-center text-[#10FFB0]">
                      <Icon name="TrendingUp" size={10} color="#10FFB0" />
                      <span className="text-[10px] font-medium">+{stat.change}</span>
                    </div>
                  ) : stat.change < 0 ? (
                    <div className="flex items-center text-[#FF4444]">
                      <Icon name="TrendingDown" size={10} color="#FF4444" />
                      <span className="text-[10px] font-medium">{stat.change}</span>
                    </div>
                  ) : (
                    <span className="text-white text-[10px] font-medium">±0</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <h2 className="text-lg font-medium mb-4">
        {isSelectedDateToday() ? "Today's Events" : format(selectedDate, "MMMM d's Events")}
      </h2>
      
      <div className="relative">
        {/* Today label */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-4 w-4 rounded-full bg-[#a855f7]"></div>
          <span className="text-[15px]">Today</span>
        </div>
        
        {/* Timeline line */}
        <div className="absolute left-2 top-4 bottom-0 w-0.5 bg-gradient-to-b from-[#a855f7] to-transparent"></div>
        
        {/* No overlay for focus */}
        
        {/* Timeline events */}
        <div className="ml-8 relative z-20">
          <AnimatePresence initial={false} mode="popLayout">
            {timelineEvents.map((event) => {
            const eventColor = 
              event.type === 'feeding' ? '#10B981' : 
              event.type === 'sleep' ? '#3B82F6' : 
              event.type === 'diaper' ? '#F59E0B' : '#8B5CF6';
              
            const eventIcon = 
              event.type === 'feeding' ? 'Baby' : 
              event.type === 'sleep' ? 'Moon' : 
              event.type === 'diaper' ? 'Star' : 'Star';
            
            const isExpanded = expandedCardId === event.id;
            
            return (
              <motion.div 
                key={event.id} 
                className="mb-4 relative"
                initial={event.isNew ? { opacity: 0, y: -20, scale: 0.95 } : false}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 500, 
                  damping: 30,
                  opacity: { duration: 0.2 }
                }}
                layout
              >
                {/* Timeline dot */}
                <div 
                  className="absolute -left-8 top-0 h-4 w-4 rounded-full"
                  style={{ backgroundColor: eventColor }}
                ></div>
                
                {/* Event card with expandable content */}
                <motion.div 
                  className={`rounded-2xl shadow-sm overflow-hidden relative z-20 ${event.isNew && showNewEvent ? 'ring-2 ring-[#7C3AED] shadow-md shadow-[#7C3AED]/20' : ''}`}
                  style={{ 
                    borderLeft: `3px solid ${eventColor}`,
                    backgroundColor: isExpanded ? '#3F4A5F' : '#374151', // Lighten by 5% when expanded
                    transition: 'background-color 300ms ease-out'
                  }}
                  layout
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  onClick={() => {
                    if (!isExpanded && event.fullNarrative) {
                      setExpandedCardId(event.id);
                    }
                  }}
                >
                  <div className="p-4">
                    {/* Event header with time */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <Icon name={eventIcon} size={28} color={eventColor} />
                        </div>
                        <div>
                          <h3 className="text-[16px] font-semibold text-white">
                            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                          </h3>
                          <p className="text-[15px] text-[#D1D5DB]">{event.description}</p>
                        </div>
                      </div>
                      <span className="text-[14px] font-medium text-[#9CA3AF]">{event.time}</span>
                    </div>
                    
                    {/* Expanded content */}
                    <AnimatePresence>
                      {isExpanded && event.fullNarrative && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                        >
                          {/* Full narrative */}
                          <div className="mt-3 mb-4">
                            <p className="text-[15px] text-[#D1D5DB] leading-relaxed">
                              {event.fullNarrative}
                            </p>
                          </div>
                          
                          {/* Related patterns - simplified */}
                          {event.relatedPatterns && event.relatedPatterns.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-[14px] font-medium text-[#9CA3AF] mb-2">Related Patterns</h4>
                              <div className="space-y-1">
                                {event.relatedPatterns.map((pattern, index) => (
                                  <div 
                                    key={index} 
                                    className="text-[14px] py-1 px-2 text-[#D1D5DB]"
                                  >
                                    {pattern}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Close button */}
                          <div className="flex justify-end mt-2">
                            <button 
                              className="flex items-center text-[14px] font-medium text-[#9CA3AF] hover:text-[#D1D5DB] focus:outline-none"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedCardId(null);
                              }}
                            >
                              <span className="mr-1">Close</span>
                              <Icon name="ChevronUp" size={16} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Expandable indicator - only show if not expanded and has details */}
                    {!isExpanded && event.fullNarrative && (
                      <div className="flex justify-end mt-2">
                        <button 
                          className="flex items-center text-[14px] font-medium text-[#9CA3AF] hover:text-[#D1D5DB] focus:outline-none"
                          onClick={() => {
                            setExpandedCardId(event.id);
                          }}
                        >
                          <span className="mr-1">Details</span>
                          <Icon name="ChevronDown" size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
