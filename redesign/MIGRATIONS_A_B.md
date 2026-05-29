# Migration Plans — (A) Athlete-ID Standardization · (B) Wellness Consolidation

**Date:** 2026-05-29 · Live DB `grfjmnjpzvknmsxrwesx`, **pre-launch (8 users)**. No migration runs without sign-off. All via Supabase MCP (`apply_migration`), each reversible.

---

## B — Wellness table consolidation (bounded · recommended to do now)

### Current state (the drift)
Four tables, three keyed differently, **a triple-write, and split reads**:
| Table | Key | Rows | Notes |
|-------|-----|------|-------|
| `daily_wellness_checkin` | `user_id` uuid | 2 | **Richest schema** (sleep_hours/quality, energy, soreness(+areas), stress, mood, hydration, motivation, calculated_readiness). Read by most app surfaces. |
| `wellness_logs` | `athlete_id`+`user_id` uuid | 0 | **Read by `calc-readiness` for the readiness score.** Subset of fields. |
| `wellness_entries` | `athlete_id` uuid | 2 | Written by `wellness-checkin` upsert; read by consent-data-reader, performance-data. |
| `wellness_data` | `user_id` **varchar** | 0 | Legacy, different column names (`sleep`/`energy`/…), wrong key type. Dead. |

- **Writers:** `wellness-checkin.js` writes **all three** (daily_wellness_checkin, wellness_logs, wellness_entries). `daily-protocol.js` upserts `wellness_logs`.
- **Readers:** `calc-readiness` (wellness_logs + daily_wellness_checkin), `sleep-data`, `smart-training-recommendations`, `daily-protocol` (wellness_logs); consent-data-reader, performance-data (wellness_entries); 6 angular services (daily_wellness_checkin).

### Target
**`daily_wellness_checkin` is canonical** (richest, `user_id` uuid, most consumers). One write, all reads from it.

### Migration steps (each a reversible Supabase migration + code change)
1. **Backfill** into `daily_wellness_checkin` any rows from `wellness_entries` (map `athlete_id`→`user_id`, `date`→`checkin_date`) and `wellness_logs` not already present. `wellness_data` is empty + varchar key → skip. *(Only 2 entries rows exist — trivial.)*
2. **Cut over reads** to `daily_wellness_checkin`:
   - `calc-readiness.js` `fetchWellnessForReadiness` → read `daily_wellness_checkin` (columns superset-compatible).
   - `sleep-data.js`, `smart-training-recommendations.js`, `daily-protocol.js` → same.
   - `consent-data-reader.js`, `performance-data.js` → same (drop `athlete_id` filter for `user_id`).
3. **Cut over writes:** `wellness-checkin.js` + `daily-protocol.js` write **once** to `daily_wellness_checkin` (remove the wellness_logs/wellness_entries upserts).
4. **RLS:** ensure `daily_wellness_checkin` carries the coach/team-consent SELECT policy that `wellness_entries`/`wellness_logs` had (so consented coach reads still work). Add if missing.
5. **Drop** `wellness_logs`, `wellness_entries`, `wellness_data` (after cutover; keep a down-migration).
6. **Verify:** `wellness-checkin-validation`, `calc-readiness-validation`, `wellness-validation`, `sleep`/`daily-protocol` tests; manual readiness calc sanity.

**Risk:** Low-medium. Bounded to ~8 code files + 3 table drops; tiny data. **High value:** fixes the triple-write and ensures readiness reads the same wellness data the rest of the app writes. **Recommend: do now.**

---

## A — Athlete-ID standardization (large · recommend phasing with the port)

### Surface (measured)
- `user_id`: **86 tables** · `player_id`: **31** · `athlete_id`: **18** (+ views `v_athlete_schedule`, `v_load_monitoring_consent`, `v_workout_logs_consent`; + every RLS policy + all query code). Some tables carry two keys (e.g. `readiness_scores`, `training_sessions`, `wellness_logs`, `return_to_play_protocols`).
- Target convention: **`user_id`** (it already dominates at 86 tables and equals `auth.uid()` — the value RLS compares against).

### Options
- **A1 — Big-bang rename now.** Rename all `athlete_id`/`player_id` → `user_id` (49 tables), rewrite RLS, views, FKs, and every query. *Pre-launch data is trivial to migrate, but the code/RLS blast radius is ~135 columns across the whole app — high churn, high regression risk, and much of it is only verifiable once the UI exists.* Not recommended as one shot.
- **A2 — Phase with the port (recommended).** Standardize a table's key to `user_id` **when the screen that uses it is rebuilt** — so each rename is verified end-to-end on a real screen. Establish `user_id` as the rule for all new/rebuilt tables now (a one-line convention doc + lint check). Spreads risk, keeps every change verifiable.
- **A3 — Compatibility columns.** Add a generated/aliased `user_id` to `athlete_id`/`player_id` tables so queries can converge without dropping columns yet. Medium effort; leaves two columns around (its own debt).

### Recommendation
**A2.** Lock `user_id` as the standard now (cheap), and physically standardize each table during the port of its feature (verifiable, low-blast-radius). Do **not** big-bang 135 columns blind while there's no UI to confirm against. I can produce the per-table rename recipe (rename col → update RLS `USING/WITH CHECK` → update views → update code → drop old) as a repeatable template applied per feature.

---

## Proposed order
1. **B now** (bounded, fixes a real readiness-data correctness issue).
2. **A as A2** — convention locked now, physical standardization rides with each ported feature.

---

## STATUS — 2026-05-29

### B — wellness CHECK-IN consolidation: DONE (code), drops DEFERRED
Discoveries while executing:
- The codebase already had a documented "Phase 2 → Phase 3" consolidation; `daily_wellness_checkin` was already primary with legacy dual-writes/fallbacks.
- **`performance-data.js` was a *second* check-in writer** (to `wellness_entries`) — repointed to `daily_wellness_checkin`.
- **`wellness_logs` is dual-purpose**: `daily-protocol.js` writes *training* fields (`training_load/duration/rpe`) to it — those have no home in `daily_wellness_checkin`. So `wellness_logs` is **NOT dropped yet**; re-homing the training-load write (to a load/session table) is a separate decision.

Done (branch `rebuild/static-first`): writers `wellness-checkin.js` + `performance-data.js` write only `daily_wellness_checkin`; readers `calc-readiness.js` (canonical readiness) + `consent-data-reader.js` read only `daily_wellness_checkin`; legacy dual-writes/fallbacks removed. `node --check` clean; ACWR/readiness/compute-acwr validation tests pass; the 5 failing wellness/wellness-checkin validation tests are **pre-existing on main** (verified by stashing).

**DEFERRED — apply via Supabase MCP only AFTER the rebuilt backend deploys** (the live DB is shared with currently-deployed main functions that still read these):
```sql
-- wellness_entries + wellness_data are now unwritten/unread by branch code.
DROP TABLE IF EXISTS public.wellness_entries;
DROP TABLE IF EXISTS public.wellness_data;
-- wellness_logs: NOT dropped — re-home daily-protocol's training-load write first,
-- then migrate its remaining readers (sleep-data, smart-training-recommendations).
```

### A — A2: convention locked
See `docs/ATHLETE_ID_CONVENTION.md` (standard = `user_id` = `auth.uid()`; per-table rename template; physical standardization rides with each ported feature).
