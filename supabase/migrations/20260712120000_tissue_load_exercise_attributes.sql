-- Tissue Load Engine: give exercises a tissue-graph + loading-rate substrate.
-- All columns are additive + nullable/defaulted (non-destructive, reversible).
-- Closes the two load-bearing schema gaps from the Tissue Load Engine audit:
--   (1) loading RATE as an axis distinct from volume,
--   (2) the seated(soleus)/standing(gastroc) contraction distinction,
-- plus the tissue-target array the safety filter keys on instead of name keywords.
-- Applied live to grfjmnjpzvknmsxrwesx on 2026-07-12 via Supabase MCP.

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS tissue_targets text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS contraction_type text,
  ADD COLUMN IF NOT EXISTS joint_emphasis text,
  ADD COLUMN IF NOT EXISTS loading_rate_band text,
  ADD COLUMN IF NOT EXISTS peak_load_bw numeric,
  ADD COLUMN IF NOT EXISTS evidence_tier text,
  ADD COLUMN IF NOT EXISTS rehab_stage smallint;

COMMENT ON COLUMN public.exercises.tissue_targets IS
  'Canonical tissue-node ids this exercise loads (e.g. {achilles,soleus,gastrocnemius}). The tissue-graph safety filter keys on this, never on name keywords.';
COMMENT ON COLUMN public.exercises.contraction_type IS
  'isometric|concentric|eccentric|isotonic|plyometric|stretch|mixed. For tendon work, intensity drives adaptation and contraction type is largely interchangeable (Bohm 2015) — this lets the engine swap type while holding stimulus.';
COMMENT ON COLUMN public.exercises.joint_emphasis IS
  'knee_bent (soleus-biased) | knee_straight (gastroc-biased) | neutral | n/a. Non-negotiable for the calf complex in an acceleration athlete (soleus ~8x BW propulsion).';
COMMENT ON COLUMN public.exercises.loading_rate_band IS
  'none|low|moderate|high|very_high. The loading-RATE axis, distinct from volume/peak force — a leg press and a jump landing reach similar peak tendon force at ~1/19th vs full rate. Lets the engine strip rate while holding force.';
COMMENT ON COLUMN public.exercises.peak_load_bw IS
  'Approx peak tissue load in bodyweights during the movement (nullable; reference figure, not a per-athlete measurement).';
COMMENT ON COLUMN public.exercises.evidence_tier IS
  'META|RCT|COHORT|CONSENSUS|HEURISTIC|CONTESTED — provenance of the exercise''s prescription rationale, surfaced so coaches can interrogate a recommendation.';
COMMENT ON COLUMN public.exercises.rehab_stage IS
  'NULL/0 = not a rehab-loading exercise; 1-3 = earliest RTP phase it is appropriate for (1 pain-management, 2 light loading, 3 progressive loading).';

ALTER TABLE public.exercises
  ADD CONSTRAINT exercises_contraction_type_check
    CHECK (contraction_type IS NULL OR contraction_type IN
      ('isometric','concentric','eccentric','isotonic','plyometric','stretch','mixed')),
  ADD CONSTRAINT exercises_joint_emphasis_check
    CHECK (joint_emphasis IS NULL OR joint_emphasis IN
      ('knee_bent','knee_straight','neutral','n/a')),
  ADD CONSTRAINT exercises_loading_rate_band_check
    CHECK (loading_rate_band IS NULL OR loading_rate_band IN
      ('none','low','moderate','high','very_high')),
  ADD CONSTRAINT exercises_evidence_tier_check
    CHECK (evidence_tier IS NULL OR evidence_tier IN
      ('META','RCT','COHORT','CONSENSUS','HEURISTIC','CONTESTED')),
  ADD CONSTRAINT exercises_rehab_stage_check
    CHECK (rehab_stage IS NULL OR rehab_stage BETWEEN 0 AND 3);

CREATE INDEX IF NOT EXISTS idx_exercises_tissue_targets
  ON public.exercises USING gin (tissue_targets);
