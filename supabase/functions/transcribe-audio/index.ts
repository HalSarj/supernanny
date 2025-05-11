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
interface ExtractedData {
  event_type: string;
  event_time?: string;
  metrics?: Record<string, any>;
  tags?: string[];
  summary: string;
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
 * Extracts structured data from transcribed text using OpenAI
 * @param text Transcribed text from the audio
 * @returns Structured data with event type, metrics, and summary
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
    debug('Preparing request to OpenAI Chat API');
    const requestBody = {
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant that helps parents track baby events. 
          Extract structured data from the parent's voice note. 
          Identify the event type (feeding, diaper, sleep, milestone, etc.), 
          any metrics mentioned (amount, duration, etc.), 
          and create a brief summary. 
          If times are mentioned, standardize them to 24-hour format.
          If the text doesn't clearly describe a baby-related event, categorize it as "note".`
        },
        {
          role: 'user',
          content: text
        }
      ],
      functions: [
        {
          name: 'extract_baby_event',
          description: 'Extract structured data about a baby event from text',
          parameters: {
            type: 'object',
            properties: {
              event_type: {
                type: 'string',
                description: 'The type of event (feeding, diaper, sleep, milestone, measurement, note, etc.)',
                enum: ['feeding', 'diaper', 'sleep', 'milestone', 'measurement', 'bath', 'medication', 'activity', 'note']
              },
              event_time: {
                type: 'string',
                description: 'The time of the event in 24-hour format (HH:MM) if mentioned, or null'
              },
              metrics: {
                type: 'object',
                description: 'Any metrics mentioned in the event (amount, duration, weight, etc.)',
                properties: {
                  amount: { type: 'number', description: 'Amount in oz or ml for feeding' },
                  duration: { type: 'number', description: 'Duration in minutes' },
                  weight: { type: 'number', description: 'Weight in pounds or kg' },
                  height: { type: 'number', description: 'Height in inches or cm' },
                  temperature: { type: 'number', description: 'Temperature in F or C' },
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
              }
            },
            required: ['event_type', 'summary']
          }
        }
      ],
      function_call: { name: 'extract_baby_event' }
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
    
    const extractedData = JSON.parse(functionCall.arguments) as ExtractedData;
    extractedData.raw_text = text;
    
    debug('Structured data extraction successful', extractedData);
    return extractedData;
  } catch (error) {
    debug('Structured data extraction error', { error: error instanceof Error ? error.message : String(error) });
    // Fallback to basic extraction if advanced fails
    return {
      event_type: 'note',
      summary: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
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

    // Step 3: Store the event in the database
    const { data: eventData, error: eventError } = await supabaseAdmin
      .from('events')
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        event_type: structuredData.event_type,
        event_time: structuredData.event_time,
        metrics: structuredData.metrics,
        tags: structuredData.tags,
        summary: structuredData.summary,
        raw_text: structuredData.raw_text,
        audio_file_id: fileId,
        duration: duration,
      })
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
    
    // Return the transcription and structured data
    return new Response(
      JSON.stringify({
        success: true,
        transcription: transcribedText,
        structured_data: structuredData,
        event: eventData?.[0]
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
