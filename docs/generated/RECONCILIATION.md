# Documentation Reconciliation (all existing docs vs ground truth)

**Verified against live: 2026-06-09** (live schema snapshot, generated DATA_MODEL/ENDPOINTS, service & migration inventories).
One-time audit artifact. Verdicts: ACCURATE / DRIFT / STALE / UNVERIFIED / TRUE-BUT-BUGGY / GHOST (documented, doesn't exist).

## Totals (≈254 claims across 25 core docs + 7 release notes + 7 runbooks)

| Verdict | Count |
|---|---|
| ACCURATE | 83 |
| DRIFT | 48 |
| STALE | 38 |
| GHOST | 46 |
| TRUE-BUT-BUGGY | 14 |
| UNVERIFIED | 25 |

## Highest-impact findings (a future dev must NOT trust these)
- **PrimeNG is gone** — TECH_STACK/ARCHITECTURE still document it as the UI substrate; no dependency/import exists (static-first rebuild dropped it).
- **No `angular/src/app/features/` directory** — ARCHITECTURE, SINGLE_SOURCE_OF_TRUTH, REPO_DISCOVERY, LOCAL_DEVELOPMENT give `features/...` paths; domains are direct children of `app/`. Every `features/`-prefixed path is broken.
- **Readiness formula wrong** — CALCULATION_SPEC/CALCULATION_MAP document an additive `base 70 + (sleep−5)×3 … weeklyLoad>3000→−10` model; live `calc-readiness.js` uses a weighted required/optional subscore model with no 3000/1000 gate.
- **Consent views `v_load_monitoring_consent` / `v_workout_logs_consent` do NOT exist live** (only `v_training_sessions_consent` does), yet privacy docs cite them AND `privacy-settings.service.ts` issues `.from()` reads against them → runtime-failing client reads. **(real bug)**
- **Dropped tables documented as live**: `workout_logs`, `load_monitoring`, `injuries`, `team_players`, `hydration_logs`, `tournaments`, `tournament_lineups`, `game_stats`, `load_metrics`, `profiles`, plus runbook SQL against `workout_logs` and wrong `consent_access_log` columns.
- **ACWR window**: SCIENCE doc says 28-day EWMA; live `utils/acwr.js` uses 21-day chronic.
- **Counts wrong everywhere**: docs say 80–95 functions / 86+ services / 250+ tables / 55+ migrations; ground truth = 123 functions, 28 services, 177 tables, 146 applied migrations.
- **~40 endpoint GHOST table refs** (equipment, officials, depth-chart, nutrition/`usda_foods`, `team_chemistry`, `program_cycles`…): routed + documented but querying tables absent from live (TRUE-BUT-BUGGY — they error at runtime).
- **Committed JWTs** in BACKEND_SETUP / LOCAL_DEVELOPMENT (security smell).

---

## Group A — architecture/setup

Ground truth: live schema = 177 base tables / 7 views; 123 netlify function files (ENDPOINTS catalogs 121 with 120 exercised + 1 orphaned `exercisedb`); 28 core services; Angular ~21.2; root ESM (`"type":"module"`); 146 applied migrations; `supabase/migrations/` tracks live, `database/migrations/` 100% legacy/unapplied; readiness server-canonical via `/api/calc-readiness`→`readiness_scores`; canonical wellness = `daily_wellness_checkin`. DROPPED: `workout_logs`, `load_monitoring`, `injuries`, `fixtures`, `tournaments`, bare `sessions`, `wellness_entries`, `wellness_logs`, `game_stats`, `usda_foods`, `ai_feedback`(table absent live), `ai_coach_visibility`, `user_profiles`, `team_players`. Verified in code: NO PrimeNG dependency or import anywhere in `angular/`; feature domains live directly under `angular/src/app/*` (not `features/`); all function handlers use `export const handler` (ESM), none use `exports.handler`.

| Doc | Claim (quote/paraphrase) | Ground-truth status | Verdict |
|---|---|---|---|
| ARCHITECTURE.md | Product/app release "4.0.0", "Last Updated January 2026" | Live baseline is v11 (DOCS_INDEX/RELEASE_NOTES_11). Doc never updated | STALE |
| ARCHITECTURE.md | "86+ Core Services (signal-based)" / "75+ more" / dir comment "86+ injectable services" | Live count = 28 services | DRIFT |
| ARCHITECTURE.md | "Netlify Functions (80 serverless functions)" | 123 function files / 121 cataloged | DRIFT |
| ARCHITECTURE.md | "PrimeNG 21 UI Components" / `@Component imports: [...CardModule, ChartModule]` | No PrimeNG dep or import in angular/; static-first rebuild dropped it | GHOST |
| ARCHITECTURE.md | Angular dir `app/features/` with `acwr-dashboard/`, `tournaments/`, `game-tracker/` etc. | No `features/` dir; domains are direct children of `app/` (acwr, competition, schedule, ...); no `tournaments` surface | GHOST |
| ARCHITECTURE.md | Services `acwr-alerts.service.ts`, `ai-chat.service.ts`, `auth.service.ts`, `nutrition.service.ts`, `notification-state.service.ts`, `training-stats-calculation.service.ts` (with line counts) | None present in the 28-service inventory (names are auth-flow-data/ai/readiness/etc.) | GHOST |
| ARCHITECTURE.md | DB "55+ Migration Files" | 146 applied; 194 in supabase/migrations | DRIFT |
| ARCHITECTURE.md | TRAINING TABLES include `workout_logs` "Detailed workout data" | Dropped/merged into `training_sessions` (Phase 9b) | GHOST |
| ARCHITECTURE.md | ANALYTICS TABLES `load_monitoring`, `injuries`, `game_stats` | All dropped; not live (canonical: `athlete_injuries`, `daily_wellness_checkin`) | GHOST |
| ARCHITECTURE.md | AI tables `ai_feedback`, `ai_coach_visibility` | Not live tables (ai_feedback in types only/absent; ai_coach_visibility dropped) | GHOST |
| ARCHITECTURE.md | `daily_wellness_checkin` is canonical wellness | Matches ground truth | ACCURATE |
| ARCHITECTURE.md | Groq LLM (free 14,400/day), Open-Meteo weather, Supabase Auth | Consistent with `/api/weather` + groq-client; plausible | ACCURATE |
| ARCHITECTURE.md | "Llama 3.1 70B" model id | Model id not re-verified against groq-client.js | UNVERIFIED |
| ARCHITECTURE_v11.md | Spine: `competitions`/`competition_events`/`v_athlete_schedule` → `schedule.js` (`GET /api/schedule`) → ScheduleService → PeriodizationService | All live; schedule.js reads `v_athlete_schedule`+`athlete_events` | ACCURATE |
| ARCHITECTURE_v11.md | ScheduleService signals (snapshot/currentPhase/density7d…), PeriodizationService.today() | Matches service inventory | ACCURATE |
| ARCHITECTURE_v11.md | File path `database/migrations/20260508120000_competition_schedule_spine.sql` is where the spine lives | File exists but is in legacy `database/migrations/` (unapplied); live version is `supabase/migrations/20260508100507_competition_schedule_spine.sql` | TRUE-BUT-BUGGY |
| ARCHITECTURE_v11.md | §6 drift: server `calc-readiness` canonical; clients should be read-through | Matches ground truth (readiness server-canonical) | ACCURATE |
| ARCHITECTURE_v11.md | §6 drift: `tournaments`/`games`/`fixtures` legacy tables "still receive writes" | `tournaments`+`fixtures` are DROPPED (not live); only `games` survives | STALE |
| ARCHITECTURE_v11.md | §6: client `load-monitoring` is one of three readiness models | `load_monitoring` table dropped; load-monitoring.service still computes client-side (drift) — table-name claim stale, service claim holds | TRUE-BUT-BUGGY |
| ARCHITECTURE_v11.md | "additive on top of v4.0.0 / in progress" status | v11 is now the baseline, not in-progress-on-v4 | STALE |
| TECH_STACK.md | "Current application release: 4.0.0" | Baseline is v11 | STALE |
| TECH_STACK.md | Angular 21 / signals / zoneless / SCSS / Vitest + Playwright | Angular ~21.2; verified | ACCURATE |
| TECH_STACK.md | "UI library: PrimeNG 21" and "Substrate: PrimeNG (Aura), themed via tokens + pt API" | No PrimeNG dependency/import in angular/ | GHOST |
| TECH_STACK.md | Node 22+, npm 11+, ESM-first (`"type":"module"`) | root package.json is `"type":"module"`; consistent | ACCURATE |
| TECH_STACK.md | Design system rebuilt statically in `redesign/ground-zero/` | `redesign/ground-zero/` exists | ACCURATE |
| TECH_STACK.md | Verify cmds: build/type-check/lint/lint:css/lint:tokens | Not all re-verified in package.json | UNVERIFIED |
| SINGLE_SOURCE_OF_TRUTH.md | "Application release: 4.0.0" | Baseline is v11 | STALE |
| SINGLE_SOURCE_OF_TRUTH.md | Readiness/ACWR canonical = server `calc-readiness.js`; ReadinessService is read-through to `/api/calc-readiness`+`/api/readiness-history` | Matches ground truth exactly | ACCURATE |
| SINGLE_SOURCE_OF_TRUTH.md | Identity authority `users`; team authority `team_members` | `users`+`team_members` live | ACCURATE |
| SINGLE_SOURCE_OF_TRUTH.md | Roster projection `team_players`; "if both team_members and team_players exist, merge by user_id" | `team_players` not a live table | GHOST |
| SINGLE_SOURCE_OF_TRUTH.md | Key code paths under `angular/src/app/features/settings/...`, `features/roster/...`, `features/onboarding/...` | No `features/` dir; surfaces moved (e.g. `app/roster`, `app/settings`, `app/onboarding`) | DRIFT |
| SINGLE_SOURCE_OF_TRUTH.md | Training prefs authority `athlete_training_config` + `/api/player-settings`; supporting `user_preferences` | `athlete_training_config` + `user_preferences` live; player-settings.js touches them | ACCURATE |
| SINGLE_SOURCE_OF_TRUTH.md | Travel authority `athlete_travel_log`; TravelRecoveryService | `athlete_travel_log` live; service not in current 28-service inventory | TRUE-BUT-BUGGY |
| SINGLE_SOURCE_OF_TRUTH.md | Tournament-day authority `tournament_day_plans` (+ migration in `database/migrations/`) | Table not in live snapshot; migration is legacy/unapplied | GHOST |
| SINGLE_SOURCE_OF_TRUTH.md | `ContinuityIndicatorsService`, `continuity-indicators.service.ts` as shared read model | Not in current 28-service inventory | UNVERIFIED |
| SINGLE_SOURCE_OF_TRUTH.md | load-monitoring.service computes ACWR client-side (drift watch) | Service-level drift plausible; `load_monitoring` table itself dropped | TRUE-BUT-BUGGY |
| REPO_DISCOVERY_GUIDE.md | "Application release: 4.0.0" | Baseline is v11 | STALE |
| REPO_DISCOVERY_GUIDE.md | User-facing route-backed code lives under `angular/src/app/features/` | No `features/` dir; domains are direct children of `app/` | DRIFT |
| REPO_DISCOVERY_GUIDE.md | Step 1 "Find the route in `angular/src/app/core/routes`" | No `core/routes` dir; routing is `app/app.routes.ts` + `core/feature-routes.ts` | DRIFT |
| REPO_DISCOVERY_GUIDE.md | Start-here & entry-doc table point to `CODEBASE_MAP.md`, `ROUTE_MAP.md`, `FEATURE_DOCUMENTATION.md` | Those docs were deleted in the rebuild purge (doc self-notes this for some, but table/steps still cite them) | GHOST |
| REPO_DISCOVERY_GUIDE.md | Top-level layout: angular/, netlify/functions/, database/migrations/, docs/, tests/ | Dirs exist (caveat: live schema tracked by supabase/migrations, not database/migrations) | TRUE-BUT-BUGGY |
| DOCS_INDEX.md | v11 is current baseline; ENGINE_CONTRACT.md, RELEASE_NOTES_11.0.0.md, ARCHITECTURE_v11.md, PRESCRIPTION_SPEC.md as start-here | ENGINE_CONTRACT.md + RELEASE_NOTES_11.0.0.md exist | ACCURATE |
| DOCS_INDEX.md | DATA_MODEL.md = canonical table dictionary | Generated, 177 tables/7 views; canonical | ACCURATE |
| DOCS_INDEX.md | Links to API.md, BACKEND_SETUP.md, DATABASE_SETUP.md as engineering docs (no "stale" flag) | Those three are heavily stale/v2.x (see rows below); index lists them as current | DRIFT |
| DOCS_INDEX.md | ARCHITECTURE.md labelled "legacy v4 baseline doc" | Correctly flagged as legacy | ACCURATE |
| DOCS_INDEX.md | CODEBASE_MAP/ROUTE_MAP/FEATURE_DOCUMENTATION "regenerated after rebuild" | Confirmed absent; correctly noted as removed/pending | ACCURATE |
| BACKEND_SETUP.md | "Version 2.1, Last Updated 12 January 2026, Production Ready" | Predates v11; never reconciled | STALE |
| BACKEND_SETUP.md | "All 95+ API functions" / "80 Serverless Functions" / "80 total functions" / closing "All 80 Netlify Functions" | 123 files / 121 cataloged; internally inconsistent (95 vs 80) | DRIFT |
| BACKEND_SETUP.md | "Supabase ... (250+ tables)" | 177 live base tables | DRIFT |
| BACKEND_SETUP.md | Code samples use `exports.handler = async` | All functions use `export const handler` (ESM); doc later contradicts itself with ESM sample | TRUE-BUT-BUGGY |
| BACKEND_SETUP.md | `baseHandler` pattern, `/api/*`→`/.netlify/functions/*`, JWT via Supabase, rate-limit tiers | Architecture pattern consistent with code | ACCURATE |
| BACKEND_SETUP.md | Endpoints `/api/load-management/acwr`, `/api/load-management/injury-risk` | load-management fn exists but ENDPOINTS shows `/api/load-management` only (no acwr/injury-risk subpaths) | UNVERIFIED |
| BACKEND_SETUP.md | Hardcoded SUPABASE_SERVICE_KEY/ANON_KEY (real-looking JWTs) in .env + Netlify UI samples | Secrets committed in docs (security smell) | TRUE-BUT-BUGGY |
| LOCAL_DEVELOPMENT_SETUP.md | "Document version 4.0 / release 4.0.0 / April 2026" | Baseline is v11 | STALE |
| LOCAL_DEVELOPMENT_SETUP.md | "features/ (49 features)" and "Read FEATURE_DOCUMENTATION.md for all 49 features" | No `features/` dir; FEATURE_DOCUMENTATION.md deleted | GHOST |
| LOCAL_DEVELOPMENT_SETUP.md | Project tree shows "(80+ functions)" and `docs/FEATURE_DOCUMENTATION.md # Source of truth` | 123 functions; FEATURE_DOCUMENTATION.md removed | DRIFT |
| LOCAL_DEVELOPMENT_SETUP.md | Angular 21 + Supabase + Netlify; `netlify dev` @8888 / `ng serve` @4200; build to `angular/dist/flagfit-pro/browser/` | Stack + commands consistent | ACCURATE |
| LOCAL_DEVELOPMENT_SETUP.md | Netlify-404 fix "Verify `exports.handler` is defined" | Functions export `export const handler`, not `exports.handler` | DRIFT |
| LOCAL_DEVELOPMENT_SETUP.md | npm ≥10 (Prereqs) vs TECH_STACK npm 11+ | Internal inconsistency; not re-verified | UNVERIFIED |
| LOCAL_DEVELOPMENT_SETUP.md | Hardcoded Supabase keys in .env samples | Secrets in docs (security smell) | TRUE-BUT-BUGGY |
| DATABASE_SETUP.md | "Version 2.4 / 12 January 2026 / 250+ tables" | 177 live tables; predates v11 | DRIFT |
| DATABASE_SETUP.md | Core tables list incl. `workout_logs`, `exercise_logs`, `session_summaries` (Workout Logging) | `workout_logs`/`exercise_logs` dropped; not live | GHOST |
| DATABASE_SETUP.md | Load Monitoring: `load_monitoring`, `load_daily`, `training_load_metrics`; Injury: `injury_tracking`, `injury_details` | All dropped/not live (canonical injuries = `athlete_injuries`) | GHOST |
| DATABASE_SETUP.md | "Wellness: `daily_wellness_checkin` (primary), `wellness_entries` (deprecated dual-write)" | daily_wellness_checkin canonical (correct); `wellness_entries` dropped, no live dual-write | TRUE-BUT-BUGGY |
| DATABASE_SETUP.md | Nutrition: `nutrition_logs`, `nutrition_goals`, `usda_foods`, `hydration_logs`, `sweat_rate_assessments`, `supplement_calculations`, `tournament_nutrition_protocols` | `usda_foods`/`hydration_logs` dropped; sweat_rate/supplement_calculations/tournament_nutrition_protocols not in live snapshot (live hydration = `athlete_hydration_logs`) | GHOST |
| DATABASE_SETUP.md | AI tables incl. `ai_feedback`, `ai_coach_visibility`, `chatbot_user_context`, `chatbot_user_state`, `chatbot_response_filters` | Not live tables | GHOST |
| DATABASE_SETUP.md | Research tables `research_studies`/`research_topics`/`training_protocols`/`research_institutions` ("fully implemented") | research-sync.js flags all as ⚠️ not-live in ENDPOINTS; orphaned/drift | GHOST |
| DATABASE_SETUP.md | Tournaments: `tournaments`, `tournament_participation`, `games`, `officials`, `official_availability` | `tournaments` dropped; `officials`/`official_availability` ⚠️ not live; only `games` solid | GHOST |
| DATABASE_SETUP.md | Users: `user_profiles`-adjacent `notification_preferences`, `push_notification_tokens`, `gdpr_consent` | `notification_preferences` dropped (in stale types); these not in live snapshot | GHOST |
| DATABASE_SETUP.md | "All active schema managed through `supabase/migrations/`" | Correct — supabase/migrations tracks live | ACCURATE |
| DATABASE_SETUP.md | Row-count table (`workout_logs` 3, `load_monitoring` 0, `wellness_entries` 1) + "Expected as of 2025-12-28" | Rows for dropped tables; counts long stale | STALE |
| DATABASE_SETUP.md | `positions` (7), `daily_wellness_checkin`, `readiness_scores`, `athlete_injuries`, `team_members` exist | These are live tables | ACCURATE |

## Group B — data/API/engine

Reconciled 2026-06-09 against `live-schema.snapshot.json` (177 tables / 7 views), `docs/generated/ENDPOINTS.md` (121 functions), `docs/generated/DATA_MODEL.md`, `docs/ground-truth/03-service-inventory.md`, and live code (`netlify/functions/*.js`, `angular/src/app/core/services`).

Verdict key: ACCURATE · DRIFT (doc states X, live differs) · STALE (describes a removed/old state) · UNVERIFIED · TRUE-BUT-BUGGY (doc matches code, but code targets a non-existent table) · GHOST (documented table/endpoint not live).

| Doc | Claim (quote/paraphrase) | Ground-truth status | Verdict |
|---|---|---|---|
| DATA_MODEL.md | Self-described as "target model + consolidation plan", governance source | Aspirational/plan doc; body lists DROP/merge targets, Progress log records actual drops | ACCURATE (intent) |
| DATA_MODEL.md | Canonical wellness = `daily_wellness_checkin`; DROP `wellness_logs`/`wellness_entries`/`wellness_data` | `daily_wellness_checkin` TABLE; the three DROP targets all ABSENT (dropped Phase 3/7) | ACCURATE |
| DATA_MODEL.md | Canonical hydration = `athlete_hydration_logs`; DROP `hydration_logs` | `athlete_hydration_logs` TABLE; `hydration_logs` ABSENT | ACCURATE |
| DATA_MODEL.md | Re-home training-load to `training_sessions`/`session_rpe_data`; merge `sessions`,`workout_logs` | `training_sessions` TABLE; `sessions`,`workout_logs`,`session_rpe_data` all ABSENT (dropped) | STALE (targets gone) |
| DATA_MODEL.md | Collapse load/ACWR caches: `load_daily`,`load_metrics`,`load_monitoring`,`training_load_metrics`,`training_stress_balance`,`acwr_calculations`,`acwr_history`,`acwr_reports`,`load_caps` → keep ≤1 (`acwr_history`) | ALL nine ABSENT incl. `acwr_history` (the proposed keeper) and `load_caps` | STALE |
| DATA_MODEL.md | Readiness canonical `readiness_scores`; `athlete_daily_state` = rollup, fold one | `readiness_scores` TABLE; `athlete_daily_state` ABSENT (dropped Phase 10) | STALE (decided) |
| DATA_MODEL.md | Recovery/injury inputs: `recovery_sessions`, `injuries`, `return_to_play_protocols` | `recovery_sessions`,`return_to_play_protocols` TABLE; `injuries` ABSENT (use `athlete_injuries`/`v_injuries_unified`) | DRIFT |
| DATA_MODEL.md | `games` kept as canonical game-detail (NOT dropped to spine); `fixtures` drop deferred; `tournaments` review | `games` TABLE; `fixtures` ABSENT; `tournaments` ABSENT | DRIFT (fixtures/tournaments already gone, deferral moot) |
| DATA_MODEL.md | Tournament logistics keep `tournament_day_plans`,`tournament_budgets`,`tournament_lineups` | `tournament_day_plans`,`tournament_budgets` TABLE; `tournament_lineups` ABSENT | GHOST (tournament_lineups) |
| DATA_MODEL.md | Merge `team_players` → projection of users+team_members | `team_players` ABSENT (already gone) | STALE |
| DATA_MODEL.md | Settings sprawl incl. `user_settings`,`user_preferences`,`user_ai_preferences`,`notification_preferences`,`user_notification_preferences` | `user_settings`,`user_preferences`,`user_ai_preferences`,`user_notification_preferences` TABLE; `notification_preferences` ABSENT (only `user_notification_preferences`) | DRIFT |
| DATA_MODEL.md | Exercises: pick one of `exercises`/`exercise_library`/`exercise_registry`/`exercisedb_exercises` | `exercises`,`exercise_registry`,`exercisedb_exercises` TABLE; `exercise_library` ABSENT | DRIFT |
| DATA_MODEL.md | Stat inputs `passing_stats`,`receiving_stats`,`flag_pull_stats`,`situational_stats`,`performance_records`,`performance_tests`,`player_skill_assessments` | all TABLE | ACCURATE |
| DATA_MODEL.md | Caches `player_training_stats`,`weekly_training_analysis`,`analytics_aggregates`,`coach_analytics_cache` | first/second/fourth TABLE; `analytics_aggregates` ABSENT (dropped Phase 10) | DRIFT |
| DATA_MODEL.md | Progress log: dropped `compute_acwr` proc; ACWR on-read via `utils/acwr.js` | `netlify/functions/utils/acwr.js` exists; ENDPOINTS still flags `compute_acwr()` ref in daily-protocol | ACCURATE (proc), see note |
| DATA_MODEL.md | "aspirational `exercise_registry`,`ff_exercise_mappings`,`movement_patterns` do not exist" (audit correction) | All three are now LIVE TABLES | DRIFT (correction itself stale) |
| DATA_CONTINUITY_MODEL.md | `users` = identity SoT (id,email,full_name,...) | `users` TABLE | ACCURATE |
| DATA_CONTINUITY_MODEL.md | `team_members` SoT for membership/role (team_id,user_id,role,status,position,jersey_number) | `team_members` TABLE | ACCURATE |
| DATA_CONTINUITY_MODEL.md | `team_players` = roster projection; keep in sync on onboarding/settings/invite | `team_players` ABSENT — entire write/read/anti-pattern section references a non-existent table | GHOST |
| DATA_CONTINUITY_MODEL.md | `/api/player-settings` backed by `athlete_training_config` = canonical training settings | `athlete_training_config` TABLE; `player-settings` routed | ACCURATE |
| DATA_CONTINUITY_MODEL.md | `user_preferences` may store broader prefs (keyed user_id) | `user_preferences` TABLE | ACCURATE |
| DATA_CONTINUITY_MODEL.md | `athlete_travel_log` = canonical travel recovery persistence | `athlete_travel_log` TABLE | ACCURATE |
| DATA_CONTINUITY_MODEL.md | `tournament_day_plans` = canonical tournament-day schedule/nutrition | `tournament_day_plans` TABLE | ACCURATE |
| DATA_CONTINUITY_MODEL.md | `hydration_logs` = canonical tournament-day hydration entries | `hydration_logs` ABSENT (dropped Phase 2 → `athlete_hydration_logs`) | GHOST |
| ATHLETE_ID_CONVENTION.md | Standard: every athlete-owned table uses `user_id` = auth.uid() | Live: `readiness_scores`,`training_sessions` etc. keyed `user_id` | ACCURATE |
| ATHLETE_ID_CONVENTION.md | "86 user_id vs 31 player_id / 18 athlete_id tables" surface count | Pre-v11 census; many listed legacy tables now dropped — counts unverified post-migration | UNVERIFIED |
| ATHLETE_ID_CONVENTION.md | Legacy `athlete_id` examples: `athlete_daily_state`,`wellness_logs`,`recovery_sessions`,`readiness_scores`,`return_to_play_protocols` | `athlete_daily_state`,`wellness_logs` ABSENT; `readiness_scores` now keyed user_id | STALE (examples) |
| ATHLETE_ID_CONVENTION.md | Legacy `player_id` examples: `injuries`,`load_daily`,`load_metrics`,`workout_logs` | ALL four ABSENT | STALE (examples) |
| API.md | Version 2.3, "Last Verified Against Codebase: 2026-03-29" (footer also says Jan 12 2026) | Pre-v11; generated ENDPOINTS verified 2026-06-09 | STALE |
| API.md | `GET/POST /api/calc-readiness`, `/api/readiness-history`, `/api/compute-acwr`, `/api/load-management` | All routed live (ENDPOINTS) | ACCURATE |
| API.md | `GET /api/fixtures` (Games & Stats) | No `fixtures.js`, no route in netlify.toml; `fixtures` table ABSENT | GHOST |
| API.md | Tournaments section: `GET/POST/PUT/DELETE /api/tournaments` | No `tournaments.js`, no route; live tournament endpoint is `/api/tournament-calendar` | GHOST |
| API.md | `/api/cycle-tracking` (+/period,/symptoms,/all) | No route in netlify.toml, no function; live cycle endpoint is `/api/program-cycles` | GHOST |
| API.md | `GET /api/analytics/team-chemistry`, `/api/analytics/performance-trends`, `/training-distribution`, `/injury-risk`, `/summary` | `analytics.js` exists but only OPTIONS shell + `/api/performance/*`; no team-chemistry route; `team_chemistry` table ABSENT (⚠ ghost ref in dashboard.js) | GHOST |
| API.md | `/api/equipment` CRUD (List/Add/Update) | Routed (netlify.toml x2) but `equipment.js` targets `equipment_items`/`equipment_assignments` — both ABSENT (⚠ in ENDPOINTS) | TRUE-BUT-BUGGY |
| API.md | `/api/officials` (List/Add) | Routed but `officials.js` targets `officials`/`game_officials`/`official_availability` — all ABSENT | TRUE-BUT-BUGGY |
| API.md | `/api/depth-chart` (Get/Update) | Routed but `depth-chart.js` targets `depth_chart_templates`/`_entries`/`_history` — all ABSENT | TRUE-BUT-BUGGY |
| API.md | `/api/nutrition/search-foods`, `/add-food` etc.; nutrition.js queries `usda_foods` | nutrition routed; `usda_foods` ABSENT (⚠ ghost ref) | TRUE-BUT-BUGGY |
| API.md | `/api/wellness-checkin` POST (hyphen not slash); coach uses `/api/games` | Matches live routes (wellness, games) | ACCURATE |
| API.md | "New Tables Added: `acwr_history`,`micro_sessions`,`team_templates`,`coach_inbox_items`,`ai_followups`,`user_ai_preferences`,`parent_guardian_links`" | All TABLE except `acwr_history` ABSENT (later dropped) | DRIFT |
| API.md | Schema updates add `is_outdoor`/`scheduled_date`/`intensity` to `training_sessions`, `protocol_id` recovery_sessions→recovery_protocols | training_sessions/recovery_sessions/recovery_protocols live; columns UNVERIFIED | UNVERIFIED |
| API.md | Netlify Functions Reference lists `recovery.js`,`tournaments.js`,`load-management.js` | `recovery.js`/`tournaments.js` ABSENT (live: `recovery-core.js`, `tournament-calendar.js`); `load-management.js` exists | DRIFT |
| BACKEND_FUNCTION_CONTRACT.md | Parser `parseJsonObjectBody` from `utils/input-validator.js`; helpers in `utils/error-handler.js`; `baseHandler`; runtime-v2 adapter | Conventions doc, not table/endpoint claims; `baseHandler` confirmed used in calc-readiness.js | ACCURATE |
| BACKEND_FUNCTION_CONTRACT.md | Team role authority lives in `team_members` not `users` | `team_members` TABLE; matches DATA_CONTINUITY | ACCURATE |
| ENGINE_CONTRACT.md | Pipeline inputs: `athlete_training_config`,`competition_events`,`daily_wellness_checkin`,`training_sessions`,`athlete_hydration_logs`,`nutrition_logs`,`supplement_logs`,`physical_measurements`,`flag_pull_stats`/`receiving_stats`/`passing_stats`/`situational_stats`,`performance_records`,`qb_throwing_sessions` | ALL live TABLE | ACCURATE |
| ENGINE_CONTRACT.md | Spine `competitions`+`competition_events`+`v_athlete_schedule` keyed user_id | both TABLE; `v_athlete_schedule` is a live VIEW | ACCURATE |
| ENGINE_CONTRACT.md | Readiness via `netlify/functions/calc-readiness.js`; ACWR via `utils/acwr.js`; `readiness_scores` persisted output | both code files exist; `readiness_scores` TABLE | ACCURATE |
| ENGINE_CONTRACT.md | Authority precedence reads/writes `injuries` (physio absolute block), `coach_overrides`, `nutrition_goals`, `return_to_play_protocols` | `coach_overrides`,`nutrition_goals`,`return_to_play_protocols` TABLE; `injuries` ABSENT (→ `athlete_injuries`/`v_injuries_unified`) | DRIFT |
| ENGINE_CONTRACT.md | Consent: `athlete_consent_settings`, `staff_roles.can_view_health_data`, `parental_consent`, `v_*_consent` views | `athlete_consent_settings`,`staff_roles`,`parental_consent` TABLE; `v_training_sessions_consent` VIEW live | ACCURATE |
| ENGINE_CONTRACT.md | Gaps: `coach_overrides.player_id`,`injuries.player_id`,`coach_athlete_assignments.athlete_id` still legacy-keyed | `coach_overrides`,`coach_athlete_assignments` TABLE; `injuries` ABSENT; column convention UNVERIFIED | UNVERIFIED |
| ENGINE_CONTRACT.md | `prescribeFor` "currently only takes acwr/readiness/phase" (authority not wired) | periodization.service.ts now also has weather guard/macro-phase/density (PRESCRIPTION_SPEC v2) — gap partially closed | DRIFT |
| CALCULATION_SPEC.md | Training load `RPE × duration_minutes` | Matches CALCULATION_MAP + engine contract | ACCURATE |
| CALCULATION_SPEC.md | Weekly volume / stats source `training-stats-calculation.service.ts` | File ABSENT under angular/src (only 38 services; not present) | STALE |
| CALCULATION_SPEC.md | Sleep debt / age limits source `training-safety.service.ts` | File ABSENT | STALE |
| CALCULATION_SPEC.md | Next-gen metrics source `core/utils/next-gen-metrics.ts` | File ABSENT | STALE |
| CALCULATION_SPEC.md | ACWR source `acwr.service.ts` (EWMA λ acute 0.2 / chronic 0.05, 7/28d) | `acwr.service.ts` exists; EWMA params match `evidence-config.ts` | ACCURATE |
| CALCULATION_SPEC.md | Acute/chronic config `evidence-config.ts` + `evidence-presets.ts` | both files exist | ACCURATE |
| CALCULATION_SPEC.md | Readiness scoring: base 70 + (sleep−5)×3 + (energy−5)×3 − ... ; weeklyLoad>3000 −10 | calc-readiness.js uses weighted required/optional subscore model (normalizedValue×field.weight, data-mode), NOT additive base-70; no 3000/1000 gate found | DRIFT |
| CALCULATION_SPEC.md | Readiness client `load-monitoring.service.ts` (sleepScore/energyScore weighted) | File ABSENT | STALE |
| CALCULATION_SPEC.md | Wellness score source `wellness.service.ts`; readiness level `readiness.service.ts` | both files exist | ACCURATE |
| CALCULATION_SPEC.md | Bodyweight/BMI/LBM source `body-composition.service.ts` + `performance-data.service.ts` | both files ABSENT | STALE |
| CALCULATION_SPEC.md | Dashboard perf score `100 − (avgRpe−5)×10` in `dashboard.js` | `dashboard.js` exists; formula UNVERIFIED in detail | UNVERIFIED |
| CALCULATION_MAP.md | ACWR hotspots `acwr.service.ts`, `acwr-spike-detection.service.ts`, `load-management.js` | all three files exist | ACCURATE |
| CALCULATION_MAP.md | `load-management.js` GET `/acwr` "reads from persisted load monitoring" | `load_monitoring`/load caches ABSENT; load is derived-on-read now (DATA_MODEL Phase 4) | DRIFT |
| CALCULATION_MAP.md | Training load agg `training-stats-calculation.service.ts` | File ABSENT | STALE |
| CALCULATION_MAP.md | Readiness `readiness.service.ts` + `calc-readiness.js`; base 70 + metric deltas + load adj | services exist but calc-readiness formula is weighted-subscore, not base-70 additive | DRIFT |
| CALCULATION_MAP.md | Wellness `wellness.service.ts`; QB tracker component | both exist | ACCURATE |
| CALCULATION_MAP.md | Body comp `body-composition.service.ts` + `performance-data.service.ts`; `phase-load-calculator.service.ts`; `training-safety.service.ts` | ALL ABSENT under angular/src | STALE |
| CALCULATION_MAP.md | Analytics `analytics.js`, `performance-data.js` | both function files exist | ACCURATE |
| PRESCRIPTION_SPEC.md | Authority `periodization.service.ts` → `prescribeFor()` | file exists; `prescribeFor`/`applyWeatherGuard`/`macroPhaseFor` present | ACCURATE |
| PRESCRIPTION_SPEC.md | Tests `periodization.service.spec.ts` "(30 cases)" header / v1 | spec file exists with 38 `it()` blocks | DRIFT (count) |
| PRESCRIPTION_SPEC.md | v2: weather guard + season macro-phase, "45 green" | code has the v2 functions; live `it()` count = 38, not 45 | DRIFT (count) |
| PRESCRIPTION_SPEC.md | Phase resolver mirrored in `netlify/functions/schedule.js` | `schedule.js` exists with phase logic (accumulation/taper refs) | ACCURATE |
| PRESCRIPTION_SPEC.md | Server port `netlify/functions/prescription.js` (if exists) | No `prescription.js` in netlify/functions (port not yet built) | ACCURATE (conditional) |
| PRESCRIPTION_SPEC.md | Inputs reference `athlete_training_config.season_calendar`; `competition_events` | both TABLE | ACCURATE |
| PRESCRIPTION_SPEC.md | Nutrition/RPE/intent formulas (carbs g/kg, 1.8 g/kg protein, hydration) | algorithm-internal, no schema dependency; matches periodization.service | UNVERIFIED |

## Group C — security/auth/privacy

Ground truth: live-schema.snapshot.json (177 tables / 7 views), ENDPOINTS.md, 03-service-inventory.md, code (netlify/functions, core/guards, core/services), and live Supabase (project grfjmnjpzvknmsxrwesx) spot-checks.

Live view list (only 7): physical_measurements_latest, user_achievements, v_athlete_schedule, v_injuries_unified, v_pending_event_participation, v_seed_integrity, v_training_sessions_consent.

Verdict legend: ACCURATE / DRIFT (partly wrong) / STALE (describes old impl) / UNVERIFIED / TRUE-BUT-BUGGY (doc matches code but code targets non-existent object) / GHOST (references dropped/never-existed object).

| Doc | Claim (quote/paraphrase) | Ground-truth status | Verdict |
| --- | --- | --- | --- |
| SECURITY.md | Auth Guard at `core/guards/auth.guard.ts` "Protects routes requiring authentication" | Guard exists but is config-gated: `if (!environment.auth.required) return true;` — open in dev/smoke, enforces only in prod | DRIFT |
| SECURITY.md | authGuard code sample injects `AuthService` + `SupabaseService`, calls `authService.isAuthenticated()` | Real guard injects `SupabaseService`, `AuthFlowDataService`, `LoggerService`; gates on `environment.auth.required` + `session` + `email_confirmed_at`. No AuthService, no `isAuthenticated()` | STALE |
| SECURITY.md | Auth Service `core/services/auth.service.ts` (Supabase wrapper w/ signals) | No `auth.service.ts` in core/services; auth split across `auth-flow-data.service.ts` + `supabase.service.ts` | GHOST |
| SECURITY.md | Auth Interceptor `core/interceptors/auth.interceptor.ts`; Error Interceptor `error.interceptor.ts` | Not verified against interceptors dir (out of scope) | UNVERIFIED |
| SECURITY.md | Rate-limiter `utils/rate-limiter.js`, base-handler `utils/base-handler.js` | Not opened this pass | UNVERIFIED |
| SECURITY.md | "Row Level Security (RLS) policies on all tables" | Plausible; not exhaustively confirmed (177 tables not all checked) | UNVERIFIED |
| SECURITY.md | Tokens in localStorage, no cookies, `Authorization: Bearer` header | Consistent with auth-flow design; not contradicted | ACCURATE |
| SECURITY.md | AI consent checked via `require_ai_consent` RPC before AI processing | privacy-settings.service.ts calls `require_ai_consent` RPC; matches | ACCURATE |
| SECURITY.md | Consent Views layer "Field-level consent (NULL if not shared)" | Consent-view pattern exists (v_training_sessions_consent live); generic claim ok | ACCURATE |
| SECURITY.md | `notification_preferences` / cookie tables etc. — n/a (not referenced) | — | — |
| THREAT_MODEL.md | AV-1: `v_load_monitoring_consent` "returns NULL for non-consented fields" | View does NOT exist live (only v_training_sessions_consent); not in 7-view snapshot | GHOST |
| THREAT_MODEL.md | AV-1 RLS uses `check_performance_sharing(player_id, team_id)` | Function not verified; privacy svc uses `require_ai_consent`/`get_coached_teams` + dynamic RPCs | UNVERIFIED |
| THREAT_MODEL.md | Trust boundary: "Consent views (v_*_consent) for coach access" | Pattern partly real (1 live consent view); the two named in docs are ghosts | DRIFT |
| THREAT_MODEL.md | App layer: "CSRF protection (SameSite cookies)" / "No sensitive data in localStorage" | Contradicts SECURITY.md (tokens ARE in localStorage; no cookie auth → no SameSite) | DRIFT |
| THREAT_MODEL.md | AV-2: `privacy_settings.ai_processing_enabled` column | `privacy_settings` table exists; privacy svc exposes `aiProcessingEnabled` | ACCURATE |
| THREAT_MODEL.md | AV-3: `parental_consent` table tracks verification | `parental_consent` table exists live; parental-consent.js writes it | ACCURATE |
| THREAT_MODEL.md | AV-3 evidence: `database/archive/legacy-root-sql/add_email_verification.sql` | Path not verified; flagged as archived one-off | UNVERIFIED |
| THREAT_MODEL.md | AV-4: `deletion_requests` table tracks requests | No `deletion_requests` table; canonical is `account_deletion_requests` | GHOST |
| THREAT_MODEL.md | AV-8: "Secure cookies `Secure`,`HttpOnly`,`SameSite=Strict`" for session | No cookie-based session (localStorage + Bearer); cookie mitigations don't apply | STALE |
| THREAT_MODEL.md | AV-2 evidence test files / CI `npm run check:consent:ci` | Test/CI paths not verified | UNVERIFIED |
| RLS_POLICY_SPECIFICATION.md | Policies on `profiles` (user_id = auth.user_id(), role_global='admin') | No `profiles` table live; identity/role come from `users` + `team_members` | GHOST |
| RLS_POLICY_SPECIFICATION.md | `auth.is_team_coach` reads `team_members` (role_team, status, deleted_at) | `team_members` table exists; role columns plausible | ACCURATE |
| RLS_POLICY_SPECIFICATION.md | Policies on `workout_logs` (players/coaches SELECT) | `workout_logs` dropped/merged into `training_sessions` (Phase 9b) | GHOST |
| RLS_POLICY_SPECIFICATION.md | Policies on `load_metrics` | No `load_metrics` table live | GHOST |
| RLS_POLICY_SPECIFICATION.md | Policies on `tournaments` / `tournament_registrations` | No `tournaments` or `tournament_registrations` base tables (tournament_budgets/day_plans exist) | GHOST |
| RLS_POLICY_SPECIFICATION.md | Policies on `community_posts` | No `community_posts` table (community_polls/poll_options/poll_votes exist) | GHOST |
| RLS_POLICY_SPECIFICATION.md | Policies on `analytics_events` (append-only) | No `analytics_events` table (coach_analytics_cache / micro_session_analytics exist) | GHOST |
| RLS_POLICY_SPECIFICATION.md | Policies on `teams`, `team_members`, `team_invitations`, `training_programs`, `program_assignments` | All these tables exist live | ACCURATE |
| RLS_POLICY_SPECIFICATION.md | `auth.is_admin()` reads `profiles.role_global` | `profiles` ghost → helper as written can't resolve; role lives on `users`/`team_members` | GHOST |
| ROLE_AUTHORIZATION_MODEL.md | Canonical roles = `TeamRole` union in `core/services/team-membership.service.ts` | team-membership.service.ts is the role authority per service inventory | ACCURATE |
| ROLE_AUTHORIZATION_MODEL.md | Route guard authority `core/guards/team-role.guard.ts` | No `team-role.guard.ts` in core/guards (only auth.guard.ts, staff.guard.ts) | GHOST |
| ROLE_AUTHORIZATION_MODEL.md | Backend role sets `netlify/functions/utils/role-sets.js`, `authorization-guard.js` | Not opened this pass | UNVERIFIED |
| ROLE_AUTHORIZATION_MODEL.md | Navigation authority `core/navigation/app-navigation.config.ts` | Not verified | UNVERIFIED |
| ROLE_AUTHORIZATION_MODEL.md | Roles sourced from active `team_members` rows, avoid JWT fallback | Matches team-membership.service.ts (reads team_members) | ACCURATE |
| ROLE_AUTHORIZATION_MODEL.md | staff.guard.ts not mentioned as a guard | staff.guard.ts exists but doc omits it | DRIFT |
| PRIVACY_CONTROLS_SPEC.md | Profile data in `public.profiles` | No `profiles` table (canonical `users`) | GHOST |
| PRIVACY_CONTROLS_SPEC.md | Training data in `public.training_sessions`, `public.exercises` | Both exist live | ACCURATE |
| PRIVACY_CONTROLS_SPEC.md | Wellness data in `public.wellness_entries` | No `wellness_entries`; canonical `daily_wellness_checkin` | GHOST |
| PRIVACY_CONTROLS_SPEC.md | Health data in `public.health_records` | No `health_records` table (athlete_injuries / physical_measurements) | GHOST |
| PRIVACY_CONTROLS_SPEC.md | Nutrition data in `public.nutrition_entries` | No `nutrition_entries` (nutrition_logs/plans/goals/reports exist) | GHOST |
| PRIVACY_CONTROLS_SPEC.md | Technical data in `public.app_logs` | No `app_logs` table (frontend_logs is the client log sink) | GHOST |
| PRIVACY_CONTROLS_SPEC.md | Team data in `public.team_members`, `public.teams` | Both exist live | ACCURATE |
| PRIVACY_CONTROLS_SPEC.md | Consent tables `user_consents` + `consent_audit_log` (with SQL DDL) | Neither exists; live consent tables are athlete_consent_settings, consent_access_log, consent_change_log | GHOST |
| PRIVACY_CONTROLS_SPEC.md | Deletion tables `deletion_queue` + `deletion_audit_log` | Neither exists; canonical `account_deletion_requests` + `initiate/cancel_account_deletion()` RPCs | GHOST |
| PRIVACY_CONTROLS_SPEC.md | `ConsentService`/`DataExportService`/`AccountDeletionService` marked "🔴 Create" (not implemented) | Privacy backend IS implemented (privacy-settings.js, account-deletion.js, parental-consent.js) — spec is a stale plan doc | STALE |
| PRIVACY_CONTROLS_SPEC.md | `ConsentGuard` at `core/guards/consent.guard.ts` | No consent.guard.ts in core/guards | GHOST |
| PRIVACY_CONTROLS_SPEC.md | `parental_consent` table exists but unused (16+ only) | Table exists AND is actively written by parental-consent.js + privacy-settings.js → "unused" wrong | DRIFT |
| PRIVACY_CONTROLS_SPEC.md | Storage region "Supabase (Frankfurt, EU)" | Not verified | UNVERIFIED |
| PRIVACY_CONTROLS_SPEC.md | privacy_settings RLS exists; privacy-settings endpoint writes privacy_settings/team_sharing_settings/parental_consent/privacy_audit_log | Matches ENDPOINTS.md privacy-settings row | ACCURATE |
| AUTH_LOGIN_ONBOARDING.md | Endpoint `POST /api/auth/login` (via Supabase) | `auth-login` fn + `/api/auth/login` route present | ACCURATE |
| AUTH_LOGIN_ONBOARDING.md | Endpoint `POST /api/auth/reset-password` | `auth-reset-password` fn + `/api/auth/reset-password` route present | ACCURATE |
| AUTH_LOGIN_ONBOARDING.md | Endpoint `GET /auth-me` | Lives at `/api/auth/me` / `/api/auth-me` (auth-me fn) — doc path `/auth-me` missing `/api` prefix | DRIFT |
| AUTH_LOGIN_ONBOARDING.md | `POST /api/accept-invitation`, `GET /api/validate-invitation` | Both functions/routes exist | ACCURATE |
| AUTH_LOGIN_ONBOARDING.md | "CSRF protection for login requests" / "CSRF tokens generated & validated" | Contradicts SECURITY.md (CSRF tokens intentionally NOT implemented; Bearer-header auth) | DRIFT |
| AUTH_LOGIN_ONBOARDING.md | "HttpOnly Cookies: Option for httpOnly cookie storage" + SecureStorage AES-GCM | No cookie auth; tokens in localStorage via Supabase SDK | STALE |
| AUTH_LOGIN_ONBOARDING.md | Onboarding status checked via `user_metadata.onboarding_completed` | auth-flow-data.service reads onboarding status from `.from("users")`, not only user_metadata | DRIFT |
| AUTH_LOGIN_ONBOARDING.md | Email verification required before login; guard blocks unverified | auth.guard.ts blocks on `!email_confirmed_at` → matches | ACCURATE |
| AUTH_LOGIN_ONBOARDING.md | Default role 'player' in user_metadata; roles player/coach/admin | Coarse legacy role naming; canonical team roles richer (TeamRole union) but compatible | DRIFT |
| AUTH_LOGIN_ONBOARDING.md | Rate limit tiers (READ 100 / CREATE 20 / UPDATE 30 / DELETE 10) | Differs from SECURITY.md tiers (CREATE 50, READ 200, +AUTH 5); internal inconsistency | DRIFT |

### Per-verdict counts (across 6 docs)

- ACCURATE: 16
- DRIFT: 12
- STALE: 5
- UNVERIFIED: 9
- TRUE-BUT-BUGGY: 0 (see note)
- GHOST: 17

Note on consent views: the privacy-settings.service.ts code DOES `.from("v_load_monitoring_consent")` and `.from("v_workout_logs_consent")`. Because those views do not exist live, those client reads are runtime-failing (effectively TRUE-BUT-BUGGY at the code level). The doc claims here are scored GHOST because the docs assert the views as live access-control mechanisms, which is false.

### Consent views — live existence

Live DB confirms ONLY `v_training_sessions_consent` exists among consent views.
`v_load_monitoring_consent` and `v_workout_logs_consent` do NOT exist live (named after the dropped `load_monitoring` / `workout_logs` tables) and are absent from the 7-view snapshot. THREAT_MODEL.md (AV-1) and the privacy-settings service both reference them — docs = GHOST, code = broken reads.

## Group D — science/runbooks/release-notes

Reconciled 2026-06-09 against: `docs/generated/live-schema.snapshot.json`, `docs/generated/ENDPOINTS.md`, `docs/ground-truth/04-migration-reconciliation.md`, and repo (`package.json`, `netlify.toml`, `scripts/`, `netlify/functions/`, `supabase/functions/`, `supabase/migrations/`).

Legend: ACCURATE / DRIFT (real but wrong detail) / STALE (point-in-time, superseded) / UNVERIFIED (domain knowledge, no system claim) / TRUE-BUT-BUGGY / GHOST (references a thing that does not exist live).

### 1. FLAG_FOOTBALL_TRAINING_SCIENCE.md

| Doc | Claim (quote/paraphrase) | Ground-truth status | Verdict |
|---|---|---|---|
| SCIENCE | "ACWR = Acute Load (7-day average) / Chronic Load (**28-day** EWMA)" | Live `netlify/functions/utils/acwr.js`: acute = 7-day EWMA (λ=0.25), **chronic = 21-day EWMA** (λ≈0.0909), uncoupled. Acute window correct; chronic is 21d not 28d, and it's EWMA not a plain average. | DRIFT |
| SCIENCE | ACWR risk zones 0.8–1.3 optimal, >1.5 danger; session-RPE load = RPE×min; ">10% weekly increase" etc. | Domain/clinical thresholds; ACWR engine exists (`compute-acwr`, `utils/acwr.js`) and consumes load. Threshold values are sports-science, not code constants verified here. | UNVERIFIED |
| SCIENCE | All periodization/sprint/strength/injury/QB protocol tables, benchmarks, citations (Gabbett, Haugen, Seitz, Nordic 51%, Copenhagen 41%, etc.) | Pure peer-reviewed sports-science; no system/table/endpoint claim. | UNVERIFIED |
| SCIENCE | "Implementation in FlagFit Pro" service table: `EvidenceKnowledgeBaseService`, `FlagFootballEvidenceService`, `TrainingVideoDatabaseService`, `FlagFootballPeriodizationService`, `SprintTrainingKnowledgeService`, `FlagFootballAthleteProfileService`, `PhaseLoadCalculatorService`, `AgeAdjustedRecoveryService`, `TrainingLimitsService` | 0 matches in `angular/src` for all of these. Not present in current codebase. | GHOST |
| SCIENCE | Same table: `SleepDebtService`, `ReturnToPlayService` | Each matches 2 files in `angular/src`. | ACCURATE |
| SCIENCE | UI components `PeriodizationDashboardComponent`, `SafetyWarningsComponent`, `DataSourceBannerComponent` + "services located in angular/src/app/core/services/" | Service-list above is mostly ghost; component/path claims unverified and tied to the stale Dec-2024 implementation snapshot. | DRIFT |
| SCIENCE | "50+ research articles integrated into the application" / "40+ curated videos" | `research_articles`, `knowledge_base_entries`, `training_videos`, `video_playlists` tables exist live (counts not verified). Plausible. | UNVERIFIED |
| SCIENCE | Header "_Version: 3.0.0 / Last Updated: 29. December 2025_" and "New Features Added (December 2024)" | Point-in-time; the implementation/service section is superseded (see ghost row). Science content itself is durable. | STALE (impl section only) |

### 2. RUNBOOKS/*.md

| Doc | Claim (quote/paraphrase) | Ground-truth status | Verdict |
|---|---|---|---|
| README | Index links `LOGGING_REDACTION.md` and `RETENTION_CLEANUP.md` | Neither file exists in `docs/RUNBOOKS/`. Dead links. | GHOST |
| README | "Related Documentation" links `../SECURITY.md`, `../TROUBLESHOOTING.md` | `docs/SECURITY.md` exists; `docs/TROUBLESHOOTING.md` does NOT exist. | GHOST (TROUBLESHOOTING only) |
| README | Health endpoints `/.netlify/functions/health`, `/.netlify/functions/dashboard?action=health`, `/.netlify/functions/coach?action=health` | `health` fn exists; canonical path is `/api/health` (ENDPOINTS.md), reachable at `/.netlify/functions/health` via netlify.toml redirect. `dashboard`/`coach` are real fns; `?action=health` sub-route unverified. | DRIFT (path style; prefer `/api/...`) |
| README | `netlify rollback`, `netlify logs:function`, `supabase db dump`, `ls backups/` | Standard CLI; valid ops. | ACCURATE |
| BACKUP_RESTORE | Pre-migration & restore SQL reference table **`workout_logs`** (row counts, TRUNCATE, selective restore, COPY extract) | `workout_logs` was DROPPED: migrations `20260529095424_drop_workout_logs_merge_phase9b.sql` + `20260529101418_..._drop_workout_logs_phase11.sql`. NOT in live schema. | GHOST |
| BACKUP_RESTORE | Critical tables to row-count: `users`, `training_sessions`, `player_programs` | All present live. (Drop `workout_logs` from the list.) | ACCURATE |
| BACKUP_RESTORE | `supabase db dump`, `pg_dump`, `netlify env:list/set`, `netlify rollback`, Storage backup via SDK | Standard CLI/SDK; valid. Backup creates ad-hoc `scripts/backup-storage.js` / `scripts/restore-env.sh` (not committed — generated by runbook). | ACCURATE |
| BACKUP_RESTORE | Health-check validation `curl .../.netlify/functions/health` | Works via redirect; canonical `/api/health`. | DRIFT (path style) |
| DEPLOYMENT_ROLLBACK | `netlify rollback`, `netlify deploys:publish`, `netlify deploy --prod --deploy-id=`, `git revert && push`, `netlify watch`, `netlify logs:build/function` | Standard Netlify CLI ops; valid. | ACCURATE |
| DEPLOYMENT_ROLLBACK | DB rollback via `supabase migration down` | Repo migrations are forward-only (no down migrations; see ground-truth dir split). `migration down` will usually no-op/fail → prefer restore-from-backup path it also documents. | TRUE-BUT-BUGGY |
| DEPLOYMENT_ROLLBACK | Health/auth/dashboard validation curls to `/.netlify/functions/*` and env vars `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | Endpoints valid via redirect. Env var canonical name is `SUPABASE_SERVICE_ROLE_KEY` (netlify.toml); `SUPABASE_SERVICE_KEY` is legacy/alt naming. | DRIFT (env var name) |
| INCIDENT_RESPONSE | Trigger "`/api/health` returns non-200/degraded"; health fn paths | `/api/health` is the canonical endpoint (ENDPOINTS.md). Accurate. (Body curls elsewhere use `.netlify/functions/` form — works via redirect.) | ACCURATE |
| INCIDENT_RESPONSE | `netlify logs`, `netlify rollback`, `netlify deploy --prod`, Supabase restart, `pg_policies` RLS checks | Standard ops; RLS tables/policies exist. | ACCURATE |
| ACCOUNT_DELETION | Edge function `process-deletions` in `supabase/functions/` | Exists: `supabase/functions/process-deletions`. | ACCURATE |
| ACCOUNT_DELETION | DB fns `initiate_account_deletion()`, `cancel_account_deletion()`, `process_hard_deletion()`, `get_deletions_ready_for_processing()`, `get_deletion_status()` | All defined in `supabase/migrations/` (e.g. `20260324122508_netlify_supabase_compatibility`). | ACCURATE |
| ACCOUNT_DELETION | Tables `account_deletion_requests`, `privacy_audit_log`, `emergency_medical_records` w/ `user_email_hash`; status flow pending→completed/failed | All live; `account_deletion_requests` cols incl. `status`,`scheduled_hard_delete_at`,`error_message`; `emergency_medical_records.user_email_hash` exists. | ACCURATE |
| ACCOUNT_DELETION | Orphan-data validation query selects from **`workout_logs`** (`wl.player_id`) | `workout_logs` dropped (see above). Query would error. | GHOST |
| ACCOUNT_DELETION | API endpoint `/api/account-deletion` GET/POST/DELETE | Matches ENDPOINTS.md `account-deletion` GET,POST,DELETE. | ACCURATE |
| ACCOUNT_DELETION | `npm run verify:db` → `scripts/verify-db-objects.js` | Script exists; npm script `verify:db` present. | ACCURATE |
| PRIVACY_INCIDENT | Consent queries use cols `accessor_user_id`, `target_user_id`, `resource_type`, `access_granted`, `consent_type` on `consent_access_log` | Live `consent_access_log` cols are `user_id, accessed_by, access_type, data_category, accessed_at, reason, consent_given` — NONE of those 5 names exist. Every query in §Symptoms/§Investigation referencing them would fail. | GHOST (columns) |
| PRIVACY_INCIDENT | Scenario A fix: read from `load_monitoring` → `v_load_monitoring_consent` | Neither `load_monitoring` table nor `v_load_monitoring_consent` view exists live. | GHOST |
| PRIVACY_INCIDENT | AI-violation query joins `ai_chat_sessions` × `privacy_settings.ai_processing_enabled = false` | Both live; `privacy_settings.ai_processing_enabled` (boolean) exists. | ACCURATE |
| PRIVACY_INCIDENT | `parental_consent` check `consent_status = 'verified'` (col `minor_user_id`) | Col is `status` (not `consent_status`); `minor_user_id` correct; `verified` is via `verified_at`/status. Column-name drift. | DRIFT |
| PRIVACY_INCIDENT | Contain step: `UPDATE users SET is_active=false`; `npm run test:privacy` | `users.is_active` exists; `test:privacy` npm script exists (`vitest run tests/privacy-safety/`). | ACCURATE |
| PRIVACY_INCIDENT | `require_ai_consent('USER_ID')` / `check_performance_sharing()` / `check_ai_processing_consent()` helper calls in fix examples | Illustrative pseudo-code; not all verified as live RPCs. | UNVERIFIED |
| AUTH_HARDENING | Project ref `grfjmnjpzvknmsxrwesx`; advisor lint `auth_leaked_password_protection` toggled via Dashboard/Management API not MCP/SQL | Matches ground-truth project id (used in 04-migration-reconciliation refresh steps). Edge fn `enable-leaked-password-protection` exists in `supabase/functions/`. | ACCURATE |
| AUTH_HARDENING | "76 WARN, 0 ERROR as of 2026-06-01"; 10 anon + 65 authenticated SECURITY DEFINER, Fix E reduced 71→10 | Point-in-time advisor snapshot; not re-run here. Predicate-fn list plausible. | STALE (count snapshot) |

### 3. RELEASE_NOTES_*.md (one row per file — point-in-time history, not reconciled claim-by-claim)

| Doc | Claim (quote/paraphrase) | Ground-truth status | Verdict |
|---|---|---|---|
| RELEASE_NOTES_1.1.0.md | Release history for v1.1.0 | Point-in-time changelog; superseded by v11 baseline. | STALE |
| RELEASE_NOTES_1.2.0.md | Release history for v1.2.0 | Point-in-time changelog; superseded. | STALE |
| RELEASE_NOTES_1.5.0.md | Release history for v1.5.0 | Point-in-time changelog; superseded. | STALE |
| RELEASE_NOTES_2.1.0.md | Release history for v2.1.0 | Point-in-time changelog; superseded. | STALE |
| RELEASE_NOTES_3.4.0.md | Release history for v3.4.0 | Point-in-time changelog; superseded. | STALE |
| RELEASE_NOTES_4.0.0.md | Release history for v4.0.0 | Point-in-time changelog; superseded. | STALE |
| RELEASE_NOTES_11.0.0.md | Release history for v11.0.0 (current baseline) | Point-in-time changelog; closest to current but still historical. | STALE |

> Note: task brief referenced "8 RELEASE_NOTES_*.md" — repo contains **7** (`1.1.0, 1.2.0, 1.5.0, 2.1.0, 3.4.0, 4.0.0, 11.0.0`). No 8th file found anywhere under the repo.

---

## Durable ops to fold into SOURCE_OF_TRUTH §7

Operational content worth preserving when the runbooks are deleted. Canonical endpoint is `/api/health` (reachable at `/.netlify/functions/health` via the `netlify.toml` redirect). Canonical env var is `SUPABASE_SERVICE_ROLE_KEY` (NOT `SUPABASE_SERVICE_KEY`). `workout_logs` no longer exists — never reference it.

**Health / triage**
- Canonical health check: `curl -s https://<site>/api/health | jq` → expect `{status:"healthy", checks:{database, auth}}`; `degraded` = investigate, `unhealthy` = incident.
- Function logs: `netlify logs:function <name> --last 50`; build logs: `netlify logs:build`.
- Severity: SEV-1 outage <15min, SEV-2 major feature <1h, SEV-3 degraded <4h, SEV-4 cosmetic next-day.

**Deployment rollback**
- Fast path: `netlify rollback` (previous prod deploy), then re-check `/api/health`.
- Specific deploy: `netlify deploys --json | jq '.[:10]'` → `netlify deploys:publish <DEPLOY_ID>` (or dashboard → Deploys → Publish deploy).
- Code-level: `git revert <hash> --no-edit && git push origin main`; watch with `netlify watch`.
- Decision rule: cause unclear after 5–15 min → roll back rather than keep debugging.
- DB-caused regressions: migrations are **forward-only** (no down migrations) — do NOT rely on `supabase migration down`; restore from a pre-migration SQL dump instead.

**Backup / restore**
- Pre-migration backup: `supabase db dump -f backups/pre_migration_$(date +%Y%m%d_%H%M%S).sql`; schema-only: `supabase db dump --schema-only`.
- Record critical row counts before/after restore: `users`, `training_sessions`, `player_programs` (NOT `workout_logs`).
- Restore full: `psql "<conn>" < backups/<file>.sql` (destructive). Selective: `SET session_replication_role='replica';` → restore table → `SET session_replication_role='origin';`.
- Env vars: backup `netlify env:list > ...` (store encrypted — contains secrets); restore `netlify env:set KEY "value"` then `netlify deploy --prod` to pick up changes.
- Point-in-time recovery is Supabase Pro-only (Dashboard → Settings → Database → Restore); replaces entire DB.
- Storage buckets are NOT auto-backed-up — dump via Supabase SDK script if needed.

**Account deletion pipeline**
- Flow: request → soft delete (immediate, sessions revoked) → 30-day cancellable queue → hard delete (PII removed) → auth cleanup. Emergency medical records retained (user_id NULL, `user_email_hash` set) per legal hold.
- Components: API `netlify/functions/account-deletion.js` (`/api/account-deletion` GET/POST/DELETE); edge fn `supabase/functions/process-deletions` (cron via pg_cron, 3 AM daily); DB fns `initiate_account_deletion()`, `cancel_account_deletion()`, `process_hard_deletion(req_uuid)`, `get_deletions_ready_for_processing()`, `get_deletion_status(user_uuid)`; tables `account_deletion_requests` (queue), `privacy_audit_log` (trail).
- Backlog check: `SELECT count(*) FROM account_deletion_requests WHERE status='pending' AND scheduled_hard_delete_at<=now();` (warn >10, crit >50).
- Failed deletion: inspect `error_message`, reset `status='pending'`, or `SELECT process_hard_deletion('<uuid>');` to force.
- Orphan check after intervention: scan child tables for rows whose owner no longer exists (use live table names, not `workout_logs`); run `npm run verify:db` (`scripts/verify-db-objects.js`).
- Auth user not removed: `supabase.auth.admin.deleteUser('<uuid>')`.

**Privacy incident**
- GDPR: notify DPA within 72h of becoming aware of a high/medium-risk breach; notify affected users if high risk.
- Containment: rotate Netlify + `SUPABASE_SERVICE_ROLE_KEY`, invalidate sessions, `UPDATE users SET is_active=false WHERE id='<suspect>'`.
- Audit/consent tables (use CORRECT live columns): `consent_access_log(user_id, accessed_by, access_type, data_category, accessed_at, reason, consent_given)`; `privacy_audit_log`; `privacy_settings.ai_processing_enabled`. (The old runbook's `accessor_user_id/target_user_id/access_granted/resource_type/consent_type` columns do not exist — rewrite any query before reuse.)
- AI opt-out violation: join `ai_chat_sessions` × `privacy_settings` where `ai_processing_enabled=false`.
- Parental consent: `parental_consent` keyed by `minor_user_id`, gate on `status`/`verified_at` (col is `status`, not `consent_status`).
- Validate fixes with `npm run test:privacy`.

**Auth hardening**
- Project ref `grfjmnjpzvknmsxrwesx`. Native leaked-password (HIBP) check is a GoTrue setting — NOT toggleable via MCP/SQL; set in Dashboard (Auth → Providers → Email → password security) or Management API `PATCH /v1/projects/<ref>/config/auth {"password_hibp_enabled":true}`.
- Edge fn `enable-leaked-password-protection` is an app-level k-anonymity check only; it does NOT clear the advisor — enable the native setting too.
- Accepted advisor WARNs: ~10 `anon`-executable SECURITY DEFINER fns are RLS predicate helpers (`ff_is_active_team_member`, `ff_is_team_staff`, `has_role`, `is_active_superadmin`, etc.) and MUST stay executable; the rest are legitimately-authenticated RPCs. Any NEW SECURITY DEFINER fn that is neither → `REVOKE FROM PUBLIC; GRANT service_role`.
