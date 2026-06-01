-- Align wellness and ExerciseDB tables with API/UI contracts.

-- ---------------------------------------------------------------------------
-- daily_wellness_checkin motivation alias
-- ---------------------------------------------------------------------------
ALTER TABLE public.daily_wellness_checkin
  ADD COLUMN IF NOT EXISTS motivation integer;

UPDATE public.daily_wellness_checkin
SET motivation = motivation_level
WHERE motivation IS NULL
  AND motivation_level IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_daily_wellness_motivation()
RETURNS trigger AS $$
BEGIN
  IF NEW.motivation IS NULL AND NEW.motivation_level IS NOT NULL THEN
    NEW.motivation := NEW.motivation_level;
  END IF;

  IF NEW.motivation_level IS NULL AND NEW.motivation IS NOT NULL THEN
    NEW.motivation_level := NEW.motivation;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_daily_wellness_motivation
  ON public.daily_wellness_checkin;
CREATE TRIGGER trigger_sync_daily_wellness_motivation
  BEFORE INSERT OR UPDATE ON public.daily_wellness_checkin
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_daily_wellness_motivation();

-- ---------------------------------------------------------------------------
-- exercisedb_exercises UI/API metadata
-- ---------------------------------------------------------------------------
ALTER TABLE public.exercisedb_exercises
  ADD COLUMN IF NOT EXISTS body_part varchar(100),
  ADD COLUMN IF NOT EXISTS target_muscle varchar(100),
  ADD COLUMN IF NOT EXISTS is_curated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS flag_football_relevance integer,
  ADD COLUMN IF NOT EXISTS difficulty_level varchar(50),
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;

UPDATE public.exercisedb_exercises
SET
  body_part = COALESCE(body_part, lower(category), 'general'),
  target_muscle = COALESCE(target_muscle, muscle_groups[1], 'general'),
  is_curated = COALESCE(is_curated, false),
  flag_football_relevance = COALESCE(flag_football_relevance, 7),
  difficulty_level = COALESCE(lower(difficulty_level), 'intermediate'),
  is_active = COALESCE(is_active, true),
  is_approved = COALESCE(is_approved, false)
WHERE body_part IS NULL
  OR target_muscle IS NULL
  OR is_curated IS NULL
  OR flag_football_relevance IS NULL
  OR difficulty_level IS NULL
  OR is_active IS NULL
  OR is_approved IS NULL;

ALTER TABLE public.exercisedb_exercises
  ALTER COLUMN is_curated SET DEFAULT false,
  ALTER COLUMN flag_football_relevance SET DEFAULT 7,
  ALTER COLUMN difficulty_level SET DEFAULT 'intermediate',
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN is_approved SET DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'exercisedb_flag_football_relevance_range'
      AND conrelid = 'public.exercisedb_exercises'::regclass
  ) THEN
    ALTER TABLE public.exercisedb_exercises
      ADD CONSTRAINT exercisedb_flag_football_relevance_range
      CHECK (flag_football_relevance IS NULL OR flag_football_relevance BETWEEN 1 AND 10);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.normalize_exercisedb_contract_fields()
RETURNS trigger AS $$
BEGIN
  NEW.body_part := COALESCE(NEW.body_part, lower(NEW.category), 'general');
  NEW.target_muscle := COALESCE(NEW.target_muscle, NEW.muscle_groups[1], 'general');
  NEW.is_curated := COALESCE(NEW.is_curated, false);
  NEW.flag_football_relevance := LEAST(
    10,
    GREATEST(1, COALESCE(NEW.flag_football_relevance, 7))
  );
  NEW.difficulty_level := lower(COALESCE(NEW.difficulty_level, 'intermediate'));
  NEW.is_active := COALESCE(NEW.is_active, true);
  NEW.is_approved := COALESCE(NEW.is_approved, false);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_normalize_exercisedb_contract_fields
  ON public.exercisedb_exercises;
CREATE TRIGGER trigger_normalize_exercisedb_contract_fields
  BEFORE INSERT OR UPDATE ON public.exercisedb_exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_exercisedb_contract_fields();

CREATE INDEX IF NOT EXISTS idx_exercisedb_body_part
  ON public.exercisedb_exercises(body_part);

CREATE INDEX IF NOT EXISTS idx_exercisedb_relevance
  ON public.exercisedb_exercises(flag_football_relevance DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_exercisedb_approved_active
  ON public.exercisedb_exercises(is_approved, is_active);
