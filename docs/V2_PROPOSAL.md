# FlagFit Pro V2 — Codebase Audit & Product Proposal

**Status:** proposal / roadmap (living document — not a one-off drift audit; drift tracking stays in `SOURCE_OF_TRUTH.md` §6).
**Audited:** 2026-07-02, against `main` (`8d6604e`).
**Scope requested:** UI/UX, functionality, calculations, knowledge base, training variety, periodization, travel & recovery time, gels & supplements between games, warming up — anchored on the real tournament-day scenario: *Capital Bowl, day 1, games at 11:00, 12:30, 15:30 and 17:00.*

---

## 1. Executive summary

V1 is in unusually good shape for a first version: a server-canonical readiness/ACWR/prescription engine, a disciplined data model (187 tables, documented ledger), spec laws that prevent data fabrication, and a clean Angular 21 signals frontend. The engineering hygiene (SOURCE_OF_TRUTH, generated docs, schema-drift CI) is a real asset — V2 should build on it, not around it.

**The single biggest product gap, and the organizing idea for V2:** the app knows a tournament day only as a *count* (`expected_game_count = 4`). It does not know **when** the games are. Everything the athlete actually needs on the day — when to warm up again, what to eat in a 90-minute gap vs. a 3-hour gap, when the caffeine goes in, when to get off their feet — is a function of the **kickoff times and the gaps between them**. V2's flagship is **Tournament Mode**: per-game schedules and a generated, minute-by-minute day plan.

Everything else in this proposal (warm-up engine, between-game fueling, travel, periodization, coach console) either feeds that timeline or benefits from it.

---

## 2. V1 audit — what exists today

### 2.1 Architecture (healthy — keep)

| Area | State |
|---|---|
| Frontend | Angular 21, standalone + zoneless + signals, OnPush, no UI-kit dependency. Feature screens as direct children of `app/`. Clean. |
| Backend | 113 Netlify functions (111 exercised), ESM, shared service-role client, `/api/*` redirects. |
| Database | Supabase Postgres, 187 tables, RLS throughout, single reconciled migration tracker. |
| Engine | Server-canonical (Spec Law 6): readiness `calc-readiness.js`, ACWR `utils/acwr.js` (21-day uncoupled EWMA), intent engine `periodization.service.ts` (1,622 lines) composed with exercise realization `daily-protocol.js`. |
| Docs/CI | `SOURCE_OF_TRUTH.md` + generated DATA_MODEL/ENDPOINTS, schema-drift CI at baseline 0, 94/94 periodization spec tests. |

### 2.2 What the engine already gets right (calculations)

- **ACWR:** EWMA, uncoupled 21-day chronic, load-less sessions excluded (not zero-counted), client mirrors server. Danger-zone → forced rest.
- **Tournament congestion:** `peakDayGameCount` uses a conservative worst-day estimate; ≥3 games/day trips heavy-density de-load regardless of the 14-day total.
- **Per-game load estimate:** past games inject ~350 AU/game into the acute window (MAX(logged, estimate), no double-count) so a tournament weekend never reads falsely safe.
- **Taper:** centralized `TAPER_CONFIG` — 24 h taper-prime, final-third lightening, glycogen top-up only on the final day.
- **Personalization:** age-banded CNS recovery (48/60/72 h), position emphasis (additive prehab), injury-region restriction with fail-safe unknown regions, season phases incl. peak/postseason and split seasons.
- **Nutrition:** carbs periodized 4.5–7 g/kg by intent; heat adds fluid; heavy density elevates carbs.
- **Travel:** `daily_wellness_checkin.travel_hours` → bounded subtract-only readiness penalty (−2/−4/−8).

### 2.3 Gameday feature today (`gameday.component.ts` + `TOURNAMENT_DAY` config)

What exists: a go-time card, heat guard, hydration quick-log, a fueling split derived as fixed percentages of the **daily** macro target (30% before / 12% between / 30%+protein after), and a static re-warm-up note ("a 6-game day means 6 warm-ups, not one") shown when `expectedGameCount > 1`, plus a late-game hamstring warning string.

**The gap:** all of it is day-granular. With games at 11:00 / 12:30 / 15:30 / 17:00 the athlete faces three very different gaps — **~50 min effective** (after a ~40-min game 1), **~2 h 20 min**, **~50 min** — and V1 gives the same "12% of daily carbs between games" for each and one undifferentiated warm-up note for all four games. There is no timeline, no notification, no per-game logging.

### 2.4 Dormant assets worth harvesting in V2 (build on, don't rebuild)

| Asset | State | V2 use |
|---|---|---|
| `qb-throwing.js` (424 lines, `throw_au`/`throw_count`) | ORPHANED — zero UI callers | Wire a throw-count logger → arm-load gating (the engine hook already exists) |
| `prescription_templates`, `readiness_gates`, `taper_rules`, `contraindication_rules`, `weather_substitution_rules` tables | Live, schema-only | Coach-tunable engine config UI (§8) |
| `team_activities` + resolver | Schema + read path, no writer/UI | Coach calendar overrides (practice/session pushed to the team) |
| `team_season_phases` table | Live (DRIFT), unbuilt | Season plan builder backbone (§8) |
| `event_participation` + multi-day load distribution RPC | LIVE | Extend to **per-game** actuals (§3.4) |
| `calibration_logs` | Live | Close the loop on tunables (350 AU/game, carb g/kg, travel penalty) |
| Program cycles / seasons / depth chart / scouting lanes | PLANNED (guarded 404s) | Periodization V2 + coach console candidates |

---

## 3. V2 flagship: Tournament Mode (per-game timeline)

### 3.1 Data model — games become first-class

```
event_games
  id uuid PK
  event_id uuid FK → competition_events (and athlete_events via source enum)
  game_number int          -- 1..n within the event day
  game_date date           -- multi-day tournaments
  kickoff_time time        -- venue-local
  expected_duration_min int DEFAULT 40   -- 2×20 min flag halves + admin
  opponent text NULL
  field text NULL          -- "Field 2" — venues run parallel fields
  bracket_stage text NULL  -- group / QF / SF / F (drives caffeine + taper-of-the-day)
  status enum(scheduled, in_progress, final, cancelled)
  result jsonb NULL
```

Coach enters the schedule once on the team event (bulk paste: `11:00, 12:30, 15:30, 17:00`); every rostered athlete inherits it. Athlete-entered events get the same child rows. `expected_game_count` becomes a derived/legacy fallback, kept for events without per-game data — **the engine must degrade gracefully to V1 behavior when kickoff times are absent** (Spec Law 6: no fabricated times).

Bracket reality: game 3 and 4 times are often "if we win, ~15:30". Support `is_provisional bool` + quick re-time on the day (one tap moves a game ±15/30 min and regenerates the plan).

### 3.2 The generated day plan — worked example

Input: bodyweight 80 kg, games 11:00 / 12:30 / 15:30 / 17:00, ~40 min each, warm day.

| Time | Block | Engine reasoning |
|---|---|---|
| 07:30 | Wake / hydrate 500 ml + electrolytes | ≥3 h before G1 |
| 08:00 | **Breakfast** ~2 g/kg carbs, low fat/fiber | finish ≥2.5 h pre-kickoff |
| 09:45 | Arrive, kit check | from event `arrival_buffer` |
| 10:20 | **Full warm-up A (20–25 min)** — RAMP | game 1 gets the full protocol |
| 10:55 | Caffeine already on board (3 mg/kg taken ~10:15) | once, before G1; §5 |
| **11:00** | **GAME 1** | |
| 11:45 | Post-game: 30 s log (min played, RPE, flags) + fluids | gap to G2 ≈ 45 min → **short gap protocol** |
| 11:50 | 30–40 g fast carbs (gel or sports drink + banana), stay warm, off feet 15 min | no solids beyond that; no full cooldown |
| 12:15 | **Re-prime warm-up B (8–10 min)** | |
| **12:30** | **GAME 2** | |
| 13:15 | Post-game log + begin **long gap protocol** (gap ≈ 2 h 15) | |
| 13:25 | **Real meal**: 1–1.5 g/kg carbs + 20–30 g protein, low fat/fiber; finish by 14:15 (≥75 min pre-G3) | |
| 14:15–14:45 | Off feet, shade, legs up; optional 10–15 min eyes-closed rest | |
| 15:00 | **Re-warm-up A′ (12–15 min)** — long gap = closer to full warm-up | body fully cooled after >90 min |
| **15:30** | **GAME 3** | |
| 16:10 | Short gap protocol again: 30–40 g fast carbs + fluids, stay moving | gap ≈ 50 min |
| 16:45 | **Re-prime B (8–10 min)** + late-game hamstring cue | last game on tired legs = highest hamstring window (existing `TOURNAMENT_DAY.lateGameWarning`, now placed *where it matters*) |
| **17:00** | **GAME 4** | |
| 17:45 | **Recovery block**: 1.2 g/kg carbs + 0.3 g/kg protein within 60 min; rehydrate 150% of mass lost; 10 min cooldown walk + mobility | day ends with tomorrow's readiness in mind |
| evening | Sleep priority card; next-day auto-set to recovery phase | already handled by phase engine |

Every row is computed from four inputs: kickoff times, expected duration, bodyweight, and weather. This is deterministic and testable — same style of spec tests as `periodization.service.spec.ts`.

### 3.3 Gap-classification algorithm (the core new calculation)

Effective gap = next kickoff − (previous kickoff + expected duration).

| Effective gap | Class | Fueling | Warm-up before next game |
|---|---|---|---|
| < 30 min | `turnaround` | fluids + optional half gel (~12 g) | stay warm — no re-warm-up needed, 3–4 accelerations |
| 30–75 min | `short` | 30–45 g fast carbs (gel / sports drink / ripe banana) + 400–600 ml fluid | re-prime 8–10 min starting T−15 |
| 75–150 min | `medium` | 1 g/kg light solid carbs + fluids, finish ≥60 min pre-kickoff | re-warm-up 10–12 min starting T−20 |
| > 150 min | `long` | real meal 1–1.5 g/kg + 20–30 g protein, finish ≥75 min pre-kickoff; top-up carbs T−45 if needed | near-full warm-up 12–15 min starting T−25 (body fully cooled) |

Heat modifier (existing `HEAT_CAUTION_C` threshold): +250–500 ml per gap, sodium 300–600 mg/h, shade/soak cues. Cold modifier: lengthen every re-warm-up +5 min, "stay layered" cue.

### 3.4 Per-game actuals close the loop

`event_participation` currently records day-level actuals and distributes multi-day load. Extend to per-game: a **30-second post-game log** (minutes played, RPE 0–10, body flags) writes one row per `event_games.id`. Benefits:

- ACWR uses real per-game load instead of the flat 350 AU estimate (keep the estimate as fallback; log a `calibration_logs` delta each time so the constant self-tunes).
- A red body flag after game 2 can **down-regulate the rest of the day plan** (skip the optional top-up sprint work in warm-ups, elevate the hamstring cue, suggest sub rotation to the coach) — same Merlin-loop law that already exists for wellness self-reports (Spec Law 5a).
- Position-aware load later: QB logs throws (wire the orphaned `qb-throwing.js` lane), everyone logs minutes.

---

## 4. Warm-up engine (from note → protocol)

V1 ships warm-up as a category in `daily-protocol.js` (25 min estimate) and a static string in `TOURNAMENT_DAY.note`. V2 makes warm-ups structured, versioned content the engine composes:

- **Template A — full pre-game (20–25 min), RAMP structure:** Raise (jog/skip/HR up) → Activate (glutes/hamstrings/calves — the flag injury zones already modeled in `athlete-injuries.js restrictionsFor`) → Mobilize (hips/ankles/t-spine) → Potentiate (accelerations, route breaks, 2–3 max-intent sprints).
- **Template B — re-prime (8–10 min):** skip Raise-long, keep Activate-short + Potentiate. For `short` gaps.
- **Template A′ — long-gap re-warm-up (12–15 min):** between B and A; body has fully cooled.
- **Position overlays** (reuse `positionFlagsFor` / `withPositionEmphasis`): QB adds band arm-care + progressive throwing ladder; WR/DB add reactive COD and back-pedal→turn; center adds snap reps.
- **Condition overlays:** cold +5 min Raise; wet-field cue (cutting caution); post-injury region gets its activation block doubled (existing injury precedence law applies).
- **Injury gate:** an active `athlete_injuries` restriction swaps Potentiate sprints per the existing restriction map — never a generic warm-up over a flagged hamstring.

Each template is exercise-realized through the existing COMPOSE path (`daily-protocol /generate` with a `warmup` intent), so content lives in the exercise library, not in code. Timeline placement (§3.2) tells the athlete **when to start**, which is the part players actually get wrong.

Also: **practice-day warm-ups** get the same treatment (Template A before team practice, currently implicit), and the knowledge base gets a "why re-warm-up" card surfaced contextually (§7).

---

## 5. Gels & supplements between games

### 5.1 In-day fueling products (new)

Add a small, evidence-graded product model the timeline can reference (athlete-facing language stays food-first per Spec Law 3 — "1 gel or ~500 ml sports drink or a large ripe banana ≈ 25–30 g fast carbs"):

```
fueling_products (reference data, coach-extendable)
  kind: gel | chew | sports_drink | electrolyte | real_food
  carbs_g, sodium_mg, caffeine_mg, fluid_ml, notes
```

Rules encoded in the gap engine (§3.3): target ~30–60 g/h fast carbs across game hours; cap ~90 g/h (glucose+fructose) on extreme days; nothing high-fat/fiber inside 75 min of kickoff; train-the-gut note in the KB (first tournament is not the day to try a new gel — rehearse the plan at practice; the taper-week plan should schedule one rehearsal).

### 5.2 Supplement timing (upgrade `supplements/`)

V1 has daily creatine/caffeine/beta-alanine toggles with adherence. V2 adds **timing intelligence** tied to the schedule:

- **Caffeine:** 3 mg/kg ~45–60 min before game 1 **or** deliberately held for the highest-stakes game (`bracket_stage` drives the suggestion); optional 1–2 mg/kg top-up before a late knockout game **with a sleep cut-off guard** (no top-up if the last game ends < 8 h before target bedtime — sleep is tomorrow's readiness). Per-athlete sensitivity flag.
- **Creatine:** timing-agnostic — keep the daily toggle, add a "take it post-day with the recovery meal on tournament days" nudge.
- **Beta-alanine / others:** chronic dosing notes only; no acute-day claims (evidence-graded per existing KB standards).
- **Electrolytes:** promoted from a KB mention to a timeline item on hot days (weather guard already computes the trigger).
- **Pack list generator:** the evening-before checklist (§9) computes quantities from the schedule — 4 games → *"3–4 gels or equivalents, 2×750 ml bottles + electrolyte tabs, lunch that travels (rice + chicken), recovery shake for 17:45"*.

All of it stays advisory and adult-athlete-scoped (existing adult-male-16+ KB constraint; keep the medical-disclaimer framing the KB already uses).

---

## 6. Travel & recovery time

### 6.1 Travel (from self-report → plan)

V1: athlete reports `travel_hours` after the fact; readiness takes a bounded penalty. V2 attaches **travel legs to the event** so the plan is proactive:

```
event_travel  (child of competition_events / athlete_events)
  mode: bus | car | plane | train
  depart_at, arrive_at, timezone_delta_h, overnight_stay bool
```

- **Pre-travel card (day before):** hydration loading, pack list, sleep target, "board with a bottle".
- **In-transit:** every 60–90 min bus/plane micro-mobility (hips/hamstrings/ankles — 3 moves, doable in an aisle), hydration cadence, compression option (equipment-gated via existing `available_equipment`).
- **Arrival-day rule:** travel ≥3 h same-day → arrival session capped at activation intent (no new fatigue); the existing readiness penalty stays as the *reactive* backstop but the *plan* now anticipates it.
- **Timezone Δ ≥ 2 h:** simple jet-lag protocol (light exposure timing, meal anchoring, melatonin KB entry — advisory) for internationals/Euro tournaments.
- **Return leg:** the post-tournament recovery day (already auto-set by the phase engine) gains a "you also sat on a bus for 5 h" mobility block.

Wellness `travel_hours` prefills from the declared legs (editable, never fabricated — Spec Law 7).

### 6.2 Recovery time (formalize what's implicit)

- **Between games:** owned by the gap engine (§3.3) — off-feet minutes, shade, optional eyes-closed rest in long gaps.
- **Same-evening:** recovery block after the last game (fuel + cooldown + sleep card) as the timeline's final row; recovery-modality suggestions reuse the existing equipment-gated `recovery.service` triggers (boots after high-load days — a 4-game day qualifies).
- **After the tournament:** the engine already inserts a recovery phase; V2 sizes it — **48 h minimum, 72 h for 40+ or ≥6 games/weekend** (constants already exist in `cnsRecoveryHoursForAge`; connect them) — and schedules the regeneration content (mobility, easy aerobic, sleep emphasis) instead of just labeling the day "recovery".
- **Readiness gate to resume:** first quality session after a tournament requires readiness above threshold (the live-but-unbuilt `readiness_gates` table is exactly this — build its UI/wiring instead of a new mechanism).

---

## 7. Knowledge base V2

104 evidence-graded entries exist with search. Three upgrades:

1. **Contextual surfacing (highest value):** KB cards attached to engine outputs — the timeline's re-warm-up row links "why re-warming matters"; the caffeine row links the dosing entry; a hamstring flag links the hamstring guide. One `knowledge_context_tags` join (entry ↔ engine concept) turns a passive library into just-in-time coaching. Rule: max 1 card per screen, dismissible, never blocking the answer-first layout (Spec Law 4).
2. **Tournament playbook pack:** ~10 new entries — multi-game fueling, gut training, between-game recovery, re-warm-up evidence, caffeine strategy for brackets, playing in heat/cold/rain, travel & jet lag, post-tournament regeneration, sleep after late finals, pack list rationale.
3. **Localization (sl-SI):** the team is Slovenian — KB content and the timeline strings are the two places translation pays off most. Schema: `language` column + fallback to `en`. (Full app i18n can follow in V2.1; start where athletes read paragraphs, not buttons.)

Keep the existing evidence-grade / merlin-approval pipeline and the secrets/validation scripts — they're good.

---

## 8. Periodization V2 (from reactive to planned)

V1 periodizes **around events** (taper windows, competition/recovery phases, season macro-phases, ACWR safety) — genuinely good, but there is no *plan object*: no coach-facing season builder, no mesocycles, and `program_cycles` is a guarded 404.

- **Season plan builder (coach):** coach enters the season's tournaments/matchdays once (the schedule spine already exists) + season windows (the live `team_season_phases` table is the backbone — currently DRIFT/unbuilt). The engine **back-fills the mesocycle skeleton by reverse periodization from the priority tournaments**: accumulation → intensification → taper into each A-event, deload after, maintenance between clustered events. Coach sees and can drag the phase boundaries; athletes' `decideBasePrescription` reads the resulting phase instead of inferring only from event proximity.
- **Mesocycle loading:** 3:1 load:deload as the default wave inside accumulation blocks; the existing ACWR guard becomes the *enforcer* of the plan rather than the only shaper.
- **Event priority (A/B/C):** Capital Bowl = A (full taper + peak); a friendly = C (train through it). One column on events; the taper engine branches on it. This is the single highest-leverage periodization change for a tournament-based season.
- **Individual weak-point blocks:** athlete goal (speed / conditioning / robustness) biases the realized sessions inside team constraints — reuse `BUILD_TARGET_OVERRIDES` machinery.
- **Coach-tunable engine constants:** surface the documented tunables (350 AU/game, carb g/kg table, congestion thresholds, travel penalties, taper windows) in a staff settings screen writing to the live `prescription_templates`/`taper_rules` tables, with `calibration_logs` showing estimate-vs-actual so tuning is informed. Guardrails: coach can tighten, only warn-and-log when loosening past evidence bounds.
- **"Why today" transparency:** athlete Today screen gets a one-tap "this week in the plan" strip (phase, days to next event, this week's wave) — the reasoning strings exist; give them a macro context.

---

## 9. Different trainings (session library breadth)

The COMPOSE path (intent → realized blocks) is the right architecture; V2 widens the intent/content catalogue:

- **Flag-specific speed/agility day:** acceleration, max velocity, curved runs, route-break COD, back-pedal→sprint (DB), reactive agility. Distinct from generic "sprint".
- **Tempo/conditioning day:** extensive tempo runs sized to flag work:rest ratios — builds the engine for 4-game days without ACWR spikes.
- **Plyometric progression:** the KB already documents isometrics→plyos; make it a session progression (extensive hops → intensive bounds) gated by training age + current phase.
- **Team-practice designer (coach):** coach composes practice from blocks (warm-up, install, 7v7, conditioning) and pushes via the dormant `team_activities` lane; athletes' day resolves it through the existing `PRACTICE_PHASE_MODIFIERS`.
- **QB arm-care lane:** wire the orphaned `qb-throwing.js` — throw-count quick-log on practice/game days, weekly arm-load trend, dosing gate (the `QB_THROW_ADAPTATION` config exists and waits for data).
- **Home / hotel / no-equipment variants:** realization already equipment-gates recovery; extend to sessions ("hotel-room activation" the morning of an away tournament — pairs with §6 travel).
- **Micro-dosing days:** 15–20 min quality options for congested weeks, so "no time" ≠ "skipped".

---

## 10. Calculation upgrades (beyond the gap engine)

1. **Per-game internal load from actuals** (§3.4) replacing the flat estimate, with calibration logging.
2. **Monotony & strain (Foster):** weekly load/SD and load×monotony next to ACWR — catches the "same moderate load every day" trap ACWR misses. Cheap: same `training_sessions` data.
3. **Readiness-modulated prescription is subtractive today — keep it** (safe direction), but add a small *positive* branch: sustained high readiness + under-plan chronic load → nudge volume up within phase caps (currently the engine only ever pulls down, which undertrains high responders).
4. **Sleep debt integration:** `sleep-debt/` feature exists; feed cumulative debt into the tournament-eve card ("bank sleep — two nights ≥8 h before Capital Bowl") rather than only same-day readiness.
5. **Hydration math on the day:** pre/post weigh-in option on tournament days → true sweat-rate per athlete (stored, reused for future heat plans); otherwise keep the ml/kg heuristic.
6. **Uncertainty honesty (extends Spec Law 6/7):** every derived number on the timeline carries its basis — "estimated (no per-game log yet)" vs "from your logged 38 min" — in the small print, so trust survives wrong estimates.

---

## 11. UI/UX V2

### 11.1 Tournament Mode UI (the flagship screen)

- On a multi-game day, **Today *becomes* the timeline** (answer-first law): a vertical now-line with the next action pinned at top as a big card — *"Re-prime warm-up · starts in 12 min · 8 min routine"* — with a single primary CTA. Everything else scrolls below.
- **Between-game quick-log:** one thumb-reach card, 30 seconds, sliders prefilled per the non-destructive-form law (Spec Law 5b).
- **Sideline-glanceable:** huge type for countdowns, high-contrast (the WCAG AA work is done), one-hand reach, works in sunlight (existing dark default + a high-contrast outdoor toggle).
- **Notifications tied to kickoffs:** T−40 "start warm-up", T−15 "re-prime", post-final "log + recovery meal". Local scheduling (push infra exists in `push.js`) — computed on-device from the timeline so it works offline.
- **Offline-first at venues (critical):** sports halls and tournament venues have terrible connectivity. The PWA (`sw.js`) exists; V2 adds an **offline outbound queue** (hydration logs, game logs, wellness) with visible sync state, and pre-caches the full day plan + warm-up content the evening before. This is a P0 for Tournament Mode to be trusted.
- **Evening-before checklist:** pack list (from §5.2), carb-load status, sleep target, travel departure (from §6.1), kit. One screen, checkboxes persist.

### 11.2 Coach tournament console

- **Day board:** the team's game timeline × roster readiness heat-strip (consent-gated readiness already solved in `coach-core`), between-game body flags rolling in live (realtime infra exists).
- **Rotation hint:** minutes-played per athlete per game accumulate → flag who's trending to overexposure by game 4 (advisory only, coach decides).
- **One-tap re-time:** bracket slipped 30 min → coach drags game 3; every athlete's timeline and notifications recompute.

### 11.3 General UX debt worth paying in V2

- **Today "why" strip** (§8) — plan context in one line.
- **Consolidate the More/Settings sprawl** as features grow — group by "Me / My team / App".
- **Empty states as onboarding:** each empty screen says what will appear and which action feeds it (extends Spec Law 5's value-first onboarding).
- **sl-SI localization** for KB + timeline strings first (§7).

---

## 12. Schema change summary

| Change | Kind | Referenced in |
|---|---|---|
| `event_games` (+ `is_provisional`, `bracket_stage`) | new table | §3.1 |
| `event_participation` per-game rows (`game_id` FK, minutes, rpe, flags) | extend | §3.4 |
| `event_travel` | new table | §6.1 |
| `events.priority` (A/B/C) | column | §8 |
| `fueling_products` + athlete tolerances | new reference table | §5.1 |
| `knowledge_context_tags` + `knowledge_base_entries.language` | extend | §7 |
| Warm-up templates as protocol content (`block_type='warm_up'` variants) | content, existing tables | §4 |
| Build UI/wiring for existing `team_season_phases`, `readiness_gates`, `taper_rules`, `prescription_templates`, `team_activities` | no new schema | §6.2, §8, §9 |

Per repo law: each lands with its migration, regenerated docs, and a Feature Status Ledger row in the same PR.

---

## 13. Suggested roadmap

**V2.0 — Tournament Mode core (the Capital Bowl release):**
`event_games` + coach bulk entry → gap engine + generated timeline → warm-up templates A/B/A′ → between-game fueling + pack list → per-game quick-log feeding ACWR → offline queue + kickoff notifications.

**V2.1 — Plan & travel:**
Season plan builder on `team_season_phases` + event A/B/C priority → travel legs + arrival-day capping → post-tournament sized recovery + readiness gate → supplement timing (caffeine strategy) → KB tournament pack + contextual cards + sl-SI.

**V2.2 — Breadth & calibration:**
Coach tournament console + rotation hints → session library breadth (speed/agility, tempo, plyo progression, hotel variants) → QB arm-care wiring → monotony/strain, sweat-rate, calibration dashboards → coach-tunable constants UI.

Ordering rationale: V2.0 is entirely athlete-facing value on the exact pain the team feels at every tournament, needs one new table, and reuses the existing engine laws. V2.1 turns the app from reactive to planned. V2.2 scales it to the staff side and closes the data loops.
