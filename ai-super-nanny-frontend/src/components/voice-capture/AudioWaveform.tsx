"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';

interface AudioWaveformProps {
  isRecording: boolean;
  className?: string;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ isRecording, className }) => {
  const [waveformHeights, setWaveformHeights] = useState<string[]>(
    Array(8).fill('15%')
  );
  
  // Only run animations when recording and on the client side
  useEffect(() => {
    if (!isRecording) {
      setWaveformHeights(Array(8).fill('15%'));
      return;
    }
    
    const interval = setInterval(() => {
      setWaveformHeights(
        Array(8).fill(0).map(() => `${15 + Math.random() * 70}%`)
      );
    }, 100);
    
    return () => clearInterval(interval);
  }, [isRecording]);

  // Only show when recording
  if (!isRecording) return null;

  return (
    <div className={cn(
      "flex items-end justify-center gap-2 h-24 w-48",
      "z-20",
      "animate-fadeIn",
      className
    )}>
      {waveformHeights.map((height, index) => (
        <div
          key={index}
          className="waveform-bar w-2 bg-[#7C3AED] rounded-full transition-all duration-100 ease-out"
          style={{ 
            height,
            opacity: 0.6 + (parseInt(height) / 100) * 0.4
          }}
        />
      ))}
    </div>
  );
};

export default AudioWaveform;
