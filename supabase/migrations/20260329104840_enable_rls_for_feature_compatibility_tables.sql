BEGIN;

ALTER TABLE public.team_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_tracking_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_tracking_symptoms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_events_team_members_select" ON public.team_events;
CREATE POLICY "team_events_team_members_select"
ON public.team_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = team_events.team_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
  )
);

DROP POLICY IF EXISTS "team_events_staff_manage" ON public.team_events;
CREATE POLICY "team_events_staff_manage"
ON public.team_events
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = team_events.team_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
      AND tm.role IN (
        'owner',
        'admin',
        'head_coach',
        'coach',
        'assistant_coach',
        'manager'
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = team_events.team_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
      AND tm.role IN (
        'owner',
        'admin',
        'head_coach',
        'coach',
        'assistant_coach',
        'manager'
      )
  )
);

DROP POLICY IF EXISTS "attendance_records_owner_select" ON public.attendance_records;
CREATE POLICY "attendance_records_owner_select"
ON public.attendance_records
FOR SELECT
TO authenticated
USING (
  player_id = auth.uid()
);

DROP POLICY IF EXISTS "attendance_records_team_staff_select" ON public.attendance_records;
CREATE POLICY "attendance_records_team_staff_select"
ON public.attendance_records
FOR SELECT
TO authenticated
USING (
  team_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = attendance_records.team_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
      AND tm.role IN (
        'owner',
        'admin',
        'head_coach',
        'coach',
        'assistant_coach',
        'manager'
      )
  )
);

DROP POLICY IF EXISTS "attendance_records_owner_insert" ON public.attendance_records;
CREATE POLICY "attendance_records_owner_insert"
ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (
  player_id = auth.uid()
);

DROP POLICY IF EXISTS "attendance_records_owner_update" ON public.attendance_records;
CREATE POLICY "attendance_records_owner_update"
ON public.attendance_records
FOR UPDATE
TO authenticated
USING (
  player_id = auth.uid()
)
WITH CHECK (
  player_id = auth.uid()
);

DROP POLICY IF EXISTS "attendance_records_team_staff_manage" ON public.attendance_records;
CREATE POLICY "attendance_records_team_staff_manage"
ON public.attendance_records
FOR ALL
TO authenticated
USING (
  team_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = attendance_records.team_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
      AND tm.role IN (
        'owner',
        'admin',
        'head_coach',
        'coach',
        'assistant_coach',
        'manager'
      )
  )
)
WITH CHECK (
  team_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = attendance_records.team_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
      AND tm.role IN (
        'owner',
        'admin',
        'head_coach',
        'coach',
        'assistant_coach',
        'manager'
      )
  )
);

DROP POLICY IF EXISTS "cycle_tracking_entries_owner_all" ON public.cycle_tracking_entries;
CREATE POLICY "cycle_tracking_entries_owner_all"
ON public.cycle_tracking_entries
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "cycle_tracking_symptoms_owner_all" ON public.cycle_tracking_symptoms;
CREATE POLICY "cycle_tracking_symptoms_owner_all"
ON public.cycle_tracking_symptoms
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

COMMIT;
