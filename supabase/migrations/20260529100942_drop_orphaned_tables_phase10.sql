-- Backend de-drift Phase 10: drop genuinely orphaned tables.
-- Each verified: 0 code references (netlify + angular), 0 FK dependents, 0 view dependents,
-- 0 functions mentioning, 0 triggers, and no mapping to any feature in the route/nav spec.
-- (chatbot_user_context EXCLUDED — it has a function + trigger touching it; investigate first.)
DROP TABLE IF EXISTS public.analytics_aggregates;
DROP TABLE IF EXISTS public.article_search_index;
DROP TABLE IF EXISTS public.athlete_daily_state;
DROP TABLE IF EXISTS public.digest_history;
DROP TABLE IF EXISTS public.injury_risk_factors;
DROP TABLE IF EXISTS public.load_management_research;
DROP TABLE IF EXISTS public.sponsor_contributions;
