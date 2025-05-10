"use client";

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the DesignShowcase component with SSR disabled
const DesignShowcase = dynamic(
  () => import('./DesignShowcase'),
  { ssr: false }
);

// Loading component to show while the DesignShowcase is loading
function LoadingDesignShowcase() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#1F2937]">
      <div className="w-12 h-12 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-lg font-medium text-gray-700">Loading design showcase...</p>
    </div>
  );
}

export default function DesignShowcaseWrapper() {
  return (
    <Suspense fallback={<LoadingDesignShowcase />}>
      <DesignShowcase />
    </Suspense>
  );
}
