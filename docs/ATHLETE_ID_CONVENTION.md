# Athlete Identity Column Convention

**Status:** Standard (2026-05-29). **Authority for "who owns this row" across the DB.**

## The standard
Every athlete-owned table uses **`user_id uuid`** referencing the auth user (`auth.uid()`).
- It already dominates (86 tables vs 31 `player_id` / 18 `athlete_id`).
- It equals the value RLS compares against (`auth.uid()`), so policies are uniform.

**All new and rebuilt tables MUST use `user_id`.** Do not introduce `athlete_id` or `player_id`.

## Legacy state (being standardized incrementally — strategy A2)
Two legacy conventions remain and are migrated **per feature, as that feature's screens are rebuilt** (so each change is verified end-to-end, not big-banged blind):
- `athlete_id` — 18 tables (e.g. `athlete_daily_state`, `recovery_sessions`, `return_to_play_protocols`, `wellness_logs`, `readiness_scores`).
- `player_id` — 31 tables (e.g. `injuries`, `load_daily`, `load_metrics`, `workout_logs`, `player_*`).

Some tables carry two keys (e.g. `training_sessions`, `readiness_scores`, `wellness_logs`) — collapse to `user_id` during their migration.

## Per-table rename recipe (apply via Supabase MCP `apply_migration`, one feature at a time)
1. **Add** `user_id uuid` (if missing) and backfill from the legacy column.
   `update <t> set user_id = athlete_id where user_id is null;`
2. **Update RLS** — rewrite every policy's `USING` / `WITH CHECK` to compare `auth.uid() = user_id`.
3. **Update views** that reference the legacy column (`v_athlete_schedule`, `v_load_monitoring_consent`, `v_workout_logs_consent`, …).
4. **Update code** — all `.from("<t>").eq("athlete_id"/"player_id", …)` → `.eq("user_id", …)` and any `onConflict`/insert payloads.
5. **Verify** — the feature's screen renders with live data; relevant validation tests pass.
6. **Drop** the legacy column (separate migration, after deploy confirms the code cutover).

## Verification
Re-run the surface query to track progress:
```sql
select column_name, count(*) from information_schema.columns
where table_schema='public' and column_name in ('user_id','athlete_id','player_id')
group by column_name;
```
Goal: `athlete_id` and `player_id` counts trend to 0.
