"use client";

import React from 'react';
import { Icon } from '../ui/Icon';
import { cn } from '@/utils/cn';

export type EventType = 'feeding' | 'sleep' | 'diaper' | 'milestone';

interface EventPreviewCardProps {
  eventType: EventType;
  time: string;
  description: string;
  onViewDetails: () => void;
  className?: string;
}

const EventPreviewCard: React.FC<EventPreviewCardProps> = ({
  eventType,
  time,
  description,
  onViewDetails,
  className,
}) => {
  // Event type configuration
  const eventConfig = {
    feeding: {
      icon: 'Baby',
      color: '#10B981', // Gentle Mint
      bgColor: 'bg-[#10B981]/10',
      borderColor: 'border-[#10B981]'
    },
    sleep: {
      icon: 'Moon',
      color: '#3B82F6', // Calm Blue
      bgColor: 'bg-[#3B82F6]/10',
      borderColor: 'border-[#3B82F6]'
    },
    diaper: {
      icon: 'Sparkles',
      color: '#F59E0B', // Warm Amber
      bgColor: 'bg-[#F59E0B]/10',
      borderColor: 'border-[#F59E0B]'
    },
    milestone: {
      icon: 'Star',
      color: '#8B5CF6', // Soft Violet
      bgColor: 'bg-[#8B5CF6]/10',
      borderColor: 'border-[#8B5CF6]'
    }
  };

  const config = eventConfig[eventType];

  return (
    <div 
      className={cn(
        "w-full max-w-sm rounded-2xl p-4",
        "bg-[#374151] border",
        config.borderColor,
        "shadow-sm shadow-white/5",
        "transform transition-all duration-300 ease-out",
        "animate-slideUp",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={cn("flex items-center gap-2")}>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            config.bgColor
          )}>
            <Icon 
              name={config.icon as any} 
              size={20} 
              color={config.color} 
              strokeWidth={2} 
            />
          </div>
          <span className="font-medium text-[16px] text-[#F9FAFB]">
            {eventType.charAt(0).toUpperCase() + eventType.slice(1)}
          </span>
        </div>
        <span className="text-[14px] text-[#D1D5DB]">{time}</span>
      </div>
      
      <p className="text-[15px] text-[#D1D5DB] mb-3 line-clamp-2">
        {description}
      </p>
      
      <button
        onClick={onViewDetails}
        className="text-[16px] font-medium text-[#7C3AED] hover:underline focus:outline-none"
      >
        View Details
      </button>
    </div>
  );
};

export default EventPreviewCard;
