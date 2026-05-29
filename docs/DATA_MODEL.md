# FlagFit Pro — Data Model (canonical Supabase dictionary)

**Status:** target model + consolidation plan (2026-05-29). **This is the single source of truth for what every table is for.** No table should exist that isn't listed here; no fact should have two homes.

## The rules (enforced)
1. **One canonical table per domain.** Duplicates get merged into the canonical and dropped.
2. **One identity column: `user_id`** (= `auth.uid()`). No `athlete_id` / `player_id`. (See `ATHLETE_ID_CONVENTION.md`.)
3. **No cross-domain columns.** Training load never lives in a wellness table; hydration never in wellness; etc.
4. **Inputs vs Derived.** Every table is exactly one **role**:
   - **input** — a human enters it once (wellness, hydration events, sessions, logs, measurements).
   - **derived** — computed from inputs, rebuildable, **never hand-edited** (readiness, ACWR, load aggregates, stats, caches).
   - **reference** — shared catalog/content (exercises, knowledge, achievement defs).
   - **junction/log/audit** — relationships and append-only logs.
5. **Log raw once, derive the rest.** Never ask the user for both a raw value and its summary (the hydration anti-pattern).

---

## Domain map (canonical + actions)

### Wellness — subjective daily check-in  ·  **input**
- **Canonical: `daily_wellness_checkin`** (sleep_quality, sleep_hours, energy, soreness(+areas), stress, mood, motivation).
- **DROP:** `wellness_logs`*, `wellness_entries`, `wellness_data`. (*`wellness_logs` also misused for training-load — re-home first, see Training.)
- **REMOVE column:** `hydration_level` → hydration is its own domain.

### Hydration — actual fluid intake  ·  **input (events)**
- **Canonical: `athlete_hydration_logs`** (one row per drink: ml, type, time). Daily total & adherence are **derived**, never entered.
- **DROP:** `hydration_logs` (migrate code + any rows). **Fixes your example:** log "250 ml tea @ 10:27" once; nothing asks for a separate subjective hydration number.

### Training — sessions & load  ·  **input**
- **Canonical: `training_sessions`** (planned/performed session + its load = RPE×min).
- **Re-home:** the training-load write that currently lands in `wellness_logs` (`daily-protocol.js`) → `training_sessions`/`session_rpe_data`.
- **Resolve duplicates (verify columns, then merge):** `sessions` (legacy, 12 col), `workout_logs` (20 col, athlete-logged actuals) → fold into `training_sessions` + `session_rpe_data`; keep `session_exercises` as the per-exercise child. `qb_throwing_sessions`, `micro_sessions` = specialized inputs (keep, keyed user_id).
- Reference: `training_session_templates`, `practice_plans`, `training_programs`, `training_phases`, `warmup_protocols`.

### Load & ACWR — **derived (caches of training_sessions)**
- Canonical compute: `netlify/functions/utils/acwr.js` (EWMA + uncoupled). 
- **Collapse the cache sprawl:** `load_daily`, `load_metrics`, `load_monitoring`, `training_load_metrics`, `training_stress_balance`, `acwr_calculations`, `acwr_history`, `acwr_reports` → keep **at most one** trend/history cache (e.g. `acwr_history`) for dashboards; derive everything else on read. Drop the rest. **Drop the superseded `compute_acwr` Postgres function.**

### Readiness — **derived**
- **Canonical: `readiness_scores`** (server output, read-through). `athlete_daily_state` = the per-day rollup; keep one, fold the other.

### Recovery / Injury / Return-to-play  ·  **input + reference**
- Inputs: `recovery_sessions`, `injuries`, `return_to_play_protocols`. Reference: `recovery_protocols`, `injury_risk_factors`. (`recovery_blocks` = training plan child — classify with Training.)

### Nutrition & Supplements  ·  **input + reference**
- Inputs: `nutrition_logs`, `supplement_logs`. Goals: `nutrition_goals`. **Verify & merge:** `supplements_data` vs `supplement_logs` (one is intake events, one looks like a catalog — keep events as input, fold/relabel the other as reference or drop).

### Schedule & Competition  ·  **input**
**CORRECTION (2026-05-29, deep audit):** `games` is **NOT** a duplicate of the spine — they are two distinct domains, both canonical:
- **Schedule-density spine** (`competitions` + `competition_events` + `v_athlete_schedule`): per-team calendar *event slots* (`starts_at`, `expected_game_count`, `importance`) that drive load/density planning. Canonical for "what's coming + how dense".
- **Game detail** (`games` + `game_events` + `game_participations` + `player_game_summary`): individual games with `opponent_team_name`, scores, `is_home_game`, `game_time`, and `game_id` (the join key for play-level stats). Read by ~14 functions (daily-training, ai-chat, team-calendar, player-stats, scouting, game-tracker…) **and written** (games-core create/update, game-events). The spine cannot express opponent/score/game_id → **`games` must NOT be dropped.**
- **`fixtures`** (legacy, empty): retired from the readiness path (calc-readiness now spine-only). Remaining user is the `fixtures.js` CRUD endpoint; drop deferred until that endpoint is retired with the federation-import work.
- **Broken readers to fix (separate correctness task):** `coach-core.js:759`, `scouting.js:191`, `utils/supabase-client.js:681` query non-existent `home_team_id`/`away_team_id`/`game_start`; `game-day-recovery.service.ts:42` reads non-existent `player_id`; `profile-data.service.ts:65` reads non-existent `participants`. These silently return empty — fix or delete.
- Tournament logistics: `tournament_day_plans`, `tournament_budgets`, `tournament_lineups` (keep). `tournaments` (empty) — review with federation import.

### Identity / Profile / Teams  ·  **input**
- `users` (identity), `team_members` (role), `teams`. **Merge `team_players` → projection of users+team_members.** `physical_measurements` canonical; `physical_measurements_latest` = derived view (keep as view, not a table). Settings: collapse the `*_preferences`/`*_settings` sprawl (`user_preferences`, `user_settings`, `user_ai_preferences`, `notification_preferences`, `user_notification_preferences`) → one `user_settings` (JSON) + keep `athlete_training_config` for training params.

### Performance & Stats  ·  **derived/input**
- Stat inputs: `passing_stats`, `receiving_stats`, `flag_pull_stats`, `situational_stats`, `performance_records`, `performance_tests`, `player_skill_assessments`. Caches: `player_training_stats`, `weekly_training_analysis`, `analytics_aggregates`, `coach_analytics_cache` (derived — rebuildable).

### Reference content  ·  **reference**
- Exercises: **pick one of** `exercises` / `exercise_library` / `exercise_registry` / `exercisedb_exercises` as canonical; the discipline tables `isometrics_exercises`, `plyometrics_exercises` either fold in (type column) or stay as typed views. Knowledge/evidence: `research_articles`, `knowledge_base_entries` (+ search indexes) — **load the seed data** (currently empty).

### AI / Chat · Social/Comms · Film/Playbook · Cycle · Consent/Audit · Payments
- Keep per-domain; main action is `user_id` standardization + dropping any unused. Consent/audit/log tables are append-only (correct as-is). Cycle tracking (female athletes) stays its own domain.

---

## Confirmed drift register (do these)
| Drift | Action |
|-------|--------|
| 4 wellness tables | check-in done → drop `wellness_entries`, `wellness_data`; re-home + drop `wellness_logs` |
| 2 hydration tables + subjective dup | canonical `athlete_hydration_logs`; drop `hydration_logs`; remove wellness `hydration_level` |
| training-load inside `wellness_logs` | re-home to `training_sessions`/`session_rpe_data` |
| 8 load/ACWR cache tables + dead `compute_acwr` proc | derive via util; keep ≤1 history cache; drop rest + proc |
| `sessions`/`workout_logs` vs `training_sessions` | merge to one session model |
| `supplements_data` vs `supplement_logs` | events = input; other = reference or drop |
| ~~legacy `games`/`fixtures`/`tournaments` → spine; drop~~ | **CORRECTED:** `games` = canonical game-detail (keep, distinct from spine); `fixtures` retired from readiness (drop deferred); `tournaments` review w/ federation |
| 3 identity conventions | → `user_id` (A2, per feature) |
| settings/preferences sprawl | collapse to `user_settings` (+ `athlete_training_config`) |

---

## Progress log
- **2026-05-29 — Phase 11 done (live DB):** fixed stored functions the table drops had broken (function *bodies* referenced dropped tables — a gap in earlier code/FK/view/trigger checks): `upsert_wellness_checkin` (dropped wellness_entries dual-write), `complete_training_session` + `log_training_session` (dropped workout_logs shadow). Comprehensive scan confirms no remaining broken functions (`process_hard_deletion` is `to_regclass`-guarded). Dropped the superseded old SQL ACWR pipeline (`calculate_acwr`/`_safe`/`calculate_*_load`/`update_load_monitoring`). Pinned `search_path` on 4 active functions (security advisor). Migration `20260529220000`. **Security advisors:** 92 anon-executable SECURITY DEFINER functions (revoke-EXECUTE pass) + leaked-password protection toggle remain as a deliberate follow-up.
- **2026-05-29 — Phase 10 done (live DB):** whole-schema orphan sweep — diffed all ~165 tables vs every code reference + the route/nav feature spec. Dropped 7 verified-orphan tables (0 code/FK/view/function/trigger refs, no feature): `analytics_aggregates`, `article_search_index`, `athlete_daily_state`, `digest_history`, `injury_risk_factors`, `load_management_research`, `sponsor_contributions`. `chatbot_user_context` held back (has a function+trigger). Migration `20260529210000`. **Total: 27 tables + 2 consent views + 1 proc.**
- **2026-05-29 — Phase 9 done (live DB):** completed the `workout_logs` → `training_sessions` merge. 9a: created + verified `v_training_sessions_consent` (auth.uid()-gated, mirrors the audited workout-logs view). 9b: repointed all LIVE netlify code (consent-data-reader, daily-training, training-complete, training-sessions — `player_id`→`user_id` alias, completed-filter, shadow writes removed); dropped `v_workout_logs_consent` + `workout_logs` (0 rows). Migrations `…190000`/`…200000`. **Dormant Angular refs** (workout-data/training-data/training-safety/acwr.service/load-monitoring/privacy-settings) repoint with the supabase-types regen task. **Total: 20 tables + 2 consent views + 1 proc removed across 9 phases.**
- **2026-05-29 — Phase 8 done (live DB):** dropped dead `load_monitoring` cache + its consent view `v_load_monitoring_consent` (the Phase-4 deferral). Cleaned stale entries from consent-data-reader's `CONSENT_VIEWS`/`CONSENT_PROTECTED_TABLES` (advisory lists). Migration `20260529180000`. **18 tables + 1 view + 1 proc removed across 8 phases.**
- **2026-05-29 — Phase 7 done (live DB):** dropped legacy `wellness_logs` (dual-purpose drift). Removed daily-protocol's dead `training_load` write (protocol completion already logs to `training_sessions` → ACWR-neutral); repointed `sleep-data` + `smart-training-recommendations` wellness/sleep reads to `daily_wellness_checkin`. Migration `20260529170000`. **Remaining sessions work:** `workout_logs` → `training_sessions` merge (consent view + realtime + write shadows) — its own focused phase.
- **2026-05-29 — Phase 6 (schedule) done (code only):** deep audit **overturned the "drop `games`→spine" plan** — `games` is canonical game-detail (opponent/scores/`game_id` joins + write paths), a distinct domain from the density spine; **kept.** Removed `calc-readiness`'s stale `fixtures` fallback (spine `v_athlete_schedule` is sole next-event source). `fixtures` drop deferred (CRUD endpoint). No table dropped. Flagged 5 broken readers (querying non-existent columns) for a separate correctness fix.
- **2026-05-29 — Phase 5 (partial) done (live DB):** dropped legacy `sessions` table (never written; trends.js guarded, training-metrics graceful). Canonical = `training_sessions`. Migration `20260529160000`. **Deferred:** merge `workout_logs` → `training_sessions` + re-home daily-protocol's training-load write out of `wellness_logs`, then drop `wellness_logs` (live write paths → own phase).
- **2026-05-29 — Phase 4 done (live DB):** dropped 6 never-written ACWR/load cache tables (`load_daily`, `training_load_metrics`, `acwr_calculations`, `acwr_history`, `acwr_reports`, `load_caps`); ACWR is computed on-read via `utils/acwr.js`. Guarded `consent-data-reader` so missing tables read empty. **Deferred:** `load_monitoring` (consent view `v_load_monitoring_consent` + resource→view map) and dormant Angular readers (repoint to `/api/compute-acwr` at rebuild). Migration `20260529150000`.
- **2026-05-29 — Phase 3 done (live DB):** wellness consolidation finished — dropped legacy `wellness_entries` + `wellness_data` (0 queries, no FK deps). `daily_wellness_checkin` is the sole subjective wellness table. `wellness_logs` kept until the sessions/load phase (dual-purpose training-load). Migration `20260529140000`.
- **2026-05-29 — Phase 2 done (live DB):** hydration consolidated onto `athlete_hydration_logs`; all code repointed (hydration.js, staff-nutritionist.js, tournament-nutrition-state.service); dropped legacy `hydration_logs`. Migration `20260529130000`. **Deferred:** remove subjective `daily_wellness_checkin.hydration_level` + its RPC param at wellness-screen rebuild (hydration must not be a wellness field → no double entry).
- **2026-05-29 — Phase 1 done (live DB):** dropped 6 verified-dead tables (`session_rpe_data`, `training_stress_balance`, `load_metrics`, `exercise_logs`, `exercise_library`, `supplements_data`) + the superseded `compute_acwr()` proc. Migration `20260529120000_drop_dead_tables_phase1.sql`.
- **Audit corrections:** `user_preferences` (3 refs) and `exercisedb_exercises` (1 ref) are NOT dead — keep/repoint, don't drop. The aspirational tables `exercise_registry`, `ff_exercise_mappings`, `movement_patterns` **do not exist** in the DB — removed from scope.
- **Still dead-cache, but ghost-READ by code (repoint reader → `/api/compute-acwr` first, THEN drop):** `load_daily`, `load_monitoring`, `training_load_metrics`, `acwr_calculations`, `acwr_history`, `acwr_reports`, `load_caps`.

## Migration sequence (reversible Supabase migrations, pre-launch = cheap)
1. **Wellness** — drop `wellness_entries`/`wellness_data` (post-deploy); remove `hydration_level` from check-in.
2. **Hydration** — repoint code `hydration_logs` → `athlete_hydration_logs`; migrate rows; drop `hydration_logs`.
3. **Training-load re-home** — move `daily-protocol` load write to `training_sessions`; then drop `wellness_logs`.
4. **Load/ACWR** — derive-on-read; drop redundant cache tables + `compute_acwr` proc.
5. **Sessions** — merge `sessions`/`workout_logs` → `training_sessions` (+ `session_rpe_data`).
6. **Identity → `user_id`** — per feature, per `ATHLETE_ID_CONVENTION.md`.
7. **Settings, supplements, exercises, schedule-legacy, readiness** — one domain at a time.

Each step: pick canonical → repoint code → backfill (trivial) → verify (function tests) → drop. The full table drops are **deploy-gated** (live DB is shared with deployed functions).

## Governance — so it can't re-rot
- **This file is mandatory.** A table not listed here should not exist.
- **CI guard** (proposed): fail the build if a new table isn't in `DATA_MODEL.md`, or adds `athlete_id`/`player_id`, or a wellness table gains a hydration/training column.
- All schema changes via Supabase MCP migrations, reversible, one domain at a time.
