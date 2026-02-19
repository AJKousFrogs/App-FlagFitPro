# SCSS Primitives & Where to Put Styles

This document prevents duplication creep.

**Enforcement:** `npm run audit:scss-duplications:ci` runs in CI and fails when `.form-field` > 50, `.form-row` > 45, any file has >25 respond-to blocks, `:hover` > 200 globally, or `:focus-visible` > 85 globally. Run `npm run audit:scss-duplications` locally to inspect.

---

## Foundations Layer (scss/foundations/)

Canonical placeholders and mixins for high-duplication patterns. Load after utilities, before components.

| File | Purpose | Usage |
|------|---------|-------|
| `_states.scss` | focus-visible + disabled boilerplate | `@include interactive($focus-ring: true);` |
| `_typography.scss` | Scoped p/h3/h4/strong/i for article content | `@extend %rich-text;` |
| `_forms.scss` | Form layout placeholders | `@extend %form-field;` / `%form-row` / `%form-label` |
| `_stats.scss` | Stat block placeholders | `@extend %stat-block;` / `%stat-icon` / `%stat-label` / `%stat-value` |
| `_breakpoints.scss` | Re-exports $breakpoints, respond-to, respond-min | Import when you need breakpoint refs |

**Refactor order (safest first):** 1) Breakpoints (group respond-to blocks) 2) States (interactive mixin) 3) Forms 4) Stats 5) Typography scopes.

**Note:** "from" (84x in audit) is `@keyframes from { ... }` — excluded from duplicate count; ignore.

---

## Migration Checklist (when refactoring a component)

Use this when moving a component to foundations:

- [ ] **States:** Replace raw `:focus-visible` + `:disabled` with `@include interactive($focus-ring: true);`
- [ ] **Forms:** Replace ad-hoc `.form-field` / `.form-row` with `@extend %form-field` / `@extend %form-row`
- [ ] **Respond-to:** Group blocks inside selectors (nest `@include respond-to(md) { ... }` inside `.selector { }`) instead of repeating the selector per breakpoint
- [ ] **Stats:** Use `@extend %stat-block` / `%stat-icon` / `%stat-label` / `%stat-value` where applicable
- [ ] **Typography:** Add `@extend %rich-text` only to article/modal content containers (opt-in)

---

## Where to Put Styles (Guardrail)

| Style type | Location | Example |
|------------|----------|---------|
| Form layout (row, field, grid) | `primitives/_forms.scss` | `.form-row`, `.form-field`, `.two-col` |
| Stat / metric / KPI blocks | `primitives/_dashboard.scss` | `.stat-block`, `.metrics-grid`, `.stat-icon` |
| Icons, loading placeholders | `primitives/_icons.scss`, `_skeleton.scss` | `.icon`, `.rec-icon`, `.loading-placeholder` |
| Feature-specific overrides | Component SCSS | `.tournament-form .form-field { flex: 1 }` |
| Responsive layout | `utilities/layout-system.scss` | `.grid-responsive-2`, `.grid-responsive-4` |

**Rule:** Do not rebuild base layout in components. Only add local overrides (widths, colors, special cases).

---

## Decision Rule: When to Use Primitives vs. Component Styles

**Refactor a selector into primitives only if:**
1. It appears in **3+ features** AND
2. It represents the **same UI concept** (form layout, stat card, skeleton, icon) AND
3. It doesn't depend on **feature-specific DOM structure**

Otherwise, keep it local to the component.

---

## Allowed Primitives (Use These, Don't Redefine)

| Primitive | File | Selectors | Rule |
|-----------|------|-----------|------|
| **Forms** | `primitives/_forms.scss` | `.form-row`, `.form-field`, `.form-row--2col`, `.two-col`, `.three-col`, `.four-col`, `.form-field.full-width`, `.form-field.checkbox-field`, `.form-label`, `.form-actions`, `.is-inline`, `.is-compact`, `.is-stacked-at-sm` | Feature components: only set local overrides (widths, special cases), not base layout |
| **Dashboard/Stats** | `primitives/_dashboard.scss` | `.stats-grid`, `.stats-grid--2col`, `.stats-grid--3col`, `.stats-overview`, `.stat-block`, `.stat-icon`, `.stat-card-content`, `.stat-details`, `.stat-value`, `.stat-label`, `.metrics-grid`, `.metric-value`, `.metric-label`, `.header-actions` | If selector name includes stat/metric/kpi and appears in 3+ features → use primitive |
| **Icons** | `primitives/_icons.scss` | `.icon`, `[data-icon]`, `.rec-icon`, `.icon-sm`, `.icon-md`, etc., `.icon-button` | Use `.icon` or `[data-icon]` wrapper; avoid styling raw `i` globally |
| **Charts** | `primitives/_charts.scss` | `.charts-grid`, `.chart-container`, `.chart-legend` | Chart layout grid—use instead of redefining in analytics, performance-tracking, wellness |
| **Skeleton** | `primitives/_skeleton.scss` | `.loading-placeholder`, `.loading-placeholder--compact`, `.loading-placeholder--lg` | Chart/card/block placeholders while data loads |
| **Feedback** | `primitives/_feedback.scss` | `.skeleton`, `.loading-state`, `.empty-state`, `.card-empty-state` | Shimmer blocks and empty states |
| **Responsive grid** | `utilities/layout-system.scss` | `.grid-responsive-2`, `.grid-responsive-3`, `.grid-responsive-4`, `.grid.grid-cols-*` | Use instead of per-component respond-to for grid layout |

---

## What NOT to Refactor (Low ROI)

| Selector | Why |
|----------|-----|
| `:hover` | 179 uses is normal. Enforce consistency via shared tokens for hover border/shadow/transform. |
| `label` | Often structural. Only refactor if same typography/margins repeated everywhere. |
| `:focus-visible` | Interaction-specific. Use shared focus-ring tokens. |

---

## Respond-to Explosion Guardrail

- **Rule:** A component file shouldn't need **10+** `@include respond-to` blocks unless it's a layout system.
- **If it does:** Convert into a primitive or layout helper.
- **Target:** Mobile-first. Most properties live outside breakpoints; breakpoints only **add** enhancements.
- **Prefer:** Use `.grid-responsive-*` and `.grid.grid-cols-*` from `layout-system.scss` instead of custom breakpoints.

**Worst offenders (consolidate when safe):**
1. `assets/styles/overrides/_component-overrides.scss` — deferred: nested component blocks, high refactor risk
2. `scss/components/primitives/_dashboard.scss` — partially consolidated
3. `scss/components/standardized-components.scss` — consolidated
4. `scss/utilities/layout-system.scss` — grid breakpoints consolidated (shared respond-to blocks for grid-cols-2/3/4)

---

## Quick Reference: Which Primitive?

| You need… | Use |
|-----------|-----|
| Form row (fields side by side) | `.form-row` |
| Form row 2/3/4 columns | `.form-row.two-col`, `.form-row.three-col`, `.form-row.four-col` or `.form-row--2col`, etc. |
| Single form field | `.form-field` |
| Full-width form field | `.form-field.full-width` |
| Checkbox/radio field row | `.form-field.checkbox-field` |
| Stat card / KPI block | `.stat-block`, `.stat-icon`, `.stat-details`, `.stat-value`, `.stat-label` |
| Stats grid (2/3 cols) | `.stats-grid`, `.stats-grid--2col`, `.stats-grid--3col` |
| Charts grid | `.charts-grid` |
| Metrics grid (analytics, coach) | `.metrics-grid` |
| Loading placeholder (charts, cards) | `.loading-placeholder` |
| Recommendation card icon | `.rec-icon` |
| Generic icon (avoid raw `i`) | `.icon` or `[data-icon]` |
| Responsive 2/3/4-col grid | `.grid-responsive-2`, `.grid-responsive-3`, `.grid-responsive-4` |
