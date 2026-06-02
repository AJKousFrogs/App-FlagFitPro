# Engine Messaging & Data Wiring (the designer's contract)

For every athlete-facing surface: **what the engine says** (exact bands, copy,
thresholds) and **how each CTA saves** (endpoint → table/RPC). All tables/RPCs
verified against the live DB. The **server is canonical** — the UI renders server
ACWR/readiness and never recomputes them.

---

## A. What the engine says to the athlete

### A1. ACWR (acute:chronic workload ratio) — the injury-risk signal
Method: **EWMA, uncoupled** (acute = last 7 days; chronic = the 21 days *before*
that, no overlap). Workload per session = **RPE × duration_minutes** (AU). Chronic
floored at 50 AU. Thresholds are **preset-driven** (don't hardcode):

| Band | Range (adult) | Label | What the athlete sees |
|------|------|-------|------------------------|
| Insufficient | ratio = null | "Insufficient Data" (gray) | "Need ~21 days & 12 sessions for a reliable ratio. Keep logging." |
| Under-training | `< 0.80` | "Under-Training" (orange) | "Building base. Gradually add 5–10%/week." |
| Sweet spot | `0.80–1.30` | "Sweet Spot" (green) | "Optimal load — lowest injury risk. Maintain." |
| Elevated | `>1.30–1.50` | "Elevated Risk" (yellow) | "Approaching danger. Cut high-intensity 15–20%." |
| Danger | `> 1.50` | "Danger Zone" (red) | "Highest risk. Reduce 20–30%, skip sprints, recover." |

(Youth preset 1.2/1.4 and RTP 1.1/1.3 exist but are **N/A for this adult club**.)
- **Low-confidence flag** if < 14 days of load data in the 28-day span — show the
  number with a "low confidence" caveat, don't hide it.
- **null ≠ 0.** Insufficient data must render the gray empty card, never
  "under-training". Guard on the server's `lowConfidence` / null ratio.
- Alerts (also notify coach at danger): critical `"CRITICAL: ACWR is {X.XX} - in
  danger zone!"`, warning `"WARNING: ACWR is {X.XX} - elevated injury risk"`, info
  `"INFO: ACWR is {X.XX} - player may lack conditioning"`.

### A2. Readiness (0–100 composite) — "should I push today?"
Cut-points (adult): **<55 = low → deload**, **55–75 = moderate → maintain**,
**>75 = high → push**. Components & weights: workload/ACWR 35%, wellness 30%,
sleep 20%, game-proximity 15%. If wellness completeness < 60% → **reduced mode**
(sleep-proxied) — label as lower confidence.

### A3. Today's prescription (`prescribeFor`) — the headline of Today
One intent/day with a **mandatory one-sentence reason**. Priority (first match
wins): **competition → ≤24h taper-prime → ACWR>1.5 rest → readiness<55 recovery →
phase default**. Intent labels: Rest day · Active recovery · Mobility & technique ·
Skills focus · Sprint focus · Strength session · Mixed session · Pre-game prime ·
Game day. Each carries `targetRpe`, `targetMinutes`, `sprintReps`, `strengthSets`,
`recoveryEmphasis`, and `nutrition` (carbsG/proteinG/hydrationL). Example reason
copy (render verbatim from the engine):
- Game day: *"Game day. Activate, play, refuel between games, sleep tonight."*
- ≤24h: *"Game inside 24 hours. Stay loose and primed — no new fatigue."*
- ACWR danger: *"ACWR {X.XX} is in the danger zone. Full rest today."*
- Low readiness: *"Readiness {N}/100 is low. Active recovery only."*
- Build: *"Build phase. Today is a {intent} day."*

### A4. Schedule phase / game proximity (the spine)
Phases: **competition / taper / recovery / transition / accumulation**, derived
from the nearest high-importance event across **all** the athlete's teams
(`v_athlete_schedule`). Surface a countdown ("Game in 2d 14h — Big Bowl, 8 games")
and let it color the whole Today card.

### A5. Nutrition (engine-derived, per kg/day)
The prescription already outputs carbs (3–8 g/kg by intent), protein (1.8 g/kg),
fluid (35 ml/kg + 1.5 L on game day + 0.5 L heavy density). **Use these** — the
standalone nutrition tables are broken (see C). Show daily targets + a tournament
fueling timeline driven by `expected_game_count`.

### A6. Safety overrides (must obey, in order)
1. **Physio injury / RTP — ABSOLUTE BLOCK** (overrides everything; e.g. no sprint
   pre-clearance). 2. Coach override (until expiry). 3. Nutritionist plan. 4.
   Auto-engine. Auto-triggers: **pain > 3** logs a trigger; **ACWR >1.5 or <0.8**
   logs an ACWR trigger. When a block is active, the Today card leads with it.

### A7. Data-state contract (empty states — design these first)
- No wellness log today → readiness `score:null, suggestion:"log_wellness"`,
  message *"No wellness log for today. Log your wellness to calculate readiness."*
  → Today shows the **check-in CTA**, not a number.
- ACWR insufficient → gray "Insufficient Data" card with progress ("12 of 21 days").
- No schedule → prescription `today = null` → show "No upcoming events" + offer to
  view/add competitions.
- < 2 bodyweight entries → trend "stable" + "log weight" nudge (no fake trend).

---

### A8. Weather constraint (NEW — see WEATHER_LOGIC.md)
Weather is a **constraint layer on the prescribed intent**, not an ACWR input.
Outdoor intense intents (sprint/plyo/agility/conditioning) get **relocated /
substituted / scaled / stopped** by conditions; precedence is physio ▷ coach
override ▷ **weather** ▷ engine. Athlete-facing copy examples: *"Rain on grass —
sprints moved indoors to tempo + strength."* / *"34 °C — no outdoor plyometrics;
hydrate hard, expect RPE ~1 higher."* / *"Thunderstorm — outdoor training
stopped."* Heat ≥32 °C also **scales internal load ×1.1–1.2** (so ACWR reflects
true strain) and flags higher perceived RPE. Thresholds in WEATHER_LOGIC.md
(proposed defaults, pending your confirmation).

### A9. Supplements (NEW — see SUPPLEMENTS_LOGIC.md)
Evidence-based ergogenics (caffeine/creatine/beta-alanine…) are a **daily log**
(in the Wellness check-in) and an engine **context layer — NOT an ACWR input**.
The engine (a) **recommends proportionally to your sprint/power load** from the
spine ("3 sprint sessions → creatine helps"), (b) **flags the caffeine→RPE
confound** (caffeine lowers RPE → that session's sRPE load is marked
lower-confidence; ACWR is never silently rewritten), (c) notes creatine's +1–2 kg
water weight so the bodyweight trend + per-kg nutrition stay honest.

## B. CTA → endpoint → table (what saves where)

### Onboarding / profile / settings
| CTA | Endpoint | Saves to |
|-----|----------|----------|
| Create account | Supabase Auth SDK (client) | Auth; `users` row created lazily on first write |
| Save onboarding profile (position, DOB, equipment, availability, routine) | POST `/api/player-settings` | upsert **`athlete_training_config`** + `users.date_of_birth` |
| Privacy / consent (AI, research, sharing) | PUT `/api/privacy-settings` | upsert **`privacy_settings`** (+ reads `team_sharing_settings`) |
| Notification prefs | PUT `/api/notifications/preferences` | **`user_notification_preferences`** |
| Edit profile (height/weight/position/jersey/bio/…) | PUT `/api/user-profile` | whitelist update on **`users`** (self only) |
| Save nutrition profile | POST `/api/nutrition/profile` | upsert **`athlete_nutrition_profiles`** |
| Save nutrition plan | POST `/api/nutrition/plan` | insert **`nutrition_plans`** (one active/user) |

### Today / Wellness
| CTA | Endpoint | Saves to |
|-----|----------|----------|
| Submit wellness check-in | POST `/api/wellness/checkin` | upsert **`daily_wellness_checkin`** (RPC `upsert_wellness_checkin`); side: `update_player_streak`, `award_achievement`, team `shared_insights` |
| (auto) Readiness | GET/POST `/api/calc-readiness` | upsert **`readiness_scores`** (user_id, day) |
| Record post-event participation (attended? games? minutes? RPE?) | POST `/api/event-participation` | RPC **`record_event_participation`** → writes a `session_type='competition'` row in **`training_sessions`** (feeds ACWR) |
| Log hydration | POST `/api/hydration/log` | insert **`athlete_hydration_logs`** |
| RSVP to a competition event | POST `/api/event-availability` `{competitionEventId,status,reason?}` | RPC `set_event_availability` → upsert **`event_availability`** |
| Log today's supplements (daily, in check-in) | POST `/api/supplements` *(to build — table is read-only today)* | upsert **`supplement_logs`** (row/supplement/day: name, dosage, taken, time_of_day) |

### Training
| CTA | Endpoint | Saves to |
|-----|----------|----------|
| Complete today's protocol exercise/block | POST `/api/daily-protocol/complete[-block]` | update **`protocol_exercises`** (+ `daily_protocols` timestamps) |
| Log / create a session | POST `/api/training-sessions` | insert **`training_sessions`** (`PLANNED`) |
| Complete a session (RPE + duration) | POST `/api/training/complete` | RPC **`complete_training_session`** → sets status + **`training_sessions.workload`** (THE ACWR feed) |

### Stats / reads (no writes)
Schedule GET `/api/schedule` → view `v_athlete_schedule`. ACWR POST
`/api/compute-acwr` → reads `training_sessions.workload`. Readiness history GET
`/api/readiness-history` → `readiness_scores`. Achievements GET `/api/achievements`
→ `player_achievements` + `achievement_definitions` + `player_streaks`. Weather GET
`/api/weather` → Open-Meteo (live, no table) — temp/apparent/precip/wind/condition/
suitability; feeds the prescription weather guard (A8).

---

## C. Backend gaps — status

1. **Nutrition (profile / plan / meals)** — ✅ **BUILT** (2026-06-01). Tables
   `athlete_nutrition_profiles`, `nutrition_plans` (one active/user enforced by a
   partial unique index), `meal_templates` (seeded) now exist, RLS self-scoped,
   `user_id = auth.uid()`. Save CTAs are live: POST `/api/nutrition/profile`,
   POST `/api/nutrition/plan`, GET `/api/nutrition/meals`. (You may still *also*
   show the engine-derived targets from A5 — they're complementary.)
2. **Event availability / RSVP** — ✅ **BUILT** (2026-06-01). New write path:
   POST `/api/event-availability` `{ competitionEventId, status, reason? }` →
   RPC `set_event_availability` → upsert **`event_availability`** (status ∈
   available/unavailable/maybe/tentative/confirmed/declined; auth + active
   team-membership enforced in the DB). This is the *plan* side of plan-vs-actuals.
3. **Generic profile edit** — ✅ **BUILT** (2026-06-01). PUT `/api/user-profile`
   updates a whitelist on **`users`** (full_name, position, secondary_position,
   jersey_number, height_cm, weight_kg, date_of_birth, bio, phone, throwing_arm,
   preferred_units, country, avatar_url), always scoped to the caller.
4. **`user-context` wellness block** reads dead `wellness_checkins` → always null.
   Cosmetic for AI context; repoint to `daily_wellness_checkin` at port. (Still
   open — in `redesign/PORT_BUG_REGISTER.md`.)

> Items 1–3 are wired; design the save CTAs normally. Only #4 remains deferred.
