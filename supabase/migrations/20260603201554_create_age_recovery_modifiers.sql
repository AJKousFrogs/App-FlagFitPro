-- E2E audit: player-settings.saveSettings and daily-protocol read
-- age_recovery_modifiers (by age band) to scale recovery needs and the ACWR
-- ceiling, but the table was never created — so the age-based tuning was inert
-- (every athlete got recovery_modifier 1.0 / ACWR ceiling 1.3). player-settings
-- reads it with .single(), which errors on 0 OR >1 matches, so the bands MUST be
-- contiguous and non-overlapping to return exactly one row per age (verified:
-- every age 13-99 matches exactly one band).
--
-- Values below are evidence-based starting points (youth + masters need more
-- recovery and a tighter load ceiling than prime-age adults) — tune to taste;
-- recovery_modifier 1.0 = baseline, acwr_max_adjustment is added to 1.3.
-- Applied via Supabase MCP (schema_migrations version 20260603201554); mirrored here.
CREATE TABLE IF NOT EXISTS public.age_recovery_modifiers (
  id                  serial PRIMARY KEY,
  age_min             integer NOT NULL,
  age_max             integer NOT NULL,
  recovery_modifier   numeric(4,2) NOT NULL DEFAULT 1.00,
  acwr_max_adjustment numeric(4,2) NOT NULL DEFAULT 0.00,
  label               text,
  CONSTRAINT age_recovery_modifiers_band_valid CHECK (age_min <= age_max),
  CONSTRAINT age_recovery_modifiers_band_unique UNIQUE (age_min, age_max)
);

ALTER TABLE public.age_recovery_modifiers ENABLE ROW LEVEL SECURITY;
-- Reference data: any signed-in user may read it (reads run on the user's token).
CREATE POLICY age_recovery_modifiers_read ON public.age_recovery_modifiers
  FOR SELECT TO authenticated USING (true);

INSERT INTO public.age_recovery_modifiers (age_min, age_max, recovery_modifier, acwr_max_adjustment, label) VALUES
  (13, 15, 1.15, -0.15, 'Developing youth — most conservative load progression'),
  (16, 17, 1.10, -0.10, 'Late adolescent — extra recovery, tighter ceiling'),
  (18, 29, 1.00,  0.00, 'Prime — baseline'),
  (30, 39, 1.05, -0.05, 'Early masters'),
  (40, 49, 1.12, -0.10, 'Masters'),
  (50, 99, 1.20, -0.15, 'Veteran — most recovery, lowest ceiling')
ON CONFLICT (age_min, age_max) DO NOTHING;
