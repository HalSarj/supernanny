"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from '../ui/Icon';
import type { IconName } from '../ui/Icon';
import { VoiceRecordingProvider } from '@/contexts/VoiceRecordingContext';
import { VoiceCaptureOverlay } from '../voice-capture';

interface NavItem {
  name: string;
  href: string;
  icon: IconName;
}

// Define left and right side nav items for better organization
const leftNavItems: NavItem[] = [
  {
    name: 'Timeline',
    href: '/timeline',
    icon: 'LayoutList',
  },
  {
    name: 'Stats',
    href: '/stats',
    icon: 'BarChart2',
  },
];

const rightNavItems: NavItem[] = [
  {
    name: 'Chat',
    href: '/chat',
    icon: 'MessageSquare',
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: 'User',
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="grid grid-cols-5 items-center h-16 px-4">
        {/* Timeline */}
        <div className="flex justify-center">
          <NavItem 
            key={leftNavItems[0].name}
            name={leftNavItems[0].name} 
            href={leftNavItems[0].href} 
            icon={leftNavItems[0].icon} 
            isActive={pathname === leftNavItems[0].href || (leftNavItems[0].href !== '/' && pathname.startsWith(leftNavItems[0].href))}
          />
        </div>
        
        {/* Stats */}
        <div className="flex justify-center">
          <NavItem 
            key={leftNavItems[1].name}
            name={leftNavItems[1].name} 
            href={leftNavItems[1].href} 
            icon={leftNavItems[1].icon} 
            isActive={pathname === leftNavItems[1].href || (leftNavItems[1].href !== '/' && pathname.startsWith(leftNavItems[1].href))}
          />
        </div>
        
        {/* Voice capture button */}
        <div className="flex justify-center">
          <VoiceCaptureButtonWrapper />
        </div>
        
        {/* Chat */}
        <div className="flex justify-center">
          <NavItem 
            key={rightNavItems[0].name}
            name={rightNavItems[0].name} 
            href={rightNavItems[0].href} 
            icon={rightNavItems[0].icon} 
            isActive={pathname === rightNavItems[0].href || (rightNavItems[0].href !== '/' && pathname.startsWith(rightNavItems[0].href))}
          />
        </div>
        
        {/* Profile */}
        <div className="flex justify-center">
          <NavItem 
            key={rightNavItems[1].name}
            name={rightNavItems[1].name} 
            href={rightNavItems[1].href} 
            icon={rightNavItems[1].icon} 
            isActive={pathname === rightNavItems[1].href || (rightNavItems[1].href !== '/' && pathname.startsWith(rightNavItems[1].href))}
          />
        </div>
      </div>
    </nav>
  );
}

function NavItem({ name, href, icon, isActive }: { name: string; href: string; icon: IconName; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center w-full h-full ${
        isActive 
          ? 'text-purple-600 dark:text-purple-400' 
          : 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
      }`}
    >
      <Icon 
        name={icon} 
        size={24} 
        className={isActive ? 'animate-pulse' : ''}
      />
      <span className="text-xs mt-1">{name}</span>
    </Link>
  );
}

function VoiceCaptureButtonWrapper() {
  const [isOverlayOpen, setIsOverlayOpen] = React.useState(false);
  
  const handleOpenOverlay = () => {
    // Simulate haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    setIsOverlayOpen(true);
  };

  const handleCloseOverlay = () => {
    setIsOverlayOpen(false);
  };
  
  return (
    <>
      <div className="-mt-5">
        <button
          onClick={handleOpenOverlay}
          className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-[#7C3AED] to-[#8B5CF6] rounded-full shadow-lg shadow-[#7C3AED]/20 hover:bg-purple-700 transition-colors animate-pulse"
        >
          <Icon name="Mic" size={24} color="white" />
        </button>
      </div>
      
      {isOverlayOpen && (
        <VoiceRecordingProvider initialState="recording">
          <VoiceCaptureOverlay onClose={handleCloseOverlay} />
        </VoiceRecordingProvider>
      )}
    </>
  );
}
