'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '../../utils/supabase';
import { useAuth } from '../../app/providers';

interface BabyData {
  name: string;
  dob: string;
  sex: 'male' | 'female' | 'other';
  birthWeight?: string;
}

interface BabyProfileFormProps {
  onComplete?: (babyId: string) => void;
  onCancel?: () => void;
}

/**
 * A form component for creating and managing baby profiles
 */
export default function BabyProfileForm({ onComplete, onCancel }: BabyProfileFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [babyData, setBabyData] = useState<BabyData>({
    name: '',
    dob: '',
    sex: 'male',
    birthWeight: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBabyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate required fields
      if (!babyData.name || !babyData.dob) {
        throw new Error('Name and date of birth are required');
      }

      // Create baby profile in Supabase
      const supabase = createBrowserSupabaseClient();
      
      // Get the current user's JWT claims to retrieve tenant_id
      const { data: { user } } = await supabase.auth.getUser();
      
      // The tenant_id is stored in the raw_app_meta_data as set by the handle_new_user function
      const tenant_id = user?.app_metadata?.tenant_id;
      
      console.log('User metadata:', user?.app_metadata);
      
      if (!tenant_id) {
        throw new Error('Unable to determine tenant ID. Please try logging out and back in.');
      }
      
      const { data, error } = await supabase
        .from('babies')
        .insert({
          name: babyData.name,
          dob: babyData.dob,
          tenant_id: tenant_id,
          metadata: {
            sex: babyData.sex,
            birth_weight: babyData.birthWeight || null,
          }
        })
        .select()
        .single();

      if (error) throw error;

      setSuccess(`${babyData.name}'s profile has been created successfully!`);
      
      // Reset form
      setBabyData({
        name: '',
        dob: '',
        sex: 'male',
        birthWeight: '',
      });

      // Call onComplete callback if provided
      if (onComplete && data) {
        onComplete(data.id);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create baby profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Baby Profile</h2>
      
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Baby's Name*
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={babyData.name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter baby's name"
            required
          />
        </div>
        
        <div>
          <label htmlFor="dob" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date of Birth*
          </label>
          <input
            id="dob"
            name="dob"
            type="date"
            value={babyData.dob}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>
        
        <div>
          <label htmlFor="sex" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sex
          </label>
          <select
            id="sex"
            name="sex"
            value={babyData.sex}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="birthWeight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Birth Weight (optional)
          </label>
          <input
            id="birthWeight"
            name="birthWeight"
            type="text"
            value={babyData.birthWeight}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., 7lbs 6oz or 3.4kg"
          />
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
            {loading ? 'Creating Profile...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
