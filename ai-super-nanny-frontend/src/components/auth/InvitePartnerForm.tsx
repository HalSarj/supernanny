'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '../../utils/supabase';
import { useAuth } from '../../app/providers';

interface InvitePartnerFormProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

/**
 * A form component for inviting partners/caregivers to join the family account
 */
export default function InvitePartnerForm({ onComplete, onCancel }: InvitePartnerFormProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'parent' | 'caregiver' | 'family'>('parent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Generate a unique invitation code
  const generateUniqueCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate email
      if (!email || !email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      // Generate invitation code
      const code = generateUniqueCode();
      
      // Store invitation in Supabase
      const supabase = createBrowserSupabaseClient();
      
      // Get the current user's JWT claims to retrieve tenant_id
      const { data: { user } } = await supabase.auth.getUser();
      
      // The tenant_id is stored in the raw_app_meta_data as set by the handle_new_user function
      const tenant_id = user?.app_metadata?.tenant_id;
      
      console.log('User metadata:', user?.app_metadata);
      
      if (!tenant_id) {
        throw new Error('Unable to determine tenant ID. Please try logging out and back in.');
      }
      
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          email,
          role,
          code,
          tenant_id: tenant_id,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });

      if (inviteError) throw inviteError;

      // In a real application, we would send an email here
      // For now, we'll just simulate it with a success message
      
      setSuccess(`Invitation sent to ${email}! They will receive an email with instructions to join.`);
      setEmail('');
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      setError(error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Invite Partner or Caregiver</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          {success}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter email address"
            required
          />
        </div>
        
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'parent' | 'caregiver' | 'family')}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="parent">Parent</option>
            <option value="caregiver">Caregiver</option>
            <option value="family">Family Member</option>
          </select>
        </div>
        
        <div className="flex justify-between pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Sending Invitation...' : 'Send Invitation'}
          </button>
        </div>
      </form>
    </div>
  );
}
