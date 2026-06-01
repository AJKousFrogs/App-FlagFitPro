-- Onboarding flow persists extended training/consent fields to public.user_preferences.
-- This table was referenced by the Angular client but missing from provisioned databases.

CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text,
  schedule_type text,
  practices_per_week integer,
  practice_days text[] NOT NULL DEFAULT '{}'::text[],
  morning_mobility text,
  evening_mobility text,
  foam_rolling_time text,
  rest_day_preference text,
  training_goals text[] NOT NULL DEFAULT '{}'::text[],
  equipment_available text[] NOT NULL DEFAULT '{}'::text[],
  current_injuries jsonb NOT NULL DEFAULT '[]'::jsonb,
  injury_history text[] NOT NULL DEFAULT '{}'::text[],
  medical_notes text,
  enable_reminders boolean NOT NULL DEFAULT true,
  reminder_time text,
  notification_preferences text[] NOT NULL DEFAULT '{}'::text[],
  consent_terms_of_service boolean NOT NULL DEFAULT false,
  consent_privacy_policy boolean NOT NULL DEFAULT false,
  consent_data_usage boolean NOT NULL DEFAULT false,
  consent_ai_coach boolean NOT NULL DEFAULT false,
  consent_email_updates boolean NOT NULL DEFAULT false,
  consent_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_preferences_email
  ON public.user_preferences (email)
  WHERE email IS NOT NULL;

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own user preferences" ON public.user_preferences;
CREATE POLICY "Users can view own user preferences"
  ON public.user_preferences
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own user preferences" ON public.user_preferences;
CREATE POLICY "Users can insert own user preferences"
  ON public.user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own user preferences" ON public.user_preferences;
CREATE POLICY "Users can update own user preferences"
  ON public.user_preferences
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP TRIGGER IF EXISTS user_preferences_set_updated_at ON public.user_preferences;
CREATE TRIGGER user_preferences_set_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMENT ON TABLE public.user_preferences IS 'Onboarding and training preference snapshot keyed by auth user; complements athlete_training_config.';
