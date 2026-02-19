-- Migration: Database hardening and cleanup
-- Date: 2026-02-17
-- Purpose:
-- 1) Apply security hardening to existing function definitions.
-- 2) Ensure physical_measurements structure is compatible and non-destructive.
-- 3) Ensure performance index and view security settings are in place.

-- ============================================================================
-- Function hardening: explicit search_path on SECURITY DEFINER trigger functions
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'sync_wellness_entry_to_log'
  ) THEN
    ALTER FUNCTION public.sync_wellness_entry_to_log() SET search_path = public;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_nutrition_goals_updated_at'
  ) THEN
    ALTER FUNCTION public.update_nutrition_goals_updated_at() SET search_path = public;
  END IF;
END $$;

-- ============================================================================
-- physical_measurements hardening (non-destructive)
-- ============================================================================

ALTER TABLE IF EXISTS public.physical_measurements
  ADD COLUMN IF NOT EXISTS body_water_mass DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS fat_mass DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS protein_mass DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS bone_mineral_content DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS skeletal_muscle_mass DECIMAL(5,2),
  ADD COLUMN IF NOT EXISTS muscle_percentage DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS body_water_percentage DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS protein_percentage DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS bone_mineral_percentage DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS visceral_fat_rating INTEGER,
  ADD COLUMN IF NOT EXISTS basal_metabolic_rate INTEGER,
  ADD COLUMN IF NOT EXISTS waist_to_hip_ratio DECIMAL(4,2),
  ADD COLUMN IF NOT EXISTS body_age INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_physical_measurements_user_date
ON public.physical_measurements (user_id, created_at DESC);

-- Ensure policies exist without relying on migration order assumptions.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'physical_measurements'
      AND c.relkind = 'r'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'physical_measurements'
        AND policyname = 'Users can insert their own measurements'
    ) THEN
      CREATE POLICY "Users can insert their own measurements"
        ON public.physical_measurements
        FOR INSERT TO authenticated
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'physical_measurements'
        AND policyname = 'Users can view their own measurements'
    ) THEN
      CREATE POLICY "Users can view their own measurements"
        ON public.physical_measurements
        FOR SELECT TO authenticated
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'physical_measurements'
        AND policyname = 'Users can update their own measurements'
    ) THEN
      CREATE POLICY "Users can update their own measurements"
        ON public.physical_measurements
        FOR UPDATE TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'physical_measurements'
        AND policyname = 'Users can delete their own measurements'
    ) THEN
      CREATE POLICY "Users can delete their own measurements"
        ON public.physical_measurements
        FOR DELETE TO authenticated
        USING (auth.uid() = user_id);
    END IF;
  END IF;
END $$;

-- ============================================================================
-- View security hardening
-- ============================================================================

CREATE OR REPLACE VIEW public.physical_measurements_latest
WITH (security_invoker = true) AS
SELECT DISTINCT ON (pm.user_id)
  pm.id,
  pm.user_id,
  pm.weight,
  pm.height,
  pm.body_fat,
  pm.muscle_mass,
  pm.body_water_percentage,
  pm.visceral_fat_rating,
  pm.basal_metabolic_rate,
  pm.body_age,
  pm.created_at,
  LAG(pm.weight) OVER (PARTITION BY pm.user_id ORDER BY pm.created_at) AS previous_weight,
  LAG(pm.body_fat) OVER (PARTITION BY pm.user_id ORDER BY pm.created_at) AS previous_body_fat
FROM public.physical_measurements pm
ORDER BY pm.user_id, pm.created_at DESC;

GRANT SELECT ON public.physical_measurements_latest TO authenticated;
