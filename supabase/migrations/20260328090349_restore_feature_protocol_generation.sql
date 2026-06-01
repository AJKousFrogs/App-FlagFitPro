CREATE TABLE IF NOT EXISTS public.protocol_generation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol_date date NOT NULL,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  protocol_id uuid REFERENCES public.daily_protocols(id) ON DELETE SET NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT protocol_generation_requests_status_check CHECK (
    status IN ('pending', 'completed', 'failed')
  ),
  CONSTRAINT protocol_generation_requests_unique_key UNIQUE (
    user_id,
    protocol_date,
    idempotency_key
  )
);

CREATE INDEX IF NOT EXISTS idx_protocol_generation_requests_status ON public.protocol_generation_requests (user_id, protocol_date, status);

ALTER TABLE public.protocol_generation_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS protocol_generation_requests_select ON public.protocol_generation_requests;
CREATE POLICY protocol_generation_requests_select
  ON public.protocol_generation_requests
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS protocol_generation_requests_insert ON public.protocol_generation_requests;
CREATE POLICY protocol_generation_requests_insert
  ON public.protocol_generation_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS protocol_generation_requests_update ON public.protocol_generation_requests;
CREATE POLICY protocol_generation_requests_update
  ON public.protocol_generation_requests
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP TRIGGER IF EXISTS protocol_generation_requests_set_updated_at ON public.protocol_generation_requests;
CREATE TRIGGER protocol_generation_requests_set_updated_at
BEFORE UPDATE ON public.protocol_generation_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.generate_protocol_transactional(
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
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    (
      SELECT count(*)
      FROM jsonb_to_recordset(p_exercises) AS exercise(exercise_id uuid)
      WHERE exercise.exercise_id IS NOT NULL
    ),
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

  INSERT INTO public.protocol_exercises (
    protocol_id,
    exercise_id,
    block_type,
    sequence_order,
    prescribed_sets,
    prescribed_reps,
    prescribed_hold_seconds,
    prescribed_duration_seconds,
    load_contribution_au,
    ai_note,
    status,
    created_at,
    updated_at
  )
  SELECT
    v_protocol_id,
    exercise.exercise_id,
    exercise.block_type,
    exercise.sequence_order,
    exercise.prescribed_sets,
    exercise.prescribed_reps,
    exercise.prescribed_hold_seconds,
    exercise.prescribed_duration_seconds,
    coalesce(exercise.load_contribution_au, 0),
    exercise.ai_note,
    'pending',
    v_now,
    v_now
  FROM jsonb_to_recordset(p_exercises) AS exercise(
    exercise_id uuid,
    block_type text,
    sequence_order integer,
    prescribed_sets integer,
    prescribed_reps integer,
    prescribed_hold_seconds integer,
    prescribed_duration_seconds integer,
    load_contribution_au integer,
    ai_note text
  )
  WHERE exercise.exercise_id IS NOT NULL;

  IF NOT EXISTS (
    SELECT 1
    FROM public.protocol_exercises
    WHERE protocol_id = v_protocol_id
  ) THEN
    RAISE EXCEPTION 'Cannot persist a protocol without exercise IDs';
  END IF;

  RETURN v_protocol_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_protocol_transactional(
  uuid,
  date,
  integer,
  numeric,
  text,
  text,
  integer,
  jsonb,
  jsonb
) TO authenticated;
