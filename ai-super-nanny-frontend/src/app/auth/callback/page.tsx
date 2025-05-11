'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '../../../utils/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createBrowserSupabaseClient();
      
      // Get the code and needsOnboarding flag from the URL
      const code = searchParams.get('code');
      const needsOnboarding = searchParams.get('needsOnboarding') === 'true';
      
      if (code) {
        // Exchange the code for a session
        await supabase.auth.exchangeCodeForSession(code);
        
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (needsOnboarding && user) {
          // Set onboarding_completed to false for OAuth sign-ins
          await supabase.auth.updateUser({
            data: { onboarding_completed: false }
          });
          
          // Redirect to onboarding
          router.push('/onboarding');
        } else if (user?.user_metadata?.onboarding_completed) {
          // User has completed onboarding, redirect to timeline
          router.push('/timeline');
        } else {
          // User needs to complete onboarding
          router.push('/onboarding');
        }
      } else {
        // No code in URL, redirect to login
        router.push('/auth/login');
      }
    };
    
    handleAuthCallback();
  }, [router, searchParams]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] text-[#F9FAFB]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#7C3AED] mx-auto mb-4"></div>
        <h1 className="text-xl font-semibold">Completing authentication...</h1>
        <p className="text-[#D1D5DB] mt-2">Please wait while we sign you in.</p>
      </div>
    </div>
  );
}
