// Follow Deno and Supabase Edge Function conventions
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Debug function to log information
const debug = (message: string, data?: any) => {
  console.log(`[INVITE-PARTNER] ${message}`, data ? JSON.stringify(data) : '');
}

interface InviteRequest {
  email: string;
  role: string;
}

const generateUniqueCode = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    debug('Function invoked with method', req.method);
    debug('Authorization header present', req.headers.has('Authorization'));
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    debug('Environment variables', { 
      supabaseUrl: supabaseUrl ? 'Set' : 'Not set',
      supabaseAnonKey: supabaseAnonKey ? 'Set' : 'Not set',
      supabaseServiceKey: supabaseServiceKey ? 'Set' : 'Not set'
    });
    
    // Create two Supabase clients:
    // 1. With the user's auth context for authentication
    // 2. With service role key for database operations that bypass RLS
    const supabaseClient = createClient(
      supabaseUrl ?? '',
      supabaseAnonKey ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )
    
    // Service role client that can bypass RLS policies
    const supabaseAdmin = createClient(
      supabaseUrl ?? '',
      supabaseServiceKey ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get the authenticated user from the request using the token directly
    const authHeader = req.headers.get('Authorization');
    debug('Auth header', { present: !!authHeader });
    
    if (!authHeader) {
      debug('No Authorization header found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: 'No Authorization header provided' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    debug('Token extracted', { tokenLength: token.length });
    
    const { data, error: userError } = await supabaseClient.auth.getUser(token);
    const user = data?.user;
    
    debug('Auth response', { 
      userFound: !!user, 
      userId: user?.id, 
      error: userError?.message 
    });

    if (userError || !user) {
      debug('Authentication failed', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Parse the request body
    let email, role;
    try {
      const requestData = await req.json() as InviteRequest;
      email = requestData.email;
      role = requestData.role;
      debug('Request body parsed', { email, role });
    } catch (error: any) {
      debug('Error parsing request body', error);
      return new Response(
        JSON.stringify({ error: 'Invalid request body', details: error.message }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate the request
    if (!email || !role) {
      debug('Missing required fields', { email, role });
      return new Response(
        JSON.stringify({ error: 'Email and role are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate a unique invitation code
    const code = generateUniqueCode();
    debug('Generated invitation code', { code });
    
    // Get the user's tenant ID either from users_to_tenants or directly from users table
    let tenantId: string | null = null;
    
    // First try to get from users_to_tenants (primary source)
    debug('Fetching tenant_id from users_to_tenants');
    const { data: userTenant, error: tenantError } = await supabaseClient
      .from('users_to_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single();
    
    if (tenantError) {
      debug('Error fetching from users_to_tenants', tenantError);
    }
    
    if (userTenant?.tenant_id) {
      tenantId = userTenant.tenant_id;
      debug('Found tenant_id in users_to_tenants', { tenantId });
    } else {
      // Fallback to users table tenant_id
      debug('Fetching tenant_id from users table');
      const { data: userData, error: userDataError } = await supabaseClient
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();
      
      if (userDataError) {
        debug('Error fetching from users table', userDataError);
      }
      
      if (userData?.tenant_id) {
        tenantId = userData.tenant_id;
        debug('Found tenant_id in users table', { tenantId });
      }
    }
    
    if (!tenantId) {
      debug('No tenant_id found for user', { userId: user.id });
      return new Response(
        JSON.stringify({ error: 'User tenant not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Store the invitation in the database using the admin client to bypass RLS
    debug('Inserting invitation into database', { email, role, tenantId });
    const { data: inviteData, error: inviteError } = await supabaseAdmin
      .from('invitations')
      .insert({
        email,
        role,
        code,
        tenant_id: tenantId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      })
      .select();

    if (inviteError) {
      debug('Error creating invitation', inviteError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create invitation', 
          details: inviteError.message,
          code: inviteError.code
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    debug('Invitation created successfully', { inviteId: inviteData?.[0]?.id });
    // In a production environment, you would send an email here
    // For now, we'll just return success with the code
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Invitation sent successfully',
        code, // In production, this would be sent via email only
        data: inviteData?.[0]
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in invite-partner function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
