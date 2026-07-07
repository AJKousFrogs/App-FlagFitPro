-- Monitoring: PROVIDER registry + device<->athlete PAIRING (additive, one concern).
--
-- Reversal:
--   DROP TABLE IF EXISTS public.device_pairings;
--   DROP TABLE IF EXISTS public.monitoring_providers;

CREATE TABLE IF NOT EXISTS public.monitoring_providers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key          text NOT NULL UNIQUE,
  display_name text NOT NULL,
  kind         text NOT NULL CHECK (kind IN ('external_load','wearable','both')),
  is_active    boolean NOT NULL DEFAULT true
);
ALTER TABLE public.monitoring_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY monitoring_providers_read ON public.monitoring_providers
  FOR SELECT TO authenticated USING (true);
INSERT INTO public.monitoring_providers (key,display_name,kind) VALUES
  ('catapult','Catapult','external_load'),
  ('statsports','STATSports','external_load'),
  ('polar','Polar','both'),
  ('garmin','Garmin','wearable'),
  ('whoop','WHOOP','wearable'),
  ('oura','Oura','wearable'),
  ('apple_health','Apple Health','wearable'),
  ('manual','Manual entry','both')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.device_pairings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id   uuid NOT NULL REFERENCES public.monitoring_providers(id) ON DELETE CASCADE,
  team_id       uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  external_athlete_id text,
  device_identifier   text,
  is_active     boolean NOT NULL DEFAULT true,
  paired_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider_id, external_athlete_id)
);
ALTER TABLE public.device_pairings ENABLE ROW LEVEL SECURITY;
CREATE POLICY device_pairings_own ON public.device_pairings
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY device_pairings_staff_read ON public.device_pairings
  FOR SELECT TO authenticated
  USING (public.can_role_read_athlete(user_id, ARRAY['sc_coach','physio']));
