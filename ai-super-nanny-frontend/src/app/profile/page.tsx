'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../providers';
import { createBrowserSupabaseClient } from '../../utils/supabase';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      // Get user metadata if available
      const metadata = user.user_metadata;
      if (metadata && metadata.name) {
        setName(metadata.name);
      }
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Update user profile using Supabase
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({
        data: { name }
      });

      if (error) throw error;

      setMessage({ text: 'Profile updated successfully', type: 'success' });
    } catch (error: any) {
      setMessage({ text: error.message || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
    } catch (error: any) {
      setMessage({ text: error.message || 'Failed to sign out', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-indigo-600 px-4 py-5 sm:px-6">
          <h1 className="text-xl font-semibold text-white">Profile</h1>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          {message && (
            <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message.text}
            </div>
          )}
          
          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-100 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign Out
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-5 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Family Management</h3>
            <div className="mt-4 space-y-4">
              <div>
                <button
                  type="button"
                  onClick={() => router.push('/profile/manage')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Manage Baby Profiles & Partners
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-5 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Account Management</h3>
            <div className="mt-4 space-y-4">
              <div>
                <button
                  type="button"
                  onClick={() => router.push('/auth/reset-password')}
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
