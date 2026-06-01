# IA & Page Inventory — full audit + proposed athlete-first sitemap

Source of truth: the route spec snapshot (`redesign/_reference/routes/groups/*`,
`feature-routes.ts`) and the nav config (`app-navigation.config.ts`). The old app
had **12 route groups, ~90 concrete screens, and ~40 legacy redirects** — the
redirect count alone is the clearest signal of the drift we're rebuilding away
from.

This club is **male athletes 16+**. The athlete is the primary user; coach/staff
is a secondary surface; superadmin is a thin ops surface.

---

## 1. The athlete shell (global chrome)

**Bottom nav — 5 tabs** (DECIDED). Top bar also carries 🔔 Notifications + avatar →
Profile/Settings on every screen.

| Tab | Route | Icon | Purpose |
|-----|-------|------|---------|
| **Today** | `/todays-practice` | calendar | The daily driver — prescription + check-in + game proximity |
| **Training** | `/training` | bolt | Calendar/hub of sessions & programs |
| **Wellness** | `/wellness` | heart | Daily check-in + recovery/load |
| **Stats** | `/performance/insights` | chart-line | Trends, ACWR, performance |
| **More** | `/more` | ⋯ | Grouped hub: Compete · Recovery & health · Tools · Me |

**Top bar:** contextual per section (`headerPreset`: default / dashboard /
training / analytics). Carries: greeting + date on Today; section title + back
elsewhere; a single overflow → "More".

**"More" / side nav (athlete), grouped:** Home (Today, Overview), Athlete
(Training, Wellness, Stats), Team (Team→`/roster`, Chat→`/team-chat`,
Competition→`/tournaments`), Tools (Merlin AI→`/chat`, Knowledge, Reports), Me
(Profile, Notifications, Settings, Help, Achievements).

> **Decision:** keep the 4-tab bottom nav as-is — it's a clean athlete spine.
> Demote "Overview" (`/player-dashboard`) into Today rather than a separate
> destination (see §3).

---

## 2. Full page audit — keep / cut / merge

### PUBLIC (pre-auth) — KEEP, simplify
Landing `/`, `login`, `register`, `reset-password`, `update-password`,
`verify-email`, `auth/callback`, `onboarding`, `accept-invitation`, `terms`,
`privacy`. **Merge:** `reset-password`+`update-password` are one flow (two URLs ok
for deeplinks). **Note:** registration has **no backend endpoint** — it's pure
Supabase Auth client SDK; the `users` row is created lazily on first write. Design
onboarding to make that first write happen early.

### ATHLETE CORE — KEEP (the rebuild starts here)
`todays-practice` (Today), `player-dashboard` (Overview), `training` (Training
hub), `wellness` (check-in), `performance/insights` (Stats), `roster` (Team),
`profile`, `settings`. **Merge:** fold **Overview into Today** (one home), keep
`/player-dashboard` as a deep "full stats" view reachable from Stats.

### ATHLETE SECONDARY — KEEP a focused set, CUT/PARK the rest
- **Keep:** `acwr` (load monitoring — but surface its summary inside Stats/Today),
  `tournaments` (Competition), `game/readiness` (game-day), `game/nutrition`
  (tournament fueling), `achievements`, `knowledge`, `chat` (Merlin AI),
  `team-chat`, `notifications`, `return-to-play`, `sleep-debt`, `playbook`,
  `film`, `calendar`, `payments`.
- **Merge:** the **18 `training/*` sub-tools** (advanced, workout, ai-scheduler,
  log, safety, smart-form, videos, load-analysis, goal-planner, microcycle,
  import, periodization, qb, exercise-library, exercisedb…) collapse into **one
  Training hub with tabs/sections** — most were standalone screens that should be
  panels. `performance/load`/`load-monitoring`/`injury-prevention` already all
  redirect to `acwr`; `goals`→`training/goal-planner`. Honor that consolidation.
- **Cut for this club:** `cycle-tracking` (femaleAthleteGuard — dead here).
- **Guard fix:** `exercisedb` is commented "coach-only" but only `authGuard` — at
  port, gate it correctly.
- **Nutrition backend** — ✅ built (2026-06-01): `athlete_nutrition_profiles`,
  `nutrition_plans`, `meal_templates` now exist (RLS self-scoped). Save CTAs are
  live. Still also show the engine-derived carb/protein/fluid targets from the
  prescription (complementary). See wiring doc §C.

### COACH / STAFF — KEEP as a separate track (not in this Phase B cut)
All `coach/*`, `staff/*`, `attendance`, role-gated. Wireframed after the athlete
core journey is approved. (`coach/dashboard`, `coach/analytics`, `coach/injuries`,
`coach/development` = staffRoleGuard; rest coachRoleGuard.)

### SUPERADMIN — KEEP minimal
`superadmin` + settings/teams/users. Thin ops UI, last priority.

---

## 3. Proposed athlete-first sitemap (rebuild target)

```
PUBLIC
  /                       Landing
  /login /register        Auth (Supabase SDK)
  /onboarding             First-run: profile + first wellness write (creates users row)

APP SHELL (4-tab bottom nav)
  TODAY      /todays-practice
             ├─ Today's prescription (what to do + why)   [prescribeFor]
             ├─ Game proximity / phase countdown          [schedule spine]
             ├─ Wellness check-in entry (if not logged)   [daily_wellness_checkin]
             ├─ Readiness summary                         [calc-readiness]
             └─ Post-event prompt (if pending)            [event-participation]

  TRAINING   /training  (hub with sections)
             ├─ Schedule/calendar of sessions            [training_sessions, v_athlete_schedule]
             ├─ Today's session detail / log+complete     [complete_training_session RPC]
             ├─ Programs                                  [training_programs]
             └─ Library / QB / advanced (tabs)            [exercises, exercisedb]

  WELLNESS   /wellness
             ├─ Daily check-in form                       [daily_wellness_checkin upsert]
             ├─ Readiness result + suggestion             [calc-readiness]
             ├─ ACWR / load card → /acwr                  [compute-acwr]
             ├─ Hydration log                             [athlete_hydration_logs]
             └─ Recovery / RTP / sleep-debt (links)

  STATS      /performance/insights
             ├─ ACWR trend + band                         [readiness-history, compute-acwr]
             ├─ Readiness history                         [readiness_scores]
             ├─ Performance tests/records                 [performance-data]
             └─ Full dashboard → /player-dashboard

  MORE
    Team /roster · Competition /tournaments · Chat /team-chat ·
    Merlin AI /chat · Knowledge · Reports · Achievements ·
    Profile · Notifications · Settings · Help
```

---

## 4. Cross-cutting UX decisions (apply to all athlete screens)

1. **Today is the home.** Open the app → know exactly what to train, eat, drink,
   recover, and whether a game is near. Everything else is secondary.
2. **One check-in, surfaced where it's needed.** The wellness check-in is the
   single most important daily write (feeds readiness + ACWR-adjacent load
   scaling + streaks + achievements). Prompt it on Today if not yet logged.
3. **Show the engine's "why".** Every prescription carries a one-sentence reason
   (`reasoning`) — always render it; it's the trust-builder.
4. **Safety is non-negotiable and visible.** Physio injury/RTP block and ACWR
   danger override the plan — when active, the day's card says so first.
5. **Honest empty states.** Insufficient ACWR data ≠ low ACWR. No wellness log →
   "log to see readiness", not a fake score.
6. **Video has two homes:** (a) exercise demo loops inside session/exercise
   detail, (b) the Film/VideoFeed surface. Hero video only on Landing/onboarding.
   (Placements specified in `ENGINE_MESSAGING_AND_WIRING.md` + the wireframes.)
