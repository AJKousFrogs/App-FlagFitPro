-- Backend de-drift — Phase 10: drop genuinely orphaned tables (whole-schema sweep).
--
-- Found by diffing all ~165 public tables against every .from()/.rpc() reference in
-- netlify + angular, then classifying each (referenced / feature-awaiting-rebuild /
-- orphan) against the route/nav feature spec. Each table below was verified:
--   0 code refs · 0 FK dependents · 0 view dependents · 0 functions mentioning · 0 triggers
-- and maps to NO feature/route — i.e. dead schema experiments / superseded systems.
--
-- chatbot_user_context was flagged as an orphan candidate but EXCLUDED: it has a function
-- and a trigger referencing it — investigate before dropping.
--
-- Applied via Supabase MCP on 2026-05-29 (project grfjmnjpzvknmsxrwesx).
DROP TABLE IF EXISTS public.analytics_aggregates;     -- abandoned analytics cache
DROP TABLE IF EXISTS public.article_search_index;     -- search index, no search feature wired
DROP TABLE IF EXISTS public.athlete_daily_state;      -- readiness rollup; readiness_scores is canonical
DROP TABLE IF EXISTS public.digest_history;           -- email-digest system, no feature
DROP TABLE IF EXISTS public.injury_risk_factors;      -- orphaned risk-factor analytics
DROP TABLE IF EXISTS public.load_management_research;  -- internal research data, never wired
DROP TABLE IF EXISTS public.sponsor_contributions;    -- sponsor subsystem not in routes
