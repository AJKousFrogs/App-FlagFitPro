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
| 8 | `phase === "accumulation"` | day-of-week shape (see §3) | Default working week |

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

## 9. Versioning

Bump the version field in this file when behavior-affecting changes ship:

- **v1 (2026-05)**: initial spec; 30-test regression suite green.

When the algorithm changes:
1. Update `prescribeFor` in `periodization.service.ts`.
2. Update / add tests in `periodization.service.spec.ts`.
3. Update §1–§8 here.
4. If a server port exists (`netlify/functions/prescription.js`), port the change.
5. Bump §9 with a one-line summary of what changed.

Drift between any of these four is a bug.
