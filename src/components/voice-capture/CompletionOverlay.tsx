"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useVoiceRecording } from "@/contexts/VoiceRecordingContext";
import { Icon } from "../ui/Icon";

interface CompletionOverlayProps {
  onClose?: () => void;
}

export const CompletionOverlay: React.FC<CompletionOverlayProps> = ({ onClose }) => {
  const router = useRouter();
  const { capturedEvent, resetRecording } = useVoiceRecording();
  
  if (!capturedEvent) return null;
  
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
        <div className="w-16 h-16 rounded-full bg-[#10B981] flex items-center justify-center mb-4 mx-auto">
          <Icon name="Check" size={32} color="#FFFFFF" />
        </div>
        <h2 className="text-2xl font-semibold text-center text-[#F9FAFB] mb-2">
          Event Captured
        </h2>
        <p className="text-[15px] text-center text-[#D1D5DB]">
          Your event has been added to the timeline
        </p>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="w-full max-w-md bg-[#1E293B] rounded-xl p-4 shadow-lg"
      >
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${capturedEvent.type === "feeding" ? "bg-[#10B981]" : capturedEvent.type === "sleep" ? "bg-[#3B82F6]" : capturedEvent.type === "diaper" ? "bg-[#F59E0B]" : "bg-[#7C3AED]"}`}>
              <Icon 
                name={capturedEvent.type === "feeding" ? "Baby" : 
                      capturedEvent.type === "sleep" ? "Moon" : 
                      capturedEvent.type === "diaper" ? "Star" : 
                      "Star"} 
                size={20} 
                color="#FFFFFF" 
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[15px] font-medium text-[#F9FAFB]">
                {capturedEvent.type.charAt(0).toUpperCase() + capturedEvent.type.slice(1)}
              </span>
              <span className="text-[14px] text-[#9CA3AF]">
                {capturedEvent.time}
              </span>
            </div>
            <p className="text-[14px] text-[#D1D5DB]">
              {capturedEvent.description}
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
            // Dispatch a custom event to notify the timeline of the new event
            const newEventAdded = new CustomEvent('newEventAdded');
            window.dispatchEvent(newEventAdded);
            
            // Navigate to timeline with parameter
            router.push('/timeline?newEvent=true');
            
            // Reset recording state
            resetRecording();
            
            // Close the overlay if provided
            if (onClose) onClose();
          }}
          className="w-full py-3 bg-[#7C3AED] rounded-full text-white font-medium hover:bg-[#6D28D9] transition-colors"
        >
          Back to Timeline
        </button>
      </motion.div>
    </motion.div>
  );
};
