-- =============================================================================
-- ATHLETE HYDRATION LOGS
-- Migration: 20260508130000_athlete_hydration_logs.sql
--
-- Purpose: persistent server-side hydration logging so push notifications
-- and wearables can write fluid intake events for an athlete, and the
-- canonical hydration target (PeriodizationService.today().nutrition.hydrationL)
-- can be evaluated against actual intake.
--
-- The current `tournament-nutrition` page tracks hydration in-memory and in
-- localStorage; this table is the canonical store the service tier reads
-- and writes. Migrating the page to read through this is a follow-up.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.athlete_hydration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_at timestamptz NOT NULL DEFAULT now(),
  amount_ml int NOT NULL,
  beverage_type text NOT NULL DEFAULT 'water',
  note text,
  source text NOT NULL DEFAULT 'manual',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT athlete_hydration_logs_amount_chk CHECK (
    amount_ml > 0 AND amount_ml <= 5000
  ),
  CONSTRAINT athlete_hydration_logs_beverage_type_chk CHECK (
    beverage_type IN (
      'water', 'electrolyte', 'sports-drink', 'smoothie',
      'protein-shake', 'coconut', 'other'
    )
  ),
  CONSTRAINT athlete_hydration_logs_source_chk CHECK (
    source IN ('manual', 'push_notification', 'wearable', 'voice')
  )
);

CREATE INDEX IF NOT EXISTS idx_athlete_hydration_logs_user_logged
  ON public.athlete_hydration_logs (user_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_athlete_hydration_logs_user_logged_date
  ON public.athlete_hydration_logs (user_id, ((logged_at AT TIME ZONE 'UTC')::date));

-- updated_at trigger (set_updated_at() helper already exists from
-- 20260327110000_reconcile_missing_feature_schema.sql)
DROP TRIGGER IF EXISTS trg_athlete_hydration_logs_updated_at
  ON public.athlete_hydration_logs;
CREATE TRIGGER trg_athlete_hydration_logs_updated_at
  BEFORE UPDATE ON public.athlete_hydration_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.athlete_hydration_logs ENABLE ROW LEVEL SECURITY;

-- Athletes read their own logs.
DROP POLICY IF EXISTS hydration_logs_select_own ON public.athlete_hydration_logs;
CREATE POLICY hydration_logs_select_own
  ON public.athlete_hydration_logs
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Team staff (coaches, physios, nutritionists) read logs of athletes on
-- the same team. Inline subquery rather than reusing ff_is_team_staff(team_id,
-- user_id) because hydration logs are per-user, not per-team — an athlete
-- may belong to multiple teams.
DROP POLICY IF EXISTS hydration_logs_select_team_staff ON public.athlete_hydration_logs;
CREATE POLICY hydration_logs_select_team_staff
  ON public.athlete_hydration_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.team_members staff
      JOIN public.team_members athlete
        ON athlete.team_id = staff.team_id
      WHERE staff.user_id = (SELECT auth.uid())
        AND athlete.user_id = athlete_hydration_logs.user_id
        AND staff.status = 'active'
        AND athlete.status = 'active'
        AND staff.role IN (
          'owner', 'admin', 'head_coach', 'coach', 'assistant_coach',
          'manager', 'physiotherapist', 'nutritionist'
        )
    )
  );

-- Athletes insert their own logs.
DROP POLICY IF EXISTS hydration_logs_insert_own ON public.athlete_hydration_logs;
CREATE POLICY hydration_logs_insert_own
  ON public.athlete_hydration_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Athletes update their own logs (e.g., correct an amount).
DROP POLICY IF EXISTS hydration_logs_update_own ON public.athlete_hydration_logs;
CREATE POLICY hydration_logs_update_own
  ON public.athlete_hydration_logs
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Athletes delete their own logs.
DROP POLICY IF EXISTS hydration_logs_delete_own ON public.athlete_hydration_logs;
CREATE POLICY hydration_logs_delete_own
  ON public.athlete_hydration_logs
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

COMMENT ON TABLE public.athlete_hydration_logs IS
  'Per-event fluid intake log. One row per drink. Powers hydration progress
   on the today/tournament-nutrition surfaces and feeds push-notification
   adherence.';
COMMENT ON COLUMN public.athlete_hydration_logs.amount_ml IS
  'Volume in milliliters (1 to 5000). Larger values are rejected — they
   are almost always input errors (gallons → ml).';
COMMENT ON COLUMN public.athlete_hydration_logs.source IS
  'How the log entered the system. manual = user tap; push_notification =
   acknowledged a reminder; wearable = synced from a tracker; voice = Siri/Alexa.';
