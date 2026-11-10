-- ============================================================================
-- AccessAI - Clerk Identity & PostgreSQL Profile Migration
-- Migration: 20261107000003_clerk_identity_profiles.sql
-- ============================================================================

-- 1. Ensure pgcrypto extension is available for random UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Modify profiles table to support Clerk string-based identity ('sub')
DO $$
BEGIN
    -- Add clerk_user_id column if it doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'clerk_user_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN clerk_user_id TEXT;
    END IF;

    -- Add email column if it doesn't already exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'email'
    ) THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
    END IF;

    -- Add unique constraint on clerk_user_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_profiles_clerk_user_id'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT uq_profiles_clerk_user_id UNIQUE (clerk_user_id);
    END IF;

    -- Drop legacy foreign key to Supabase auth.users if present
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_id_fkey'
    ) THEN
        ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
    END IF;

    -- Set default gen_random_uuid() for profiles.id
    ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

    -- Ensure skills column is JSONB for universal JSON array support
    ALTER TABLE profiles ALTER COLUMN skills DROP DEFAULT;
    ALTER TABLE profiles ALTER COLUMN skills TYPE JSONB USING to_jsonb(skills);
    ALTER TABLE profiles ALTER COLUMN skills SET DEFAULT '[]'::jsonb;
END $$;

-- 3. Create indexes for fast Clerk identity lookups
CREATE INDEX IF NOT EXISTS idx_profiles_clerk_user_id ON profiles(clerk_user_id);

-- 4. Clerk RLS Policies
-- Enables user isolation via Clerk JWT claims ('sub') or session context setting
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clerk users can view their own profile" ON profiles;
CREATE POLICY "Clerk users can view their own profile"
    ON profiles FOR SELECT
    USING (
        clerk_user_id = COALESCE(
            NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'sub', ''),
            NULLIF(current_setting('app.current_user_id', true), '')
        )
    );

DROP POLICY IF EXISTS "Clerk users can insert their own profile" ON profiles;
CREATE POLICY "Clerk users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (
        clerk_user_id = COALESCE(
            NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'sub', ''),
            NULLIF(current_setting('app.current_user_id', true), '')
        )
    );

DROP POLICY IF EXISTS "Clerk users can update their own profile" ON profiles;
CREATE POLICY "Clerk users can update their own profile"
    ON profiles FOR UPDATE
    USING (
        clerk_user_id = COALESCE(
            NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'sub', ''),
            NULLIF(current_setting('app.current_user_id', true), '')
        )
    )
    WITH CHECK (
        clerk_user_id = COALESCE(
            NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'sub', ''),
            NULLIF(current_setting('app.current_user_id', true), '')
        )
    );

