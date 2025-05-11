"use client";

import React from "react";
import { motion } from "framer-motion";
import { Icon } from "../ui/Icon";
import { useVoiceRecording } from "@/contexts/VoiceRecordingContext";

interface ProcessingErrorDisplayProps {
  onClose?: () => void;
}

export const ProcessingErrorDisplay: React.FC<ProcessingErrorDisplayProps> = ({ onClose }) => {
  const { processingError, resetRecordingState } = useVoiceRecording();
  
  if (!processingError) return null;
  
  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#0F172A] to-[#1E293B] z-40 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="mb-6"
      >
        <div className="w-16 h-16 rounded-full bg-[#F04438] flex items-center justify-center mb-4 mx-auto">
          <Icon name="AlertTriangle" size={32} color="#FFFFFF" />
        </div>
        <h2 className="text-2xl font-semibold text-center text-[#F9FAFB] mb-2">
          Processing Error
        </h2>
        <p className="text-[15px] text-center text-[#D1D5DB]">
          There was a problem processing your recording
        </p>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="w-full max-w-md bg-[#1E293B] rounded-xl p-4 shadow-lg mb-6"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F04438]/20">
              <Icon 
                name="XCircle"
                size={20} 
                color="#F04438" 
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[15px] font-medium text-[#F9FAFB]">
                Error Details
              </span>
            </div>
            <p className="text-[14px] text-[#D1D5DB]">
              {processingError}
            </p>
          </div>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        className="fixed bottom-10 w-full max-w-md"
      >
        <button
          onClick={() => {
            resetRecordingState();
            if (onClose) onClose();
          }}
          className="w-full py-3 bg-[#7C3AED] rounded-full text-white font-medium hover:bg-[#6D28D9] transition-colors"
        >
          Try Again
        </button>
      </motion.div>
    </motion.div>
  );
};
