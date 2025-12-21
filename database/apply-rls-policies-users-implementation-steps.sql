-- ============================================================================
-- Apply RLS Policies for users and implementation_steps tables
-- Run this script in your Neon DB / Supabase SQL Editor to fix linter errors
-- ============================================================================
--
-- UPGRADES:
-- - Optimized auth.uid() calls wrapped in (SELECT ...) for better performance
-- - Added RLS enablement checks
-- - Added verification queries
-- - Improved comments and documentation
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable Row Level Security (if not already enabled)
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.implementation_steps ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop existing policies if they exist (to avoid conflicts)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view public profiles" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;

DROP POLICY IF EXISTS "Users can view own implementation steps" ON public.implementation_steps;
DROP POLICY IF EXISTS "Users can insert own implementation steps" ON public.implementation_steps;
DROP POLICY IF EXISTS "Users can update own implementation steps" ON public.implementation_steps;
DROP POLICY IF EXISTS "Users can delete own implementation steps" ON public.implementation_steps;

-- ============================================================================
-- STEP 3: Create RLS Policies for users table
-- ============================================================================
-- Note: users.id is UUID, optimized auth.uid() calls wrapped in (SELECT ...)
-- for better query performance

CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
TO authenticated
USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can view public profiles"
ON public.users
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own profile"
ON public.users
FOR DELETE
TO authenticated
USING (id = (SELECT auth.uid()));

-- ============================================================================
-- STEP 4: Create RLS Policies for implementation_steps table
-- ============================================================================
-- Note: implementation_steps.user_id is UUID, optimized auth.uid() calls

CREATE POLICY "Users can view own implementation steps"
ON public.implementation_steps
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own implementation steps"
ON public.implementation_steps
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own implementation steps"
ON public.implementation_steps
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own implementation steps"
ON public.implementation_steps
FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- Verify policies were created
-- ============================================================================
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'implementation_steps')
ORDER BY tablename, policyname;
