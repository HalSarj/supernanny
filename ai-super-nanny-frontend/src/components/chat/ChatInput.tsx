"use client";

import React, { useState, useRef, useEffect } from 'react';
import Icon from '../ui/Icon';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

/**
 * Chat input component with text input functionality
 */
const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as content grows
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  // Handle text input change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Send message and reset input
  const handleSendMessage = () => {
    const trimmedMessage = inputText.trim();
    if (trimmedMessage) {
      onSendMessage(trimmedMessage);
      setInputText('');
      
      // Provide haptic feedback on send
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  };

  return (
    <div className="flex items-end bg-[#4B5563] rounded-full p-1 pl-4 pr-1 border border-gray-700 shadow-md">
      <div className="flex-grow flex items-center">
        <textarea
          ref={inputRef}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="Ask, write or search for anything..."
          className="w-full bg-transparent text-[16px] text-[#F9FAFB] placeholder-[#9CA3AF] resize-none outline-none min-h-[24px] max-h-[120px] py-2"
          rows={1}
        />
        <button 
          className="text-[#9CA3AF] hover:text-[#F9FAFB] p-2 hidden sm:block"
          aria-label="Globe"
        >
          <Icon name="Globe" size={20} />
        </button>
      </div>
      <div className="flex-shrink-0">
        <button
          onClick={handleSendMessage}
          disabled={!inputText.trim()}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-opacity ${inputText.trim() ? 'bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] hover:opacity-90' : 'bg-gray-600 opacity-50'}`}
          aria-label="Send message"
        >
          <Icon name="ArrowRight" size={20} color="#F9FAFB" />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
