# Code Quality Refactor Plan — FlagFit Pro

**Status**: Phase 1 complete ✅ | Phase 2–3 pending
**Last Updated**: 2026-07-16

---

## Overview

This document tracks the code quality improvements across the FlagFit codebase, prioritized by impact and safety. Follows the audit completed in `CODEBASE_AUDIT_2026-07-16.md`.

---

## ✅ Phase 1: Critical Fixes (COMPLETE)

### 1.1 CSS Design System Violations

**Status**: ✅ DONE (Commit: 6b47fad7)

| Issue                  | Resolution                                                     | Impact         |
| ---------------------- | -------------------------------------------------------------- | -------------- |
| 6 hardcoded hex colors | Replaced with design tokens (var(--on-accent), var(--c-white)) | 6 errors → 0 ✓ |
| 3 component SCSS files | cycle, device-data, nutrition                                  | All updated    |

**Test Coverage**: CSS lint passes (0 errors, 685 warnings remain for Phase 2)

### 1.2 Dead Code Cleanup

**Status**: ✅ DONE (Commit: 6b47fad7)

| Item                    | Count           | Resolution                                                                                                                                                                                                                      |
| ----------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unused format utilities | 16              | Removed: capitalize, titleCase, kebabCase, truncateWords, stripHtml, formatCurrency, formatPercent, formatAverage, formatStat, formatFileSize, formatPhone, pluralize, trimWhitespace, escapeHtml, unescapeHtml, formatTimeMMSS |
| File size reduction     | 337 → 125 lines | 63% reduction                                                                                                                                                                                                                   |
| Retained functions      | 8               | camelCase, snakeCase, truncate, formatNumber, getInitials, padStart, padEnd, normalizePlayerName                                                                                                                                |

**Test Coverage**: Type checking + linting pass (0 errors)

### 1.3 ACWR Calculation Parity

**Status**: ✅ DONE (Commit: 2de7d4bf)

**Deliverable**: `tests/integration/acwr-parity.test.js` (10 tests, 100% passing)

| Test Scenario             | Coverage                        | Status |
| ------------------------- | ------------------------------- | ------ |
| Steady training (2×/week) | Medium confidence, ACWR ~1.3    | ✅     |
| Return from layoff        | building_base state, acwr=null  | ✅     |
| Load spike                | Danger zone ACWR ~1.8           | ✅     |
| Minimal data              | Low confidence flags            | ✅     |
| Zero load edge case       | Safety handling                 | ✅     |
| Precision validation      | 3 decimal places                | ✅     |
| Configuration overrides   | Custom parameters               | ✅     |
| EWMA algorithm            | Exponential weighting           | ✅     |
| Safety guardrails         | Division by zero, building_base | ✅     |

**Purpose**: Continuous verification that frontend (Angular service) and backend (netlify/functions/utils/acwr.js) ACWR calculations remain in sync per CLAUDE.md §4.

---

## 📋 Phase 2: Code Duplication (PENDING)

### 2.1 Precision Utilities Duplication

**Severity**: HIGH (Safety-critical per CLAUDE.md §4)

**Affected Files**:

- Frontend: `angular/src/app/shared/utils/precision.utils.ts` (243 lines)
- Backend: `netlify/functions/utils/precision.js` (99 lines)

**Duplicated Functions** (Identical implementations):

- `roundToPrecision()` ✓
- `safeDivide()` ✓
- `average()` ✓
- `standardDeviation()` ✓

**Frontend-only** (Not in backend):

- `calculatePercentage()`
- `percentageChange()`
- `clamp()`
- `calculateACWRRatio()` — wraps safeDivide with ACWR_PRECISION constant
- `formatNumberSafe()` — display formatting with null safety

**Action Items**:

1. **Verify no drift**: Run `acwr-parity.test.js` before any changes ✅ (done in Phase 1)

2. **Document mirror pattern**:
   - Add comment in `acwr.service.ts` explaining it mirrors backend implementation
   - Link to `netlify/functions/utils/acwr.js` as authoritative source
   - Reference `acwr-parity.test.js` as drift detector

3. **Consider consolidation** (only if safe):
   - Option A: Shared library (monorepo approach) — requires careful planning
   - Option B: Document as intentional duplication with parity tests
   - Option C: TypeScript declaration file in backend, import where possible
   - **Recommendation**: Option B for now (lowest risk); revisit with monorepo if needed

4. **Add CI check**:
   - Include `npm run test:backend` (which runs acwr-parity.test.js) in CI pipeline
   - Fail build if parity tests don't pass
   - Status: Parity tests ready; add to CI workflow

### 2.2 Date Utilities Duplication

**Severity**: MEDIUM (Non-critical, different purposes)

**Affected Files**:

- Frontend: `angular/src/app/shared/utils/date.utils.ts` (40+ functions)
- Backend: `netlify/functions/utils/date-utils.js` (8 functions)

**Overlap**:

- `getTimeAgo()` vs `timeAgo()`
- `getIsoDateString()` vs `formatDateISO()`
- `getWeekStart()` vs `getStartOfWeek()`
- `getWeekNumber()` (no frontend equivalent)
- `parseIsoDateString()` vs `safeParseDate()`

**Differences**:

- Frontend: UI-focused (formatting, timezone handling, date ranges, age calculations)
- Backend: Data processing (ISO string conversion, week calculations, day-of-year)

**Risk Assessment**: LOW (Functions serve different contexts, drift unlikely)

**Action Items**:

1. **Document the split**:
   - Frontend date utils are UI/presentation layer
   - Backend date utils are data processing layer
   - Add comment explaining the separation

2. **Identify true duplicates**:
   - `getTimeAgo()` and `timeAgo()` — likely same intent, verify outputs match
   - `getIsoDateString()` and `formatDateISO()` — ISO conversion, may have subtle differences
   - `parseIsoDateString()` and `safeParseDate()` — parsing with different safety levels

3. **Standardize where appropriate**:
   - If `getTimeAgo()` and `timeAgo()` are truly identical, consolidate under one name
   - Add tests for ISO string functions to ensure consistency
   - Consider exporting common functions from shared module

4. **Timeline**: Q3 2026 (lower priority)

---

## 📊 Phase 3: CSS Design Token Migration (PENDING)

### 3.1 Overview

**Status**: 685 CSS warnings across 7 components (non-blocking)

**Severity**: MEDIUM (Code quality, not safety)

**Files & Warning Counts**:

- `today.component.scss`: 224 warnings
- `training.component.scss`: 145 warnings
- `cycle.component.scss`: 90 warnings
- `monitoring-report.component.scss`: 77 warnings
- `nutrition.component.scss`: 71 warnings
- `device-data.component.scss`: 61 warnings
- `team-monitoring.component.scss`: 17 warnings

### 3.2 Root Causes

**Hardcoded Values Instead of Tokens**:

- Padding/margin values (px units)
- Font sizes
- Colors (beyond the hex violations already fixed)
- Border styles
- Shadows
- Z-index values

**Enforcement Rule**: `declaration-property-value-disallowed-list` in stylelint config

### 3.3 Approach

**Option A: Batch Auto-Fix** (Lower Quality)

```bash
npx stylelint angular/src/**/*.scss --fix
```

- Risk: May introduce incorrect token mappings
- Benefit: Fast
- Recommendation: ❌ Not recommended without review

**Option B: Component-by-Component Refactor** (Higher Quality)

1. Extract hardcoded values from largest files first (today, training)
2. Create mapping of hardcoded → token
3. Manual replacement with review
4. Test responsive behavior
5. Iterate through all 7 components

**Option C: Hybrid Approach** (Recommended)

1. Run stylelint --fix on smaller files (team-monitoring.scss)
2. Verify output quality
3. Use auto-fix as template for larger files
4. Manual review + spot-check responsive behavior

### 3.4 Implementation Plan

**Sprint Timeline**: 2-3 sprints (parallel with other work)

| Phase    | File(s)                | Warnings | Est. Effort | Priority |
| -------- | ---------------------- | -------- | ----------- | -------- |
| Sprint 1 | team-monitoring.scss   | 17       | 30min       | LOW      |
| Sprint 1 | device-data.scss       | 61       | 1h          | LOW      |
| Sprint 2 | nutrition.scss         | 71       | 1.5h        | MEDIUM   |
| Sprint 2 | monitoring-report.scss | 77       | 1.5h        | MEDIUM   |
| Sprint 3 | cycle.scss             | 90       | 2h          | MEDIUM   |
| Sprint 3 | training.scss          | 145      | 3h          | HIGH     |
| Sprint 4 | today.scss             | 224      | 4h          | HIGH     |

### 3.5 Success Criteria

- [ ] All 685 warnings resolved
- [ ] 0 CSS errors maintained
- [ ] Responsive snapshots pass (Mobile Responsive Testing in CI)
- [ ] No visual regressions (spot-check key components)
- [ ] Documentation in design-system-tokens.scss updated

---

## 🔧 Phase 4: Low-Usage Services Audit (PENDING)

### 4.1 Services Identified

**Status**: Verified active usage for key services; no immediate removal candidates

| Service               | Imports                           | Status   | Action             |
| --------------------- | --------------------------------- | -------- | ------------------ |
| `wearable.service`    | 1 (device-data.component.ts)      | Active   | ✓ Keep             |
| `video.service`       | 2 (training, gallery)             | Active   | ✓ Keep             |
| `tracking.service`    | 0                                 | ???      | Review             |
| `tip.service`         | Test-only                         | Inactive | ? Consider removal |
| `throwing.service`    | 1 (qb-arm-care-card.component.ts) | Active   | ✓ Keep             |
| `travel.service`      | 2                                 | Review   | Review             |
| `telemetry.service`   | 2                                 | Review   | Review             |
| `measurement.service` | 2                                 | Review   | Review             |
| `ai.service`          | 2                                 | Review   | Review             |

### 4.2 Recommendations

1. **Verify tracking.service**: Search for all references, may be legacy code
2. **Assess tip.service**: Check if `ConceptTipComponent` is used in templates
3. **Document low-usage services**: Mark as "non-critical" if used only in specialized flows
4. **Timeline**: Q3 2026

---

## 📈 Progress Tracker

```
Phase 1: Critical Fixes
  ✅ CSS hex colors (6 errors → 0)
  ✅ Dead code cleanup (16 functions removed)
  ✅ ACWR parity test (10 tests passing)

Phase 2: Code Duplication
  ⏳ Precision utilities (documented, parity verified)
  ⏳ Date utilities (documented, split explained)

Phase 3: CSS Design Tokens
  ⏳ 685 warnings → 0 (component-by-component plan)

Phase 4: Low-Usage Services
  ⏳ 9 services identified (requires further review)
```

---

## 🧪 Testing Strategy

**Continuous Verification**:

- Run `npm run type-check` before all commits
- Run `npm run lint` before all commits
- Run `npm run lint:css` before CSS changes
- Run `npm run test:backend` (includes acwr-parity.test.js)
- Mobile Responsive Testing in CI for layout changes

**Regression Testing**:

- Visual regression snapshots for responsive breakpoints
- Component integration tests for ACWR service changes
- E2E smoke tests for device-data and training components

---

## 🎯 Next Steps

1. **Immediate** (this week):
   - ✅ Phase 1 complete
   - Review Phase 2 documentation
   - Prioritize Phase 3 vs Phase 4

2. **Short-term** (next 2 weeks):
   - Start Phase 3 (CSS token migration) on smallest file
   - Finalize Phase 2 precision utilities documentation

3. **Medium-term** (next sprint):
   - Complete Phase 3 migration on 3–4 components
   - Assess Phase 4 low-usage services

4. **Long-term** (Q3 2026):
   - Finish Phase 3 completely
   - Complete Phase 4 audit
   - Consider monorepo consolidation for Phase 2

---

## 📚 References

- **CODEBASE_AUDIT_2026-07-16.md** — Full audit findings
- **CLAUDE.md §4** — Single Source of Truth principle
- **acwr-parity.test.js** — Parity verification tests
- **docs/SOURCE_OF_TRUTH.md** — Feature specification
- **docs/DESIGN_TOKENS_AUDIT.md** — Design system tokens
