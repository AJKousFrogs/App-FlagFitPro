-- Standardize calibration_logs to user_id only (athlete-id audit, Batch C).
-- Applied live via Supabase MCP as version 20260609184112.
--
-- Lossless: athlete_id = user_id in all rows (verified 11/11 equal), both NOT NULL.
-- calibration_logs was the ONLY live table still carrying athlete_id; the DB is
-- otherwise already user_id-standardized (game_events.*_player_id and
-- coach_film_tags.player_ids are domain string/array play-IDs, not auth keys, and
-- are out of scope). The handler (netlify/functions/calibration-logs.js) now
-- writes/reads user_id (= the athlete subject) via the service role; cross-athlete
-- staff access stays enforced in verifyAthleteAccess().
--
-- Reverse: re-add athlete_id uuid NOT NULL, backfill athlete_id = user_id, restore
-- the dual-key policy and the (athlete_id, "timestamp") index.

DROP INDEX IF EXISTS public.idx_calibration_logs_athlete_timestamp;
DROP POLICY IF EXISTS calibration_logs_own_access ON public.calibration_logs;

ALTER TABLE public.calibration_logs DROP COLUMN athlete_id;

CREATE POLICY calibration_logs_own_access ON public.calibration_logs
  FOR ALL TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_calibration_logs_user_timestamp
  ON public.calibration_logs (user_id, "timestamp" DESC);
