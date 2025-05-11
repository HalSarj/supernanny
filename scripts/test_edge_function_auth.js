// Test the Edge Function with proper authentication
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

// Create a Supabase admin client with the service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testEdgeFunction() {
  try {
    console.log('Testing Edge Function with proper authentication...');
    
    // Step 1: Create a test user if needed
    const testEmail = 'test-user@example.com';
    const testPassword = 'password123';
    
    // Check if user exists
    const { data: existingUser, error: userLookupError } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1,
      page: 1,
      filter: {
        email: testEmail
      }
    });
    
    let userId;
    
    if (existingUser && existingUser.users && existingUser.users.length > 0) {
      console.log('Using existing test user:', existingUser.users[0].id);
      userId = existingUser.users[0].id;
    } else {
      console.log('Creating new test user...');
      const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      });
      
      if (createUserError) {
        console.error('Error creating test user:', createUserError);
        return;
      }
      
      userId = newUser.user.id;
      console.log('Created new test user:', userId);
    }
    
    // Step 2: Ensure the user has a tenant
    // First check if user already has a tenant association
    const { data: existingTenant, error: tenantLookupError } = await supabaseAdmin
      .from('users_to_tenants')
      .select('tenant_id')
      .eq('user_id', userId)
      .single();
    
    let tenantId;
    
    if (existingTenant && existingTenant.tenant_id) {
      console.log('User already has tenant association:', existingTenant.tenant_id);
      tenantId = existingTenant.tenant_id;
    } else {
      // Create a new tenant
      const { data: newTenant, error: createTenantError } = await supabaseAdmin
        .from('tenants')
        .insert({
          name: 'Test Family'
        })
        .select();
      
      if (createTenantError) {
        console.error('Error creating tenant:', createTenantError);
        return;
      }
      
      tenantId = newTenant[0].id;
      console.log('Created new tenant:', tenantId);
      
      // Associate user with tenant
      const { error: associationError } = await supabaseAdmin
        .from('users_to_tenants')
        .insert({
          user_id: userId,
          tenant_id: tenantId
        });
      
      if (associationError) {
        console.error('Error associating user with tenant:', associationError);
        return;
      }
      
      console.log('Associated user with tenant');
      
      // Create a user record if it doesn't exist
      const { data: userRecord, error: userRecordError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();
      
      if (!userRecord) {
        const { error: createUserRecordError } = await supabaseAdmin
          .from('users')
          .insert({
            id: userId,
            name: 'Test User',
            tenant_id: tenantId
          });
        
        if (createUserRecordError) {
          console.error('Error creating user record:', createUserRecordError);
          return;
        }
        
        console.log('Created user record');
      }
    }
    
    // Step 3: Sign in as the test user to get a valid token
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.error('Error signing in as test user:', signInError);
      return;
    }
    
    const accessToken = signInData.session.access_token;
    console.log('Signed in as test user, got access token');
    
    // Step 4: Call the Edge Function with the access token
    console.log('Calling Edge Function...');
    
    // Create a client with the user's token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    });
    
    const { data, error } = await userClient.functions.invoke('invite-partner', {
      body: {
        email: 'partner@example.com',
        role: 'co-parent'
      }
    });
    
    if (error) {
      console.error('Error calling Edge Function:', error);
      return;
    }
    
    console.log('Edge Function response:', data);
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testEdgeFunction();
