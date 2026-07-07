-- Monitoring: editable, team-scoped threshold CONFIG (additive, one concern).
-- team_id NULL = global default; a team row overrides the global for that
-- (metric,key,sex). NULLS NOT DISTINCT makes the global default unique.
--
-- Reversal: DROP TABLE IF EXISTS public.monitoring_config;

CREATE TABLE IF NOT EXISTS public.monitoring_config (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid REFERENCES public.teams(id) ON DELETE CASCADE,   -- NULL = global default
  metric     text NOT NULL,
  key        text NOT NULL,
  sex        text CHECK (sex IN ('male','female')),                -- NULL = both
  value      numeric NOT NULL,
  unit       text,
  citation   text,
  is_active  boolean NOT NULL DEFAULT true,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (team_id, metric, key, sex)
);
ALTER TABLE public.monitoring_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY monitoring_config_read ON public.monitoring_config
  FOR SELECT TO authenticated
  USING (team_id IS NULL
      OR EXISTS (SELECT 1 FROM team_member_roles tmr
                 WHERE tmr.team_id = monitoring_config.team_id
                   AND tmr.user_id = (SELECT auth.uid())));

CREATE POLICY monitoring_config_write ON public.monitoring_config
  FOR ALL TO authenticated
  USING (team_id IS NOT NULL AND public.has_team_role(team_id, 'head_coach'))
  WITH CHECK (team_id IS NOT NULL AND public.has_team_role(team_id, 'head_coach'));

INSERT INTO public.monitoring_config (metric,key,sex,value,unit,citation) VALUES
  ('hooper','watch',NULL,12,'score','Hooper & Mackinnon 1995'),
  ('hooper','high',NULL,16,'score','Hooper & Mackinnon 1995'),
  ('acwr','sweet_low',NULL,0.80,'ratio','Gabbett 2016'),
  ('acwr','sweet_high',NULL,1.30,'ratio','Gabbett 2016'),
  ('acwr','elevated',NULL,1.50,'ratio','Gabbett 2016'),
  ('pl_per_min','high',NULL,6.5,'AU/min','Catapult reference'),
  ('ck','upper','male',1083,'U/L','sex-specific clinical upper'),
  ('ck','upper','female',513,'U/L','sex-specific clinical upper'),
  ('ferritin','floor',NULL,30,'ug/L','iron-deficiency floor'),
  ('urea','upper',NULL,8,'mmol/L','clinical upper'),
  ('hs_crp','upper',NULL,3,'mg/L','inflammation cut-point'),
  ('vitamin_d','deficient_below',NULL,50,'nmol/L','25-OH-D <50 deficient'),
  ('vitamin_d','sufficient_above',NULL,75,'nmol/L','25-OH-D >=75 sufficient'),
  ('testosterone','low','male',8.6,'nmol/L','male lower reference'),
  ('testosterone','low','female',0.3,'nmol/L','female lower reference'),
  ('accel','band_low',NULL,2,'m/s2','accel intensity band 1'),
  ('accel','band_mid',NULL,3,'m/s2','accel intensity band 2'),
  ('accel','band_high',NULL,4,'m/s2','accel intensity band 3'),
  ('decel','band_low',NULL,2,'m/s2','decel intensity band 1'),
  ('decel','band_mid',NULL,3,'m/s2','decel intensity band 2'),
  ('decel','band_high',NULL,4,'m/s2','decel intensity band 3'),
  ('hr_zone','z1_max',NULL,60,'%HRmax','Z1 upper'),
  ('hr_zone','z2_max',NULL,70,'%HRmax','Z2 upper'),
  ('hr_zone','z3_max',NULL,80,'%HRmax','Z3 upper'),
  ('hr_zone','z4_max',NULL,90,'%HRmax','Z4 upper (Z5 above)')
ON CONFLICT DO NOTHING;
