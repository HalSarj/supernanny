"use client";

import { useState, useEffect, useCallback } from 'react';

interface UseAudioWaveformProps {
  isRecording: boolean;
  barCount?: number;
  minHeight?: number;
  maxHeight?: number;
  updateInterval?: number;
}

interface WaveformBar {
  id: number;
  height: number;
}

export const useAudioWaveform = ({
  isRecording,
  barCount = 8,
  minHeight = 20,
  maxHeight = 60,
  updateInterval = 150
}: UseAudioWaveformProps) => {
  const [bars, setBars] = useState<WaveformBar[]>([]);
  
  // Generate initial bars
  useEffect(() => {
    const initialBars = Array.from({ length: barCount }, (_, i) => ({
      id: i,
      height: Math.floor(Math.random() * (maxHeight - minHeight) + minHeight)
    }));
    
    setBars(initialBars);
  }, [barCount, minHeight, maxHeight]);
  
  // Animate bars when recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setBars(prevBars => 
          prevBars.map(bar => ({
            ...bar,
            height: Math.floor(Math.random() * (maxHeight - minHeight) + minHeight)
          }))
        );
      }, updateInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, minHeight, maxHeight, updateInterval]);
  
  return { bars };
};

export default useAudioWaveform;
