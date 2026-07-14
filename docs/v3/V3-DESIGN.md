# FlagFit Pro v3 — Design Document

**Status: DRAFT for review — nothing here is built until its Ledger row says so.**
Written 2026-07-14, grounded in the live codebase (engine `periodization-engine.ts`,
`docs/SOURCE_OF_TRUTH.md` verified 2026-07-13, `docs/LOGIC.md`, generated
DATA_MODEL/ENDPOINTS — 176 live tables, 121 functions).

**How to read this.** Every item is tagged:
- **[EXISTS]** — already live; v3 must reuse it, not rebuild it.
- **[EXTEND]** — live but partial; v3 finishes or generalizes it.
- **[NEW]** — genuinely new in v3.

The single most important finding from the gap analysis: **most of the v3 brief
already exists.** The two-engine contract, `planWeek` single-source, all seven
guards, consent gating, monitoring lanes, nutrition tables, body-comp tables,
parental-consent tables — live or schema-ready. The genuinely new surface is
small: the **safety-config extraction + `CALCULATIONS.md`**, **guard traces + an
engine inspector**, the **menstrual-cycle module**, **visual staff dashboards**,
and the **organizations layer**. v3 is a completion-and-hardening release, not a
rewrite.

---

## Phase 0 — Context & Principles

### 0.1 What the core already is [EXISTS]

**Two-engine COMPOSE contract (D10).** Periodization decides *intent*
(`PrescriptionIntent`: rest/recovery/mobility/technical/sprint/strength/mixed/
taper-prime/competition/travel + targets); daily-protocol *realizes* it into
blocks (`mapIntentToSession` → `trainingFocus`; `isLowLoadFocus` days get no main
session). Realization never re-decides intent. See `docs/LOGIC.md` §0.

**One week computation.** `planWeek()` in the shared pure engine
(`angular/src/app/core/services/periodization-engine.ts`, generated server port
`netlify/functions/utils/periodization-engine.js`, byte-identical on a 29-case
golden matrix). Today = `weekAhead()[0]`; This Week, the COMPOSE intent, and
`/api/periodization-prescription` all run the identical function. The server
endpoint is a runtime drift canary, not the render source (Law #6, §5a).

**Guard precedence (per-day, order is the safety model):**
base intent → CNS spacing → weather (WBGT×duration×intensity) → arrival-day cap
→ injury/physio (highest training precedence) → position emphasis → time-shift
advisory. Week passes: `planWeekIntents` (anchors on real practice days) →
`prescribeFor`×7 → `enforceWeeklyRestMinimum` (≥2 full rest days, demotion by
`DEMOTION_PRIORITY`) → `addSecondSessions` (off/pre-season only, never on a
practice day, gated readiness ≥75 AND ACWR ≤1.2).

**Single-source numbers (current locations).** ACWR bands come from
`core/config/evidence-presets.ts` (`ADULT_FLAG_COMPETITIVE_V1`: sweet spot
0.8–1.3, danger >1.5; uncoupled EWMA 7d/21d mirrored in `utils/acwr.js`).
Readiness is server-computed (`calc-readiness.js` → `readiness_scores`;
`READINESS_LOW = 55`). Weather: WBGT caution 27.8 / scale 30.0 / stop 32.2
(legacy apparent-temp 28/32/35/38). CNS window 48h age-scaled. Arrival cap ≥3h.
Taper: intensity retention ≥0.90, volume floor 0.40–0.60, materialized
`TaperRuleset` with embedded fallback.

**Stack.** Angular 22 standalone/zoneless/signals, **no PrimeNG**, feature
screens as direct children of `angular/src/app/` (no `features/` dir). Netlify
Functions ESM `export const handler` at `/api/*` via **explicit per-function
redirects** (a new function without its redirect silently returns the SPA — the
`team-join` lesson). Supabase Postgres/Auth/Realtime/Storage; many functions run
service-role, so **app-level guards are the real gate, RLS is the backstop**
(LOGIC §11). Docs: `SOURCE_OF_TRUTH.md` (schema/endpoints/status) + generated
DATA_MODEL/ENDPOINTS + `LOGIC.md` (decision rules).

### 0.2 The honest gap list (what v3 actually adds)

1. **`CALCULATIONS.md` does not exist.** `LOGIC.md` and this brief both cite it
   as the formulas/constants sibling — it was never written. Worse, constants
   currently live in ≥3 places (engine consts, `evidence-presets.ts`,
   `calc-readiness.js`) and prose about them has already drifted once (the
   LOGIC.md WBGT band mislabeling fixed 2026-07-14). → Phase 2.
2. **No structured guard traces.** Explanations exist but as ad-hoc fields
   (`weatherAdjustment`, `injuryAdjustment`, `cnsRecoveryAdjustment`, …) each
   rendered separately. No uniform trace, no inspector. → Phase 2.
3. **Population presets are orphaned.** `EvidenceConfigService.activePresetId`
   is hardcoded to adult; `setPreset()` has zero callers; backend is
   population-blind (LOGIC §10, SOT §5a). → Phase 2.
4. **Nutrition is PARTIAL** (tables + `nutrition.js` exist, no athlete screen);
   **no body-comp goal / performance-range UX** (`physical_measurements` +
   `athlete_nutrition_profiles` exist unused for this). → Phase 3.
5. **No menstrual-cycle module at all** — no tables, no code. The one genuinely
   green-field domain. → Phase 4.
6. **Staff surfaces are lists, not dashboards** (`team-monitoring/`, `staff/`,
   `monitoring-report/` exist; coach suite PARTIAL; no charts beyond the Stats
   load heatmap). No schedule what-if. Team `competitions` still have **zero
   write endpoints** (V2.4 gap). → Phase 5.
7. **No organizations layer.** Teams are top-level; no club/federation entity,
   no org-configurable policy (today's "coach → full clinical lens" is a
   hardcoded club-owner directive). Minors tables exist but nothing is wired.
   → Phase 6.
8. **Ingest is orphaned by design** (`wearable-health-ingest`,
   `session-load-import` have no UI/providers wired). → Phase 7.

### 0.3 Design principles for v3

1. **Safety-first, precedence-explicit.** New logic enters the engine only as a
   guard with a documented precedence slot in LOGIC §1, same commit. Hard floors
   (storm stop, injury precedence, ≥2 rest days) are never overridable; soft
   overrides are logged (`safety_override_log`).
2. **One number, one owner.** Every constant a user can feel lives in the
   safety config and is *generated* into `CALCULATIONS.md` — prose never
   hand-copies a number again (CLAUDE.md §4, mechanized).
3. **Advisory before restrictive for female health.** Cycle data informs and
   educates; it changes prescriptions only via the athlete's own logged
   symptoms flowing through the *existing* wellness→readiness pipeline. No
   blanket phase rules (evidence doesn't support them — see §Trade-offs).
4. **Non-judgmental, performance-framed communication.** Weight ranges are
   guidelines for speed and joint health, presented next to what the athlete is
   already good at. Food-first nutrition language (Law #3). Never shame, never
   cosmetic framing.
5. **Privacy by construction, not by filter.** The engine never receives cycle
   fields; coach lanes never join cycle tables; aggregates are k-anonymous
   (n≥5) and consent-classed. Sensitive data that never enters a pipeline can't
   leak from it.
6. **Visual over tabular** — but honest: every chart renders from the same
   single-source calculations, shows real data or an explicit empty state
   (Law #7), and keeps CSV export available.
7. **Existing laws carry forward unchanged** (P0 write failures, injury
   precedence, answer-first Today, prefill/non-destructive forms, no fabricated
   data, equipment gate, self-report→recalc).

### 0.4 User groups

- **Athletes** (adult men and women; individual or team-affiliated). U18 is
  explicitly **out of v3.0 scope** — module-gated off, see Phase 6.
- **Teams** — club/domestic (Ljubljana Frogs is the live tenant) and national
  teams (adults first).
- **Staff** — head/positional coach, S&C, physiotherapist, sport psychologist,
  nutritionist (roles already exist in `team_members`/`staff_roles`).
- **Org admins** — club/federation administrators managing teams, staff
  approval, policy, and compliance. [NEW as a first-class role]

---

## Phase 1 — Domains, Entities & Roles

### 1.1 Domain → storage map

| Domain | Tables (live names) | Status |
|---|---|---|
| Training & periodization | `training_sessions`, `athlete_training_config`, `v_athlete_schedule`, `athlete_events`, `competition_events`, `event_games`, `taper_rules`, `readiness_scores` | [EXISTS] |
| Recovery & wellness | `daily_wellness_checkin`, `recovery_protocols/_blocks/_sessions`, `athlete_injuries`, `v_injuries_unified`, `return_to_play_protocols`, `athlete_travel_log` | [EXISTS] |
| Nutrition & body comp | `athlete_nutrition_profiles`, `nutrition_goals/_logs/_plans/_reports`, `meal_templates`, `athlete_hydration_logs`, `physical_measurements` (+ `_latest` view) | [EXTEND] |
| Female health | `cycle_tracking_profiles`, `cycle_logs` | [NEW] |
| Monitoring & analytics | `bloodwork_*`, `wearable_health`, `wearable_consent`, `session_load`, `external_load_metrics`, `monitoring_config/_providers`, `device_pairings`, `coach_analytics_cache`, `team_insights` | [EXISTS/EXTEND] |
| Communication & reporting | `channels`, `chat_messages`, `notifications`, `push_subscriptions`, `monitoring-report` lane | [EXISTS] |
| Org/admin & permissions | `teams`, `team_members`, `staff_roles`, `role_change_audit`, `superadmins`, `approval_requests`; **[NEW]** `organizations`, `teams.org_id`, `org_settings` | [EXTEND] |
| Consent & privacy | `athlete_consent_settings`, `consent_access_log`, `privacy_audit_log`, `privacy_settings`, `account_deletion_requests`, `parental_consent`, `parent_guardian_links`, `youth_athlete_settings`, `user_age_groups` | [EXISTS/EXTEND] |

Rule restated for v3: canonical names are `daily_wellness_checkin`,
`athlete_injuries`, `training_sessions`. New code never invents parallel tables
for these concepts.

### 1.2 New entities (TypeScript, engine-style plain data)

```ts
/** Org layer (Phase 6). */
interface Organization {
  id: string;
  name: string;
  kind: "club" | "federation" | "academy";
  /** Org-wide policy knobs; every key has a safe default. */
  settings: OrgSettings;
}
interface OrgSettings {
  /** Which staff roles get the full clinical lens. Default: physio only.
   *  Ljubljana Frogs keeps its owner directive by config: ["physiotherapist","coach"]. */
  clinicalLensRoles: StaffRole[];
  /** Months to retain raw health logs before rollup/deletion. */
  healthRetentionMonths: number;   // default 24
  cycleModuleEnabled: boolean;     // default true (adults), forced false for U18
  weightGuidanceEnabled: boolean;  // default false — explicit org opt-in
}

/** Cycle module (Phase 4). Athlete-owned, never engine-visible. */
interface CycleTrackingProfile {
  userId: string;
  enabled: boolean;
  typicalCycleDays: number | null;   // null = unknown; never fabricated
  typicalPeriodDays: number | null;
  hormonalContraception: boolean;    // true → phase estimation suppressed
  adaptationLevel: "off" | "inform"; // "adjust" reserved for v3.1+ (see Trade-offs)
  /** Consent class grants, each with version + timestamp (GDPR Art. 9 explicit). */
  consents: { class: "cycle_tracking" | "cycle_share_physio" | "cycle_aggregate_research";
              grantedAt: string; version: string }[];
}
interface CycleLog {
  id: string; userId: string; date: string;                 // ISO date
  flow: "none" | "spotting" | "light" | "moderate" | "heavy";
  symptoms: CycleSymptom[];          // cramps, headache, fatigue, mood, bloating, breast_tenderness, back_pain
  symptomSeverity: 1 | 2 | 3 | null;
  note?: string | null;
}
/** Pure function output — computed on read, NEVER persisted (no derived-state drift). */
interface CycleEstimate {
  phase: "menstrual" | "follicular" | "ovulatory" | "luteal" | null; // null = suppressed/unknown
  dayOfCycle: number | null;
  confidence: "high" | "medium" | "low";
  basis: string;                     // honest one-liner: "3 logged cycles, regular ±2d"
}

/** Engine observability (Phase 2). Additive to DailyPrescription. */
interface GuardTrace {
  guard: "acwr-override" | "readiness-override" | "cns-spacing" | "weather"
       | "arrival-cap" | "injury" | "position" | "time-shift"
       | "rest-minimum" | "second-session" | "tournament-recovery";
  fired: boolean;
  intentBefore: PrescriptionIntent;
  intentAfter: PrescriptionIntent;
  explanation: string;               // the athlete-facing sentence
  data?: Record<string, number | string | boolean | null>; // thresholds/inputs used
}

/** Body comp (Phase 3). Stored on athlete_nutrition_profiles. */
type BodyCompGoal = "maintain" | "lean" | "build";
/** Reference band — org-tunable config data (position-volume.config.ts pattern),
 *  NEVER an engine input and NEVER a target imposed on the athlete. */
interface PerformanceWeightBand {
  position: string; heightCmMin: number; heightCmMax: number;
  kgLow: number; kgHigh: number;     // deliberately WIDE; see Trade-offs
  rationale: string;
}
```

### 1.3 New tables (SQL sketch — final DDL at implementation, then snapshot regen + `docs:regen` per CLAUDE.md §2)

```sql
-- Phase 6
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null, kind text not null default 'club',
  settings jsonb not null default '{}', created_at timestamptz default now());
alter table teams add column org_id uuid references organizations(id); -- nullable; backfill later

-- Phase 4 (special-category data: strictest RLS in the app)
create table cycle_tracking_profiles (
  user_id uuid primary key references users(id) on delete cascade,
  enabled boolean not null default false,
  typical_cycle_days int, typical_period_days int,
  hormonal_contraception boolean not null default false,
  adaptation_level text not null default 'inform',
  consents jsonb not null default '[]',
  updated_at timestamptz default now());
create table cycle_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  date date not null, flow text not null default 'none',
  symptoms text[] not null default '{}', symptom_severity int, note text,
  created_at timestamptz default now(), unique (user_id, date));
-- RLS v3.0: owner-only, full stop. No staff SELECT policy exists at all.
-- Staff aggregates (Phase 7) go through a dedicated k-anonymous server function,
-- never direct table reads. Deletion = hard DELETE, no soft-delete flags.
```

### 1.4 Role × data matrix

| Role | Sees | Does | Hidden / never |
|---|---|---|---|
| **Athlete** | Own everything: prescription + full guard traces, readiness/ACWR, wellness, injuries, nutrition, weight, cycle (own only), limited team summaries (schedule, availability) | Log sessions/wellness/body-check/cycle/meals/weight; declare seasons & travel; manage every consent toggle; export/delete own data | Other athletes' individual data |
| **Head/positional coach** | Roster, schedule, availability, session compliance, **derived signals only** (readiness band, ACWR zone, action flag — the existing `head_coach` lens), team dashboards, what-if planner | Plan practices/games/travel; log team sessions (existing `canModifySession` scope); acknowledge risk flags; weather override (storm still warns) | Raw wellness answers, bloodwork, injuries beyond status/restrictions, **cycle data (absolutely, including aggregates)** — unless org policy grants clinical lens (Ljubljana Frogs config) |
| **S&C coach** | Load/ACWR detail, readiness components, session history, strength/monitoring trends (`sc_coach` load-only lens exists) | Adjust templates within engine floors; flag athletes for physio | Clinical detail, bloodwork raw, cycle data |
| **Physiotherapist** | Full clinical lens (existing): injuries, rehab, RTP, monitoring report; bloodwork **only** behind `check_health_sharing`; cycle **aggregates only** behind `cycle_share_physio` + k≥5 (Phase 7) | Manage `athlete_injuries`/restrictions (which override the engine — Law #2), RTP protocols, physio blocks | Individual cycle logs (v3.0: nobody but the athlete sees them) |
| **Sport psychologist** | Own lane: `mental_wellness_reports`, `psychological_assessments`, stress/mood trends, monitoring adherence | Assessments, check-in nudges | Physical-clinical detail, cycle logs |
| **Nutritionist** | Nutrition profiles/plans/adherence, body-comp trajectory, hydration | Author meal plans/templates, set macro strategy within engine `NutritionTargets` | Injuries clinical detail, cycle logs (v3.0) |
| **Org admin** | Memberships, staff roles + approval queue, policy settings, compliance dashboards (consent coverage, retention), audit logs | Manage orgs/teams/staff, set `OrgSettings`, run retention/exports | **Any athlete health data whatsoever** — admin is a governance role, not a data role |

Enforcement stays the proven two-layer pattern: app-level `lensForRoles` on
staff lanes + RLS backstop + consent gates (`can_staff_read_athlete`,
`check_health_sharing`) on top (LOGIC §11). v3 changes *policy source* (org
settings instead of hardcoded directive), not the mechanism.

---

## Phase 2 — Engine & Safety-Config Refinement

**Goal.** Make the engine's numbers and decisions inspectable, documented, and
single-sourced *mechanically*, before any new product surface is built on them.
This is M0 — everything else depends on it and it carries zero product risk.

### 2.1 Safety-config module [NEW]

- `angular/src/app/core/services/periodization-safety-config.ts` exporting one
  frozen `SAFETY` object: ACWR bands (re-exported from `evidence-presets.ts` —
  which stays the owner of population presets), readiness cutoffs (55 low, 75
  second-session gate, 70 fallback), `MIN_REST_DAYS = 2`, second-session gates,
  WBGT + legacy bands, CNS base window + age scaling, arrival-cap hours, taper
  floors, heat volume-cut cap, acclimatization shift/decay, time-shift rules.
- **Build constraint (critical):** the server port is *generated* from the TS
  source (`npm run build:periodization-engine`). The generator must inline the
  safety-config module into the port, and `periodization-port-parity.test.js`
  extends to assert the emitted constants match — otherwise we'd create the
  exact client/server drift this repo spent 2026-07 killing. If inlining proves
  brittle, fallback plan: keep constants physically in the engine file in one
  clearly-marked `// SAFETY CONFIG` block and export them — location is
  negotiable, *single definition* is not.
- `calc-readiness.js` constants (component weights, injury penalty) stay
  server-owned but get the same documentation treatment below.

### 2.2 `CALCULATIONS.md` [NEW — closes a documented ghost reference]

- `docs/CALCULATIONS.md`: formulas (session load AU, EWMA ACWR uncoupled
  7d/21d λ=2/(N+1), readiness composition + data modes ≥60% completeness,
  WBGT approximation, taper math, heat strain scaling) with the constants table
  **generated** from the safety config by `npm run docs:regen` (same machinery
  as DATA_MODEL/ENDPOINTS). Hand-written prose explains *why*; generated block
  owns *what*. A vitest asserts the generated block is current (like snapshot
  freshness), so a constant change without regen fails CI.
- LOGIC.md's dangling `CALCULATIONS §10` references become real.

### 2.3 Guards as traced, composable units [EXTEND]

- Guards already are pure functions in a fixed pipeline; v3 formalizes the
  contract: each guard returns `{ rx, trace: GuardTrace }`, `prescribeFor`
  accumulates `traces: GuardTrace[]` onto `DailyPrescription` (additive,
  optional field — existing `*Adjustment` fields remain for backward compat and
  keep their tests; the trace is the superset).
- Week passes emit traces too (`rest-minimum` on demoted days — "Saturday was
  demoted to rest: only 1 rest day was left this week"; `second-session` on why
  granted/blocked).
- **No behavior change in this phase.** Golden-fixture matrix must stay
  byte-identical on all existing fields; traces are asserted separately.

### 2.4 Engine inspector [NEW]

- Route `staff/engine-inspector` (behind `staff.guard`), pure client, zero
  backend: compose or paste a synthetic `PeriodizationInputs` (presets:
  "heatwave tournament week", "post-injury RTP", "travel + low readiness",
  "storm on practice day"), run the local engine, render the 7-day plan with
  per-day trace timelines (guard fired → intent before/after → the sentence).
- Doubles as living documentation of precedence and the review harness for
  every future guard PR. Also the natural home for the drift-canary status
  (`periodization_server_match/mismatch` telemetry).

### 2.5 Population-aware presets [EXTEND — closes SOT §5a orphan]

- Wire `EvidenceConfigService.activePresetId` from real signals: `user_age_groups`
  → youth preset (1.2/1.4 bands); active `return_to_play_protocols` → RTP preset.
- Backend follows in the same milestone: `compute-acwr.js` classification takes
  the preset, restoring one-owner classification. Until both sides land, the
  documented **safe-direction rule holds: client may be stricter, never laxer**
  (LOGIC §10). The parity test extends to preset selection.

**Testing:** per-guard unit tests (exist — extend for traces); property-style
invariants (see Phase 8); golden matrix untouched. **Observability:** traces
are the log — sampled (never on cycle-related days' advisory layer, which isn't
engine data anyway) to `frontend_logs` via `RemoteTelemetryService`.

---

## Phase 3 — Athlete UX (men & women)

**Goal.** Finish the athlete loop: understandable "why", complete nutrition,
humane body-comp guidance, education. Today/Week/wellness/injury loops already
exist and are LIVE — v3 adds, it doesn't rework.

### 3.1 Onboarding [EXTEND]

Law #5 (value before complexity) governs: signup keeps the current short flow
(team+role → basics → `/today`). New collectors arrive as **post-first-value
nudges**, not signup gates:
- Day 1–3 nudge: body-comp goal (maintain/lean/build) → `athlete_nutrition_profiles`.
- For women (profile-declared, optional): a cycle-tracking invitation card —
  plain-language privacy explanation ("only you can see this; coaches never
  can; you can delete it all at any time"), explicit opt-in (Phase 4 consent
  flow). Declining removes the card permanently (re-enable in Settings).
- Height/position already exist; equipment/constraints already exist
  (`available_equipment`).

### 3.2 Performance weight guidance [NEW — org-gated, opt-in]

- Reference bands as config data (`core/config/position-weight.config.ts`,
  same pattern as `position-volume.config.ts`), keyed position × height range,
  **wide** bands with rationale strings. Org must enable
  (`weightGuidanceEnabled`, default off); athlete must opt in on top.
- Copy rules (enforced in component, reviewed like a spec law): frame as
  "performance range for speed + joint load", always lead with a current
  strength ("your 4.8s at 37 is already fast — this range is about keeping
  it"), never "ideal weight", never red styling on a weight number, no
  daily-weight nudges (weekly at most).
- **Hard rule: bands never feed the engine, readiness, or any staff alert.**
  A weight outside the band changes *nutrition template selection only*
  (§3.4), nothing about training.
- The brief's example (188cm WR/DB → 82–84kg) is far too narrow to defend
  evidentially; ship wide defaults (≈ ±5–6% bodyweight) and treat band values
  as a sports-science sign-off item (CLAUDE.md §3: product/science call —
  flagged, defaulting conservative).

### 3.3 Today & Week [EXTEND]

- **"Why this day looks like this" panel**: renders `traces` (Phase 2) as a
  collapsible list under the hero — answer-first ordering preserved (Law #4).
  Each fired guard = one plain sentence + optional numbers chip ("ACWR 1.42 —
  ceiling 1.3"). Non-fired guards hidden by default, "show all checks" for the
  curious. This *replaces* the scattered per-adjustment rendering with one
  component: `today/why-panel.component.ts`.
- Week view (This Week exists): rest days get explicit "protected rest"
  styling; a small risk glyph on days where an override/demotion fired
  (from traces); high-CNS vs low-CNS color coding via existing intent classes.
- Cycle-aware advisory card (women, opted-in, `inform` level): Phase 4 §4.2.

### 3.4 Nutrition & meal plans [EXTEND — finishes the PARTIAL lane]

- New screen `nutrition/` (top-level feature folder, flat convention) + routes.
- Engine already outputs per-day `NutritionTargets` (carbs g, protein g,
  hydration L + rationale) varying by phase/load — **the single source; the
  nutrition screen must consume it, never recompute** (CLAUDE.md §4).
- Body-comp goal modulates the *food-first* layer, not the athlete-visible
  math: `nutrition.js` gains `GET /api/nutrition/day-plan?date=` returning the
  engine targets + a selected `meal_templates` set (training-day vs rest-day
  variant keyed off the day's intent; low-load days pull the lighter variant)
  + hydration guideline. Portion/quality language per Law #3 ("add a fist of
  rice to lunch on practice days"), g/kg stays internal.
- Above-band athletes (org-gated §3.2): template selection shifts toward the
  "lean" variants (carb quality, energy slightly lower on rest days) with
  joint-health/speed framing. No kcal deficits displayed, no "you're over".
- Adherence: lightweight per-meal check-off → `nutrition_logs` (prefill +
  non-destructive submit per Law 5b).

### 3.5 Weight & body-comp tracking [EXTEND]

- `physical_measurements` (+ `_latest` view) is the store; add a simple weekly
  entry card in `profile/` and a trend chart: weight line, optional band
  overlay (§3.2), readiness overlaid as context only — visual proximity,
  **no computed correlation claim** with n≈dozens of points (honesty over
  data-viz theater; a real correlation view needs Phase 7 analytics).

### 3.6 Education [EXTEND]

- `knowledge_base_entries` is live with search; add `concept` tooltips: an
  info-glyph component that deep-links a KB entry (`acwr`, `readiness`,
  `rest`, `cycle-basics`, `sleep`, `fueling`). Content authored once in KB,
  surfaced everywhere — no copy duplicated into components.

**Edge cases & safety:** missing weight → explicit empty state, engine falls
back 80kg as today (documented in CALCULATIONS.md); nutrition day-plan for a
day with no prescription (no season, no schedule) → honest "log your schedule
first" state, never a fabricated plan (Law #7).

---

## Phase 4 — Female Health & Menstrual Cycle

**Goal.** A genuinely useful, genuinely private cycle module whose claims match
the strength of the evidence. Green-field — design freedom, maximum privacy bar.

### 4.1 The architecture that makes it safe by construction

```
cycle_logs (owner-only RLS)
   │
   ├─► estimateCycle() — pure fn, computed on read, never persisted
   │        └─► athlete-only advisory card + calendar overlay (client)
   │
   └─► symptoms the athlete CHOOSES to also report as wellness
            └─► daily_wellness_checkin → calc-readiness → engine  [EXISTING PIPELINE]
```

- **The engine never receives cycle fields.** No `PeriodizationInputs` change.
  What adapts training is the athlete's *symptoms* via the existing
  wellness→readiness→engine path — which already down-regulates a bad day for
  every athlete, of any sex, for any reason. Cycle data itself only powers the
  athlete-facing advisory/education layer. Consequences: coach lanes can't leak
  what they never join; the server prescription assembly needs no new health
  reads; the parity surface doesn't grow.
- The wellness check-in (women, opted-in) offers — never silently applies
  (V2.1 travel-suggestion pattern) — to carry today's logged cycle symptoms
  into the soreness/fatigue fields: "You logged strong cramps — reflect that in
  today's check-in?" One tap, transparent, athlete-controlled.

### 4.2 Phase estimation & the advisory layer

- `estimateCycle(logs, profile, date) → CycleEstimate` — shared pure function,
  client-computed (engine-style, unit-tested; the server never computes or
  stores a phase). Rules: menstrual = logged bleeding days; cycle length from
  the athlete's own trailing 3–6 cycles (never a textbook 28 until ≥2 logged
  cycles — before that `confidence: "low"`, phase shown as tentative);
  ovulatory = midpoint window ±1d, always `confidence ≤ medium` (no
  physiological measurement); luteal = post-window to next bleed.
  **`hormonalContraception: true` → `phase: null`** — cyclic phase guidance for
  suppressed cycles would be fabricated data (Law #7 applied to physiology).
- `adaptationLevel: "inform"` (default when enabled): Today gets a quiet card —
  phase, confidence, expectation-setting ("late-luteal: some athletes feel
  heavier legs and warmer — extended warm-up and an honest check-in matter
  more this week"), plus recovery-emphasis nudges (sleep, mobility) that were
  already in the prescription's `recoveryEmphasis` vocabulary. **Never** an
  intent change, never "you shouldn't sprint today".
- `adaptationLevel: "adjust"` (auto-modify sprint density/volume by phase) is
  **deliberately not in v3.0** — see Trade-offs. The setting enum ships with
  two values so adding the third is non-breaking.

### 4.3 Logging UX

- `cycle/` feature folder: calendar (month view, flow/symptom glyphs, estimated
  phase band rendered as tentative wash — visually distinct from logged fact),
  1-tap daily log (flow + symptom chips + severity), settings (typical lengths,
  contraception, adaptation level, consents, export, **delete everything**).
- Today integration: the advisory card (§4.2) and a "log period started" quick
  chip when the estimate expects it (dismissible, never nagging).
- `/api/cycle` (new `cycle.js` + its **own netlify.toml redirects + post-deploy
  curl check**): `GET` profile+logs (owner only — bearer user, no staff branch
  at all in v3.0), `PUT` profile, `POST`/`DELETE` log, `DELETE /api/cycle`
  (module wipe: hard-delete logs + profile, write `privacy_audit_log`).

### 4.4 Staff view — v3.0: none. Later: aggregates only.

Individual cycle data is visible to exactly one person: the athlete. The Phase 7
research/aggregate lane (physio/psych, `cycle_aggregate_research` consent,
k≥5, adults only) is the *only* planned staff surface, and it ships **after**
the module has earned athlete trust, not with it. A physio who needs to know
asks the athlete — the app should not become the shortcut around that
conversation.

### 4.5 Privacy & ethics checklist (blocking for ship)

- DPIA completed (GDPR Art. 35 — special-category data, Art. 9(2)(a) explicit
  consent); consent text versioned in-repo; consent grants recorded with
  version + timestamp; withdrawal = immediate hard delete offer.
- Retention: cycle logs auto-trimmed to `healthRetentionMonths` (org default
  24, athlete can shorten); export included in the athlete's data bundle
  (Phase 6); zero cycle fields in telemetry, logs, or error reports (lint rule:
  `cycle_` tables are forbidden imports outside the cycle module + privacy
  export path).
- U18: module force-disabled regardless of org settings (`user_age_groups`
  check) until the minors phase lands with legal review.

---

## Phase 5 — Coach & Staff Dashboards (visual, not Excel)

**Goal.** Replace list-and-grid staff surfaces with dashboards, and give
coaches a schedule planner that shows engine consequences before they commit.
All reads go through existing lenses — dashboards change *presentation*, never
*access*.

### 5.1 Chart infrastructure [NEW — deliberate build-not-buy]

- `shared/charts/`: `ff-sparkline`, `ff-bar`, `ff-heatmap`, `ff-scatter`,
  `ff-distribution-strip`, `ff-timeline` — hand-rolled SVG, signal inputs,
  zoneless-friendly, theme-aware, `prefers-reduced-motion` respected, each with
  a table/CSV fallback slot (accessibility + the "export still available"
  requirement). No chart library: consistent with the no-PrimeNG static-first
  rebuild, keeps the bundle lean, and our chart vocabulary is small and known.
  Revisit only if requirements outgrow ~6 primitives (see Trade-offs).
- The existing Stats load-calendar heatmap migrates onto `ff-heatmap` (one
  implementation, two consumers — single-source applies to UI too).

### 5.2 Team dashboard [EXTEND coach lane]

- Route `staff/team-dashboard` (folder under existing `staff/`). Sections:
  - **Risk strip**: ACWR distribution (each athlete a dot on the band scale —
    under/sweet/elevated/danger, preset-aware per athlete), readiness category
    counts, rest-compliance week bar (athletes with <2 rest days planned = 0
    by construction; flag *logged-load* violations instead).
  - **Trends**: per-athlete/position readiness + ACWR sparklines (server
    time-series from `readiness_scores` + ACWR history).
  - **Availability & injuries**: `v_injuries_unified` timeline chips, RTP
    stage, next fixtures (existing schedule data).
- Data: extend the coach-analytics router (`coach-analytics.js` →
  `coach-dashboard.js` sub-module, router pattern like `training.js`) with one
  aggregate endpoint `GET /api/coach-analytics/dashboard?teamId=` shaped
  server-side (derived signals per the coach lens), cached via
  `coach_analytics_cache`.

### 5.3 Daily monitoring [EXTEND `team-monitoring/`]

- Athlete cards (not rows): name/position, readiness badge, ACWR zone, wellness
  deltas as mini-bars (sleep/fatigue/stress/soreness vs athlete's own 14-day
  baseline — deltas, not raw, so coaches read change, not absolutes), action
  chip (Full session / Monitor / Individualize — derived server-side next to
  the existing lens shaping, one owner).
- Scatter: session load (AU) × readiness, outlier quadrant highlighted
  ("high load + low readiness" = the conversation list for today).
- CSV export button on every view (existing exports remain; dashboards primary).

### 5.4 Schedule planning with engine reaction [NEW — the coach killer feature]

- In the coach schedule screen: add/move/remove practice, game, or travel in a
  **draft layer** (client state, nothing persisted), then run the *client
  engine* (`planWeek` is pure and already in the bundle) per roster athlete on
  the drafted schedule using **derived-signal inputs only** (the head-coach
  lens already provides readiness band + ACWR zone; no clinical reads needed —
  privacy holds even in simulation).
- Diff panel: "This draft forces rest-day demotions for 4 athletes",
  "Tue becomes a 3rd consecutive high-CNS day for WR group", "Sun tournament +
  Mon practice leaves the week without 2 rest days — the engine will demote
  Mon". Warnings come from the same `GuardTrace`s — the inspector
  infrastructure reused, zero new rule logic (and therefore zero drift).
- Commit writes through existing schedule endpoints; **this milestone also
  ships the missing team `competitions`/`competition_events` write lane**
  (V2.4 documented gap: tiers are engine-ready but DB-only to set).

### 5.5 Staff-specific views [EXTEND existing lanes]

- S&C: load/strength/readiness trend page on the `sc_coach` load lens.
- Physio: injury timeline (`athlete_injuries` history → `ff-timeline`), RTP
  progression, exposure flags; monitoring report stays the deep-dive.
- Psych: mood/stress trends from their existing lane + monitoring adherence.
- Nutritionist: body-comp trajectory vs plan adherence (`nutrition_logs`).
- Each is one route + one endpoint extension on its existing role-gated lane —
  no new access, no new lens.

---

## Phase 6 — Org/Admin, Permissions & Privacy

**Goal.** Make multi-team/multi-club deployment real, move hardcoded policy
into org config, and finish the GDPR lifecycle. (Live reality check: one club
today — so this phase is deliberately *after* athlete/coach value, and the
`org_id` column is nullable so nothing existing breaks.)

### 6.1 Org layer [NEW]

- `organizations` + `teams.org_id` (nullable; Ljubljana Frogs backfilled as the
  first org). `organizations.js` → `/api/organizations` (+ redirects): CRUD
  (superadmin creates; org admin manages own), staff assignment across teams,
  the approval queue (existing `approval_requests` + `role_approval_status`
  flow, surfaced properly), `OrgSettings` editor.
- Org admin UI: `org/` feature folder — teams/roster, staff & approvals,
  policy (lens roles, retention months, module toggles), compliance view
  (consent coverage %, pending deletion requests, audit log browser over
  `privacy_audit_log`/`consent_access_log`/`role_change_audit` — all existing
  tables).
- **Policy migration:** "coach → full clinical lens" moves from code directive
  to `OrgSettings.clinicalLensRoles` (Frogs keeps current behavior via config;
  the *default* for any new org is physio-only). `lensForRoles` reads the org
  policy with the current behavior as fallback — no flag-day.

### 6.2 Permissions model [EXTEND]

- Mechanism unchanged (two-layer, LOGIC §11). v3 adds: org-scoped roles
  (org admin ≠ team staff), the Phase 1 matrix as the documented contract, and
  a **permissions conformance test**: a vitest matrix that walks role × endpoint
  × consent state against expected allow/deny/shape — the Phase 1 table,
  executable. (This is the test that prevents the next
  "resolveRequesterRole read the wrong table" class of bug.)
- Minors (U18): **not in v3.0.** The tables exist (`parental_consent`,
  `parent_guardian_links`, `youth_athlete_settings`); the v3 stance is honest
  deferral with hard gates now — age check force-disables cycle module and
  weight guidance, and blocks U18 from monitoring consent grants. Guardian
  consent flows, minimized retention, and youth dashboards are a dedicated
  later release with legal review.

### 6.3 GDPR & data lifecycle [EXTEND]

- **Data inventory** `docs/PRIVACY_INVENTORY.md`, generated: every live table
  tagged (identity / training / health / special-category / operational) with
  purpose, retention, and access roles — sourced from a sensitivity map checked
  against the live snapshot so it can't silently omit a new table (docs:regen
  family).
- **Export**: `GET /api/privacy/export` (new `privacy.js`) → JSON bundle of all
  athlete-owned rows (incl. cycle), delivered via short-lived signed Storage
  URL; logged to `privacy_audit_log`.
- **Deletion**: `account_deletion_requests` exists — v3 wires the actual
  cascade job (Netlify scheduled function): hard-delete owned rows, anonymize
  team-history rows the club legitimately retains (session AU aggregates keep
  team analytics honest without identity), written record in audit log.
- **Retention**: scheduled trim per `healthRetentionMonths` for health-class
  tables (wellness raw, cycle logs, bloodwork raw per policy), with rollups
  (weekly aggregates) preserved for the athlete's own history where
  non-sensitive.

---

## Phase 7 — Integrations, Analytics & Research

**Goal.** Wire the already-built ingest lanes, close the fixtures gap, and add
aggregate analytics that are honest about sample sizes.

### 7.1 Wearables & external load [EXTEND — the endpoints exist]

- `wearable-health-ingest.js` and `session-load-import.js` are ORPHANED by
  design (external callers, no UI). v3 adds: provider onboarding UI in Settings
  (existing `monitoring_providers`, `device_pairings`, `wearable_consent` —
  consent state already self-filters rows), a CSV upload UI for
  `session-load-import` (GPS vendor exports), and provider docs. Sleep/HR data
  flows into readiness as *inputs* through the existing server calc — never a
  second readiness formula (CLAUDE.md §4).
- Bloodwork lane already LIVE (panels/markers/baselines + consent gate) — v3
  adds nothing here beyond dashboard surfacing (Phase 5 physio view).

### 7.2 Fixtures & league systems [EXTEND]

- The competitions write lane (Phase 5.4) is the foundation; federation import
  is a mapping layer on top (`POST /api/competitions/import` accepting a
  normalized fixture list; per-federation adapters as they materialize —
  no speculative integrations).

### 7.3 Aggregate analytics & research export [NEW — strictly gated]

- Nightly aggregation (scheduled function) → `team_insights` /
  `coach_analytics_cache`: readiness/load/wellness trends, injury incidence per
  load band. Every aggregate carries `n`; **k≥5 or the cell is suppressed** —
  rendered as "insufficient group size", never a number.
- Cycle-phase × injury/wellness aggregates (the Phase 4.4 deferral): adults,
  `cycle_aggregate_research` consent class only, k≥5, physio/psych lens,
  org research agreement on file. Phase estimation runs in the aggregation job
  from consented logs only; output contains phase-bucket counts, never dates.
- Research ETL: de-identified extract (stable pseudonym per athlete-study,
  dates shifted per-subject, small cells suppressed) behind a superadmin-run
  job + documented ethics checklist. Not self-serve in v3.

---

## Phase 8 — Testing, Observability & Accessibility (continuous)

### Testing
- **Per-guard unit tests** [EXTEND existing suites]: each guard × fires /
  doesn't / trace content; conservative-default cases (missing RPE → high-CNS,
  null weather field → fail-safe) pinned explicitly.
- **Engine invariants** (property-style over randomized `PeriodizationInputs`):
  every planned week has ≥2 rest days; storm ⇒ never an outdoor intent; active
  sprint restriction ⇒ intent ∉ {sprint, mixed} and no sprint reps; second
  session ⇒ phase ∈ {off,pre} ∧ ¬practice ∧ readiness ≥75 ∧ ACWR ≤1.2; traces
  reconstruct the intent chain (fold of before→after equals final intent).
- **Golden matrix** stays byte-identical through Phase 2 refactors; grows a
  case per new preset wiring.
- **Permissions conformance matrix** (Phase 6.2) — role × endpoint × consent.
- **Dashboard DOM tests**: charts render from fixture data + the empty state;
  visual snapshots via the existing Update Visual Snapshots workflow (Linux
  baselines — regenerate on UI change or Mobile Responsive goes red).
- **Cycle module**: estimation unit tests (irregular, missing, contraception ⇒
  null phase), RLS denial tests, module-wipe leaves zero rows.

### Observability
- Guard traces sampled to `frontend_logs` (existing `RemoteTelemetryService`);
  drift canary continues; inspector shows live canary status.
- API: structured per-function logs (requester role, lens, consent gates hit —
  **identifiers, never health values**) feeding the org compliance view.

### Accessibility & localization
- Charts: every visual has a data-table fallback; color encodings double-coded
  (shape/label); contrast ≥4.5:1 both themes; keyboard nav on cards/calendars;
  `prefers-reduced-motion`.
- i18n: runtime dictionary service (signals-based) — Angular's build-per-locale
  i18n multiplies Netlify builds for marginal gain at this scale. Ship `en` +
  `sl` first (live club is Ljubljana). All new copy goes through the dictionary
  from day one; retrofitting old screens is incremental.
- Performance: dashboards paginate/virtualize rosters; charts are static SVG
  (no animation loops); keep the static-first budget.

---

## Roadmap

| Milestone | Contents | Why this order |
|---|---|---|
| **M0 — Foundation** (small, ~1 wk) | Safety-config extraction + port-generator support; `CALCULATIONS.md` (generated constants); `GuardTrace`; engine inspector; preset wiring (client+server); LOGIC/SOT sync | Zero product risk, unblocks every later phase, mechanizes the single-source rule. Everything after renders traces or reads the config. |
| **M1 — Athlete completion** | Why-panel; nutrition screen + day-plan endpoint; weight/body-comp tracking (+ org-gated bands); education tooltips; onboarding nudges | Athletes are the daily-active core; nutrition is the biggest half-built promise in the schema. |
| **M2 — Staff dashboards** | Chart primitives; team dashboard; monitoring cards + scatter; schedule what-if; competitions write lane; staff-specific trend views | Coach value next; the what-if reuses M0 traces. Fixtures gap closes here. |
| **M3 — Female health** | Consent flow → logging UX → estimation → inform-level advisory → wellness carry-over. DPIA before ship. **No staff surface.** | After athlete trust surfaces (M1) exist; before analytics so data accrues under consent from day one. |
| **M4 — Org/admin & GDPR ops** | Org layer + policy migration; approval queue UI; export/deletion/retention jobs; privacy inventory; permissions conformance tests | Needed before any second club onboards; policy-from-config replaces hardcoded directives. |
| **M5 — Integrations & analytics** | Wearable/CSV ingest UI + providers; nightly aggregates (k≥5); cycle aggregates (consent-classed); research ETL | Needs M3 data + M4 governance to exist safely. |
| **Continuous** | Phase 8 items ride every milestone's DoD | — |

**Definition of done, every milestone:** tests green locally + CI; Ledger row
updated same PR (CLAUDE.md §2); schema changes → snapshot + types + docs:regen
in the same commit; new functions → redirects + post-deploy curl JSON check;
LOGIC.md/CALCULATIONS.md updated in the same pass as any rule/constant change.

**MVP line:** M0–M2 + M3-inform = v3.0. Adjust-level cycle adaptation, minors,
research ETL, federation adapters, additional locales = v3.1+.

---

## Trade-offs & Open Questions

### Where menstrual-phase evidence is strong vs weak (the stance behind §4)
- **Strong enough to build on:** tracking + symptom awareness improves athlete
  self-management and communication; symptoms (pain, sleep disruption, fatigue)
  degrade same-day capacity — which is exactly what wellness→readiness already
  models; education/expectation-setting is low-risk, well-received.
- **Weak / heterogeneous — deliberately not automated:** blanket phase-based
  performance prescriptions (meta-analytic pooled effects are trivial with high
  inter-individual variance — McNulty et al. 2020); phase-targeted training
  gains (small, mixed studies). **Mixed:** injury-risk phase links (ACL/laxity
  around late-follicular/ovulatory; some luteal muscle-injury trends) justify
  *gentle awareness copy*, not restrictions.
- Hence: `inform` ships, `adjust` waits for either stronger evidence or
  N-of-1 patterns from the athlete's own logged history (a v3.1+ candidate:
  "your last 3 late-luteal weeks, your logged RPE ran ~1 high — want the app
  to expect that?" — personal evidence, not population rules).
- Hormonal contraception ⇒ no phase display, ever. ~30–50% of female athletes
  use it; a module that fabricates phases for them fails Law #7 medically.

### Safety enforcement vs coach autonomy
Current architecture already has the right shape: hard floors non-negotiable
(storm, injury precedence, rest minimum), coach override for weather with the
storm still warning, overrides logged. v3 keeps exactly this line and adds:
what-if warnings *before* commit (autonomy with eyes open), org-configurable
*thresholds* only within documented safe ranges (`safety_override_log` +
`coach_overrides` record every use). We do not add per-day "force sprint"
overrides for staff — a coach who disagrees schedules differently and sees the
consequences in the planner.

### ACWR humility
ACWR's evidence base is itself contested (causality critiques of the
Gabbett-era literature). The bands stay versioned config with citations and
caveats (`evidence-presets.ts` already does this well), the UI language stays
"elevated/danger *zone*" not "you will get injured", and the safe-direction
rule governs any future threshold litigation.

### Coach clinical lens (product/policy decision — flagged, defaulted)
Today's live behavior (coach = full clinical, club-owner directive) becomes an
org setting with a **physio-only default for new orgs**. Frogs keeps current
behavior via config. Needs an explicit sign-off at M4 that the default flip for
future orgs is intended.

### Weight guidance (product/legal sensitivity — org-gated, opt-in, wide)
Shipped OFF by default at org level, athlete opt-in on top, wide bands, never
an engine input, copy rules enforced. The specific band values need
sports-science sign-off before any org enables it. If in doubt, this feature
slips releases before it ships narrow.

### Build-not-buy on charts
Hand-rolled SVG primitives (~6 components) over a chart library: zoneless/
signals friendliness, bundle discipline, full a11y control. Cost: we own axes/
scales math. Revisit trigger: requirements exceed the primitive set (zoom,
brushing, streaming).

### Open questions (need answers before the affected milestone)
1. **Controller vs processor** per org (FlagFit ↔ club ↔ federation) — shapes
   DPAs, export duties, breach process. Needs legal input before M4.
2. Retention defaults: 24 months for health-class raw data — right for a
   federation context? (M4)
3. National-team athletes on multiple teams: which org's policy wins for lens/
   retention? (Proposed: strictest-wins; confirm at M4.)
4. Does the nutritionist role ever see cycle data? (Default designed: no —
   physio/psych aggregates only. Confirm with the club at M3.)
5. U18 timeline and whether federation deployment forces it earlier than
   planned. (Gates stay on until then.)
6. Locale priority after `sl` — de/it/hr per the Frogs site pattern? (M5+)
