"use client";

import { createClient } from '@supabase/supabase-js';
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
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase credentials not found in environment variables');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
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
   * Gets a public URL for an uploaded file
   * @param path The file path in storage
   * @returns The public URL for the file
   */
  private getPublicUrl(path: string): string {
    const { data } = this.supabase.storage
      .from('voice-recordings')
      .getPublicUrl(path);
      
    return data.publicUrl;
  }
  
  /**
   * Process an audio recording through the transcription edge function
   * @param audioBlob The audio blob to process
   * @param duration The duration of the recording in seconds
   * @returns The transcription result
   */
  public async processAudioRecording(audioBlob: Blob, duration: number): Promise<TranscriptionResult> {
    try {
      console.log('Starting audio processing', { durationSeconds: duration, blobSize: audioBlob.size });
      
      // Get the current user
      console.log('Fetching current user');
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        throw new Error(`Authentication error: ${userError.message}`);
      }
      
      if (!user) {
        console.error('No authenticated user found');
        throw new Error('No authenticated user found');
      }
      
      console.log('User authenticated successfully', { userId: user.id });
      
      // Get the tenant ID for the user
      const { data: tenantData, error: tenantError } = await this.supabase
        .from('users_to_tenants')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();
      
      if (tenantError || !tenantData) {
        throw new Error('Failed to get tenant ID');
      }
      
      const tenantId = tenantData.tenant_id;
      
      // Upload the audio file
      const { path, id } = await this.uploadAudio(audioBlob, tenantId);
      
      // Get a public URL for the uploaded file
      const publicUrl = this.getPublicUrl(path);
      
      console.log('Generated public URL for audio file', { publicUrl });
      
      // Call the Edge Function to transcribe the audio
      console.log('Invoking transcribe-audio Edge Function');
      const { data: transcriptionData, error: transcriptionError } = await this.supabase.functions
        .invoke('transcribe-audio', {
          body: { audioUrl: publicUrl, fileId: id, duration },
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
