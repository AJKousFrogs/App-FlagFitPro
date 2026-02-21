-- Create state transition history table compatible with current training_sessions schema
CREATE TABLE IF NOT EXISTS public.state_transition_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  from_state TEXT,
  to_state TEXT NOT NULL,
  actor_role TEXT NOT NULL DEFAULT 'system',
  actor_id UUID REFERENCES auth.users(id),
  transitioned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reason TEXT,
  metadata JSONB
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'state_transition_history_actor_role_check'
  ) THEN
    ALTER TABLE public.state_transition_history
      ADD CONSTRAINT state_transition_history_actor_role_check
      CHECK (actor_role IN ('athlete', 'coach', 'physio', 'system', 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'state_transition_history_to_state_check'
  ) THEN
    ALTER TABLE public.state_transition_history
      ADD CONSTRAINT state_transition_history_to_state_check
      CHECK (to_state IN ('UNRESOLVED', 'PLANNED', 'GENERATED', 'VISIBLE', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'LOCKED', 'CANCELLED', 'EXPIRED', 'ABANDONED'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_state_transition_history_session_id
  ON public.state_transition_history(session_id);
CREATE INDEX IF NOT EXISTS idx_state_transition_history_transitioned_at
  ON public.state_transition_history(transitioned_at DESC);
CREATE INDEX IF NOT EXISTS idx_state_transition_history_actor_id
  ON public.state_transition_history(actor_id) WHERE actor_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.prevent_state_history_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Cannot UPDATE state_transition_history: table is append-only';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Cannot DELETE from state_transition_history: table is append-only';
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS prevent_state_history_modification_trigger ON public.state_transition_history;
CREATE TRIGGER prevent_state_history_modification_trigger
  BEFORE UPDATE OR DELETE ON public.state_transition_history
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_state_history_modification();

CREATE OR REPLACE FUNCTION public.log_session_state_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.session_state IS DISTINCT FROM NEW.session_state THEN
    INSERT INTO public.state_transition_history (
      session_id,
      from_state,
      to_state,
      actor_role,
      transitioned_at,
      reason,
      metadata
    ) VALUES (
      NEW.id,
      OLD.session_state,
      NEW.session_state,
      'system',
      now(),
      'automatic state transition log',
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_session_state_transition_trigger ON public.training_sessions;
CREATE TRIGGER log_session_state_transition_trigger
  AFTER UPDATE ON public.training_sessions
  FOR EACH ROW
  WHEN (OLD.session_state IS DISTINCT FROM NEW.session_state)
  EXECUTE FUNCTION public.log_session_state_transition();

ALTER TABLE public.state_transition_history ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON public.state_transition_history TO authenticated;
GRANT SELECT ON public.state_transition_history TO anon;
GRANT ALL ON public.state_transition_history TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'state_transition_history'
      AND policyname = 'state_history_select_own'
  ) THEN
    CREATE POLICY state_history_select_own ON public.state_transition_history
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM public.training_sessions ts
          WHERE ts.id = state_transition_history.session_id
            AND ts.user_id = (select auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'state_transition_history'
      AND policyname = 'state_history_insert_service_only'
  ) THEN
    CREATE POLICY state_history_insert_service_only ON public.state_transition_history
      FOR INSERT
      TO authenticated
      WITH CHECK (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'state_transition_history'
      AND policyname = 'state_history_select_anon_none'
  ) THEN
    CREATE POLICY state_history_select_anon_none ON public.state_transition_history
      FOR SELECT
      TO anon
      USING (false);
  END IF;
END $$;
