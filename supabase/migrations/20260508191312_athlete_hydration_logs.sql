-- ATHLETE HYDRATION LOGS — see local migration file for design rationale.

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

DROP TRIGGER IF EXISTS trg_athlete_hydration_logs_updated_at
  ON public.athlete_hydration_logs;
CREATE TRIGGER trg_athlete_hydration_logs_updated_at
  BEFORE UPDATE ON public.athlete_hydration_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.athlete_hydration_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hydration_logs_select_own ON public.athlete_hydration_logs;
CREATE POLICY hydration_logs_select_own
  ON public.athlete_hydration_logs
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

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

DROP POLICY IF EXISTS hydration_logs_insert_own ON public.athlete_hydration_logs;
CREATE POLICY hydration_logs_insert_own
  ON public.athlete_hydration_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS hydration_logs_update_own ON public.athlete_hydration_logs;
CREATE POLICY hydration_logs_update_own
  ON public.athlete_hydration_logs
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS hydration_logs_delete_own ON public.athlete_hydration_logs;
CREATE POLICY hydration_logs_delete_own
  ON public.athlete_hydration_logs
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

COMMENT ON TABLE public.athlete_hydration_logs IS
  'Per-event fluid intake log. One row per drink. Powers hydration progress on the today/tournament-nutrition surfaces and feeds push-notification adherence.';
COMMENT ON COLUMN public.athlete_hydration_logs.amount_ml IS
  'Volume in milliliters (1 to 5000). Larger values are rejected.';
COMMENT ON COLUMN public.athlete_hydration_logs.source IS
  'How the log entered the system. manual | push_notification | wearable | voice.';
