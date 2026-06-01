-- Backend de-drift Phase 8: drop the dead load_monitoring cache + its consent view.
-- load_monitoring was a never-written ACWR/load cache (deferred from Phase 4 due to the
-- view dependency). Its consent view v_load_monitoring_consent wrapped empty data.
-- consent-data-reader's direct reads are 42P01-guarded (return empty); the CONSENT_VIEWS
-- map entry was advisory only (error-message helper) and has been removed.
DROP VIEW IF EXISTS public.v_load_monitoring_consent;
DROP TABLE IF EXISTS public.load_monitoring;
