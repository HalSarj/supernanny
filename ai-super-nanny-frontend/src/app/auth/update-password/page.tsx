'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '../../../utils/supabase';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hashPresent, setHashPresent] = useState(false);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    // Check if we have a hash in the URL (from password reset email)
    const hash = window.location.hash;
    setHashPresent(!!hash);
    
    // If there's no hash, this might not be a valid password reset attempt
    if (!hash && typeof window !== 'undefined') {
      setError('Invalid password reset link. Please request a new one.');
    }
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw error;
      }

      setSuccessMessage('Password updated successfully');
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'An error occurred while updating password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2 bg-[#030712] text-[#F9FAFB]">
      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 sm:px-20 text-center">
        <div className="w-full max-w-md bg-[#1F2937] p-6 rounded-[16px] shadow-md">
          <h1 className="text-[24px] font-bold mb-6 text-[#F9FAFB]">Update Password</h1>
          
          {error && (
            <div className="bg-[#E11D48]/10 border border-[#E11D48] text-[#E11D48] px-4 py-3 rounded-[12px] mb-4">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-[#059669]/10 border border-[#059669] text-[#10B981] px-4 py-3 rounded-[12px] mb-4">
              {successMessage}
              <p className="text-[14px] mt-2 text-[#10B981]">Redirecting to login page...</p>
            </div>
          )}
          
          {hashPresent ? (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="text-left">
                <label htmlFor="password" className="block text-[15px] font-medium text-[#D1D5DB] mb-1">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-[12px] bg-[#4B5563] border-none text-[#F9FAFB] py-3 px-4 focus:ring-[#7C3AED] focus:border-[#7C3AED]"
                  required
                />
                <p className="text-[12px] text-[#9CA3AF] mt-2">
                  Password must be at least 8 characters long
                </p>
              </div>
              
              <div className="text-left">
                <label htmlFor="confirmPassword" className="block text-[15px] font-medium text-[#D1D5DB] mb-1">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-[12px] bg-[#4B5563] border-none text-[#F9FAFB] py-3 px-4 focus:ring-[#7C3AED] focus:border-[#7C3AED]"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[56px] bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white font-semibold text-[16px] rounded-full focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-opacity-50 transition-all duration-300 ease-out-cubic disabled:opacity-40"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          ) : (
            <div className="text-center">
              <p className="mb-4 text-[15px] text-[#D1D5DB]">
                This password reset link is invalid or has expired.
              </p>
              <Link 
                href="/auth/reset-password" 
                className="text-[#7C3AED] hover:text-[#8B5CF6] font-medium text-[15px]"
              >
                Request a new password reset
              </Link>
            </div>
          )}
          
          <div className="text-[15px] mt-6 text-[#D1D5DB]">
            <Link href="/auth/login" className="text-[#7C3AED] hover:text-[#8B5CF6] font-medium">
              Back to login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
