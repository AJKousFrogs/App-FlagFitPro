# FlagFit Pro — v10 Architecture

**Status:** in progress, additive on top of v4.0.0
**Premise:** Flag football athletes are time-poor and unorganized. The app
must be **prescriptive**, not informational. Open the app → know exactly
what to train, eat, drink, and recover for today, and *why*. The schedule is
the spine; everything else hangs off it.

This doc supersedes `FEATURE_DOCUMENTATION.md` for new development. Older
docs that describe v4 surfaces remain valid until each surface is migrated.

---

## 1. The Spine

Periodization, readiness, nutrition, hydration, and recovery all read from
the same canonical schedule.

```
┌─────────────────────────────────────────────────────────────┐
│  Postgres / Supabase                                        │
│  ────────────────────                                       │
│  competitions          (shared registry)                    │
│  competition_events    (per-team calendar slot)             │
│  v_athlete_schedule    (union across active memberships)    │
└─────────────────────────────────────────────────────────────┘
                          │
                          │  GET /api/schedule
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  netlify/functions/schedule.js                              │
│  ───────────────────────────────                            │
│  • upcoming, lastEvent, nextEvent                           │
│  • density 7d / 14d / 28d                                   │
│  • currentPhase                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  ScheduleService (Angular signals)                          │
│  ─────────────────────────────────                          │
│  snapshot()   currentPhase()   nextEvent()                  │
│  density7d()  density14d()     daysToNextEvent()            │
│  phaseFor(date)  eventsInWindow(days)                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  PeriodizationService.today()                               │
│  ─────────────────────────────                              │
│  prescribeFor(schedule × ACWR × readiness × bodyweight)     │
│   → DailyPrescription:                                      │
│     intent, RPE, minutes, sprintReps, strengthSets,         │
│     reasoning, recoveryEmphasis, nutrition (carbs/          │
│     protein/water), driverEvent                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Consumers                                                  │
│  ─────────                                                  │
│  today.component             (banner + prescription card)   │
│  microcycle-planner          (7-day grid)                   │
│  tournament-nutrition        (per-event auto-seed)          │
│  calc-readiness.js (server)  (game-proximity weight)        │
│  goal-based-planner          (via TrainingPlanService)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Why "team-centric multi-membership"

A single athlete plays in multiple parallel competitions:
Slovenian league + Austrian league + Copenhagen Bowl + Big Bowl + Austrian
finals — each with different teammates and a different calendar.

The model:

- `team_members` allows N rows per `user_id` (already supported).
- Each team owns its own `competition_events`.
- The athlete's calendar = union of events from all teams they're an
  active member of (`v_athlete_schedule`).

This eliminates the legacy `TEAM_{userId}` synthetic-team hack in
`games-core.js` and represents real-world multi-league play correctly.

---

## 3. Source-of-truth contracts

| Domain | Authority | Read shape |
|---|---|---|
| Competitions registry | `public.competitions` | `competitions_select` policy: any authenticated user |
| Competition events | `public.competition_events` | RLS: active member of `team_id` |
| Athlete schedule (athlete view) | `public.v_athlete_schedule` | Union view, no separate RLS |
| Today's prescription | `prescribeFor()` (pure) | See `docs/PRESCRIPTION_SPEC.md` |
| ACWR | `acwr.service.ts` (client) and existing server fns | Unchanged |
| Readiness | `calc-readiness.js` (server) | Now reads game proximity from spine |

The spec doc (`PRESCRIPTION_SPEC.md`) is the contract. The TS implementation
plus its 30-test regression suite is the parity check. Future ports must
match both.

---

## 4. Files to know

```
database/migrations/20260508120000_competition_schedule_spine.sql
database/seeds/sample_2026_spring_schedule.sql
scripts/setup-schedule-spine.sh           # one-shot apply + seed + smoke test

netlify/functions/schedule.js              # GET /api/schedule
netlify/functions/calc-readiness.js        # spine-aware game proximity

angular/src/app/core/models/
  schedule.models.ts
  prescription.models.ts

angular/src/app/core/services/
  schedule.service.ts
  periodization.service.ts                 # prescribeFor() — pure + spec'd
  periodization.service.spec.ts            # 30 regression cases

angular/src/app/features/today/components/
  today-schedule-banner.component.ts       # phase + next event
  today-prescription-card.component.ts     # do this, this hard, why
```

---

## 5. What the daily flow looks like

For 2026-05-08 (today, the night before Slovenian Cup):

1. Login → `ScheduleService` auto-loads `/api/schedule` for the athlete.
2. Snapshot resolves:
   - `currentPhase` = `taper` (1 day to high-importance event)
   - `nextEvent` = Slovenian Cup, 4 games tomorrow
   - `density14d` = 11 games (heavy)
3. `PeriodizationService.today()` resolves to:
   - intent: `taper-prime` (≤ 24h rule)
   - RPE 4, 25 minutes, 4 sprint reps
   - reasoning: "Game inside 24 hours. Stay loose and primed — no new fatigue."
   - nutrition: 7g/kg carbs (+heavy density bump on water)
4. `today.component` renders the banner + card. No clicks needed.
5. Athlete's microcycle, tournament-nutrition, goal-planner, and readiness
   API all derive from the same snapshot — no inconsistency possible.

---

## 6. Active drift (still to fix)

Tracked in approximate priority order; this list shrinks as items move into
the spine:

1. `tournaments` / `games` / `fixtures` legacy tables — still receive
   writes. Until federation calendar import lands, they coexist with the
   spine for write paths.
2. `flag-football-periodization.service.ts` — encyclopedia for the
   `/training/periodization` page; not redundant with `prescribeFor`, just
   a different role. Not load-bearing.
3. `flag-football-performance-system.service.ts` — wired into
   `training-plan.buildRecommendation`. Replace once the goal-based planner
   is migrated to `PeriodizationService`.
4. `tournament-nutrition` schedule editor — still allows manual entry;
   spine seeds when a canonical event covers today.
5. Hydration logging in `tournament-nutrition` is in-memory + side-store;
   needs `athlete_hydration_logs` table when push notifications go live.
6. Three readiness models (server `calc-readiness`, client `load-monitoring`,
   client `readiness.service`) — server is canonical now; clients should
   become read-through.

---

## 7. What got removed

- `features/elite-command-center/` — 1,447 lines of hardcoded fixture data
  posing as a feature. Route redirects to `/coach/dashboard` for legacy
  bookmarks.
- `microcycle-planner` hand-rolled day-plan logic — 132 lines replaced by
  a 30-line adapter from `DailyPrescription`.

---

## 8. Conventions for new work

- **Read from the spine, never re-derive** "next event" or "game density"
  inside a feature component.
- New cross-feature concepts get a `core/services/*.service.ts` exposing
  signal-based reads, not Observables. Use `firstValueFrom` only when
  bridging to existing Observable code.
- Pure algorithms live as exported functions colocated with the service
  (`prescribeFor`, `resolvePhase`, `densityFor`). They take plain data
  inputs and have no Angular DI dependency.
- Every pure algorithm gets a regression spec (vitest, `.spec.ts`) and a
  spec doc under `docs/`. The two together are the contract.
- Components stay under 300 lines. If you're past that, it's a facade +
  presentational split, not a refactor request.

---

## 9. References

- `docs/PRESCRIPTION_SPEC.md` — daily prescription contract
- `docs/CALCULATION_SPEC.md` — legacy calc spec, partially superseded
- `docs/SINGLE_SOURCE_OF_TRUTH.md` — domain authority map
- `docs/ARCHITECTURE.md` — v4 architecture; still authoritative for
  surfaces not yet migrated
