# FlagFit Pro — Engine Contract

**Status:** authoritative contract for the prescriptive engine + how data flows into it (2026-05-29). Companion to `PRESCRIPTION_SPEC.md` (the `prescribeFor` algorithm), `DATA_MODEL.md` (canonical tables), `ATHLETE_ID_CONVENTION.md` (`user_id`), `ARCHITECTURE_v10.md` (schedule spine). **This file is the guardrail against scattered data + wrong calculations:** it defines, for every input, where it is saved (one place, under the athlete) and how it reaches the daily plan.

## 0. The one rule
Everything an athlete needs to know — *what to train, how hard, what to eat, when to hydrate, how to recover* — is **derived** from inputs the athlete and their staff log. The athlete never enters a derived value; the engine never invents an input. Data flows **one direction**: inputs → derived signals → prescription.

## 1. Identity & ownership ("save under that player")
- **One identity: `user_id` = `auth.uid()`** on every athlete-scoped row (see `ATHLETE_ID_CONVENTION.md`). RLS: `auth.uid() = user_id` for self-access.
- **Athlete-owned, staff-authored.** Every record *about* an athlete keys to the **athlete's `user_id`**. When a staff member writes it, the row also carries **`authored_by` (staff `user_id`) + `authored_role`**. A physio's injury note belongs to the athlete; the physio is the author. → "Save under the player" is universal (self-entry *and* staff entry).
- **One person, N teams.** `team_members(user_id, team_id, role, status)` — a person can be a *player* in one team and *coach/staff* in another. Role is per-membership. The athlete's personal data (wellness, training, prescriptions) is **team-agnostic** (keyed `user_id`); team context comes from `team_members` → `competition_events`.

## 2. Multi-team schedule spine
- **Canonical:** `competitions` + `competition_events` (per-team slots, `expected_game_count` = density signal, `importance`) + **`v_athlete_schedule`** = the **union of every event across all the athlete's *active* team memberships** (domestic + international + national). Verified: it joins `competition_events → competitions → teams → team_members(status='active')`, keyed `user_id`.
- **Periodize around the union, not per team.** The athlete has one body. Phase and load are driven by the **nearest / highest-`importance` event across all teams**, and density (7/14/28d) sums **all** teams' games. Two teams can never produce two contradictory plans.

## 3. The pipeline (input → derived → prescription)

| INPUT (entered once, keyed `user_id`) | canonical table | DERIVED signal | engine input |
|---|---|---|---|
| training availability | `athlete_training_config` | weekly training shape | day-of-week intent |
| gamedays (per team) | `competition_events` (via spine) | phase, density7/14/28d, next/last event, `expected_game_count` | proximity, taper, density modulation |
| wellness + sleep | `daily_wellness_checkin` | wellness index, sleep score | readiness |
| training done | `training_sessions` | ACWR (EWMA+uncoupled, `utils/acwr.js`) | load gate |
| hydration intake | `athlete_hydration_logs` | daily total / adherence | hydration plan + tournament timeline |
| nutrition + supplements | `nutrition_logs`, `supplement_logs` | intake vs targets | fueling adherence |
| bodyweight / measurements | `physical_measurements` | — | nutrition scaling (g/kg) |
| stats (drops, missed pulls — API or self) | `flag_pull_stats`/`receiving_stats`/`passing_stats`/`situational_stats`, `performance_records`, `qb_throwing_sessions` | **weakness profile** | corrective bias in session builder |

**Derived (computed, never hand-entered, rebuildable):** ACWR (`utils/acwr.js`), readiness (`netlify/functions/calc-readiness.js`), phase + density + next/last event (`schedule.service` over the spine), weakness profile (from stats), `readiness_scores` (persisted server output).

**Prescription:** `periodization.service.prescribeFor()` (contract in `PRESCRIPTION_SPEC.md`) → daily plan: intent, target RPE, minutes, sprint reps, strength sets, nutrition (carbs/protein/hydration), recovery emphasis, reasoning.

## 4. Roles, Authority & Consent

### Role functions
| Role | Writes (about the athlete; `+authored_by/role`) | Reads (consent tier) | Effect on plan |
|---|---|---|---|
| **Athlete** | all the inputs in §3 | own | consumer of the plan |
| **Coach** | `coach_overrides`, assigned sessions/programs, `practice_plans` | performance | overrides the auto-plan (time-boxed, `expires_at`) |
| **Nutritionist** | `nutrition_goals`/plan, supplement guidance | nutrition + measurements | sets nutrition/hydration targets (replaces computed defaults) |
| **Physiotherapist** | `injuries`, `return_to_play_protocols`, recovery prescriptions | health | safety gate (see precedence) |
| **Psychologist** | psychology notes / assessments | mental-health (strictest) | flags mental-fatigue deload; informs readiness |

### Authority precedence (the engine MUST obey, in order)
1. **Physio safety — ABSOLUTE BLOCK.** An active `injuries` record or an in-progress `return_to_play_protocols` phase caps/forbids the relevant work regardless of ACWR/readiness (e.g. no sprint while a hamstring RTP is pre-clearance). Nothing overrides this.
2. **Coach override** (`coach_overrides`, until `expires_at`) — supersedes the auto-plan's session/load within the physio's safety envelope.
3. **Nutritionist plan** (`nutrition_goals`) — replaces the engine's computed nutrition/hydration targets.
4. **Auto-engine** (`prescribeFor`) — the default when none of the above apply.

### Consent tiers (RLS)
- **performance** (coach): `can_view_player_performance(viewer, athlete)` + the `v_*_consent` views + `athlete_consent_settings` share-flags.
- **health** (physio, nutritionist): `can_view_player_health` / `staff_roles.can_view_health_data`.
- **mental-health** (psychologist): strictest — separate explicit consent.
- **parental** (`parental_consent`) for minors gates all of the above.
- Backend functions use the service-role client + **explicit code consent** (resolve consented IDs, then query); the `auth.uid()` consent views serve client/anon-key reads.

## 5. Tournament timeline (back-to-back / gameweek)
Driven by `expected_game_count` + event `starts_at` from the spine: day-before carb-load, between-game hydration/fuel windows (e.g. "8× 2×20-min over 2 days"), post-game recovery. `prescribeFor` already computes the *totals*; the timeline adds the *when* (pre/between/post windows) to avoid cramps/under-fuelling/injury.

## 6. Gaps to build (tracked here + in `DATA_MODEL.md`)
1. **Finish `user_id` standardization + add `authored_by`/`authored_role`** — incl. the role/clinical tables (`coach_overrides.player_id`, `injuries.player_id`, `return_to_play_protocols` has both keys, `coach_athlete_assignments.athlete_id`). The save-under-player guarantee.
2. **Wire authority into `prescribeFor`** — consume injury/RTP gate, `coach_overrides`, `nutrition_goals` (currently it only takes acwr/readiness/phase).
3. **Session builder** — `(intent + phase + position + injury-flags + density + weakness)` → concrete exercises from the canonical library (plyo/iso/Nordic/warmup), applying the evidence-based progressions (today the content is inert).
4. **Weakness profile** — stats → corrective drill bias.
5. **Tournament timeline** — §5.
6. **Per-role / per-tier consent** — extend `athlete_consent_settings` beyond coach-only flags (health, mental-health).

## 7. Write-contract (enforced)
Every "Save" (settings, wellness, today, hydration, stats, staff entries) → exactly **one** row in the canonical table, keyed `user_id` (the athlete), RLS-scoped to `auth.uid()`, staff writes carrying `authored_by` + `authored_role`. No duplicate tables, no cross-domain columns, no double-entry. This is what keeps the calculations correct.
