-- Backend de-drift — Phase 8: drop the dead load_monitoring cache + its consent view.
--
-- load_monitoring was a never-written ACWR/load cache (deferred from Phase 4 because the
-- view v_load_monitoring_consent depended on it). The view wrapped empty data.
-- consent-data-reader's direct reads of load_monitoring are 42P01-guarded (return empty),
-- and its CONSENT_VIEWS / CONSENT_PROTECTED_TABLES entries (advisory error-message helpers
-- only — not query routers) were cleaned of this + other already-dropped tables.
-- privacy-settings.service.ts read of the view is dormant (UI deleted); repoint at rebuild.
--
-- Applied via Supabase MCP on 2026-05-29 (project grfjmnjpzvknmsxrwesx).
DROP VIEW IF EXISTS public.v_load_monitoring_consent;
DROP TABLE IF EXISTS public.load_monitoring;
