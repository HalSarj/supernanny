// Follow Deno and Supabase Edge Function conventions
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'
import { corsHeaders } from '../_shared/cors.ts'

// Debug function to log information
const debug = (message: string, data?: any) => {
  console.log(`[TRANSCRIBE-AUDIO] ${message}`, data ? JSON.stringify(data) : '');
}

// Helper function to safely stringify objects that might contain circular references
const safeStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj, (key, value) => {
      if (value instanceof Blob) return `Blob(${value.size} bytes)`;
      if (value instanceof FormData) return 'FormData';
      return value;
    });
  } catch (error) {
    return `[Object that couldn't be stringified: ${error.message}]`;
  }
};

// Interface for the request body
interface TranscribeRequest {
  audioUrl: string;
  fileId?: string;
  duration?: number;
}

// Interface for the OpenAI Whisper API response
interface WhisperResponse {
  text: string;
}

// Interface for the structured data extraction
interface ExtractedEvent {
  event_type: string;
  event_time?: string;
  metrics?: Record<string, any>;
  tags?: string[];
  summary: string;
  text_snippet: string;
  confidence_score: number;
  event_hash?: string;
}

interface ExtractedData {
  events: ExtractedEvent[];
  raw_text: string;
}

/**
 * Transcribes audio using OpenAI Whisper API
 * @param audioUrl URL to the audio file in Supabase storage
 * @returns Transcribed text
 */
const transcribeAudio = async (audioUrl: string): Promise<string> => {
  debug('Transcribing audio from URL', { audioUrl });
  
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  debug('OpenAI API key present', { present: !!openaiApiKey });
  
  if (!openaiApiKey) {
    debug('OPENAI_API_KEY not found in environment');
    throw new Error('OPENAI_API_KEY environment variable not set');
  }

  try {
    // Fetch the audio file from the URL
    debug('Fetching audio from URL');
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      debug('Failed to fetch audio', { 
        status: audioResponse.status, 
        statusText: audioResponse.statusText 
      });
      throw new Error(`Failed to fetch audio: ${audioResponse.status} ${audioResponse.statusText}`);
    }
    
    const audioBlob = await audioResponse.blob();
    debug('Audio fetched successfully', { size: audioBlob.size, type: audioBlob.type });
    
    // Create form data for the OpenAI API request
    const formData = new FormData();
    // Use the correct file extension based on the content type
    const fileExtension = audioBlob.type.includes('webm') ? 'webm' : 'm4a';
    debug('Using file extension for Whisper API', { fileExtension, contentType: audioBlob.type });
    formData.append('file', audioBlob, `audio.${fileExtension}`);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    debug('FormData created for Whisper API');
    
    // Call the OpenAI Whisper API
    debug('Calling OpenAI Whisper API');
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });
    
    debug('Whisper API response received', { status: response.status });
    
    if (!response.ok) {
      const errorText = await response.text();
      debug('OpenAI API error', { status: response.status, error: errorText });
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json() as WhisperResponse;
    debug('Transcription successful', { textLength: data.text.length });
    
    return data.text;
  } catch (error) {
    debug('Transcription error', { error: error.message, stack: error.stack });
    throw error;
  }
};

/**
 * Generates a hash for an event to help with duplicate detection
 * @param event The event to hash
 * @returns A string hash representing the event
 */
const generateEventHash = (event: ExtractedEvent): string => {
  // Create a string representation of the event's key properties
  const hashInput = [
    event.event_type,
    event.event_time || '',
    event.summary,
    JSON.stringify(event.metrics || {})
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash.toString(16);
};

/**
 * Calculates a confidence score for an extracted event
 * @param event The extracted event
 * @param text The original text
 * @returns A confidence score between 0-100
 */
const calculateConfidenceScore = (event: ExtractedEvent, text: string): number => {
  let score = 70; // Base score
  
  // Adjust score based on event properties
  if (event.event_time) score += 10;
  if (event.metrics && Object.keys(event.metrics).length > 0) score += 10;
  if (event.tags && event.tags.length > 0) score += 5;
  
  // Check for key terms in the text snippet based on event type
  const keyTerms: Record<string, string[]> = {
    'feeding': ['feed', 'bottle', 'formula', 'breast', 'milk', 'oz', 'ounce', 'nurse'],
    'sleep': ['sleep', 'nap', 'bed', 'woke', 'tired', 'rest', 'awake'],
    'diaper': ['diaper', 'wet', 'dirty', 'change', 'poop', 'pee', 'bowel', 'movement']
  };
  
  if (event.event_type in keyTerms) {
    const relevantTerms = keyTerms[event.event_type];
    const textLower = event.text_snippet.toLowerCase();
    
    // Count how many key terms are present
    const matchCount = relevantTerms.filter(term => textLower.includes(term)).length;
    const matchRatio = matchCount / relevantTerms.length;
    
    // Adjust score based on key term matches
    score += Math.min(matchRatio * 20, 20); // Up to 20 points for term matches
  }
  
  // Cap the score at 100
  return Math.min(Math.round(score), 100);
};

/**
 * Extracts multiple structured events from transcribed text using OpenAI
 * @param text Transcribed text from the audio
 * @returns Structured data with multiple events, each with type, metrics, and summary
 */
const extractStructuredData = async (text: string): Promise<ExtractedData> => {
  debug('Extracting structured data from text', { textLength: text.length });
  
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  debug('OpenAI API key present for extraction', { present: !!openaiApiKey });
  
  if (!openaiApiKey) {
    debug('OPENAI_API_KEY not found in environment for extraction');
    throw new Error('OPENAI_API_KEY environment variable not set');
  }

  try {
    debug('Preparing request to OpenAI Chat API for multiple event extraction');
    const requestBody = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that helps parents track baby events. 
          Extract multiple structured events from the parent's voice note. 
          Identify each distinct event mentioned (feeding, diaper, sleep) and extract details for each one.
          For each event, identify:
          1. The event type (feeding, diaper, sleep)
          2. When it happened (extract or estimate time based on context)
          3. Any metrics mentioned (amount, duration, etc.)
          4. A brief summary of the event
          5. The specific part of the text that mentions this event
          
          If times are mentioned, standardize them to 24-hour format.
          If times are ambiguous (e.g., "this morning"), make a reasonable estimate based on context.
          If multiple events of the same type are mentioned, extract each as a separate event.
          Focus only on feeding, diaper, and sleep events for now.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      functions: [
        {
          name: 'extract_baby_events',
          description: 'Extract multiple structured events about a baby from text',
          parameters: {
            type: 'object',
            properties: {
              events: {
                type: 'array',
                description: 'List of events extracted from the text',
                items: {
                  type: 'object',
                  properties: {
                    event_type: {
                      type: 'string',
                      description: 'The type of event',
                      enum: ['feeding', 'diaper', 'sleep']
                    },
                    event_time: {
                      type: 'string',
                      description: 'The time of the event in 24-hour format (HH:MM) if mentioned, or best estimate based on context'
                    },
                    metrics: {
                      type: 'object',
                      description: 'Any metrics mentioned in the event',
                      properties: {
                        amount: { type: 'number', description: 'Amount in oz or ml for feeding' },
                        duration: { type: 'number', description: 'Duration in minutes' },
                        diaper_type: { type: 'string', enum: ['wet', 'dirty', 'both', 'dry'] }
                      }
                    },
                    tags: {
                      type: 'array',
                      description: 'Keywords or categories for the event',
                      items: { type: 'string' }
                    },
                    summary: {
                      type: 'string',
                      description: 'A brief, clear summary of the event in third person'
                    },
                    text_snippet: {
                      type: 'string',
                      description: 'The specific part of the text that mentions this event'
                    }
                  },
                  required: ['event_type', 'summary', 'text_snippet']
                }
              }
            },
            required: ['events']
          }
        }
      ],
      function_call: { name: 'extract_baby_events' }
    };
    
    debug('Calling OpenAI Chat API');
    const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    debug('OpenAI Chat API response received', { status: apiResponse.status });
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      debug('OpenAI API error', { status: apiResponse.status, error: errorText });
      throw new Error(`OpenAI API error: ${apiResponse.status} ${errorText}`);
    }
    
    const data = await apiResponse.json();
    debug('OpenAI Chat API response parsed');
    
    const functionCall = data.choices[0]?.message?.function_call;
    debug('Function call response', { hasFunction: !!functionCall });
    
    if (!functionCall || !functionCall.arguments) {
      debug('Missing function call or arguments in response');
      throw new Error('Failed to extract structured data');
    }
    
    // Parse the extracted events
    const parsedData = JSON.parse(functionCall.arguments);
    const events = parsedData.events || [];
    
    // Add confidence scores and event hashes to each event
    const processedEvents = events.map((event: ExtractedEvent) => {
      // Calculate confidence score
      event.confidence_score = calculateConfidenceScore(event, text);
      
      // Generate event hash for duplicate detection
      event.event_hash = generateEventHash(event);
      
      return event;
    });
    
    debug('Multiple events extraction successful', { eventCount: processedEvents.length });
    
    return {
      events: processedEvents,
      raw_text: text
    };
  } catch (error) {
    debug('Structured data extraction error', { error: error instanceof Error ? error.message : String(error) });
    // Fallback to basic extraction if advanced fails
    return {
      events: [{
        event_type: 'note',
        summary: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        text_snippet: text,
        confidence_score: 30,
        event_hash: '0'
      }],
      raw_text: text
    };
  }
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    debug('Function invoked with method', req.method);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      debug('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Create Supabase clients
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );
    
    // Service role client that can bypass RLS policies
    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      debug('No Authorization header found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data, error: userError } = await supabaseClient.auth.getUser(token);
    const user = data?.user;
    
    if (userError || !user) {
      debug('Authentication failed', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse the request body
    let audioUrl, fileId, duration;
    try {
      const requestData = await req.json() as TranscribeRequest;
      audioUrl = requestData.audioUrl;
      fileId = requestData.fileId;
      duration = requestData.duration;
      
      debug('Request body parsed', { audioUrl, fileId, duration });
    } catch (error: any) {
      debug('Error parsing request body', error);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate the request
    if (!audioUrl) {
      debug('Missing required fields', { audioUrl });
      return new Response(
        JSON.stringify({ error: 'audioUrl is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get the user's tenant ID
    let tenantId: string | null = null;
    const { data: userTenant, error: tenantError } = await supabaseClient
      .from('users_to_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();
    
    if (tenantError) {
      debug('Error fetching tenant_id', tenantError);
      // Try fallback to users table
      const { data: userData, error: userDataError } = await supabaseClient
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (userDataError || !userData?.tenant_id) {
        debug('No tenant_id found for user', { userId: user.id });
        return new Response(
          JSON.stringify({ error: 'User tenant not found' }),
          {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      
      tenantId = userData.tenant_id;
    } else {
      tenantId = userTenant.tenant_id;
    }
    
    debug('Found tenant_id', { tenantId });

    // Step 1: Transcribe the audio
    let transcribedText;
    try {
      transcribedText = await transcribeAudio(audioUrl);
      debug('Audio transcribed successfully', { textLength: transcribedText.length });
    } catch (error: any) {
      debug('Transcription failed', error);
      return new Response(
        JSON.stringify({ 
          error: 'Transcription failed', 
          details: error.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 2: Extract structured data from the transcription
    let structuredData;
    try {
      structuredData = await extractStructuredData(transcribedText);
      debug('Structured data extracted', structuredData);
    } catch (error: any) {
      debug('Structured data extraction failed', error);
      // Create a fallback structured data
      structuredData = {
        event_type: 'note',
        summary: transcribedText.substring(0, 100) + (transcribedText.length > 100 ? '...' : ''),
        raw_text: transcribedText
      };
    }

    // Step 3: Store multiple events in the database
    // First, create a diary entry to store the full transcription
    const { data: diaryData, error: diaryError } = await supabaseAdmin
      .from('diary_entries')
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        raw_text: structuredData.raw_text,
        audio_file_id: fileId,
        duration: duration,
      })
      .select();
      
    if (diaryError) {
      debug('Error storing diary entry', diaryError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to store diary entry', 
          details: diaryError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const diaryEntryId = diaryData?.[0]?.id;
    debug('Diary entry stored successfully', { diaryEntryId });
    
    // Check if we have any events to store
    if (!structuredData.events || structuredData.events.length === 0) {
      debug('No events extracted from transcription');
      return new Response(
        JSON.stringify({
          success: true,
          transcription: transcribedText,
          structured_data: structuredData,
          diary_entry: diaryData?.[0],
          events: []
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Now store each extracted event with a reference to the diary entry
    const eventInserts = structuredData.events.map(event => {
      // Parse the event_time if available
      let eventTime = new Date(); // Default to current time
      
      if (event.event_time) {
        try {
          // Try to parse time formats like "10 a.m.", "10:30", etc.
          const timeString = event.event_time.toLowerCase();
          
          // Handle formats like "10 a.m.", "10am", etc.
          const amPmMatch = timeString.match(/([0-9]{1,2})(?::([0-9]{1,2}))?\s*([ap]\.?m\.?)?/);
          if (amPmMatch) {
            const hours = parseInt(amPmMatch[1]);
            const minutes = amPmMatch[2] ? parseInt(amPmMatch[2]) : 0;
            const isPM = amPmMatch[3] && amPmMatch[3].startsWith('p');
            
            eventTime = new Date();
            // Convert to 24-hour format if PM
            let hour24 = hours;
            if (isPM && hours < 12) hour24 += 12;
            if (!isPM && hours === 12) hour24 = 0;
            
            eventTime.setHours(hour24);
            eventTime.setMinutes(minutes);
            eventTime.setSeconds(0);
            eventTime.setMilliseconds(0);
            
            debug('Parsed event time', { 
              original: event.event_time, 
              parsed: eventTime.toISOString(),
              hours, minutes, isPM
            });
          }
          // Handle 24-hour format like "14:30"
          else if (timeString.match(/^([0-9]{1,2}):([0-9]{1,2})$/)) {
            const [hours, minutes] = timeString.split(':').map(Number);
            eventTime = new Date();
            eventTime.setHours(hours);
            eventTime.setMinutes(minutes);
            eventTime.setSeconds(0);
            eventTime.setMilliseconds(0);
            
            debug('Parsed 24-hour event time', { 
              original: event.event_time, 
              parsed: eventTime.toISOString() 
            });
          }
        } catch (e) {
          debug('Error parsing event time', { error: e.message, time: event.event_time });
          // Keep using default current time
        }
      }
      
      return {
        tenant_id: tenantId,
        user_id: user.id,
        diary_entry_id: diaryEntryId,
        event_type: event.event_type,
        start_time: eventTime, // Use parsed time or current time as fallback
        metrics: event.metrics,
        tags: event.tags,
        summary: event.summary,
        raw_text: event.text_snippet,
        metadata: {
          confidence_score: event.confidence_score,
          event_hash: event.event_hash,
          event_time: event.event_time,
          text_snippet: event.text_snippet
        }
      };
    });
    
    debug('Inserting events', { count: eventInserts.length, events: eventInserts });
    
    const { data: eventData, error: eventError } = await supabaseAdmin
      .from('events')
      .insert(eventInserts)
      .select();

    if (eventError) {
      debug('Error storing event', eventError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to store event', 
          details: eventError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    debug('Event stored successfully', { eventId: eventData?.[0]?.id });
    
    // Return the transcription and structured data with all events
    return new Response(
      JSON.stringify({
        success: true,
        transcription: transcribedText,
        structured_data: structuredData,
        diary_entry: diaryData?.[0],
        events: eventData
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in transcribe-audio function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
})
