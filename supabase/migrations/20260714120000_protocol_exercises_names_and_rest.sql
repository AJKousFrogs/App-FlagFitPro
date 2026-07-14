-- Protocol exercises: persist the generator's intended names + rest intervals.
--
-- Bug (2026-07-14, reported from production): the daily-protocol generator
-- builds e.g. a 16-item gym warm-up (Jump Rope → Bike → Glute Bridge → Dead Bug
-- → Planks → …), but persistence dropped every item whose keyword-match against
-- `exercises` failed (exercise_id NOT NULL + `WHERE exercise_id IS NOT NULL` in
-- generate_protocol_transactional), and the UI then displayed the keyword-matched
-- library row's name instead of the intended item ("Pogo Jumps" rendered as
-- "Low Pogo + Ankling Prep Ladder"). rest_seconds was generated but had no
-- column, so every block's duration estimate ignored rest entirely
-- (17 working sets shown as "~10 min").
--
-- Fix: additive columns + relaxed NOT NULL so template items persist verbatim,
-- and the transactional RPC carries name + rest through.

alter table public.protocol_exercises
  add column if not exists exercise_name text,
  add column if not exists rest_seconds integer;

alter table public.protocol_exercises
  alter column exercise_id drop not null;

comment on column public.protocol_exercises.exercise_name is
  'Display name the generator intended (template item name). Preferred over the joined exercises.name; survives when no library row matched (exercise_id null).';
comment on column public.protocol_exercises.rest_seconds is
  'Prescribed inter-set rest. Feeds honest block-duration estimates; null = block-type default.';

create or replace function public.generate_protocol_transactional(
  p_user_id uuid,
  p_protocol_date date,
  p_readiness_score integer,
  p_acwr_value numeric,
  p_training_focus text,
  p_ai_rationale text,
  p_total_load_target_au integer,
  p_confidence_metadata jsonb,
  p_exercises jsonb
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  v_protocol_id uuid;
  v_now timestamptz := now();
BEGIN
  IF coalesce(jsonb_array_length(p_exercises), 0) = 0 THEN
    RAISE EXCEPTION 'Cannot persist a protocol without exercises';
  END IF;

  INSERT INTO public.daily_protocols (
    user_id,
    protocol_date,
    readiness_score,
    acwr_value,
    training_focus,
    ai_rationale,
    total_load_target_au,
    confidence_metadata,
    total_exercises,
    completed_exercises,
    overall_progress,
    generated_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_protocol_date,
    p_readiness_score,
    p_acwr_value,
    p_training_focus,
    p_ai_rationale,
    p_total_load_target_au,
    coalesce(p_confidence_metadata, '{}'::jsonb),
    coalesce(jsonb_array_length(p_exercises), 0),
    0,
    0,
    v_now,
    v_now
  )
  ON CONFLICT (user_id, protocol_date)
  DO UPDATE SET
    readiness_score = EXCLUDED.readiness_score,
    acwr_value = EXCLUDED.acwr_value,
    training_focus = EXCLUDED.training_focus,
    ai_rationale = EXCLUDED.ai_rationale,
    total_load_target_au = EXCLUDED.total_load_target_au,
    confidence_metadata = EXCLUDED.confidence_metadata,
    total_exercises = EXCLUDED.total_exercises,
    completed_exercises = 0,
    overall_progress = 0,
    generated_at = v_now,
    updated_at = v_now
  RETURNING id INTO v_protocol_id;

  DELETE FROM public.protocol_exercises
  WHERE protocol_id = v_protocol_id;

  -- Persist EVERY generated item. A null exercise_id (no library match) keeps
  -- its intended exercise_name instead of being silently dropped — the bug that
  -- decimated warm-ups to 3 leftover items.
  INSERT INTO public.protocol_exercises (
    protocol_id,
    exercise_id,
    exercise_name,
    block_type,
    sequence_order,
    prescribed_sets,
    prescribed_reps,
    prescribed_hold_seconds,
    prescribed_duration_seconds,
    rest_seconds,
    load_contribution_au,
    ai_note,
    status,
    created_at,
    updated_at
  )
  SELECT
    v_protocol_id,
    exercise.exercise_id,
    exercise.exercise_name,
    exercise.block_type,
    exercise.sequence_order,
    exercise.prescribed_sets,
    exercise.prescribed_reps,
    exercise.prescribed_hold_seconds,
    exercise.prescribed_duration_seconds,
    exercise.rest_seconds,
    coalesce(exercise.load_contribution_au, 0),
    exercise.ai_note,
    'pending',
    v_now,
    v_now
  FROM jsonb_to_recordset(p_exercises) AS exercise(
    exercise_id uuid,
    exercise_name text,
    block_type text,
    sequence_order integer,
    prescribed_sets integer,
    prescribed_reps integer,
    prescribed_hold_seconds integer,
    prescribed_duration_seconds integer,
    rest_seconds integer,
    load_contribution_au integer,
    ai_note text
  );

  IF NOT EXISTS (
    SELECT 1
    FROM public.protocol_exercises
    WHERE protocol_id = v_protocol_id
  ) THEN
    RAISE EXCEPTION 'Protocol persistence produced no exercise rows';
  END IF;

  RETURN v_protocol_id;
END;
$function$;
