'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '../../utils/supabase';
import { useAuth } from '../../app/providers';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  isSkippable?: boolean;
}

/**
 * A component that handles the user onboarding flow for new users
 * This guides users through setting up their profile and preferences
 */
export default function UserOnboarding() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerRole, setPartnerRole] = useState('co-parent');
  const [babyName, setBabyName] = useState('');
  const [babyDob, setBabyDob] = useState('');
  const [babySex, setBabySex] = useState('');
  const [babyPhoto, setBabyPhoto] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  // Define the onboarding steps
  const steps: OnboardingStep[] = [
    {
      id: 'introduction',
      title: 'Welcome to AI Super-Nanny!',
      description: 'Your personal assistant for tracking and understanding your baby\'s development.',
    },
    {
      id: 'partner-invitation',
      title: 'Invite Your Partner',
      description: 'Add a partner to share baby tracking responsibilities.',
      isSkippable: true,
    },
    {
      id: 'baby-profile',
      title: 'Create Baby Profile',
      description: 'Tell us about your little one so we can personalize the experience.',
    },
    {
      id: 'complete',
      title: 'All Set!',
      description: 'Your account is now ready to use.',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateBabyForm = () => {
    const errors: Record<string, string> = {};
    
    if (!babyName.trim()) {
      errors.babyName = 'Baby name is required';
    }
    
    if (!babyDob.trim()) {
      errors.babyDob = 'Date of birth is required';
    } else {
      const dobDate = new Date(babyDob);
      const now = new Date();
      if (dobDate > now) {
        errors.babyDob = 'Date of birth cannot be in the future';
      }
    }
    
    if (!babySex) {
      errors.babySex = 'Please select a gender';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const invitePartner = async () => {
    if (!partnerEmail) {
      setFormErrors(prev => ({ ...prev, partnerEmail: 'Partner email is required' }));
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(partnerEmail)) {
      setFormErrors(prev => ({ ...prev, partnerEmail: 'Please enter a valid email address' }));
      return;
    }
    
    setLoading(true);
    setError(null);
    setFormErrors({});
    
    try {
      // Call the Edge Function to handle partner invitation
      const { data, error } = await supabase.functions.invoke('invite-partner', {
        body: {
          email: partnerEmail,
          role: partnerRole
        }
      });
      
      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || 'Failed to send invitation');
      }
      
      if (data?.error) {
        console.error('Invitation error:', data.error);
        throw new Error(data.error.details || data.error);
      }
      
      // Show success message briefly before continuing
      setSuccess(`Invitation sent to ${partnerEmail}`);
      
      // Continue to next step after invitation sent
      setTimeout(() => {
        setSuccess(null);
        handleNext();
      }, 2000);
    } catch (error: any) {
      console.error('Partner invitation error:', error);
      setError(error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const createBaby = async () => {
    if (!validateBabyForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get the user's tenant_id first
      const { data: userTenant, error: tenantError } = await supabase
        .from('users_to_tenants')
        .select('tenant_id')
        .eq('user_id', user?.id)
        .single();
      
      if (tenantError) {
        console.error('Error fetching tenant_id:', tenantError);
        throw new Error('Could not determine your account tenant. Please contact support.');
      }
      
      if (!userTenant?.tenant_id) {
        throw new Error('No tenant associated with your account. Please contact support.');
      }
      
      // Create the baby profile with the tenant_id
      const { data: babyData, error: babyError } = await supabase
        .from('babies')
        .insert({
          name: babyName,
          dob: babyDob,
          tenant_id: userTenant.tenant_id,
          metadata: {
            sex: babySex,
          }
        })
        .select()
        .single();
      
      if (babyError) throw babyError;
      
      // Upload photo if provided
      if (babyPhoto && babyData?.id) {
        const fileExt = babyPhoto.name.split('.').pop();
        const filePath = `baby-photos/${babyData.id}/profile.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('baby-assets')
          .upload(filePath, babyPhoto);
          
        if (uploadError) throw uploadError;
        
        // Update baby record with photo URL
        const { error: updateError } = await supabase
          .from('babies')
          .update({ photo_url: filePath })
          .eq('id', babyData.id);
          
        if (updateError) throw updateError;
      }
      
      // Move to completion step
      handleNext();
    } catch (error: any) {
      setError(error.message || 'Failed to create baby profile');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);

    try {
      // Mark onboarding as completed in user metadata
      const { error } = await supabase.auth.updateUser({
        data: { 
          onboarding_completed: true,
        }
      });

      if (error) throw error;

      // Navigate to the timeline page
      router.push('/timeline');
    } catch (error: any) {
      setError(error.message || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  // Render different content based on the current step
  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'introduction':
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">{steps[currentStep].title}</h2>
            <p className="mb-6">{steps[currentStep].description}</p>
            
            <div className="mb-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">Voice-First Capture</h3>
                    <p className="text-sm text-gray-600">Record events naturally with your voice</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">Smart Timeline</h3>
                    <p className="text-sm text-gray-600">Track and visualize your baby's development</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-lg">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium">AI Assistant</h3>
                    <p className="text-sm text-gray-600">Get personalized advice and insights</p>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleNext}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Continue
            </button>
          </div>
        );
      
      case 'partner-invitation':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">{steps[currentStep].title}</h2>
            <p className="mb-6">{steps[currentStep].description}</p>
            
            {error && (
              <div className="mb-4 p-3 bg-[#F87171]/10 text-[#F87171] rounded-lg font-medium">
                {error}
              </div>
            )}
            
            {success && (
              <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {success}
              </div>
            )}
            
            <div className="mb-4">
              <label htmlFor="partnerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Partner's Email
              </label>
              <input
                id="partnerEmail"
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                className={`w-full p-3 border ${formErrors.partnerEmail ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-indigo-500 focus:border-indigo-500`}
                placeholder="Enter your partner's email"
              />
              {formErrors.partnerEmail && (
                <p className="mt-1 text-sm text-red-500">{formErrors.partnerEmail}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label htmlFor="partnerRole" className="block text-sm font-medium text-gray-700 mb-1">
                Partner's Role
              </label>
              <select
                id="partnerRole"
                value={partnerRole}
                onChange={(e) => setPartnerRole(e.target.value)}
                className="block w-full border border-[#2A2D3E] bg-[#181A2A] rounded-xl py-2 px-3 mt-1 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] text-[#F9FAFB] placeholder-[#9CA3AF] font-medium"
              >
                <option value="co-parent">Co-Parent</option>
                <option value="caregiver">Caregiver</option>
                <option value="family-member">Family Member</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={invitePartner}
                disabled={loading || !partnerEmail}
                className="w-full bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white py-3 px-4 rounded-xl font-semibold text-base shadow-md hover:from-[#A78BFA] hover:to-[#7C3AED] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending Invitation...' : 'Send Invitation'}
              </button>
              
              <button
                onClick={handleNext}
                className="w-full bg-white text-gray-600 py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Skip for Now
              </button>
              
              <button
                onClick={handleBack}
                className="text-[#9CA3AF] text-sm py-2 font-medium hover:text-[#F9FAFB] transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        );
      
      case 'baby-profile':
        return (
          <div>
            <h2 className="text-2xl font-bold mb-4">{steps[currentStep].title}</h2>
            <p className="mb-6">{steps[currentStep].description}</p>
            
            {error && (
              <div className="mb-4 p-3 bg-[#F87171]/10 text-[#F87171] rounded-lg font-medium">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label htmlFor="babyName" className="block text-sm font-medium text-gray-700 mb-1">
                Baby's Name *
              </label>
              <input
                id="babyName"
                type="text"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                className={`w-full p-3 border ${formErrors.babyName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-indigo-500 focus:border-indigo-500`}
                placeholder="Enter your baby's name"
              />
              {formErrors.babyName && (
                <p className="mt-1 text-sm text-red-500">{formErrors.babyName}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label htmlFor="babyDob" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                id="babyDob"
                type="date"
                value={babyDob}
                onChange={(e) => setBabyDob(e.target.value)}
                className={`w-full p-3 border ${formErrors.babyDob ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {formErrors.babyDob && (
                <p className="mt-1 text-sm text-red-500">{formErrors.babyDob}</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="babySex"
                    value="male"
                    checked={babySex === 'male'}
                    onChange={() => setBabySex('male')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Male</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="babySex"
                    value="female"
                    checked={babySex === 'female'}
                    onChange={() => setBabySex('female')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Female</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="babySex"
                    value="other"
                    checked={babySex === 'other'}
                    onChange={() => setBabySex('other')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Other</span>
                </label>
              </div>
              {formErrors.babySex && (
                <p className="mt-1 text-sm text-red-500">{formErrors.babySex}</p>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo (Optional)
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-1 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-[#9CA3AF] font-normal">PNG, JPG or JPEG (MAX. 2MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setBabyPhoto(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
              {babyPhoto && (
                <p className="mt-2 text-sm text-[#9CA3AF] font-medium">
                  Selected: {babyPhoto.name}
                </p>
              )}
            </div>
            
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={createBaby}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white py-3 px-4 rounded-xl font-semibold text-base shadow-md hover:from-[#A78BFA] hover:to-[#7C3AED] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Profile...' : 'Create Baby Profile'}
              </button>
              
              <button
                onClick={handleBack}
                className="text-[#9CA3AF] text-sm py-2 font-medium hover:text-[#F9FAFB] transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        );
      
      case 'complete':
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-[#10B981]/10 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">{steps[currentStep].title}</h2>
            <p className="mb-8">{steps[currentStep].description}</p>
            
            {error && (
              <div className="mb-4 p-3 bg-[#F87171]/10 text-[#F87171] rounded-lg font-medium">
                {error}
              </div>
            )}
            
            <button
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white py-3 px-4 rounded-xl font-semibold text-base shadow-md hover:from-[#A78BFA] hover:to-[#7C3AED] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Finalizing Setup...' : 'Go to Timeline'}
            </button>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Progress indicator
  const renderProgressBar = () => {
    return (
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg shadow-sm border-2 transition-all duration-200 ${
                index < currentStep
                  ? 'bg-gradient-to-br from-[#7C3AED] to-[#6366F1] text-white border-[#7C3AED]'
                  : index === currentStep
                    ? 'bg-[#232946] text-[#7C3AED] border-[#7C3AED]'
                    : 'bg-[#2A2D3E] text-[#9CA3AF] border-[#2A2D3E]'
              }`}
              style={{ minWidth: 32, minHeight: 32 }}
            >
              {index < currentStep ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              ) : (
                index + 1
              )}
            </div>
          ))}
        </div>
        <div className="relative h-1">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#2A2D3E] rounded-full"></div>
          <div
            className="absolute top-0 left-0 h-1 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#6366F1] transition-all duration-300"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1F2937] p-4 font-sans" style={{fontFamily: 'SF Pro Text, ui-sans-serif, system-ui, sans-serif'}}>
      <div className="w-full max-w-md bg-[#232946] p-6 rounded-2xl shadow-xl border border-[#2A2D3E]">
        {renderProgressBar()}
        {renderStepContent()}
      </div>
    </div>
  );
}
