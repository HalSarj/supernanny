"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import BottomNavigation from '../components/navigation/BottomNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  
  // Check if the current path is a design showcase or example path
  const isDesignShowcase = pathname.includes('/design-showcase');
  const isExample = pathname.includes('/examples');
  
  // Only show navigation on app screens
  const showNavigation = !isDesignShowcase && !isExample;
  
  return (
    <>
      <main className={showNavigation ? 'pb-16' : ''}>
        {children}
      </main>
      {showNavigation && <BottomNavigation />}
    </>
  );
}
