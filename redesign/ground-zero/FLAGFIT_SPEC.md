# FlagFit Pro — Master Spec (idea · functionality · flow · engine · data · UX/UI)

The single consolidated reference for the rebuild. Detailed docs are linked; this
ties them together. Last updated 2026-06-01.

> **Folders:** `00-wireframes/` (lo-fi + the design/data docs) · `01-system/`
> (Phase C — `tokens.css`, `system.css`, styled `gallery.html`) · `02-hifi/`
> (Phase D — styled pages). Browse: `00-wireframes/wireframes/index.html` (lo-fi)
> and `01-system/gallery.html` (the locked look).

---

## 1. The idea

Flag-football athletes are time-poor and disorganized. The app is **prescriptive**:
open it and know exactly **what to train, eat, drink, and recover today — and
why.** The athlete's **schedule is the spine** (games/tournaments across all their
teams); their **wellness drives readiness and load**; the **engine explains every
call** in one plain sentence. Olympic LA28 horizon. This club is **male athletes
16+** (no youth/women/parent surfaces).

Two halves of the truth:
- **Plan** — the schedule spine + the athlete's RSVP / season calendar.
- **Actuals** — what really happened (wellness logged, sessions completed, games
  actually played: "5 of 8 after a hamstring tweak") — which is what ACWR uses.

---

## 2. Functionality map

**Athlete core (5 tabs):** Today (prescription + check-in + game proximity),
Training (sessions/programs/library), Wellness (check-in → readiness, hydration,
recovery), Stats (ACWR, readiness history, performance), More (hub).
**More hub:** Compete (Competition/RSVP/actuals, Game-day), Recovery & health
(Load·ACWR, return-to-play, sleep-debt), Tools (Merlin AI, Knowledge, Reports),
Me (Profile, Achievements, Notifications, Payments, Settings, Help).
**Onboarding:** identity/position → body → training config + season → privacy.
**Coach/staff (separate role-aware track):** dashboard, planning, roster,
analytics, injuries, program/practice builders, staff specialists, attendance.
**Cut for this club:** cycle-tracking (female-only).
Full route audit: `00-wireframes/IA_AND_PAGE_INVENTORY.md`.

---

## 3. The flow

```
Register (Supabase Auth) → Onboarding (first write creates users row)
   → daily loop:
      open Today → (if not logged) Wellness check-in → readiness
      → Today shows the ONE plan (engine, constrained by safety/weather/season)
      → Train → log RPE+duration → complete  ⇒ training_sessions.workload ⇒ ACWR
      → (around events) RSVP → play → "how many games?" ⇒ competition session ⇒ ACWR
   → Stats/ACWR close the loop; achievements/streaks reward consistency.
```

---

## 4. The engine (what the numbers mean + precedence)

Server is canonical; UI never re-derives. Detail: `00-wireframes/ENGINE_MESSAGING_AND_WIRING.md`.

- **ACWR** (acute:chronic, EWMA uncoupled; load = RPE×min): `<0.8` under · `0.8–1.3`
  **sweet spot** · `>1.3–1.5` elevated · `>1.5` danger. `null ≠ low` (insufficient
  data shows a progress card). Heat scales internal load (below).
- **Readiness 0–100**: `<55` deload · `55–75` maintain · `>75` push (workload 35% ·
  wellness 30% · sleep 20% · game-proximity 15%).
- **Prescription (`prescribeFor`)**: one intent/day + a mandatory **personalized**
  reason (names the athlete's ACWR/readiness). Targets: RPE/min/sprints/sets +
  nutrition (carbs/protein/fluid, shown as **grams + food**, not g/kg).
- **Decision precedence:**
  `physio injury/RTP (absolute) ▷ coach override ▷ WEATHER guard ▷ event-proximity
  micro-phase (taper/competition/recovery) ▷ MACRO season phase ▷ base engine.`
  Only the **winning** plan card renders.
- **Weather** (`WEATHER_LOGIC.md`): wet→relocate/substitute sprints-cuts-plyo;
  heat ≥35 °C no outdoor intense; thunderstorm→stop; heat ≥32 °C **scales load
  ×1.1–1.2** (ACWR truth) + RPE feels ~+1. Open-Meteo (free). Thresholds are
  configurable defaults, **not hardcoded**.
- **Season / macro periodization** (`SEASON_LOGIC.md`): off-season = strength &
  conditioning · pre-season = build · in-season = maintain · transition = rest.
  **The player declares their own from→to windows** (different domestic leagues);
  league schedule only pre-fills. **Zero months in code.**
- **Safety auto-triggers:** pain >3 and ACWR >1.5/<0.8 log overrides; physio block
  is absolute.

---

## 5. Data wiring (what saves where — all verified live)

| Action | Endpoint | Table / RPC |
|---|---|---|
| Wellness check-in | POST `/api/wellness/checkin` | `daily_wellness_checkin` (RPC upsert) |
| Readiness | GET/POST `/api/calc-readiness` | `readiness_scores` |
| Complete session | POST `/api/training/complete` | RPC → `training_sessions.workload` (ACWR feed) |
| Event RSVP | POST `/api/event-availability` | RPC `set_event_availability` → `event_availability` |
| Played games (actuals) | POST `/api/event-participation` | RPC → competition `training_sessions` row |
| Hydration | POST `/api/hydration/log` | `athlete_hydration_logs` |
| Nutrition profile/plan | POST `/api/nutrition/*` | `athlete_nutrition_profiles` / `nutrition_plans` |
| Profile edit | PUT `/api/user-profile` | `users` (whitelist) |
| Onboarding config + season | POST `/api/player-settings` | `athlete_training_config` (+ `season_calendar`) |
| Privacy/consent | PUT `/api/privacy-settings` | `privacy_settings` (+ `team_sharing_settings`) |
| Weather | GET `/api/weather` | Open-Meteo (live, no table) |

Unbuilt/divergent write paths are registered in `redesign/PORT_BUG_REGISTER.md`
(officials, equipment, depth-chart, scouting, push, etc. — build per feature).

---

## 6. UX rules (laws — `00-wireframes/UX_RULES.md`)

1. Answer first, context second, history third. 2. One winning card, never stacked
variants. 3. Ordering matches data dependency (not-logged → check-in leads, plan
provisional). 4. Personalize the reasoning. 5. Metric literacy — every number gets
a plain-language verb. 6. Nutrition as food, not g/kg. 7. Always offer back/undo.
8. Honest empty/guarded states (null ≠ low).

---

## 7. UI rules (the visual system — `01-system/`)

- **Tokens** (`_shared/tokens.css`): two-tier (primitives → semantic). Dark-default
  — bg `#08090B`, accent `#00E07A`, state colors (good/caution/danger/info).
  **Space Grotesk** (display) + **Plus Jakarta Sans** (body). **8pt grid**. Radii
  8/12/16/22/pill. Subtle dark elevation. Optional light theme = token swap only.
- **Components** (`system.css`): buttons, chips/bands (state-colored), cards/hero,
  metric + radial gauge, stat tiles, sliders, list rows, context strip, empty,
  top bar (🔔 + avatar), **5-tab bar**. Screens assemble **only** from these.
- **Anti-drift contract:** new need → add to the gallery first, never bespoke
  per-screen styling. One `tokens.css`, no competing families.
- Brand note: `#00E07A` is the locked accent; the old v4 `#089949` can be swapped
  in one token if preferred (that's the point of tokens).

---

## 8. Navigation / IA (decided)

5 bottom tabs: **Today · Training · Wellness · Stats · More.** Top bar carries
🔔 Notifications + avatar→Profile/Settings on every screen. Competition/Game-day
also surface contextually on Today near an event. Coach/staff = separate role-aware
nav.

---

## 9. Build status

| Phase | State |
|---|---|
| Backend audit/consolidation (A–F + perf + write-path) | ✅ done; test:backend 348 green; `database.types.ts` current |
| A — preserve & demolish | ✅ (UI deleted, engine kept, shell builds) |
| B — wireframes + data/engine wiring | ✅ (15 screens + gallery + 5 design/logic docs) |
| C — design system (`tokens.css` + styled gallery) | ✅ this round |
| D — hi-fi static pages | ◧ started (Today); apply tokens to the rest |
| E — port to Angular (mechanical, per screen, reuse engine) | ⏳ pending sign-off |
| F — responsive validation (Playwright vs hi-fi) | ⏳ |

**Open items:** finish Phase D for the remaining screens; implement the weather +
season inputs in `periodization.service.ts` (configurable, no hardcoding) with
spec/regression tests; coach track wireframes; then E/F. User actions outstanding:
enable leaked-password protection; set `DEV_SUPABASE_*` CI secrets.

---

## 10. Source docs

`00-wireframes/`: `README.md` · `UX_RULES.md` · `IA_AND_PAGE_INVENTORY.md` ·
`ENGINE_MESSAGING_AND_WIRING.md` · `COMPONENT_INVENTORY.md` · `WEATHER_LOGIC.md` ·
`SEASON_LOGIC.md` · `wireframes/*.html`. `01-system/`: `tokens.css`(in _shared) ·
`system.css` · `gallery.html`. `02-hifi/`: styled pages. Repo: backend audit +
`redesign/PORT_BUG_REGISTER.md`; engine contract `docs/ENGINE_CONTRACT.md` +
`docs/PRESCRIPTION_SPEC.md`.
