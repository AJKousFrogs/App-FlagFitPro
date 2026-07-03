-- V2.4 — athlete_events.tier: distinguishes a national-team commitment's real
-- competition tier. Before this, category='national' collapsed every
-- national-team event (a routine camp, a Continental Championship, a World
-- Championship, the Olympics) onto the same "international" competition
-- level (see ATHLETE_EVENT_LEVEL in schedule.js) — so the periodization
-- engine's taper/recovery depth couldn't tell a yearly continental apart
-- from a once-every-2-years World Championship or the Olympics. tier, when
-- set, overrides the flat category-based level mapping.
ALTER TABLE public.athlete_events
  ADD COLUMN IF NOT EXISTS tier text;

ALTER TABLE public.athlete_events
  ADD CONSTRAINT athlete_events_tier_chk CHECK (
    tier IS NULL OR tier IN ('continental', 'world', 'olympic')
  );

COMMENT ON COLUMN public.athlete_events.tier IS
  'Real competition tier for a national-team commitment (continental/world/olympic), independent of the coarser category (personal/domestic/national). NULL = use the category-based default level. Drives taper/recovery depth in schedule.js/schedule.service.ts resolvePhase (V2.4).';
