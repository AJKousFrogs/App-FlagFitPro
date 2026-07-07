-- Monitoring-feature foundation (Prompt-2, additive only).
-- Adds: external-load + bloodwork tables, a consent-aware staff-read helper,
-- consent-gated staff-read RLS on previously own-only health tables, and
-- populates the staff_roles catalog. NOTHING existing is dropped or altered
-- (existing readiness_scores / training_sessions policies are left as-is).
--
-- Access model (chosen): consent-gated. Staff (same active team) may read an
-- athlete's wellness/load ONLY where the matching athlete_consent_settings
-- flag is true; injuries/bloodwork/recovery are a medical lane
-- (physiotherapist/admin/owner, no consent gate — duty of care).
-- All share_* consent flags default false, so this grants nothing until an
-- athlete opts in.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Consent-aware staff-read helper
--    SECURITY DEFINER so it can check the SUBJECT's membership + consent row
--    (both normally hidden from the viewer by RLS). Locked search_path.
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.can_staff_read_athlete(
  p_athlete uuid,
  p_roles text[],
  p_consent_kind text DEFAULT NULL   -- NULL | 'wellness' | 'training' | 'readiness'
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM team_members viewer
    JOIN team_members subject
      ON subject.team_id = viewer.team_id
    WHERE viewer.user_id = (SELECT auth.uid())
      AND viewer.status = 'active'
      AND viewer.role = ANY (p_roles)
      AND subject.user_id = p_athlete
      AND subject.status = 'active'
      AND (
        p_consent_kind IS NULL
        OR EXISTS (
          SELECT 1 FROM athlete_consent_settings c
          WHERE c.user_id = p_athlete
            AND (
                 (p_consent_kind = 'wellness'  AND c.share_wellness_answers_with_coach)
              OR (p_consent_kind = 'training'  AND c.share_training_notes_with_coach)
              OR (p_consent_kind = 'readiness' AND c.share_readiness_with_coach)
            )
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_staff_read_athlete(uuid, text[], text) FROM public;
REVOKE ALL ON FUNCTION public.can_staff_read_athlete(uuid, text[], text) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_staff_read_athlete(uuid, text[], text) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. External-load metrics (Catapult/GPS-style, manual or imported)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.external_load_metrics (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_date         date NOT NULL,
  source               text NOT NULL DEFAULT 'manual',   -- manual | import | gps | catapult | other
  device_name          text,
  total_distance_m     numeric,
  high_speed_distance_m numeric,
  sprint_distance_m    numeric,
  player_load          numeric,
  accelerations        integer,
  decelerations        integer,
  max_velocity_kmh     numeric,
  avg_heart_rate       integer,
  max_heart_rate       integer,
  duration_minutes     integer,
  training_session_id  uuid REFERENCES public.training_sessions(id) ON DELETE SET NULL,
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_external_load_metrics_user_date
  ON public.external_load_metrics (user_id, session_date DESC);

ALTER TABLE public.external_load_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY external_load_own_all ON public.external_load_metrics
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY external_load_staff_read ON public.external_load_metrics
  FOR SELECT TO authenticated
  USING (public.can_staff_read_athlete(
    user_id,
    ARRAY['owner','admin','head_coach','coach','offense_coordinator','defense_coordinator','assistant_coach','physiotherapist','nutritionist','psychologist','strength_conditioning_coach'],
    'training'));

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Bloodwork / labs (panel + markers) — medical lane
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bloodwork_panels (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  collected_date date NOT NULL,
  panel_type     text,     -- e.g. full_blood_count | iron_studies | hormonal | vitamin
  lab_name       text,
  ordered_by     text,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bloodwork_panels_user_date
  ON public.bloodwork_panels (user_id, collected_date DESC);

CREATE TABLE IF NOT EXISTS public.bloodwork_markers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_id        uuid NOT NULL REFERENCES public.bloodwork_panels(id) ON DELETE CASCADE,
  marker_name     text NOT NULL,   -- e.g. ferritin | hemoglobin | vitamin_d | testosterone
  value           numeric,
  unit            text,
  reference_low   numeric,
  reference_high  numeric,
  flag            text,            -- low | normal | high | critical
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bloodwork_markers_panel
  ON public.bloodwork_markers (panel_id);

ALTER TABLE public.bloodwork_panels  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bloodwork_markers ENABLE ROW LEVEL SECURITY;

-- panels: own full access + medical-staff read (no consent gate — duty of care)
CREATE POLICY bloodwork_panels_own_all ON public.bloodwork_panels
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY bloodwork_panels_medical_read ON public.bloodwork_panels
  FOR SELECT TO authenticated
  USING (public.can_staff_read_athlete(
    user_id, ARRAY['owner','admin','physiotherapist'], NULL));

-- markers: inherit access from the parent panel
CREATE POLICY bloodwork_markers_own_all ON public.bloodwork_markers
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bloodwork_panels p
                 WHERE p.id = bloodwork_markers.panel_id
                   AND p.user_id = (SELECT auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.bloodwork_panels p
                      WHERE p.id = bloodwork_markers.panel_id
                        AND p.user_id = (SELECT auth.uid())));

CREATE POLICY bloodwork_markers_medical_read ON public.bloodwork_markers
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bloodwork_panels p
                 WHERE p.id = bloodwork_markers.panel_id
                   AND public.can_staff_read_athlete(
                         p.user_id, ARRAY['owner','admin','physiotherapist'], NULL)));

-- ─────────────────────────────────────────────────────────────────────────
-- 4. ADDITIVE staff-read policies on previously own-only health tables.
--    (New policies only — existing own/service-role policies are untouched.)
-- ─────────────────────────────────────────────────────────────────────────
-- Wellness check-ins: consent-gated read for staff who can access health data.
CREATE POLICY daily_wellness_staff_read_consented ON public.daily_wellness_checkin
  FOR SELECT TO authenticated
  USING (public.can_staff_read_athlete(
    user_id,
    ARRAY['owner','admin','head_coach','coach','physiotherapist','nutritionist','psychologist','strength_conditioning_coach'],
    'wellness'));

-- Injuries: medical lane (physio/admin/owner), no consent gate (duty of care).
CREATE POLICY athlete_injuries_medical_read ON public.athlete_injuries
  FOR SELECT TO authenticated
  USING (public.can_staff_read_athlete(
    user_id, ARRAY['owner','admin','physiotherapist'], NULL));

-- Recovery blocks: same medical lane.
CREATE POLICY recovery_blocks_medical_read ON public.recovery_blocks
  FOR SELECT TO authenticated
  USING (public.can_staff_read_athlete(
    user_id, ARRAY['owner','admin','physiotherapist'], NULL));

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Populate the staff_roles permission catalog (was empty).
-- ─────────────────────────────────────────────────────────────────────────
INSERT INTO public.staff_roles (id, display_name, category, can_manage_roster, can_delete_players, can_view_health_data, sort_order)
VALUES
  ('owner',                       'Owner',                  'ownership',   true,  true,  true,  10),
  ('admin',                       'Administrator',          'ownership',   true,  true,  true,  20),
  ('head_coach',                  'Head Coach',             'coaching',    true,  false, true,  30),
  ('coach',                       'Coach',                  'coaching',    false, false, true,  40),
  ('offense_coordinator',         'Offense Coordinator',    'coaching',    false, false, false, 50),
  ('defense_coordinator',         'Defense Coordinator',    'coaching',    false, false, false, 60),
  ('assistant_coach',             'Assistant Coach',        'coaching',    false, false, false, 70),
  ('strength_conditioning_coach', 'S&C Coach',              'performance', false, false, true,  80),
  ('physiotherapist',             'Physiotherapist',        'medical',     false, false, true,  90),
  ('nutritionist',                'Nutritionist',           'performance', false, false, true, 100),
  ('psychologist',                'Psychologist',           'medical',     false, false, true, 110),
  ('manager',                     'Manager',                'other',       true,  false, false,120)
ON CONFLICT (id) DO NOTHING;
