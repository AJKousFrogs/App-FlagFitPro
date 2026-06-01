BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.team_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'practice',
  title text NOT NULL,
  description text,
  location text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  is_mandatory boolean NOT NULL DEFAULT true,
  rsvp_deadline date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  guests integer NOT NULL DEFAULT 0,
  needs_ride boolean NOT NULL DEFAULT false,
  can_provide_ride boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_records_status_check
    CHECK (status IN ('pending', 'present', 'absent', 'late', 'excused')),
  CONSTRAINT attendance_records_guests_check
    CHECK (guests >= 0 AND guests <= 20),
  CONSTRAINT attendance_records_event_player_unique
    UNIQUE (event_id, player_id)
);

CREATE TABLE IF NOT EXISTS public.cycle_tracking_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date,
  flow_intensity text NOT NULL DEFAULT 'moderate',
  symptoms text[] NOT NULL DEFAULT ARRAY[]::text[],
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cycle_tracking_entries_flow_intensity_check
    CHECK (flow_intensity IN ('light', 'moderate', 'heavy')),
  CONSTRAINT cycle_tracking_entries_date_order_check
    CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS public.cycle_tracking_symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date date NOT NULL,
  symptoms text[] NOT NULL DEFAULT ARRAY[]::text[],
  severity text NOT NULL DEFAULT 'none',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cycle_tracking_symptoms_severity_check
    CHECK (severity IN ('none', 'mild', 'moderate', 'severe')),
  CONSTRAINT cycle_tracking_symptoms_unique_per_day
    UNIQUE (user_id, logged_date)
);

CREATE INDEX IF NOT EXISTS idx_team_events_team_start
  ON public.team_events(team_id, start_time);

CREATE INDEX IF NOT EXISTS idx_attendance_records_team_event
  ON public.attendance_records(team_id, event_id);

CREATE INDEX IF NOT EXISTS idx_attendance_records_player_created
  ON public.attendance_records(player_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cycle_tracking_entries_user_start
  ON public.cycle_tracking_entries(user_id, start_date DESC);

CREATE INDEX IF NOT EXISTS idx_cycle_tracking_symptoms_user_date
  ON public.cycle_tracking_symptoms(user_id, logged_date DESC);

COMMIT;
