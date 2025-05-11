'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../providers';
import { createBrowserSupabaseClient } from '../../../utils/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithApple, signInWithMagicLink } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signIn(email, password);
      
      // Check if user needs onboarding
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.user_metadata?.onboarding_completed === false) {
        // User needs to complete onboarding
        router.push('/onboarding');
      } else {
        // User has completed onboarding or has no metadata
        router.push('/timeline');
      }
      
      router.refresh();
    } catch (error: any) {
      setError(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2 bg-[#030712] text-[#F9FAFB]">
      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 sm:px-20 text-center">
        <div className="w-full max-w-md bg-[#1F2937] p-6 rounded-[16px] shadow-md">
          <h1 className="text-[24px] font-bold mb-6 text-[#F9FAFB]">Login</h1>
          
          {error && (
            <div className="bg-[#E11D48]/10 border border-[#E11D48] text-[#E11D48] px-4 py-3 rounded-[12px] mb-4">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-left">
              <label htmlFor="email" className="block text-[15px] font-medium text-[#D1D5DB] mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-[12px] bg-[#4B5563] border-none text-[#F9FAFB] py-3 px-4 focus:ring-[#7C3AED] focus:border-[#7C3AED]"
                required
              />
            </div>
            
            <div className="text-left">
              <label htmlFor="password" className="block text-[15px] font-medium text-[#D1D5DB] mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-[12px] bg-[#4B5563] border-none text-[#F9FAFB] py-3 px-4 focus:ring-[#7C3AED] focus:border-[#7C3AED]"
                required
              />
              <div className="flex justify-end mt-2">
                <Link href="/auth/reset-password" className="text-[14px] font-medium text-[#7C3AED] hover:text-[#8B5CF6]">
                  Forgot password?
                </Link>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[56px] bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white font-semibold text-[16px] rounded-full focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-opacity-50 transition-all duration-300 ease-out-cubic disabled:opacity-40"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#4B5563]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#1F2937] text-[#D1D5DB]">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  signInWithGoogle()
                    .catch(error => {
                      setError(error.message || 'Failed to sign in with Google');
                      setLoading(false);
                    });
                }}
                className="flex items-center justify-center h-[56px] bg-[#4B5563] text-white font-medium rounded-[12px] hover:bg-[#374151] transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  signInWithApple()
                    .catch(error => {
                      setError(error.message || 'Failed to sign in with Apple');
                      setLoading(false);
                    });
                }}
                className="flex items-center justify-center h-[56px] bg-[#4B5563] text-white font-medium rounded-[12px] hover:bg-[#374151] transition-colors"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16.7 7.33c-1.3 0-2.17.67-2.93.67-.8 0-1.57-.67-2.6-.67-1.33 0-2.53.8-3.2 2.03-1.37 2.37-.36 5.87 1 7.8.67.93 1.43 2 2.47 1.97.97-.03 1.33-.63 2.53-.63 1.17 0 1.53.63 2.53.6 1.07-.03 1.73-.93 2.37-1.87.43-.6.77-1.27.97-2-1.13-.47-1.9-1.6-1.9-2.93-.03-1.37.73-2.53 1.83-3.03-.7-1.03-1.83-1.63-3.07-1.67zM16.13 5c.63-.8 1.07-1.9.93-3-.9.07-1.77.6-2.33 1.33-.5.67-.97 1.73-.8 2.77 1 .07 1.7-.3 2.2-1.1z" />
                </svg>
                Apple
              </button>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={async (e) => {
                  e.preventDefault();
                  if (!email) {
                    setError('Please enter your email address');
                    return;
                  }
                  setLoading(true);
                  try {
                    await signInWithMagicLink(email);
                    setMagicLinkSent(true);
                    setError(null);
                  } catch (error: any) {
                    setError(error.message || 'Failed to send magic link');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="w-full h-[56px] border border-[#7C3AED] text-[#7C3AED] font-semibold text-[16px] rounded-full focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-opacity-50 transition-all duration-300 ease-out-cubic hover:bg-[#7C3AED]/10"
              >
                {magicLinkSent ? 'Magic Link Sent!' : 'Sign In with Magic Link'}
              </button>
            </div>
            
            <div className="text-[15px] mt-6 text-[#D1D5DB]">
              Don't have an account?{' '}
              <Link href="/auth/signup" className="text-[#7C3AED] hover:text-[#8B5CF6] font-medium">
                Sign up
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
