-- Monitoring: consumer WEARABLE HEALTH store (additive, one concern).
-- Raw rows readable by athlete + physio ONLY. Idempotent on
-- (user_id, source, metric, recorded_at).
--
-- Reversal: DROP TABLE IF EXISTS public.wearable_health;

CREATE TABLE IF NOT EXISTS public.wearable_health (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source        text NOT NULL,
  source_device text,
  metric        text NOT NULL,
  value         numeric,
  unit          text,
  recorded_at   timestamptz NOT NULL,
  consent_state text NOT NULL DEFAULT 'granted' CHECK (consent_state IN ('granted','revoked','pending')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source, metric, recorded_at)
);
CREATE INDEX IF NOT EXISTS idx_wearable_health_user_time ON public.wearable_health (user_id, recorded_at DESC);
ALTER TABLE public.wearable_health ENABLE ROW LEVEL SECURITY;

-- athlete own + physio roster only. NO sc_coach, NO head_coach.
CREATE POLICY wearable_health_own ON public.wearable_health
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY wearable_health_physio_read ON public.wearable_health
  FOR SELECT TO authenticated
  USING (public.can_role_read_athlete(user_id, ARRAY['physio']));
