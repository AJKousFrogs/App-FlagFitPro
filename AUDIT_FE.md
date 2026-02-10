# Front-End Best Practices Audit Log

**Date:** 2026-02-10  
**Branch:** main  
**Commands:** `npm run build`, `npm run lint`, `npm run test`, `npm run lint:css`

---

## STEP 0 — BASELINE (REPO DISCOVERY)

### 1) Repo Structure Summary

| Item | Path |
|------|------|
| angular.json | `angular/angular.json` |
| project.json | None (Angular uses angular.json) |
| Global styles entry | `angular/src/styles.scss` |
| Design system tokens | `angular/src/scss/tokens/design-system-tokens.scss` |
| Legacy token alias | `angular/src/scss/tokens/design-tokens.scss` (forwards to design-system-tokens) |
| PrimeNG config | `angular/src/app/app.config.ts` |

### 2) Global Stylesheet Entrypoints (angular.json)

```json
"styles": ["src/styles.scss"]
```

**Import chain:**
1. `design-system-tokens`
2. `scss/utilities`
3. `styles/design-system/index` → forwards tokens, typography, states, utilities
4. `scss/components/index` → primeng token mapping, brand overrides, primeng-integration, primeng-theme
5. `scss/pages/index`

### 3) Duplicate / Legacy Files Identified

| Finding | Severity |
|---------|----------|
| `design-tokens.scss` | P2 – forwards only, safe to keep as alias |
| `scss/utilities/_utilities.scss` generates .p-*, .m-*, .gap-* from `$spacing-scale` | P1 – duplicates design-system-tokens.scss utilities (lines 1751–1935) |
| `layout-system.scss` has .p-0, .p-2, .p-4, .p-6, .p-8, .gap-2..6 | P1 – duplicates |
| `primitives/_layout.scss` has .gap-1..8 inside media query | P1 – duplicates |
| `standardized-components.scss` has .gap-2, .gap-4, .gap-6 (modifier classes) | P2 – different context (e.g. `&.gap-2`) |
| `styles/` vs `scss/` – overlapping _variables, _mixins | P1 – potential confusion |

### 4) PrimeNG Provider Config (app.config.ts)

- **Preset:** Aura (`@primeuix/themes/aura`)
- **Change detection:** `provideZonelessChangeDetection()` ✓
- **Dark mode:** `.dark-theme` class selector
- **CSS layers:** `reset, tokens, primeng-base, primeng-brand, primitives, features, overrides`
- **Prefix:** `p` (--p-* variables)

### 5) Missing Tokens (Step 1A findings) – FIXED

| Token | Used In | Status |
|-------|---------|--------|
| `--color-border-warning` | morning-briefing.component.scss | ✓ Added |
| `--color-status-success-bg` | privacy-controls, roster, player-dashboard | ✓ Added |

---

## STEP 1 — DESIGN SYSTEM (P0/P1)

### 1B) Token Integrity – Fixes Applied

- [x] `--border-1..4` – Already defined in design-system-tokens.scss
- [x] `--surface-border`, `--color-border-default`, `--color-border-muted` – Already defined
- [x] **Add:** `--color-border-warning` (alias to `--color-status-warning`) ✓
- [x] **Add:** `--color-status-success-bg` (alias to `--color-status-success-surface`) ✓

### 1C) PrimeNG Aura Dependency Hardening

- [x] Add `--ds-color-brand` fallback to `--ds-primary-green` ✓
- [x] Ensure semantic tokens use `var(--ds-*, fallback)` ✓

### 1D) Success Semantics Inconsistency

- **Current:** `--color-status-success` = green (correct)
- **Issue:** `--primitive-success-*` = yellow/amber scale (legacy naming conflict)
- **Action:** Add deprecated comment; components using `primitive-success-*` for “success” visuals should migrate to `--color-status-success-*`

### 1E) Duplicate Utilities ✓

- **design-system-tokens.scss:** token-based .p-*, .px-*, .py-*, .pt-*, .pb-*, .pl-*, .pr-*, .m-*, .mt-*, .mb-*, .mr-*, .ml-*, .gap-* (canonical)
- **scss/utilities/_utilities.scss:** Removed spacing loop; display/flex/text utilities only
- **layout-system.scss:** Removed duplicate .flex.gap-*, .mb-*, .mt-*

---

## STEP 2 — PRIME NG THEMING (P0–P2)

### 2A) Override Inventory

- **!important:** 44+ files
- **::ng-deep:** Multiple files
- **Action:** Categorize and migrate to token mapping where possible

### 2B) PrimeNG Variable Mapping

- Token mapping in `primeng/_token-mapping.scss` is comprehensive
- Dark mode tokens in design-system-tokens.scss `.dark-theme` block

---

## STEP 3 — ANGULAR 21 (P0–P2)

- Zoneless already enabled
- Route map: uses `feature-routes.ts`
- Lazy loading: feature-based routes

---

## STEP 5 — TESTING & TOOLING

- **Unit tests:** Vitest (angular/package.json)
- **E2E:** Playwright
- **Stylelint:** Present (`npm run lint:css`)

---

## APPLIED FIXES (P0–P3)

| # | Fix | File(s) | Priority |
|---|-----|---------|----------|
| 1 | Add --color-border-warning | design-system-tokens.scss | P0 ✓ |
| 2 | Add --color-status-success-bg | design-system-tokens.scss | P0 ✓ |
| 3 | Remove duplicate .p-* from layout-system.scss | layout-system.scss | P1 ✓ |
| 4 | Add deprecated comment for primitive-success naming conflict | design-system-tokens.scss | P1 ✓ |
| 5 | PrimeNG token mapping already comprehensive | token-mapping, primeng-integration | ✓ |
| 6 | Route audit: add "legacy" to allowed entries (coach/team-management redirect) | scripts/audit-routes.js | P2 ✓ |

---

## REMAINING MANUAL ITEMS

1. **!important / ::ng-deep:** No `::ng-deep` in repo. `!important` mostly in documented exceptions layer; view-transitions reduced-motion uses `!important` (required for a11y).
2. **Route map:** `npm run audit:routes` passes. Legacy redirect routes use `entry: "legacy"`.
3. ~~**Vitest smoke tests:** Add design token availability test~~ ✓ Done – design-system-compliance.spec.ts
4. ~~**Stylelint:**~~ Already has color-no-hex, declaration-no-important with overrides
5. **OnPush:** 150+ components use OnPush; components without explicit strategy use Angular default. Consider schematics to add OnPush to remaining components.
6. ~~**scss/utilities/_utilities.scss:** Spacing scale~~ ✓ Done – $spacing-scale aligned to 8pt grid in _variables.scss

---

## AUDIT ROUND 2 (2026-02-10) – APPLIED FIXES

| # | Fix | File(s) | Priority |
|---|-----|---------|----------|
| 1 | Design token E2E smoke test | design-system-compliance.spec.ts | P1 ✓ |
| 2 | ESLint no-call-expression (warn) | angular/eslint.config.mjs | P2 ✓ |
| 3 | Align $spacing-scale to 8pt grid | angular/src/scss/utilities/_variables.scss | P1 ✓ |
| 4 | Stylelint _exceptions override | stylelint.config.js | P2 ✓ |
| 5 | Remove duplicate spacing from _utilities.scss | _utilities.scss | P1 ✓ |
| 6 | Remove duplicate spacing from layout-system.scss | layout-system.scss | P1 ✓ |
| 7 | Add mr-*, ml-*, pt-*, pb-*, pl-*, pr-*, mt-0, mb-0, mt-8, mb-8 to design-system-tokens | design-system-tokens.scss | P1 ✓ |

---

## AUDIT ROUND 3 – APPLIED FIXES (2026-02-10)

**Date/Time:** 2026-02-10 (UTC)  
**Branch:** main

### Phase 0 – Baseline + Guardrails

**Commands run:**
- `cd angular && npm run build` → ✅ PASS
- `npm run lint` → ✅ PASS (0 errors, 239 no-call-expression warnings)
- `npm run test` → ✅ PASS (758 tests passed)
- `npm run lint:css` (from project root) → ✅ PASS

### Phase 1 – PrimeNG Aura Dependency Hardening (P0/P1)

**Files changed:**
- `angular/src/scss/components/primeng-integration.scss`

**Changes:**
1. **[data-theme="dark"]** block:
   - `--p-primary-color`: Added fallback chain `var(--ds-color-brand, var(--ds-primary-green, var(--color-brand-primary, #089949)))`
   - `--p-primary-contrast-color`: Added fallback `var(--color-text-on-primary, #fff)`
   - `--p-surface-border`: Simplified to `var(--surface-border, var(--primitive-neutral-700))`

2. **:root** (light theme) block:
   - `--p-primary-color`: Same fallback chain as dark mode for Aura resilience
   - `--p-primary-contrast-color`: Added fallback `var(--color-text-on-primary, #fff)`
   - `--p-surface-border`: Added `--surface-border` as first fallback: `var(--surface-border, var(--color-border-secondary, var(--primitive-neutral-200)))`

**Before:** PrimeNG variables depended directly on Aura tokens; if Aura loaded differently, semantic tokens could resolve to undefined.  
**After:** All `--p-primary-color`, `--p-primary-contrast-color`, and `--p-surface-border` have local fallbacks so the app never breaks.

**design-system-tokens.scss** (already hardened in prior rounds):
- `--p-primary-color`, `--p-primary-color-text`, `--p-surface-border` with fallbacks
- `--color-brand-primary`, `--color-status-*` with fallbacks
- `--ds-color-brand` defined locally as `var(--ds-primary-green)`

### Phase 2 – Utilities: Single Source of Truth (P1)

**Files changed:**
- `angular/src/scss/components/primitives/_layout.scss`

**Changes:**
- Removed duplicate `.gap-1` through `.gap-8` utilities (previously inside @layer primitives)
- Added comment: `/* gap-* utilities: canonical in design-system-tokens.scss (.gap-1..gap-8) */`

**Canonical utilities:** `angular/src/scss/tokens/design-system-tokens.scss` — .p-*, .m-*, .px-*, .py-*, .pt-*, .pb-*, .pl-*, .pr-*, .mt-*, .mb-*, .mr-*, .ml-*, .gap-1..gap-8

**Removed from:** `primitives/_layout.scss` (gap utilities were redundant)

### Phase 3 – OnPush Completion (P1/P2)

**Status:** All components already use `ChangeDetectionStrategy.OnPush`. No changes required.

**Verification:** Grep confirmed 180+ component files include `changeDetection: ChangeDetectionStrategy.OnPush`. No components without explicit strategy.

### Phase 4 – Final Verification

All commands green:
- ✅ `npm run build`
- ✅ `npm run lint` (0 errors)
- ✅ `npm run test`
- ✅ `npm run lint:css`

---

### Summary

| Area | Outcome |
|------|---------|
| **Aura hardening** | `--p-primary-color`, `--p-primary-contrast-color`, `--p-surface-border` have local fallbacks in both light and dark themes. `--ds-color-brand` = `var(--ds-primary-green)`. Status tokens use `var(--ds-*, fallback)`. |
| **Utilities** | Canonical: design-system-tokens.scss. Duplicates removed from primitives/_layout.scss. |
| **OnPush** | 180+ components use OnPush; no updates needed. |
| 8 | Fix Stylelint: primeng-integration hex → tokens, remove empty line | primeng-integration.scss | P1 ✓ |

---

## ALIGNMENT ROUND – APPLIED FIXES (2026-02-10)

**Date/Time:** 2026-02-10 (UTC)  
**Branch:** main

### Phase 0 – Inventory + Single Source of Truth

**Canonical paths (enforced):**
- Global styles entrypoint: `angular/src/styles.scss` (angular.json styles)
- Token file: `angular/src/scss/tokens/design-system-tokens.scss`
- Spacing utilities (.p-*, .m-*, .gap-*): `design-system-tokens.scss` (canonical)
- Flex utilities (.flex): `angular/src/scss/utilities/layout-system.scss`
- Non-spacing utilities: `angular/src/scss/utilities/_utilities.scss`

**Changes applied:**
1. **standardized-components.scss** – Removed duplicate `.flex` block and `&.gap-2`, `&.gap-4`, `&.gap-6` modifiers. Use canonical `.flex` from layout-system.scss and `.gap-1..gap-8` from design-system-tokens.scss.
2. **_utilities.scss** – Replaced `@each` loops for `$radius` and `$shadows` with token-based utilities. Added `.rounded-none`, `.rounded-2xl`, `.shadow-none`, `.shadow-2xl`, `.shadow-inner` using `var(--*)` references.
3. **design-system-tokens.scss** – Added `--shadow-2xl`, `--shadow-inner` tokens for utility parity.

**design-tokens.scss** – Kept as forward alias to design-system-tokens.scss.

**Commands:** `cd angular && npm run build`, `npm run lint`, `npm run test`, `npm run lint:css` (from project root)

### Phase 1 – Design System Contract Enforcement

**Changes applied:**
1. **angular/src/scss/README.design-system.md** – Added design system contract doc (canonical paths, PrimeNG mapping, rules).
2. **stylelint.config.js** – Added design-tokens.scss to tokens allowlist.
3. Stylelint rules already block hex, !important, hardcoded radius/shadow/z-index/transition outside allowlist.

### Phase 2 – PrimeNG Overrides Centralization

**Changes applied:**
1. **styles.scss** – Added TIER 4: `@use "./assets/styles/overrides"` so the overrides layer entrypoint is explicitly loaded.
2. **_exceptions.scss** – Fixed @use to `scss/utilities` (provides respond-to, tablet-layout) instead of styles/mixins.
3. PrimeNG overrides already centralized in _exceptions.scss with DS-EXC-* tickets; component SCSS references "moved to _exceptions".

### Phase 3 – Component Structure & Styling Consistency

**Changes applied:**
1. **loading.component.scss** – Removed duplicate .mb-4, .mt-6, .gap-4, .flex-row, .flex-grow; use canonical utilities from design-system-tokens.
2. **empty-state.component.scss** – Fixed invalid token `var(--ds-font-size-var(--header-height))` → `var(--ds-font-size-xl)`.
3. **README.design-system.md** – Added component SCSS pattern (host first, spacing via tokens, no duplicated utilities).

### Phase 4 – Angular 21 State + Subscription Hygiene

**Changes applied:**
1. **ai-coach-chat.component.ts** – Added `takeUntilDestroyed(this.destroyRef)` to bookmark save subscription.
2. **README.design-system.md** – Documented state/subscription boundary rules.

### Phase 5 – UI Contract Consistency

**Changes applied:**
1. **README.design-system.md** – Documented canonical Loading/Empty/Error components (app-loading, app-empty-state, app-page-error-state).

### Phase 6 – Regression Test Guardrails

**Changes applied:**
1. **design-tokens.util.spec.ts** – New Vitest spec for getCssVariable, getCssVariables, resolveCssVariable, getStatusColor, SPACING.
2. E2E design-system-compliance.spec.ts, smoke.spec.ts, navigation-routing.spec.ts already cover app boot, routes, design tokens.

### Phase 7 – Final Verification

**Commands run (2026-02-10):**
- `cd angular && npm run build` → ✅ PASS
- `npm run lint` → ✅ PASS (0 errors)
- `npm run test` → ✅ PASS (763 tests)
- `npm run lint:css` (from root) → ✅ PASS

**Note:** styles.css exceeds 500 kB budget by ~16 kB (515.93 kB) due to overrides layer inclusion.

---

## ALIGNMENT ROUND – APPLIED FIXES (2026-02-10)

### Design System Token Refactor – Pure Tokens vs Overrides

**Goal:** Token file = pure source-of-truth (definitions, semantic mappings, utilities). Enforcement CSS moved to overrides layer.

**Files changed:**

| File | Change |
|------|--------|
| `angular/src/scss/tokens/design-system-tokens.scss` | Removed enforcement block (~170 lines): `*[style*="089949"]`, `.p-button-green`, `.white-on-green`, `.black-on-green`, gradient overrides, etc. Normalized hover tokens to `var(--ds-primary-green-hover)` / `var(--primitive-*-rgb)`. Replaced hardcodes: `--color-status-help`→primitive, `--color-workout-*`→primitives, Settings icon tokens→rgba(var(--*-rgb), 0.15). Added `--primitive-info-400`, `--primitive-neutral-500-rgb`. Grouped **FEATURE PALETTE** (workout/positions/rarity) with clear "NOT for semantic UI status" comment. Dark mode hover tokens use `rgba(var(--primitive-primary-500-rgb), …)`. |
| `angular/src/assets/styles/overrides/_color-guards.scss` | **New file.** All selector-based enforcement rules moved here: inline `*[style*="089949"]`, class-based `.p-button-green`, `.btn-green`, `.white-on-green`, `.black-on-green`, PrimeNG green components, gradient backgrounds. Uses `var(--color-text-on-primary)` throughout. |
| `angular/src/assets/styles/overrides/_index.scss` | Added `@use "color-guards";` after exceptions. |

**Import order preserved:** tokens → primeng base/brand → primitives/features → overrides.

**Verification:** `npm run build` ✅ | `npm run test` ✅ | `npm run lint:css` ✅ (stylelint on tokens + color-guards).

### Polish (same session)

| File | Change |
|------|--------|
| `angular/src/styles.scss` | Moved Poppins `@use` into TIER 1 block with other critical loads; removed from @import section. Comment now correctly separates @use vs @import. |
| `angular/src/scss/tokens/design-system-tokens.scss` | Consolidated gold tokens: `--color-star-rating`, `--color-metallic-gold`, `--color-medal-gold` → `var(--primitive-gold-500)`; `--color-medal-gold-rgb` → `var(--primitive-gold-500-rgb)`; medal gold gradient start → `var(--primitive-gold-500)`. |

---

## PRIMENG INTEGRATION AUDIT (2026-02-10)

**Date:** 2026-02-10  
**Scope:** Full PrimeNG integration audit – token mapping, overlay consistency, focus/a11y, removal of ad-hoc overrides

### A) PrimeNG Usage Inventory

**Components used (alphabetically):**  
p-accordion, p-accordion-content, p-accordion-header, p-accordion-panel, p-autocomplete, p-avatar, p-badge, p-button, p-calendar, p-card, p-checkbox, p-chip, p-colorPicker, p-confirmDialog, p-datepicker, p-dialog, p-divider, p-inputNumber, p-message, p-paginator, p-progressBar, p-radioButton, p-select, p-skeleton, p-slider, p-stepper, p-step, p-step-list, p-tab, p-tablist, p-tabpanel, p-tabpanels, p-tabs, p-table, p-tag, p-timeline, p-toast

**Directives used:** pTooltip, pInputText, pInputTextarea, pTemplate

**Top 20 files by PrimeNG usage count:**

| # | File | Count |
|---|------|-------|
| 1 | features/travel/travel-recovery.component.ts | 52 |
| 2 | features/settings/settings.component.html | 43 |
| 3 | features/exercisedb/exercisedb-manager.component.ts | 45 |
| 4 | features/staff/psychology/psychology-reports.component.ts | 39 |
| 5 | features/game-tracker/game-tracker.component.html | 35 |
| 6 | features/staff/physiotherapist/physiotherapist-dashboard.component.ts | 31 |
| 7 | features/coach/injury-management/injury-management.component.ts | 30 |
| 8 | features/tournaments/tournaments.component.ts | 30 |
| 9 | features/analytics/analytics.component.ts | 26 |
| 10 | features/staff/nutritionist/nutritionist-dashboard.component.ts | 25 |
| 11 | features/training/components/periodization-dashboard/periodization-dashboard.component.ts | 24 |
| 12 | features/coach/payment-management/payment-management.component.ts | 24 |
| 13 | features/coach/scouting/scouting-reports.component.ts | 23 |
| 14 | features/onboarding/onboarding.component.ts | 22 |
| 15 | features/return-to-play/return-to-play.component.ts | 22 |
| 16 | features/cycle-tracking/cycle-tracking.component.ts | 21 |
| 17 | features/coach/coach-analytics/coach-analytics.component.ts | 17 |
| 18 | features/dashboard/player-dashboard.component.ts | 18 |
| 19 | features/performance-tracking/performance-tracking.component.ts | 28 |
| 20 | features/training/ai-training-scheduler/ai-training-scheduler.component.ts | 10 |

### B) Token Mapping Completeness – Verified

- `--p-primary-color`, `--p-primary-color-text`, `--p-text-color`, `--p-text-color-secondary` → mapped with fallbacks
- `--p-surface-*`, `--p-surface-border` → mapped; `--surface-elevated` used for overlays
- `--p-border-radius`, `--p-focus-ring`, `--p-focus-ring-width`, `--p-focus-ring-color`, `--p-focus-ring-offset`, `--p-focus-ring-style` → added with fallbacks
- `--p-transition-duration` → mapped
- Input/button height tokens (`--p-inputtext-min-height`, `--button-height-md`, etc.) → mapped
- `--z-tooltip`, `--z-toast` → added as aliases to `--z-index-tooltip`, `--z-index-notification`

### C) PrimeNG Overrides Removed/Relocated

| File | Action |
|------|--------|
| feature-walkthrough.component.scss | `.p-dialog` / `.p-dialog-content` overrides moved to `_exceptions.scss` (DS-PNGO-001) |
| enhanced-data-table.component.scss | Exception header added (DS-PNGO-002 – functional scroll fix) |
| daily-readiness.component.scss | Exception header added (DS-PNGO-003) |
| wellness-checkin.component.scss | Exception header added (DS-PNGO-004 – a11y reduced-motion) |
| superadmin-dashboard.component.scss | Exception header added (DS-PNGO-005) |
| physiotherapist-dashboard.component.scss | `.p-progressbar` height now uses `var(--p-progressbar-height)` |
| tournaments.component.scss | Exception header added (DS-PNGO-006) |

### D) Standardization – Token Mappings

- Buttons: primary/secondary/outlined/text/danger via `_token-mapping.scss`
- Inputs: height `--touch-target-md`, padding, radius from tokens
- Tables: header typography, row padding, hover `--color-surface-hover`
- Tags/badges: success/warn/error/info from `--color-status-*` tokens

### E) Overlay Consistency – Applied

- Dialog, Dropdown, Select, OverlayPanel, Toast, Tooltip use:
  - background: `--surface-elevated` (light and dark)
  - border: `--surface-border`
  - shadow: `--shadow-lg`
  - z-index: `--z-dropdown`, `--z-modal`, `--z-tooltip`, `--z-toast`

### Files Changed (This Audit)

| File | Change |
|------|--------|
| design-system-tokens.scss | Added `--z-tooltip`, `--z-toast`; `--p-focus-ring-*` fallbacks; overlay vars for dark/light |
| primeng/_token-mapping.scss | Overlay tokens: `--surface-elevated`, `--surface-border`, `--shadow-lg`; dialog/select/dropdown/tooltip/toast |
| primeng-integration.scss | Overlay panels use token vars; dialog borders use `--surface-border` |
| _exceptions.scss | Walkthrough dialog exception (DS-PNGO-001) |
| feature-walkthrough.component.scss | Removed .p-dialog overrides (moved to exceptions) |
| enhanced-data-table, daily-readiness, wellness-checkin, superadmin-dashboard, tournaments, physiotherapist-dashboard | Exception headers or token refs |

### Remaining Exceptions (Documented)

| ID | Scope | Reason |
|----|-------|--------|
| DS-PNGO-001 | .walkthrough-dialog | radius-2xl, zero content padding (UX) |
| DS-PNGO-002 | p-datatable scroll | Functional scroll/touch fixes |
| DS-PNGO-003 | .weight-input .p-inputnumber-input | Center text, semibold |
| DS-PNGO-004 | .p-slider-handle (reduced-motion) | A11y required |
| DS-PNGO-005 | .p-input-icon-left in management-filters | Flex layout |
| DS-PNGO-006 | .tournament-form textarea | min-height, resize |

### Verification (2026-02-10)

```
cd angular && npm run build  → ✅ PASS
npm run lint                 → ✅ PASS (0 errors)
npm run test                 → ✅ PASS (763 tests)
npm run lint:css             → ✅ PASS
```

**Note:** CSS bundle exceeds 500 kB budget by ~19 kB (pre-existing; overrides layer inclusion).
