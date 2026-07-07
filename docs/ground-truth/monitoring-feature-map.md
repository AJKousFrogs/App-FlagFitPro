# Feature Status Ledger — Per-Player Monitoring Report

> **Prompt-1 read-only map.** Every table/column verified against the **live introspected Supabase schema** (project `grfjmnjpzvknmsxrwesx`, MCP `list_tables` + `pg_policies`/`information_schema` via `execute_sql`, 2026-07-07) and live code — **not docs**. Row counts are live `count(*)`. No code changed.
>
> Prior-incident guard honored: the wellness table is **`daily_wellness_checkin`** (there is **no** `wellness_checkin` table).

---

## 1. SCHEMA (live tables, by data layer)

| Layer | Table (exact) | Rows | id column | PK | Key FK | Notes |
|---|---|---|---|---|---|---|
| Wellness / Hooper | **`daily_wellness_checkin`** | 29 | `user_id` | `id` | `user_id → public.users.id` | sleep_quality, sleep_hours, energy_level, muscle_soreness, stress_level, soreness_areas[], motivation_level, mood, hydration_level, calculated_readiness, travel_hours, checkin_date |
| Readiness (derived) | `readiness_scores` | 13 | `user_id` | `id` | `user_id → public.users.id` | score, level, acwr, acute_load, chronic_load, sleep_score, workload_score, proximity_score, day |
| Session load / sRPE | `training_sessions` | 16 | `user_id` + `team_id` | `id` | `user_id → public.users.id`, `team_id → teams.id` | **sRPE lives here**: `rpe:int`, `workload:numeric`, `throw_count`, `throw_au`, intensity_level, duration_minutes, completion_rate |
| Session load (micro) | `micro_sessions` | 0 | `user_id` | `id` | `user_id → auth.users.id` ⚠ | empty; short mobility/recovery blocks |
| External load / Catapult | **— none —** | — | — | — | — | **No GPS/Catapult/IMU/device table exists.** Full gap. |
| Bloodwork / labs | **— none —** | — | — | — | — | **No labs/biomarker/panel table exists.** Full gap. |
| Injury / physio | `athlete_injuries` | 7 | `user_id` | `id` | `user_id → auth.users.id` ⚠ | injury_type/location/grade, current_phase, rtp_progress, activity_restrictions[] |
| Physio blocks | `recovery_blocks` | 1 | `user_id` | `id` | `user_id → auth.users.id` ⚠ | block_start/end_date, max_load_percent, restrictions:jsonb |
| Athlete config | `athlete_training_config` | 2 | `user_id` (PK) | `user_id` | `user_id → auth.users.id` ⚠ | `acwr_target_min/max`, `age_recovery_modifier`, birth_date, positions |
| Reference/threshold | `readiness_gates` | 4 | — (no athlete id) | `id` | — | context, threshold_low/mid/high, action_*, methodology_citation |
| Reference/threshold | `contraindication_rules` | 22 | — | `id` | — | injury_location → blocked_modality, gate_level, rtp_phase_cleared_at |
| Reference/threshold | `taper_rules` | 5 | — | `id` | — | tournament_level → taper_days, volume_reduction_pct |
| Reference/threshold | `weather_substitution_rules` | 8 | — | `id` | — | original_modality + condition/threshold → substitute_modality |
| Reference/threshold | `age_recovery_modifiers` | 6 | — | `id` (int) | — | age_min/max → recovery_modifier, acwr_max_adjustment |
| Roster / players | `team_members` | 5 | `user_id` + `team_id` | `id` | `user_id → auth.users.id`, `team_id → teams.id` | **also the roles table** (see §2): role, status, position(s), jersey_number |
| Roster stats | `player_training_stats` | 0 | `user_id` (PK) | `user_id` | `user_id → public.users.id` | total_load_au, month_load_au — empty |
| Teams | `teams` | 1 | `id` | `id` | `coach_id → auth.users.id` | — |
| Roles catalog | `staff_roles` | **0** | `id` (varchar slug) | `id` | — | permission flags incl. **`can_view_health_data`** — but **catalog is empty** |
| Consent | `athlete_consent_settings` | — | `user_id` | — | — | `share_readiness_with_coach`, `share_wellness_answers_with_coach`, `share_training_notes_with_coach`, `share_merlin_conversations_with_coach`, `share_readiness_with_all_coaches` |

### ⚠ Non-`user_id` id flags (verified across ALL 169 public tables)
- **`athlete_id`** appears in exactly **2 tables**: `prescription_audit_log`, `rtp_prescription_approvals`. Every other table uses `user_id`.
- **`player_id`**: **0 tables** (does not exist anywhere).
- **FK-target split (verified):** monitoring tables reference **two different** user anchors — `daily_wellness_checkin`, `readiness_scores`, `training_sessions`, `player_training_stats` → **`public.users.id`**; `athlete_injuries`, `recovery_blocks`, `athlete_training_config`, `micro_sessions` → **`auth.users.id`**. A per-player join must not assume one target.

---

## 2. ROLES / RLS — what gating is possible today

- **Membership + role source of truth = `team_members`** (`user_id`, `team_id`, `role:varchar`, `status:varchar`, `role_approval_status`). Roles are stored as **strings**, not FKs to `staff_roles`.
- **`staff_roles` catalog is EMPTY (0 rows)** — its `can_view_health_data` / `can_manage_roster` permission model is defined but **unpopulated and unused**. Not a usable gating source today.
- **Live roles present in data:** `coach`, `nutritionist`, `physiotherapist`, `player`, `psychologist` (1 each, all `active`/`approved`). **No `head_coach` or `strength_conditioning_coach` rows exist**, though the app's guards recognize them.
- **RLS CAN key on:** `team_members` via two live helper functions — **`is_active_superadmin()`** and **`auth_user_team_ids()`** — plus inline `EXISTS(team_members … role = ANY(…))` sub-selects. This is a working foundation.
- **Cross-athlete read policies that already exist (verified from `pg_policies`):**
  - `readiness_scores` SELECT → own **OR** `team_members.role ∈ {physiotherapist, medical_staff, admin, owner}`.
  - `training_sessions` SELECT/UPDATE → own **OR** same-team `role ∈ {coach, head_coach, admin, owner, offense_coordinator, defense_coordinator, assistant_coach}`.
- **Own-only (NO staff read) — blockers for monitoring:** `daily_wellness_checkin` (authenticated own + service_role), `athlete_injuries` (own), `recovery_blocks` (service_role only), `athlete_training_config` (own).
- **Not a blocker overall** (membership/role infra exists), **but** the role sets are inconsistent and **consent flags in `athlete_consent_settings` are not referenced by any RLS policy**.

---

## 3. ROUTES (Netlify Functions relevant to monitoring)

Two patterns coexist: **v2 domain handlers** (one function fans out many `/api` routes) and **v1 direct functions** (invoked via a domain handler; often no own `/api` redirect).

| Function | Routes | R/W | Real data? |
|---|---|---|---|
| `wellness` (domain) | `/api/wellness-checkin`, `/api/wellness/checkin`, `/api/hydration`, `/api/sleep-data` | R/W | ✓ (29 check-ins) |
| `wellness-checkin` / `wellness-logs` | via domain | GET / POST | ✓ |
| `readiness` (domain) | `/api/calc-readiness`, `/api/compute-acwr`, `/api/load-management`, `/api/readiness-history` | R/W | ✓ (13 scores, 16 sessions) |
| `calc-readiness` / `compute-acwr` / `load-management` / `readiness-history` | via domain | POST / compute | ✓ |
| `athlete-injuries` | `/api/athlete-injuries` | GET (self-report) | ✓ (7) |
| `coach` (domain) | `/api/coach`, `/api/coach-analytics`, `/api/coach-inbox`, `/api/coach-alerts`, `/api/coach-activity` | R/W | partial |
| `coach-core` | via domain | GET/POST/PUT/DELETE | ✓ |
| `staff` (domain) | `/api/staff-physiotherapist`, `/api/staff-nutritionist`, `/api/staff-psychology` | R/W | lane endpoints (service-role, bypass own-only RLS) |
| `roster` (domain) | `/api/player-settings`, `/api/player-stats`, `/api/depth-chart`, `/api/scouting` | R/W | ✓ |
| `analytics` (domain) | `/api/performance-data/{wellness,trends,injuries,measurements,…}`, `/api/performance/{metrics,trends,heatmap}` | R | ✓ |

> The **`staff-*` endpoints run as service-role** and are how staff currently read another athlete's data despite own-only RLS on wellness/injuries — i.e., gating is enforced in **function code**, not the database.

---

## 4. INGESTION — how external load gets in

- **Manual only.** Load enters as `training_sessions.rpe` + `.workload` (+ `throw_count`/`throw_au`) written by the app, and wellness via `daily_wellness_checkin`. There is **no automated load ingestion**.
- **No device/provider concept anywhere** — verified: no Catapult/GPS/IMU/wearable/HealthKit/Garmin/Whoop/Oura table or integration in schema or code. "external load" exists only as a **narrative concept** in `load-management.js`, not a data source.
- **Bulk-import functions exist but are unrelated to wearables:** `import-open-data.js`, `import-process.js` (open-data/catalog import) and `upload.js` (file upload).
- **Consent storage exists** (`athlete_consent_settings`, granular `share_*_with_coach` flags) — but there is **no device/third-party-provider consent** and the flags aren't enforced by RLS.

---

## 5. FRONTEND (Angular)

| Artifact | Path | State |
|---|---|---|
| ACWR service | `core/services/acwr.service.ts` | **live** |
| ACWR spike detection | `core/services/acwr-spike-detection.service.ts` | live |
| Readiness service | `core/services/readiness.service.ts` | live |
| Wellness service | `core/services/wellness.service.ts` | live |
| Periodization engine | `core/services/periodization.service.ts` | live (hardcodes thresholds — §7) |
| **ChannelService** | `core/services/channel.service.ts` | **live — but it's the *chat* channel service** (consumed by `team-chat.component`), **not** load monitoring |
| Load/ACWR screen (athlete) | `acwr/acwr.component.ts` (route `acwr`) | **live, routed** — "deep load-monitoring screen" |
| Per-player staff view | `staff/athlete-detail/…` (route **`staff/athlete/:id`**) | **live, routed** — consumes acwr/readiness/wellness/injury; loads via `/api/staff-physiotherapist|nutritionist|psychology` |
| Stats / Wellness / Training | routes `stats`, `wellness`, `training` | live |

No orphaned monitoring components found. **Gap:** the per-player staff view is **lane-specific** (physio/nutrition/psych endpoints); there is **no unified S&C/Head-Coach "monitoring report" per player** that combines wellness + load + injury in one gated view.

---

## 6. GAP ANALYSIS

### Per data layer
| Layer | Data | Endpoint | Frontend | RLS gating | Verdict |
|---|---|---|---|---|---|
| Daily — wellness (`daily_wellness_checkin`) | ✓ 29 | ✓ | ✓ | ✗ own-only | **staff read only via service-role endpoint; no DB gating, consent flag not enforced** |
| Daily — readiness (`readiness_scores`) | ✓ 13 | ✓ | ✓ | ✓ (physio/medical/admin/owner) | works for those roles; **excludes S&C & head_coach; ignores consent** |
| Weekly/load — sRPE (`training_sessions`) | ✓ 16 | ✓ | ✓ | ✓ (coach roles) | works for coaches; **excludes physiotherapist** |
| External load | ✗ | ✗ | ✗ | — | **build-from-zero** (table + ingest + UI) |
| Bloodwork/labs | ✗ | ✗ | ✗ | — | **build-from-zero** |
| Reference/threshold | ✓ populated | n/a | n/a | own-agnostic | **tables exist but mostly unread (see §7) — data/code drift** |
| Injury/physio (`athlete_injuries`,`recovery_blocks`) | ✓ 7 / 1 | ✓ | ✓ | ✗ own / service-role | **no staff DB gating** |

### Per role (cross-athlete read, via RLS)
- **Head Coach** — reads team `training_sessions`; **cannot** read `readiness_scores` (not in its policy), wellness, or injuries via RLS.
- **S&C coach (`strength_conditioning_coach`)** — in **no** cross-read policy and **no rows exist**; can read **nothing** cross-athlete at the DB layer. **Primary blocker for the S&C monitoring use case.**
- **Physiotherapist** — reads `readiness_scores`; **cannot** read wellness/injuries via RLS (must use service-role `staff-physiotherapist`).

### Per ingestion path
- Manual (app) — works. Device/wearable — absent. Import — file/open-data only.

---

## 7. CONSTANTS / thresholds — config table vs hardcoded

- **Hardcoded (authoritative in practice):**
  - `netlify/functions/utils/acwr.js` — ACWR bands **0.8 / 1.3 / 1.5 / 1.8** inline.
  - `angular/src/app/core/services/periodization.service.ts` — `ACWR_DANGER=1.5`, `ACWR_ELEVATED=1.3`, `ACWR_UNDER=0.8` (used across the prescription engine).
- **DB reference tables exist but are largely unused (drift):**
  - `readiness_gates` (4) — referenced in **2** code files.
  - `age_recovery_modifiers` (6) — referenced in **2** code files.
  - `contraindication_rules` (22), `taper_rules` (5), `weather_substitution_rules` (8) — **referenced in 0 code files.** Populated, methodology-cited, and **completely orphaned** from the running logic.
- **Implication:** thresholds are **not** driven by a single config source today. A monitoring feature that surfaces "why flagged" must either read `readiness_gates`/rules (currently bypassed) or duplicate the hardcoded numbers — choosing one is a §later-prompt decision, but the drift is a documented risk now.

---

## Headline blockers for the monitoring feature (for later prompts)
1. **No external-load or bloodwork tables** — those layers are build-from-zero.
2. **Own-only RLS on `daily_wellness_checkin`, `athlete_injuries`, `recovery_blocks`** — staff cross-read currently only via service-role endpoints, not the DB.
3. **Role coverage gaps in existing policies** — S&C coach gated out everywhere; head_coach excluded from readiness; physio excluded from load.
4. **Consent flags (`athlete_consent_settings`) are defined but not enforced by RLS.**
5. **`staff_roles` permission catalog is empty** — `can_view_health_data` is aspirational, not wired.
6. **Threshold drift** — hardcoded ACWR bands vs unread `*_rules` reference tables.
