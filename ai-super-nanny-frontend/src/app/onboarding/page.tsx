'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers';
import UserOnboarding from '../../components/auth/UserOnboarding';

export default function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!isLoading && !user) {
      router.push('/auth/login');
    }
    
    // If user has already completed onboarding, redirect to timeline
    if (user?.user_metadata?.onboarding_completed) {
      router.push('/timeline');
    }
  }, [user, isLoading, router]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712] text-[#F9FAFB]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7C3AED]"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#030712] text-[#F9FAFB]">
      <UserOnboarding />
    </div>
  );
}
