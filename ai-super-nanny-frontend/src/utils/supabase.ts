import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Create a Supabase client for use in the browser (client components)
 */
export const createBrowserSupabaseClient = () => {
  return createBrowserClient(supabaseUrl, supabaseKey);
};

/**
 * Create a Supabase client for use in server components
 */
export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseKey);
};

