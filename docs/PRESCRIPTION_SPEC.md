# Prescription Specification

**Authority:** `angular/src/app/core/services/periodization.service.ts` → `prescribeFor()`
**Tests:** `angular/src/app/core/services/periodization.service.spec.ts` (30 cases)

This document is the contract for the daily prescription mechanic. Any new
implementation (server-side port, mobile, push-notification pipeline) MUST
match this spec **and** match the regression tests. If you change one, change
all three in the same commit.

---

## 1. Inputs

```ts
{
  date: Date;                         // UTC ok
  phase: CompetitionPhase;            // resolved by ScheduleService
  upcoming: CompetitionEvent[];       // future events, soonest first
  lastEvent: CompetitionEvent | null; // most recent past event
  acwr: number | null;                // null = no data
  readiness: number | null;           // 0–100; null = no data
  bodyweightKg: number | null;
  density14d: { totalGames: number; hasPeakImportance: boolean } | null;
}
```

### Fallbacks

| Input | Fallback | Justification |
|---|---|---|
| `bodyweightKg` | `80 kg` | Population midpoint; nutrition still scales sensibly |
| `readiness`    | `70`    | Above the low cut-point; does not over-trigger recovery |
| `acwr`         | `null` (used only for *override*) | Missing ACWR ≠ safe; we just don't penalize |
| `density14d`   | treated as 0 / no peak | Conservative |

---

## 2. Priority Decision Tree

The algorithm is read top-to-bottom. The **first matching rule wins**; later
rules don't run.

| # | Condition | Intent | Rationale |
|---|---|---|---|
| 1 | `phase === "competition"` | `competition` | Live event window |
| 2 | `hoursUntilNextEvent ≤ 24` | `taper-prime` | Pre-game opener; never override |
| 3 | `acwr > 1.5` | `rest` | Injury-risk safety override |
| 4 | `readiness < 55` | `recovery` | Body says no |
| 5 | `phase === "recovery"` | `recovery` | Post-event repair |
| 6 | `phase === "taper"` | `mobility` (≤ 2 days out) or `sprint` | Stay sharp, drop volume |
| 7 | `phase === "transition"` | `mobility` if heavy density else `mixed` | Off-season GPP |
| 8 | `phase === "accumulation"` | season-shaped week (§8a) if `seasonPhase` set, else day-of-week shape (§3) | Default working week |

After a base intent is chosen, the result is passed through the **weather guard**
(§8b), which may relocate / substitute / scale / stop intense outdoor intents.

---

## 3. Accumulation Week Shape (Default)

Day-of-week 0 = Sunday.

| Day | Default Intent | Target RPE | Target Min | Sprint Reps | Strength Sets |
|-----|---|---:|---:|---:|---:|
| Sun | rest      | — | 0  | 0  | 0 |
| Mon | strength  | 7 | 75 | 0  | 18 |
| Tue | sprint    | 8 | 60 | 10 | 0  |
| Wed | mobility  | 6 | 75 | 0  | 0  |
| Thu | strength  | 7 | 75 | 0  | 18 |
| Fri | sprint    | 8 | 60 | 10 | 0  |
| Sat | mixed     | 6 | 75 | 6  | 8  |

### Modulation rules

Applied AFTER the day-of-week pick, before output:

- `acwr > 1.3` (elevated): `sprint`/`strength` → `mobility`; `mixed` → `technical`
- `density14d.totalGames ≥ 10` (heavy): `strength` → `technical`; `mixed` → `mobility`. Rest stays rest.

---

## 4. Output

```ts
{
  date: "YYYY-MM-DD";          // local
  phase: CompetitionPhase;
  intent: PrescriptionIntent;  // see §6
  intentLabel: string;         // localized display
  targetRpe: number | null;    // null on rest
  targetMinutes: number;
  sprintReps: number;
  strengthSets: number;
  reasoning: string;           // 1 sentence; never empty
  recoveryEmphasis: "low" | "medium" | "high" | "critical";
  nutrition: NutritionTargets;
  driverEvent: CompetitionEvent | null;
  hoursUntilNextEvent: number | null;
  acwrAtIssue: number | null;
}
```

### Reasoning contract

`reasoning.length > 10` for every output. The string is the athlete-facing
"why this day" — short, scannable, no jargon.

---

## 5. Nutrition Formulas

### Carbohydrates (per kg bodyweight, per day)

| Intent | g/kg |
|---|---:|
| rest          | 3   |
| recovery      | 4   |
| mobility      | 4   |
| technical     | 4.5 |
| mixed         | 5.5 |
| sprint        | 6   |
| strength      | 6   |
| taper-prime   | 7   |
| competition   | 8   |

### Protein

`1.8 g/kg/day` regardless of intent (Phillips & Van Loon 2011 mid-range; lower
bound of MPS-supportive intake for athletes during high-load weeks).

### Fluid

```
hydrationL = (35 ml/kg × bodyweightKg) / 1000
           + (1.5 if intent === "competition" else 0)
           + (0.5 if heavyDensity AND intent !== "rest" else 0)
```

Round to 1 decimal.

### Rationale strings

- `competition`: "Game-day fueling: carbs every game, hydrate aggressively, protein after final game."
- `rest`: "Lower carb day. Protein steady to support repair."
- `taper-prime`: "Top up glycogen tonight. Hydrate well — game window opens soon."
- otherwise: "Daily targets at {N}g/kg carbs, 1.8g/kg protein."

---

## 6. Intent Vocabulary

Mutually exclusive. Exactly one per day.

| Intent | When | Display label |
|---|---|---|
| `rest`         | Sun by default; ACWR > 1.5 override | Rest day |
| `recovery`     | post-event recovery window; readiness < 55 | Active recovery |
| `mobility`     | taper final third; transition heavy; ACWR-demoted | Mobility & technique |
| `technical`    | demoted from mixed under heavy density / elevated ACWR | Skills focus |
| `sprint`       | Tue/Fri default; taper non-final | Sprint focus |
| `strength`     | Mon/Thu default | Strength session |
| `mixed`        | Sat default; transition normal | Mixed session |
| `taper-prime`  | ≤ 24h before any event | Pre-game prime |
| `competition`  | inside event window | Game day |

---

## 7. Recovery Emphasis

| Intent | Emphasis |
|---|---|
| `competition` or ACWR > 1.5 forced rest | `critical` |
| `recovery`, `taper-prime` | `high` |
| `mobility`, `taper` non-final | `medium` |
| Heavy density during accumulation | `medium` (else `low`) |
| Otherwise | `low` |

---

## 8. Phase Resolver

Owned by `ScheduleService.phaseFor()` and the matching netlify resolver in
`netlify/functions/schedule.js`. Mirrors must stay in sync.

| Phase | Trigger |
|---|---|
| `competition` | now is between `event.startsAt` and `event.endsAt` |
| `taper`       | `0 < hoursUntilNext ≤ taperWindow` (peak: 168h, high: 96h, regular: 48h) |
| `recovery`    | `hoursSinceLast ≤ recoveryWindow` (peak: 96h, high: 48h, regular: 24h) |
| `transition`  | `hoursUntilNext > 14 days` OR no upcoming events |
| `accumulation`| default — none of the above |

---

## 8a. Season Macro-Phase (annual periodization)

Above the event-proximity micro-phases sits an athlete-declared **macro season
phase**. `macroPhaseFor(date, windows)` resolves it from the player's
`athlete_training_config.season_calendar` blocks — `{ phase, from, to }` where
`from`/`to` are a specific span (`"YYYY-MM-DD"`) or a recurring annual one
(`"MM-DD"`, may wrap the year end). First matching window wins; `null` → generic
build. **No months are hardcoded — the player is the source of truth.**

When **no event micro-phase** drives the week (decision rule #8, `accumulation`),
`seasonPhase` shapes the week instead of the plain day-of-week default:

| Season phase | Week emphasis |
|---|---|
| `offseason` | Strength & conditioning (Mon/Thu/Sat strength, Tue/Fri mixed) |
| `inseason` | Maintain + skill (strength maintained, more technical/mobility) |
| `transition` | Active rest / aerobic base (recovery + mobility) |
| `preseason` | Generic progressive build (same as default §3) |

Event micro-phases (competition / taper-prime / recovery, rules #1–#6) still
**override** the macro phase — a friendly tournament in the off-season still
triggers taper/recovery around it. Surfaced on the output as `seasonPhase`.

## 8b. Weather Guard (outdoor-safety constraint layer)

`applyWeatherGuard(rx, weather, coachOverride)` runs **on top of** the base
prescription (precedence: physio ▷ coach ▷ **weather** ▷ engine). It only touches
**intense outdoor** intents (`sprint`, `mixed`, `taper-prime`); strength (indoor),
mobility, technical, recovery, rest and competition are weather-agnostic. Inputs
are metric (`weather.js` now requests °C / km/h / mm). Actions, highest-priority
first:

| Trigger (apparent °C / code / mm) | Action | Effect |
|---|---|---|
| Thunderstorm (code 95–99) | `stop` | → `recovery` indoors/rest |
| apparent ≥ 38 | `stop` | → `recovery` |
| apparent ≥ 35 | `relocate` | → indoor `mobility`; `heatLoadFactor` 1.2 |
| Wet (code ≥ 61 or precip > 0.5 mm) | `substitute` | sprint/mixed → `strength`, taper-prime → `mobility` |
| apparent ≤ −5 | `substitute` | → indoor `mobility` |
| apparent ≥ 32 | `scale` | same intent, volume −20%, `heatLoadFactor` 1.1, "RPE feels ~1 higher" |
| apparent ≥ 28 / ≤ 4 / wind ≥ 40 km/h | `none` | advisory note only, intent unchanged |
| otherwise | — | no `weatherAdjustment` emitted |

`coachOverride: true` keeps the planned session (records `applied:false`); a
thunderstorm still warns. Output: `weatherAdjustment { applied, action,
originalIntent, adjustedIntent, heatLoadFactor, reason }`, with `reason` prepended
to `reasoning`. Heat `heatLoadFactor` feeds `training_sessions.workload` at port so
ACWR reflects true strain; we never rewrite the athlete's logged RPE. Thresholds
are named constants (team-configurable later). `weather: null` → no-op.

## 9. Versioning

Bump the version field in this file when behavior-affecting changes ship:

- **v1 (2026-05)**: initial spec; 30-test regression suite green.
- **v2 (2026-06)**: added the season macro-phase (§8a, `macroPhaseFor` +
  `seasonShapedIntent`) and the weather guard (§8b, `applyWeatherGuard`); weather
  units fixed to metric. Regression suite now 45 green.

When the algorithm changes:
1. Update `prescribeFor` in `periodization.service.ts`.
2. Update / add tests in `periodization.service.spec.ts`.
3. Update §1–§8 here.
4. If a server port exists (`netlify/functions/prescription.js`), port the change.
5. Bump §9 with a one-line summary of what changed.

Drift between any of these four is a bug.
