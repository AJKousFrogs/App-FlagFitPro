# Consolidation Audit Report

**Date:** February 10, 2026  
**Scope:** JS, SCSS, TS, Angular, PrimeNG — merge, delete, and migration opportunities without breaking functionality or routing.

---

## Executive Summary

This audit identifies **duplications**, **legacy patterns**, and **consolidation opportunities** across the FlagFit Pro codebase. Recommendations preserve existing routing and functionality while reducing complexity and improving maintainability.

---

## 1. SCSS Consolidation

### 1.1 Duplicate Utility Layer (`styles/` vs `scss/utilities/`)

**Finding:** `angular/src/styles/` contains six files that are **thin `@forward` wrappers** pointing to `scss/utilities/`:

| File in `styles/` | Forwards To | Components Using |
|-------------------|-------------|-------------------|
| `_mixins.scss` | `../scss/utilities/mixins` | 60+ components via `@use "styles/mixins"` |
| `_variables.scss` | `../scss/utilities/variables` | 8+ components via `@use "styles/variables"` |
| `_ios-safari-fixes.scss` | `../scss/utilities/ios-safari-fixes` | Via design-system index |
| `_mobile-responsive.scss` | `../scss/utilities/mobile-responsive` | Via utilities index |
| `_mobile-touch-components.scss` | `../scss/utilities/mobile-touch-components` | Via utilities index |
| `_responsive-utilities.scss` | `../scss/utilities/responsive-utilities` | Via utilities index |

**Recommendation:**
- **Option A (Low risk):** Keep wrappers — they provide shorter import paths (`styles/mixins` vs `scss/utilities/mixins`). Document this pattern in the design system README.
- **Option B (Medium effort):** Migrate all components to `@use "scss/utilities" as *` or `@use "scss/utilities/mixins" as *`, then **delete** the `styles/` wrappers for mixins/variables, keeping only `styles/design-system/`. ~60+ component SCSS files would need import path updates.

### 1.2 Design Tokens — Single File, Alias Present

**Finding:** `design-tokens.scss` is a deprecated alias that only forwards to `design-system-tokens.scss`:

```scss
// angular/src/scss/tokens/design-tokens.scss
@forward "./design-system-tokens";
```

**Recommendation:** No imports of `design-tokens.scss` (the SCSS file) were found. **Safe to delete** `angular/src/scss/tokens/design-tokens.scss`. Note: `design-tokens.util.ts` and `shared/models/design-tokens.ts` are TypeScript modules — unrelated to the SCSS alias.

### 1.3 Layout Utilities Duplication (Known from AUDIT_SUMMARY)

**Finding:** Layout utilities (`.flex`, `.flex-row`, `.justify-*`, `.items-*`) appear in multiple files:

- `scss/utilities/layout-system.scss` — canonical
- `scss/utilities/_utilities.scss` — `.flex-row`, `.flex-column`, etc. (some overlap)
- `scss/components/primitives/_layout.scss` — `.flex`, `.flex-col`, `.items-*`, `.justify-*`
- `scss/components/standardized-components.scss` — `.flex` references

**Recommendation:**
1. **Audit** `primitives/_layout.scss` — if it only contains utilities already in `layout-system.scss`, remove duplicates or `@forward` from layout-system.
2. Add deprecation comments in `_utilities.scss` for any layout classes that overlap with `layout-system.scss`.
3. Ensure `layout-system.scss` is the single source for flex utilities; primitives should use token mappings, not duplicate selectors.

### 1.4 Pages SCSS — Possible Overlap

**Finding:** `scss/pages/index.scss` forwards four files:

- `premium-interactions.scss`
- `hover-system.scss`
- `ui-standardization.scss`
- `color-contrast-fixes.scss`

**Recommendation:** Review these for overlapping rules (e.g., hover states in multiple files). Consider merging `hover-system` and `premium-interactions` if they both define interaction states.

---

## 2. JavaScript / Netlify Functions

### 2.1 Training Stats Functions — Merge Candidate

**Finding:** Two Netlify functions serve training statistics:

| Function | Purpose | Status |
|----------|---------|--------|
| `training-stats.js` | Basic session stats, streaks | **DEPRECATED** — comment says "Prefer training-stats-enhanced" |
| `training-stats-enhanced.js` | ACWR, REP, volume, intensity | **Canonical** |

**Netlify redirects:** Both exist:
- `/training-stats` → `training-stats`
- `/training-stats-enhanced` → `training-stats-enhanced`

**Frontend usage:** `TrainingStatsCalculationService` uses Supabase directly; `UnifiedTrainingService` calculates stats in-memory. No frontend calls to `/training-stats` or `/training-stats-enhanced` were found in the Angular app.

**Recommendation:**
1. **Grep** for `/training-stats`, `training-stats`, `api/training` across repo and docs.
2. If no caller: Remove `training-stats.js` and its redirect. Keep only `training-stats-enhanced.js`.
3. If external/mobile app calls: Add redirect `/training-stats` → `training-stats-enhanced` (or return 301 to new URL), then delete deprecated function.

### 2.2 Notifications Functions — Consolidate or Document

**Finding:** Five notification-related functions:

- `notifications.js`
- `notifications-create.js`
- `notifications-count.js`
- `notifications-preferences.js`
- `notification-digest.js`

**Recommendation:** These serve distinct concerns (CRUD, count, preferences, digest). **Do not merge** without analyzing API contracts. Ensure they share `utils/` helpers (e.g., `base-handler`, `error-handler`) to avoid duplication.

### 2.3 Scripts — Audit for One-Off / Redundant

**Finding:** 90+ scripts in `scripts/` — many are migrations, seeds, or one-time utilities.

**Merge/delete candidates (verify usage first):**
- `diagnose-real-issue.js` vs `diagnostic-system.js` — may overlap
- `comprehensive-health-check.js` vs `health-check-enhanced.js` — similar purpose
- `fix-logger-errors.js`, `fix-duplicate-imports.js`, `fix-trailing-newlines.js`, `fix-innerhtml-complex.js` — one-time fix scripts; consider archiving if no longer run
- Multiple seed scripts (`seed*.js`) — keep; they seed different domains

**Recommendation:** Add `scripts/README.md` documenting purpose and “run once vs recurring” for each script. Archive or delete one-time fix scripts that have been applied.

---

## 3. TypeScript / Angular

### 3.1 Routing — Well-Structured

**Finding:** Routes are organized in `feature-routes.ts` with feature groups (public, dashboard, training, analytics, team, game, wellness, social, staff, profile, superadmin, help). Lazy loading is used throughout.

**Recommendation:** **No changes.** Routing is already consolidated and maintainable.

### 3.2 Design Tokens — TS vs SCSS

**Finding:** Two TS sources for design tokens:

- `core/utils/design-tokens.util.ts` — runtime constants (BRAND_COLORS, STATUS_COLORS, DIALOG_WIDTHS, etc.)
- `shared/models/design-tokens.ts` — `DesignTokens` interface

Both are documented as aligned with `design-system-tokens.scss`. No duplication of values; TS provides runtime access for programmatic use (charts, dialogs, status tags).

**Recommendation:** **Keep both.** Ensure `design-tokens.util.ts` stays in sync with SCSS token changes. Consider adding a build-time check or test that validates TS constants match SCSS vars.

### 3.3 Service Consolidation — Training Stats

**Finding:** Multiple training-related services:

- `TrainingStatsCalculationService` — used by Analytics, Player Dashboard, Header
- `TrainingStatsService` — referenced in spec; may be legacy
- `UnifiedTrainingService` — training page, today, calculates stats from sessions
- `TrainingDataService` — data access
- `AcwrService` — ACWR calculation

**Recommendation:** Verify `TrainingStatsService` usage. If fully replaced by `TrainingStatsCalculationService` + `UnifiedTrainingService`, deprecate and remove. Do not merge `UnifiedTrainingService` (training hub) with `TrainingStatsCalculationService` (analytics/ACWR) — different domains.

---

## 4. Angular & PrimeNG Packages

### 4.1 Root vs Angular Package Duplication

**Finding:** Root `package.json` and `angular/package.json` both declare:

| Package | Root | Angular | Notes |
|---------|------|---------|------|
| `@supabase/supabase-js` | ✓ | ✓ | Root: Netlify functions; Angular: app — both need it |
| `chart.js` | ✓ | ✓ | Root may be for backend/tests; Angular for charts — verify |
| `date-fns` | ✓ | ✓ | Same — both need it |

Root also has: `chartjs-adapter-date-fns`, `dotenv`, `jsonwebtoken`, `nodemailer`, `pg`, `web-push`, etc. (Netlify/scripts use).

**Recommendation:**
- Root deps: Used by Netlify functions, scripts, tests. **Keep.**
- Angular deps: Used by Angular app only. **Keep.**
- Duplication is acceptable — monorepo-style; each context has its own `node_modules`. No action unless moving to a single `package.json` workspace.

### 4.2 PrimeNG — Single Integration Point

**Finding:** PrimeNG is used only in `angular/`. Single theme/token setup via `primeng-integration.scss`, `primeng-theme.scss`, `primeng/token-mapping`, `primeng/brand-overrides`.

**Recommendation:** **No consolidation needed.** PrimeNG integration is already centralized. Continue migrating ad-hoc `.p-*` overrides to token mapping or `_exceptions.scss`.

---

## 5. Priority Action Matrix

| Priority | Action | Impact | Effort | Risk |
|----------|--------|--------|--------|------|
| **High** | Delete `design-tokens.scss` (alias) after grep | Reduces confusion | Low | Low |
| **High** | Merge or redirect `training-stats.js` → `training-stats-enhanced.js` | Removes deprecated API | Medium | Low (if no callers) |
| **Medium** | Consolidate layout utilities (primitives/layout vs layout-system) | Reduces SCSS duplication | Medium | Medium |
| **Medium** | Add `scripts/README.md` and archive one-time fix scripts | Improves discoverability | Low | Low |
| **Low** | Migrate component SCSS from `styles/mixins` to `scss/utilities` (optional) | Simplifies import graph | High | Low |
| **Low** | Verify and remove `TrainingStatsService` if unused | Cleans TS surface | Low | Low |

---

## 6. Files Safe to Delete (After Verification)

1. **`angular/src/scss/tokens/design-tokens.scss`** — if no imports reference it.
2. **`netlify/functions/training-stats.js`** — after confirming no callers and redirecting `/training-stats` to `training-stats-enhanced` or removing the route.
3. One-time fix scripts (after confirming they’ve been run): `fix-logger-errors.js`, `fix-duplicate-imports.js`, `fix-trailing-newlines.js`, `fix-innerhtml-complex.js`.

---

## 7. Summary

- **SCSS:** Keep `styles/` wrappers unless migrating imports; ~~remove `design-tokens.scss`~~ ✓ DONE; layout utilities deferred (medium risk).
- **JS/Netlify:** ~~Remove deprecated `training-stats.js`~~ ✓ DONE; redirects point to `training-stats-enhanced`; keep notification functions separate; document scripts ✓ DONE.
- **TS/Angular:** ~~Audit `TrainingStatsService` for removal~~ ✓ DONE — removed (unused).
- **Packages:** Root and Angular package.json serve different contexts; no consolidation required.

**Completed (Feb 2026):**
- Deleted `design-tokens.scss` (deprecated alias)
- Deleted `training-stats.js`; redirects `/training-stats`, `/api/training/stats` → `training-stats-enhanced`
- Removed `TrainingStatsService` and spec (unused)
- Updated CALCULATION_MAP.md, CALCULATION_SPEC.md, ARCHITECTURE.md, scripts README
