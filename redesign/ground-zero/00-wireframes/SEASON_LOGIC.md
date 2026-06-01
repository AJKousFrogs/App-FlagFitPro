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

## Where the windows come from — NOTHING is hardcoded

The engine must contain **zero baked-in months**. Players are in different
domestic leagues, so the season is *data* — and **the player is the source of
truth: they tell the app, from-when to-when, what they have.** Resolved per
athlete in this order:

1. **Athlete-declared windows (PRIMARY).** The player states their own periods —
   blocks of `{ from-date → to-date : phase }` (in-season / off-season /
   pre-season / transition). Stored on `athlete_training_config.season_calendar`.
   This is what they enter at onboarding and can edit anytime. It always wins.
2. **League seed / fallback (convenience — support BOTH).** To save typing, the
   player's windows are pre-filled from their league: either an explicit
   `competitions.season_start` / `season_end`, **or derived from the spread of the
   league's `competition_events`**. The player accepts or edits the prefill — they
   are never forced to take it. Different leagues → different prefills automatically.
3. **Resolve.** macro phase = `macroPhaseFor(today, resolvedWindows)` where
   `resolvedWindows` = the athlete's declared blocks (falling back to the league
   seed for any uncovered span). **Generic function; dates are 100% data, declared
   by the player.**

## Storage

- **Athlete-declared (primary): `athlete_training_config.season_calendar jsonb`** —
  array of `{ phase, from, to }` blocks the player enters. Support both a specific
  span (`"2025-09-01" → "2026-04-30"`) and a recurring annual one (`"09-01" →
  "04-30"`); non-contiguous allowed. Written via `POST /api/player-settings`.
- **League seed (both supported):** `competitions.season_start` /
  `competitions.season_end` if set, else derived from `competition_events`. Used to
  pre-fill the player's blocks; not authoritative over the player's edits.
- The phase→emphasis mapping (off-season = S&C, etc.) is a sport-science **default
  in code, team-overridable** — not league dates.

## Engine change (`prescribeFor`)

- **Input:** add `seasonPhase` derived by `macroPhaseFor(today, resolvedWindows)`
  where `resolvedWindows` = the athlete's **declared** `season_calendar` blocks,
  with the league seed filling any uncovered span (offseason | preseason |
  inseason | transition). **No months in code.**
- **Use:** when no event-proximity micro-phase is active (step 5), pick the week
  shape from `seasonPhase` instead of the generic accumulation default — off-season
  weeks become strength/conditioning-led; in-season weeks maintain.
- **Output:** surface `seasonPhase` + label so Today/Training can show
  *"Off-season · strength & conditioning block"*.
- Implement with the weather guard (after confirmation); add regression cases to
  `periodization.service.spec.ts` (off-season default → strength bias; in-season
  gap → maintain; event near off-season → micro still overrides). Fold into
  `docs/PRESCRIPTION_SPEC.md`.

## Settled (per user)

- **The player declares their own periods** (from-when → to-when : phase) — primary
  source of truth, on `season_calendar`.
- **Support both league seeds** (explicit `competitions.season_start/end` *and*
  derive-from-events) purely to **pre-fill** the player's blocks; the player edits.
- Everything else (the 4 phases + off-season=S&C emphasis) is generic logic + an
  overridable default. No hardcoded calendars anywhere.
