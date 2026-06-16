# FlagFit Pro v11 — Phase 1: Live Schema Verification

**Date:** 2026-06-16 · **Mode:** read-only (no code changes)
**Source of truth:** `supabase/migrations/*.sql` (203 files — Supabase-applied, ordered by timestamp).
**Not trusted:** `database/migrations/` (legacy dir, partially un-applied), `supabase-types.ts` (confirmed stale).

---

## 1. Canonical table/view verification

| table / view | exists in live DB? | key columns confirmed | RLS | latest relevant migration |
|---|---|---|---|---|
| `daily_wellness_checkin` | ✅ Yes | `user_id`, `checkin_date`, `sleep_quality`, `sleep_hours`, `energy_level`, `muscle_soreness`, `stress_level`, `mood`, `motivation_level`, `soreness_areas` (text[]), `notes`, `calculated_readiness`, `hydration_level`, `travel_hours` (int, 0-24 check) | ✅ RLS enabled; upsert RPC enforces `auth.uid() = p_user_id` | `20260610130942_wellness_travel_hours.sql` |
| `athlete_injuries` | ✅ Yes | `id`, `user_id`, `injury_type`, `injury_location`, `injury_grade` (text: "Grade 1/2/3"), `injury_date`, `injury_mechanism`, `activity_at_injury`, `diagnosis`, `recovery_status` (default `'active'`), `current_phase`, `rtp_progress`, `expected_return_date`, `activity_restrictions` (text[]), `medical_notes` | ✅ SELECT policy `user_id = auth.uid()`; **no athlete INSERT/UPDATE policy** (service-role only by design) | `20260603184451_create_clinical_write_tables.sql` |
| `v_injuries_unified` | ✅ Yes (VIEW, security_invoker) | Selects from `athlete_injuries`; maps `injury_grade` → numeric `severity` (Grade3=9 / Grade2=6 / Grade1=3 / else 5); maps `recovery_status` → `status` (`'rehab'`→`'monitoring'`, else passthrough); exposes `type`, `body_part`, `occurred_at`, `start_date`, `description`, `restrictions` | Inherits `athlete_injuries` RLS | `20260603220617_create_v_injuries_unified_compat_view.sql` |
| `training_sessions` | ✅ Yes | `duration_minutes` (1-1440), `workload` (≥0), `performance_score` (0-100), `prescribed_duration`, `prescribed_intensity`; `verification_confidence` renamed to `verification_confidence_deprecated` | ✅ Team-scoped RLS | `20260610201500_deprecate_dead_fields_phase1.sql` |
| `readiness_scores` | ✅ Yes | `user_id` (NOT NULL), `day` (date NOT NULL), `score`, `acwr`; UNIQUE(`user_id`, `day`). Legacy dupes dropped: `athlete_id`, `date`, `readiness_score`, `fatigue_score`, `stress_score`, `overall_readiness` | ✅ SELECT `user_id = auth.uid()` + coach/team-staff access | `20260529111034_...readiness_scores_collapse.sql` |
| `load_monitoring` | ❌ **DROPPED** | `DROP TABLE IF EXISTS` confirmed | N/A | `20260529094217_drop_dead_load_monitoring_phase8.sql` |
| `training_load_metrics` | ❌ **DROPPED** | `DROP TABLE IF EXISTS` (+ `load_daily`, `acwr_calculations/history/reports`, `load_caps`) | N/A | `20260529090455_drop_ghost_load_acwr_caches_phase4.sql` |
| `injury_risk_factors` (had `asymmetry_index`) | ❌ **DROPPED** | `DROP TABLE IF EXISTS public.injury_risk_factors` | N/A | `20260529100942_drop_orphaned_tables_phase10.sql` |
| `season_calendar` | ✅ Exists — as a **JSONB column**, not a table | `athlete_training_config.season_calendar jsonb NOT NULL DEFAULT '[]'` | Inherits `athlete_training_config` RLS | `20260603194621_athlete_training_config_add_season_calendar.sql` |

---

## 2. Column mismatches (code assumes / live DB doesn't have)

| assumed column | table assumed in | live status | code location | fix required? |
|---|---|---|---|---|
| `resting_hr` | `daily_wellness_checkin` | **DOES NOT EXIST** — no migration adds it | `wellness.service.ts:36,82` (typed only, no consumer) | No runtime impact (orphaned client type). Remove type in Phase 3 cleanup. |
| `pain_level` | `daily_wellness_checkin` | **DOES NOT EXIST** — no migration adds it | `daily-protocol-rtp.js:17` (`wellnessCheckin?.pain_level`) | Low impact: `|| 2` fallback prevents crash. Fix: remove reference in Phase 3. |
| `supplements` (generic) | `daily_wellness_checkin` | **DOES NOT EXIST** as a column | `wellness.service.ts` | No runtime impact. |
| `asymmetry_index` | `athlete_injuries` / `readiness_scores` (code assumes some table) | **Dropped** with `injury_risk_factors` | `daily-protocol.js:269 asymmetryThreshold:0.1`; `supabase-types.ts` | Constant is a dead reference; no query ever runs. No runtime impact. |
| `readiness_scores.acwr` | `readiness_scores` | ✅ **DOES EXIST** — confirmed via RLS policy + safety-trigger migration + `calc-readiness.js` upsert at line 825 | `daily-protocol.js:551`, `calc-readiness.js:825` | No fix needed — this was a false flag from the collapse migration not re-touching the column. |
| `season_calendar` (as a table) | standalone | **Is a JSONB column** on `athlete_training_config`, not a table | `periodization.service.ts macroPhaseFor` | Code that reads `athlete_training_config.season_calendar` is correct; code expecting `.from("season_calendar")` would be wrong (grep found none). |

---

## 3. Ghost-table endpoints — corrected picture

| claimed ghost | endpoint | actual status | runtime behavior |
|---|---|---|---|
| `equipment_items` / `equipment_assignments` | `equipment.js` (claimed) | **File doesn't exist**, no netlify.toml route | Netlify 404 — not a 500, and no Angular call found |
| `officials` / `game_officials` | `officials.js` (claimed) | **File doesn't exist**, no route | Netlify 404 — same |
| `depth_chart_templates/_entries/_history` | `/api/depth-chart*` → `roster.js` | Tables absent; `roster.js`'s internal router **doesn't handle those paths** | ⚠️ Graceful 404 JSON on every call — **real broken surface** |
| `program_cycles` | `/api/program-cycles*` → `programs.js` | Table absent; internal router doesn't handle path | ⚠️ Graceful 404 JSON — **real broken surface** |
| `team_chemistry` | `dashboard.js` | **Not a real query** — only appears in `logger.error()` label strings; function queries `team_members` directly and returns `{chemistry: null, ...}` | Fully graceful, no error |
| `usda_foods` | `nutrition.js` (claimed) | No `nutrition.js` code references this table now (already removed) | No runtime impact — stale doc claim |
| `seasons` / `scouting` | none found | Tables absent, but **zero code references** found | Stale doc claims |

**Net:** RECONCILIATION.md's table-absence claims are accurate; its "queries ghost table → 500" framing is wrong for all of them. The two live broken surfaces are `/api/depth-chart` and `/api/program-cycles` (both 404, not 500). RECONCILIATION.md should be updated to downgrade these from "GHOST table → 500" to "router-mismatch → 404".

---

## 4. RLS summary

All user-scoped tables verified have RLS enabled. Notes:
- `athlete_injuries`: athlete can SELECT own rows; **no INSERT/UPDATE policy** (service-role writes by design — clinician/coach writes via admin client). Correct per architecture.
- `training_sessions`: team-scoped RLS (athletes see own + team records with consent). Correct.
- `readiness_scores`: SELECT by `user_id = auth.uid()` + coach/team-staff access via `coach_athlete_assignments`/`team_members`. Correct.
- `daily_wellness_checkin`: upsert RPC validates `auth.uid() = p_user_id`. Correct.

No RLS gaps found on the verified tables.

---

## 5. Carry-forward to Phase 3

Minor dead-code cleanups (not P0s; no runtime impact):
- Remove `resting_hr` type from `wellness.service.ts` (no column, no consumer)
- Remove `wellnessCheckin?.pain_level` fallback from `daily-protocol-rtp.js:17` (no column; now that authority path passes real `injuriesPainLevel`, this dead branch can go)
- Remove `asymmetryThreshold:0.1` dead constant from `daily-protocol.js:269` (dropped table)
- Update `supabase-types.ts` (stale — regenerate from live schema in Phase 5)
- Correct RECONCILIATION.md ghost-table runtime-impact claims (doc hygiene)
