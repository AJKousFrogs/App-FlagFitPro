# Duplication Audit — SCSS, TypeScript & JavaScript

**Audit Date:** February 11, 2026  
**Scope:** SCSS components, TypeScript files, JavaScript (scripts + Netlify functions)  
**Tools:** `scripts/audit-scss-duplications.js`, `scripts/audit-ts-duplications.js`, `scripts/audit-js-duplications.js`  
**Fix Proposal:** `docs/DUPLICATION_FIX_PROPOSAL_2026-02-11.md`

---

## Executive Summary

| Area | Files Scanned | Findings |
|------|---------------|----------|
| SCSS | 275 | Duplicate selectors, repeated respond-to blocks, similar rule blocks |
| TypeScript | 560 | Repeated literals, similar function patterns, possible unused imports |
| JavaScript | 219 | Repeated strings, duplicate directory/utils logic |

---

## 1. SCSS Duplication Findings

### 1.1 High-Duplication Selectors (3+ occurrences)

| Selector | Count | Files | Action |
|----------|-------|-------|--------|
| `.stat-block__label` | 29 | 26 | Prefer `@include stat-block` mixin |
| `.stat-block__value` | 29 | 26 | Prefer `@include stat-block` mixin |
| `.p-progressbar-value` | 26 | 3 (primeng theme, overrides) | Intentional — theme + overrides |
| `.p-card-body` | 23 | 5 | PrimeNG + standardization — OK |
| `.p-dialog-content` | 26 | 6 | PrimeNG + overrides — OK |
| `.metric-value` | 24 | 21 | Consider shared mixin |
| `.metric-label` | 20 | 18 | Consider shared mixin |
| `.header-actions` | 28 | 18 | Component-specific — OK |
| `.form-field` | 45 | 37 | Form system — OK |

### 1.2 Stat Block Consolidation

**Current:** Many components define `.stat-block__value` and `.stat-block__label` locally.

**Recommendation:** Components using stat-block markup should `@include stat-block` from `_mixins.scss` instead of duplicating styles. Components with custom variants (e.g. player-comparison `.player1`, `.player2`) may keep overrides.

**Already using mixin:** coach-analytics, player-comparison, stats-grid, superadmin-dashboard.

**Could adopt mixin:** acwr-dashboard, superadmin-users, player-dashboard, today, analytics, community, attendance, playbook-manager, injury-management, film-room-coach, payment-management, admin/superadmin-dashboard, and others that use stat-block classes.

### 1.3 Files with Many respond-to Blocks (4+)

| File | Count | Note |
|------|-------|------|
| player-dashboard.component.scss | 35 | Large dashboard — consider grouping |
| _component-overrides.scss | 27 | Global overrides — intentional |
| training-schedule.component.scss | 18 | Feature-specific |
| _dashboard.scss | 17 | Primitives |
| standardized-components.scss | 17 | Design system |
| _responsive-utilities.scss | 14 | Utility mixins |

**Recommendation:** No urgent change. Responsive patterns are scoped per component. Future: shared responsive mixins where breakpoints align.

### 1.4 Potential Duplicate Rule Blocks

- **Stats Grid:** achievements, superadmin-dashboard, sleep-debt, nutritionist-dashboard, physiotherapist-dashboard — similar grid patterns.
- **.stat-block__value / .stat-block__label:** Repeated in 10+ component SCSS files — use `@include stat-block`.
- **.data-source, .data-updated:** acwr-dashboard, analytics, performance-tracking — consider shared utility class.
- **.metric-value:** acwr-dashboard, analytics, coach-analytics, performance-dashboard — consider mixin.

---

## 2. TypeScript Duplication Findings

### 2.1 Repeated String Literals (3+)

Many are template/boilerplate (e.g. `"> <div class="`, `import { X } from"`) — not actionable.

**Actionable:** Route paths, toast keys, and feature-specific strings repeated 5+ times could move to constants.

### 2.2 Similar Function Blocks

| Pattern | Files | Recommendation |
|---------|-------|-----------------|
| getEvidenceInfo | acwr.service, readiness.service | Extract to shared util if logic identical |
| Supabase update pattern | account-deletion, privacy-settings | Consider base service/helper |
| filter() in evidence-presets | Same file, 3x | May be intentional per preset type |
| Logger calls | logger.service | Expected pattern |

### 2.3 Possibly Unused Imports

Many flagged are `type` imports used only in annotations — **false positives**. Runtime imports (e.g. RouterModule in stories) should be verified.

---

## 3. JavaScript Duplication Findings (scripts/ + netlify/functions/)

### 3.1 Repeated String Literals (3+)

Common patterns: handler imports (`./utils/error-handler.js`, `./utils/base-handler.js`), `training_sessions`, `validation_error`, seed script field names (`evidence_grade`, `subcategory`). Handler imports are intentional (shared Netlify infra).

### 3.2 Duplicate Function Blocks

| Pattern | Files | Recommendation |
|---------|-------|----------------|
| cleanupDirectory / processDirectory | cleanup-frontend, cleanup-scss-comments, fix-trailing-newlines | Extract to `scripts/lib/directory-walker.js` |
| getDirectorySize | comprehensive-health-check, feature-validator | Extract to `scripts/lib/file-utils.js` |
| Constructor pattern | 6 seed scripts | Optional: BaseSeedScript class |

### 3.3 Most Used Imports

102 functions use `./utils/base-handler.js` and `./utils/error-handler.js` — intentional; no change.

---

## 4. Fixes Applied (Feb 11)

| Fix | Status |
|-----|--------|
| jspdf/html2canvas bundle limits | Done — raised limits for lazy chunks |
| angular package.json type: module | Done — fixes check-bundle-size ESM warning |
| Bundle check no longer fails | Done |

---

## 5. Recommendations (Prioritized)

| # | Action | Effort | Impact |
|---|--------|--------|--------|
| 1 | Add `@include stat-block` to components using stat-block markup | Medium | Reduces SCSS duplication |
| 2 | Extract `scripts/lib/directory-walker.js` and `file-utils.js` | Medium | Reduces JS duplication |
| 3 | Adopt `@include stats-grid` in 5 dashboard components | Low | Consistency |
| 4 | Extract shared `.metric-value` / `.metric-label` mixin if patterns align | Low | Consistency |
| 5 | Consolidate `.data-source` / `.data-updated` into shared utility class | Low | Consistency |
| 6 | Review getEvidenceInfo in acwr vs readiness — **leave as-is** (different shapes) | — | N/A |

---

## 6. Running the Audits

```bash
npm run audit:scss-duplications
npm run audit:ts-duplications
npm run audit:js-duplications
```

---

*Generated by Duplication Audit — February 11, 2026*
