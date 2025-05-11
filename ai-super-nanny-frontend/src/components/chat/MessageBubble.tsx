"use client";

import React, { useState } from 'react';
import Icon from '../ui/Icon';
import { AnimatePresence, motion } from 'framer-motion';

export type MessageType = 'user' | 'assistant';
export type InfoType = 'evidence-based' | 'personal-insight' | 'general';

export interface Citation {
  id: string;
  title: string;
  text: string;
  sourceUrl?: string;
}

export interface MessageProps {
  type: MessageType;
  text: string;
  infoType?: InfoType;
  citations?: Citation[];
  timestamp?: string;
}

/**
 * Message bubble component for chat messages
 * Handles different message types, styling, and citation expansion
 */
const MessageBubble: React.FC<MessageProps> = ({
  type,
  text,
  infoType = 'general',
  citations = [],
  timestamp
}) => {
  const [expandedCitationId, setExpandedCitationId] = useState<string | null>(null);

  // Determine styling based on message type
  const bubbleStyle = type === 'user'
    ? 'ml-auto mr-0 bg-gradient-to-br from-[#7C3AED]/20 to-[#8B5CF6]/20 rounded-2xl rounded-br-sm shadow-sm max-w-[85%]'
    : 'mr-auto ml-0 bg-[#374151] rounded-2xl rounded-bl-sm shadow-sm max-w-[80%]';

  // Add left border for evidence-based or personal insight messages
  const infoBorder = type === 'assistant' && infoType !== 'general'
    ? infoType === 'evidence-based'
      ? 'border-l-[3px] border-[#059669]' // Success Teal for evidence-based
      : 'border-l-[3px] border-[#8B5CF6]' // Soft Violet for personal insights
    : '';

  // Toggle citation expansion
  const toggleCitation = (citationId: string) => {
    setExpandedCitationId(prevId => prevId === citationId ? null : citationId);
  };

  return (
    <div className={`flex items-start mb-4 ${type === 'user' ? 'justify-end pr-0' : 'pl-0'}`}>
      {/* Assistant avatar */}
      {type === 'assistant' && (
        <div className="flex-shrink-0 mr-3 mt-1 ml-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] flex items-center justify-center shadow-md">
            <Icon name="WandSparkles" size={16} color="#FFFFFF" />
          </div>
        </div>
      )}
      
      <motion.div 
        className={`px-4 py-2.5 ${bubbleStyle} ${infoBorder}`}
        layout
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {/* Evidence-based label */}
        {type === 'assistant' && infoType === 'evidence-based' && (
          <div className="mb-1">
            <span className="inline-block bg-[#059669]/20 text-[#10B981] text-[12px] font-medium px-2 py-0.5 rounded-full">
              Evidence-based
            </span>
          </div>
        )}

        {/* Message text */}
        <p className="text-[16px] leading-tight text-[#F9FAFB]">{text}</p>

        {/* Citations */}
        {citations.length > 0 && (
          <div className="mt-3">
            {citations.map((citation, index) => {
              const isExpanded = expandedCitationId === citation.id;
              
              return (
                <motion.div 
                  key={citation.id}
                  layout
                  className={`overflow-hidden rounded-lg ${isExpanded ? 'bg-[#3F4A5F]' : 'bg-[#2D3748]'} mb-2`}
                  style={{ transition: 'background-color 300ms ease-out' }}
                  initial={false}
                >
                  {/* Citation toggle button */}
                  <button
                    onClick={() => toggleCitation(citation.id)}
                    className="flex items-center text-[#3B82F6] hover:text-[#60A5FA] text-[13px] font-medium w-full py-2 px-3"
                  >
                    <Icon 
                      name="BookOpen" 
                      size={14} 
                      className="mr-1 flex-shrink-0" 
                    />
                    <span className="mr-2">[{index + 1}]</span>
                    <span className="font-semibold">{citation.title}</span>
                    <Icon 
                      name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                      size={16} 
                      className="ml-auto transition-transform duration-300" 
                    />
                  </button>
                  
                  {/* Expanded citation content */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                          duration: 0.4
                        }}
                        className="px-3 pb-3"
                      >
                        <p className="text-[14px] text-[#D1D5DB] mb-3 leading-relaxed">
                          {citation.text}
                        </p>
                        
                        {citation.sourceUrl && (
                          <a 
                            href={citation.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-[#3B82F6] hover:text-[#60A5FA] text-[13px] font-medium"
                          >
                            <Icon name="ExternalLink" size={14} className="mr-1" />
                            View Source
                          </a>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <div className="mt-1 text-right">
            <span className="text-[11px] text-[#9CA3AF]">{timestamp}</span>
          </div>
        )}
      </motion.div>
      
      {/* No user avatar placeholder - allow messages to align with right edge */}
    </div>
  );
};

export default MessageBubble;
