# FlagFit Pro — Calculations & Logic Reference

**Purpose.** One place that documents *every* safety-relevant calculation and
decision rule in the app: the exact formula, the constants, **where it lives
(file:line)**, and the **drift-guard** that keeps it single-sourced. This is the
companion to `SOURCE_OF_TRUTH.md` (which owns schema/endpoints/feature status);
this file owns the *math*.

**How to trust this file.** It is written FROM the code, not from intent. When it
disagrees with the code, the **code wins** — fix this file in the same pass (per
the ground-truth hierarchy). Every number below is cited; if you change a number
in code, update its line here. Values are as of **2026-07-13**.

**The throughline rule (SOT §4).** One calculation, one place it is computed;
everywhere else fetches/displays. A formula in two places is a bug even when the
numbers currently agree — they will drift. The "Guard" line in each section names
the parity test that enforces this.

**No fabricated defaults.** Where an input is missing, the output must SAY so —
never invent a plausible value (e.g. load is 0 if unlogged, never estimated;
bodyweight falls back only for per-kg display math, never as a "real" measurement).

---

## 1. Session load (sRPE) — the atom everything else is built on

- **What:** the internal load of one training session, in arbitrary units (AU).
- **Formula** (`netlify/functions/utils/acwr.js#computeSessionLoad`):
  ```
  load = workload            if a real workload is stored (>0)
       = rpe × duration_min  else if both rpe>0 and minutes>0
       = 0                   otherwise  (NEVER fabricated from defaults)
  ```
- **Single source:** `computeSessionLoad` is the ONLY load formula; 8+ consumers
  call it (compute-acwr, calc-readiness via `buildLoadsByDay`, training-metrics,
  daily-load, etc.). `calc-readiness.js` was fixed (2026-07-09) to use it instead
  of an inline `duration × rpe`.
- **Guard:** `tests/unit/calc-readiness-load-parity.test.js`.
- **Practices count too:** a logged practice is a `training_sessions` row with
  `session_type='flag_football'` → it feeds load/ACWR like any session. An
  *unlogged* practice is 0 (honest) — the Today "log your practice" nudge closes
  that gap by prompting a real log, never by estimating load.

---

## 2. ACWR (Acute:Chronic Workload Ratio)

- **What:** fatigue (acute) vs fitness (chronic) — the primary injury-risk signal.
- **Model:** **EWMA** (exponentially weighted moving average), NOT a rolling mean.
  - Acute window **7 days**, decay **λ = 0.25** (= 2/(7+1)).
  - Chronic window **21 days**, decay **λ ≈ 0.0909** (= 2/(21+1)).
  - **Uncoupled windows:** the chronic window is the 21 days *preceding* the acute
    (not overlapping) — an intentional design so a load spike doesn't inflate both.
  - `EWMA_today = λ · load_today + (1−λ) · EWMA_yesterday`.
  - `ACWR = acute_EWMA / chronic_EWMA`.
- **Risk zones** (`acwr.js ACWR_RISK_ZONES`): sweet spot **0.8–1.3**, danger
  **> 1.5** (reduce load). The backend classifier is population-blind (adult
  baseline for everyone); the frontend tightens for youth / return-to-play
  (RTP flags danger at **1.3**) — a documented, SAFE-direction divergence.
- **Config source:** backend authority `acwr.js` (`ACWR_DEFAULTS`,
  `ACWR_RISK_ZONES`); the frontend reads `EVIDENCE_PRESETS`
  (`angular/src/app/core/config/evidence-presets.ts`).
- **Guard:** `tests/unit/acwr-config-drift.test.js` (FE presets ≡ BE windows/λ;
  fails if the client is ever LAXER than the server).
- **Invariant:** ACWR is **isolated from body-mass** — weight never enters the
  ratio. (Weight only touches per-kg nutrition; see §12.)

---

## 3. Readiness score (0–100)

- **What:** the daily "how ready to train" composite. `netlify/functions/calc-readiness.js`.
- **Weighted composite:**
  | Component | Weight |
  |---|---|
  | Workload (ACWR from session-RPE) | **35%** |
  | Wellness Index (sleep, soreness, energy, mood, stress) | **30%** |
  | Sleep quality/duration | **20%** |
  | Game proximity | **15%** |
- **Cut-points** (starting points, team-calibratable): **< 55** low → deload ·
  **55–75** moderate → maintain · **> 75** high → push.
- **Data mode** (`determineDataMode`): **full** when wellness completeness ≥ **60%**,
  else **reduced** (sleep-proxy mode) — evidence-based (Saw 2016: sleep proxies
  broader wellness when data is thin).
- **Single source:** computed server-side; the client **reads** it
  (`readiness.service.ts` — "Computed by the server; clients read it"). No client
  re-computation.
- **Guard:** `tests/unit/readiness-formula-unification.test.js`.

---

## 4. Wellness index & Hooper index

Two *distinct* wellness metrics — do not confuse or merge them.

- **Wellness Index** (the 30% readiness component): `calculateWellnessIndex`
  (`netlify/functions/utils/readiness-score.js`) over sleep, soreness, energy,
  mood, stress. **Server-computed; client reads.**
- **Hooper Index** (monitoring/trend view): `sleep_quality + stress_level +
  energy_level + muscle_soreness` (`monitoring-report.js`, `hooper = (r) => …`).
  Higher = worse. Flagged **watch / high** against `t.hooper` thresholds
  (`hooperFlag`). **Server-computed; the client `monitoring-report.service.ts`
  only reads `hooperIndex`.**
- **No drift:** both are computed once (server) and displayed by the client.

---

## 5. Soreness & pain threshold

- **PAIN_TRIGGER_THRESHOLD = 3** (`netlify/functions/utils/safety-override.js:15`)
  — a soreness/pain rating ≥ 3 routes into the safety-override path (down-regulates
  the session).
- Mirrored on the client as **SORENESS_PAIN_TRIGGER = 3** and
  **HIGH_PAIN_THRESHOLD = 7** (`angular/src/app/core/constants/wellness.constants.ts`).
- **Guard:** `tests/unit/soreness-threshold-parity.test.js` (server `> 3` and
  client `>= 6` were unified to one canonical `3` in 2026-07-12).
- Wellness `soreness_areas` writes a `daily_wellness_checkin`; a genuine reported
  injury goes through `athlete_injuries` (the self-report → recalc loop).

---

## 6. Phase resolution (game-proximity micro-phase)

- **What:** which competition phase a given day is in, from schedule proximity.
  `netlify/functions/schedule.js#resolvePhase` ≡ `angular/.../schedule-resolver.ts`.
- **Phases:** `competition` (event day) · `travel` (inside an event window, not a
  game day) · `taper` (inside the taper window before the next event) · `recovery`
  (inside the recovery window after a heavy event) · `accumulation` (default build,
  ~2–14 days out) · `transition` (no games / > 14 days out).
- **Importance-tiered windows** (hours, `schedule-resolver.ts:21-27`):
  - Taper: regular **2 d**, high **4 d**, peak/world/olympic **7 d** (+ tier bonus:
    world +3 d, olympic +7 d).
  - Recovery: regular 1 d, high 2 d, peak 4 d (+ bonus).
  - Transition boundary: **14 d**.
  - `effectiveImportance = max(declared, tier floor)`: international/continental →
    `high`, world/olympic → `peak` (never lowers a coach-declared importance).
- **Precedence:** post-event **recovery wins over** an upcoming taper (clear the
  fatigue first).
- **Guard:** `tests/unit/schedule-resolver-parity.test.js` (client ≡ server).

### 6a. Season macro-phase
- `macroPhaseFor(date, season_calendar)` → `offseason | preseason | inseason |
  peak | postseason | transition`, from the athlete's declared
  `athlete_training_config.season_calendar` windows. **Returns `null` on an empty
  calendar** (no fabricated season). Multiple windows allowed (split season).

---

## 7. Periodization engine (the daily prescription)

The engine is a **pure function**, authored in
`angular/src/app/core/services/periodization-engine.ts` and compiled byte-for-byte
into the server port `netlify/functions/utils/periodization-engine.js`
(`npm run build:periodization-engine`).
- **Guard:** `tests/unit/periodization-port-parity.test.js` (source ≡ port) +
  `periodization-drift-parity.test.js` (fixture snapshots).

### 7a. `prescribeFor(inputs)` pipeline (precedence, first to last)
1. base intent — `weeklyIntentHint` → `seasonShapedIntent` / `pickAccumulationIntent`.
2. **CNS-recovery spacing** (§9).
3. **weather guard** (§11).
4. **arrival-day cap** (≥ 3 h travel arriving today → activation only).
5. **injury/physio guard** (§10) — highest precedence over training (spec law).
6. position emphasis (accessory/prehab only; never changes intent/load).
7. **time-shift** attach (§11b).

### 7b. `planWeek()` (week-level passes the single day can't do)
`planWeekIntents` (anchor-based, phase-shaped around real practice days) →
`prescribeFor × 7` → `enforceWeeklyRestMinimum` (**≥ 2 rest days**) →
`addSecondSessions` (preseason/offseason only; **skips practice days**;
readiness < 75 or ACWR > 1.2 today blocks it).

### 7c. Base session targets per intent (`baseTargets`)
| intent | RPE | minutes | sprintReps | strengthSets |
|---|---|---|---|---|
| rest | 2 | 15 | 0 | 0 |
| recovery | 3 | 30 | 0 | 0 |
| mobility | 4 | 45 | 0 | 0 |
| technical | 5 | 60 | 0 | 0 |
| **sprint** | **8** | **60** | **10** | 0 |
| strength | 7 | 75 | 0 | 18 |
| mixed | 6 | 75 | 6 | 8 |
| taper-prime | 4 | 25 | 4 | 0 |
| competition | null | 60 | 0 | 0 |
| travel | null | 0 | 0 | 0 |

The **sprint row (RPE 8 / 60 min / 10 reps)** is the baseline the taper (§8) and
weather scaling (§11) measure against.

---

## 8. Taper (two-layer, WBGT-of-training model)

- **Rule (rubric B6):** a taper **cuts VOLUME while HOLDING INTENSITY** (Bosquet
  2007 meta-analysis; Mujika & Padilla 2003 — reducing intensity detrains).
- **`resolveTaperTargets(ruleset, level, isFinalThird)`:**
  ```
  RPE     = round( baselineSprintRPE(8) × intensityRetention )
  minutes = round( baselineSprintMin(60) × volumeFloorPct × [finalThird ? 0.66 : 1] )
  reps    = max(2, round( baselineSprintReps(10) × volumeFloorPct × [finalThird ? 0.66 : 1] ))
  intent  = "sprint" always (velocity/CNS preserved — never mobility)
  ```
- **Two-layer model:** the engine runs on a *materialized* `TaperRuleset`, never
  raw DB rows.
  - **Embedded default** `EMBEDDED_TAPER_RULES` (version `v1-2026-07-13`), by level:
    | level | volumeFloorPct | intensityRetention | taperDays |
    |---|---|---|---|
    | local | 0.70 | 0.90 | 3 |
    | regional | 0.60 | 0.95 | 5 |
    | national | 0.55 | 0.95 | 7 |
    | international | 0.50 | 1.00 | 10 |
    | world | 0.50 | 1.00 | 12 |
  - **Live layer:** the server reads active `taper_rules` (with a matching
    `version`) and hydrates the same shape; falls back to embedded on error /
    partial / malformed. `taperLevelFor` maps the 7-value `CompetitionLevel` → the
    5 curated levels (club→local, continental→international, olympic→world,
    unknown→national).
- **Taper-prime** (≤ 24 h, game-eve opener): RPE 4 / 25 min / 4 velocity strides —
  the opener, not a taper block.

---

## 9. CNS-recovery spacing

- **Window:** `CNS_RECOVERY_HOURS = 48` h base, **scaled UP with age (never down)**:
  ≥ 35 y → 60 h, ≥ 40 y → 72 h (`cnsRecoveryHoursForAge`).
- After a recent high-CNS session (sprint / plyo / max-velocity), a new high-CNS
  day inside the window is suppressed → `technical`/mobility, RPE capped at 5.

---

## 10. Injury / physio response

`INJURY_RESPONSE` (`periodization-engine.ts:426`):
| severity | effect |
|---|---|
| severe | RPE 3, 30 min, 0 strength sets |
| moderate | RPE 3, ≤ 40 min, ≤ 3 sets |
| minor | RPE capped at 6 |

Injury/physio has **precedence over training** (spec law) — the guard runs last so
the affected region's sprint/high-intensity work is removed regardless of the base
plan. Sprint intent under injury → mobility.

---

## 11. Weather guard — WBGT × duration × intensity (Phase 5)

- **WBGT approximation** (`approxWBGT(Ta, RH)`, Australian BoM shade formula):
  ```
  e    = (RH/100) · 6.105 · exp(17.27·Ta / (237.7 + Ta))   [vapour pressure, hPa]
  WBGT ≈ 0.567·Ta + 0.393·e + 3.94
  ```
  Requires humidity; **null in → null out** → the guard falls back to the legacy
  apparent-temp path and SAYS so ("33°C feels-like" vs "29°C WBGT"). It is a
  conservative *shade* estimate (no solar term).
- **WBGT thresholds** (°C WBGT, NATA/ACSM continuous-activity, unhelmeted):
  **< 27.8** normal · **27.8–30.0** scale · **30.0–32.2** relocate indoors ·
  **≥ 32.2** stop.
- **Heat-guarded intents:** `sprint`, `mixed`, `taper-prime`, **`technical`** (the
  D13 inversion fix — a long outdoor skills session accumulates real heat load).
- **Strain-scaled volume cut** (SCALE band): `cut = f(WBGT-band × intensityWeight ×
  duration)`, clamped **0.20–0.50**. Intensity weights: sprint 1.0, mixed 0.9,
  taper-prime 0.6, technical 0.6; duration ref 45 min.
- **Non-heat branches:** storm (WMO 95–99) → stop; wet (rain codes / precip > 0.5 mm)
  → substitute indoors (OUTDOOR_INTENSE only, not technical); cold (apparent ≤ −5
  avoid, ≤ 4 caution); wind ≥ 40 km/h advisory.
- **Acclimatization shift** (`athlete_travel_log`): tightens heat thresholds down /
  cold up, max ±4 °C, linear decay to 0 by day 14.
- **Legacy apparent-temp fallback** (no humidity): 28 / 32 / 35 / 38 °C.
- **heatLoadFactor:** 1.0 / 1.1 (reduce) / 1.2 (avoid) — feeds the port's workload.

### 11b. Cooler-hour time-shift (Phase 5b)
- `findCoolerHour(hourly, fromHour, currentWbgt)`: if the training-hour WBGT is hot
  (≥ 30) and a **≥ 1.5 °C cooler, comfortable (< 30)** hour exists later the **same
  day** (≤ **6 h** wait, before a **21:00** cap), suggest the **earliest** such hour
  ("32°C WBGT at 18:00 — train at 20:00, ~27°"). Advisory only — load unchanged.
- Anchor: server uses declared `team_training_days.time`; client uses the current
  wall-clock hour. Hourly forecast: Open-Meteo `hourly=…&forecast_days=2`.

### 11c. Known coherence gap (flagged, not yet fixed)
The Today weather **suitability** chip (`weather.js#calculateOpenMeteoSuitability`)
is **apparent-temp**-based (`> 35 °C = poor`), while the training guard is
**WBGT**-based. On a humid day the chip can read "fair/good" while the guard STOPs
the session. Making the chip WBGT-aware is a follow-up.

---

## 12. Weight / bodyweight

- **`FALLBACK_BODYWEIGHT_KG = 80`** — the ONLY definition, in
  `angular/src/app/core/config/athlete-defaults.ts` (single-sourced 2026-07-13;
  was previously copy-pasted in the engine, supplements screen, and tournament
  planner). Used **only** to keep per-kg math from collapsing to zero — never a
  fabricated "real" measurement; a real `weight_kg` is always preferred.
- **Bounds:** `> 30 && < 200` kg (validation, client ×2 + server ×2 — duplicated
  literals, but consistent).
- **Invariant:** weight never enters ACWR / readiness / load — only nutrition (§13).

---

## 13. Nutrition targets

- **Daily prescription** (`nutritionFor`, engine):
  - **Carbs** `CARB_PER_KG[intent] × bodyweight` (g/kg): rest 3 · recovery 3.5 ·
    mobility 3.5 · technical 4 · sprint 4.5 · strength 4.5 · mixed 5 ·
    taper-prime 6 · competition 7 · travel 3.5.
  - **Protein** `PROTEIN_PER_KG (1.8) × bodyweight`.
  - **Fluid** `FLUID_BASE_ML_PER_KG (35) × bodyweight / 1000`, **+ 1.5 L** on a
    competition day, **+ heat** on a hot day.
- **Evidence protocols** (`utils/nutrition-protocols.js`): between-games refuel
  (≈ 1.0 g/kg/h carbs, 0.3 g/kg protein, ~600 ml/h + sodium); caffeine 3–6 mg/kg
  ~1 h pre-game, **withheld within 6 h of bed** (Drake 2013); batch-tested-only
  supplements (strict liability).
- **FLAGGED divergence (needs product verification, §4 "same intent?"):** the
  daily-protocol protein `1.8 g/kg` (engine) vs the **nutrition-planner's**
  activity-level `PROTEIN_PER_KG` map (`nutrition.js`). Likely different intents
  (prescription vs planner) — do NOT blind-merge.

---

## 14. Knowledge base (Merlin AI coaching)

- `knowledge_base_entries` (≈ 116 evidence-graded, approved entries) across four
  domains: recovery modalities, warm-up/stretching, performance nutrition,
  supplements/anti-doping.
- Each entry carries an evidence tier (META/RCT/COHORT/CONSENSUS/HEURISTIC); the
  `trigger_update_knowledge_search` trigger auto-indexes new rows so Merlin can
  retrieve them. The same sources back `utils/recovery-protocols.js` and
  `utils/nutrition-protocols.js`, so Merlin and the engine speak one evidence voice.

---

## Drift-guard index (the tests that keep this file true)

| Domain | Guard test |
|---|---|
| Session load | `calc-readiness-load-parity.test.js` |
| ACWR config (FE ≡ BE) | `acwr-config-drift.test.js` |
| Readiness formula | `readiness-formula-unification.test.js` |
| Phase resolution (client ≡ server) | `schedule-resolver-parity.test.js` |
| Periodization engine (source ≡ port) | `periodization-port-parity.test.js` |
| Periodization fixtures | `periodization-drift-parity.test.js`, `periodization-parity.test.js` |
| Soreness / pain threshold | `soreness-threshold-parity.test.js` |
| Weather WBGT / taper / time-shift | `weather-wbgt-guard.test.js`, `weather-timeshift.test.js`, `taper-two-layer.test.js` |

*Maintenance:* when you change a formula or constant in code, update its section
here **and** the guard test in the same commit. A number in this file that the
code contradicts is a bug in this file.
