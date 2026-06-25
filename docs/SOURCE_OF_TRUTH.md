# FlagFit Pro — Source of Truth

**The single authoritative doc.** It replaces the prior ~33 hand-written docs (which drifted; see git history). Rule: where this file or the generated files conflict with old prose, **ground truth wins**. Ground truth, in priority order: live Supabase schema → actual routes/handlers → service code → applied migrations. Prose is not ground truth.

- **Data Model** (generated, exact live names): [`docs/generated/DATA_MODEL.md`](generated/DATA_MODEL.md)
- **Endpoint Reference** (generated): [`docs/generated/ENDPOINTS.md`](generated/ENDPOINTS.md)
- **Live schema snapshot** (the offline ground-truth input): [`docs/generated/live-schema.snapshot.json`](generated/live-schema.snapshot.json)

Regenerate the generated sections: `npm run docs:regen` (see §8).
Verified against live: **2026-06-23** — 187 base tables, 7 views, 113 Netlify functions, 208 migration files in `supabase/migrations/`. The generated DATA_MODEL/ENDPOINTS + live snapshot were regenerated 2026-06-23.

---

## 1. System Map

**Stack.** Angular 21 (standalone, zoneless, signals; NO PrimeNG — the static-first rebuild removed it) → built by Netlify → Supabase (Postgres + Auth + Realtime + Storage). API is **Netlify Functions** under `netlify/functions/*.js`, exposed at `/api/*` via `netlify.toml` redirects. Functions use the **ESM** `export const handler` signature (not `exports.handler`) and the shared service-role client in `netlify/functions/supabase-client.js`. There is **no `angular/src/app/features/` directory** — feature screens are direct children of `angular/src/app/` (today, wellness, training, stats, schedule, competition, roster, settings, onboarding, …). Routing: `app/app.routes.ts` + `app/core/routes/feature-routes.ts`.

**Engine (server-canonical).** Readiness, ACWR/load, and the daily prescription are computed server-side and read-through by the client — the UI renders, never re-derives. Readiness: `netlify/functions/calc-readiness.js` → `readiness_scores`. ACWR: `compute-acwr.js` + `utils/acwr.js` (21-day chronic EWMA) over `training_sessions`. Schedule spine: `v_athlete_schedule` (union across team memberships + athlete-entered `athlete_events`).

**Lanes.** `/api/coach-*` and `/api/staff-*` (nutritionist/physiotherapist/psychology) are role-gated staff lanes; most athlete features hit the un-prefixed lanes. Many functions are **routers** that delegate to sub-modules via ESM import (e.g. `social.js` → `chat.js`/`community.js`; `training.js` → `training-*`); sub-modules have no own `/api` redirect but are reachable through the parent.

**Realtime.** `core/services/realtime.service.ts` is the central `postgres_changes` manager (subscribes `training_sessions`, `daily_wellness_checkin`, `readiness_scores`, `chat_messages`, `channels`, `notifications`, `team_members`, `coach_activity_log`, `games`, `messages`, `performance_metrics`). `acwr.service` also subscribes `training_sessions`; `channel.service` delegates to `realtime.service`. (Realtime only fires for tables in the `supabase_realtime` publication — verify before relying on it.)

**Auth.** Supabase Auth, localStorage + Bearer token (NOT cookies; no CSRF tokens). The route guard `core/guards/auth.guard.ts` is **config-gated** by `environment.auth.required` — open in dev/smoke, enforcing in prod. Only two guards exist: `auth.guard.ts`, `staff.guard.ts`.

---

## 2. Data Model

Generated, exact live names/columns/nullability, with which endpoints touch each table and a DRIFT flag for live tables lacking a migration file: **[`docs/generated/DATA_MODEL.md`](generated/DATA_MODEL.md)**. 187 base tables, 7 views (`physical_measurements_latest`, `user_achievements`, `v_athlete_schedule`, `v_injuries_unified`, `v_pending_event_participation`, `v_seed_integrity`, `v_training_sessions_consent`). Canonical entity names that have historically been mis-inferred: wellness = **`daily_wellness_checkin`** (not `wellness_checkins`/`wellness_logs`); injuries = **`athlete_injuries`** + `v_injuries_unified` (not `injuries`); load source = **`training_sessions`** (not `workout_logs`/`load_monitoring`).

> `supabase-types.ts` was regenerated from the live schema **2026-06-23** (via Supabase MCP `generate_typescript_types`) — the 37-dropped/15-missing drift is resolved (`team_activities`/`proactive_checkins` present, `workout_logs`/`load_monitoring` gone). The live snapshot remains the ground truth for the data model; regenerate types again after any schema change.

## 3. Endpoint Reference

Generated, every route with method / `/api` path / tables-and-RPCs touched / EXERCISED|ORPHANED: **[`docs/generated/ENDPOINTS.md`](generated/ENDPOINTS.md)**. 113 functions (111 exercised, 2 orphaned: `auth-reset-password`, `exercisedb`). Orphaned endpoints stay listed so nobody rebuilds them. As of 2026-06-23 **no function references a non-existent table** — the ghost-table `.from()` refs were retired (see §6).

---

## 4. Feature Status Ledger  ← READ THIS BEFORE BUILDING ANYTHING

Status: **LIVE** (wired end-to-end, tables exist) · **PARTIAL** (works but with gaps/bugs) · **GHOST** (routed/coded but queries non-existent tables — effectively broken) · **ORPHANED** (exists, no frontend) · **PLANNED** (not built).

| Feature | Status | Where it lives (files → tables) | Notes / known bugs |
|---|---|---|---|
| Today / home (prescription + readiness + ACWR bands) | LIVE | `today/` + periodization/readiness/acwr services → engine | — |
| Daily wellness check-in | LIVE | `wellness/`, `WellnessService` → RPC `upsert_wellness_checkin` → `daily_wellness_checkin` | Sliders/supplements now prefill from today's row |
| Readiness scoring | LIVE | `calc-readiness.js` → `readiness_scores` | Fixed 2026-06-09: `sleep_score`/`wellness_score` were `numeric(4,2)`, overflowed at 100 |
| ACWR / training load | LIVE | `compute-acwr.js`, `utils/acwr.js`, `acwr.service` → `training_sessions` | 21-day chronic EWMA |
| Training sessions / logging | LIVE | `training/`, `/api/training-sessions` → `training_sessions` | Session-log defaults to prescribed RPE/min. Coach reads/writes team-scoped 2026-06-09 (RLS `merged_select/update_training_sessions_public` + `training_sessions_staff_insert`, guard `canModifySession`): staff may only touch sessions of teams they actively staff; `team_id IS NULL` = personal, owner-only |
| Schedule (spine + athlete events) | LIVE | `schedule.js`, `athlete-events.js` → `v_athlete_schedule`, `athlete_events` | — |
| Competition / RSVP / availability / lineups | LIVE | `competition/`, `event-availability.js`, `event-participation.js` → `competition_events`, `event_*` | — |
| Supplements daily log | LIVE | `supplements/`, `/api/supplements` → `supplement_logs`, `user_supplements` | — |
| Hydration | LIVE | `/api/hydration` → `athlete_hydration_logs` | — |
| Recovery modalities (equipment-gated) | LIVE | `recovery.service`, `recovery-core.js` → `recovery_protocols/_blocks/_sessions` | — |
| Injury / tightness / return-to-play | LIVE | `injury.service`, `return-to-play.js` → `athlete_injuries`, `v_injuries_unified`, `return_to_play_protocols` | — |
| Achievements / streaks | LIVE | `achievements.js` → `player_achievements`, `achievement_definitions`, `player_streaks`, `user_achievements` (view) | — |
| Profile / settings / onboarding | LIVE | `user-profile.js`, `player-settings.js` → `users`, `athlete_training_config`, `user_preferences` | — |
| Chat / channels / realtime | LIVE | `chat.js`, `channel.service`, `realtime.service` → `channels`, `chat_messages`, `channel_members` | — |
| Notifications / push | LIVE | `notifications.js`, `push.js` → `notifications`, `push_subscriptions` | — |
| Knowledge base / search | LIVE | `knowledge*.js` → `knowledge_base_entries`, `knowledge_search_index`, `research_articles` | — |
| Roster / team management | LIVE | `roster.js` → `teams`, `team_members`, `roster_audit_log` | — |
| Coach suite (activity/inbox/analytics/film) | PARTIAL | `coach-*.js` → `coach_*` tables (exist) | The `team_chemistry` / `game_stats` ghost refs were retired (2026-06-23: **0** `.from()` refs in functions) — those analytics stay unbuilt but no longer error |
| Nutrition | PARTIAL | `nutrition.js` → `nutrition_logs/_plans/_reports`, `meal_templates` (exist) | `usda_foods` food-search ghost ref retired (no longer queried) |
| Equipment | PLANNED | `equipment.js` (not built) | `equipment_items`/`equipment_assignments` don't exist; no live `.from()` ref |
| Officials | PLANNED | `officials.js` | Tables don't exist; no live `.from()` ref |
| Depth chart | PLANNED | `roster.js` `/depth-chart` → explicit `feature_not_available` 404 | `depth_chart_*` not live; guarded 404, no error |
| Program cycles | PLANNED | `programs.js` `/program-cycles` → explicit `feature_not_available` 404 | `program_cycles`/`player_program_cycles` not live; `player_programs` does; guarded 404 |
| Seasons / season reports | PLANNED | `season-reports.js`, `season-archive.js` | `seasons`/`season_summary_reports` not live; `season_archives` exists; no live `.from()` ref |
| Scouting | PLANNED | `scouting.js` | `scouting_reports` not live; no live `.from()` ref |
| Team activities (coach calendar overrides) | SCHEMA-ONLY | `team-activity-resolver.js` → `team_activities` (table created 2026-06-22) | Table + read path exist; no writer/UI yet — resolver returns empty (inert by design) |
| Privacy consent views read | REMOVED | (was `privacy-settings.service.ts` → `v_workout_logs_consent`/`v_load_monitoring_consent`) | Dead code deleted 2026-06-09; views never existed live |
| ExerciseDB lane | ORPHANED | `exercisedb.js` (`/api/exercisedb`) | No frontend ref; FE uses `exercises` lane |
| QB throw-count / arm-care lane | ORPHANED | `qb-throwing.js` (`/api/qb-throwing`) → `training_sessions.throw_au`/`throw_count`, `qb_throwing_sessions` | Backend + `api.service.ts` route table exist; zero frontend callers — no UI logs a throw count, so dosing-threshold gating has no data to act on |

> The ~40 ghost-table `.from()`/`.rpc()` references that errored at runtime have been retired — `docs/generated/ENDPOINTS.md` (regenerated 2026-06-23) now shows **no** unknown-table refs. The PLANNED lanes above are routed-but-unbuilt and return guarded 404s where wired.

---

## 5. Spec Laws (durable product rules)

1. **P0 — never advance past a failed critical write.** If a write that the next step depends on fails (onboarding profile, check-in, account action), surface the error and stop; do not navigate forward as if it succeeded.
2. **Physio/injury blocks override training prescriptions.** An active `athlete_injuries` / tightness signal takes precedence over the engine's prescribed session — the plan works around the flagged region.
3. **Nutrition is food-first.** Athlete-facing nutrition uses food/portion language, not g/kg notation.
4. **Answer-first Today ordering.** The Today screen leads with the day's answer (prescription + readiness), diagnostics below the fold.
5. **Onboarding delivers value before asking for complexity.** Show usefulness early; defer heavy data collection.
6. **Server is canonical for the engine.** Readiness/ACWR/prescription are computed server-side; the client renders and never re-derives. Missing data → explicit empty state, never a fabricated number.
7. **No fabricated UI data.** Inputs prefill from real saved state; never show placeholder values that masquerade as the athlete's data.

### 5a. Recovery modalities & adaptive load (detailed law)

- The athlete-facing prescription ("Today"/"This week") is owned by the **client `periodization.service.ts`** (`prescribeFor`/`decideBasePrescription`). Recovery and injury precedence are wired **here**, not in the server-side `daily_protocols`/`ai-chat` generator (which remains for coach/AI features, not the athlete plan).
- Equipment inventory is stored on **`athlete_training_config.available_equipment`** (jsonb array of equipment ids) — reuse this column; do **not** use the dead/missing `athlete_recovery_profiles`/`equipment_items` tables. Catalogue of ids+labels lives as reference data, never hardcoded into logic.
- **Equipment gate (LAW):** the engine may only recommend a modality the player actually owns/has access to (no Normatec without compression boots, ever).
- **Modality triggers (data-driven):** compression boots → post high-load / ACWR spike / congested fixtures; massage gun → pre-session activation or post-session localized tightness; stretching/mobility → tightness, low-readiness, maintenance (always available, bodyweight); massage knives (IASTM) → persistent localized tightness; foam roller → general post-session soreness; physio referral → severity threshold crossed **or** recurrence.
- **Self-report → recalculation (Merlin loop, LAW):** a region tightness/soreness report (Wellness region selector or Merlin chat) is persisted to `daily_wellness_checkin.soreness_areas` **and** an active restriction in `athlete_injuries` (`recovery_status='active'`, `activity_restrictions[]`, short auto-expiry). The system **MUST recalculate** load/RPE/prescription — never silently keep the old plan. **Injury/physio precedence overrides training (LAW):** a relevant signal down-regulates/removes sprint/high-intensity work for the affected region regardless of the periodization plan (competition/taper safety branches still apply). Every override is deterministic and logged (region, severity, source; intent before→after).

### 5b. Daily-input forms — prefill & non-destructive submit (detailed law)

Canonical lifecycle for every recurring input form (wellness check-in, supplements, post-event participation, self-report, RPE/session log). A form that opens with hardcoded defaults **and** submits via upsert silently destroys saved data on a no-touch resubmit — **P0**.

1. **On open — fetch** the existing record for the period from the canonical table (verified name — `daily_wellness_checkin`, not `wellness_checkin`).
2. **Prefill** from SAVED values if a record exists; else a genuine empty/unset state — never fabricated mid-range defaults that look real.
3. **Distinguish unset from a real value** (touched/dirty flag or null state); gate submit on it where a default could be mistaken for a real entry.
4. **On submit — non-destructive:** never overwrite a saved column with an untouched default. Partial update of changed fields, or full prefill so the upsert carries real values. (`upsert_wellness_checkin` COALESCEs null→existing, so sending only touched fields is safe there.)
5. **Failure:** if the prefill fetch fails, surface it and **block the destructive submit** — do not fall back to defaults and write.

Reference implementations: the wellness check-in prefill `effect()` and `profile-edit.component.ts` prefill-from-GET. Append-only logs (hydration, training-session) must be **idempotent per natural key** (one `training_sessions` row per `user_id`+`session_date`+`session_type`) so a double submit updates rather than double-counts into ACWR.

---

## 6. Known Drift & Open Issues

Unfixed:

> **Deferred feature-port bugs:** code↔schema mismatches that need a product decision — not safe to fix mechanically. These ARE the **PLANNED lanes in §4** (equipment, officials, depth-chart, program-cycles, seasons, scouting): resolve each when its feature is rebuilt (don't ship a screen over a known-broken data path). *(The standalone `redesign/PORT_BUG_REGISTER.md` was retired in the 2026-06-23 doc clean-slate; the §4 Ledger is now the single tracker.)*

- ~~**Ghost-table endpoints (TRUE-BUT-BUGGY).** ~40 `.from()`/`.rpc()` refs hit absent tables (equipment, officials, depth-chart, `usda_foods`, `program_cycles`, `seasons`, `scouting_reports`, `team_chemistry`, `game_stats`, …) and errored at runtime.~~ **Retired 2026-06-23** — `ENDPOINTS.md` now shows **0** unknown-table refs; the routed-but-unbuilt lanes are PLANNED in §4 (depth-chart/program-cycles return explicit `feature_not_available`).
- ~~**Privacy consent-view bug.** `privacy-settings.service.ts` read `v_workout_logs_consent` / `v_load_monitoring_consent` (non-existent).~~ **Fixed 2026-06-09** — both `getConsentAware{LoadMonitoring,WorkoutLogs}` methods were dead (zero callers, dormant since the UI was removed) and queried dropped views; deleted. If consent-aware load/session reads are rebuilt, use the live `v_training_sessions_consent`.
- ~~**`supabase-types.ts` is stale**~~ **Regenerated 2026-06-23** from the live schema (Supabase MCP) — drift resolved.
- ~~**Two migration directories.**~~ **Fixed 2026-06-25** — `database/migrations/` (172 files, 0% overlap with applied history) deleted entirely. `supabase/migrations/` is now the single tracker, reconciled against the live project's 169 applied versions (Supabase MCP `list_migrations`): 9 files renamed to match their actual applied timestamp (the `athlete_personal_events` case and 8 others — divergence was worse than the "4 recent cases" originally logged here), and 9 applied migrations that had **no local file at all** (applied directly to prod, never committed — the whole `prescription_templates`/`readiness_gates`/`weather_substitution_rules`/`contraindication_rules`/`taper_rules`/`prescription_audit_log`/`rtp_prescription_approvals`/`injury_gate`/`qb_throw_au`/`season_phases` feature plus `widen_readiness_scores_subscores` and `add_recovery_block_load_columns`) were reconstructed from live schema introspection (columns/indexes/FKs/RLS policies) and committed under their correct applied version. Remaining local-only files all predate `20260130125835` (the first applied/tracked migration) — expected, not drift.
- **Committed secrets.** Old `BACKEND_SETUP`/`LOCAL_DEVELOPMENT` docs contained real-looking Supabase JWTs (now deleted with those docs) — rotate if they were ever real.
- **Auth leaked-password (HIBP) advisor** is unresolved unless the native GoTrue setting is enabled (see §7 auth hardening).
- **2026-06-09 audit — resolved same day** (cross-team session mutation fix: see Ledger):
  - ~~Weather fake location~~ **Fixed**: `weather.js` resolves the caller's team `home_city` (geocoded) when no coords passed; no location → explicit `available:false`, never a default city. Client guard skips on unavailable. San Francisco defaults deleted. Team home_city is set via `teams.home_city` (no settings UI yet — set via SQL/roster admin).
  - ~~No unique constraint on training_sessions natural key~~ **Fixed**: `training_sessions_user_date_type_key` UNIQUE (user_id, session_date, session_type) + `log_training_session` RPC now ON CONFLICT upserts (COALESCE, non-destructive). Migration `20260609192100`.
  - ~~Periodization phase from global `is_active` program~~ **Fixed**: `training-plan.js` + `smart-training-recommendations.js` resolve via the athlete's `player_programs` assignment (prefers `current_phase_id`).
  - ~~Fabricated RPE in load math~~ **Fixed**: `training-plan.js`/`daily-training.js` ACWR now delegate to canonical `utils/acwr.js` (workload ?? rpe×min, missing → excluded). Client `acwr.service` excludes load-less sessions instead of zero-counting.
  - ~~Client ACWR EWMA divergence~~ **Fixed**: client mirrors server (oldest→newest fold, uncoupled 21d chronic, λ=2/(N+1)); evidence presets updated.
  - ~~RPE null-overwrite on resubmit~~ **Fixed**: update branch only writes provided fields, workload recomputed from merged (new ?? saved) pair.
  - ~~`compute-acwr` multi-team `maybeSingle()`~~ **Fixed**: staff-team × athlete-membership intersection across ALL memberships.
- **2026-06-09 audit — closed out (second pass):**
  - ~~Multi-team `limit(1)`/`maybeSingle()` in coach-core + team-activity-resolver~~ **Fixed**: `getCoachTeamId` is deterministic (most recent active membership) and accepts an explicit team — `?teamId=` on the coach GET lanes, `teamId` in POST payloads — validated against the caller's staffed memberships. `team-activity-resolver` searches activities across ALL of the athlete's active teams (old `maybeSingle()` errored on >1 membership → silent "no activity"); newest created activity wins.
  - ~~No spec tests for injury/CNS guards~~ **Fixed**: `prescribeFor — injury guard` suite added (severe/moderate/minor scaling, no-op cases, competition-day immunity, injury-beats-weather precedence); CNS spacing suite landed with the feature commit.
  - **Orphaned ghost-lane tests removed** (officials/equipment/depth-chart/scouting/program-cycles/season-reports/tournament-calendar/push ×10 files + absence-request & research-sync cases); stale `user-profile` pg-Pool mock rewritten for the supabase client.

- **2026-06-10 — engine personalization & safety pass (athlete-driven brief):** the prescription engine is now age-, position-, region-, season- and travel-aware. All changes push in the *safe* direction (more conservative); adversarially verified.
  - **Nutrition**: `CARB_PER_KG` periodised to energy expenditure — a short sprint day is 4.5 g/kg (was a flat 6 → 480g for 80kg), pre-game/game-day stay elevated (6/7). Heat now adds +0.5L fluid (was documented, never applied).
  - **Injury regions** (`athlete-injuries.js restrictionsFor`): added **soleus** + patella/adductor/tibialis/plantar/ITB/tendon to lower-limb, a **core/trunk** category, and an **upper-body** category; an unrecognised region now **fails safe** (restricts sprint + high-intensity + throwing). The client injury guard derives `restrictsThrowing` so an upper-body issue pulls throwing/snapping without touching running.
  - **Age** (`cnsRecoveryHoursForAge`): CNS recovery window <35→48h, 35–39→60h, 40+→72h (monotonic, floored, from `date_of_birth`).
  - **Position** (`withPositionEmphasis`): QB/WR-DB/center accessory-prehab emphasis (additive only — never changes intent/load), surfaced on Today; throwing-restriction overrides QB/center into a protect-the-arm message.
  - **Tournament congestion**: `peakDayGameCount` now a conservative worst-day estimate (`ceil(games/(days-1))`, not the average — averaging fail-open fixed); ≥3 games/day trips heavy-density de-load regardless of the 10/14d total.
  - **Season phases**: added **peak** (sharp/low-volume) and **postseason** (regeneration); split seasons (multiple windows incl. a mid-season off gap) resolve per day via `macroPhaseFor`. Onboarding picker offers Off/Pre/In/Peak/Post-season.
  - **Travel**: `daily_wellness_checkin.travel_hours` + extended `upsert_wellness_checkin` RPC + a wellness chip control + a bounded **readiness penalty** in `calc-readiness` (1–2h −2, 3–5h −4, ≥6h −8; subtract-only).
  - **Knowledge base**: 30 → **104** evidence-based, merlin-approved entries (hamstrings, knees, glutes, core, isometrics→plyometrics, warm-ups, rest, age bands, QB/WR/DB/center demands, travel, nutrition periodisation). Adult-male-16+ only.
  - Calibration constants (carb g/kg, CNS hours, congestion threshold, travel penalty) are documented in-code as **starting points** for the coach to tune against team history.
  - **Per-game ACWR load**: `calc-readiness` now injects an estimated per-game internal load (~350 AU, tunable) for PAST games from the schedule spine into the daily-load map (multi-day events spread across days; per-day MAX(logged, estimate) so it never lowers a day and avoids double-count), so a tournament's acute load/ACWR rises instead of reading falsely safe.
  - ~~**Open / deferred:** QB throw-count / center snap-count → quantified load gating (needs the throw/snap logs wired + the coach's dosing thresholds)~~ **Reassessed 2026-06-25**: not actually a "needs building" gap — `netlify/functions/qb-throwing.js` (424 lines, arm-care endpoint, writes `training_sessions.throw_au`/`throw_count`) and the `api.service.ts` route table already exist but have **zero callers anywhere in the Angular app** — orphaned, same pattern as the ExerciseDB lane in §4. No UI ever logs a throw count, so there's no data for the engine to gate on regardless of dosing-threshold decisions. Region-specific prehab/return-to-play *progression* engine (the knowledge base covers the education); season leap-day (Feb 29) + user-declared overlapping windows are minor edge cases. `ensure_public_user_profile` has a pre-existing `last_name` NOT NULL quirk for email-only auth users (affects all wellness writes for such users).

- **2026-06-10 — architecture refactor + COMPOSE wiring (two engines clarified):** an audit confirmed `periodization.service.ts` (Angular, **intent/targets** — Today/Training/Gameday) and `daily-protocol.js` (backend, **exercise realization**) are TWO engines. Decision: **compose** (intent layer authoritative, daily-protocol realizes exercises for it). Do NOT delete daily-protocol (a 10-module, routed, tested engine; the earlier "dead code" read was wrong).
  - **Class 3 (config extraction, behaviour-neutral):** `TAPER_CONFIG` (taper windows/targets centralised); `baseTargets` (in-season) vs `BUILD_TARGET_OVERRIDES` (pre-season heavier on light intents) — resolves audit **M1** (the divergence is deliberate, now explicit); `INJURY_RESPONSE` (injury caps). Each verified byte-identical against the 85-anchor periodization preserve-list.
  - **Class 1 / finding 1.1:** a practice day on a recovery phase is now honoured at recovery intensity (a `recovery` row in `PRACTICE_PHASE_MODIFIERS`) instead of being dropped; intent is data-driven per row.
  - **COMPOSE backend:** `daily-protocol /generate` optionally takes `{intent, intentLabel, position}`; `mapIntentToSession` + `positionFlagsFor` realize exercises for that intent and fix the `isQB`/center bug (raw `'qb'` ≠ `'quarterback'`). **Backward-compatible** — no intent → legacy path byte-unchanged (8 legacy + 8 mapping tests).
  - **COMPOSE client:** `ProtocolService` posts the intent → Training renders the realized blocks as **block-cards** (re-skin adapted from `todays-practice-redesign-mockup.html`, mapped to app tokens, responsive 1-col→2-up@768). Render contract **verified against real data** (3 protocols / 33 exercises; block_types + exercise fields match the model).
  - **Status:** all of the above is **🔧 BUILT, NOT DEPLOYED**, and the compose stack's intent→exercise *quality* is **not yet e2e-verified** (needs a live intent-passed `/generate`). Coach guide shipped: `FlagFit-Coach-Guide.docx` (+ internal appendix).
  - **2026-06-23 closeouts:** ~~Class 1 `resolveDayType→applyModifiers` pipeline~~ **closed** — the day-type→`PRACTICE_PHASE_MODIFIERS` pipeline (incl. finding 1.1: practice on a recovery phase honoured at recovery intensity) is now **locked by 7 spec tests** in `periodization.service.spec.ts` (94/94 green). ~~Settings position-picker discoverability~~ **closed** — a primary-position picker is now in Settings → Prefs (`settings.component`), saving `primaryPosition` to `/api/player-settings` and refreshing the prescription engine; labels single-sourced from `POSITION_VOLUME`.
  - **2026-06-24 closeouts:** ~~intent→exercise *quality* e2e verification~~ **verified** against the live stack — `/api/daily-protocol/generate` with an `intent` payload realizes a distinct, intent-correct session per intent (strength→37 ex / sprint→12 / recovery→11 / practice→`practice_day`). ~~Class 2 schema cleanup~~ **done** — `deprecate_dead_fields` phase 2 (`20260624074022`) DROPPED the two `*_deprecated` columns from phase1 after live verification of zero code/view/function/policy/index dependency (dead data: 2× stale `[1,2,4,5,6]`, 16× `0.5`). ~~deploy~~ **not a manual step** — Netlify auto-publishes `main` → production on every merge (rollback: `netlify rollback`).
  - **Still remaining:** Class 2's *deferred* fields (`daily_routine`/`current_limitations`/`flag_practice_schedule`/`max_sessions_per_week`) stay — phase1 found them to be intended features, not dead. Migration-file hygiene (the timestamp-drifted duplicate files in §6 below) is unaddressed.

- **2026-06-23 — load-domain + design-system drift sweep (this session's PRs):**
  - **Schema-drift CI clean slate:** all 44 schema-drift findings resolved (baseline 0); the CI guard (`scripts/check-schema-drift.mjs`) blocks new drift. New tables this window: `team_activities`, `proactive_checkins`; `training_sessions.throw_au` etc.
  - **Canonical load model unified:** `coach-core.js` no longer re-implements ACWR/readiness (was a simple-ratio + fabricated `1.0`/`85`) — both coach paths now use the canonical EWMA engine (`utils/acwr.js`) and the persisted `readiness_scores`. **Consent:** coach-facing readiness is now gated by the blocked set (no longer leaks a consent-blocked athlete's score).
  - **Gameday/tournament load:** `record_event_participation` RPC now **distributes** a multi-day tournament's load across its days (was lumped on day 1) and dedups any same-date competition session, so the two gameday paths can't double-count acute load.
  - **Recovery-block cap enforced:** `buildProtocolDecisionContext` now caps `adjustedLoadTarget` by an active `recovery_blocks.max_load_percent` (was set but never applied to the prescription).
  - **`calculated_readiness` scale:** `wellness-logs.js` now writes 0–100 (was 1–10 into a 0–100 column that `ai-chat`/`coach-core` read).
  - **Week-ahead fix:** `periodization.weekAhead()` applies today's readiness/ACWR only to today (mirrors the weather guard) — future days resolve to their phase-driven plan instead of 7 frozen recovery days.
  - **Design system — Phase E token migration:** the TS color bridge (`design-tokens.util.ts`, `app.constants.ts`) + `index.html` were emitting the **old** CSS var names (`--ds-primary-green`, `--space-*`, …) that no stylesheet defines → empty strings at runtime (broken chart colors, white flash, Poppins). Migrated to Phase E tokens (`--accent`/`--good`/`--s-*`); `index.html` now links Space Grotesk + Plus Jakarta Sans (CSP updated for Google Fonts), dark-default boot CSS. Source of truth: `scss/tokens/_tokens.scss` (`--accent #00E07A`). ~~Deferred: `e2e/color-contrast.spec.ts` rework~~ **Done 2026-06-23** — the spec was reworked off the dead PrimeNG/"white-on-green" rules to enforce **WCAG AA contrast ratios** and lock the ink-on-accent pairing (mint `#00E07A` + `--on-accent` ink ≈ 11:1; white-on-mint would fail). ~~Still deferred: visual-regression baseline regen~~ **Done 2026-06-25** — all 23 baselines in `angular/e2e/__snapshots__/visual-regression.spec.ts/` re-captured against the live app (post-PrimeNG-removal, post-Phase-E tokens); fixed a stale `loginToApp` helper (`waitForURL` only matched `/dashboard|onboarding/`, app now lands on `/today` post-login) that was silently blocking the desktop-suite captures; deleted the orphaned `primeng-card.png` baseline (component no longer exists, no test referenced it).

## 7. Runbooks & Security (operational — folded from the old RUNBOOKS, stale traps fixed)

Canonical: health = `/api/health`; env vars = `SUPABASE_SERVICE_KEY` (primary) **or** `SUPABASE_SERVICE_ROLE_KEY` (fallback) — code checks both via `||` in `supabase-client.js`; set either one; project ref `grfjmnjpzvknmsxrwesx`. `workout_logs` no longer exists — never reference it in ops queries.

**Health / triage.** `curl -s https://<site>/api/health | jq` → expect `{status:"healthy"}`; `degraded`=investigate, `unhealthy`=incident. Logs: `netlify logs:function <name> --last 50`, `netlify logs:build`. Severity: SEV-1 outage <15m, SEV-2 major feature <1h, SEV-3 degraded <4h, SEV-4 cosmetic next-day.

**Deployment rollback.** Fast: `netlify rollback` → re-check `/api/health`. Specific: `netlify deploys --json | jq '.[:10]'` → `netlify deploys:publish <ID>`. Code: `git revert <hash> --no-edit && git push origin main`. Rule: cause unclear after 5–15m → roll back. **Migrations are forward-only** (no down migrations); for DB-caused regressions restore from a pre-migration dump, not `supabase migration down`.

**Backup / restore.** Pre-migration: `supabase db dump -f backups/pre_migration_$(date ...).sql`. Record row counts before/after for `users`, `training_sessions`, `player_programs`. Restore full: `psql "<conn>" < file.sql` (destructive); selective: `SET session_replication_role='replica';` → restore → `'origin'`. Env: `netlify env:list` (encrypted — has secrets); PITR is Supabase Pro-only; Storage buckets are NOT auto-backed-up.

**Account deletion.** request → soft delete (immediate, sessions revoked) → 30-day cancellable queue → hard delete. API `account-deletion.js` (`/api/account-deletion`); edge fn `supabase/functions/process-deletions` (pg_cron 3 AM); DB fns `initiate_account_deletion()`, `cancel_account_deletion()`, `process_hard_deletion(uuid)`, `get_deletions_ready_for_processing()`; tables `account_deletion_requests`, `privacy_audit_log`. Backlog: `SELECT count(*) FROM account_deletion_requests WHERE status='pending' AND scheduled_hard_delete_at<=now();` (warn>10, crit>50). Force: `SELECT process_hard_deletion('<uuid>');`. Auth cleanup: `supabase.auth.admin.deleteUser('<uuid>')`.

**Privacy incident.** GDPR: notify DPA within 72h of a high/medium-risk breach. Containment: rotate Netlify + `SUPABASE_SERVICE_ROLE_KEY`, invalidate sessions, `UPDATE users SET is_active=false WHERE id='<suspect>'`. Correct live columns: `consent_access_log(user_id, accessed_by, access_type, data_category, accessed_at, reason, consent_given)`; `parental_consent` keyed by `minor_user_id`, gate on `status`/`verified_at`. AI opt-out check: `ai_chat_sessions` × `privacy_settings WHERE ai_processing_enabled=false`. Validate: `npm run test:privacy`.

**Auth hardening.** Native HIBP leaked-password check is a GoTrue setting (Dashboard → Auth → Providers → Email, or Management API `PATCH /v1/projects/<ref>/config/auth {"password_hibp_enabled":true}`) — NOT toggleable via SQL; the app-level edge fn does not clear the advisor. ~10 `anon`-executable SECURITY DEFINER fns are RLS helpers (`ff_is_active_team_member`, `ff_is_team_staff`, `has_role`, `is_active_superadmin`, …) and must stay executable; any NEW definer fn that isn't an RLS helper → `REVOKE FROM PUBLIC; GRANT service_role`.

---

## 8. Contributing — the Ledger is the contract

**Any PR that adds or changes a table, endpoint, or feature MUST update §4 (Feature Status Ledger) in the same commit.** This is how we stop rebuilding what exists.

**Regenerating the generated sections** (after a schema or route change):
1. Refresh the live schema snapshot: re-run the Supabase introspection (via Supabase MCP `execute_sql` over `information_schema`) and overwrite `docs/generated/live-schema.snapshot.json` (keep its shape; bump `generatedOn`). Optionally regenerate `supabase-types.ts` too.
2. `npm run docs:regen` — rewrites `docs/generated/DATA_MODEL.md` + `ENDPOINTS.md` deterministically and re-stamps the date.
3. Commit the regenerated files with your change.

If a generated file shows new ⚠️ ghost-table refs or DRIFT, fix the cause or log it in §6 — do not hand-edit the generated files (they are overwritten).
