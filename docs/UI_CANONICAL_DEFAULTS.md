# UI Canonical Defaults Specification

> **Version:** 1.0.0  
> **Effective Date:** January 4, 2026  
> **Status:** PR-Ready  
> **Source of Truth:** `design-system-tokens.scss`

---

## Purpose

This document defines the **canonical UI defaults** for all components in the FlagFit Pro Angular application. These defaults ensure visual consistency across all pages and features.

**All new components and refactored code MUST follow these specifications.**

---

## Table of Contents

1. [Card Defaults](#1-card-defaults)
2. [Button Defaults](#2-button-defaults)
3. [Section Header Defaults](#3-section-header-defaults)
4. [Empty State Defaults](#4-empty-state-defaults)
5. [Spacing & Layout Defaults](#5-spacing--layout-defaults)
6. [Typography Defaults](#6-typography-defaults)
7. [Interactive State Defaults](#7-interactive-state-defaults)
8. [Code Review Checklist](#code-review-checklist)

---

## 1. Card Defaults

### 1.1 Standard Card

All cards in the application MUST use these canonical values:

| Property            | Token                                     | Value                       | Notes                    |
| ------------------- | ----------------------------------------- | --------------------------- | ------------------------ |
| **Border Radius**   | `var(--radius-lg)`                        | 8px                         | NOT pill-shaped          |
| **Box Shadow**      | `var(--shadow-sm)`                        | `0 1px 3px rgba(0,0,0,0.1)` | Resting state            |
| **Background**      | `var(--surface-primary)`                  | #ffffff                     | Light mode               |
| **Border**          | `1px solid var(--color-border-secondary)` | #e5e7eb                     | Optional, for emphasis   |
| **Body Padding**    | `var(--space-4)`                          | 16px                        | Internal content padding |
| **Content Padding** | `0`                                       | 0                           | Reset PrimeNG default    |

```scss
// ✅ CANONICAL CARD STYLING (use app-card-shell component)
// Card styling is handled by the card-shell component
// No direct PrimeNG overrides needed in feature SCSS
app-card-shell {
  // Custom properties cascade into the component
}
```

### 1.2 Card Hover Behavior

| Property       | Token/Value                                   | Notes            |
| -------------- | --------------------------------------------- | ---------------- |
| **Transform**  | `translateY(-1px)`                            | Subtle lift only |
| **Shadow**     | `var(--shadow-md)`                            | Elevated shadow  |
| **Transition** | `transform 0.15s ease, box-shadow 0.15s ease` | Fast, smooth     |

```scss
// ✅ CANONICAL CARD HOVER (handled by card-shell component)
// Use state="interactive" on app-card-shell for hover effects
// <app-card-shell state="interactive">...</app-card-shell>
```

### 1.3 Stat Card Variant

For KPI/metric display cards:

| Property                   | Token                               | Value               |
| -------------------------- | ----------------------------------- | ------------------- |
| **Body Padding**           | `var(--space-3)`                    | 12px (tighter)      |
| **Icon Container**         | `var(--space-10) × var(--space-10)` | 40px × 40px         |
| **Icon Background Radius** | `var(--radius-md)`                  | 6px                 |
| **Value Font**             | `var(--font-size-metric-md)`        | 24px                |
| **Value Weight**           | `var(--font-weight-bold)`           | 700                 |
| **Label Font**             | `var(--font-size-caption)`          | 12px                |
| **Label Transform**        | `uppercase`                         | With letter-spacing |
| **Label Letter Spacing**   | `var(--letter-spacing-caption)`     | 0.04em              |

```scss
// ✅ CANONICAL STAT CARD
.stat-card-content {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.stat-icon {
  width: var(--space-10);
  height: var(--space-10);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-body-md);
}

.stat-value {
  font-size: var(--font-size-metric-md);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.stat-label {
  font-size: var(--font-size-caption);
  font-weight: var(--font-weight-regular);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-caption);
}
```

### 1.4 Card with Header Variant

For cards with section titles:

| Property                | Token                                          | Value            |
| ----------------------- | ---------------------------------------------- | ---------------- |
| **Header Padding**      | `var(--space-3) var(--space-4) var(--space-2)` | Top/sides/bottom |
| **Header Icon Size**    | `var(--font-body-md)`                          | 16px             |
| **Header Icon Color**   | `var(--color-brand-primary)`                   | #089949          |
| **Header Icon Opacity** | `0.85`                                         | Slightly muted   |
| **Title Font**          | `var(--font-size-h2)`                          | 18px             |
| **Title Weight**        | `var(--font-weight-semibold)`                  | 600              |
| **Title Margin Bottom** | `var(--space-3)`                               | 12px             |

```scss
// ✅ CANONICAL CARD HEADER
.card-header-custom {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4) var(--space-2);
}

.card-header-icon {
  font-size: var(--font-body-md);
  color: var(--color-brand-primary);
  opacity: 0.85;
}

.card-header-title {
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
  margin-bottom: var(--space-3);
}
```

---

## 2. Button Defaults

### 2.1 Button Radius Rule

**⚠️ CRITICAL: Buttons are NEVER pill-shaped (border-radius: 9999px)**

| Property          | Token                  | Value | Notes                    |
| ----------------- | ---------------------- | ----- | ------------------------ |
| **Border Radius** | `var(--radius-button)` | 8px   | Raised rectangular style |

```scss
// ✅ CORRECT
border-radius: var(--radius-button); // 8px

// ❌ FORBIDDEN
border-radius: var(--radius-full); // 9999px - NEVER for buttons
border-radius: 50%; // NEVER for buttons
border-radius: 9999px; // NEVER for buttons
```

### 2.2 Button Sizes

| Size            | Height Token              | Padding X        | Padding Y        | Font Size             |
| --------------- | ------------------------- | ---------------- | ---------------- | --------------------- |
| **Small (sm)**  | `var(--button-height-sm)` | `var(--space-3)` | `var(--space-2)` | `var(--font-body-sm)` |
| **Medium (md)** | `var(--button-height-md)` | `var(--space-4)` | `var(--space-3)` | `var(--font-body-md)` |
| **Large (lg)**  | `var(--button-height-lg)` | `var(--space-5)` | `var(--space-4)` | `var(--font-body-lg)` |

| Size   | Height Value | Min Touch Target          |
| ------ | ------------ | ------------------------- |
| Small  | 36px         | ✅ Meets 36px minimum     |
| Medium | 44px         | ✅ Meets 44px recommended |
| Large  | 52px         | ✅ Exceeds 44px           |

### 2.3 Primary CTA Rule

The **Primary Call-to-Action** button on any page MUST:

1. Use `variant="primary"` (solid green background)
2. Be the most visually prominent button
3. Have white text: `var(--color-text-on-primary)`
4. Use the standard button radius: `var(--radius-button)` (8px)

```html
<!-- ✅ CANONICAL PRIMARY CTA -->
<app-button variant="primary" iconLeft="pi-play"> Start Training </app-button>

<!-- ❌ WRONG: Text variant for primary action -->
<app-button variant="text">Start Training</app-button>
```

### 2.4 Button Variant Hierarchy

| Variant       | Use Case                 | Background                   | Text Color                   |
| ------------- | ------------------------ | ---------------------------- | ---------------------------- |
| **primary**   | Primary CTA, main action | `var(--color-brand-primary)` | White                        |
| **secondary** | Secondary actions        | `var(--surface-secondary)`   | `var(--color-text-primary)`  |
| **outlined**  | Tertiary actions, grids  | Transparent                  | `var(--color-brand-primary)` |
| **text**      | Links, footer actions    | Transparent                  | `var(--color-brand-primary)` |
| **danger**    | Destructive actions      | `var(--color-status-error)`  | White                        |

### 2.5 Button Hover States

| Variant       | Hover Background                       | Hover Transform |
| ------------- | -------------------------------------- | --------------- |
| **primary**   | `var(--color-brand-primary-hover)`     | None            |
| **secondary** | `var(--surface-tertiary)`              | None            |
| **outlined**  | `var(--ds-primary-green-ultra-subtle)` | None            |
| **text**      | `var(--ds-primary-green-ultra-subtle)` | None            |

---

## 3. Section Header Defaults

### 3.1 Page Section Headers

For major sections within a page (outside of cards):

| Property          | Token                       | Value          |
| ----------------- | --------------------------- | -------------- |
| **Font Size**     | `var(--font-body-md)`       | 16px           |
| **Font Weight**   | `var(--font-weight-medium)` | 500            |
| **Color**         | `var(--color-text-primary)` | #1a1a1a        |
| **Icon Gap**      | `var(--space-2)`            | 8px            |
| **Icon Opacity**  | `0.7`                       | Slightly muted |
| **Margin Bottom** | `var(--space-3)`            | 12px           |

```scss
// ✅ CANONICAL SECTION HEADER
.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  font-size: var(--font-body-md);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}

.section-title i {
  opacity: 0.7;
}
```

### 3.2 Card Section Headers

For headers inside cards (using `pTemplate="header"`):

| Property              | Token                                          | Value         |
| --------------------- | ---------------------------------------------- | ------------- |
| **Container Padding** | `var(--space-3) var(--space-4) var(--space-2)` | 12px 16px 8px |
| **Title Font**        | `var(--font-size-h2)`                          | 18px          |
| **Title Weight**      | `var(--font-weight-semibold)`                  | 600           |
| **Icon Size**         | `var(--font-body-md)`                          | 16px          |
| **Icon Color**        | `var(--color-brand-primary)`                   | #089949       |

```html
<!-- ✅ CANONICAL CARD HEADER TEMPLATE -->
<p-card styleClass="my-card">
  <ng-template pTemplate="header">
    <div class="card-header-custom">
      <i class="pi pi-calendar card-header-icon"></i>
      <span class="card-header-title">This Week</span>
    </div>
  </ng-template>
  <!-- content -->
</p-card>
```

---

## 4. Empty State Defaults

### 4.1 Inline Empty State (within cards)

For empty states inside cards/sections:

| Property          | Token                                 | Value           |
| ----------------- | ------------------------------------- | --------------- |
| **Container**     | `<p-message severity="info">`         | PrimeNG Message |
| **Layout**        | `display: flex; align-items: center;` | Horizontal      |
| **Gap**           | `var(--space-2)`                      | 8px             |
| **Icon Size**     | `var(--font-body-md)`                 | 16px            |
| **Icon Opacity**  | `0.7`                                 | Muted           |
| **Text Size**     | `var(--font-body-sm)`                 | 14px            |
| **Message Width** | `100%`                                | Full width      |

```html
<!-- ✅ CANONICAL INLINE EMPTY STATE -->
<p-message severity="info" styleClass="empty-message">
  <div class="empty-content">
    <i class="pi pi-calendar empty-icon"></i>
    <span>No training scheduled for today</span>
  </div>
</p-message>
```

```scss
// ✅ CANONICAL EMPTY STATE STYLES
.empty-content {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-body-sm);
}

.empty-icon {
  font-size: var(--font-body-md);
  opacity: 0.7;
}

.empty-message {
  width: 100%;
}
```

### 4.2 Full Page Empty State

For empty pages or major sections:

| Property              | Token                         | Value          |
| --------------------- | ----------------------------- | -------------- |
| **Container Padding** | `var(--space-8)`              | 32px           |
| **Icon Size**         | `var(--icon-3xl)`             | 48px           |
| **Icon Color**        | `var(--color-text-muted)`     | Muted          |
| **Title Font**        | `var(--font-size-h3)`         | 20px           |
| **Title Weight**      | `var(--font-weight-semibold)` | 600            |
| **Description Font**  | `var(--font-body-sm)`         | 14px           |
| **Description Color** | `var(--color-text-secondary)` | Secondary      |
| **Max Width**         | `320px`                       | Constrain text |
| **Text Align**        | `center`                      | Centered       |

```scss
// ✅ CANONICAL FULL EMPTY STATE
.empty-state-full {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-8);
  text-align: center;
}

.empty-state-icon {
  font-size: var(--icon-3xl);
  color: var(--color-text-muted);
  margin-bottom: var(--space-4);
}

.empty-state-title {
  font-size: var(--font-size-h3);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-2);
}

.empty-state-description {
  font-size: var(--font-body-sm);
  color: var(--color-text-secondary);
  max-width: 320px;
  margin-bottom: var(--space-4);
}
```

---

## 5. Spacing & Layout Defaults

### 5.1 Page Container

| Property               | Token            | Value              |
| ---------------------- | ---------------- | ------------------ |
| **Max Width**          | `1400px`         | Standard container |
| **Horizontal Padding** | `var(--space-4)` | 16px               |
| **Vertical Padding**   | `var(--space-5)` | 20px               |
| **Section Gap**        | `var(--space-6)` | 24px               |

```scss
// ✅ CANONICAL PAGE CONTAINER
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-5) var(--space-4);
  max-width: 1400px;
  margin: 0 auto;
}
```

### 5.2 Grid Layouts

| Layout                    | Columns          | Gap              |
| ------------------------- | ---------------- | ---------------- |
| **Stats Grid (4-up)**     | `repeat(4, 1fr)` | `var(--space-3)` |
| **Dashboard Grid (2-up)** | `repeat(2, 1fr)` | `var(--space-5)` |
| **Quick Actions (3-up)**  | `repeat(3, 1fr)` | `var(--space-3)` |
| **Events Strip (4-up)**   | `repeat(4, 1fr)` | `var(--space-3)` |

### 5.3 Responsive Breakpoints

| Breakpoint  | Width          | Grid Adjustment |
| ----------- | -------------- | --------------- |
| **Desktop** | > 1024px       | Full grid       |
| **Tablet**  | 768px - 1024px | 2 columns       |
| **Mobile**  | < 768px        | 1 column        |

```scss
// ✅ CANONICAL RESPONSIVE GRID
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

## 6. Typography Defaults

### 6.1 Heading Hierarchy

| Level  | Token            | Size | Weight | Line Height | Use Case           |
| ------ | ---------------- | ---- | ------ | ----------- | ------------------ |
| **H1** | `--font-size-h1` | 28px | 600    | 1.2         | Page greeting only |
| **H2** | `--font-size-h2` | 18px | 600    | 1.2         | Card titles        |
| **H3** | `--font-size-h3` | 20px | 600    | 1.3         | Subsections        |

### 6.2 Body Text

| Level          | Token                 | Size | Weight | Line Height | Use Case                     |
| -------------- | --------------------- | ---- | ------ | ----------- | ---------------------------- |
| **Body**       | `--font-body-md`      | 16px | 400    | 1.5         | Default text                 |
| **Body Small** | `--font-body-sm`      | 14px | 400    | 1.45        | Secondary text, descriptions |
| **Caption**    | `--font-size-caption` | 12px | 400    | 1.3         | Labels, helper text          |

### 6.3 Metric/KPI Text

| Level             | Token                   | Size | Weight | Use Case         |
| ----------------- | ----------------------- | ---- | ------ | ---------------- |
| **Metric Large**  | `--font-size-metric-lg` | 32px | 700    | Hero KPIs        |
| **Metric Medium** | `--font-size-metric-md` | 24px | 700    | Card stat values |

---

## 7. Interactive State Defaults

### 7.1 Focus States

All interactive elements MUST have visible focus states:

| Property              | Token                         | Value                          |
| --------------------- | ----------------------------- | ------------------------------ |
| **Focus Ring Width**  | `var(--focus-outline-width)`  | 2px                            |
| **Focus Ring Offset** | `var(--focus-outline-offset)` | 2px                            |
| **Focus Ring Color**  | `var(--focus-ring-color)`     | #089949                        |
| **Focus Ring Shadow** | `var(--focus-ring-shadow)`    | `0 0 0 3px rgba(8,153,73,0.3)` |

```scss
// ✅ CANONICAL FOCUS STATE
&:focus-visible {
  outline: var(--focus-outline-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-outline-offset);
  box-shadow: var(--focus-ring-shadow);
}
```

### 7.2 Disabled States

| Property           | Token                           | Value |
| ------------------ | ------------------------------- | ----- |
| **Opacity**        | `var(--state-disabled-opacity)` | 0.38  |
| **Cursor**         | `not-allowed`                   | -     |
| **Pointer Events** | `none`                          | -     |

### 7.3 Loading States

| Property                | Token                     | Value                     |
| ----------------------- | ------------------------- | ------------------------- |
| **Skeleton Background** | `var(--surface-tertiary)` | #e9ecef                   |
| **Animation**           | `pulse`                   | 1.5s ease-in-out infinite |

---

## Code Review Checklist

Use this checklist when reviewing PRs that include UI changes:

### ✅ Card Styling

- [ ] Uses `var(--radius-lg)` for border-radius (NOT `--border-radius` or raw pixels)
- [ ] Uses `var(--shadow-sm)` for resting shadow
- [ ] Uses `var(--shadow-md)` for hover shadow
- [ ] Hover transform is `translateY(-1px)` (NOT -2px or -4px)
- [ ] Card body padding uses `var(--space-4)` or `var(--space-3)` for stat cards
- [ ] Card content padding is reset to `0`

### ✅ Button Styling

- [ ] Uses `var(--radius-button)` or `var(--radius-lg)` for border-radius
- [ ] Does NOT use `border-radius: 9999px`, `50%`, or `var(--radius-full)` for buttons
- [ ] Primary CTA uses `variant="primary"` with solid green background
- [ ] Button text on green background is white

### ✅ Typography

- [ ] Uses design system font tokens (NOT raw pixel values)
- [ ] Stat labels use `text-transform: uppercase` with `letter-spacing: var(--letter-spacing-caption)`
- [ ] Card titles use `var(--font-size-h2)` with `var(--font-weight-semibold)`

### ✅ Spacing

- [ ] Uses `var(--space-*)` tokens for all padding/margin/gap
- [ ] Does NOT use raw pixel values like `padding: 12px`
- [ ] Section gaps use `var(--space-6)` (24px)
- [ ] Component internal gaps use `var(--space-3)` or `var(--space-4)`

### ✅ Colors

- [ ] Uses `var(--color-*)` or `var(--ds-primary-green)` tokens
- [ ] Does NOT use raw hex colors
- [ ] Text on green backgrounds uses `var(--color-text-on-primary)` (white)

### ✅ Shadows

- [ ] Uses `var(--shadow-*)` tokens
- [ ] Does NOT use raw `box-shadow` values

### ✅ z-index

- [ ] Uses `var(--z-index-*)` tokens
- [ ] Does NOT use raw z-index numbers

### ✅ Transitions

- [ ] Uses `var(--transition-*)` or `var(--motion-*)` tokens
- [ ] Does NOT use raw duration values like `0.3s`

### ✅ Empty States

- [ ] Uses `<p-message severity="info">` for inline empty states
- [ ] Includes appropriate icon with `opacity: 0.7`
- [ ] Uses `var(--font-body-sm)` for empty state text

### ✅ PrimeNG Overrides

- [ ] No `::ng-deep` usage (fully removed from codebase)
- [ ] Uses `styleClass` prop instead of direct CSS selectors where possible
- [ ] Uses CSS custom properties for theming
- [ ] Does NOT override PrimeNG component internals unnecessarily

### ✅ Accessibility

- [ ] Interactive elements have visible focus states
- [ ] Focus uses `var(--focus-ring-*)` tokens
- [ ] Touch targets are at least 44px

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                   UI CANONICAL DEFAULTS                      │
├─────────────────────────────────────────────────────────────┤
│ CARD RADIUS:        var(--radius-lg)         → 8px          │
│ CARD SHADOW:        var(--shadow-sm)         → subtle       │
│ CARD HOVER SHADOW:  var(--shadow-md)         → elevated     │
│ CARD HOVER LIFT:    translateY(-1px)         → subtle       │
│ CARD PADDING:       var(--space-4)           → 16px         │
├─────────────────────────────────────────────────────────────┤
│ BUTTON RADIUS:      var(--radius-button)     → 8px          │
│ BUTTON RADIUS:      NEVER 9999px / 50%       → NO PILLS     │
│ PRIMARY CTA:        variant="primary"        → solid green  │
├─────────────────────────────────────────────────────────────┤
│ SECTION GAP:        var(--space-6)           → 24px         │
│ COMPONENT GAP:      var(--space-3/4)         → 12-16px      │
├─────────────────────────────────────────────────────────────┤
│ STAT VALUE:         --font-size-metric-md    → 24px bold    │
│ STAT LABEL:         --font-size-caption      → 12px upper   │
│ CARD TITLE:         --font-size-h2           → 18px semi    │
└─────────────────────────────────────────────────────────────┘
```

---

## Document History

| Version | Date       | Author        | Changes               |
| ------- | ---------- | ------------- | --------------------- |
| 1.0.0   | 2026-01-04 | Design System | Initial specification |

---

**Related Documents:**

- [Design System Tokens](../angular/src/assets/styles/design-system-tokens.scss)
- [PrimeNG Design System Rules](./PRIMENG_DESIGN_SYSTEM_RULES.md)
- [Button Standardization](../angular/docs/BUTTON_STANDARDIZATION.md)
