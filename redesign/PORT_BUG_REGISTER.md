# Port-Time Bug Register (schema mismatches needing feature intent)

These are real code↔schema mismatches found in the backend audit that are **NOT
safe to fix mechanically** — each needs a product/feature decision, so they're
deferred to when the corresponding feature is rebuilt (per the "don't guess
without intent" discipline). None are user-facing right now (the UI is demolished
and nothing calls these paths), but each is latent and **must be resolved when its
feature is ported**.

The unambiguous, mechanical mismatches found alongside these were already fixed
(see commit history: ai-chat/performance-data injuries column aliases,
readiness-history `data_mode` removal).

| # | Area | Code expects | Actual schema | Decision needed |
|---|------|-------------|---------------|-----------------|
| 1 | **recovery_blocks model** — `ai-chat.js` (select), `games-core.js` (2 inserts), `wellness-checkin.js` (select + insert) | `block_date`, `max_load_percent`, `focus`, `restrictions`, `protocol_type` (a single-day "recovery protocol") | `block_start_date`, `block_end_date`, `block_type`, `reason` (a date-range block) | Extend `recovery_blocks` to carry the protocol model (load%/focus/restrictions), **or** rewrite the code to the range model. Until then game-day/wellness recovery-block creation silently fails and ai-chat's active-recovery context is empty. |
| 2 | **consent_access_log audit insert** — `utils/consent-data-reader.js` `_logAccess` | inserts `accessor_user_id`, `target_user_id`, `resource_type`, `access_granted`, `consent_type`, `team_id`, `access_reason` | `user_id`, `accessed_by`, `access_type`, `data_category`, `accessed_at`, `reason`, `consent_given` (no `team_id`) | Reconcile which schema is canonical. Some keys map plausibly (`target_user_id`→`user_id`, `accessor_user_id`→`accessed_by`, `access_reason`→`reason`, `access_granted`→`consent_given`) but `resource_type`/`consent_type`/`team_id` have no clean target. The consent-access audit log currently silently no-ops (error swallowed). |
| 3 | **attendance tables don't exist** — `attendance.js` | reads/writes `player_attendance_stats`, `absence_requests` | tables do not exist | Build the attendance feature's tables (with `user_id` keying per the standard) or remove the handler. Dormant feature. |
| 4 | **injuries.recoveryDate** — `performance-data.js` create/read | single `recovery_date` | `recovery_start_date`, `expected_recovery_date`, `actual_recovery_date` | Decide which recovery date the API surfaces as `recoveryDate` (the type/start_date mismatches here were already fixed mechanically; only this field is ambiguous and left null). |
| 5 | **5 broken game-readers** (pre-existing, see project memory) | `home_team_id`, `away_team_id`, `game_start`, `participants`, `player_id` on `games` | `team_id`, `opponent_team_name`, `game_date` (single-team perspective) | Rewrite at the game-stats feature rebuild with real intent — the data model is fundamentally different (no home/away; opponent is a name), so not a mechanical rename. |

## Dead reads to dropped/nonexistent tables (repoint at port)

Live handlers still querying tables that were dropped in the consolidation or
never built. They return empty/err today (callers swallow it; UI is gone). Each
needs an intent-aware repoint when its feature is ported — not a mechanical
rename. (The unambiguous cases — six `training_sessions` reads still keyed on the
dropped `athlete_id`, plus the dead `sessions`/`training_load_metrics` fallbacks
in training-metrics/load-management — were already fixed; see commit history.)

| Handler | Dead table(s) | Likely canonical target | Note |
|---|---|---|---|
| `trends.js` | `sessions` (dropped, ×2), `game_stats` (never built), `games` (`.or athlete_id,user_id` — table is team-keyed) | `training_sessions`; game-stats feature | Whole handler is sessions/game-stats based → returns empty trends. |
| `achievements.js` | `protocol_completions` (never existed) | `training_sessions` (session-RPE) | "recent activity / this-week" stat is always empty. |
| `user-context.js` | `wellness_checkins` (never existed) | `daily_wellness_checkin` | Verify column mapping before repoint. |
| `utils/consent-data-reader.js` | `load_monitoring`, `workout_logs` (dropped), `wellness_entries` (dropped) | `training_sessions`; `daily_wellness_checkin` (via consent views) | Consent-gated coach reads — repoint carefully with the consent views. |
| `decisions.js` | `decision_ledger` exists but has **neither** `user_id` nor `athlete_id`; `.eq("athlete_id")` + `athlete:athlete_id(...)` embeds reference a missing column | inspect actual athlete-ref column | Needs schema inspection; not a clean rename. |
| `calibration-logs.js` | `calibration_logs` (never built) | build feature or remove | Dormant feature scaffold. |
| `utils/team-activity-resolver.js` | `team_activity_attendance` (never built) | build feature or remove | Dormant feature scaffold. |

## Rule for the port

When porting a feature whose handler appears above, resolve its row here as part
of the port (fix the query/insert against the real schema, or build the missing
tables/columns). Don't ship the screen on top of a known-broken data path.
