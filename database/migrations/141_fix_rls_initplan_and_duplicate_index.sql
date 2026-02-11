-- =============================================================================
-- MIGRATION: Fix RLS initplan warnings + duplicate exercise_library index
-- Safe/idempotent batch:
-- 1) Rewrites existing policy predicates to use (select auth.*()) pattern
-- 2) Drops duplicate unique index on public.exercise_library(id, version)
-- =============================================================================

DO $$
DECLARE
  p RECORD;
  qual_text text;
  with_check_text text;
  new_qual text;
  new_with_check text;
BEGIN
  FOR p IN
    SELECT
      n.nspname AS schemaname,
      c.relname AS tablename,
      pol.polname AS policyname,
      pg_get_expr(pol.polqual, pol.polrelid) AS qual_expr,
      pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check_expr
    FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
  LOOP
    qual_text := p.qual_expr;
    with_check_text := p.with_check_expr;
    new_qual := qual_text;
    new_with_check := with_check_text;

    -- Rewrite USING expression
    IF new_qual IS NOT NULL THEN
      -- Protect already-wrapped calls
      new_qual := regexp_replace(new_qual, '\(\s*select\s+auth\.uid\(\)\s*\)', '__AUTH_UID_WRAPPED__', 'gi');
      new_qual := regexp_replace(new_qual, '\(\s*select\s+auth\.role\(\)\s*\)', '__AUTH_ROLE_WRAPPED__', 'gi');
      new_qual := regexp_replace(new_qual, '\(\s*select\s+current_setting\(([^)]*)\)\s*\)', '__CURRENT_SETTING_WRAPPED__(\1)', 'gi');

      -- Wrap direct calls
      new_qual := regexp_replace(new_qual, 'auth\.uid\(\)', '(select auth.uid())', 'gi');
      new_qual := regexp_replace(new_qual, 'auth\.role\(\)', '(select auth.role())', 'gi');
      new_qual := regexp_replace(new_qual, 'current_setting\(([^)]*)\)', '(select current_setting(\1))', 'gi');

      -- Restore protected placeholders
      new_qual := replace(new_qual, '__AUTH_UID_WRAPPED__', '(select auth.uid())');
      new_qual := replace(new_qual, '__AUTH_ROLE_WRAPPED__', '(select auth.role())');
      new_qual := regexp_replace(new_qual, '__CURRENT_SETTING_WRAPPED__\(([^)]*)\)', '(select current_setting(\1))', 'gi');
    END IF;

    -- Rewrite WITH CHECK expression
    IF new_with_check IS NOT NULL THEN
      new_with_check := regexp_replace(new_with_check, '\(\s*select\s+auth\.uid\(\)\s*\)', '__AUTH_UID_WRAPPED__', 'gi');
      new_with_check := regexp_replace(new_with_check, '\(\s*select\s+auth\.role\(\)\s*\)', '__AUTH_ROLE_WRAPPED__', 'gi');
      new_with_check := regexp_replace(new_with_check, '\(\s*select\s+current_setting\(([^)]*)\)\s*\)', '__CURRENT_SETTING_WRAPPED__(\1)', 'gi');

      new_with_check := regexp_replace(new_with_check, 'auth\.uid\(\)', '(select auth.uid())', 'gi');
      new_with_check := regexp_replace(new_with_check, 'auth\.role\(\)', '(select auth.role())', 'gi');
      new_with_check := regexp_replace(new_with_check, 'current_setting\(([^)]*)\)', '(select current_setting(\1))', 'gi');

      new_with_check := replace(new_with_check, '__AUTH_UID_WRAPPED__', '(select auth.uid())');
      new_with_check := replace(new_with_check, '__AUTH_ROLE_WRAPPED__', '(select auth.role())');
      new_with_check := regexp_replace(new_with_check, '__CURRENT_SETTING_WRAPPED__\(([^)]*)\)', '(select current_setting(\1))', 'gi');
    END IF;

    IF new_qual IS DISTINCT FROM qual_text THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I USING (%s)',
        p.policyname,
        p.schemaname,
        p.tablename,
        new_qual
      );
    END IF;

    IF new_with_check IS DISTINCT FROM with_check_text THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I WITH CHECK (%s)',
        p.policyname,
        p.schemaname,
        p.tablename,
        new_with_check
      );
    END IF;
  END LOOP;
END $$;

-- Keep primary key index, drop duplicate unique index if present
DROP INDEX IF EXISTS public.idx_exercise_library_id_version;

