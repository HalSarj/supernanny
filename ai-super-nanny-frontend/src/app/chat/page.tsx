"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  ChatHeader, 
  ChatInput, 
  ConversationStarters, 
  MedicalDisclaimer, 
  MessageBubble, 
  TypingIndicator,
  MessageType,
  InfoType,
  Citation
} from '@/components/chat';

// Generate random IDs without uuid dependency
const generateId = () => Math.random().toString(36).substring(2, 15);

// Mock message data type
interface Message {
  id: string;
  type: MessageType;
  text: string;
  infoType?: InfoType;
  citations?: Citation[];
  timestamp: string;
}

// Mock data for initial messages
const INITIAL_MESSAGES: Message[] = [];

// Mock data for citations
const SAMPLE_CITATIONS: Citation[] = [
  {
    id: 'citation-1',
    title: 'American Academy of Pediatrics',
    text: 'The American Academy of Pediatrics recommends exclusive breastfeeding for about 6 months, followed by continued breastfeeding as complementary foods are introduced, with continuation of breastfeeding for 1 year or longer as mutually desired by mother and infant.',
    sourceUrl: 'https://www.aap.org/en-us/advocacy-and-policy/aap-health-initiatives/Breastfeeding/Pages/Benefits-of-Breastfeeding.aspx'
  },
  {
    id: 'citation-2',
    title: 'World Health Organization',
    text: 'WHO recommends mothers worldwide to exclusively breastfeed infants for the child\'s first six months to achieve optimal growth, development and health. Thereafter, they should be given nutritious complementary foods and continue breastfeeding up to the age of two years or beyond.',
    sourceUrl: 'https://www.who.int/health-topics/breastfeeding'
  }
];

export default function ChatPage() {
  // State for messages and UI
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  
  // Reset scroll position on page load
  useEffect(() => {
    // Force scroll to top on component mount
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
      
      // Also reset window scroll position
      window.scrollTo(0, 0);
    }
  }, []);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Format current time for message timestamp
  const getTimestamp = () => {
    return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };
  
  // Handle sending a new message
  const handleSendMessage = (text: string) => {
    // Create new user message
    const newUserMessage: Message = {
      id: `user-${generateId()}`,
      type: 'user',
      text,
      timestamp: getTimestamp()
    };
    
    // Add user message to chat
    setMessages(prev => [...prev, newUserMessage]);
    setShowEmptyState(false);
    
    // Simulate assistant typing
    setIsTyping(true);
    
    // Provide haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    
    // Simulate assistant response after delay
    setTimeout(() => {
      setIsTyping(false);
      
      // Create mock assistant response
      const responseText = getResponseForMessage(text);
      const newAssistantMessage: Message = {
        id: `assistant-${generateId()}`,
        type: 'assistant',
        text: responseText.text,
        infoType: responseText.infoType,
        citations: responseText.citations,
        timestamp: getTimestamp()
      };
      
      // Add assistant message to chat
      setMessages(prev => [...prev, newAssistantMessage]);
      
      // Provide haptic feedback for new message
      if (navigator.vibrate) {
        navigator.vibrate([50, 100, 50]);
      }
    }, 1500 + Math.random() * 1000); // Random delay between 1.5-2.5s
  };
  
  // Handle selecting a conversation starter
  const handleSelectStarter = (question: string) => {
    handleSendMessage(question);
  };
  
  // Get mock response based on user message
  const getResponseForMessage = (message: string): { text: string, infoType: InfoType, citations?: Citation[] } => {
    const messageLower = message.toLowerCase();
    
    // Mock responses based on keywords
    if (messageLower.includes('solid') || messageLower.includes('food')) {
      return {
        text: 'Most babies are ready to start solid foods around 6 months of age. Look for signs of readiness such as sitting up with minimal support, good head control, showing interest in food, and loss of the tongue-thrust reflex.',
        infoType: 'evidence-based',
        citations: [SAMPLE_CITATIONS[0]]
      };
    } else if (messageLower.includes('sleep')) {
      return {
        text: 'At 6 months, babies typically need about 14 hours of sleep per day, including 2-3 naps. Every baby is different though, and I notice your little one seems to sleep better after a consistent bedtime routine.',
        infoType: 'personal-insight'
      };
    } else if (messageLower.includes('milestone') || messageLower.includes('development')) {
      return {
        text: 'By 6 months, most babies can roll over in both directions, sit with support, and begin to recognize their name. They may also start babbling and showing interest in solid foods.',
        infoType: 'evidence-based',
        citations: [SAMPLE_CITATIONS[1]]
      };
    } else if (messageLower.includes('teething')) {
      return {
        text: 'Teething typically begins around 6 months, though some babies start earlier or later. Signs include drooling, irritability, and gum swelling. You can offer a cold teething ring or clean finger to gently massage the gums.',
        infoType: 'evidence-based'
      };
    } else {
      return {
        text: 'I understand you want to know more about this. While I don\'t have specific information on this topic, I can help you track patterns and provide general guidance based on your baby\'s development.',
        infoType: 'general'
      };
    }
  };
  
  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-b from-[#1F2937] to-[#111827] text-white flex flex-col">
      <ChatHeader />
      
      {/* Main scrollable content area with padding at the bottom for the input */}
      <div 
        ref={scrollContainerRef} 
        className="flex-1 overflow-y-auto overscroll-none pb-[88px]"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="max-w-3xl mx-auto pt-2 px-4">
          {/* Medical disclaimer */}
          <MedicalDisclaimer onLearnMore={() => {}} />
          
          {/* Empty state with conversation starters */}
          {showEmptyState && messages.length === 0 && (
            <ConversationStarters onSelectStarter={handleSelectStarter} />
          )}
          
          {/* Message list */}
          <div className="flex flex-col space-y-0">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                type={message.type}
                text={message.text}
                infoType={message.infoType}
                citations={message.citations}
                timestamp={message.timestamp}
              />
            ))}
            
            {/* Typing indicator */}
            {isTyping && <TypingIndicator />}
            
            {/* Invisible element for scrolling to bottom */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
      
      {/* Chat input - fixed position */}
      <div className="fixed bottom-[60px] left-0 right-0 p-4 border-t border-gray-800 bg-[#111827]/90 backdrop-blur-md z-10">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSendMessage={handleSendMessage} />
        </div>
      </div>
    </div>
  );
}
