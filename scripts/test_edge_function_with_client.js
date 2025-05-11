// Test the Edge Function using the Supabase JavaScript client
const { createClient } = require('@supabase/supabase-js');
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
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = envVars.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testEdgeFunction() {
  try {
    console.log('Testing Edge Function with Supabase client...');

    // 1. Sign in as the test user using the service role client
    console.log('Signing in as test user...');
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: 'hal_sarjant@hotmail.com',
      password: 'password123' // You'll need to replace this with the actual password
    });

    if (signInError) {
      console.error('Error signing in:', signInError);
      
      // If sign-in fails, try creating a new user
      console.log('Attempting to create a test user...');
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
        email: 'test-user@example.com',
        password: 'password123',
        email_confirm: true
      });
      
      if (userError) {
        console.error('Error creating user:', userError);
        return;
      }
      
      console.log('Test user created:', userData.user.id);
      
      // Create tenant association for the new user
      const { data: tenantData, error: tenantError } = await supabaseAdmin
        .from('tenants')
        .insert({
          name: 'Test Family'
        })
        .select();
        
      if (tenantError) {
        console.error('Error creating tenant:', tenantError);
        return;
      }
      
      const tenantId = tenantData[0].id;
      console.log('Created tenant:', tenantId);
      
      // Associate user with tenant
      const { error: userTenantError } = await supabaseAdmin
        .from('users_to_tenants')
        .insert({
          user_id: userData.user.id,
          tenant_id: tenantId
        });
        
      if (userTenantError) {
        console.error('Error associating user with tenant:', userTenantError);
        return;
      }
      
      console.log('User associated with tenant');
      
      // Sign in as the new user
      const { data: newSignInData, error: newSignInError } = await supabaseAdmin.auth.signInWithPassword({
        email: 'test-user@example.com',
        password: 'password123'
      });
      
      if (newSignInError) {
        console.error('Error signing in as new user:', newSignInError);
        return;
      }
      
      console.log('Signed in as new user');
    } else {
      console.log('Signed in as existing user:', signInData.user.id);
    }

    // 2. Call the Edge Function
    console.log('Calling Edge Function...');
    const { data, error } = await supabaseAdmin.functions.invoke('invite-partner', {
      body: {
        email: 'test-partner@example.com',
        role: 'co-parent'
      }
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

testEdgeFunction();
