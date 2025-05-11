#!/bin/bash

# Script to test the invite-partner Edge Function

# Replace these values with your actual credentials
SUPABASE_URL="https://iilhyjtyummsrkphjhpi.supabase.co"
# You'll need to add your service role key here
SUPABASE_SERVICE_ROLE_KEY="YOUR_SERVICE_ROLE_KEY"

# Get an access token by signing in a test user
# This requires a valid user in your Supabase project
echo "Getting access token for test user..."
AUTH_RESPONSE=$(curl -s "$SUPABASE_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "YOUR_TEST_USER_EMAIL",
    "password": "YOUR_TEST_USER_PASSWORD"
  }')

# Extract the access token
ACCESS_TOKEN=$(echo $AUTH_RESPONSE | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Failed to get access token. Check your credentials."
  exit 1
fi

echo "Access token obtained successfully."

# Test the Edge Function with the access token
echo "Testing the invite-partner Edge Function..."
curl -v "$SUPABASE_URL/functions/v1/invite-partner" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "partner@example.com",
    "role": "co-parent"
  }'

echo -e "\nEdge Function test completed."
