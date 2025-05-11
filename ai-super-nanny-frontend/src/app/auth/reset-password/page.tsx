'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserSupabaseClient } from '../../../utils/supabase';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        throw error;
      }

      setSuccessMessage('Password reset instructions sent to your email');
    } catch (error: any) {
      setError(error.message || 'An error occurred while requesting password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2 bg-[#030712] text-[#F9FAFB]">
      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 sm:px-20 text-center">
        <div className="w-full max-w-md bg-[#1F2937] p-6 rounded-[16px] shadow-md">
          <h1 className="text-[24px] font-bold mb-6 text-[#F9FAFB]">Reset Password</h1>
          
          {error && (
            <div className="bg-[#E11D48]/10 border border-[#E11D48] text-[#E11D48] px-4 py-3 rounded-[12px] mb-4">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-[#059669]/10 border border-[#059669] text-[#10B981] px-4 py-3 rounded-[12px] mb-4">
              {successMessage}
            </div>
          )}
          
          <form onSubmit={handleResetPassword} className="space-y-6">
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
              <p className="text-[12px] text-[#9CA3AF] mt-2">
                We'll send you instructions to reset your password
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[56px] bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-white font-semibold text-[16px] rounded-full focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-opacity-50 transition-all duration-300 ease-out-cubic disabled:opacity-40"
            >
              {loading ? 'Sending...' : 'Send Reset Instructions'}
            </button>
            
            <div className="text-[15px] mt-6 text-[#D1D5DB]">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-[#7C3AED] hover:text-[#8B5CF6] font-medium">
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
