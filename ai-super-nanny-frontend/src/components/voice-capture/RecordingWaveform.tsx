"use client";

import React from "react";
import { motion } from "framer-motion";

export const RecordingWaveform: React.FC = () => {
  // Create an array of random heights for initial render
  const initialHeights = React.useMemo(() => {
    return Array.from({ length: 40 }, () => Math.floor(Math.random() * 80) + 10);
  }, []);

  return (
    <div className="w-full max-w-[300px] h-[160px] mb-8">
      <div className="flex items-end justify-center gap-[3px] h-full w-full">
        {initialHeights.map((initialHeight, i) => {
          // Create a unique animation pattern for each bar
          const minHeight = 10;
          const maxHeight = 90;
          const randomHeight1 = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
          const randomHeight2 = Math.floor(Math.random() * (maxHeight - minHeight)) + minHeight;
          
          return (
            <motion.div
              key={i}
              className="w-[4px] bg-[#7C3AED] rounded-full"
              initial={{ height: `${initialHeight}%` }}
              animate={{ 
                height: [
                  `${initialHeight}%`, 
                  `${randomHeight1}%`, 
                  `${randomHeight2}%`,
                  `${initialHeight}%`
                ],
              }}
              transition={{ 
                duration: 1.2 + (i % 5) * 0.1, // Slightly different duration for each bar
                repeat: Infinity, 
                repeatType: "loop",
                ease: "easeInOut",
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
