"use client";

import React, { useState } from 'react';
import Icon from '../ui/Icon';

interface MedicalDisclaimerProps {
  onLearnMore?: () => void;
}

/**
 * Medical disclaimer banner component
 * Displays important medical information disclaimer with close and learn more options
 */
const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({ 
  onLearnMore 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-[#2563EB]/10 border-l-4 border-[#2563EB] px-4 py-3 mb-4 rounded-r">
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-2">
          <p className="text-[14px] font-regular text-[#F9FAFB]">
            Information provided is not medical advice. Always consult with healthcare professionals for medical concerns.
          </p>
          <button 
            onClick={onLearnMore} 
            className="text-[14px] font-medium text-[#2563EB] hover:underline mt-1"
          >
            Learn more
          </button>
        </div>
        <button 
          onClick={() => setIsVisible(false)} 
          className="flex-shrink-0 text-[#9CA3AF] hover:text-[#F9FAFB] transition-colors"
          aria-label="Close disclaimer"
        >
          <Icon name="X" size={18} />
        </button>
      </div>
    </div>
  );
};

export default MedicalDisclaimer;
