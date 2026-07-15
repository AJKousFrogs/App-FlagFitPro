# FlagFit Pro — Calculations & Constants Reference

**Purpose.** The *formulas, constants, and thresholds* of the app — the "what
the numbers are," as opposed to the "what happens when." Its sibling
`LOGIC.md` owns decision rules/control flow; `SOURCE_OF_TRUTH.md` owns
schema/endpoints/status.

**How to trust this file.** Written FROM the code (files named per section).
When it disagrees with the code, the **code wins** — fix this file in the same
pass. Where a stale in-code *comment* disagrees with the code's constants and
tests, the constants+tests win (one such case is flagged in §9). As of
**2026-07-14**.

> **Planned mechanization (v3 M0, see `docs/v3/V3-DESIGN.md` §2):** the
> constants tables below are to be generated from a single safety-config module
> via `npm run docs:regen`, with a CI freshness test. Until then this file is
> hand-synced — treat every number here as a claim to verify against the named
> source file.

Canonical owners at a glance:

| Family | Owner (single source) | Consumers |
|---|---|---|
| Session load (AU) | `netlify/functions/utils/acwr.js` `computeSessionLoad` | ACWR, readiness, daily-load calendar |
| ACWR | `utils/acwr.js` `computeAcwrAt` + `ACWR_RISK_ZONES` | `compute-acwr.js`, `calc-readiness.js`, client `acwr.service` (display mirror) |
| Readiness | `netlify/functions/calc-readiness.js` → `readiness_scores` | engine input, Today, staff lanes |
| Wellness score | `netlify/functions/utils/readiness-score.js` | `calc-readiness.js`, `wellness-checkin.js` |
| Prescription / guards | `angular/src/app/core/services/periodization-engine.ts` (generated server port `netlify/functions/utils/periodization-engine.js`, byte-identical — parity-tested) | Today, This Week, COMPOSE, server endpoint |
| ACWR bands / population presets | `angular/src/app/core/config/evidence-presets.ts` (drift-guarded against server `ACWR_RISK_ZONES` by `tests/unit/acwr-config-drift.test.js`) | engine constants, client classification |

---

## 1. Session load (session-RPE, arbitrary units)

`computeSessionLoad(session)` — `utils/acwr.js`, THE single definition:

```
load = workload                     if stored workload is finite and > 0
     = rpe × duration_minutes       else, if both rpe > 0 and minutes > 0
     = 0                            otherwise  (load is never fabricated)
```

Rounded to 2 decimals. Daily load = sum of session loads by `session_date`
(`buildLoadsByDay`, `calc-readiness.js`).

**Estimated game loads** (folded into the ACWR load map for PAST games so a
tournament week doesn't read falsely safe — `estimateGameLoads`,
`calc-readiness.js`): per-game AU by game format, mirroring `GAME_FORMATS` in
`core/config/position-volume.config.ts` (keep in sync):

| Format | AU per game |
|---|---|
| `domestic_2x12_stop` | 300 |
| `running_2x15` | 350 |
| `ifaf_2x20` | 450 |

Fallback when format is missing: competition level `international` → 450,
`national`/`club` → 300, unknown → **450** (heaviest — a game is never
UNDER-counted). A multi-day event's total (games × per-game AU) is spread
evenly across its calendar days inside the window; only events with a positive
`expected_game_count` count.

---

## 2. ACWR (acute:chronic workload ratio)

`computeAcwrAt(dailyLoads, date)` — `utils/acwr.js`. Method: **EWMA, uncoupled
windows** (Williams 2017; Lolli 2017; Impellizzeri 2020 caution: one input to
readiness, never a sole gate).

```
acute   = EWMA over the last 7 days,            λ = 2/(7+1)  = 0.25
chronic = EWMA over the 21 days BEFORE those 7, λ = 2/(21+1) ≈ 0.0909
          (uncoupled: windows never overlap)
chronic = max(chronic, 50 AU)                   (floor — layoff-return guard)
ACWR    = acute / chronic                       (3-decimal precision)
```

EWMA recurrence over a zero-filled, contiguous daily series (oldest→newest):
`v ← λ·load + (1−λ)·v`, seeded with the oldest day.

**Graded confidence** (2026-07-14, audit C2 — the binary 14-day flag was
permanently "low" for a 2-3×/week amateur): `confidence` = **high** ≥ 14
non-zero-load days in the 28-day span · **medium** 8–13 · **low** < 8. Low
confidence → ACWR is displayed with its grade but EXCLUDED from readiness
scoring (weight redistributes as for a null ACWR). `lowConfidence` (boolean,
< 14) is kept for back-compat.

**Return-to-training state** (2026-07-14, audit C3): raw chronic EWMA
(pre-floor) < **50 AU** (`minChronicForRatio` — the point where the divisor
becomes the artificial floor, not data) → `state: "building_base"` and
**acwr is null by design** (one 300 AU return session used to read ACWR ≈ 6 →
"Critical, rest"; the honest message is a re-entry ramp, ≤ 10–15%/week). The
audit proposed ~150, rejected: a steady 2-3×/week amateur holds a chronic EWMA
of ~100–150 and would be misclassified.

**Zones** (`ACWR_RISK_ZONES` — **advisory bands, not risk facts**; boundary
inclusivity as implemented in `classifyAcwrZone`). The former per-zone injury
"risk multipliers" (1.2×/1.5×/2.0×/4.2×) were **retired 2026-07-14** (audit
§1.1): the only cluster-RCT of ACWR-guided load management found no effect
(Dalen-Lorentsen 2021 BJSM, PMID 33036995, verified on PubMed), and the
association itself is analysis-dependent. `injuryRiskMultiplier` API fields
now return null.

| Zone | Range | Action |
|---|---|---|
| Detraining | < 0.8 | increase_load |
| Safe | 0.8 – 1.3 (incl.) | maintain |
| Caution | > 1.3 – 1.5 (incl.) | reduce_slightly |
| Danger | > 1.5 – < 1.8 | reduce_significantly |
| Critical | ≥ 1.8 | rest |

**Population presets** (`evidence-presets.ts` — currently only the adult preset
is ever active; youth/RTP are orphaned pending v3 M0 wiring, see SOT §5a):

| Preset | sweetSpotLow | sweetSpotHigh | dangerHigh |
|---|---|---|---|
| `adult_flag_competitive_v1` (default/unknown age) | 0.8 | 1.3 | 1.5 |
| `youth_flag_v1` (age < 18) | 0.8 | 1.2 | 1.4 |
| `masters_flag_v1` (age ≥ 35, heuristic tier — 2026-07-14) | 0.8 | 1.2 | 1.4 |
| `return_to_play_v1` (active RTP protocol) | 0.7 | 1.1 | 1.3 |

Assignment is **derived** (`derivePresetId(ageYears, hasActiveRtp)`, audit
§4.1 — no longer orphaned): RTP > youth > masters > adult; unknown age →
adult (the server baseline). Manual override available, wins until cleared.
**Server mirror (batch 4):** `utils/cohort.js` (`deriveCohortPresetId` +
`COHORT_ACWR_THRESHOLDS`) — byte-equality with the client presets is
CI-enforced (`acwr-config-drift.test.js`). `classifyAcwrZone(acwr,
thresholds?)` accepts cohort bands; omitted → adult (display lanes).

Safe-direction rule (LOGIC §10): the client may classify STRICTER than the
server, never laxer.

The engine's `ACWR_UNDER / ACWR_ELEVATED / ACWR_DANGER` = the adult preset's
0.8 / 1.3 / 1.5 (single-sourced import, not a copy).

---

## 3. Readiness (0–100 composite)

`calc-readiness.js` → `readiness_scores`. Components, each scored 0–100 by
deduction from 100:

**Workload (ACWR-based)** — only when ACWR is known AND confidence ≥ medium
(§2; low-confidence/`building_base` redistribute like a null ACWR).
**Cohort-aware since 2026-07-14 (batch 4):** boundaries come from the
athlete's cohort bands (`utils/cohort.js`, drift-guarded against the client
presets); the top tier sits at `dangerHigh + 0.3` (mirrors the adult 1.5→1.8
gap). **Taper dampening** (audit §1.1, Wang 2020): within **168 h** of the
next game the `< sweetSpotLow` deduction and the low-side safety trigger are
suppressed — a taper's volume cut IS the plan; high-side deductions always
stand. The safety-trigger hook fires at `> dangerHigh` (cohort) on the high
side.

| Condition (cohort bands; adult shown) | Deduction |
|---|---|
| ACWR > dangerHigh + 0.3 (adult 1.8) | −40 |
| ACWR > dangerHigh (adult 1.5; youth/masters 1.4; RTP 1.3) | −30 |
| ACWR > sweetSpotHigh (adult 1.3; youth/masters 1.2; RTP 1.1) | −15 |
| ACWR < sweetSpotLow (adult/youth/masters 0.8; RTP 0.7) and > 168 h to next game | −10 |

**Wellness Index** — `calculateWellnessIndex` subscore (§4); fallback 60 when
the subscore is non-finite.

**Sleep** (deductions stack, quality on the 1–10 wellness scale):

| Condition | Deduction |
|---|---|
| sleep_quality ≤ 4 | −25 |
| sleep_quality ≤ 6 (and > 4) | −15 |
| sleep_hours < 6 | −10 |
| sleep_hours < 7 (and ≥ 6) | −5 |

**Game proximity** (next fixture):

| Hours to kickoff | Deduction |
|---|---|
| ≤ 24 | −25 |
| ≤ 48 | −15 |
| ≤ 72 | −5 |

**Weights** (re-weighted 2026-07-14, audit §1.1 — the ACWR causal evidence
weakened while wellness/sleep monitoring evidence held): workload **0.25**
(was 0.35), wellness **0.35** (was 0.30), sleep **0.25** (was 0.20), proximity
**0.15**. Mirrored in `evidence-presets.ts`.

Weight redistribution — no fabricated components:
- **ACWR unknown** → workload weight 0, redistributed proportionally across the
  other three (a data-less athlete is never flattered by a phantom 100×0.35).
- **Reduced data mode** (§4 completeness < 60%) → sleep weight ×1.5, the other
  weights scaled down proportionally so the total stays 1 (sleep proxies
  broader wellness — Saw 2016).

**Penalties** (subtract from the weighted composite, then clamp 0–100, round):

- *Travel* (`travelReadinessPenalty`, same-day seated hours): 0 < h < 3 → −2 ·
  3 ≤ h < 6 → −4 · h ≥ 6 → −8. Only ever lowers.
- *Active injury* (statuses active/recovering/rehab; self-reports past their
  `expected_return_date` are skipped; grade normalized via the canonical
  `normalizeSeverity`): severe/Grade 3 → **−20 and the level is capped at
  "moderate"** (an injured athlete is never told "High — push"); moderate/
  Grade 2 → −10; minor/Grade 1 → −5. Highest applicable penalty wins (max, not
  sum).

**Cut-points** (starting points — teams should calibrate):

| Score | Level | Suggestion |
|---|---|---|
| > 75 (and not injury-capped) | high | push |
| 55 – 75 | moderate | maintain |
| < 55 | low | deload |

**Safety override hook:** fires on ACWR > 1.5 (any known ACWR — never
under-fires on the high side), or on ACWR < 0.8 when confidence ≥ medium AND
not within the 168 h taper window. Non-fatal if it errors.

**Data modes** (`determineDataMode`): wellness completeness ≥ **60%** → `full`;
below → `reduced` (sleep-proxy weighting above); no wellness row at all →
`unavailable` with `score: null` and an explicit log-wellness message (never a
fabricated score).

---

## 4. Wellness index (canonical wellness scoring)

`utils/readiness-score.js` — ONE weighting scheme shared by the readiness
composite (`calculateWellnessIndex`) and the check-in estimate
(`calculateWellnessScore`); unified 2026-07-08.

**Weights:** required — sleep **0.40**, soreness **0.30**, energy **0.30**;
optional — mood **0.50**, stress **0.50** (of the optional block).
**Blend:** required **60%** / optional **40%** when any optional field is
present (`WELLNESS_REQUIRED_BLEND = 0.6`).

`calculateWellnessIndex` (readiness path): raw 1–10 inputs are bucketed to 1–5
via `ceil(v/2)`, then normalized to 20–100 in 20-point steps —
higher-is-better fields (sleep quality, energy, mood): `20 + (v−1)·20`;
higher-is-worse fields (soreness, stress) inverted: `100 − (v−1)·20`.
**Completeness** = available fields / 5 × 100 (drives the §3 data mode).

`calculateWellnessScore` (check-in path): same weights/blend, but normalizes
raw values straight to 0–100 on an **explicit** scale (default 10 — the safe
direction; a 1–5 input misread as 0–10 reads over-conservative, never
over-optimistic), and requires sleep AND energy (else `null`, Law #7). The two
functions' normalization difference is intentional, not drift — see the header
comment in `readiness-score.js` before touching it.

---

## 5. Prescription base targets & fallbacks

`periodization-engine.ts`. Input fallbacks: readiness **70**
(`FALLBACK_READINESS`); a null ACWR fires no ACWR guard. **Bodyweight has NO
fallback since 2026-07-14** (audit C7, Law #7): the old 80 kg default
over-prescribed a 45 kg athlete's per-kg carbs/fluids by ~78%. Null bodyweight
→ `nutrition: null` → the UI shows an explicit "add your weight" state; the
rest of the prescription is unaffected.

`baseTargets(intent)` — the per-intent targets. **Since 2026-07-14, quality
sessions (sprint/strength/mixed) target 90 min TOTAL — the full realized
session including the ~25-min warm-up and the injury-prevention (DOP) block**
(coach directive), matching the realization layer's rest-inclusive block
estimates (§5.1):

| Intent | RPE | Minutes | Sprint reps | Strength sets |
|---|---|---|---|---|
| rest | 2 | 15 (daily mobility) | 0 | 0 |
| recovery | 3 | 30 | 0 | 0 |
| mobility | 4 | 45 | 0 | 0 |
| technical | 5 | 60 | 0 | 0 |
| sprint | 8 | **90** | 10 | 0 |
| strength | 7 | **90** | 0 | 18 |
| mixed | 6 | **90** | 6 | 8 |
| taper-prime | 4 | 25 | 4 | 0 |
| competition | — | 60 | 0 | 0 |
| travel | — | 0 | 0 | 0 |

`BUILD_TARGET_OVERRIDES` (build blocks — lighter intents run heavier):
mobility → RPE 6 / 75 min; technical → RPE 6 / **90** min (a build technical
day is a real session, not the in-season practice complement); rest stays
RPE 2 / 15. The season-shaped path uses `buildTargets` for **offseason** days
and `baseTargets` for in-season/peak/post; the generic accumulation path uses
`buildTargets` as before.

**Practice-day phase modifiers** (`PRACTICE_PHASE_MODIFIERS` — practice is the
session; the phase modifies it as data, not branches):

| Phase key | Intent | RPE | Minutes | Recovery emphasis | Nutrition bucket |
|---|---|---|---|---|---|
| accumulation | mixed | 7 | 90 | low | mixed |
| transition | mixed | 7 | 90 | low | mixed |
| taper | mixed | 7 | 60 | medium | mixed |
| taper_final (≤2 days out) | mixed | 7 | 45 | medium | taper-prime |
| recovery (post-tournament) | recovery | 3 | 30 | high | recovery |

Phases absent from the table (competition, travel) are the ones practice
yields to.

**Fixture-density flags** (feed guards and nutrition): `heavyDensity` = ≥ **10**
games in 14 days (`DENSITY_HEAVY_GAMES_14D`) OR ≥ **3** games on a single day
(`DENSITY_CONGESTED_DAY_GAMES`). `hotDay` = apparent temp ≥ **28 °C**
(`HEAT_CAUTION_C`, same threshold the weather guard's legacy caution uses).

### 5.1 Realized-session block duration estimate (2026-07-14)

`utils/daily-protocol-response.js` `createBlock`. Before 2026-07-14 the
estimate was pure work time (`sets × (duration|hold || reps × 4 s)`) with **no
rest**, so 17 working strength sets displayed as "~10 min".

- **Continuous blocks** (`morning_mobility`, `foam_roll`, `warm_up`,
  `cool_down`, `evening_recovery`, `evening_mobility`): item durations are the
  item's TOTAL time (the gym warm-up template sums to 1500 s = 25 min) — summed
  as-is, no rest added, no sets multiplication when an explicit duration exists.
- **Set-based blocks**: `Σ sets × (work + rest)` where work =
  `duration|hold || reps × 4 s` and rest = the row's persisted `rest_seconds`,
  else a per-block default:

| Block | Default rest (s) |
|---|---|
| isometrics | 45 |
| plyometrics | 90 |
| strength | 90 |
| conditioning | 60 |
| skill_drills | 30 |
| main_session | 60 |
| rehab_progression | 45 |
| (unknown set-based) | 60 |

Conditioning work bouts floor at **60 s** (`max(60, exercises.default_duration_seconds)`
— a gasser is not a 30-second item).

### 5.2 Strength double progression (2026-07-14, audit §3.3)

`utils/daily-protocol-progression.js` `progressPrescription(prev, baseReps)`,
driven by the athlete's own last completed `protocol_exercises.actual_*`
(21-day lookback, latest per exercise):

```
no history            → base reps, no note (nothing fabricated — Law #7)
below the rep ceiling → prev reps + 1 (never below base), load held
at the ceiling (12; hip work 15) → load × 1.025 (rounded to 0.5 kg), reps reset
                        to base; no logged load → "harder variation" note
```

Applied to the strength block's hip (base 10, max 15) and general (base 8,
max 12) exercises; the Nordic keeps its dedicated evidence protocol.

### 5.3 QB throwing monitor (2026-07-14, audit §5 — replaces the retired
interception-rate `QB_THROW_ADAPTATION`)

`QB_THROW_MONITOR`: weekly-volume spike flag at > **1.4×** week-over-week;
arm-feeling drop flag at **≥ 2** (before − after, last session). Youth
(< 18, derived cohort): ramp ≤ **1.2×**/week and ≥ **2** full no-throw
days/week. No pitch counts for adults — flag deletes the contact mechanism
that drives QB arm injury. Arm pain → clinician, not algorithm.

---

## 6. Day-level safety overrides & load modulation

Order inside `decideBasePrescription` (see LOGIC §1 for the full pipeline):
game day and ≤24h taper-prime are fixed commitments and come first; then:

- **ACWR danger:** ACWR > **1.5** (`ACWR_DANGER`) → full **rest** (RPE 2 /
  15 min mobility), recovery emphasis `critical`.
- **Readiness collapse:** readiness < **55** (`READINESS_LOW`) → **recovery**
  (RPE 3 / 30 min), emphasis `high`.

`modulateIntentForLoad(intent, acwr, heavyDensity, weeklyProgressionUnsafe)` —
applied to week-planned hints and DOW fallbacks alike:

```
acwr > 1.3 (ACWR_ELEVATED):  sprint|strength → mobility ;  mixed → technical
heavyDensity (non-rest):     strength → technical ;        mixed → mobility
weeklyProgressionUnsafe:     sprint|strength|mixed → technical
```

`weeklyProgressionUnsafe` comes from `AcwrService.weeklyProgression().isSafe`
(weekly load increase cap ~10–15%, Gabbett 2016) — passed as a boolean so the
engine stays pure.

---

## 7. Week-level passes (selection, rest minimum & second sessions)

`planWeekIntents` slot selection (2026-07-14): budget **max 5 active days**
(`5 − mandatoryCount`); up to **2 adjacent training pairs** per week
(`MAX_ADJACENT_TRAINING_PAIRS`), **never 3 consecutive training days**
(no bridging, no run-extension). Rationale: any 5 days in 7 contain ≥ 2
adjacencies (5 days across ≤ 3 runs), so the old blanket no-consecutive rule
made the 5-day budget unreachable without anchors — weeks silently became
4-on/3-off. Canonical anchor-less shape: **2-2-1**. Off-season rotation
(`phaseSessionModel.rotation`): **strength → technical → sprint → strength →
mixed**; a rotation intent that would place two high-CNS days (sprint/mixed)
back-to-back is deferred and `technical` fills the slot.

**Sprint-exposure floor** (2026-07-14, audit §3.2):
`SPRINT_EXPOSURE_FLOOR_DAYS = 7` — days without a high-speed exposure
(`isHighCnsSessionType` over a **14-day** session lookback, shared with CNS
spacing) before the week must plan one. Maintenance dose:
`SPRINT_FLOOR_MAINTENANCE_REPS = 5` builds, ≤ 60 min. Derivation rule (both
sides identical): sessions logged but none high-speed → **14** (floor fires);
zero logged sessions → **null** (no floor — no fabricated exposure).

**Mesocycle 3:1 wave** (2026-07-14, audit §3.1): `MESOCYCLE_VOLUME_FACTORS` =
week 1 ×1.00 · week 2 ×1.05 · week 3 ×1.10 · week 4 ×**0.65** (deload —
volume only, intensity/RPE held; PM doubles stripped). Applies to
sprint/strength/mixed/technical on free accumulation/transition days only.
Week index: `mesocycleWeekFor(season_calendar, date)` — weeks since the active
off-/pre-season window's start, mod 4; recurring "MM-DD" windows resolve their
cycle start (wrapping handled); non-build phases → null. Floors: minutes ≥ 15,
reps ≥ 2, sets ≥ 4.

`enforceWeeklyRestMinimum` — **≥ 2 full rest days per 7-day window**
(`MIN_REST = 2`), non-negotiable. Never demotes team-practice, competition,
rest, or recovery days. Demotion order (`DEMOTION_PRIORITY`, least disruptive
first): **taper-prime → mobility → technical → mixed → sprint → strength**.
A demoted day becomes rest at RPE 2 / 15 min with `secondSession: null`.

`addSecondSessions` — a PM session may attach **only** when ALL hold:

- season phase `preseason` or `offseason`;
- the day's intent is `strength` (AM), not a team-practice day, not already an
  override (null RPE);
- ≥ **2 days** from the nearest competition/taper/recovery day;
- fewer than **2** second sessions already added this week
  (`SECOND_SESSIONS_PER_WEEK_CAP` — weekly ceiling: 5 training days + 2
  doubles = **7 sessions**);
- **today only (day 0):** readiness ≥ **75** AND ACWR ≤ **1.2** (future days
  show as eligible without live gates — they re-gate when they become day 0).

PM shape: `sprint` after morning strength ("morning strength, evening
sprint") — but `technical` when a practice OR a planned high-CNS day
(sprint/mixed) sits tomorrow **or sat yesterday** (a 19:00 PM sprint must
never be ~14 h from another high-CNS session). PM RPE = `max(5, AM_RPE − 1)`;
minutes: sprint 40, technical 45; assumed ≥ 6 h gap.

> The 75 / 1.2 pair gates second sessions ONLY — day demotion uses §6's
> 1.5 / 55. (LOGIC.md conflated these before 2026-07-14.)

---

## 8. CNS recovery spacing

`applySprintRecoveryGuard` + `isHighCnsSessionType`.

- Window base **48 h** (`CNS_RECOVERY_HOURS`); age-scaled UP only
  (`cnsRecoveryHoursForAge`): < 35 → 48 h · 35–39 → 60 h · ≥ 40 → 72 h ·
  missing/implausible age (< 16) → 48 h.
- High-CNS **intents** needing spacing: `sprint`, `mixed`.
- High-CNS **session detection** (from `session_type`/`drill_type` + RPE):
  `/sprint|plyo|speed|max.?velocity|accel|agility|bound|competition/i` →
  always high-CNS; flag-drill patterns
  (`route(s)|post|fade|hook|evade|evasion|flag-pull`) → high-CNS when
  **RPE ≥ 6 or RPE unknown** (conservative — the guard never under-fires on
  missing data).
- Effect: a high-CNS intent within the window since the most recent high-CNS
  session downgrades to mobility + technique, recorded in
  `cnsRecoveryAdjustment`.

---

## 9. Weather & environment

### WBGT approximation (`approxWBGT` — ACSM simplified, shade estimate)

```
e    = (RH/100) · 6.105 · exp(17.27·Ta / (237.7 + Ta))    [vapour pressure, hPa]
WBGT ≈ 0.567·Ta + 0.393·e + 3.94
```

Humidity missing → `null` → the guard falls back to the apparent-temperature
path and the message says which metric it used (no fabricated humidity).

### Heat/cold/wind/rain thresholds (as implemented AND test-pinned)

2026-07-14 (audit C8, user-approved): the **stricter NATA/ACSM bands are now
implemented** — previously scale fired a band late (30.0) and relocate was
dead code (32.2 == stop). The former stale in-code comment now matches the
constants.

| Band (WBGT path) | Threshold | Action |
|---|---|---|
| Storm (WMO 95–99) | — | STOP → recovery (beats everything; coach override still warns) |
| Stop | WBGT ≥ **32.2** | STOP → recovery |
| Relocate | WBGT ≥ **30.0** | move indoors (mobility/skills) — no intense outdoor work |
| Scale | WBGT ≥ **27.8** | volume cut (strain-scaled, below), same intent |
| Caution | WBGT ≥ **25.7** | advisory only (hydration/breaks), session unchanged |

Legacy apparent-temp path (no humidity): caution **28** / scale **32** /
relocate **35** / stop **38** °C. Cold: caution ≤ **4** °C (warm-up advisory),
avoid ≤ **−5** °C → substitute mobility (OUTDOOR_INTENSE only). Wind ≥
**40 km/h** → advisory. Wet (precip ≥ **0.5 mm** or WMO ≥ 61 < 95) +
OUTDOOR_INTENSE → substitute indoor strength (taper-prime → mobility).

> ✅ **Resolved 2026-07-14:** the previously-stale NATA-style comment and the
> constants now agree — the stricter bands above are implemented (audit C8,
> user-approved), the relocate branch is live again, and the tests pin the new
> boundaries.

Guarded intent sets: `HEAT_GUARDED` = sprint, mixed, taper-prime, technical;
`OUTDOOR_INTENSE` (storm/wet/cold/wind) = sprint, mixed, taper-prime.

### Heat internal-load factor & scale-band volume cut

`heatLoadFactor` (feeds workload accounting): ≥ relocate/avoid threshold →
**1.2**; ≥ scale/reduce threshold → **1.1**; else 1.0.

Scale-band volume keep (`wbgtVolumeKeep` — WBGT path):

```
bandFrac       = clamp((WBGT − 27.8) / (30.0 − 27.8), 0, 1)
intensity      = 1.0 sprint · 0.9 mixed · 0.6 taper-prime/technical (default 0.6)
durationFactor = clamp(minutes / 45, 0.5, 2)
strain         = bandFrac × intensity × durationFactor
cut            = clamp(strain, 0.20, 0.50)      → keep = 1 − cut  (50–80%)
```

Legacy path keeps a flat **80%** (`HEAT_VOLUME_CUT = 0.8` is the KEEP
fraction).

### Acclimatization (V2.4)

While `acclimatizationDay` (days since arrival, from `athlete_travel_log`) is
0–13: every heat threshold shifts DOWN and every cold threshold UP by
`4 °C × (1 − day/14)` (`ACCLIMATIZATION_MAX_SHIFT_C = 4`,
`ACCLIMATIZATION_WINDOW_DAYS = 14`); zero from day 14.

### Cooler-hour time-shift (Phase 5b, advisory only)

Fires when the training-hour WBGT ≥ **30.0**; suggests the **earliest** later
hour the same day with: wait ≤ **6 h** (`TIMESHIFT_MAX_WAIT_HOURS`), hour ≤
**21:00** (`TIMESHIFT_LATEST_HOUR`), candidate WBGT < 30.0 (comfortable), and
≥ **1.5 °C** WBGT cooler (`TIMESHIFT_MIN_COOLER_WBGT`). No hourly data / no
qualifying hour → no suggestion. Never changes the prescribed load — only WHEN.

---

## 10. Injury & physio down-regulation (severity caps)

`applyInjuryGuard` + `INJURY_RESPONSE` (engine); grade vocabulary normalized by
the ONE canonical `normalizeSeverity`
(`netlify/functions/utils/periodization-input-helpers.js`): Grade 1 ↔ minor,
Grade 2 ↔ moderate, Grade 3 ↔ severe.

Applies when active restrictions include `restrictsSprint`; `competition` and
`travel` days are exempt (organiser-owned). Sprint reps go to **0** in every
branch.

| Severity | Result |
|---|---|
| severe | intent → recovery; RPE **3**; **30** min; **0** sets |
| moderate | intent → recovery; RPE **3**; minutes capped at **40**; sets capped at **3** |
| minor | day keeps its shape; sprint intent → mobility; RPE capped at **6** |

Minor tightness on a day with no sprint/high-intensity work changes nothing.
Recorded in `injuryAdjustment` (regions, severity, summary) — the self-report →
recalc trust contract (LOGIC §8).

Readiness-side injury penalties (−20 severe + level cap, −10 moderate,
−5 minor) live in §3 — same `normalizeSeverity`, different surface: the
*number* reflects the injury, the *prescription* works around it.

**Throwing restrictions** (`restrictsThrowing`: shoulder/elbow/wrist/core)
don't change load targets here — they redirect the position emphasis into
protect-the-arm guidance (see LOGIC §1 step 6).

---

## 11. Taper

Two-layer model (LOGIC §4): the engine runs ONLY on a materialized
`TaperRuleset`; the server hydrates live `taper_rules` into that shape, falling
back to the embedded default on any read/validation failure.

`EMBEDDED_TAPER_RULES` — version **v1-2026-07-13** (keep in lock-step with the
seeded `taper_rules.version`; Bosquet 2007, Mujika & Padilla 2003):

| Level | volumeFloorPct | intensityRetention | taperDays |
|---|---|---|---|
| local | 0.70 | 0.90 | 3 |
| regional | 0.60 | 0.95 | 5 |
| national | 0.55 | 0.95 | 7 |
| international | 0.50 | 1.00 | 10 |
| world | 0.50 | 1.00 | 12 |

Level mapping (`taperLevelFor`): club → local · continental → international ·
world/olympic → world · unknown/null → **national**.

`TAPER_CONFIG`: taper-prime at ≤ **24 h** to the game; "final third" at ≤
**2 days** out applies an extra **× 0.66** volume factor
(`finalThirdVolumeFactor`); unknown hours-to-event assumes day **7** of taper.

`resolveTaperTargets` (always a **sprint** — velocity/CNS preserved, never the
mobility-day detraining error), from the sprint base (RPE 8 / 90 min total
incl. warm-up + DOP / 10 reps, 2026-07-14):

```
volFactor = volumeFloorPct × (0.66 if final third else 1)
RPE       = round(8 × intensityRetention)          (≥ 0.90 ⇒ RPE never crashes)
minutes   = round(90 × volFactor)
reps      = max(2, round(10 × volFactor))
```

**Post-tournament forced recovery** (`detectTournamentRecoveryDay`): a
just-ended event with ≥ **4** games (`TOURNAMENT_RECOVERY_GAMES`) forces, for
the next **2** days: day +1 → recovery (RPE 3 / 30 min, emphasis `critical`);
day +2 → mobility (RPE 4 / 45 min, emphasis `high`). A declared practice on
those days runs at the `recovery` practice-modifier row instead of being
skipped. (Nédélec 2014; Bompa & Buzzichelli 2018.)

---

## 12. Nutrition & hydration targets

`nutritionFor(intent, bodyweightKg, heavyDensity, hotDay)` — carbs periodized
to the day's ENERGY EXPENDITURE, not just intensity (IOC 2018 / Burke): flag
sessions are short (≤ 60–75 min), so even sprint days sit in the
light–moderate band; elevated carbs are reserved for genuine glycogen demand
(pre-game top-up, game days).

| Intent bucket | Carbs g/kg/day |
|---|---|
| rest | 3.0 |
| recovery / mobility / travel | 3.5 |
| technical | 4.0 |
| sprint / strength | 4.5 |
| mixed | 5.0 |
| taper-prime (top-up, ≤24 h out) | 6.0 |
| competition | 7.0 |

Label mapping: `taper` → sprint bucket; `transition` → mixed bucket.

- Protein: **1.8 g/kg/day** flat (within the 1.6–2.2 consensus range).
- Fluid: base **35 ml/kg/day**; competition day + **1.5 L**; heavy fixture
  density (§5) + **0.5 L** (non-rest); hot day (apparent ≥ 28 °C) + **0.5 L**
  (non-rest). Rounded to 0.1 L.
- Athlete-facing copy is food-first (Law #3) — g/kg lives here and in the
  engine, not in the UI.
- **No bodyweight → no targets** (`nutritionFor` returns null; audit C7) —
  per-kg dosing is never computed from a fabricated default.

---

## 13. Travel & arrival

- **Arrival-day load cap** (`applyArrivalDayGuard`): a same-day arrival with ≥
  **3 h** seated travel (`ARRIVAL_DAY_LOAD_CAP_HOURS`) caps the day to
  activation: intent → mobility, RPE ≤ **4**, ≤ **30 min**, 0 reps/sets.
  Exempt (already at/below activation or organiser/taper-owned): rest,
  recovery, mobility, taper-prime, competition. Runs after weather, before
  injury (LOGIC §1).
- **Travel readiness penalty**: §3 (−2 / −4 / −8).
- **Acclimatization threshold shift**: §9 (±4 °C decaying over 14 days).

---

## 14. Maintenance

When you change a constant or formula in code, update its row here **in the
same commit** — until the generated-constants mechanization lands (v3 M0),
this file is the hand-synced contract. A number in this file the code
contradicts is a bug in this file. Known open items:

1. ~~Stale WBGT band comment in the engine source~~ — RESOLVED 2026-07-14:
   the stricter NATA bands are implemented and the comment now matches.
2. Youth/RTP presets orphaned — documented in §2, wiring planned (v3 M0).
3. `docs:regen` generation of the constants tables + CI freshness test
   (v3 M0, `docs/v3/V3-DESIGN.md` §2.2).

See `LOGIC.md` for the decision rules each number serves, and
`SOURCE_OF_TRUTH.md` for schema/endpoints/status.
