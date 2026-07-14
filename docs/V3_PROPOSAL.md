# FlagFit Pro V3 — Proposal

**Status: SPEC** (nothing in this document is built unless the Feature Status Ledger in
[`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) §4 says so). Written 2026-07-14 against the
2026-07-13 live verification (176 tables, 121 functions, 261 migrations).

**How to read this.** This is the v3 counterpart to the v2 roadmap: vision + concrete design,
tracked phase-by-phase in a future `docs/v3/` folder the same way `docs/v2/` tracks v2. Where
this document and ground truth conflict, **ground truth wins** — this doc describes what v3
_should_ be, `SOURCE_OF_TRUTH.md` describes what _is_. Every claim below about the current
system was verified against the repo on the date above; corrections to the v3 brief's
assumptions are called out explicitly rather than silently absorbed, because several of them
change the design.

---

## Phase 0 — Context & principles

### 0.1 The core we build on (verified current state)

**The two-engine contract (intent ➝ realization).** The _intent_ engine is the pure, shared
periodization module: `angular/src/app/core/services/periodization-engine.ts` (canonical TS
source) mirrored byte-identically to `netlify/functions/utils/periodization-engine.js` via
`npm run build:periodization-engine`, parity-locked by the 29-case golden-fixture matrix in
`tests/unit/periodization-port-parity.test.js`. Its public API is already what the v3 brief
asks for:

- `prescribeFor(inputs: PeriodizationInputs): DailyPrescription` — one day, guard pipeline
  applied.
- `planWeek(dayInputs, teamPracticeFlags, phases7, todayReadiness, todayAcwr): DailyPrescription[]`
  — the single week orchestration (schedule-aware intent hints → `prescribeFor`×7 →
  `enforceWeeklyRestMinimum` (≥2 full rest days, ≤5 active days) → `addSecondSessions`).
  Client `today` = `weekAhead()[0]`, This Week = `weekAhead()`, and the server's
  `/api/periodization-prescription` all run this identical function (Law #6, §5a), so
  Today-vs-Week drift is structurally impossible. The server fetch is a runtime drift
  _canary_, never the render source.

The _realization_ engine is `daily-protocol.js` (COMPOSE): it takes the intent and realizes
concrete exercise blocks from the canonical `exercises` table. It never re-decides intent.

**Guard pipeline (as implemented, effective precedence most-restrictive-last):**
`decideBasePrescription` → `applySprintRecoveryGuard` (CNS spacing, lowest precedence) →
`applyWeatherGuard` (WBGT-first) → `applyArrivalDayGuard` → `applyInjuryGuard` (highest —
Spec Law #2) → `withPositionEmphasis` (presentation-only) → cooler-hour `timeShift`
(advisory-only). Every guard already attaches a structured trace block
(`weatherAdjustment`, `cnsRecoveryAdjustment`, `injuryAdjustment`,
`tournamentRecoveryAdjustment`, `positionEmphasis`, `timeShift`, `secondSession`) plus a
human `reasoning` string.

**Single-source calculations (correction to the brief: there is no `CALCULATIONS.md`).**
The calculation ground truth lives in `SOURCE_OF_TRUTH.md` §5/§5a plus
`docs/ground-truth/calculation-ownership-audit-2026-07-08.md`. v3 must **not** introduce a
parallel `CALCULATIONS.md` — that is exactly the docs-drift failure mode this repo already
paid for. Instead, Phase 2 makes _code_ the single source (a config module) and keeps docs
generated/pointed at it. The formulas as owned today:

| Calculation  | Owner (single source)                                         | Formula / constants (exact)                                                                                                                                                       |
| ------------ | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Session load | `netlify/functions/utils/session-load.js` (`sessionWorkload`) | stored `workload` if finite>0, else `rpe × duration_minutes`, else 0 — never fabricated                                                                                           |
| ACWR         | `netlify/functions/utils/acwr.js` (`computeAcwrAt`)           | uncoupled EWMA, acute 7d (λ=0.25) / chronic 21d at offset 7 (λ≈0.0909), chronic floor 50 AU, `minDaysWithData=14` → `lowConfidence`                                               |
| ACWR zones   | `utils/acwr.js` `ACWR_RISK_ZONES` (drift-guarded)             | detraining <0.8 · safe 0.8–1.3 · caution 1.3–1.5 · danger 1.5–1.8 · critical ≥1.8                                                                                                 |
| Readiness    | `netlify/functions/calc-readiness.js` → `readiness_scores`    | weights workload .35 / wellness .30 / sleep .20 / proximity .15; travel −2/−4/−8; injury −5/−10/−20 (severe also caps level at moderate); bands low <55, moderate 55–75, high >75 |
| Wellness idx | `netlify/functions/utils/readiness-score.js`                  | required sleep .4 / soreness .3 / energy .3; optional mood/stress .5/.5; 60/40 blend                                                                                              |
| Rest minimum | engine `enforceWeeklyRestMinimum`                             | ≥2 full rest days/week, max 5 active; demotion priority taper-prime → mobility → technical → mixed → sprint → strength; never demotes practice/rest/recovery/competition          |
| 2nd sessions | engine `addSecondSessions`                                    | off/pre-season only, `strength` AM, not a practice day, ≥2 days from high-load day; day-0 live gates readiness ≥75 **and** ACWR ≤1.2                                              |
| CNS spacing  | engine `applySprintRecoveryGuard` + `isHighCnsSessionType`    | 48h base, age-scaled 60h (35–39) / 72h (≥40), monotonic, floored at 48                                                                                                            |
| Hooper       | `monitoring-report.js` (thresholds from `monitoring_config`)  | WATCH ≥12 / HIGH ≥16                                                                                                                                                              |

Known, deliberate divergences (from the ownership audit) that v3 inherits as work items:
the second readiness formula in `wellness-checkin.js` (`calculated_readiness`, unification
deferred pending sports-science delta validation), the client display-only ACWR mirror in
`acwr.service.ts`, and the **orphaned population presets** (`evidence-presets.ts` youth/RTP
zones exist but `setPreset()` has zero callers — every athlete is scored adult baseline).

**Stack.** Angular 22 (standalone, zoneless, signals, no PrimeNG) → Netlify Functions (ESM
`export const handler`, `/api/*` redirects — a new function is invisible until its
`netlify.toml` redirect exists) → Supabase (Postgres + Auth + Realtime + Storage). Backend
runs service-role (bypasses RLS) so **authorization is enforced in code**; RLS is the
backstop. Generated docs (`docs/generated/DATA_MODEL.md`, `ENDPOINTS.md`,
`live-schema.snapshot.json`, `supabase-types.ts`) regenerate via `npm run docs:regen`.

**Corrections to the v3 brief's assumptions** (each reshapes a phase below):

1. **Menstrual tracking is not "new" — it was deliberately deleted.** Migration
   `20260603214700_drop_cycle_tracking_compliance.sql` dropped the (empty)
   `cycle_tracking_entries`/`cycle_tracking_symptoms` tables because GDPR Art. 9
   special-category data had **no lawful basis for a male-only 16+ club**. Phase 4 is
   therefore gated on real preconditions, not just engineering.
2. **No org/federation layer exists.** Top of the hierarchy is `teams` (+ global
   `superadmins`). Phase 6 is greenfield.
3. **GDPR machinery largely exists**: `data-export.js` (Art. 15/20), `account-deletion.js`
   (soft → 30-day queue → hard, pg_cron), `privacy_settings`/`team_sharing_settings`,
   parental-consent schema (dormant), and ~10 audit tables (several dormant:
   `consent_access_log`, `authorization_violations`, `athlete_consent_settings` have no
   writers). Phase 6 wires and extends; it does not invent.
4. **The engine refactor the brief asks for is mostly formalization.** `planWeek`,
   precedence-ordered guards, explanations, and parity tests already exist. What's missing:
   a single extracted config module, a first-class composable guard signature, population-
   aware thresholds actually wired, and an inspector UI.

### 0.2 Design principles for v3

1. **Safety-first, override-never-silent.** ACWR/readiness/rest/injury guards keep their
   current precedence. Any human override of a safety decision is logged
   (`safety_override_log` exists) and surfaced, never silently applied — the inverse also
   holds: the engine never silently overrides a coach; it explains (Spec Law #6/#7 spirit).
2. **Non-judgmental, performance-framed communication.** Body weight, cycle, and wellness
   copy is about function (speed, joint load, recovery), never appearance or compliance
   shaming. Concretely: no red "over target" states on weight screens; ranges are
   "performance ranges", trends are correlated with readiness/performance, not judged.
3. **Evidence-based, honestly labeled.** Where evidence is strong (heat, ACWR bands, rest),
   the engine enforces. Where it is heterogeneous (menstrual-phase performance effects),
   the engine _informs and adapts expectations_ but does not restrict (§4.3). Every
   heuristic that isn't a personalized physiological model says so (the acclimatization
   guard already sets this precedent).
4. **Visual over tabular.** Dashboards are charts + cards; CSV export remains an escape
   hatch, never the primary surface (Phase 5).
5. **Single source, everywhere.** One engine, one config module, one schema snapshot,
   generated docs. New v3 calculations get an owner row in the table above _before_ a
   second consumer exists.
6. **Privacy by architecture.** Consent-gated reads use the existing helper pattern
   (`check_health_sharing`, blocked-set gating in `coach-core.js`); new sensitive domains
   (cycle) get their own consent flag, never piggyback on a broader one; aggregates are
   k-anonymous; minors get stricter defaults.

### 0.3 User groups — and the audience-expansion caveat

Athletes (adult men and women, individual or team-rostered), domestic clubs, national teams
(adults first; U18 later behind the parental-consent layer), staff
(`head_coach`/`coach`/coordinators, `strength_conditioning_coach`, `physiotherapist`,
`psychologist`, `nutritionist` — the role vocabulary already live in `team_members.role`),
and org/federation admins (new in Phase 6).

⚠️ **Flagged product/legal decision (not an engineering call):** the current deployment's
documented population is a male-only 16+ club — that fact is load-bearing in the DB (the
cycle-tracking drop rationale) and in the engine (adult-only thresholds are currently the
only wired preset). Serving women and national teams is the premise of half this proposal;
it requires an explicit product decision, a DPIA covering Art. 9 data, and updated privacy
policy _before_ Phase 4 ships. Proposed default: build Phases 1–3+5 audience-neutral now,
gate Phase 4 behind the legal groundwork in Phase 6. Proceeding on that default absent
other direction.

---

## Phase 1 — Domains, entities & roles

### 1.1 Domain → data map

| Domain                    | Exists today (tables)                                                                                                            | New in v3                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Training & periodization  | `training_sessions`, `athlete_training_config`, `readiness_scores`, `team_season_phases`, `v_athlete_schedule`, `athlete_events` | `engine_trace_log` (observability, §2.4)                               |
| Recovery & wellness       | `daily_wellness_checkin`, `recovery_protocols/_blocks/_sessions`, `athlete_travel_log`, `sleep-debt` lane                        | —                                                                      |
| Nutrition & body comp     | `nutrition_logs/_plans/_reports`, `meal_templates`, `athlete_nutrition_profiles`, `nutrition_goals`, `physical_measurements`     | `athlete_body_comp_targets` (§3.1)                                     |
| Menstrual & female health | **none** (dropped 2026-06-03)                                                                                                    | `cycle_logs`, `cycle_settings` (§4.1)                                  |
| Monitoring & analytics    | `session_load`, `wearable_health/_consent`, `bloodwork_*`, `physio_blocks`, `monitoring_config`, `monitoring_providers`          | aggregate/anonymized views (§7.2)                                      |
| Communication & reporting | `channels`, `chat_messages`, `notifications`, `push_subscriptions`, `coach_activity_log`                                         | —                                                                      |
| Org/admin & permissions   | `teams`, `team_members`, `superadmins`, `privacy_settings`, `team_sharing_settings`, `parental_consent` (dormant)                | `organizations`, `organization_members`, retention/consent policy (§6) |

Entity shapes for athlete/team/session/wellness/injury are already live and correct
(canonical names: wellness = `daily_wellness_checkin`, injuries = `athlete_injuries` +
`v_injuries_unified`, load = `training_sessions`) — v3 does not rename or re-model them.

### 1.2 New entity types (TypeScript, engine/domain layer)

```ts
// Org layer (Phase 6)
interface Organization {
  id: string;
  name: string;
  kind: "club" | "federation" | "academy";
  country: string | null;
  dataRetentionDays: number | null; // null = product default
  minorsEnabled: boolean; // gates U18 flows org-wide
}
interface OrganizationMember {
  orgId: string;
  userId: string;
  role: "org_owner" | "org_admin" | "compliance_officer";
}

// Female health (Phase 4)
type CyclePhase = "menstruation" | "follicular" | "ovulatory" | "luteal";
interface CycleLog {
  id: string;
  userId: string;
  date: string; // ISO date
  bleeding: 0 | 1 | 2 | 3; // none/light/med/heavy
  symptoms: CycleSymptom[]; // enumerated, no free text by default
  contraception: "none" | "hormonal" | "other" | "undisclosed";
}
type CycleSymptom =
  | "cramps"
  | "fatigue"
  | "mood_low"
  | "bloating"
  | "headache"
  | "sleep_disruption"
  | "breast_tenderness"
  | "none";
interface CycleSettings {
  userId: string;
  trackingEnabled: boolean; // Art. 9 explicit consent, dated
  consentGrantedAt: string | null;
  adaptationLevel: "off" | "inform" | "adapt"; // athlete-controlled (§4.2)
  shareWithRoles: Array<"physiotherapist" | "psychologist" | "nutritionist">; // default []
}

// Body comp (Phase 3)
interface BodyCompTarget {
  userId: string;
  goal: "maintain" | "lean_out" | "build_muscle";
  performanceRangeKg: { low: number; high: number } | null; // §3.1, guidance not verdict
  rationale: string; // always shown with the range
}
```

### 1.3 Role × visibility × actions (extends the live lens pattern)

The monitoring-report lens pattern (`resolveRequesterRole` reading active `team_members`,
`lensForRoles`, per-layer shaping, raw medical never to coaches) is the template for **all**
v3 staff reads. `team_member_roles` stays dead — do not resurrect it.

| Role                          | Sees                                                                                                                 | Acts                                                                  | Hidden / shaped away                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Athlete (self)                | Everything of their own, incl. raw health, cycle, engine traces for their day                                        | Log everything; consent toggles; export/delete account                | Other athletes' detail; team views are summaries                                                                 |
| `head_coach` / `coach`        | Prescriptions, load/ACWR/readiness (consent-gated via blocked set), availability, operational injury restrictions    | Schedule CRUD, session review/lock, roster; safety overrides (logged) | Raw bloodwork (signal-only), raw wearable (derived bucket), clinical notes, cycle data (always, no consent path) |
| `strength_conditioning_coach` | Load/ACWR/readiness, strength trends, session detail                                                                 | Prescription adjustments within guard bounds; session library         | All clinical layers (bloodwork null today — keep), cycle data                                                    |
| `physiotherapist`             | Full clinical lens: injuries, physio blocks, raw bloodwork (behind `check_health_sharing`), wearable raw             | Injury/physio block CRUD (overrides engine, Law #2), RTP protocols    | Cycle data unless athlete adds role to `shareWithRoles` (§4.4)                                                   |
| `psychologist`                | Wellness/stress/mood trends, monitoring adherence, psych assessments                                                 | Psych logs, referrals                                                 | Load detail beyond summaries; cycle data unless consented                                                        |
| `nutritionist`                | Body comp trajectory, nutrition logs/plans, hydration, weight fluctuation                                            | Meal plans, macro targets, body-comp targets                          | Injury clinical detail; cycle data unless consented                                                              |
| Org admin (new)               | Rosters, staff assignments, compliance dashboards (counts, consent coverage, retention status) — **no athlete data** | Org/team CRUD, role approval, retention & consent policy config       | All individual health/performance data — org admin is an _administrative_ role, not a data-access escalation     |

---

## Phase 2 — Engine & safety-config refinement

Goal: keep the parity-proven engine exactly as safe as it is, while making its constants a
single importable artifact, its guards first-class values, and its decisions inspectable.
Every step below is refactor-under-test: the 29-case golden matrix must stay byte-identical
(new capabilities add fixtures; they never mutate existing expectations).

### 2.1 Domain module (V3.0)

Extract `angular/src/app/core/engine/` as the domain module boundary (engine +
`periodization-input-helpers` + models), keeping the esbuild mirror pipeline and the
`__periodization__` test bag. Name the brief's `WeekContext`/`DayContext` as thin aliases
over what exists (`PeriodizationInputs[]` + practice flags + phases + live day-0 gates → a
single `WeekContext` object), so `planWeek(context: WeekContext): PlannedWeek` becomes the
signature without changing semantics — one mechanical commit, parity-locked.

### 2.2 Safety-config module (V3.0)

New `engine/safety-config.ts`, the **only** place these literals live (engine currently
hardcodes ACWR consts at ~7 sites; `load-management.js` and the DB `detect_acwr_trigger`
duplicate thresholds — consistent today only because `acwr-config-drift.test.js` guards it):

```ts
export const SAFETY = Object.freeze({
  acwr: { under: 0.8, elevated: 1.3, danger: 1.5, critical: 1.8 },
  readiness: { low: 55, moderateMax: 75, secondSessionMin: 75 },
  rest: { minDaysPerWeek: 2, maxActiveDays: 5 },
  secondSession: {
    phases: ["offseason", "preseason"],
    maxAcwr: 1.2,
    minGapDays: 2,
  },
  cns: {
    baseHours: 48,
    byAge: [
      { minAge: 35, hours: 60 },
      { minAge: 40, hours: 72 },
    ],
  },
  wbgt: {
    caution: 27.8,
    reduce: 30.0,
    relocate: 32.2,
    stop: 32.2,
    maxVolumeCut: 0.5,
  },
  apparentTemp: {
    heatCaution: 28,
    heatReduce: 32,
    heatAvoid: 35,
    heatStop: 38,
    coldCaution: 4,
    coldAvoid: -5,
  },
  arrival: { capHours: 3, cappedRpe: 4, cappedMinutes: 30 },
  acclimatization: { windowDays: 14, maxShiftC: 4 },
} as const);
```

Rules: (a) backend imports it through the generated mirror — the drift test flips from
"compare literals" to "assert single import", (b) the three curated-but-unwired DB rules
tables (`taper_rules`, `weather_substitution_rules`, `contraindication_rules`) stay
methodology references in v3.0; wiring them as _staff-editable overrides_ is explicitly
deferred until the inspector (§2.4) exists to visualize what an override changes, (c)
**population-aware presets get wired**: `EvidenceConfigService.setPreset()` (today zero
callers — youth/RTP presets orphaned) becomes an engine _input_
(`inputs.populationPreset`), resolved server-side from age + active RTP status, with the
existing "never laxer than adult" drift test extended to the engine path. This closes the
audit's flagged architectural risk (an RTP athlete is currently always scored against adult
bands).

### 2.3 Composable guards (V3.0)

Formalize the existing pipeline into first-class values without changing behavior:

```ts
type Guard = (
  p: DailyPrescription,
  ctx: PeriodizationInputs,
) => {
  prescription: DailyPrescription; // updated or untouched
  trace: GuardTrace | null; // null = did not fire
};
interface GuardTrace {
  guard:
    | "cns"
    | "weather"
    | "arrival"
    | "injury"
    | "position"
    | "timeshift"
    | "cycle";
  fired: boolean;
  advisoryOnly: boolean;
  before: Pick<DailyPrescription, "intent" | "targetRpe" | "targetMinutes">;
  after: Pick<DailyPrescription, "intent" | "targetRpe" | "targetMinutes">;
  explanation: string; // the athlete-readable sentence
}
export const GUARD_PIPELINE: readonly Guard[] = [
  sprintRecoveryGuard,
  weatherGuard,
  arrivalDayGuard,
  injuryGuard,
  positionEmphasisGuard,
  timeShiftGuard,
]; // order IS precedence: later guards override earlier ones; injury stays above all load-bearing guards
```

The per-guard trace blocks already on `DailyPrescription` become derived views of
`traces: GuardTrace[]` (kept for API compatibility). This is the seam Phase 4's
advisory-only cycle guard plugs into (inserted _before_ `sprintRecoveryGuard` — lowest
precedence, `advisoryOnly: true`, structurally unable to change intent, see §4.3).

### 2.4 Observability & the engine inspector (V3.0)

- `planWeek` gains an optional `{ collectTraces: true }` flag returning `traces` per day
  (default off — zero cost in the hot path; the pure function stays deterministic).
- Server: `/api/periodization-prescription` logs a compact trace summary (guard names fired
  - before/after intents) alongside the existing `periodization_server_match|mismatch`
    telemetry; sampled rows go to a new `engine_trace_log` table (athlete-id'd, 30-day
    retention, staff-invisible — this is a debugging artifact, not a coaching surface).
- **Engine inspector** (internal tool, route `staff/engine-inspector`, gated
  `superadmins`): a form that builds a synthetic `WeekContext` (phase, practice days,
  ACWR/readiness sliders, weather, travel legs, injuries, age, position), runs the _local_
  engine, and renders the 7 days with every `GuardTrace` expanded — which guard fired, what
  it changed, why. Because `planWeek` is pure and client-bundled, this is a UI over an
  existing function: no backend, no data access, safe to ship early. It doubles as the
  review harness for every subsequent engine change in v3.

---

## Phase 3 — Athlete UX (men & women)

Today/This Week/Wellness/Training/Stats already exist and are LIVE — Phase 3 is targeted
additions, not a rebuild. Everything below respects Law #4 (answer-first), Law #5
(onboarding value before complexity), Law #7 / §5b (no fabricated data, non-destructive
prefill).

### 3.1 Onboarding additions

Current onboarding (team+role step → player settings → `/today`) already collects position,
height/weight, injuries, equipment, schedule. Add, in order of value:

1. **Body-comp goal** (maintain / lean out / build muscle) → `athlete_body_comp_targets`.
2. **Performance weight range**: computed guidance from position + height (+ age), shown
   with its rationale, stored on the target row. Example shape: a 188 cm DB/WR maps to
   ~82–84 kg as a speed/joint-load sweet spot. ⚠️ **The mapping table itself is a
   sports-science/product decision** (CLAUDE.md §3: not an engineering call) — proposed
   default: positional lean-mass index bands reviewed by the club's S&C lead, shipped
   behind a `rationale` string that always renders with the number. Copy rules (enforced in
   review, with a copy lint list): ranges are _guidelines for speed and joint health_;
   never "ideal weight", "overweight", or deficit framing; always lead with a current
   strength ("your 4.8s at 37 is already fast — this range is about protecting it").
3. **Cycle-tracking opt-in** (women, Phase 4 dependency): shown only when Phase 4 is live
   and the athlete's profile makes it relevant; skippable, off by default, with the plain-
   language privacy explanation (§4.1). Never blocks onboarding (Law #5).

### 3.2 Today: the "Why this day looks like this" panel

The data already exists on `DailyPrescription` (reasoning + per-guard adjustment blocks +
`acwrAtIssue`); v3.1 renders it. Below-the-fold accordion (`today/why-panel.component.ts`):
one row per fired guard from `traces`, ordered by precedence, each with the guard's
explanation sentence and a before→after chip (e.g. "Sprint → Technical · last high-CNS
session 39h ago, your window is 60h"). Rest-minimum demotions from `planWeek` render the
same way ("This is one of your 2 protected rest days"). For female athletes with
`adaptationLevel != "off"`, cycle-informed suggestions appear here as _advisory_ rows,
visually distinct from enforcing guards (§4.3). Readiness/ACWR chips link to the existing
education entries (§3.6).

### 3.3 Week view

`weekAhead()` already renders This Week. Add: (a) CNS color-coding — high-CNS intents
(`sprint`, `mixed`, competition) vs low-CNS/recovery, using `isHighCnsSessionType` (never a
re-derivation); (b) anchored practice/game markers from `v_athlete_schedule`; (c) risk
icons on days where a guard fired or ACWR is outside 0.8–1.3 (tap → that day's why-panel);
(d) enforced rest days visually protected (lock glyph, "why" links to the rest-minimum
law).

### 3.4 Nutrition & meal plans (completes the PARTIAL lane)

The engine already computes per-day `NutritionTargets` (CARB_PER_KG 3–7 g/kg by intent,
protein 1.8 g/kg, fluids 35 ml/kg + competition/heat/density bonuses) — single source, do
not recompute. v3.1 wires the consumer side:

- `nutrition_plans` + `meal_templates` (tables live) get a generator: body-comp goal +
  today's `NutritionTargets` → a day template (breakfast/lunch/dinner/snacks) in
  **food-first language** (Law #3: portions and plates, no g/kg on athlete surfaces —
  grams stay on the nutritionist lane). Training-day vs rest-day variants fall out of the
  intent-keyed carb table automatically.
- Above-range athletes (e.g. 188 cm / 90 kg vs an 82–84 kg range): the _plan_ shifts
  (slightly lower energy density, carb quality, timing) — the _copy_ stays functional
  ("fueling tuned for speed development"), never corrective. No calorie-deficit numbers on
  athlete surfaces; the nutritionist lane sees the actual targets.
- Hydration guidance renders the engine's fluid target with heat/travel bonuses explained.

### 3.5 Weight & body-comp tracking

`physical_measurements` already stores weight + full body-comp. v3.1 adds the athlete
surface: a Stats chart of weight (+ optional body-fat/muscle-mass) over time with the
performance range as a shaded band — **no red zones, no target arrows**; out-of-band
rendering is neutral. Overlay toggles for readiness and weekly load (both from their
canonical stores) so the athlete sees _correlation with function_, which is the honest
story. Logging is athlete-initiated; no weight-entry nags (nudges are for wellness
check-ins, which drive safety — weight does not).

### 3.6 Education

`knowledge_base_entries` + search are LIVE. Add short evidence-graded entries (claim →
evidence strength → practical takeaway) for: ACWR, readiness, why ≥2 rest days,
CNS recovery windows, cycle-phase basics (strong vs weak evidence, explicitly), fueling and
sleep. Tooltips throughout v3 link into these entries rather than embedding copy (single
source for education text too).

---

## Phase 4 — Female health & menstrual cycle

### 4.0 Preconditions (blocking, in order)

1. Product decision that FlagFit Pro serves female athletes (§0.3 flag) — with named
   populations (which teams/orgs).
2. DPIA covering Art. 9 processing; privacy policy update; retention decision.
   Lawful basis: **explicit consent, Art. 9(2)(a)** — per-purpose, revocable, dated,
   stored on `cycle_settings.consentGrantedAt`. The 2026-06 drop migration is the
   documented precedent that this app deletes this data class when the basis lapses.
3. Phase 6's consent-policy plumbing (org-level `minorsEnabled=false` initially; cycle
   features are 18+ until the parental-consent layer is wired — no U18 cycle data, ever,
   in v3).

### 4.1 Data model & consent

Two tables (new migration; names deliberately not reusing the dropped ones):

- `cycle_logs` — per §1.2 `CycleLog`: date, bleeding intensity, enumerated symptoms
  (checkboxes, not free text, minimizing identifiable content), contraception status
  (needed for phase-estimation validity; "undisclosed" is a first-class value).
- `cycle_settings` — consent + `adaptation_level` (`off`/`inform`/`adapt`) +
  `share_with_roles[]` (default empty).

RLS: owner-only by default; staff SELECT **only** via a
`can_staff_read_cycle(athlete, staff)` SECURITY DEFINER helper that checks active shared
team + role ∈ `share_with_roles` + consent not revoked (same shape as
`check_health_sharing`, but a **separate flag** — general health sharing must never imply
cycle sharing). Revocation is immediate; deletion of all cycle rows is a one-tap athlete
action (independent of account deletion); `data-export.js` adds both tables to
`USER_DATA_TABLES` in the same PR that creates them.

### 4.2 Phase estimation

A pure client/engine function (same mirror pipeline as the engine —
`estimateCyclePhase(logs, date): { phase: CyclePhase; confidence: "low"|"medium"|"high" }`):
cycle-start detection from bleeding entries, median cycle length over the last 3–6 cycles,
calendar-based phase windows. Rules: hormonal contraception → estimation returns
`confidence: "low"` and adaptation copy switches to symptom-only mode (calendar phases are
not meaningful under most hormonal contraception); fewer than 2 logged cycles → `inform`
mode only. No prediction of fertility, ever — this is a training-context tool and the copy
says so.

### 4.3 Training adaptations — advisory by design

Evidence, honestly summarized (and shown to the athlete in those terms, §3.6): meta-analytic
performance effects across cycle phases are **small and heterogeneous** — trivial reductions
in some outcomes during early follicular/menstruation for _some_ athletes; the widely-cited
luteal/pre-menstrual soft-tissue-injury and follicular ACL-risk signals are suggestive but
not strong enough for blanket prescription changes. Symptom burden, however, is real,
individual, and actionable.

Therefore the engine integration is a **`cycleAdvisoryGuard`** at the _lowest_ precedence
slot (§2.3), and it is `advisoryOnly: true` — the type system prevents it from changing
`intent`, `targetRpe`, or session structure. What it may do, per `adaptationLevel`:

- `off` — guard skipped entirely; no cycle data enters `PeriodizationInputs`.
- `inform` — a why-panel row: expectation-setting ("many athletes feel X in this phase;
  your logs show you reported cramps on 3 of the last 4 luteal weeks") + emphasis nudges
  (extended warm-up, mobility, sleep focus).
- `adapt` — additionally: `recoveryEmphasis` may step up one level, warm-up blocks in the
  realization engine get the extended variant, and _suggested_ (not applied) sprint-density
  reductions render as a one-tap athlete choice. The athlete's tap — not the engine —
  writes the adjustment, and it's logged like any self-report (the Merlin-loop pattern,
  §5a law: self-report → recalculation, never silent).

Symptom logs flow into the _existing_ wellness pathway where they belong (severe reported
symptoms are already representable as soreness/fatigue in `daily_wellness_checkin`, which
legitimately moves readiness) — the cycle module never creates a second readiness input.

### 4.4 Staff visibility & aggregates

- Individual cycle data: athlete + explicitly consented health roles only
  (`share_with_roles`). Coaches (head/assistant/S&C) have **no consent path at all** — the
  option is not offered, by design.
- Team aggregates for physio/psych (adults only): phase-distribution vs injury/wellness
  trend views, computed server-side with **k ≥ 5 suppression** (any cell derived from
  fewer than 5 consenting athletes renders as "insufficient data") and no drill-down. Reads
  logged to `consent_access_log` (wired in Phase 6).

---

## Phase 5 — Coach & staff dashboards (visual, not Excel)

All reads go through the existing consent machinery (blocked-set gating as in
`coach-core.js`; lens shaping as in `monitoring-report.js`). Charting: a small wrapper over
a lightweight chart lib (or hand-rolled SVG components, consistent with the no-PrimeNG
static-first rebuild — decide at implementation by bundle-size test; signals + SVG is the
default preference). CSV export stays available on every view.

### 5.1 Team dashboard (`staff/dashboard`)

- **ACWR strip**: per-athlete sparkline + current zone dot, sorted worst-first, zone
  colors from `ACWR_RISK_ZONES` (imported, not restated).
- **Readiness distribution**: stacked band chart (low <55 / moderate / high >75) over 28
  days; position filter.
- **Rest-compliance heatmap**: athletes × last 4 weeks, cells = rest days taken vs the
  ≥2 minimum; engine-demoted days marked.
- **Injury/rehab board**: from `v_injuries_unified` + `physio_blocks` — operational lens
  for coaches (restrictions, RTP dates), clinical detail only on the physio lane.
- **Fixtures rail**: next 14 days from the schedule spine with density warnings
  (`DENSITY_HEAVY_GAMES_14D = 10`, `DENSITY_CONGESTED_DAY_GAMES = 3` — same constants).

### 5.2 Daily monitoring: athlete cards + outlier plot

Replace grid-first monitoring with cards (one per athlete): readiness score + trend arrow,
today's intent, flags (guard fired / low wellness / no check-in), and a recommended action
chip — `Full session` / `Monitor` / `Individualize` / `Rest`, derived from readiness band ×
ACWR zone in **one** shared classifier (`staff-action.util.ts`, engine-adjacent, with its
own fixture tests — this is a new safety-relevant mapping, so it gets an owner row per
principle 5). Supporting charts: wellness component bars (sleep/fatigue/stress/soreness
from the check-in), and a load-vs-readiness scatter with outlier highlighting (high load +
low readiness quadrant flagged).

### 5.3 Schedule planning with live engine reaction

Because `planWeek` is pure and client-bundled, the coach's schedule editor gets **what-if
replanning for free**: on add/move/remove of a practice/game/travel leg, re-run `planWeek`
per selected athlete profile (or a representative default) and diff the before/after week
inline. Warnings surface exactly the engine's own findings — demotions the rest-minimum
would force, high-CNS clustering (spacing guard firings), taper conflicts — with the
engine's explanation strings, not a parallel heuristic. Writes still go through the normal
schedule endpoints; the preview is client-side and stateless. (This also finally gives
`team-practice-plan.js` — currently ORPHANED — its calling UI.)

### 5.4 Staff-lane views (extends existing lanes)

- **S&C**: load/ACWR trends, strength-session history (`training_sessions` filtered),
  readiness overlays; session-library authoring.
- **Physio**: injury timeline per athlete (already partially in `athlete-detail`), physio
  block editor (engine override, Law #2), RTP progression, exposure-to-risk view (guard
  firings involving their restrictions).
- **Psych**: stress/mood/motivation trends from check-ins, monitoring adherence
  (check-in streaks), consented aggregate cycle-wellbeing view (§4.4).
- **Nutritionist**: body-comp trajectories vs performance range, plan adherence
  (`nutrition_logs` vs plan), weight-fluctuation flags (existing calc in
  `staff-nutritionist.js` stays the owner).

### 5.5 Endpoints

New functions (each with its own `netlify.toml` redirect — the team-join lesson):
`staff-team-dashboard.js` (aggregates above, blocked-set-gated),
`staff-monitoring-cards.js`, plus small additions to existing lanes. All are read-shaped
per requester lens; none exposes a new raw-medical path.

---

## Phase 6 — Org/admin, permissions & privacy

### 6.1 Organizations (greenfield)

`organizations` + `organization_members` per §1.2; `teams.organization_id uuid NULL` (all
existing teams remain org-less — no backfill required; org features simply don't apply).
Org admin surface (`staff/org/*`): team CRUD, staff assignment + the existing
`role_approval_status` flow escalated to org level, compliance dashboard (consent coverage
%, athletes with pending deletion requests, retention status), and policy config
(retention days, `minorsEnabled`, which consent defaults teams start with). Org admins get
**no athlete-data lens** (§1.3) — deliberately.

### 6.2 Permission consolidation & wiring the dormant pieces

- Wire `consent_access_log`: a small `logConsentAccess()` helper called from every
  consent-gated read path (monitoring report, staff dashboards, cycle aggregates). Same
  PR adds the athlete-facing "who accessed my data" view (Settings → Privacy).
- Wire `athlete_consent_settings` (granular share toggles, currently schema-only) into
  Settings, superseding the coarse `team_sharing_settings` booleans where they overlap —
  one settings surface, the helpers updated to consult both (team override → granular →
  default), documented in the helper, not in three places.
- **RLS tightening (known deferred weakness)**: scope `readiness_scores` /
  `session_version_history` staff SELECT policies to shared-team membership (today any
  active physio in _any_ team passes RLS; the API blocked-set is the real control).
  Defense-in-depth item, explicitly on the v3 list so it stops being deferred.
- U18 (future-phase, design now): `parental_consent` + `parent_guardian_links` +
  `youth_athlete_settings` already exist dormant. v3 ships the org-level `minorsEnabled`
  gate defaulting false and a documented activation checklist (guardian verification flow,
  data-minimized athlete profile, no cycle tracking, stricter retention). No U18 features
  ship in v3 itself.

### 6.3 GDPR & data lifecycle

Exists and stays: `data-export.js` (Art. 15/20), `account-deletion.js` (soft → 30-day →
hard, pg_cron), CASCADE-aligned FKs. v3 adds: every new table lands in `USER_DATA_TABLES`
and the deletion cascade **in its creating PR** (checklist item in the PR template);
retention jobs honoring `organizations.data_retention_days` (default: keep; org policy can
shorten); a plain-language "what we store, why, who sees it, how long" page generated from
a structured registry file so it can't drift from the schema (same generated-docs
philosophy as `DATA_MODEL.md`).

---

## Phase 7 — Integrations, analytics & research

### 7.1 Wearables & external load (build the callers, not the lanes)

`session-load-import.js` and `wearable-health-ingest.js` are ORPHANED **by design** —
external-caller ingest lanes with no UI. v3.5: provider connectors (start with one GPS/IMU
vendor + one HRV/sleep source) posting into these lanes, `device_pairings` +
`monitoring_providers` (tables live) for pairing UX, and `wearable_consent` enforced at
ingest (rows already carry `consent_state`). Ingested load merges into ACWR via the
existing `MAX(logged, estimate)` day rule — never double-counted, never lowered.

### 7.2 Federation systems & fixtures

The `competitions` table (level, governing_body, `external_id`, `source`, zero write
endpoints today) was built for exactly this: a fixture-import function
(`competition-sync.js`) mapping federation feeds into `competitions`/`competition_events`,
which the V2.4 tier-taper logic already consumes (`competitions.level` floors taper depth).
This closes the documented "team-side tiers are engine-ready but DB-only to set" gap.

### 7.3 Analytics & research export

Staff analytics (aggregate, anonymized, k ≥ 5): injury incidence vs ACWR zone-time,
readiness/wellness trends by team and position, guard-firing frequencies (is the heat guard
doing all the work in August?), and — consented adults only — cycle-phase × injury/wellness
aggregates (§4.4). These views are also the evidence loop for the engine itself: threshold
changes in `safety-config.ts` should cite them. Research export: a de-identified ETL
(stable pseudonymous IDs, dates coarsened to week, no free-text fields, k-anonymity
verified) behind org-level agreement + per-athlete research consent (a _separate_
`consent_research` flag in `user_preferences` — never bundled), documented ethics
checklist per export.

---

## Phase 8 — Testing, observability & accessibility

**Testing.** Every new guard/calculation: unit tests + golden fixtures in the parity matrix
(cycle guard fixtures must prove `advisoryOnly` can't mutate intent — a type-level and a
runtime test). Integration: `planWeek` scenario suite grows the brief's edge cases
(storm + travel + injury same day; low readiness + high ACWR + competition tomorrow;
congested tournament week + arrival cap). Existing suites stay the backbone: 716 backend +
469 Angular tests, `test:privacy` (consent gating), `check:consent`, `acwr-config-drift`.
Dashboards get DOM tests on the shaping boundary (a coach lens response never contains raw
bloodwork keys — test the JSON, not the pixels) plus snapshot tests for chart components.
New-endpoint checklist keeps the redirect lesson: a curl-the-deployed-path smoke assertion
per new function.

**Observability.** §2.4's traces + `engine_trace_log`; `RemoteTelemetryService` events for
guard firings and drift-canary results; the engine inspector as the human debugging
surface; consent-access logging (§6.2) doubling as the privacy audit trail.

**Accessibility & localization.** Runtime dictionary i18n (JSON per locale, signal-driven,
default `en`, first targets `sl`/`de` — compile-time `@angular/localize` per-locale builds
fight the single-bundle Netlify setup; a runtime dictionary also lets staff correct copy
without a deploy). All engine/guard explanation strings move to keyed templates in the same
pass (they're user-facing copy, currently English literals in the engine — the port mirror
keeps keys, locales resolve at render). WCAG 2.1 AA: chart color scales double-encoded
(color + shape/label — the ACWR zone dots get letters), keyboard-navigable dashboards,
`prefers-reduced-motion`, and the existing design-token lint (`lint:tokens`) extended with
a contrast check. Performance budget: dashboards virtualize rosters >30, charts render
from pre-aggregated endpoint payloads (no client-side 42-day recomputes), Lighthouse
budgets in CI for the two heaviest new routes.

---

## Implementation roadmap

Ordering principle: engine formalization first (everything else renders its outputs), then
athlete-visible value, then staff surfaces, then the org/legal layer that female health
depends on, then integrations. Each milestone is shippable and individually revertible.

| Milestone                           | Contents                                                                                                                                                       | Depends on                                 |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **V3.0 — Engine hardening**         | §2 complete: domain module, `safety-config.ts`, composable guards + traces, population presets wired, engine inspector                                         | —                                          |
| **V3.1 — Athlete UX**               | Why-panel, week-view risk/CNS coding, body-comp goal + performance range (post sign-off), weight/body-comp charts, nutrition-plan generator, education entries | V3.0 (traces)                              |
| **V3.2 — Staff dashboards**         | Team dashboard, monitoring cards + action classifier, schedule what-if, lane views, new staff endpoints                                                        | V3.0; parts of V3.1                        |
| **V3.3 — Org & privacy layer**      | Organizations, org admin surface, consent-access logging + granular settings wired, RLS tightening, retention policy, privacy page                             | — (parallel to 3.1/3.2)                    |
| **V3.4 — Female health**            | §4 complete: cycle tables + consent, phase estimation, advisory guard, staff aggregates                                                                        | V3.0 + V3.3 + **legal preconditions §4.0** |
| **V3.5 — Integrations & analytics** | Wearable connectors, fixture sync, analytics views, research export                                                                                            | V3.2 (dashboards host the views)           |

MVP line: **V3.0 + V3.1** is a coherent release (athletes see and understand every engine
decision; safer config; no new data classes). V3.2 is the coach-retention release. V3.4
deliberately sits late — not because it's low-value, but because shipping Art. 9 data
collection before the consent/org/audit layer exists would repeat the exact mistake the
2026-06 drop migration cleaned up.

## Critical trade-offs & open questions

1. **Menstrual-phase evidence: strong for symptom-driven individualization, weak for
   phase-driven prescription.** Design consequence (locked in §4.3): the cycle guard is
   structurally advisory-only. Open question for the sports-science owner: does `adapt`
   mode's one-tap sprint-density reduction go in v3.4 or does v3.4 ship `inform`-only and
   earn `adapt` from its own aggregate data (§7.3)? Default proposal: ship both, `inform`
   as default level.
2. **Safety enforcement vs coach autonomy.** Current stance (keep): the engine enforces
   rest-minimum/ACWR-danger/injury precedence for the _plan_; coaches can override
   individual sessions but overrides are logged (`safety_override_log`) and the why-panel
   shows the athlete what was overridden. Open: should repeated overrides of the same guard
   surface on the org compliance dashboard? Proposed: yes, count-only, no shaming copy.
3. **Performance weight range table** — sports-science/product sign-off needed before any
   number renders (§3.1). Until then V3.1 ships goal + trend charts without the range band.
4. **Population presets**: wiring youth/RTP thresholds (§2.2) changes what some athletes
   are told. It ships behind the parity harness with before/after diffs over real
   historical inputs (CLAUDE.md §3 safety discipline), reviewed via the inspector.
5. **Charts: hand-rolled SVG vs a library.** Default: hand-rolled signal-driven SVG
   (consistent with the PrimeNG removal and bundle discipline); revisit only if V3.2
   velocity suffers.
6. **Wearables scope creep.** One GPS/IMU + one sleep/HRV provider in v3.5, chosen by what
   the actual rosters wear — an inventory question for the club before any connector work
   starts.
7. **U18**: designed-for, explicitly out of v3. The dormant parental-consent schema stays
   dormant until a real youth program signs up, with the activation checklist (§6.2) as
   the contract.
