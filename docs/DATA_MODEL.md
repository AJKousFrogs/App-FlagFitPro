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

### Schedule & Competition  ·  **input (spine)**
- **Canonical: `competitions` + `competition_events`** (+ `v_athlete_schedule`). **DROP legacy:** `tournaments`, `games`, `fixtures` (migrate the one `profile-data` read off `games`). Game detail: `game_events`, `game_participations`, `player_game_summary` (keep). Tournament logistics: `tournament_day_plans`, `tournament_budgets`, `tournament_lineups`.

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
| legacy `tournaments`/`games`/`fixtures` | migrate to spine; drop |
| 3 identity conventions | → `user_id` (A2, per feature) |
| settings/preferences sprawl | collapse to `user_settings` (+ `athlete_training_config`) |

---

## Progress log
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
