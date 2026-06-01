# Macro periodization — per-athlete season calendar

**Principle:** the schedule spine already drives **micro-phases** from event
proximity (taper → competition → recovery). On top of that sits an **annual macro
phase** — off-season / pre-season / in-season / transition — that sets the
*baseline training emphasis* for the weeks that aren't next to a game. Off-season
is **strength & conditioning oriented**; in-season is maintain + skill + manage
load. **Every athlete defines their own months** (e.g. *all of July + mid-August*,
and *all of November* for Slovenia) — so the calendar is per-athlete config, not a
global constant.

## Macro phase → emphasis

| Macro phase | When (athlete-defined) | Emphasis the engine biases toward |
|---|---|---|
| **Off-season (GPP)** | the athlete's chosen off-months (yours: Jul, mid-Aug, Nov) | **Strength & conditioning** — hypertrophy/max-strength + aerobic base, fix weaknesses, restore from season wear. Low speed-peaking / sport-specific. "Get strong." |
| **Pre-season (build)** | the weeks ramping into in-season | Convert strength→power; ramp speed/agility/conditioning + sport-specific volume; ACWR climbs controlled (<10%/wk). Peak for season start. |
| **In-season (maintain)** | competitive months | **Maintain** strength/power at minimal effective dose; prioritise skill, recovery, game performance; avoid CNS-heavy lifts near games. Micro-phases (taper/comp/recovery) dominate. |
| **Transition (active rest)** | brief post-season unload | Recovery, cross-training, mental break, low volume. |

## How macro + micro combine (decision order in `prescribeFor`)

```
1. Physio block / 2. Coach override / 3. Weather guard      (as before)
4. Event-proximity MICRO phase (from spine): competition / taper-prime /
   recovery  → these WIN near a game, regardless of season.
5. Otherwise → MACRO season phase sets the week's emphasis:
     off-season  → strength/conditioning week shape
     pre-season  → progressive build shape
     in-season   → maintain + skill shape
     transition  → recovery/base shape
```

So even in off-season, a friendly tournament still triggers taper/recovery around
it (micro overrides); and in-season, a long gap defaults to maintain — not the
generic "accumulation" the engine uses today. This **refines** the current
event-only phase model (`accumulation`/`transition`) with a real calendar.

## Data / storage

Per-athlete, on **`athlete_training_config`** — add `season_calendar jsonb`: an
array of dated blocks supporting **non-contiguous** windows:

```json
{ "season_calendar": [
  { "phase": "offseason", "start": "07-01", "end": "08-15" },
  { "phase": "offseason", "start": "11-01", "end": "11-30" },
  { "phase": "preseason", "start": "08-16", "end": "09-15" }
] }
```
Months not covered default to **in-season** (or derive pre-season as the N weeks
before the first in-season block). `MM-DD` (recurs yearly); a team default can
seed it, athlete can override. Written via `POST /api/player-settings` (the
existing onboarding/settings write path → `athlete_training_config`).

## Engine change (`prescribeFor`)

- **Input:** add `seasonPhase` derived by `macroPhaseFor(today, season_calendar)`
  (offseason | preseason | inseason | transition).
- **Use:** when no event-proximity micro-phase is active (step 5), pick the week
  shape from `seasonPhase` instead of the generic accumulation default — off-season
  weeks become strength/conditioning-led; in-season weeks maintain.
- **Output:** surface `seasonPhase` + label so Today/Training can show
  *"Off-season · strength & conditioning block"*.
- Implement with the weather guard (after confirmation); add regression cases to
  `periodization.service.spec.ts` (off-season default → strength bias; in-season
  gap → maintain; event near off-season → micro still overrides). Fold into
  `docs/PRESCRIPTION_SPEC.md`.

## Confirm

Proposed: per-athlete `season_calendar`, the 4 macro phases above, and the
emphasis mapping. **Tell me your real windows** (e.g. off-season = Jul 1–Aug 15 &
Nov 1–30; in-season = the rest; pre-season = Aug 16–? ) and whether the default
should be **per-athlete** or **per-team with athlete override** — then it goes
into onboarding + the engine.
