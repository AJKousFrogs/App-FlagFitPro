# FlagFit Pro v11 — Phase 0: Engine State MAP

**Date:** 2026-06-15 · **Mode:** read-only (no code changes) · **Method:** 5 parallel
file-level audits + structural scan.
**Ground-truth docs:** `docs/SOURCE_OF_TRUTH.md` (authoritative runtime SOT),
`docs/generated/RECONCILIATION.md` (254-claim audit). No `audit.md` file exists.

Status legend: **HAVE** (built & wired) · **PARTIAL** (built, gaps) ·
**ORPHANED** (computed/defined, no consumer) · **DEAD** (unreachable code path) ·
**MISSING** (not present) · **DRIFT** (duplicate/conflicting implementations).

---

## 1. Master state table

| # | Capability | Primary file : function | Status | Evidence |
|---|---|---|---|---|
| 1 | ACWR via EWMA (not rolling avg) | `netlify/functions/utils/acwr.js:52 ewma()` / `:87 computeAcwrAt`; `acwr.service.ts:234 calculateEWMA` | **HAVE** | True recursive EWMA, uncoupled 7d/21d, mirrored server+client |
| 2 | EWMA λ constants | `acwr.js:31 ACWR_DEFAULTS`; `evidence-presets.ts:117` | **HAVE** | acute λ=0.25 (N=7); **chronic λ=0.0909 (N=21)** — not 0.069/N=28 |
| 3 | ACWR sweet-spot/danger thresholds | `acwr.js:146 ACWR_RISK_ZONES`/`:155 classifyAcwrZone`; `acwr.service.ts:490 riskZone` | **HAVE** | 0.8–1.3 sweet / >1.5 danger / >1.8 critical; consumed by 5 components |
| 4 | sRPE session load (RPE×min) | `acwr.js:127 computeSessionLoad`; `acwr.service.ts:1147` | **HAVE** | `workload ?? rpe*duration`; computed live from `training_sessions`, **not cached** (load tables dropped) |
| 5 | Training monotony (mean/SD) | `load-management.js:475 calculateMonotony` | **ORPHANED** | Correctly computed + `/monotony` endpoint; **no Angular caller** |
| 6 | Training strain (load×monotony) | `load-management.js:550` | **ORPHANED** | Computed in same dead function; no UI reads `.strain` |
| 7 | ACWR-spike / load-cap service | `acwr-spike-detection.service.ts:25` | **ORPHANED** | Hard-codes `loadCapsUnavailable=true` → every method no-ops |
| 8 | Weather gating function | `periodization.service.ts:1201 applyWeatherGuard` (in `prescribeFor`) | **HAVE** | In client pipeline; precedence physio ▷ weather ▷ CNS ▷ engine |
| 9 | Weather → UI | `today.component.html:19`; `gameday.component.html:35` | **PARTIAL** | Reason renders on Today/Gameday; **Training page flips band only, no reason**; no backend guard |
| 10 | WBGT/GHSA °F table (82/86.9/89.9/92) | — | **MISSING** | Uses metric apparent-°C: `HEAT_CAUTION_C=28/REDUCE=32/AVOID=35/STOP=38` |
| 11 | Season periodization (client) | `periodization.service.ts:1071 macroPhaseFor` | **HAVE** | Athlete `season_calendar` → off/pre/in/transition/peak/postseason |
| 12 | Season periodization (backend) | `daily-protocol-training-logic.js:359 getCurrentPeriodizationPhase` | **DRIFT** | Hardcoded `switch(month)`, ignores athlete calendar |
| 13 | Periodization phase resolver (taper/recovery) | `schedule.js resolvePhase` ↔ `schedule.service.ts resolvePhase` | **HAVE** | Mirror contract; recovery-before-taper precedence (fixed 2026-06) |
| 14 | Graduated deload **week** | — | **MISSING** | "deload" is only readiness *vocabulary*; no periodized deload mechanism |
| 15 | Taper (graduated, backend) | `daily-protocol.js ~619 loadMultiplier` | **DEAD** | Graduated formula real but `upcomingTournaments=[]` hardcoded (D9 dead branch) |
| 16 | Taper (live, client) | `periodization.service.ts TAPER_CONFIG` / `PRACTICE_PHASE_MODIFIERS.taper` | **HAVE** | Step-wise intent/RPE/min swap (RPE6/60→RPE5/45), not continuous % |
| 17 | CNS sprint-to-sprint spacing | `periodization.service.ts:466 applySprintRecoveryGuard` | **PARTIAL** | Downgrades back-to-back high-CNS; single 48/60/72h age-scaled window |
| 17b | CNS guard UI | model `cnsRecoveryAdjustment` | **ORPHANED** | Field defined, rendered in no template; only side-effects reach athlete |
| 17c | Second spacing source | `training-modalities.config.ts:70-119` | **DRIFT** | Independent per-modality "72h" spacing, not read by the guard |
| 18 | Readiness score (0–100) | `calc-readiness.js:786 handler` | **HAVE** | Weighted composite; server-canonical; writes `readiness_scores` |
| 19 | Hooper-style items | `calc-readiness.js:181`; `daily_wellness_checkin` cols | **PARTIAL** | sleep/soreness/stress/energy collected; not labeled/composited as Hooper; no distinct "fatigue" col |
| 20 | sRPE-load trend → readiness | `calc-readiness.js:558` | **HAVE** | ACWR workload component = 35% of score |
| 21 | HRV vs rolling baseline | — | **MISSING** | Zero HRV references anywhere |
| 22 | Resting HR input | `wellness.service.ts:36,82` (types only) | **ORPHANED** | `resting_hr` typed client-side; no DB column, no consumer |
| 23 | Readiness contributing-factor breakdown UI | `wellness.component.html:108-128` | **PARTIAL** | Shows score + band + **static** weights; `componentScores`/`calibrationNote` returned by API but **not rendered** |
| 24 | Evidence-content data (presets/citations) | `evidence-config.ts`, `evidence-presets.ts` | **HAVE** | 3 versioned presets, 7 cited studies; typed |
| 25 | Evidence config consumed by engine | `acwr.service.ts:129 getACWRConfig`/`:989 getActivePreset` | **HAVE** | ACWR windows/λ/thresholds parameterized from active preset |
| 25b | `getReadinessConfig`/`getTaperingConfig` | `evidence-config.service.ts:69,76` | **ORPHANED** | Methods defined, no callers |
| 26 | Nordic hamstring prescription | `daily-protocol-training-logic.js:456 shouldIncludeNordicCurls`; `daily-protocol.js:276` | **HAVE** | Gated into strength days; **but blind** (keys on day/focus only, no athlete data) |
| 27 | FIFA 11+ warm-up | `daily-protocol-blocks.js:128 addWarmupBlock` | **PARTIAL** | Generic warm-up on all sessions; **not** the structured 11+ protocol |
| 28 | Prevention-block compliance tracking | — | **MISSING** | Only `staff-nutritionist.js calculateSupplementCompliance` exists |
| 29 | Physio-block precedence (Angular) | `periodization.service.ts:654 applyInjuryGuard` | **HAVE** | Severity-tiered; zeros sprintReps, downgrades intent |
| 30 | Physio precedence (server authority) | `session-resolver.js:282 getActiveInjuries`; `team-activity-resolver.js:82` | **HAVE** | Severity-tiered, expiry-aware → `rehab_protocol` |
| 31 | Physio precedence (live daily protocol) | `daily-protocol.js:1196` | **PARTIAL / BUG** | Triggers RTP off **raw soreness slider**, **bypasses** `getActiveInjuries` authority |
| 32 | Return-to-play workflow | `return-to-play.js` (7-stage); `daily-protocol-rtp.js`; `staff-physiotherapist.js` | **HAVE** | Full lifecycle; correctly writes `acwr_value:null` (no fabrication) |
| 33 | LSI / hop-test self-entry | — | **MISSING** | No input UI |
| 34 | LSI corrective prescription | `daily-protocol.js:269 asymmetryThreshold:0.1`; `asymmetry_index` col | **ORPHANED** | Threshold + column exist; never read/compared |

---

## 2. Reconciliation vs the v11 report's Feature Gap Map

| Capability | Report claim | Verified actual | Verdict |
|---|---|---|---|
| ACWR via EWMA | HAVE | HAVE (chronic 21d, not 28d) | ✅ accurate |
| sRPE session load | HAVE | HAVE (live, not cached) | ✅ accurate |
| Monotony / strain | MISSING | **ORPHANED** (computed, no caller) | ✗ stale — wire, don't build |
| Season periodization | HAVE | HAVE (client) + **DRIFT** (backend `switch(month)`) | ⚠️ partial |
| Weather gating | PARTIAL — orphaned from frontend | **HAVE & wired** (Today+Gameday) | ✗ stale — it *is* wired |
| CNS sprint spacing | MISSING | **HAVE** (coarse, unrendered) | ✗ stale — refine, don't build |
| Graduated deload | PARTIAL — binary today | **MISSING** week + **DEAD** taper + step-wise live taper | ✗ worse than claimed |
| Evidence wiring | PARTIAL — not consumed | **HAVE** for ACWR; readiness/taper cfg ORPHANED | ⚠️ partial |
| Readiness / wellness score | MISSING | **HAVE** (server-canonical); breakdown UI PARTIAL | ✗ stale — surface, don't build |
| Injury-prevention + compliance | MISSING | Nordic HAVE(blind) / FIFA11+ PARTIAL / compliance MISSING | ⚠️ partial |
| Physio-block precedence | HAVE | HAVE (2 paths) **but hot path bypasses authority** | ⚠️ has a bug |
| Limb-symmetry / hop-test | MISSING | MISSING input + ORPHANED data field | ✅ accurate |

**Conclusion:** The report's gap map is accurate on 4/12 rows and stale on the rest —
overwhelmingly because features are *more built* than claimed. The report's own TL;DR is
the correct frame ("the highest-value work is wiring orphaned/binary logic, not new
features"); the per-row labels just hadn't caught up. The one row that is *worse* than
claimed is **deload**.

---

## 3. Cross-cutting issues — the real v11 backlog

1. **Physio-authority bypass (highest severity).** `daily-protocol.js:1196` generates RTP
   off the raw `daily_wellness_checkin.soreness_areas` slider instead of the documented
   `getActiveInjuries()` authority (severity-tiered, expiry-aware). The authoritative
   rehab decision is computed by `session-resolver.js` but **not consulted** on the daily
   hot path. Violates SOT physio-precedence LAW. → Phase 5 / Phase 2.
2. **Three EWMA implementations.** Canonical `utils/acwr.js`, Angular mirror
   `acwr.service.ts`, and a legacy `load-management.js:665 calculateEWMA` (`exp(-1/τ)`,
   42d/7d CTL/ATL). Drift risk; consolidate to one source.
3. **Two periodization engines.** Client `macroPhaseFor` (athlete calendar) vs backend
   `getCurrentPeriodizationPhase` (`switch(month)`). Violates named-constants /
   "zero months in code" LAW. → Phase 3.
4. **Two CNS-spacing sources.** `applySprintRecoveryGuard` (hardcoded 48/60/72h) vs
   `training-modalities.config.ts` per-modality spacing. Unify under one constant set.
5. **Orphaned-but-correct compute.** monotony, strain, load-caps, `getReadinessConfig`/
   `getTaperingConfig`, `cnsRecoveryAdjustment`, `componentScores`/`calibrationNote`,
   `asymmetry_index` — all computed/defined/returned but never consumed or rendered.
   The dominant v11 pattern is **wiring**, not building.
6. **No "monitoring, not prediction" disclaimer in UI.** Code comments cite Impellizzeri
   2020, but `load-management.js:16` still advertises "injury risk **prediction**" —
   directly contradictory. → Phase 3 UI label.
7. **Dead graduated taper.** The only continuous volume-reduction (`daily-protocol.js`
   taper `loadMultiplier`, minLoadPercent 0.4/0.6) is unreachable. Either revive it as
   the graduated-deload basis or delete it. → Phase 3.
8. **~40 GHOST-table endpoints** error at runtime (equipment, officials, depth-chart,
   `usda_foods`, `team_chemistry`, `program_cycles`, seasons, scouting). → Phase 1/5.

---

## 4. P0 status — both already FIXED

- **(a) Onboarding `finish()`** — `onboarding.component.ts:121-150`: navigates only in the
  `next` callback; `error` callback stops, restores `saving=false`, shows retry. Re-entrancy
  guard present. **FIXED.**
- **(b) Daily-input defaults-over-real-data** — `wellness.component.ts:112-125`: effect
  hydrates today's saved row before submit (sleep/soreness/energy/mood/stress/travel);
  same pattern for supplements/tightness; backend `upsert_wellness_checkin` COALESCEs
  null→existing. **FIXED.**

→ **Phase 2 reduces to verification + regression tests**, not new fixes.

---

## 5. Canonical schema names (carry into Phase 1)

Mis-inferred names corrected by RECONCILIATION (verify against the 203 migrations in Phase 1):
- Wellness check-in → `daily_wellness_checkin` (not `wellness_checkins`)
- Injuries → `athlete_injuries` + `v_injuries_unified`
- Training load → `training_sessions` (load caches `load_monitoring` / `training_load_metrics` were **dropped**)
- Readiness → `readiness_scores`
- `supabase-types.ts` is **STALE** — do not trust as schema source.

---

## 6. Implied phase re-scoping

- **Phase 1 (Verify schema):** proceed as written; prioritize the GHOST-table list + the
  4 canonical names above; RLS check.
- **Phase 2 (P0s):** downgrade to *verify + lock with tests* (both already fixed).
- **Phase 3 (Engine upgrades):** real net-new is **graduated deload** (revive/repurpose the
  dead taper) + **WBGT option** + **monotony/strain wiring** + **dedup** (EWMA ×3,
  periodization ×2, CNS spacing ×2) + ACWR "monitoring" label + Training-page weather reason.
- **Phase 4 (Extend):** readiness = **surface existing `componentScores`** (not new engine);
  injury-prevention = **compliance tracking + structured FIFA 11+** (Nordic already prescribed);
  LSI = genuinely net-new (input UI + wire the existing `asymmetry_index`/threshold).
- **Phase 5 (Harden):** fix the **physio-authority bypass** (#1 above); coach-lane + achievements tests; precedence assertion.
