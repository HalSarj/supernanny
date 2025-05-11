// Direct test of the invite-partner Edge Function using fetch
const path = require('path');
const fs = require('fs');

// Load environment variables manually
const envPath = path.resolve(__dirname, '../ai-super-nanny-frontend/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = envContent.split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    acc[match[1]] = match[2];
  }
  return acc;
}, {});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

async function testEdgeFunction() {
  try {
    console.log('Testing Edge Function with service role key...');
    
    // First, create a JWT token for a test user using the admin API
    console.log('Creating a JWT token for a test user...');
    
    // Create a JWT token for the existing user
    const userId = 'f9085cb3-3c8e-48b7-b7e9-8ca7dae3d06c'; // The user ID we found in the database
    const adminAuthResponse = await fetch(`${supabaseUrl}/auth/v1/admin/generate-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        type: 'magiclink',
        email: 'hal_sarjant@hotmail.com', // The email of the user we found
      })
    });
    
    const authData = await adminAuthResponse.json();
    console.log('Auth response status:', adminAuthResponse.status);
    
    if (!adminAuthResponse.ok) {
      console.error('Error generating auth token:', authData);
      return;
    }
    
    const accessToken = authData.properties.access_token;
    console.log('Generated access token for user');
    
    // Make a direct request to the Edge Function using the user's access token
    const response = await fetch(`${supabaseUrl}/functions/v1/invite-partner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        email: 'test-partner@example.com',
        role: 'co-parent'
      })
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error testing Edge Function:', error);
  }
}

testEdgeFunction();
