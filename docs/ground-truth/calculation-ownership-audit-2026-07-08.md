# Calculation-Ownership Audit — Backend Source-of-Truth Verification (2026-07-08)

**Objective:** every safety/metric calculation has ONE backend source of truth; the
frontend displays, never recalculates. Grep-verified across `netlify/functions/`,
`angular/src/`, DB triggers/RPCs (live introspection), and migrations.

**Verdict legend:** ✅ single backend source · ⚠️ duplicate/divergent — fix scheduled ·
❌ broken/dead — fix required.

---

## 1. Readiness score — ⚠️ TWO backend formulas (divergent weights)

|                  |                                                                                                                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical source | `netlify/functions/calc-readiness.js` → `readiness_scores` (wellness subscore: sleep .4 / soreness .3 / energy .3; optional mood .5 / stress .5; 60/40 blend)                                                                         |
| Second source    | `netlify/functions/wellness-checkin.js` `calculateReadiness()` (sleep .3 / energy .25 / stress .25 / soreness .2 + travel penalty) → `daily_wellness_checkin.calculated_readiness`; drives coach alerts (<40%) and achievements (≥90) |
| Frontend         | ✅ display-only (`readiness.service.ts`: 5 API calls, 0 math; `get_athlete_readiness` RPC is fetch-only)                                                                                                                              |
| DB               | `upsert_wellness_checkin` stores the passed value, no SQL math ✅                                                                                                                                                                     |
| **Issue**        | An athlete can see "wellness low (38%)" from the check-in formula while Today shows readiness 52 from the canonical one. Same-named number, two formulas, both user-facing.                                                           |
| **Fix**          | Make `wellness-checkin.js` call/share the `calc-readiness` scoring module; one formula, two consumers.                                                                                                                                |

## 2. ACWR / Training-load ratio — ⚠️ dual engine (guarded, consolidation scheduled)

|                            |                                                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend authority          | `utils/acwr.js` (`ACWR_DEFAULTS` 7/21, λ 0.25/0.0909, floor 50; `ACWR_RISK_ZONES`) + `compute-acwr.js`; stored in `readiness_scores.acwr`                                                                                       |
| Duplicate                  | `angular acwr.service.ts` — full independent EWMA engine incl. `calculatedLoad = rpe * duration` fallback (line ~1161)                                                                                                          |
| Guard                      | `tests/unit/acwr-config-drift.test.js` (CI): EWMA params unified; no preset laxer than backend; default preset == backend exactly                                                                                               |
| Threshold literals also at | `load-management.js` (0.8/1.3/1.5/1.8 hardcoded), DB `detect_acwr_trigger` (0.8/1.5 hardcoded, reads stored acwr — no recompute), periodization engine consts. All currently consistent; literals not imported from one module. |
| **Fix**                    | Batch 2b: client consumes `readiness_scores.acwr` / `compute-acwr`, retire the client EWMA. `load-management.js` + future SQL should import/reference `ACWR_RISK_ZONES`.                                                        |

## 3. Periodization / load-deload phase — ⚠️ client-owned engine; server port parity-proven, not yet consumed

|                       |                                                                                                                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live computation      | client `periodization-engine.ts` (pure, DI-free) via `periodization.service.ts` wrapper — Today/week prescriptions                                                                                                           |
| Server mirror         | `netlify/functions/utils/periodization-engine.js` — GENERATED from the TS source (`npm run build:periodization-engine`), **28/28 golden-parity vs client** (`periodization-port-parity.test.js`, doubles as staleness guard) |
| Second (by design)    | `daily-protocol.js` taper/phase logic — COMPOSE contract: daily-protocol _realizes_ the periodization intent; documented two-engine split                                                                                    |
| Population thresholds | engine hardcodes adult ACWR consts (`ACWR_DANGER=1.5` etc. at 7 sites) — youth/RTP tighter zones exist only in FE evidence presets (drift test enforces "never laxer")                                                       |
| **Fix**               | Batch 3.2–3.3: population-aware thresholds as engine inputs → server endpoint assembles inputs → client consumes. §5a of SOURCE_OF_TRUTH rewritten at switch-over.                                                           |

## 4. RPE / session load (workload = duration × sRPE) — ✅ backend, ⚠️ no shared helper

- RPE itself is athlete-reported input, not calculated.
- `workload = duration × rpe` (Foster) computed **inline in ~8 backend files** (training-complete, weekend-games, import-process, import-open-data, training-sessions, load-management, ai-chat, smart-training-recommendations). Values agree; formula is trivial — but one `utils` helper would remove 8 literal sites.
- Frontend: display-only **except** the acwr.service fallback (counted under #2; dies with the client EWMA).

## 5. Hooper index — ✅ single backend source

- Computed once in `monitoring-report.js` (sum of 4 subscores); thresholds (WATCH ≥12 / HIGH ≥16) from `monitoring_config` (team override > global) — config-driven, no code literals.
- Frontend `monitoring-report.component.ts` maps `p.hooperIndex` for the sparkline — zero math. ✅ sign-off.

## 6. Wellness score — see #1 (same dual-formula issue; `calc-readiness.js` wellness subscore is canonical).

## 7. Weight fluctuation — ✅ single backend source

- `staff-nutritionist.js` computes `weightChange` from `physical_measurements`; `reports.component.html` displays `metric(r,"weightChange")`. No FE math, no second site. ✅ sign-off.

## 8. Injury-risk flags — ✅ monitoring flags / ❌ FE spike-cap is DEAD

- **Monitoring flags** (bloodwork/wearable/load): backend `monitoring-report.js`, thresholds from `monitoring_config`, head-coach sees derived signal only. ✅
- **DB alerting**: `detect_acwr_trigger` reads stored ACWR, notifies staff, honors `safety_override_log`. Read-side ✅ (hardcoded 0.8/1.5 noted in #2).
- **❌ `acwr-spike-detection.service.ts` (frontend)** computes spike detection AND writes "load caps" to **`load_caps` — a table that no longer exists** (dropped in `20260529090455_drop_ghost_load_acwr_caches_phase4.sql`; live count = 0). Every write/read fails at runtime. A _safety feature that silently does nothing_, and it's frontend-owned business logic besides. **Fix: delete the service (cap logic belongs in the backend engine; ACWR danger already alerts via `detect_acwr_trigger`), or rebuild server-side if the product wants auto-caps.**

## 9. Eccentric work (Nordic) dosing — ✅ single backend source

- Dosing/progression (`EVIDENCE_BASED_PROTOCOLS.nordicCurls`, plyo contacts/week) in `utils/daily-protocol-periodization-config.js` (backend). FE `position-volume.config.ts` holds guidance text + exercise references (no dosing math) and is compiled into both engines from one TS source. ✅ sign-off.

## 10. Sprint / high-CNS monitoring — ⚠️ two divergent classifiers

- Backend `utils/cns-spacing.js`: fixed list `["sprint","speed","competition","max_velocity"]` (used by daily-protocol's age-scaled spacing).
- Engine `isHighCnsSessionType()`: regex `FLAG_DRILL_HIGH_CNS_PATTERN` + RPE-aware classification (used by prescription CNS guard).
- Two definitions of "was yesterday high-CNS?" can disagree (e.g. a flag drill at RPE 9 counts for the engine, not for cns-spacing). **Fix: single classifier module consumed by both** (natural home: the shared engine; cns-spacing keeps only the DB-fetch).

## 11. Other metrics found in sweep

- **Monotony + strain, formScore** — `load-management.js` only, backend ✅ (zone literals noted in #2).
- **QB throwing progression** — DB RPC `get_qb_throwing_progression` + `qb-throwing.js`, backend ✅ (lane is PARTIAL per Ledger).
- **DB triggers on metric tables** — versioning/locking/audit only (`create_session_version`, `prevent_*_modification`, `updated_at`); **no calculation in triggers** ✅.

---

## Live-consistency coverage (audit item 6)

Static + test-level verification done: 28/28 client⇔server periodization parity; ACWR
config drift guard in CI; 716 backend + 469 Angular tests green. **Not yet run:** a
runtime log→recalc→refetch→display walkthrough per metric (needs a live session);
the #1/#8/#10 fixes should land first or the walkthrough will just re-document them.

## Priority fix list (ranked) — status

1. **✅ DONE (`c26dfb6c`)** Deleted the dead `acwr-spike-detection.service.ts` (wrote to the dropped `load_caps`; already neutered). Cap-on-spike is handled live by the engine's ACWR modulation.
2. **✅ DONE (`485feb13`) — reassessed.** The two are NOT a mechanical duplicate: composite readiness vs a check-in wellness estimate with a deliberate scale-inversion safeguard (S6). Blind-merging would reintroduce that hazard. Instead: extracted the canonical wellness-index scorer to `utils/readiness-score.js` (pure move) and documented the intentional split + hazard. TRUE formula unification deferred — it's a sports-science decision needing before/after delta validation, flagged for the product.
3. **✅ DONE (`cd1a015f`)** One canonical `isHighCnsSessionType` (now incl. `competition`), consumed by both cns-spacing.js and the engine. Client↔port parity 29/29.
4. **▶ IN PROGRESS** — the backend-authoritative migration. Batch 1 (drift guard) + Batch 2 (pure engine extraction + golden parity harness) + Batch 3.1 (server port, 28/28 parity) shipped. Remaining: population-aware thresholds → server endpoint (server-side input assembly) → client consumes → §5a rewrite.
5. **✅ DONE (`4252065f`)** Shared `sessionWorkload()` (utils/session-load.js) across the 3 log paths; `load-management.js` now classifies via `classifyAcwrZone`/`ACWR_RISK_ZONES` instead of a hand-copied zone block.
