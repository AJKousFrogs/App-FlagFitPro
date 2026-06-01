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

## B. CTA → endpoint → table (what saves where)

### Onboarding / profile / settings
| CTA | Endpoint | Saves to |
|-----|----------|----------|
| Create account | Supabase Auth SDK (client) | Auth; `users` row created lazily on first write |
| Save onboarding profile (position, DOB, equipment, availability, routine) | POST `/api/player-settings` | upsert **`athlete_training_config`** + `users.date_of_birth` |
| Privacy / consent (AI, research, sharing) | PUT `/api/privacy-settings` | upsert **`privacy_settings`** (+ reads `team_sharing_settings`) |
| Notification prefs | PUT `/api/notifications/preferences` | **`user_notification_preferences`** |

### Today / Wellness
| CTA | Endpoint | Saves to |
|-----|----------|----------|
| Submit wellness check-in | POST `/api/wellness/checkin` | upsert **`daily_wellness_checkin`** (RPC `upsert_wellness_checkin`); side: `update_player_streak`, `award_achievement`, team `shared_insights` |
| (auto) Readiness | GET/POST `/api/calc-readiness` | upsert **`readiness_scores`** (user_id, day) |
| Record post-event participation (attended? games? minutes? RPE?) | POST `/api/event-participation` | RPC **`record_event_participation`** → writes a `session_type='competition'` row in **`training_sessions`** (feeds ACWR) |
| Log hydration | POST `/api/hydration/log` | insert **`athlete_hydration_logs`** |

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
→ `player_achievements` + `achievement_definitions` + `player_streaks`.

---

## C. ⚠ Broken / missing backend paths — DO NOT wire a save CTA to these yet

1. **Nutrition (profile / plan / meals)** — handlers target
   `athlete_nutrition_profiles`, `nutrition_plans`, `meal_templates` which **don't
   exist**. → For Phase B, design nutrition as **prescription-derived display
   only** (A5). A "save my meal plan" CTA needs the tables built first.
2. **Event availability / RSVP** — there is **no backend write** for
   `event_availability`; it's read-only. An "RSVP / I'm in" CTA has nowhere to
   save. → Either add a write endpoint (recommended — it's the *plan* side of the
   plan-vs-actuals model) or omit the RSVP CTA until it exists.
3. **Generic profile edit (height/weight/position on `users`)** — no write
   endpoint; only `player-settings` (→ `athlete_training_config`). → Route profile
   edits through `player-settings`, or add a `users` update endpoint.
4. **`user-context` wellness block** reads dead `wellness_checkins` → always null.
   Cosmetic for AI context; repoint to `daily_wellness_checkin` at port.

> These four are also in `redesign/PORT_BUG_REGISTER.md`. Wireframes mark any CTA
> touching them as **⚠ NO-WIRE** so we don't design a dead button.
