-- Fix infinite recursion in users_to_tenants RLS policy

-- First, drop any existing policies on the users_to_tenants table that might be causing issues
DROP POLICY IF EXISTS users_to_tenants_tenant_isolation ON users_to_tenants;
DROP POLICY IF EXISTS users_to_tenants_select_policy ON users_to_tenants;
DROP POLICY IF EXISTS users_to_tenants_insert_policy ON users_to_tenants;
DROP POLICY IF EXISTS users_to_tenants_update_policy ON users_to_tenants;
DROP POLICY IF EXISTS users_to_tenants_delete_policy ON users_to_tenants;

-- Make sure RLS is enabled on the table
ALTER TABLE users_to_tenants ENABLE ROW LEVEL SECURITY;

-- Create a new policy for SELECT operations
-- This allows users to see only the tenant associations they belong to
CREATE POLICY users_to_tenants_select_policy ON users_to_tenants
FOR SELECT USING (
  user_id = auth.uid() OR
  tenant_id IN (
    SELECT tenant_id FROM users_to_tenants 
    WHERE user_id = auth.uid()
  )
);

-- Create a new policy for INSERT operations
-- This allows users to insert new associations only for themselves
CREATE POLICY users_to_tenants_insert_policy ON users_to_tenants
FOR INSERT WITH CHECK (
  user_id = auth.uid() OR
  -- Only allow inserting other users if the current user is an owner/admin of the tenant
  EXISTS (
    SELECT 1 FROM users_to_tenants
    WHERE user_id = auth.uid()
    AND tenant_id = users_to_tenants.tenant_id
    AND role = 'owner'
  )
);

-- Create a new policy for UPDATE operations
-- This allows users to update associations only if they are an owner of the tenant
CREATE POLICY users_to_tenants_update_policy ON users_to_tenants
FOR UPDATE USING (
  -- Only allow updating if the current user is an owner/admin of the tenant
  EXISTS (
    SELECT 1 FROM users_to_tenants
    WHERE user_id = auth.uid()
    AND tenant_id = users_to_tenants.tenant_id
    AND role = 'owner'
  )
);

-- Create a new policy for DELETE operations
-- This allows users to delete associations only if they are an owner of the tenant
CREATE POLICY users_to_tenants_delete_policy ON users_to_tenants
FOR DELETE USING (
  user_id = auth.uid() OR
  -- Only allow deleting other users if the current user is an owner/admin of the tenant
  EXISTS (
    SELECT 1 FROM users_to_tenants
    WHERE user_id = auth.uid()
    AND tenant_id = users_to_tenants.tenant_id
    AND role = 'owner'
  )
);

-- Fix RLS policies for the babies table
DROP POLICY IF EXISTS babies_tenant_isolation ON babies;
ALTER TABLE babies ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows access to baby records only for users who belong to the tenant
CREATE POLICY babies_tenant_isolation ON babies
FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM users_to_tenants
    WHERE user_id = auth.uid()
  )
);

-- Fix RLS policies for the invitations table
DROP POLICY IF EXISTS invitations_tenant_isolation ON invitations;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows access to invitation records only for users who belong to the tenant
CREATE POLICY invitations_tenant_isolation ON invitations
FOR ALL USING (
  tenant_id IN (
    SELECT tenant_id FROM users_to_tenants
    WHERE user_id = auth.uid()
  )
);
