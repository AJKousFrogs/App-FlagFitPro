-- Backend de-drift — Phase 3: finish the wellness consolidation.
--
-- daily_wellness_checkin is the canonical subjective wellness table; all writers and
-- readers were repointed earlier (wellness-checkin.js, performance-data.js,
-- calc-readiness.js, consent-data-reader.js). These two legacy tables now have no
-- .from() queries and no FK dependents:
--   - wellness_entries (2 test rows, athlete_id keyed)
--   - wellness_data (empty; varchar user_id; legacy column names sleep/energy/...)
--
-- wellness_logs is intentionally KEPT for now: it is still dual-purpose (daily-protocol.js
-- writes training-load fields to it). It will be re-homed to training_sessions and dropped
-- in the sessions/load consolidation phase. See docs/DATA_MODEL.md.
--
-- Applied via Supabase MCP on 2026-05-29 (project grfjmnjpzvknmsxrwesx).
DROP TABLE IF EXISTS public.wellness_entries;
DROP TABLE IF EXISTS public.wellness_data;
