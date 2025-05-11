'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../providers';
import { createBrowserSupabaseClient } from '../../../utils/supabase';
import BabyProfileForm from '../../../components/auth/BabyProfileForm';
import InvitePartnerForm from '../../../components/auth/InvitePartnerForm';

type Baby = {
  id: string;
  name: string;
  dob: string;
  metadata: {
    sex: string;
    birth_weight?: string;
  };
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
};

export default function ManageProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [babies, setBabies] = useState<Baby[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'babies' | 'invitations'>('babies');
  const [showAddBaby, setShowAddBaby] = useState(false);
  const [showInvitePartner, setShowInvitePartner] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const supabase = createBrowserSupabaseClient();
        
        // Fetch babies
        const { data: babiesData, error: babiesError } = await supabase
          .from('babies')
          .select('*');
        
        if (babiesError) throw babiesError;
        setBabies(babiesData || []);
        
        // Fetch invitations
        const { data: invitationsData, error: invitationsError } = await supabase
          .from('invitations')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (invitationsError) throw invitationsError;
        setInvitations(invitationsData || []);
        
      } catch (error: any) {
        setError(error.message || 'Failed to load data');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, router]);

  const handleBabyAdded = async (babyId: string) => {
    setShowAddBaby(false);
    
    // Refresh babies list
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from('babies')
        .select('*');
      
      if (error) throw error;
      setBabies(data || []);
    } catch (error: any) {
      console.error('Error refreshing babies:', error);
    }
  };

  const handleInvitationSent = async () => {
    setShowInvitePartner(false);
    
    // Refresh invitations list
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInvitations(data || []);
    } catch (error: any) {
      console.error('Error refreshing invitations:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-indigo-600 px-4 py-5 sm:px-6 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-white">Manage Family Profiles</h1>
            <button
              onClick={() => router.push('/profile')}
              className="text-white bg-indigo-700 px-3 py-1 rounded hover:bg-indigo-800"
            >
              Back to Profile
            </button>
          </div>
          
          {error && (
            <div className="p-4 bg-red-100 text-red-700 border-b border-gray-200">
              {error}
            </div>
          )}
          
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'babies'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('babies')}
              >
                Baby Profiles
              </button>
              <button
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'invitations'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('invitations')}
              >
                Partner Invitations
              </button>
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === 'babies' && (
              <div>
                {!showAddBaby ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium text-gray-900">Baby Profiles</h2>
                      <button
                        onClick={() => setShowAddBaby(true)}
                        className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
                      >
                        Add Baby
                      </button>
                    </div>
                    
                    {babies.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No baby profiles yet. Add your first baby to get started!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {babies.map((baby) => (
                          <div key={baby.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">{baby.name}</h3>
                                <p className="text-sm text-gray-500">
                                  Born: {formatDate(baby.dob)}
                                </p>
                                {baby.metadata?.sex && (
                                  <p className="text-sm text-gray-500">
                                    Sex: {baby.metadata.sex.charAt(0).toUpperCase() + baby.metadata.sex.slice(1)}
                                  </p>
                                )}
                                {baby.metadata?.birth_weight && (
                                  <p className="text-sm text-gray-500">
                                    Birth Weight: {baby.metadata.birth_weight}
                                  </p>
                                )}
                              </div>
                              <button
                                className="text-indigo-600 hover:text-indigo-800"
                                // Edit functionality would be implemented here
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium text-gray-900">Add Baby Profile</h2>
                      <button
                        onClick={() => setShowAddBaby(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                    <BabyProfileForm 
                      onComplete={handleBabyAdded}
                      onCancel={() => setShowAddBaby(false)}
                    />
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'invitations' && (
              <div>
                {!showInvitePartner ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium text-gray-900">Partner Invitations</h2>
                      <button
                        onClick={() => setShowInvitePartner(true)}
                        className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
                      >
                        Invite Partner
                      </button>
                    </div>
                    
                    {invitations.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No invitations sent yet. Invite a partner or caregiver to share access.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {invitations.map((invitation) => (
                          <div key={invitation.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-medium text-gray-900">{invitation.email}</h3>
                                <p className="text-sm text-gray-500">
                                  Role: {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Sent: {formatDate(invitation.created_at)}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Expires: {formatDate(invitation.expires_at)}
                                </p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  className="text-indigo-600 hover:text-indigo-800"
                                  // Resend functionality would be implemented here
                                >
                                  Resend
                                </button>
                                <button
                                  className="text-red-600 hover:text-red-800"
                                  // Cancel functionality would be implemented here
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-medium text-gray-900">Invite Partner or Caregiver</h2>
                      <button
                        onClick={() => setShowInvitePartner(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                    <InvitePartnerForm 
                      onComplete={handleInvitationSent}
                      onCancel={() => setShowInvitePartner(false)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
