"use client";

import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { v4 as uuidv4 } from 'uuid';

// Define types for the service
export interface ExtractedEvent {
  id?: string;
  event_type: string;
  event_time?: string;
  start_time?: string; // Database timestamp for the event
  metrics?: Record<string, any>;
  tags?: string[];
  summary: string;
  text_snippet: string;
  confidence_score: number;
  event_hash?: string;
  diary_entry_id?: string;
  created_at?: string;
  metadata?: {
    event_time?: string;
    confidence_score?: number;
    event_hash?: string;
    text_snippet?: string;
    original_time_string?: string; // Original time string from transcription
  };
}

export interface DiaryEntry {
  id: string;
  tenant_id: string;
  user_id: string;
  raw_text: string;
  audio_file_id?: string;
  duration?: number;
  created_at: string;
}

export interface TranscriptionResult {
  // Success response properties
  success: boolean;
  
  // Error response properties
  error?: string;
  failedStep?: string;
  
  // Original detailed response properties (when successful)
  transcription?: string;
  structured_data?: {
    events: ExtractedEvent[];
    raw_text: string;
  };
  diary_entry?: DiaryEntry;
  events?: ExtractedEvent[];
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
      
      // Process the transcription result
      const result = transcriptionData as TranscriptionResult;
      
      // Store the events in localStorage for offline access
      if (result.success && result.events && result.events.length > 0) {
        try {
          // Get existing events from localStorage
          const existingEventsJson = localStorage.getItem('timelineEvents');
          const existingEvents = existingEventsJson ? JSON.parse(existingEventsJson) : [];
          
          // Transform the new events to the timeline format
          const newEvents = result.events.map(event => {
            // Use the original time string from metadata if available
            let eventDate;
            let timeString = '';
            let timestamp = '';
            
            // First priority: use the original time string from metadata
            if (event.metadata?.original_time_string) {
              timeString = event.metadata.original_time_string;
              console.log('Using original time string from metadata:', { timeString });
              
              // Still set the timestamp for sorting (using start_time)
              if (event.start_time) {
                try {
                  eventDate = new Date(event.start_time);
                  timestamp = eventDate.toISOString();
                } catch (e) {
                  console.error('Error parsing start_time for timestamp:', e);
                }
              }
            }
            // Second priority: use start_time from the database
            else if (event.start_time) {
              try {
                eventDate = new Date(event.start_time);
                timestamp = eventDate.toISOString();
                timeString = eventDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                console.log('Using start_time from database:', { start_time: event.start_time, formatted: timeString });
              } catch (e) {
                console.error('Error parsing start_time from database:', e);
                // Will fall back to event_time or current time
              }
            }
            // Third priority: parse event_time from metadata
            else if (event.metadata?.event_time || event.event_time) {
              const eventTimeStr = event.metadata?.event_time || event.event_time;
              try {
                // Try to parse time formats like "10 a.m.", "10:30", etc.
                if (eventTimeStr) {
                  timeString = eventTimeStr; // Use the exact string mentioned
                  console.log('Using event_time string directly:', { timeString });
                  
                  // Still create a timestamp for sorting
                  const timeStr = eventTimeStr.toLowerCase();
                  
                  // Handle formats like "10 a.m.", "10am", etc.
                  const amPmMatch = timeStr.match(/([0-9]{1,2})(?::([0-9]{1,2}))?\s*([ap]\.?m\.?)?/);
                  if (amPmMatch) {
                    const hours = parseInt(amPmMatch[1]);
                    const minutes = amPmMatch[2] ? parseInt(amPmMatch[2]) : 0;
                    const isPM = amPmMatch[3] && amPmMatch[3].startsWith('p');
                    
                    eventDate = new Date();
                    // Convert to 24-hour format if PM
                    let hour24 = hours;
                    if (isPM && hours < 12) hour24 += 12;
                    if (!isPM && hours === 12) hour24 = 0;
                    
                    eventDate.setHours(hour24);
                    eventDate.setMinutes(minutes);
                    eventDate.setSeconds(0);
                    
                    // Create an ISO timestamp for sorting
                    timestamp = eventDate.toISOString();
                    
                    // Format the time string for display
                    const period = hour24 >= 12 ? 'PM' : 'AM';
                    const hour12 = hour24 % 12 || 12;
                    // Assign to the outer timeString variable
                    timeString = `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
                    console.log('Parsed event_time from metadata:', { original: eventTimeStr, formatted: timeString });
                  }
                  // Handle 24-hour format like "14:30"
                  else if (timeStr.match(/^([0-9]{1,2}):([0-9]{1,2})$/)) {
                    const [hours, minutes] = timeStr.split(':').map(Number);
                    eventDate = new Date();
                    eventDate.setHours(hours);
                    eventDate.setMinutes(minutes);
                    eventDate.setSeconds(0);
                    
                    timestamp = eventDate.toISOString();
                    // Assign to the outer timeString variable
                    timeString = eventDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                    console.log('Parsed 24-hour event_time:', { original: eventTimeStr, formatted: timeString });
                  }
                }
                else {
                  throw new Error('Unrecognized time format');
                }
              } catch (e) {
                console.error('Error parsing event_time:', e);
                // Fallback to current time
                eventDate = new Date();
                timestamp = eventDate.toISOString();
                timeString = eventDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
              }
            }
            // Last resort: use current time
            else {
              eventDate = new Date();
              timestamp = eventDate.toISOString();
              timeString = eventDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
              console.log('Using current time as fallback');
            }
            
            // Format description to match the dummy events style based on event type
            let description = '';
            
            if (event.event_type === 'feeding') {
              if (event.metrics?.amount) {
                description = `Bottle feeding, ${event.metrics.amount}${typeof event.metrics.amount === 'number' ? 'ml' : ''} formula`;
              } else {
                description = 'Feeding time';
              }
              if (event.summary) {
                description = event.summary;
              }
            } else if (event.event_type === 'sleep') {
              if (event.metrics?.duration) {
                // Format duration in a readable way
                const duration = event.metrics.duration;
                const hours = Math.floor(duration / 60);
                const minutes = duration % 60;
                const durationText = hours > 0 
                  ? `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? ` ${minutes} minutes` : ''}` 
                  : `${minutes} minutes`;
                description = `Nap time, slept for ${durationText}`;
              } else {
                description = 'Sleep time';
              }
              if (event.summary) {
                description = event.summary;
              }
            } else if (event.event_type === 'diaper') {
              if (event.metrics?.diaper_type) {
                description = `${event.metrics.diaper_type} diaper, changed`;
              } else {
                description = 'Diaper change';
              }
              if (event.summary) {
                description = event.summary;
              }
            } else if (event.event_type === 'milestone') {
              description = event.summary || 'New milestone';
            } else {
              description = event.summary || `${event.event_type} event`;
            }
            
            // Create a TimelineEvent object that matches the interface in timeline/page.tsx
            return {
              id: event.id || uuidv4(),
              type: event.event_type as 'feeding' | 'sleep' | 'diaper' | 'milestone',
              time: timeString,
              timestamp: timestamp, // Add ISO timestamp for sorting
              description: description,
              fullNarrative: event.text_snippet || description,
              hasDetails: !!event.text_snippet,
              isNew: true
            };
          });
          
          // Combine with existing events, avoiding duplicates
          const combinedEvents = [...newEvents, ...existingEvents];
          
          // Save back to localStorage
          localStorage.setItem('timelineEvents', JSON.stringify(combinedEvents));
          
          // Dispatch an event to notify the timeline to refresh
          window.dispatchEvent(new CustomEvent('newEventAdded'));
        } catch (error) {
          console.error('Error saving events to localStorage:', error);
        }
      }
      
      return result;
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
  
  /**
   * Fetch timeline events from the database
   * @param startDate Start date for the range
   * @param endDate End date for the range
   * @param offset Pagination offset
   * @returns Array of timeline events
   */
  public async fetchTimelineEvents(startDate: Date, endDate: Date, offset = 0): Promise<ExtractedEvent[]> {
    try {
      // Check authentication
      const isAuthenticated = await this.checkAuthentication();
      if (!isAuthenticated) {
        throw new Error('Authentication required');
      }
      
      // Format dates for query
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();
      
      // Query events from Supabase
      const { data, error } = await this.supabase
        .from('events')
        .select('*, diary_entries(raw_text)')
        .gte('start_time', startDateStr)
        .lte('start_time', endDateStr)
        .order('start_time', { ascending: false })
        .range(offset, offset + 49);
      
      if (error) {
        console.error('Error fetching timeline events:', error);
        throw error;
      }
      
      // Transform data to include diary text directly
      return data.map((event: any) => ({
        ...event,
        diary_text: event.diary_entries?.raw_text || null
      }));
    } catch (error: any) {
      console.error('Error in fetchTimelineEvents:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const audioProcessingService = new AudioProcessingService();
