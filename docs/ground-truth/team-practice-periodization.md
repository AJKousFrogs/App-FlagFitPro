# Team-practice periodization & the practice-plan realization engine

_Blueprint — dated 2026-07-12. Owner: training-decision core. Extends the existing
two-engine architecture (D10); does **not** fork a parallel engine._

## 0. Why this exists

Most flag-football teams train the worst possible way for getting better: warm up,
then scrimmage 5-on-5 for an hour. An hour of 5v5 is **low-density, low-transfer**
— a handful of reps per player, no isolated skill correction, high injury exposure
on turf with little conditioning benefit. It rehearses chaos without building the
sub-skills chaos is made of.

This document defines how FlagFit turns a **team-practice day** into a
**periodized, time-boxed practice plan** whose drill-vs-scrimmage mix is driven by
proximity to the next peak/high tournament — the same taper spine the individual
engine already uses.

## 1. How pro teams actually structure a week (and the flag adaptation)

NFL/NCAA in-season weeks are **periodized micro-cycles**, not "practice = scrimmage."
The transferable principles (consensus/coaching-science, not RCT — labelled HEURISTIC
in content):

| Pro principle                                                 | What it means                                                                                                       | Flag adaptation                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Install → situational → walkthrough** taper across the week | Volume & complexity descend toward game day (Wed heavy install, Thu 3rd-down/red-zone situational, Fri walkthrough) | Our `framing` "own" → "sharp" → "sharp/taper_final" already encodes this descent  |
| **Position-group periods** (indy) before team period          | Skills are isolated and corrected in position groups first; team period integrates them                             | The 20-min WR / DB / routes-vs-coverage blocks ARE indy → integration             |
| **Individual load ≠ team load**                               | Linemen, skill, QBs get different volumes/CNS exposure                                                              | We already carry `positionEmphasis`; practice blocks are position-tagged          |
| **Speed is trained fresh, separately**                        | Sprint work on legs that aren't pre-fatigued                                                                        | Sprint sessions stay their own session type; not buried at the end of a scrimmage |
| **CNS/tissue management**                                     | High-CNS (max sprint, cutting, jumping/landing) is dosed, not accumulated blindly                                   | `isHighCnsSessionType` + tissue-load engine already guard this                    |
| **Scrimmage is a peaking tool, not a base-builder**           | Full-speed team reps are dialled UP near competition, DOWN in the build phase                                       | The drill:scrimmage ratio is a function of `framing` (§3)                         |

**Flag-specific cadence** (the real constraint this team runs on):

- **2× / week team practice** (the block plans in §3).
- **1× / week heavy technical** (1.5–2 h) — deep position craft, low team-scrimmage.
- **Sprint sessions** — separate, on fresh legs (own session type; already modelled).
- **The rest** — individual tissue-load / gym / recovery, owned by the daily engine.

## 2. Architecture: this is a REALIZATION, not a new intent engine

The app's D10 split is law here:

- **INTENT (exists — `periodization-engine.ts`).** Owns season phase, taper windows,
  taper proximity to the next peak/high `competition_event`, `framing`
  (`own` | `sharp` | `recovery`), RPE/minutes targets, `positionEmphasis`,
  recovery/nutrition intent. `practiceModifierFor(phase, daysOut)` already returns the
  right modifier for a team-practice day. **We add nothing to control flow here.**
- **REALIZATION (new — the practice-plan generator).** Given the intent for a
  team-practice day, assemble the concrete **time-boxed block plan**: which blocks,
  how many minutes each, and the drill-vs-scrimmage ratio — then fill each block with
  drills from the library. Analogous to how `daily-protocol` realizes an individual
  session from the individual intent.

So the "when to drill vs when to play 5v5" question is **already answered** by the
intent engine's `framing` + `minutes` + taper `daysOut`. The new engine only
**shapes** that answer into a runnable practice.

## 3. The block model (drill : scrimmage ratio by framing)

A full development practice (framing `own`, ~90 min) is the user's canonical shape:

```
20 min  Warm-up            (isometrics + plyometrics + conditioning; season-flavoured, fun)
20 min  WR block           (ALL players run the WR technical drills)
 —      water break
20 min  DB block           (ALL players run the DB technical drills)
 —      water break
20 min  Routes vs Coverage (7-on-7 skeleton, deep-ball shots — integration, not full 5v5)
20 min  Team / playbook    (install + situational team reps; capped 5v5 in build phase)
post    Specialty:  QB+Center snap timing · Blitzer 3-step accel/decel · whole-team cool-down
```

The generator scales this by `framing` (all data-driven — a new phase is a new row,
never a new branch, mirroring `PRACTICE_PHASE_MODIFIERS`):

| framing (phase)                                  | minutes | Warm-up                     | Indy skill (WR/DB)     | Integration (routes/cover) | Team / 5v5                               | Emphasis                                                 |
| ------------------------------------------------ | ------- | --------------------------- | ---------------------- | -------------------------- | ---------------------------------------- | -------------------------------------------------------- |
| `own` — accumulation/transition, far from a peak | ~90     | 20 (developmental, playful) | 40                     | 20                         | 20 (install, capped 5v5)                 | **Build skills.** Scrimmage is the smallest block.       |
| `sharp` — taper, 3–7 days out                    | ~60     | 15 (crisp activation)       | 20                     | 15 (situational 7-on-7)    | 25 (full-speed 5v5 install, situational) | **Sharpen.** Scrimmage grows, isolated drilling shrinks. |
| `sharp` — taper_final, ≤48 h                     | ~45     | 12 (light activation)       | 10 (walkthrough tempo) | 10 (mental reps)           | 13 (walkthrough / script, NO max-CNS)    | **Peak & protect.** Walkthrough, glycogen top-up.        |
| `recovery` — post-tournament practice day        | ~30     | 12 (mobility-led)           | light technique only   | —                          | —                                        | **Recover.** No scrimmage, no max sprint.                |

Key rule the app enforces that most teams violate: **the hour of mindless 5v5 only
appears — capped and purposeful — as competition nears.** In the build phase the team
block is the _smallest_ slice, and it's install/situational, not free scrimmage.

**Season flavour of the warm-up** (the "fun, yet depends on the season"): off-season
/ accumulation warm-ups lean into competitive games and variety (reactive tag,
mirror-drill races, med-ball games) layered on the iso/plyo/conditioning base;
in-season / taper warm-ups are crisper and more standardized (fixed activation series)
so nothing steals CNS from the sharpening work.

## 4. Content model (how drills attach to blocks)

Team-practice drills live in the **existing `exercises` table** (one library, one
source of truth). They are tagged so the generator can pull a block cleanly:

- `category` — one of the canonical lowercase sections (`warm_up`, `skill_drills`,
  `speed`, `conditioning`, `cool_down`).
- `subcategory` — **the practice block key** (new use): `team_warmup`, `wr_block`,
  `db_block`, `routes_coverage`, `team_install`, `qb_center_post`,
  `blitzer_cooldown`, `team_cooldown`. This is the generator's `.eq('subcategory', …)`
  handle.
- `position_specific` — `text[]` position codes (`wr_db`, `quarterback`, `center`,
  `blitzer`, `rusher`, `linebacker`) so a block can be filtered to a group.
- `tissue_targets` / `loading_rate_band` / `evidence_tier` — same tissue-load spine as
  every other drill, so a team-practice day still feeds ACWR/CNS/tissue accounting
  (an all-player WR block of cutting drills IS real cutting load and must be counted).

No new table. The builder is extended to allow a **family-level `subcategory`** so a
whole block-family carries its block key.

## 5. Load accounting (the part that keeps it safe)

A team practice is not free. Every block's drills carry `load_contribution_au`,
`loading_rate_band`, and `tissue_targets`, so:

- The team-practice day contributes to the athlete's **ACWR** and **tissue load** like
  any session — no silent load.
- `isHighCnsSessionType` already flags cutting/sprint/jump-land drills as high-CNS at
  volume; the taper framings above deliberately shrink those blocks near competition.
- The **individual injury/deconditioning guards** still apply: an athlete flagged for
  a graded injury gets the block plan but with unsafe drills filtered and load scaled,
  exactly as the individual engine already does (`resolveInjuryResponse`).

## 6. Open product decisions (proposed defaults — override any before the engine ships)

These change training decisions, so they get flagged rather than silently chosen:

1. **Surface** — the practice-plan generator is **coach-facing** (a staff builds/prints
   the team practice for a date; athletes see their block plan + personal load for that
   day). _Default: coach-facing, athlete-visible._
2. **Ratio table (§3)** — the minute splits per framing above are the proposed default.
   _Default: as tabled; tune the numbers, not the structure._
3. **"All players run WR then DB drills"** — the user's model has the whole team run
   both position blocks (cross-training skill). _Default: honour it — position tags
   filter emphasis/coaching cues, but the block is run by everyone; QBs/specialists peel
   off for the post-practice specialty._
4. **2nd-practice / technical-day variant** — the 1×/week 1.5–2 h technical day uses the
   `own` shape but with the indy blocks doubled and the team block dropped. _Default:
   a `technical` framing row (RPE7, 110 min, indy-heavy, no 5v5)._

## 7. Build status / ledger

- **Done:** blueprint (this doc); category taxonomy normalized to one value per section
  (migration `20260712140000`); tissue-load + position + neuromuscular content live
  (746 drills as of 2026-07-12).
- **In progress:** team-practice drill families (block content) → library toward 1000.
- **Next (needs the §6 nods):** the practice-plan realization generator + its parity
  tests, wired to the existing intent engine and the schedule's peak/high events.
