"use client";

import React from 'react';

interface ConversationStartersProps {
  onSelectStarter: (question: string) => void;
}

/**
 * Conversation starters component for empty chat state
 * Displays pill-shaped buttons with common questions
 */
const ConversationStarters: React.FC<ConversationStartersProps> = ({
  onSelectStarter
}) => {
  // Common questions that parents might ask
  const starterQuestions = [
    "When should my baby start solid foods?",
    "Is my baby getting enough sleep?",
    "What milestones should I expect at 6 months?",
    "How to soothe a teething baby?"
  ];

  return (
    <div className="flex flex-col items-center justify-center space-y-3 w-full max-w-md mx-auto mt-8">
      <h2 className="text-[16px] font-medium text-[#F9FAFB] mb-2">
        What would you like to know?
      </h2>
      <div className="flex flex-col w-full space-y-3">
        {starterQuestions.map((question, index) => (
          <button
            key={index}
            onClick={() => onSelectStarter(question)}
            className="py-3 px-4 rounded-full border border-[#7C3AED]/60 bg-transparent hover:bg-[#7C3AED]/5 transition-colors text-[14px] font-medium text-[#F9FAFB] text-left"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ConversationStarters;
