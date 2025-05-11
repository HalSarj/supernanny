// Follow Deno and Supabase Edge Function conventions
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0'

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface InviteRequest {
  email: string;
  role: string;
}

const generateUniqueCode = (): string => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create two Supabase clients:
    // 1. With the user's auth context for authentication
    // 2. With service role key for database operations that bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )
    
    // Service role client that can bypass RLS policies
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get the authenticated user from the request
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Get the request body
    const { email, role } = await req.json() as InviteRequest

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: 'Email and role are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Generate a unique invitation code
    const code = generateUniqueCode();
    
    // Get the user's tenant ID from the users_to_tenants table
    const { data: userTenant, error: tenantError } = await supabaseClient
      .from('users_to_tenants')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()
    
    if (tenantError || !userTenant?.tenant_id) {
      return new Response(
        JSON.stringify({ error: 'User tenant not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    
    const tenantId = userTenant.tenant_id

    // Store the invitation in the database using the admin client to bypass RLS
    const { error: inviteError } = await supabaseAdmin
      .from('invitations')
      .insert({
        email,
        role,
        code,
        tenant_id: tenantId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

    if (inviteError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create invitation' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // In a production environment, you would send an email here
    // For now, we'll just return success with the code
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Invitation sent successfully',
        code // In production, this would be sent via email only
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
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
