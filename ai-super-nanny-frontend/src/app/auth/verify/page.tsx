'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '../../../utils/supabase';

export default function VerifyPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    const checkVerification = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        // If we have a session and the user is confirmed, they're verified
        if (session?.user?.email_confirmed_at) {
          setVerified(true);
          
          // Redirect to home page after 5 seconds
          setTimeout(() => {
            router.push('/timeline');
          }, 5000);
        } else {
          setError('Email verification failed or is still pending.');
        }
      } catch (error: any) {
        setError(error.message || 'An error occurred during verification');
      } finally {
        setLoading(false);
      }
    };

    checkVerification();
  }, [router, supabase.auth]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 sm:px-20 text-center">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6">Email Verification</h1>
          
          {loading && (
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p>Verifying your email...</p>
            </div>
          )}
          
          {error && !loading && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>{error}</p>
              <p className="mt-2">
                If you're having trouble, please try clicking the verification link again or request a new one.
              </p>
            </div>
          )}
          
          {verified && !loading && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <p className="font-bold">Email successfully verified!</p>
              <p className="mt-2">You'll be redirected to the home page in a few seconds.</p>
              <p className="mt-4">
                <Link href="/timeline" className="text-indigo-600 hover:text-indigo-800 font-medium">
                  Go to home page now
                </Link>
              </p>
            </div>
          )}
          
          {!loading && (
            <div className="text-sm mt-6">
              <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-800">
                Back to login
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
