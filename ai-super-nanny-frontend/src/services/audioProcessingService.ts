"use client";

import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { v4 as uuidv4 } from 'uuid';

// Define types for the service
export interface TranscriptionResult {
  // Success response properties
  success: boolean;
  eventId?: string;
  summary?: string;
  eventType?: string;
  
  // Error response properties
  error?: string;
  failedStep?: string;
  
  // Original detailed response properties (when successful)
  transcription?: string;
  structured_data?: {
    event_type: string;
    event_time?: string;
    metrics?: Record<string, any>;
    tags?: string[];
    summary: string;
    raw_text: string;
  };
  event?: {
    id: string;
    tenant_id: string;
    user_id: string;
    event_type: string;
    start_time: string;
    end_time?: string;
    notes: string;
    metadata: {
      metrics?: Record<string, any>;
      tags?: string[];
      raw_text: string;
      audio_file_id?: string;
      duration?: number;
    };
    created_at: string;
  };
}

/**
 * Service for processing audio recordings
 * Handles uploading to Supabase storage and transcription via Edge Function
 */
export class AudioProcessingService {
  private supabase;
  
  constructor() {
    // Initialize Supabase client using the browser client to access the same session
    // This ensures we're using the same authentication context as the rest of the app
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase credentials not found in environment variables');
    }
    
    // Use createBrowserClient instead of createClient to ensure we get the browser session
    this.supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  
  /**
   * Uploads an audio blob to Supabase storage
   * @param audioBlob The audio blob to upload
   * @param tenantId The tenant ID for storage path
   * @returns The file path and ID in storage
   */
  private async uploadAudio(audioBlob: Blob, tenantId: string): Promise<{ path: string, id: string }> {
    try {
      // Generate a unique filename for the audio file
      const audioFileName = `${uuidv4()}.webm`;
      const filePath = `${tenantId}/${audioFileName}`;
      
      console.log('Uploading audio file to storage', { filePath, contentType: 'audio/webm', size: audioBlob.size });
      
      // Upload the audio file to Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('voice-recordings')
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm',
        });
      
      if (uploadError) {
        console.error('Error uploading audio:', uploadError);
        throw new Error(`Audio upload error: ${uploadError.message}`);
      }
      
      console.log('Audio file uploaded successfully', { path: uploadData?.path });
      
      return {
        path: uploadData.path,
        id: uploadData.id
      };
    } catch (error) {
      console.error('Error uploading audio:', error);
      
      // Try to determine which step failed
      let errorMessage = 'Unknown error';
      let errorStep = 'unknown';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (errorMessage.includes('Authentication')) {
          errorStep = 'authentication';
        } else if (errorMessage.includes('Tenant')) {
          errorStep = 'tenant-lookup';
        } else if (errorMessage.includes('upload')) {
          errorStep = 'audio-upload';
        } else if (errorMessage.includes('Transcription')) {
          errorStep = 'transcription';
        } else if (errorMessage.includes('Event save')) {
          errorStep = 'event-save';
        }
      }
      
      console.error(`Audio processing failed at step: ${errorStep}`, { errorMessage });
      
      throw new Error(`Audio upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Gets a signed URL for an uploaded file with temporary access
   * @param path The file path in storage
   * @returns The signed URL for the file with temporary access
   */
  private async getSignedUrl(path: string): Promise<string> {
    // Create a signed URL that expires in 60 seconds
    const { data, error } = await this.supabase.storage
      .from('voice-recordings')
      .createSignedUrl(path, 60);
    
    if (error) {
      console.error('Error creating signed URL:', error);
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }
      
    return data.signedUrl;
  }
  
  /**
   * Process an audio recording through the transcription edge function
   * @param audioBlob The audio blob to process
   * @param duration The duration of the recording in seconds
   * @returns The transcription result
   */
  /**
   * Check if user is authenticated
   * @returns True if authenticated, false otherwise
   */
  private async checkAuthentication(): Promise<boolean> {
    const { data } = await this.supabase.auth.getSession();
    return !!data.session;
  }

  public async processAudioRecording(audioBlob: Blob, duration: number): Promise<TranscriptionResult> {
    try {
      console.log('Starting audio processing', { durationSeconds: duration, blobSize: audioBlob.size });
      
      // Check authentication before proceeding
      const isAuthenticated = await this.checkAuthentication();
      if (!isAuthenticated) {
        console.error('User is not authenticated');
        return {
          success: false,
          error: 'Authentication error: You must be logged in to process recordings',
          failedStep: 'authentication'
        };
      }
      
      // Get the current user with detailed logging
      console.log('Fetching current user');
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      
      // Log detailed user information for debugging
      console.log('User data:', {
        id: user?.id,
        email: user?.email,
        app_metadata: user?.app_metadata,
        user_metadata: user?.user_metadata
      });
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw new Error(`Authentication error: ${userError.message}`);
      }
      
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('No authenticated user found');
      }
      
      console.log('User authenticated successfully', { userId: user.id });
      
      // Get the tenant ID directly from the users table
      const { data: userData, error: tenantError } = await this.supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (tenantError || !userData || !userData.tenant_id) {
        console.error('Error getting tenant ID:', tenantError);
        throw new Error('Failed to get tenant ID');
      }
      
      const tenantId = userData.tenant_id;
      
      // Upload the audio file
      const { path, id } = await this.uploadAudio(audioBlob, tenantId);
      
      // Generate a signed URL for the uploaded file
      const signedUrl = await this.getSignedUrl(path);
      console.log('Generated signed URL for audio file', { signedUrl });
      
      // Call the Edge Function to transcribe the audio
      console.log('Invoking transcribe-audio Edge Function');
      
      // Get the current session to include the access token
      const { data: sessionData } = await this.supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      
      if (!accessToken) {
        console.error('No access token available for Edge Function call');
        throw new Error('Authentication error: No valid session found');
      }
      
      const { data: transcriptionData, error: transcriptionError } = await this.supabase.functions
        .invoke('transcribe-audio', {
          body: { audioUrl: signedUrl, fileId: id, duration },
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
      
      if (transcriptionError) {
        console.error('Error transcribing audio:', transcriptionError);
        throw new Error(`Transcription error: ${transcriptionError.message || 'Unknown error'}`);
      }
      
      console.log('Transcription completed successfully', { hasData: !!transcriptionData });
      
      return transcriptionData as TranscriptionResult;
    } catch (error: any) {
      console.error('Error in processAudioRecording:', error);
      
      // Try to determine which step failed
      let errorMessage = 'Unknown error';
      let errorStep = 'unknown';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (errorMessage.includes('Authentication')) {
          errorStep = 'authentication';
        } else if (errorMessage.includes('Tenant')) {
          errorStep = 'tenant-lookup';
        } else if (errorMessage.includes('upload')) {
          errorStep = 'audio-upload';
        } else if (errorMessage.includes('Transcription')) {
          errorStep = 'transcription';
        } else if (errorMessage.includes('Event save')) {
          errorStep = 'event-save';
        }
      }
      
      console.error(`Audio processing failed at step: ${errorStep}`, { errorMessage });
      
      throw new Error(`Audio processing failed: ${error.message}`);
    }
  }
  
  /**
   * Set a TTL (time to live) for an audio file to auto-delete after 24 hours
   * @param fileId The ID of the file in storage
   */
  public async setAudioFileTTL(fileId: string): Promise<void> {
    try {
      // Use RPC to call a database function that sets TTL
      // This assumes you have a stored procedure in your database
      const { error } = await this.supabase.rpc('set_audio_file_ttl', {
        file_id: fileId,
        ttl_hours: 24
      });
      
      if (error) {
        console.error('Error setting audio file TTL:', error);
      }
    } catch (error: any) {
      console.error('Error in setAudioFileTTL:', error);
    }
  }
}

// Export a singleton instance
export const audioProcessingService = new AudioProcessingService();
