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
domestic leagues, so the season is *data*, resolved per athlete in this order:

1. **League / competition season (primary, data-driven).** Each league is a
   `competitions` row; its season span is data — either an explicit
   `season_start` / `season_end` on the competition, or **derived from the spread
   of its `competition_events`** (first→last event = in-season; the weeks before =
   pre-season; gaps between a league's seasons = off-season). Because every league
   carries its own dates, **two players in different leagues automatically get
   different seasons** with no code change.
2. **Athlete override (optional).** A personal adjustment on
   `athlete_training_config.season_calendar` (jsonb dated blocks, non-contiguous)
   for someone whose personal off-season differs from their league's — e.g. a
   self-imposed off-block. Overrides/augments the league-derived windows.
3. **Resolve.** The athlete's macro phase = `macroPhaseFor(today, resolvedWindows)`
   where `resolvedWindows` = union of their active teams'/leagues' season spans,
   with personal overrides applied. **The function is generic; the dates are 100%
   data.**

## Storage

- Per-league: `competitions.season_start` / `competitions.season_end` (or derive
  from `competition_events`). *(Confirm: explicit columns vs derive-from-events.)*
- Per-athlete override: `athlete_training_config.season_calendar jsonb` (array of
  `{ phase, start: "MM-DD", end: "MM-DD" }`, recurs yearly), written via
  `POST /api/player-settings`. Empty = pure league-derived.
- The phase→emphasis mapping (off-season = S&C, etc.) is a sport-science **default
  in code, team-overridable** — not league dates.

## Engine change (`prescribeFor`)

- **Input:** add `seasonPhase` derived by `macroPhaseFor(today, resolvedWindows)`
  where `resolvedWindows` = union of the athlete's leagues' season spans (from
  `competitions` / their events) with personal `season_calendar` overrides applied
  (offseason | preseason | inseason | transition). **No months in code.**
- **Use:** when no event-proximity micro-phase is active (step 5), pick the week
  shape from `seasonPhase` instead of the generic accumulation default — off-season
  weeks become strength/conditioning-led; in-season weeks maintain.
- **Output:** surface `seasonPhase` + label so Today/Training can show
  *"Off-season · strength & conditioning block"*.
- Implement with the weather guard (after confirmation); add regression cases to
  `periodization.service.spec.ts` (off-season default → strength bias; in-season
  gap → maintain; event near off-season → micro still overrides). Fold into
  `docs/PRESCRIPTION_SPEC.md`.

## Confirm (no dates needed — they're data)

The only decision is the **source mechanism**, not any months:
- League season: **explicit `season_start`/`season_end` on `competitions`** (a
  coach/admin sets it per league) **vs derive from the league's events** (zero
  entry, but needs the schedule populated). Recommendation: support both — derive
  by default, allow an explicit override per league.
- Keep the per-athlete `season_calendar` override for personal off-blocks. ✓

Everything else (the 4 phases + the off-season=S&C emphasis) is generic logic +
an overridable default. No hardcoded calendars anywhere.
