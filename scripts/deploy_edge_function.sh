#!/bin/bash

# Script to deploy the updated Edge Function

# Navigate to the project directory
cd /Users/halsarjant/CascadeProjects/supernanny

# Deploy the Edge Function using Supabase CLI
echo "Deploying the invite-partner Edge Function..."
supabase functions deploy invite-partner

echo "Edge Function deployed successfully!"
