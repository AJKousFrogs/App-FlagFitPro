-- Backend de-drift — Phase 4: drop never-written derived ACWR/load cache tables.
--
-- ACWR & load are computed on-read from training_sessions via
-- netlify/functions/utils/acwr.js (EWMA + uncoupled). These six cache tables were
-- never populated; every live reader already copes with an empty/missing table:
--   - load_daily            staff-physiotherapist.js (ignores error, null-safe)
--   - training_load_metrics load-management.js (guards `!error && data.length` → fallback)
--   - acwr_history          season-reports.js (ignores error, `|| 0`)
--   - acwr_calculations     ai-training-scheduler-data.service.ts (dormant — UI deleted)
--   - acwr_reports          acwr-dashboard-data.service.ts (dormant)
--   - load_caps             ai-chat.js (maybeSingle, `if (loadCap)`) + dormant spike-detection
-- No FK or view dependents on these six.
--
-- DEFERRED: load_monitoring — wrapped by consent view v_load_monitoring_consent and the
-- consent resource→view map; consent-data-reader's two reads were already guarded to treat
-- a missing table (42P01) as empty, prepping its drop in a focused consent-view step.
--
-- Dormant Angular readers (acwr.service, training-data.service, ai-training-scheduler-data,
-- acwr-dashboard-data, acwr-spike-detection) repoint to /api/compute-acwr at screen rebuild.
--
-- Applied via Supabase MCP on 2026-05-29 (project grfjmnjpzvknmsxrwesx).
DROP TABLE IF EXISTS public.load_daily;
DROP TABLE IF EXISTS public.training_load_metrics;
DROP TABLE IF EXISTS public.acwr_calculations;
DROP TABLE IF EXISTS public.acwr_history;
DROP TABLE IF EXISTS public.acwr_reports;
DROP TABLE IF EXISTS public.load_caps;
