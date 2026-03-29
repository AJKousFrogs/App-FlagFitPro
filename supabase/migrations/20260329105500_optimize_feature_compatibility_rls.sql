BEGIN;

DROP POLICY IF EXISTS "team_events_team_members_select" ON public.team_events;
DROP POLICY IF EXISTS "team_events_staff_manage" ON public.team_events;

CREATE POLICY "team_events_select_scoped"
ON public.team_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = team_events.team_id
      AND tm.user_id = (SELECT auth.uid())
      AND tm.status = 'active'
  )
);

CREATE POLICY "team_events_insert_staff"
ON public.team_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = team_events.team_id
      AND tm.user_id = (SELECT auth.uid())
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

CREATE POLICY "team_events_update_staff"
ON public.team_events
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = team_events.team_id
      AND tm.user_id = (SELECT auth.uid())
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
      AND tm.user_id = (SELECT auth.uid())
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

CREATE POLICY "team_events_delete_staff"
ON public.team_events
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = team_events.team_id
      AND tm.user_id = (SELECT auth.uid())
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
DROP POLICY IF EXISTS "attendance_records_team_staff_select" ON public.attendance_records;
DROP POLICY IF EXISTS "attendance_records_owner_insert" ON public.attendance_records;
DROP POLICY IF EXISTS "attendance_records_owner_update" ON public.attendance_records;
DROP POLICY IF EXISTS "attendance_records_team_staff_manage" ON public.attendance_records;

CREATE POLICY "attendance_records_select_scoped"
ON public.attendance_records
FOR SELECT
TO authenticated
USING (
  player_id = (SELECT auth.uid())
  OR (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.team_id = attendance_records.team_id
        AND tm.user_id = (SELECT auth.uid())
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
);

CREATE POLICY "attendance_records_insert_scoped"
ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (
  player_id = (SELECT auth.uid())
  OR (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.team_id = attendance_records.team_id
        AND tm.user_id = (SELECT auth.uid())
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
);

CREATE POLICY "attendance_records_update_scoped"
ON public.attendance_records
FOR UPDATE
TO authenticated
USING (
  player_id = (SELECT auth.uid())
  OR (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.team_id = attendance_records.team_id
        AND tm.user_id = (SELECT auth.uid())
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
)
WITH CHECK (
  player_id = (SELECT auth.uid())
  OR (
    team_id IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.team_id = attendance_records.team_id
        AND tm.user_id = (SELECT auth.uid())
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
);

CREATE POLICY "attendance_records_delete_staff"
ON public.attendance_records
FOR DELETE
TO authenticated
USING (
  team_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = attendance_records.team_id
      AND tm.user_id = (SELECT auth.uid())
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
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "cycle_tracking_symptoms_owner_all" ON public.cycle_tracking_symptoms;
CREATE POLICY "cycle_tracking_symptoms_owner_all"
ON public.cycle_tracking_symptoms
FOR ALL
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

COMMIT;
