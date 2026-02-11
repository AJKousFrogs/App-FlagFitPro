# UI Polish Audit Report — FlagFit Pro

**Audit Date:** February 11, 2026  
**Scope:** PrimeNG components, hardcoded spacings, typography, speed  
**Framework:** Angular 21 + PrimeNG 21  
**Reference:** Screenshots provided + codebase analysis

---

## Executive Summary

The app has a **solid design system foundation** with tokens, PrimeNG theme mapping, and documented exceptions. Most PrimeNG components (slider, checkbox, calendar, toast) are well-integrated. This audit surfaces **polishing opportunities** and **actionable fixes**, prioritized by impact.

| Area | Status | Priority |
|------|--------|----------|
| Sliders | Good (token-based) | Low |
| Checkboxes | Good (token-based) | Low |
| Calendar/DatePicker | Good (token-based) | Low |
| Toast | Good (token-based) | Low |
| Hardcoded spacings | Mixed | Medium |
| Typography (word-wrap) | Issue found | High |
| Speed/Performance | Baseline exists | Low |

---

## 1. PrimeNG Component Audit

### 1.1 Sliders (`p-slider`)

**Current state:** Token-driven via `_token-mapping.scss` and component-specific overrides.

- **Global tokens:** `--p-slider-background`, `--p-slider-range-background`, `--p-slider-handle-background`
- **Design token:** `--slider-track-height: 0.375rem` (6px for touch affordance)
- **Usage:** `wellness-checkin`, `daily-readiness`, `session-log-form` (RPE), `daily-readiness` weight slider

**Findings:**

| Location | Issue | Fix |
|----------|-------|-----|
| `.wellness-checkin .p-slider` | Height `calc(var(--space-1) + var(--space-0-5))` — not using `--slider-track-height` | Align to `--slider-track-height` for consistency |
| `.rpe-slider` | Custom gradient range (intentional) | OK — documented exception DS-EXC-008 |
| `.daily-readiness .p-slider` | Custom handle size (`--space-6`) | Consider using `--touch-target-md` for tap area consistency |

**Recommendation:** Ensure all slider tracks use `var(--slider-track-height)` or `var(--space-2)` for uniformity. Keep handle size ≥ 44px (touch target) on mobile.

---

### 1.2 Checkboxes (`p-checkbox`)

**Current state:** Well tokenized across `_token-mapping.scss`, `_brand-overrides.scss`, `primeng-integration.scss`, and `ui-standardization.scss`.

- **Tokens:** `--p-checkbox-width: var(--space-5)`, `--p-checkbox-height: var(--space-5)`, `--p-checkbox-border-radius: var(--radius-md)`, green check state
- **Usage:** `supplement-tracker`, `wellness-checkin` (soreness areas), various forms

**Findings:**

| Location | Issue | Fix |
|----------|-------|-----|
| `.supplement-tracker .p-checkbox` | Uses `--space-6` instead of `--space-5` | Align to global `--p-checkbox-width/height` for consistency |
| `.wellness-checkin .area-checkbox` | Uses `--radius-sm` for box | Matches design system (OK) |

**Recommendation:** Prefer global `--p-checkbox-*` tokens; use component overrides only when UX requires a different size (e.g. compact lists).

---

### 1.3 Calendar / DatePicker (`p-calendar`, `p-datepicker`)

**Current state:** Token-mapped in `primeng-integration.scss` and `_token-mapping.scss`.

- **Tokens:** `--p-calendar-border-radius`, `--p-calendar-trigger-width`, `--p-calendar-input-icon-padding`
- **Usage:** `game-tracker`, `settings`, `training-schedule` (calendar container)
- **Exception:** Calendar portal renders outside component scope — overrides in `_exceptions.scss` (DS-EXC-002)

**Findings:**

| Location | Issue | Fix |
|----------|-------|-----|
| `.calendar-container .p-datepicker` | Uses `var(--space-2)` / `var(--space-1)` for cell padding in md/sm | OK — uses tokens |
| `training-schedule` | `.calendar-container` styling | OK — responsive, token-based |

**Recommendation:** No changes. Calendar styling is consistent and token-driven.

---

### 1.4 Toast (`p-toast`)

**Current state:** Custom `app-toast` wrapper, tokens in `primeng-integration.scss`, `_token-mapping.scss`, `_brand-overrides.scss`, and `_component-overrides.scss`.

- **Tokens:** `--p-toast-border-radius`, `--p-toast-content-padding`, `--p-toast-content-gap`, `--p-toast-*-background`, `--p-toast-*-border-color`
- **Placement:** `app.component` — single global instance, `preventDuplicates: true`
- **Severities:** success, info, warn, error — all token-based

**Findings:**

| Location | Issue | Fix |
|----------|-------|-----|
| Toast animations | Slide-in/out uses `translateX(100%)` | OK — premium feel |
| `.p-toast-message-content` | Uses `var(--p-toast-content-padding)` | OK |
| Z-index | `--p-toast-z-index: var(--z-toast)` | OK |

**Recommendation:** No changes. Toast is well integrated.

---

## 2. Hardcoded Spacings Audit

### 2.1 Design System Contract

From `UX_READY_CRITERIA.md` and `DESIGN_SYSTEM_RULES.md`:

> No new hex colors, raw px, or hardcoded radius/shadow outside design system.

Spacing scale: `var(--space-1)` through `var(--space-24)`, `--space-0-5`, `--space-0-75`.

### 2.2 Findings

| File | Pattern | Status |
|------|---------|--------|
| `primeng-integration.scss` | `3px`, `2px` for focus rings (via `var(--focus-ring-width, 3px)`) | OK — fallback in tokens |
| `design-system-tokens.scss` | `4px`, `8px`, `10px`, `20px` in blur/border vars | OK — intentional, documented |
| `feedback-toast.component.scss` | `@media (max-width: 30rem)` | Consider `--bp-mobile` or `--container-sm` |
| `roster.component.scss` | `75rem`, `87.4375rem`, `64rem`, `74.9375rem` | Consider `--bp-*` tokens for breakpoints |
| `header.component.scss` | `@media (max-width: 80rem)` | Consider `--bp-wide` or similar |
| `training-schedule.component.scss` | `width: 60%`, `width: 40%` | OK — responsive split; consider `minmax()` for flexibility |
| `search-panel.component.scss` | `max-height: 70vh` | Consider `var(--dropdown-max-height)` or viewport token if available |
| `superadmin-dashboard.component.scss` | `width: 90%` | Consider token or `min()` for responsiveness |
| `ai-training-companion.component.scss` | `width: 90vw`, `max-height: 80vh` | Consider design token for overlay sizing |
| `action-card.component.ts` | `[style.left.px]`, `[style.top.px]` for ripple | Dynamic — acceptable for JS-driven positioning |

### 2.3 Recommendations

1. **Breakpoints:** Add/reuse `--bp-mobile`, `--bp-tablet`, `--bp-desktop`, `--bp-wide` and replace raw `rem` in media queries.
2. **Viewport units:** Document `vh`/`vw` usage or add tokens (e.g. `--viewport-height-modal: 80vh`) for consistency.
3. **Percentage widths:** `60%`/`40%` splits are fine; ensure they work with `min-width` for narrow viewports.

---

## 3. Typography Audit

### 3.1 Stats Grid — Word Wrap Issue (High Priority)

**Screenshot finding:** Wellness metric labels ("Sleep Quality", "Recovery Score", "Energy Level", "Stress Level") show awkward line breaks (e.g. "Slee p Qua lity", "Rec over y Scor e").

**Root cause:** `stats-grid.component.scss` sets `overflow-wrap: break-word` on both `.stat-block__value` and `.stat-block__label`. In narrow columns, words can break mid-word.

**Current CSS:**
```scss
.stat-block__label {
  overflow-wrap: break-word;
  text-transform: var(--ds-text-transform-uppercase);
  /* ... */
}
```

**Fix:**
```scss
.stat-block__label {
  overflow-wrap: break-word;
  word-break: keep-all; /* Prevent mid-word breaks */
  /* Or: use white-space: nowrap and let container handle overflow */
}
```

For labels like "Sleep Quality", prefer:
- `word-break: normal` with `overflow-wrap: break-word` — allows breaking at natural points
- Or `min-width` on `.stat-details` so labels don’t wrap awkwardly in typical grid layouts
- Consider `min-width: min-content` on the card to avoid squash in `auto-fit` grids

**Action:** Add `word-break: normal` and ensure `min-width` on stat cards prevents excessive squeezing. If needed, set `min-width: 7rem` on `.stat-details` or equivalent.

---

### 3.2 Typography Consistency

- **Design tokens:** `--ds-font-*`, `--font-h1-size` through `--font-caption-size` are defined.
- **Deprecated tokens:** Many `--font-display-*`, `--font-heading-*`, `--font-body-*` are deprecated; migration to new scale is ongoing.
- **PrimeNG inputs:** Use `--p-form-control-*` for font sizing; alignment with design system is good.

**Recommendation:** Audit remaining uses of deprecated font tokens and migrate to `--font-h1-size`, `--font-body-size`, etc.

---

## 4. Speed / Performance Audit

### 4.1 Existing Tooling

- `scripts/app-performance-check.js` — build size, bundle analysis, runtime checks
- `npm run benchmark` — performance checks
- Lazy loading: `@defer (on viewport)` used on wellness charts, body composition, supplement tracker, hydration tracker
- Chart.js and PrimeNG are the main heavy dependencies

### 4.2 Recommendations

1. **Lazy load PrimeNG modules:** Calendar, Slider, etc. — use standalone imports; tree-shaking is already in place.
2. **Chart.js:** Lazy-loaded via `app-lazy-chart`; ensure `chartOptions` is not recreated on every change detection.
3. **Toast:** Single global instance with `preventDuplicates` — good.
4. **Run benchmark:** Execute `npm run benchmark` and address any large bundles or slow metrics.

---

## 5. Additional UI Polish Items (from Screenshots)

### 5.1 Search Bar

- **Spacing:** Input uses `p-inputgroup`; verify `--p-form-control-padding-x/y` for consistency.
- **Keyboard shortcut hint (⌘K):** Styling is clean; ensure border-radius matches `--radius-md` or `--radius-sm` and spacing uses tokens.

### 5.2 Auto Tag + Avatar

- **"Auto" tag:** Pill shape, orange dot — confirm `p-chip` or custom; ensure `--radius-full` or `--radius-button` per design system.
- **"AK" avatar:** Green circle — uses `--ds-primary-green`; sizing should use `--avatar-*` tokens.

### 5.3 Tooltip ("Keyboard shortcuts (?)")

- Green border and pointer match icon color — good.
- Ensure tooltip uses `--p-tooltip-*` or equivalent tokens; padding should use `var(--space-*`.

### 5.4 Command Palette / Search

- Dark theme "Search analytics..." input — styling appears consistent.
- "Select a channel" — verify `p-dropdown` or `p-button` uses tokens.

---

## 6. Priority Action List

| # | Action | Owner | Effort | Status |
|---|--------|-------|--------|--------|
| 1 | **Fix stats-grid word-wrap** — add `word-break: normal` to prevent broken labels | Dev | S | ✅ Done |
| 2 | Replace slider height in wellness-checkin with `var(--slider-track-height)` | Dev | S | ✅ Done |
| 3 | Align supplement-tracker checkbox to global `--p-checkbox-*` | Dev | S | ✅ Done |
| 4 | Replace raw breakpoints with mixins (header, feedback-toast) | Dev | M | ✅ Done |
| 5 | Replace hardcoded overlay/viewport values with tokens | Dev | M | ✅ Done |
| 6 | Run `npm run benchmark` and address bundle/runtime issues | Dev | S | ✅ Done |

---

## 7. References

- `docs/DESIGN_SYSTEM_RULES.md`
- `docs/UX_READY_CRITERIA.md`
- `angular/src/scss/tokens/design-system-tokens.scss`
- `angular/src/scss/components/primeng/_token-mapping.scss`
- `angular/src/assets/styles/overrides/_component-overrides.scss`
- `angular/src/assets/styles/overrides/_exceptions.scss`

---

*Generated by UI Polish Audit — February 11, 2026*
