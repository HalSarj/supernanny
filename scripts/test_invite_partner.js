// Script to test the invite-partner Edge Function
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Load environment variables manually since dotenv has issues with relative paths
const envPath = path.resolve(__dirname, '../ai-super-nanny-frontend/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = envContent.split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    acc[match[1]] = match[2];
  }
  return acc;
}, {});

// Set environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY = envVars.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client with the service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInvitePartner() {
  try {
    // 1. Get the user we want to test with
    const userId = 'f9085cb3-3c8e-48b7-b7e9-8ca7dae3d06c'; // The user ID we found in the database
    
    // 2. Generate a custom JWT token for this user using the admin API
    const { data: authData, error: authError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: 'hal_sarjant@hotmail.com', // The email of the user we found
    });

    if (authError) {
      console.error('Error generating auth token:', authError);
      return;
    }

    const accessToken = authData.properties.access_token;
    console.log('Generated access token for user');
    
    // 3. Create a new Supabase client with the user's token
    const userClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
    
    // 4. Call the Edge Function
    const { data, error } = await userClient.functions.invoke('invite-partner', {
      body: {
        email: 'test-partner@example.com',
        role: 'co-parent',
      },
    });
    
    if (error) {
      console.error('Error calling Edge Function:', error);
      return;
    }
    
    console.log('Edge Function response:', data);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testInvitePartner();
