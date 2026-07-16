# FlagFit Codebase Quality Audit — 2026-07-16

## Executive Summary

Comprehensive sweep of the entire FlagFit codebase (Angular + Netlify Functions) identified **critical CSS violations**, **significant dead code**, and **calculation duplication risks**. Fixes applied to blocking issues; recommendations provided for follow-up work.

---

## 1. CSS Code Quality

### 1.1 Hex Color Violations — **FIXED** ✓

**Issue**: 6 hardcoded hex colors in component SCSS violated design system rules.
**Severity**: Critical (blocking CI/design system enforcement)
**Files affected**: 3 components

| File                         | Line | Violation             | Fix                            |
| ---------------------------- | ---- | --------------------- | ------------------------------ |
| `cycle.component.scss`       | 164  | `color: #08090b`      | `color: var(--on-accent)`      |
| `cycle.component.scss`       | 250  | `background: #08090b` | `background: var(--on-accent)` |
| `cycle.component.scss`       | 321  | `color: #08090b`      | `color: var(--on-accent)`      |
| `cycle.component.scss`       | 329  | `color: #fff`         | `color: var(--c-white)`        |
| `device-data.component.scss` | 119  | `color: #08090b`      | `color: var(--on-accent)`      |
| `nutrition.component.scss`   | 258  | `color: #08090b`      | `color: var(--on-accent)`      |

**Status**: ✅ All 6 errors fixed (0 errors remaining)

### 1.2 Design Token Warnings — **ONGOING**

**Issue**: 685 CSS warnings across 7 component stylesheets using hardcoded values instead of design tokens.
**Severity**: Warning (design system consistency)
**Files affected**: 7 components

| Component                          | Warning Count |
| ---------------------------------- | ------------- |
| `today.component.scss`             | 224           |
| `training.component.scss`          | 145           |
| `cycle.component.scss`             | 90            |
| `monitoring-report.component.scss` | 77            |
| `nutrition.component.scss`         | 71            |
| `device-data.component.scss`       | 61            |
| `team-monitoring.component.scss`   | 17            |

**Root Cause**: Hardcoded padding, margins, font-sizes, and colors in component styles.

**Recommendation**: Phase-based migration:

- Phase 1 (now): Fixed critical 6 hex colors
- Phase 2 (next sprint): Batch replace property value hardcodes with design tokens
- Phase 3: Audit design-system-tokens.scss for completeness

---

## 2. Dead Code & Unused Exports

### 2.1 Format Utility Functions — **CLEANED** ✓

**Issue**: 16 out of 24 exported functions in `format.utils.ts` were completely unused.
**Severity**: Code maintenance burden
**File**: `angular/src/app/shared/utils/format.utils.ts`

**Removed functions** (0 usage across entire codebase):

1. `capitalize()` — 0 imports
2. `titleCase()` — 0 imports
3. `kebabCase()` — 0 imports
4. `truncateWords()` — 0 imports
5. `stripHtml()` — 0 imports
6. `formatCurrency()` — 0 imports
7. `formatPercent()` — 0 imports
8. `formatAverage()` — 0 imports
9. `formatStat()` — 0 imports
10. `formatFileSize()` — 0 imports
11. `formatPhone()` — 0 imports
12. `pluralize()` — 0 imports
13. `trimWhitespace()` — 0 imports
14. `escapeHtml()` — 0 imports
15. `unescapeHtml()` — 0 imports
16. `formatTimeMMSS()` — 0 imports

**Retained functions** (actively used):

- `camelCase()` — 8 imports
- `snakeCase()` — 3 imports
- `truncate()` — 5 imports
- `formatNumber()` — 12 imports
- `getInitials()` — 9 imports
- `padStart()` — 18 imports
- `padEnd()` — 2 imports
- `normalizePlayerName()` — 4 imports

**Status**: ✅ File reduced from 337 → 125 lines (63% reduction)

### 2.2 Low-Usage Services — **IDENTIFIED**

**Issue**: 9 services with only 1–2 imports (mostly test-only usage).
**Severity**: Medium (candidates for removal or consolidation)

| Service               | Imports       | Status |
| --------------------- | ------------- | ------ |
| `wearable.service`    | 1 (test only) | Review |
| `video.service`       | 1 (test only) | Review |
| `tracking.service`    | 1 (test only) | Review |
| `tip.service`         | 1 (test only) | Review |
| `throwing.service`    | 1 (test only) | Review |
| `travel.service`      | 2             | Review |
| `telemetry.service`   | 2             | Review |
| `measurement.service` | 2             | Review |
| `ai.service`          | 2             | Review |

**Recommendation**: Audit each service to determine if actively used in production or safe to remove.

---

## 3. Code Duplication

### 3.1 Precision Utilities — **IDENTIFIED (Safety Critical)**

**Issue**: Frontend and backend precision utilities duplicated, creating ACWR calculation drift risk.
**Severity**: HIGH (per CLAUDE.md §4: Single Source of Truth for calculations)

**Files**:

- Frontend: `angular/src/app/shared/utils/precision.utils.ts` (243 lines)
- Backend: `netlify/functions/utils/precision.js` (99 lines)

**Shared functions** (duplicated):

- `roundToPrecision()` ✓ — identical implementation
- `safeDivide()` ✓ — identical implementation
- `average()` ✓ — identical implementation
- `standardDeviation()` ✓ — identical implementation

**Frontend-only functions** (not mirrored):

- `calculatePercentage()`
- `percentageChange()`
- `clamp()`
- `calculateACWRRatio()`
- `formatNumberSafe()`

**Backend ACWR Implementation** (authoritative):

- Location: `netlify/functions/utils/acwr.js` (242 lines)
- Method: Exponentially Weighted Moving Average (EWMA)
- Status: Highly documented, includes confidence levels and safeguards

**Frontend ACWR Service** (mirrors backend):

- Location: `angular/src/app/core/services/acwr.service.ts` (1328 lines)
- Status: Large service, mirrors EWMA algorithm
- Risk: If frontend/backend diverge, readiness calculations become unreliable

**Recommendation**:

1. ✓ Verified that core precision functions are identical
2. Add parity test harness that compares frontend ACWR vs backend ACWR on sample data
3. Consider extracting shared precision utilities to a shared library (only if safe to do so)
4. Document the intentional mirror pattern in both files

### 3.2 Date Utilities — **IDENTIFIED**

**Issue**: Frontend date utilities (40+ functions) vs backend date-utils (8 functions) duplication.
**Severity**: Medium (no safety-critical calculations affected)

**Recommendation**: Standardize on one implementation; evaluate which functions are truly needed.

---

## 4. Test Coverage & Type Safety

### 4.1 TypeScript Type Checking

**Status**: ✅ All 4 type-check configs pass cleanly

- `tsconfig.app.json` ✓
- `tsconfig.spec.json` ✓
- `tsconfig.server.json` ✓
- Netlify functions `typecheck.json` ✓

### 4.2 ESLint Compliance

**Status**: ✅ All files pass linting

- Angular app: ✓ (0 errors, 0 warnings)
- Netlify functions: ✓ (0 errors, max-warnings=0 enforced)
- Tooling scripts: ✓

---

## 5. Branch Hygiene

### 5.1 Active Feature Branches

**Count**: 6 feature/fix branches (beyond main)

- `chore/audit-drift-cleanup`
- `chore/single-source-bodyweight-fallback`
- `feat/engine-mesocycle-sprint-floor`
- `fix/injury-loop-and-supplement-insights`
- `fix/rest-day-no-main-session`
- `phase2/kill-phase-drift`
- `phase3/offseason-gpp`

**Note**: Per feedback_flagfit_merge_promptly.md, branches should be merged to main once CI-green; none of these appear stale (all created recently).

### 5.2 Temporary Worktree Branches

**Count**: 26 `worktree-wf_*` branches
**Status**: Expected from CI/testing workflows; safe to clean up if no longer in use.

---

## 6. Code Quality Metrics

| Metric           | Status                                 |
| ---------------- | -------------------------------------- |
| Type safety      | ✅ 100% (0 errors)                     |
| Linting          | ✅ 0 errors, 0 warnings                |
| CSS errors       | ✅ 0 (was 6)                           |
| CSS warnings     | ⚠️ 685 (design tokens)                 |
| Dead code        | ✅ 16 unused functions removed         |
| Code duplication | ⚠️ Precision/date utilities duplicated |
| Unused services  | ⚠️ 9 low-usage services identified     |

---

## 7. Actions Taken

### ✅ Completed

1. Fixed 6 CSS hex color violations → 0 errors remaining
2. Removed 16 unused format utility functions → 63% file size reduction
3. Verified type safety (all checks pass)
4. Verified linting compliance (all checks pass)

### 📋 Recommended (Next Sprint)

**High Priority**:

- [ ] Add ACWR parity test harness (frontend vs backend calculation verification)
- [ ] Phase 2 design token migration for 685 CSS warnings
- [ ] Audit 9 low-usage services for deprecation/removal

**Medium Priority**:

- [ ] Consolidate date utilities (frontend/backend)
- [ ] Clean up temporary worktree branches
- [ ] Document calculation duplication pattern in precision.utils.ts

---

## 8. References

- **Design System**: See `docs/DESIGN_TOKENS_AUDIT.md`
- **Calculation Safety**: CLAUDE.md §4 (Single Source of Truth)
- **Branch Policy**: feedback_flagfit_merge_promptly.md
- **Type Checking**: feedback_flagfit_typecheck_configs.md
