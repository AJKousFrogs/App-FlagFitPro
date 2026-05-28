# FlagFit Pro — Engine Audit (kept business logic)

**Date:** 2026-05-29 · **Scope:** the ~57.5K LOC engine retained after the front-end demolition (99 core services + 54 feature-local services + models/guards/interceptors/resolvers). UI deleted; this is read-only audit to drive the rebuild.

## Verdict
**The engine is healthy (~7.6/10).** The prescriptive core is the crown jewel and is production-ready; debt is localized and actionable.

- ✅ **Prescription engine spec-perfect** — `periodization.service.prescribeFor()` matches `PRESCRIPTION_SPEC.md` 100%; **30/30 regression tests pass**.
- ✅ **Schedule spine canonical & clean** — `schedule.service` reads `/api/schedule`; `readiness.service` is a read-through to server `/api/calc-readiness`.
- ✅ **Auth/session/Supabase** solid (rejects service-role keys, validates anon key, secure token handling), **ACWR** evidence-based and well-tested.
- ✅ Strong test coverage on critical paths (~22 service specs); signals-first, 0 `any`.

## Capability map (condensed)
- **Identity/auth:** `auth`, `supabase`, `session-expiry`, `auth-flow-data`, guards. Canonical: `users`, `team_members`.
- **Prescription/schedule (v10 core — protect):** `schedule.service`, `periodization.service` (`prescribeFor`), `prescription.models`, `schedule.models`. Server canonical via spine.
- **Readiness/wellness/recovery:** `readiness.service` (server canonical), `wellness.service` (client check-ins), `recovery.service`, `load-monitoring.service`.
- **Training load/plan:** `acwr.service` (+spike), `training-data`, `training-plan`, `unified-training`, `phase-load-calculator`, `training-safety`.
- **Roster/team:** `roster.service`, `player-metrics`, `team-membership`, `team-statistics`, `coach-*-data` (dashboard/playbook/film/planning/development), `superadmin`.
- **Game/tournament:** `tournaments-data`, `tournament-nutrition-state`, `game-day-readiness-data`.
- **Settings/profile (GDPR):** 11 `settings-*` services, `profile-data`, `data-export`, `account-deletion`, `privacy-settings`.
- **AI coach:** `chat-*`, `merlin-knowledge`, `conversation-classifier`.
- **Infra:** `api`, `offline-queue`, `realtime`, `channel`, logging/error/telemetry, `platform`, `theme`.
- **Now-inert UI glue (designed for deleted shell):** `header`, `route-shell`, `home-route`, `confirm-dialog`, `toast`, `loading`, `shell-body-state`, `screen-reader-announcer`, `form-error`, `core/view-models`. → re-wire or delete during the rebuild.
- **Encyclopedia data files (~6.5K LOC):** `flag-football-performance-system.data` (1650), `-athlete-profile.data` (1424), `sprint-training-knowledge.data` (1315), `-periodization.data` (928), `training-plan-templates.data` (688), `instagram-video.data` (385), `weather-cancellation.data` (165). Few callers; bundle bloat.

## Canonical data authorities & drift
- **Canonical (clean):** `users` (identity), `team_members` (role), `competition_events`/`competitions` + `v_athlete_schedule` (spine), server `readiness_scores` (never client-written). Matches `SINGLE_SOURCE_OF_TRUTH.md`.
- **Drift flagged:** legacy `tournaments`/`games`/`fixtures` coexist with the spine; `team_players` is a read-only projection whose sync from `users`/`team_members` is unverified; tournament hydration logs held in-memory then batch-persisted.

---

## FIX-NOW — safe, client-only, verifiable without UI
1. **Tournament-nutrition error swallowing** — `features/game/tournament-nutrition/tournament-nutrition-state.service.ts:78–92` swallows *all* errors matching "relation" (assumes table-missing). Distinguish table-missing from RLS-denied/network so real failures surface. *Client-only, ~1h, no schema change.*
2. **Reconcile the "three readiness models"** — the two audits disagreed on which services duplicate readiness logic (candidate sets: `readiness`+`wellness.getWellnessScore`+`next-gen-metrics` vs `readiness`+`load-monitoring`+`flag-football-periodization`). Verify the real picture and write one short note declaring `readiness.service` (server) canonical. *Investigation + doc, ~1–2h, no behavior change.*

## NEEDS-DECISION — has Supabase schema/API implications (flagging per your rule; I won't touch without sign-off)
3. **Hydration logging persistence** — `tournament-nutrition-state.service.ts:166–205` logs in-memory, batch-persists at event end → data loss if the tab closes mid-tournament, and blocks push notifications. Memory note suggests a persisted `athlete_hydration_logs` table. *Needs a Supabase table/write-pattern decision.*
4. **`games`/`tournaments` → `competition_events` migration** — `profile-data.service.ts:65` reads legacy `games`; federation import still writes `tournaments`. Consolidating onto the spine touches schema + the import job. *Backend coordination + migration.*
5. **`ownership-transition.service`** — relies on `ownership_transitions` table flagged schema-drifted/RLS-incompatible (lines ~33–43); silently degrades to null, so the accountability audit trail isn't captured. *Fix backend RLS/schema, or remove the service — your call.*
6. **`team_players` projection sync** — confirm a Supabase trigger/app-sync keeps it aligned with `users`/`team_members` edits, else roster views drift.

## DEFER-to-port — UX should drive these (verify end-to-end on a real screen)
- Consolidate overlapping training services (`training-plan` / `unified-training` / `training-session-detail`) once the UX defines the session model.
- Delete or re-wire the now-inert UI-glue services against the new shell.
- Split the 1000–1650 LOC monoliths (`acwr.service`, `channel.service`, `training-plan`, `unified-training`) and externalize the encyclopedia `*.data.ts` files (JSON/Supabase config) — only when their screens are rebuilt.
- Add specs for `recovery`, `training-safety`, `team-notification`, `privacy-settings` as those features are ported.
- Sunset legacy `flag-football-periodization.service` (encyclopedia) if the periodization page isn't rebuilt.
- Verify `chat_messages` persistence for AI coach; confirm `channel.service` is still used by push.

## Recommended next step
Apply only the two **FIX-NOW** items now (safe, no schema change), each behind its existing service spec. Hold items 3–6 for an explicit decision (Supabase implications). Everything else rides with the port, UX-driven. Then proceed to wireframes (Phase B).
