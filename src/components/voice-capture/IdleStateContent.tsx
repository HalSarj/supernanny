"use client";

import React from "react";
import { Icon } from "../ui/Icon";

export const IdleStateContent: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center">
      <div className="mb-6">
        <div className="w-16 h-16 rounded-full bg-[#1E293B] flex items-center justify-center mb-4">
          <Icon name="Mic" size={28} color="#F9FAFB" />
        </div>
        <h2 className="text-xl font-semibold text-[#F9FAFB] mb-2">
          Voice Capture
        </h2>
        <p className="text-[15px] text-[#D1D5DB] mb-6">
          Record your baby's activities and we'll add them to the timeline
        </p>
      </div>
      
      <div className="w-full bg-[#1E293B] rounded-xl p-4 mb-6">
        <div className="flex items-center mb-3">
          <Icon name="Lightbulb" size={18} color="#9CA3AF" className="mr-2" />
          <span className="text-[15px] font-medium text-[#F9FAFB]">
            Tips for best results
          </span>
        </div>
        <ul className="text-[14px] text-[#D1D5DB] space-y-2">
          <li className="flex items-start">
            <span className="inline-block w-1 h-1 rounded-full bg-[#9CA3AF] mt-2 mr-2"></span>
            Speak clearly and include key details
          </li>
          <li className="flex items-start">
            <span className="inline-block w-1 h-1 rounded-full bg-[#9CA3AF] mt-2 mr-2"></span>
            Mention the type of activity (feeding, sleep, etc.)
          </li>
          <li className="flex items-start">
            <span className="inline-block w-1 h-1 rounded-full bg-[#9CA3AF] mt-2 mr-2"></span>
            Include time if it's not happening right now
          </li>
        </ul>
      </div>
    </div>
  );
};
