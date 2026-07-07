-- Wearable-health INGEST CONSENT (additive, one concern).
-- Records per-(athlete,source) opt-in that GATES wearable ingestion. Revoking
-- (state='revoked') stops further ingestion. Separate from athlete_consent_
-- settings (which governs coach-sharing, not device ingestion).
--
-- Reversal: DROP TABLE IF EXISTS public.wearable_consent;

CREATE TABLE IF NOT EXISTS public.wearable_consent (
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source     text NOT NULL,          -- provider key (whoop|oura|apple_health|health_connect|...)
  state      text NOT NULL DEFAULT 'granted' CHECK (state IN ('granted','revoked')),
  granted_at timestamptz,
  revoked_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, source)
);
ALTER TABLE public.wearable_consent ENABLE ROW LEVEL SECURITY;

-- Athlete owns their consent; physio (roster) may read the consent state.
CREATE POLICY wearable_consent_own ON public.wearable_consent
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY wearable_consent_physio_read ON public.wearable_consent
  FOR SELECT TO authenticated
  USING (public.can_role_read_athlete(user_id, ARRAY['physio']));
