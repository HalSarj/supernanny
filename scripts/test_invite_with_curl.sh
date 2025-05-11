#!/bin/bash

# Script to test the invite-partner Edge Function using curl

# Get environment variables from .env file
ENV_FILE="../ai-super-nanny-frontend/.env"
SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL $ENV_FILE | cut -d '=' -f2)
SUPABASE_SERVICE_KEY=$(grep NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY $ENV_FILE | cut -d '=' -f2)

# User information
USER_EMAIL="hal_sarjant@hotmail.com"
USER_ID="f9085cb3-3c8e-48b7-b7e9-8ca7dae3d06c"

echo "Testing Edge Function with service role key..."
echo "Supabase URL: $SUPABASE_URL"

# Step 1: Generate a sign-in link for the user (which gives us a token)
echo "Generating sign-in link for user..."
AUTH_RESPONSE=$(curl -s "$SUPABASE_URL/auth/v1/admin/generate-link" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"type\":\"magiclink\",\"email\":\"$USER_EMAIL\"}")

# Extract the access token
ACCESS_TOKEN=$(echo $AUTH_RESPONSE | grep -o '"access_token":"[^"]*' | sed 's/"access_token":"//')

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Failed to get access token. Response:"
  echo $AUTH_RESPONSE
  exit 1
fi

echo "Access token obtained successfully."

# Step 2: Test the Edge Function with the access token
echo "Testing the invite-partner Edge Function..."
curl -v "$SUPABASE_URL/functions/v1/invite-partner" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "partner@example.com",
    "role": "co-parent"
  }'

echo -e "\nEdge Function test completed."
