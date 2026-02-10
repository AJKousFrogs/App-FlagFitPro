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
