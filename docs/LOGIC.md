# FlagFit Pro — Logic & Decision Rules Reference

**Purpose.** The *decision rules, control flow, precedence, and workflows* of the
app — the "what happens when," as opposed to the "what the numbers are." Its
sibling `CALCULATIONS.md` owns the formulas/constants; this file owns the
**if-this-then-that**. `SOURCE_OF_TRUTH.md` owns schema/endpoints/status.

**How to trust this file.** Written FROM the code. When it disagrees with the
code, the **code wins** — fix this file in the same pass. As of **2026-07-13**.

---

## 0. The two-engine COMPOSE contract (D10) — the spine

Everything the athlete sees flows through **two engines, in one direction:**

```
  PERIODIZATION (intent)              →   DAILY-PROTOCOL (realization)
  periodization-engine.ts / port          daily-protocol*.js
  "WHAT kind of day + how hard/long"      "the concrete exercises/blocks"
        (rest / sprint / mixed / …)          (warm-up, main session, cool-down)
```

- The periodization engine decides the **intent** (a `PrescriptionIntent`) + its
  targets. The daily-protocol layer **realizes** that intent into a session.
- `daily-protocol-compose.js#mapIntentToSession(intent)` maps each intent to a
  `trainingFocus` (`practice_day`, `speed`, `strength`, `conditioning`,
  `recovery`, `mobility`, `rest`, `travel`, `competition`).
- **Low-load days get NO main session:** `isLowLoadFocus(focus)` (rest, recovery,
  mobility, travel, competition) returns before any training block is built
  (`generateMainSessionFallback`) — so a "Rest day" can never render a sprint
  block (the 2026-07-13 bug fix). The intent OWNS the rationale descriptor — a
  day-of-week `training_session_templates` row can't override the hero.
- **The intent owns the gym-day BLOCK SHAPE (2026-07-14):**
  `gymBlockPlanFor(trainingFocus)` (daily-protocol-compose) decides which blocks
  compose a gym day — strength / mixed / technical are no longer the identical
  five-block dump. strength → DOP isometrics + strength-led main (no field
  conditioning, no skill stations, no plyo block); conditioning (the "Mixed
  session") → DOP + plyo + reduced strength + real conditioning; skill → DOP +
  skills-led main. Every gym day keeps the isometrics block — that is the
  injury-prevention (DOP) slot.
- **NMT / ACL-prevention block (2026-07-14, audit §1.3):** individual quality
  days (strength / sprint / mixed) append a ~10-min neuromuscular-training
  segment to the warm-up (`NMT_PREVENTION_SEGMENT`: hop-and-stick, single-leg
  balance, drop-land mechanics, decel-to-stop, Copenhagen — Nordic already
  present). FIFA-11+-class NMT roughly halves ACL injury in female athletes;
  the flag-direct anchor is Grewal 2025 (87% of girls'-flag knee surgeries
  non-contact ACL, 2/24 had done ANY prevention). Default-on; compliance rides
  the existing per-exercise check-off. Recovery/skill/practice days skip it.
- **A DOW template must EARN its day (2026-07-14):** `templateMatchesFocus`
  gates `training_session_templates` — the template runs only when its
  `session_type` belongs to the day's focus family, never on a low-load day,
  and never stacked onto a gym day whose split blocks are already the session
  (the "Tuesday agility template on a Strength day" production bug). A template
  with no session_type can't prove relevance → skipped, logged.
- **Rule:** realization never re-decides the intent; it only dresses it. If the
  hero says "Mixed session," This Week and the realized protocol say the same.

---

## 1. `prescribeFor()` — daily precedence pipeline

One day's prescription is built by applying guards **in a fixed precedence order**
(`periodization-engine.ts`). Order matters — a later guard overrides an earlier one:

```
1. base intent        seasonShapedIntent / pickAccumulationIntent / weeklyIntentHint
2. CNS-recovery        recent high-CNS session → suppress new high-CNS (§8)
3. weather guard       WBGT × duration × intensity → scale/relocate/stop (§5)
4. arrival-day cap     ≥3 h travel arriving today → activation only
5. injury / physio     HIGHEST training precedence — removes affected work (spec law)
6. position emphasis   accessory/prehab guidance only — never changes intent/load
7. time-shift attach   advisory "train later when cooler" (§6)
```

**Why this order:** safety climbs. Weather (a storm's "stop") beats a travel cap;
injury/physio beats everything about training load (you never train a hurt region
regardless of the plan); position is cosmetic so it's last but for the time-shift
advisory. A **storm stop** is the single most restrictive outcome and wins outright.

**Higher-priority day-level overrides** (in `decideBasePrescription`, after the
fixed commitments — game day and the ≤24h taper-prime — but before travel/
practice/season logic): **ACWR danger** (> 1.5, `ACWR_DANGER`) forces full rest,
and **readiness collapse** (< 55, `READINESS_LOW`) forces active recovery — a
bad-signal day is never pushed. (The 75 / 1.2 pair gates SECOND sessions only,
§2 pass 4 — it does not demote a day. See CALCULATIONS §7.)

---

## 2. `planWeek()` — week-level orchestration (single source, client + server)

The week is planned **once**, by the shared engine, so Today (`weekAhead()[0]`),
This Week (`weekAhead()`), the COMPOSE intent, and the `/api/periodization-
prescription` server all read ONE computation — drift is structurally impossible.

Passes, in order:
1. **`planWeekIntents`** — places sessions **around the athlete's REAL practice
   days** (anchors), phase-shaped. NOT a hardcoded weekday template: a player with
   Mon/Wed/Thu practices and one with Tue/Fri/Sun get different placements. Free
   days (including off-season `transition` days) are filled per the season's
   `phaseSessionModel` (off-season = GPP **rotation strength → technical →
   sprint → strength → mixed** — sprint exposure is year-round since 2026-07-14,
   the old "no off-season sprints" rule is retired; pre-season = strength+sprint
   build; in-season = maintain+skill, low sprint; peak = sharp+rest;
   transition/post = active regeneration). **Selection allows up to 2 adjacent
   training pairs, never 3 days in a row** — under the old blanket
   no-consecutive rule the 5-active-day budget was mathematically unreachable in
   an anchor-less week (any 5 days in 7 contain ≥ 2 adjacencies), so every
   off-season week silently became 4-on/3-off. Canonical 5-day shape: 2-2-1.
   A rotation intent that would put two high-CNS days (sprint/mixed)
   back-to-back is deferred (technical fills the slot).
2. **Sprint-exposure floor (2026-07-14, audit §3.2)** — before realization: if
   the athlete has had NO high-speed exposure (sprint/mixed session, practice,
   or game) in ≥ 7 days AND this week plans none, the earliest planned
   technical/mobility slot becomes a SHORT velocity-maintenance day (≤60 min,
   ≤5 relaxed 20-30 m builds — the "speed vaccine"). Safety guards still run on
   top; a guard demotion stands and the day then says "exposure postponed — add
   4-6 relaxed strides when fresh" instead of silently dropping speed. Logged
   sessions with none high-speed → floor at 14 days; ZERO logged sessions →
   null → no floor (no fabricated exposure).
3. **`prescribeFor × 7`** — each day realized through the §1 pipeline.
4. **`enforceWeeklyRestMinimum`** — **≥ 2 full rest days is non-negotiable**
   (soft-tissue recovery). If short, it DEMOTES the lowest-value active days to
   rest by `DEMOTION_PRIORITY` (taper-prime leads — it's the most natural rest in
   a loaded week).
5. **`addSecondSessions`** — a PM second session, **preseason/offseason only**,
   **never on a practice day**, **≤ 2 per week** (so the ceiling is 5 training
   days + 2 doubles = 7 sessions — the flag-football weekly max; taper/
   tournament logic pulls it down near events), and blocked when today's
   readiness < 75 or ACWR > 1.2. The PM is a **sprint** after morning strength
   ("morning strength, evening sprint") unless a practice OR a planned high-CNS
   day (sprint/mixed) sits tomorrow or sat yesterday — then technical, so a
   19:00 PM sprint is never ~14 h from another high-CNS session.
6. **`applyMesocycleWave` (2026-07-14, audit §3.1)** — the 3:1 volume wave,
   applied last (so a deload also strips PM doubles): weeks 1-3 build volume
   (+0/5/10%), week 4 deloads (−35%, **intensity held** — the taper's
   volume-not-intensity principle). Only quality sessions on free
   accumulation/transition days wave; practice and event-driven days never do.
   Week index derives from the athlete's declared off-/pre-season window start
   (`mesocycleWeekFor`, shared client/server); no declared build window → no
   wave (nothing fabricated).

---

## 3. Phase resolution — the decision tree

`resolvePhase(date, upcoming, lastEvent)` (schedule.js ≡ schedule-resolver.ts)
decides the game-proximity micro-phase by checking, in order:

```
if inside an event window   → competition (weekend/international) | travel
elif inside recovery window after a heavy last event → recovery   ← wins over taper
elif inside taper window before next event           → taper
elif no event within 14 days                         → transition
else                                                 → accumulation
```

- **Recovery beats taper on purpose:** a heavy weekend's fatigue must clear before
  "sharp, not heavy" taper framing makes sense.
- **Importance floors** (`effectiveImportance`): a `world`/`olympic` event tapers
  like a peak event even if the coach forgot to flag importance — the tier raises
  it, never lowers a coach's declaration.
- **Season macro-phase** (`macroPhaseFor`) sits ABOVE this: it refines a
  non-event "build" week (off/pre/in/peak/post), and returns `null` for an empty
  `season_calendar` (no fabricated season → the honest "no season plan set" note).

---

## 4. Taper — two-layer resolution logic

- The engine runs the taper on a **materialized `TaperRuleset`**, never raw DB rows.
- Resolution: `inputs.taperRuleset ?? EMBEDDED_TAPER_RULES`. The server hydrates
  the live `taper_rules` (active rows, matching `version`) into that exact shape;
  it **falls back to embedded** when the read fails, the vocabulary is incomplete,
  or any value is malformed — a partial/absent live policy can never weaken the taper.
- `resolveTaperTargets`: hold intensity (RPE ≈ baseline × intensityRetention,
  always a **sprint** — never mobility), cut volume (× volumeFloorPct, deeper
  `× 0.66` in the final third). Level chosen by `taperLevelFor(competitionLevel)`.
- **Taper-prime** (≤ 24 h) is a separate branch: the game-eve opener, short + a few
  velocity strides, not a taper block.

---

## 5. Weather guard — branch priority logic

`applyWeatherGuard(rx, weather, coachOverride, acclimatizationDay)`:

1. **Gate:** only `HEAT_GUARDED` intents (sprint, mixed, taper-prime, **technical**)
   are guarded at all; everything else returns unchanged.
2. **Metric:** `WBGT` when humidity is present, else the **legacy apparent-temp
   path (byte-identical)** — and the message says which ("29°C WBGT" vs "33°C
   feels-like"). No fabricated humidity.
3. **Branch order (first match wins):**
   ```
   storm (WMO 95-99)            → STOP → recovery
   WBGT ≥ stop (32.2)           → STOP → recovery
   WBGT ≥ relocate (30.0)       → RELOCATE → indoor mobility (live again —
                                  2026-07-14 stricter NATA bands, audit C8)
   wet grass (OUTDOOR_INTENSE)  → SUBSTITUTE → indoor strength/tempo (NOT technical)
   cold ≤ avoid −5° (OUTDOOR_INTENSE) → SUBSTITUTE → mobility
   WBGT ≥ scale (27.8)          → SCALE volume (strain-scaled cut), same intent
   WBGT ≥ caution (25.7) / cold ≤ caution (4°) / wind ≥ 40 km/h → advisory note,
                                  session unchanged
   else                         → unchanged
   ```
   Legacy apparent-temp path (humidity missing): caution 28 / scale 32 /
   relocate 35 / stop 38 — same branch order, different thresholds, and the
   athlete-facing message says which metric was used.
4. **Coach override:** keeps the planned session and records the call — **except a
   storm still warns** (lightning is non-negotiable).
5. **Acclimatization:** while newly arrived at a different climate, every threshold
   tightens symmetrically (heat down, cold up), decaying to 0 by day 14.

### 6. Time-shift logic (Phase 5b)
Attached in `prescribeFor` for an outdoor field session (skipped on injury/rest):
if the **training-hour** WBGT is hot (≥ 30) and a **≥ 1.5° cooler, comfortable
(< 30)** hour exists later the **same day** (≤ 6 h wait, before a 21:00 cap),
suggest the **earliest** such hour. No hourly data / already-fine / no cooler hour
→ no suggestion.

---

## 7. CNS-recovery, injury, and arrival guards

- **CNS spacing:** after a recent high-CNS session (sprint/plyo/max-velocity), a
  new high-CNS day inside the age-scaled window is demoted to technical/mobility
  (RPE ≤ 5). Missing RPE → treated as high-CNS (conservative: the guard never
  under-fires on missing data).
- **Injury/physio:** runs last and wins over training. Sprint under a sprint-
  restriction → mobility; throwing restriction pulls arm-protect guidance even
  when running is fine. Severity caps RPE/volume (see CALCULATIONS §10).
- **Arrival cap:** ≥ 3 h of travel arriving *today* caps the session to activation
  only — no new fatigue on top of the trip. Runs after weather (a storm stop is
  more restrictive) but before injury.

---

## 8. Self-report → recalculation loop (the trust contract)

```
Today "Body check" chips  →  InjuryService.report()  →  POST /api/athlete-injuries
     (today.component)          (same path as Wellness)        → athlete_injuries row
                                                                       ↓
   calc-readiness injuryPenalty  ←  readiness recompute  ←  the write lands
```

- The "Logged … coach notified" copy renders **only after** the `athlete_injuries`
  write succeeds (a state machine `idle/saving/saved/error`) — never a fabricated
  success claim (Law 7). Failure shows an error, never navigates away.
- High soreness (≥ `HIGH_PAIN_THRESHOLD`) with no region flagged **prompts** a body
  check rather than silently changing the session — the slider alone doesn't move
  the plan.
- **Log-practice nudge:** a today/yesterday team-practice day with no logged
  session prompts the athlete to log it, so its REAL load reaches ACWR. Suppressed
  once a session for that day exists. Never estimates load.

---

## 9. Readiness data-mode logic

`determineDataMode`: if wellness **completeness ≥ 60%** → **full** mode (all
components weighted). Below that → **reduced** (sleep-proxy) mode — sleep stands in
for broader wellness rather than penalizing a thin check-in. The mode is surfaced
so the athlete knows why a score is what it is.

---

## 10. ACWR population / cohort / safe-direction logic

**Cohort assignment is DERIVED (2026-07-14, audit §4.1)** — `derivePresetId`:
active RTP protocol → `return_to_play_v1` (0.7/1.1/1.3) · age < 18 →
`youth_flag_v1` (0.8/1.2/1.4) · age ≥ 35 → `masters_flag_v1` (0.8/1.2/1.4,
heuristic tier) · else/unknown age → adult (0.8/1.3/1.5). Age from the shared
`ageYearsFromUserMetadata` (same source as the engine's CNS age-scaling). An
explicit `setActivePreset()` override wins until cleared. Competitive tier
never changes safety thresholds.

**The backend readiness score is COHORT-AWARE since 2026-07-14 (batch 4 —
the migration this section used to point at):** `calc-readiness` resolves the
athlete's cohort server-side (`utils/cohort.js` — same derivation rule +
thresholds as the client, byte-equality drift-guarded in
`acwr-config-drift.test.js`) and scores the workload component + safety
trigger against the cohort's bands. Resolution failure → adult baseline,
never a blocked calculation. **Display lanes without an athlete context**
(load-management, smart-training-recommendations, the compute-acwr series)
stay on the adult `classifyAcwrZone` default; the client tightens those per
the safe-direction rule (stricter allowed, laxer never). The engine's own
day-0 ACWR-danger override also remains adult (1.5) — parity-locked; a
cohort-aware engine threshold is a future parity-suite change.

### 10b. QB throwing monitor (2026-07-14, audit §5)

Flag QBs are NOT pitchers (their injuries are predominantly contact — which
flag deletes), so there is NO pitch count. `QB_THROW_MONITOR`: flag a
week-over-week throw-volume jump > 1.4×, and an in-session arm-feeling drop
≥ 2 (before → after) — the fatigue stop-cue is the arm's own signal and
accuracy falloff, never a borrowed cap. Youth (< 18, via the derived cohort)
is the exception where overuse is real: ≤ 1.2× weekly ramp + ≥ 2 full
no-throw days/week guidance. Arm PAIN is a clinician call, not an app rule.

---

## 11. Consent & role gating logic (health-data safety)

- Many Netlify functions run as **service-role** (bypass RLS), so **application-
  level** guards are the real gate — RLS is the backstop.
- Staff lanes (`/api/coach-*`, `/api/staff-*`, monitoring) resolve role from the
  authoritative `team_members` (active, same team) via `lensForRoles`:
  physiotherapist / coach → full clinical lens; nutritionist / psychologist →
  their own lanes; player → own data only.
- **Consent gates** ride on top: raw **bloodwork** (special-category medical data)
  is athlete-consent-gated even on the full clinical lens
  (`check_health_sharing`); wearable rows self-filter to `consent_state='granted'`.
- Self-declared staff joining a team land `pending_approval` with **no** health-
  data access until approved; owner/admin can't be self-granted.

---

## 12. Single day-truth logic (why nothing can disagree)

The bug this design kills: the Today hero once showed "Mixed session" while This
Week showed "Rest" for the same day, because a single-day server prescription and
the week planner computed the day differently. Now:

- `planWeek()` is the ONE orchestration; `today = weekAhead()[0]`.
- The server endpoint assembles a 7-day window and runs the **identical** ported
  `planWeek`, returning day 0.
- Guaranteed by `periodization-port-parity` (client engine ≡ server port,
  byte-identical) — so Today, This Week, the COMPOSE intent, and the server can
  never disagree about a day. The standalone single-day server prescription is
  retired as an authority (kept only as a runtime drift canary).

---

*Maintenance:* when you change a decision rule, guard order, or workflow in code,
update its section here in the same commit. A rule in this file the code
contradicts is a bug in this file. See `CALCULATIONS.md` for the numbers each rule
uses, and `SOURCE_OF_TRUTH.md` for schema/endpoints/status.
