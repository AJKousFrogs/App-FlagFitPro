# Backend consolidation plan (single-source restructure)

_ADR — dated 2026-07-12. The single source of truth for the maintainability/
consolidation pass. Goal: one owner per data domain and one owner per calculation;
merge-then-drop legacy tables; no parallel architectures. Execute in small,
individually-revertible commits; **destructive drops and safety-relevant calc
merges are gated (flagged before execution), never silent.**_

## 0. Guiding principle (already proven in this repo — follow it everywhere)

Periodization is the model to copy. It has exactly one authoritative source
(`angular/.../periodization-engine.ts`), a **generated** backend port
(`netlify/functions/utils/periodization-engine.js`, header says "do not edit by
hand"), and a **parity test** (`tests/unit/periodization-port-parity.test.js`).
One source → generated mirror → parity guard. Every shared calculation should look
like this; no hand-maintained second copy.

The new `team-practice-plan.js` is a backend-only **realization** (like
`daily-protocol.js`) — it consumes the periodization intent, it does not re-derive
it. That is NOT a second architecture; the coach/athlete UI must CALL it, never
reimplement the plan in Angular.

## 1. Audit findings

### 1a. Calculations
| Calculation | State | Action |
|---|---|---|
| Periodization / taper / framing | ✅ single source + generated port + parity test | none — this is the template |
| Team-practice plan | ✅ new, backend-only realization, tested | none — UI must call it, not fork it |
| **ACWR** | ✅ **already single-source** (verified 2026-07-12). The MATH lives once in `utils/acwr.js#computeAcwrAt` (EWMA, uncoupled 7/21). The five backend `calculateACWR` (`daily-training`, `training-plan`, `training-stats-enhanced`, `smart-training-recommendations`, `load-management`) are **thin adapters** that build a daily-load Map (via `computeSessionLoad`) and delegate to `computeAcwrAt` + `classifyAcwrZone`; each carries a comment documenting its migration off the old rolling-average ratio. Frontend `precision.utils.ts#calculateACWRRatio` is a trivial `safeDivide` display helper, not a second method. | none — the repeated function *name* is not duplicated math. (Grep over-flagged; corrected.) |
| Readiness | ✅ single-source: `utils/readiness-score.js`, used by `calc-readiness.js` + `daily-protocol-decision.js`; other `readinessScore` refs are reads. | none |
| Session load | ✅ single-source: `utils/acwr.js#computeSessionLoad`. | none |

### 1b. Exercise data stores
`exercises` (840 rows) is the canonical tissue-load library. Parallel legacy tables
are **all empty** and reached only by dead code:

| Legacy table | live rows | Reached by |
|---|---|---|
| `isometrics_exercises` | 0 | `isometrics.js`, `exercises-core.js` (dead endpoints); stale comment in `daily-protocol.js` |
| `plyometrics_exercises` | 0 | `plyometrics.js`, `exercises-core.js` (dead); stale comment in `daily-protocol.js` |
| `exercisedb_exercises` | 0 | `exercisedb.js` (dead); `api-response-shapes.contract.test.js` |
| `exercise_registry` | 0 | none (code) |
| `ff_exercise_mappings` | 0 | `exercisedb.js` (dead) |
| `movement_patterns` | 0 | `training-programs.js` |

The dead endpoint tree: `exercises.js` aggregates `exercises-core.js` +
`isometrics.js` + `plyometrics.js`; `exercisedb.js` is standalone. **The Angular app
calls none of `/api/exercises`, `/api/isometrics`, `/api/plyometrics`,
`/api/exercisedb`** (verified by grep). daily-protocol already reads only
`exercises` via `EXERCISE_CATEGORY_ALIASES`; its "query from both … and
X_exercises table" lines are **stale comments**, not code.

### 1c. Tables at a glance
~180 public tables, the large majority with 0 live rows (unshipped scaffolding).
Only a subset is in scope now (§3); a full empty-table sweep is a later workstream
and each drop is individually gated.

## 2. Sequencing

1. **Workstream A — Exercise single source** ✅ DONE (§3). Dead endpoints + routes +
   tests removed; 5 empty legacy tables dropped; `exercises` is the sole store.
2. **Workstream C — ACWR** ✅ VERIFIED already single-source (§1a). No merge needed.
3. **Workstream D — Readiness** ✅ VERIFIED single-source (`utils/readiness-score.js`).
4. **Workstream E — Empty-table sweep** — CAREFUL/gated. ~130 tables have 0 rows, but
   **most are unshipped-FEATURE scaffolding, not legacy duplicates** (e.g.
   `bloodwork_*`, `nutrition_*`, community/chat tables). "Legacy that can be deleted"
   ≠ "empty". Only drop a table with a **proof of legacy**: empty AND superseded by a
   canonical table AND not written by any active endpoint. Candidates needing that
   proof before any drop: `session_exercises` (vs `protocol_exercises`),
   `training_session_templates` (vs `prescription_templates`), `training_weeks`,
   `micro_sessions`, `player_programs`/`training_programs`. Each is its own gated
   commit; **do not blanket-drop empties.** Backlogged, not blocking the engine.
5. **THEN** wire the team-practice engine (endpoint + coach/athlete UI) and continue
   the drill library toward 1000.

## 3. Workstream A — exercise single source (executing)

Order (each behavior-preserving; drops last, reversible from migration history):
1. Fix the stale dual-source comments in `daily-protocol.js` (doc drift).
2. Delete the dead endpoints: `exercises.js`, `exercises-core.js`, `isometrics.js`,
   `plyometrics.js`, `exercisedb.js`; remove their `netlify.toml` routes; remove the
   now-dead tests (`isometrics-plyometrics-validation`, `exercisedb-validation`, the
   `exercisedb_exercises` block in the contract test).
3. Drop the empty legacy tables via migration: `isometrics_exercises`,
   `plyometrics_exercises`, `exercisedb_exercises`, `exercise_registry`,
   `ff_exercise_mappings`. (`movement_patterns` retained pending a
   `training-programs.js` check.)

Safety: tables verified empty immediately before drop; drop is a migration (recreatable).

## 4. Gates (do NOT execute silently)

- **Every table DROP** — even empty ones — is called out in its commit and here.
  Tables with rows are migrated into the canonical table first (none in Workstream A).
- **ACWR merge (Workstream C)** ships only behind a parity harness proving the
  unified `computeAcwrAt` reproduces each call site's current numbers (or an explicit,
  documented decision that a site was deliberately different).

## 5. Status ledger
- 2026-07-12: plan written.
- 2026-07-12: **Workstream A DONE.** Deleted dead endpoints `exercises-core.js`,
  `isometrics.js`, `plyometrics.js`, `exercisedb.js` (the `exercises.js` dispatcher
  kept — it still serves the live `/api/qb-throwing` + `/api/exercise-progression`);
  removed their 4 `netlify.toml` routes and 3 dead test files + the contract-test
  `exercisedb_exercises` block. Dropped the 5 empty legacy tables
  (`ff_exercise_mappings`, `exercisedb_exercises`, `isometrics_exercises`,
  `plyometrics_exercises`, `exercise_registry`) via migration `20260712150000`.
  `exercises` is now the sole exercise store. Suite green (875).
- 2026-07-12: **Workstreams C + D VERIFIED already single-source** — ACWR math lives
  once in `utils/acwr.js` (the 5 `calculateACWR` are thin adapters that delegate;
  frontend `calculateACWRRatio` is a display divide), readiness lives once in
  `utils/readiness-score.js`. No merge needed; the grep-based "6 duplicates" flag was
  a false positive (corrected §1a). The calc architecture is fully single-source.
- Next: Workstream E is backlogged (gated per-table proof; no blanket drops).
  Proceeding to engine wiring + drills to 1000.
