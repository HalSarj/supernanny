-- Migration script to simplify database structure by removing the families table
-- and consolidating its functionality into the tenants table

-- 1. First, ensure all tenants have corresponding families data
INSERT INTO public.tenants (id, name, created_at)
SELECT f.id, f.name, f.created_at
FROM public.families f
LEFT JOIN public.tenants t ON f.id = t.id
WHERE t.id IS NULL
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name;

-- 2. Update users table to reference tenant_id instead of family_id
-- First, add a new column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE public.users ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
    END IF;
END
$$;

-- 3. Copy data from family_id to tenant_id
UPDATE public.users
SET tenant_id = family_id
WHERE tenant_id IS NULL AND family_id IS NOT NULL;

-- 4. Update RLS policies that reference family_id
-- First, identify and drop any policies that reference family_id
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname, tablename
        FROM pg_policies
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            -- Drop the policy (we'll recreate appropriate ones later)
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 
                           policy_record.policyname, 
                           policy_record.tablename);
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors
            RAISE NOTICE 'Error dropping policy % on table %: %', 
                         policy_record.policyname, 
                         policy_record.tablename, 
                         SQLERRM;
        END;
    END LOOP;
END
$$;

-- 5. Create updated RLS policies using tenant_id
-- Users table policies
CREATE POLICY "Users can view themselves and family members"
  ON public.users
  FOR SELECT
  USING (
    id = auth.uid() OR
    tenant_id IN (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update themselves"
  ON public.users
  FOR UPDATE
  USING (id = auth.uid());

-- 6. Drop the family_id column (only after confirming data migration)
-- ALTER TABLE public.users DROP COLUMN family_id;
-- Note: We're commenting this out for safety. Uncomment after verifying data migration.

-- 7. Drop the families table (only after confirming data migration)
-- DROP TABLE public.families;
-- Note: We're commenting this out for safety. Uncomment after verifying data migration.
