"use client";

import React from 'react';
import Icon from '../ui/Icon';

interface ChatHeaderProps {
  title?: string;
}

/**
 * Header component for the chat interface
 * Displays the title and any additional controls
 */
const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  title = "Baby Assistant" 
}) => {
  return (
    <header className="flex justify-center items-center py-4 px-4 border-b border-gray-800">
      <h1 className="text-[18px] font-semibold text-[#F9FAFB]">{title}</h1>
    </header>
  );
};

export default ChatHeader;
