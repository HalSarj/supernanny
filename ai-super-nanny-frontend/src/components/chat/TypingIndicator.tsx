"use client";

import React from 'react';

/**
 * Typing indicator component that shows when the assistant is generating a response
 */
const TypingIndicator: React.FC = () => {
  return (
    <div className="max-w-[85%] px-4 py-3 mb-3 mr-auto bg-[#374151] rounded-2xl rounded-bl-sm">
      <div className="flex space-x-2">
        <div className="w-2 h-2 rounded-full bg-[#9CA3AF] animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-[#9CA3AF] animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-[#9CA3AF] animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};

export default TypingIndicator;
