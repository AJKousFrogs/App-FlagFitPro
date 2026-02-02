# FlagFit Pro — Design System Rules (FINAL)

**Status:** ✅ **APPROVED**  
**Effective Date:** January 2, 2026  
**Enforcement Date:** January 2026 (Phase 4.1 — Incremental Enforcement)  
**Scope:** Web App (Angular + PrimeNG)  
**Applies To:** All new code and all refactors starting Phase 1

> **⚠️ Enforcement Policy:** As of January 2026, we use **incremental enforcement**:
>
> - **Legacy files** (existing before enforcement date): Tolerated (warnings only)
> - **Changed files** (modified after enforcement date): Strict enforcement (errors block merge)
>
> Enforcement is automated via **Stylelint + code review**.

---

# EXECUTIVE SUMMARY

## 1. Purpose

This document defines the **single source of truth** for FlagFit Pro's UI system.

Its goals are to:

- **Eliminate UI inconsistency**
- **Prevent regression** during refactoring
- **Enable safe scaling** (features, teams, localization, future theming)
- **Replace "best effort" styling** with enforceable rules

> **Once approved, no refactor or new UI work may proceed outside these rules except via the documented exception process.**

---

## 2. Governance Model

### 2.1 Binding Authority

- This document **overrides all previous UI conventions**
- In case of conflict: **this document wins**
- Enforcement is automated via **Stylelint + code review**

### 2.2 Exception Process (Mandatory)

Exceptions are **rare, scoped, temporary**.

Every exception MUST include:
| Field | Required |
|-------|----------|
| Ticket ID | ✅ |
| Reason | ✅ |
| Scope | ✅ |
| Owner | ✅ |
| Removal date | ✅ |

```scss
@layer overrides {
  /*
   * EXCEPTION
   * Ticket: #456
   * Reason: PrimeNG limitation
   * Scope: analytics-dashboard only
   * Owner: @dev-name
   * Remove by: 2026-02-15
   */
}
```

**Undocumented exceptions are violations.**

---

## 3. CSS Architecture

### 3.1 Cascade Order (Required)

```scss
@layer reset,
       tokens,
       primeng-base,
       primeng-brand,
       primitives,
       features,
       overrides;
```

**Rules:**

- ❌ No styles outside layers
- ❌ No `!important` outside `overrides`
- ✅ Overrides must be time-boxed

---

## 4. Design Tokens (Single Source of Truth)

### 4.1 Token Authority

- Hex colors **ONLY** in `design-system-tokens.scss`
- All other files use CSS variables only

```scss
/* ❌ Forbidden */
color: #089949;

/* ✅ Required */
color: var(--ds-primary-green);
```

### 4.2 Spacing Scale (LOCKED)

Single spacing system for padding, margin, gap, grid:

```scss
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
```

❌ **No raw spacing values allowed.**

### 4.3 Radius Scale (LOCKED)

10px and 14px are **not allowed**.

```scss
--radius-sm: 2px;
--radius-md: 6px;
--radius-lg: 8px; /* Default for buttons, cards, inputs */
--radius-xl: 12px;
--radius-2xl: 16px;
```

❌ **`--radius-full` (pill shape) is RESTRICTED** — Limited use only.

**Allowed uses:**

- Avatars/profile images (circular)
- Progress bar tracks and fills
- Toggle switch tracks
- Dot indicators (status dots)

**Forbidden uses:**

- ❌ Buttons
- ❌ Tags/Badges
- ❌ Cards
- ❌ Any rectangular UI element

**Migration:**

- `border-radius: 100px` or `9999px` → `var(--radius-md)` (6px)
- Pill-shaped buttons → Standard `var(--radius-lg)` (8px)

### 4.4 Typography Scale (LOCKED — UNIFIED SYSTEM)

**Effective Date:** January 4, 2026

The unified typography system enforces predictable hierarchy across all components:

#### 4.4.1 Heading Tokens (LOCKED)

```scss
/* H1: Page titles, hero greetings */
--font-h1-size: 2rem; /* 32px */
--font-h1-line-height: 1.2;
--font-h1-weight: 700; /* bold */

/* H2: Section headers, dialog titles */
--font-h2-size: 1.5rem; /* 24px */
--font-h2-line-height: 1.25;
--font-h2-weight: 600; /* semibold */

/* H3: Card titles, subsections */
--font-h3-size: 1.25rem; /* 20px */
--font-h3-line-height: 1.3;
--font-h3-weight: 400; /* regular (600 for card headers) */

/* H4: Small headings, group labels */
--font-h4-size: 1rem; /* 16px */
--font-h4-line-height: 1.35;
--font-h4-weight: 300; /* light */
```

#### 4.4.2 Body & Text Tokens (LOCKED)

```scss
/* Body: Regular text, paragraphs */
--font-body-size: 1rem; /* 16px */
--font-body-line-height: 1.5;
--font-body-weight: 400; /* regular */

/* Body-sm: Helper text, descriptions */
--font-body-sm-size: 0.875rem; /* 14px */
--font-body-sm-line-height: 1.45;
--font-body-sm-weight: 400; /* regular */

/* Label: Form labels, table headers */
--font-label-size: 0.875rem; /* 14px */
--font-label-line-height: 1.2;
--font-label-weight: 600; /* semibold */

/* Caption: Timestamps, smallest text */
--font-caption-size: 0.75rem; /* 12px */
--font-caption-line-height: 1.3;
--font-caption-weight: 400; /* regular */
```

#### 4.4.3 Typography Hierarchy Summary

| Element     | Size | Weight         | Line-Height | Use Case                       |
| ----------- | ---- | -------------- | ----------- | ------------------------------ |
| **H1**      | 32px | 700 (bold)     | 1.2         | Page titles, hero greetings    |
| **H2**      | 24px | 600 (semibold) | 1.25        | Section headers, dialog titles |
| **H3**      | 20px | 400/600        | 1.3         | Card titles, subsections       |
| **H4**      | 16px | 300 (light)    | 1.35        | Small headings, group labels   |
| **Body**    | 16px | 400 (regular)  | 1.5         | Regular text, paragraphs       |
| **Body-sm** | 14px | 400 (regular)  | 1.45        | Helper text, descriptions      |
| **Label**   | 14px | 600 (semibold) | 1.2         | Form labels, table headers     |
| **Caption** | 12px | 400 (regular)  | 1.3         | Timestamps, smallest text      |

#### 4.4.4 PrimeNG Component Typography Mapping (MANDATORY)

| Component                       | Typography Token | Details                           |
| ------------------------------- | ---------------- | --------------------------------- |
| `p-dialog .p-dialog-title`      | H2               | 24px/600/1.25                     |
| `p-card .p-card-title`          | H3               | 20px/600/1.3 (semibold for cards) |
| `p-card .p-card-subtitle`       | Body-sm          | 14px/400/1.45                     |
| `p-tabview .p-tabview-nav-link` | Body-sm          | 14px/600/1.45 (semibold for tabs) |
| `p-tabs .p-tab`                 | Body-sm          | 14px/600/1.45 (semibold for tabs) |
| `p-datatable thead th`          | Label            | 14px/600/1.2 + uppercase          |
| `p-datatable tbody td`          | Body             | 16px/400/1.5                      |
| `p-panel .p-panel-header`       | H3               | 20px/600/1.3                      |
| `p-accordion header`            | H3               | 20px/600/1.3                      |
| Form labels                     | Label            | 14px/600/1.2                      |
| Helper/description text         | Body-sm          | 14px/400/1.45                     |
| Error text                      | Body-sm          | 14px/400/1.45 + error color       |

#### 4.4.5 Legacy Token Mapping (Backward Compatibility)

```scss
/* These legacy tokens are mapped to the unified system */
--font-body-xs: var(--font-caption-size); /* 12px */
--font-body-sm: var(--font-body-sm-size); /* 14px */
--font-body-md: var(--font-body-size); /* 16px */
--font-body-lg: 1.125rem; /* 18px */
--font-size-h1: var(--font-h1-size);
--font-size-h2: var(--font-h2-size);
--font-size-h3: var(--font-h3-size);
--font-size-h4: var(--font-h4-size);
```

❌ **No raw font sizes allowed.**  
❌ **No per-component font overrides outside typography-system.scss.**

---

## 5. Borders & Shadows

### 5.1 Border System

```scss
--border-1: 1px;
--border-2: 2px;

--color-border-default
--color-border-muted
--color-border-strong
--color-border-focus
--color-border-danger
--color-border-warning
```

❌ **No raw border colors or widths.**

### 5.2 Elevation System (LOCKED)

```scss
--shadow-0: none;
--shadow-1: 0 1px 3px rgba(0, 0, 0, 0.08);
--shadow-2: 0 4px 12px rgba(0, 0, 0, 0.12);
--shadow-3: 0 8px 24px rgba(0, 0, 0, 0.16);
```

**Card policy (BORDERLESS - Updated Jan 2026):**
| State | Styling |
|-------|---------|
| Default | NO border + `--shadow-sm` |
| Hover | `--shadow-md` |
| Active | `--shadow-sm` |
| Focus | focus ring (never border color) |

> **Note:** Border-first was deprecated in favor of borderless cards for a cleaner, more modern aesthetic. Cards rely on subtle shadows for depth instead of borders.

---

## 6. PrimeNG Integration Rules

### 6.1 Boundaries

PrimeNG styles may exist **only** in:

- `primeng/token-mapping.scss`
- `primeng/brand-overrides.scss`
- `@layer overrides` (documented)

❌ **Feature SCSS must never style `.p-*` directly.**

### 6.2 Button Rules (LOCKED)

- Default shape: `--radius-lg` (8px) — **RAISED STYLE**
- ❌ **Pill shape (`--radius-full`) is FORBIDDEN** — never use rounded pills
- `[rounded]="true"` is **FORBIDDEN** — all buttons use raised (rectangular) style
- Primary CTA buttons use `raised` appearance

### 6.3 Button Sizing Rules (LOCKED)

**Single Buttons:** Size to content (default `inline-block`)

**Grouped Buttons:** Must be equal width when displayed together

Use these CSS classes for button groups:

```html
<!-- Equal-width buttons in a grid -->
<div class="button-grid cols-3">
  <app-button>Short</app-button>
  <app-button>Much Longer Text</app-button>
  <app-button>Medium</app-button>
</div>

<!-- Quick actions (3 columns, 2 on mobile) -->
<div class="quick-actions-grid">
  <app-button variant="outlined">Action 1</app-button>
  <app-button variant="outlined">Action 2</app-button>
  <app-button variant="outlined">Action 3</app-button>
</div>

<!-- Auto-fit grid (responsive columns) -->
<div class="actions-grid">
  <app-button>Save</app-button>
  <app-button>Cancel</app-button>
</div>
```

**Available Grid Classes:**

| Class                 | Columns  | Mobile   |
| --------------------- | -------- | -------- |
| `.button-grid`        | 2        | 2        |
| `.button-grid.cols-3` | 3        | 2        |
| `.button-grid.cols-4` | 4        | 2        |
| `.quick-actions-grid` | 3        | 2        |
| `.actions-grid`       | auto-fit | auto-fit |

**Alternative:** Use `[fullWidth]="true"` on individual buttons when needed.

### 6.4 Icon + Text Layout Rules (LOCKED)

**Icons must always be positioned LEFT of text, never above.**

This applies to:

- Stat cards
- Selection buttons/cards
- Action cards
- List items with icons

**Correct Pattern:**

```html
<div class="stat-card-content">
  <div class="stat-icon">
    <i class="pi pi-chart-line"></i>
  </div>
  <div class="stat-details">
    <span class="stat-value">0.85</span>
    <span class="stat-label">ACWR</span>
  </div>
</div>
```

**CSS Pattern:**

```scss
.card-content {
  display: flex;
  flex-direction: row; /* NEVER column for icon + text */
  align-items: center;
  gap: var(--space-4);
}

.card-icon {
  width: var(--space-10); /* 40px */
  height: var(--space-10);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  flex-shrink: 0;
}

.card-details {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
```

**❌ FORBIDDEN:** `flex-direction: column` with icon above text
**✅ REQUIRED:** `flex-direction: row` with icon left of text

---

## 7. Interaction & Motion

### 7.1 Required States (ALL interactive elements)

| State           | Required |
| --------------- | -------- |
| `default`       | ✅       |
| `hover`         | ✅       |
| `active`        | ✅       |
| `focus-visible` | ✅       |
| `disabled`      | ✅       |

❌ `:focus` forbidden  
✅ `:focus-visible` only

### 7.2 Motion Tokens

```scss
--motion-fast: 120ms;
--motion-base: 200ms;
--motion-slow: 320ms;

--ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
```

❌ **`transition: all` forbidden.**

---

## 8. Layout System

### 8.1 Containers

```scss
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-max: 1440px;
```

### 8.2 Bento Grid (LOCKED)

Allowed **only** for dashboards and analytics.
| Viewport | Columns |
|----------|---------|
| Desktop | 12 |
| Tablet | 6 |
| Mobile | 1 |

---

## 9. Forms & Controls

### 9.1 Control Sizes (CANONICAL)

| Size             | Height |
| ---------------- | ------ |
| Small            | 32px   |
| Medium (default) | 44px   |
| Large            | 56px   |

**No other sizes exist.**

### 9.2 Validation Behavior (LOCKED)

- Validate on **blur + submit**
- One error per field
- Errors below field
- Plain language only

---

## 10. Tables, Dialogs, Feedback

### Tables

- Variants: **default / compact only**
- Default row: 52px
- Compact row: 40px

### Dialogs

- Sizes: 400 / 560 / 800 / 90vw
- Footer buttons: secondary left, primary right

### Feedback

- Toasts: top-right
- Errors & warnings are sticky
- Success auto-dismiss (3s)

---

## 11. Icons & Overlays

### Icons

- **PrimeIcons only**
- Sizes: 16 / 20 / 24px
- Icon-only buttons require `aria-label` + tooltip

### Overlays

- Unified surface, radius, shadow
- Z-index via tokens only

---

## 12. Accessibility (Baseline)

- WCAG AA contrast **guaranteed by tokens**
- Focus ring: 3px, visible, consistent
- Keyboard navigation required for dialogs, menus, dropdowns
- Toggles require **two cues** (never color-only)

---

## 13. Localization

| Language       | Supported        |
| -------------- | ---------------- |
| Arabic (RTL)   | ❌ Not supported |
| Japanese (CJK) | ✅ Supported     |

- No fixed-width text containers
- Wrapping-safe layouts
- Ellipsis tested

---

## 14. Enforcement

### Stylelint Rules (Mandatory)

| Rule                              | Enforces |
| --------------------------------- | -------- |
| No hex colors outside tokens      | ✅       |
| No raw spacing, radius, font-size | ✅       |
| No raw box-shadow                 | ✅       |
| No raw z-index                    | ✅       |
| No `transition: all`              | ✅       |
| No `::ng-deep` (fully removed)    | ✅       |
| No `!important` outside overrides | ✅       |

**Violations block PR merge.**

---

## 15. Migration Rules

- Feature-by-feature (strangler pattern)
- No mass rewrites
- Deprecated variables must include removal metadata

---

## 16. Final Approval

By approving this document, the team agrees that:

1. These rules are **binding**
2. Refactoring may begin **immediately**
3. Any deviation requires a **documented exception**

---

## ✅ SIGN-OFF

**CORE + OPERATIONAL Decisions Approved By:**

- Product / Design / Engineering

**Date:** January 2, 2026

---

## 🚀 Next Steps (Execution)

1. Add Stylelint config
2. Create token + folder structure
3. Map PrimeNG tokens
4. Start Phase 1 refactor

---

# DETAILED DECISIONS REFERENCE

> The sections below contain the full 68 decisions with implementation details, code examples, and migration guidance.

---

## Decision Summary

| Category        | Decisions        | Status      |
| --------------- | ---------------- | ----------- |
| **CORE**        | 59 decisions     | ✅ APPROVED |
| **OPERATIONAL** | 9 decisions      | ✅ APPROVED |
| **TOTAL**       | **68 decisions** | ✅ APPROVED |

---

# PART 1: TOKEN FOUNDATIONS

---

## Decision 1: Token Source of Truth

### Rule

> **Hex colors are ONLY allowed in `design-system-tokens.scss`**  
> All other files must use CSS custom properties (variables)

### Current State

| File                        | Hardcoded Hex | Status                          |
| --------------------------- | ------------- | ------------------------------- |
| `design-system-tokens.scss` | 242           | ✅ ALLOWED (this IS the source) |
| `primeng-theme.scss`        | 141           | ❌ VIOLATION                    |
| `primeng-integration.scss`  | 138           | ❌ VIOLATION                    |
| All other files             | 66            | ❌ VIOLATION                    |

### Enforcement

```scss
// ❌ FORBIDDEN (anywhere except design-system-tokens.scss)
background: #089949;
color: #ffffff;
border: 1px solid #e5e5e5;

// ✅ REQUIRED
background: var(--ds-primary-green);
color: var(--color-text-on-primary);
border: var(--border-1) solid var(--color-border-default);
```

### Your Decision

- [ ] **APPROVED** - Hex only in tokens file ⭐ CORE
- [ ] **REJECTED** - Keep current approach (explain why)

---

## Decision 2: Single Spacing Scale (Padding, Margin, Gap)

### The Conflict

We have TWO spacing scales that **don't match**:

| Step | CSS Tokens (`--space-*`) | SCSS Variables (`space()`) |
| ---- | ------------------------ | -------------------------- |
| 5    | **1.25rem (20px)**       | **1.5rem (24px)** ❌       |
| 6    | **1.5rem (24px)**        | **2rem (32px)** ❌         |
| 7    | (not defined)            | 2.5rem (40px)              |
| 8    | **2rem (32px)**          | **3rem (48px)** ❌         |

### The Rule

> **One spacing scale for ALL spacing: padding, margin, gap, grid**  
> This decision governs all spacing properties

### Options

**Option A: Keep CSS Tokens (RECOMMENDED)**

```scss
// CSS tokens (design-system-tokens.scss) - 8-point grid
--space-1: 0.25rem; // 4px
--space-2: 0.5rem; // 8px
--space-3: 0.75rem; // 12px
--space-4: 1rem; // 16px
--space-5: 1.25rem; // 20px
--space-6: 1.5rem; // 24px
--space-8: 2rem; // 32px
--space-10: 2.5rem; // 40px
--space-12: 3rem; // 48px
```

**Option B: Align SCSS to CSS**

- Modify `_variables.scss` to match CSS tokens
- Keep both systems but make them identical

**Option C: Delete SCSS Variables**

- Remove `_variables.scss` entirely
- Use only CSS custom properties

### Enforcement (applies to padding, margin, gap)

```scss
// ❌ FORBIDDEN
padding: 0.875rem; // Not on grid
margin: 1.125rem; // Not on grid
gap: 10px; // Raw value

// ✅ REQUIRED
padding: var(--space-4);
margin: var(--space-3);
gap: var(--space-4);
```

### Your Decision

- [ ] **Option A** - CSS tokens for all spacing ⭐ CORE
- [ ] **Option B** - Keep both, align SCSS to CSS
- [ ] **Option C** - Delete SCSS variables entirely

---

## Decision 3: Single Radius Scale

### The Conflict

Current CSS tokens vs. values found in codebase:

| Token          | CSS Value | Found Raw Values |
| -------------- | --------- | ---------------- |
| `--radius-sm`  | 2px       | -                |
| `--radius-md`  | 6px       | -                |
| `--radius-lg`  | 8px       | -                |
| `--radius-xl`  | 12px      | -                |
| `--radius-2xl` | 16px      | -                |
| (none)         | -         | **10px** ❌      |
| (none)         | -         | **14px** ❌      |

### Options

**Option A: Add 10px and 14px as Official Tokens**

**Option B: Migrate Away from 10px/14px (RECOMMENDED)**

- Round 10px → 8px (`--radius-lg`) or 12px (`--radius-xl`)
- Round 14px → 12px (`--radius-xl`) or 16px (`--radius-2xl`)
- Fewer tokens = less confusion

**Option C: Simplify Scale Entirely**

```scss
--radius-sm: 4px; // Small elements (tags, badges)
--radius-md: 8px; // Default (inputs, small cards)
--radius-lg: 12px; // Medium (cards, dialogs)
--radius-xl: 16px; // Large (modal, hero sections)
--radius-full: 9999px; // Pills, avatars
```

### Your Decision

- [ ] **Option A** - Add 10px/14px as official tokens
- [ ] **Option B** - Migrate 10px→8px/12px, 14px→12px/16px ⭐ CORE
- [ ] **Option C** - Simplify to 4/8/12/16/full scale

---

## Decision 4: Single Typography Scale

### The Problem

**178 hardcoded font-size values** found, using **27 different sizes**.

### Current Token Scale

```scss
--font-body-xs: 0.75rem; // 12px
--font-body-sm: 0.875rem; // 14px
--font-body-md: 1rem; // 16px
--font-body-lg: 1.125rem; // 18px

--font-heading-xs: 1rem; // 16px
--font-heading-sm: 1.125rem; // 18px
--font-heading-md: 1.25rem; // 20px
--font-heading-lg: 1.5rem; // 24px
--font-heading-xl: 1.875rem; // 30px
--font-heading-2xl: 2.5rem; // 40px
```

### Options

**Option A: Strict 10-Value Scale (RECOMMENDED)**
Map all 27 sizes to existing tokens. Accept minor visual shifts.

| In-Between Value | → Migrate To             |
| ---------------- | ------------------------ |
| 11px             | 12px `--font-body-xs`    |
| 13px             | 14px `--font-body-sm`    |
| 15px             | 16px `--font-body-md`    |
| 17.6px           | 18px `--font-heading-sm` |
| 22px             | 24px `--font-heading-lg` |

**Option B: Add Intermediate Tokens**

**Option C: Use CSS clamp() for Fluid Typography**

### Your Decision

- [ ] **Option A** - Strict 10-value scale ⭐ CORE
- [ ] **Option B** - Add intermediate tokens
- [ ] **Option C** - Fluid typography with clamp()

---

## Decision 5: Spacing Enforcement (Extends Decision 2)

> **Note:** This decision enforces Decision 2 for padding/margin/gap specifically.

### Current Violations

| Hardcoded Value   | Count | On Grid? | Nearest Token              |
| ----------------- | ----- | -------- | -------------------------- |
| `0.875rem` (14px) | 6     | ❌       | `--space-3` or `--space-4` |
| `0.625rem` (10px) | 2     | ❌       | `--space-2` or `--space-3` |
| `1.75rem` (28px)  | 1     | ❌       | `--space-6` or `--space-8` |
| `1.125rem` (18px) | 1     | ❌       | `--space-4` or `--space-5` |

### Migration Rule

- Round 10px → 8px (`--space-2`) or 12px (`--space-3`)
- Round 14px → 12px (`--space-3`) or 16px (`--space-4`)
- Round 18px → 16px (`--space-4`) or 20px (`--space-5`)

### Your Decision

- [ ] **APPROVED** - Enforce spacing grid for padding/margin/gap (OPERATIONAL)
- [ ] **REJECTED** - Allow off-grid values (explain why)

---

## Decision 6: PrimeNG Consumes Tokens

### The Problem

Currently, `primeng-theme.scss` has hardcoded values that **override** design tokens. The relationship is backwards.

### The Rule

> **PrimeNG components must style themselves using design tokens**  
> No PrimeNG file may define a color, spacing, or radius value directly

### Implementation

```scss
// ❌ CURRENT (primeng-theme.scss)
.p-button {
  background: linear-gradient(180deg, #0ab85a 0%, #089949 100%);
  border-radius: 9999px;
  padding: 0.75rem 1.5rem;
}

// ✅ REQUIRED
.p-button {
  background: linear-gradient(
    180deg,
    var(--ds-primary-green-light) 0%,
    var(--ds-primary-green) 100%
  );
  border-radius: var(--radius-full);
  padding: var(--space-3) var(--space-6);
}
```

### Your Decision

- [ ] **APPROVED** - PrimeNG consumes tokens only ⭐ CORE
- [ ] **REJECTED** - Keep PrimeNG with hardcoded values (explain why)

---

# PART 2: CASCADE & GOVERNANCE

---

## Decision 7: CSS Layers & Cascade Order

### The Problem

Without explicit cascade control, specificity wars continue. Currently using 100+ `!important` declarations.

### The Rule

> **All styles must be loaded in a fixed cascade order using `@layer`**

### Required Layer Order

```scss
@layer reset,          /* Browser normalization */
       tokens,         /* Design tokens (CSS custom properties) */
       primeng-base,   /* PrimeNG default styles */
       primeng-brand,  /* PrimeNG customization to match brand */
       primitives,     /* Shared components: cards, typography, spacing */
       features,       /* Feature-specific styles */
       overrides; /* Temporary fixes only (with ticket + expiry) */
```

### Enforcement

- ❌ No styles outside layers
- ❌ No `!important` except inside `overrides` layer
- ✅ Every `!important` must have a comment with ticket/expiry date

```scss
// ❌ FORBIDDEN
.my-card {
  padding: 1rem !important;
}

// ✅ ALLOWED (temporary, documented)
@layer overrides {
  /* TICKET: #123 - Remove by 2026-02-01 */
  .my-card {
    padding: var(--space-4) !important;
  }
}
```

### Your Decision

- [ ] **APPROVED** - Implement CSS layers ⭐ CORE
- [ ] **REJECTED** - Keep current approach (explain why)

---

## Decision 8: Semantic Token Taxonomy

### The Problem

Token naming must be consistent. No component-specific or page-specific tokens.

### The Rule

> **Tokens must be semantic first, never component-specific or page-specific**

### Allowed Token Families

| Prefix       | Purpose                      | Example                                         |
| ------------ | ---------------------------- | ----------------------------------------------- |
| `--color-*`  | Semantic UI roles            | `--color-surface-primary`, `--color-text-muted` |
| `--ds-*`     | Brand identity primitives    | `--ds-primary-green`                            |
| `--space-*`  | Spacing scale (numeric only) | `--space-4`, `--space-6`                        |
| `--radius-*` | Border radius scale          | `--radius-lg`                                   |
| `--shadow-*` | Elevation shadows            | `--shadow-1`, `--shadow-2`                      |
| `--font-*`   | Typography                   | `--font-heading-lg`                             |
| `--border-*` | Border widths                | `--border-1`, `--border-2`                      |
| `--z-*`      | Z-index scale                | `--z-modal`                                     |
| `--motion-*` | Durations/easings            | `--motion-fast`                                 |

### Forbidden Token Names

```scss
// ❌ FORBIDDEN (component-specific)
--settings-card-bg
--dashboard-green-header
--coach-widget-shadow
--wellness-card-padding
--space-card-padding       // NO! Spacing stays numeric

// ✅ Semantic spacing is done at recipe level, not token level
.card {
  padding: var(--space-5);
}
```

### Your Decision

- [ ] **APPROVED** - Semantic tokens only ⭐ CORE
- [ ] **REJECTED** - Allow component-specific tokens (explain why)

---

## Decision 9: Component Standard Library

### The Problem

Multiple versions of the same UI patterns exist (cards, buttons, etc.).

### The Rule

> **Common UI patterns must be implemented once as standardized classes/recipes**

### Minimum Standard Set

| Component       | Variants                                                               | Notes                    |
| --------------- | ---------------------------------------------------------------------- | ------------------------ |
| **Cards**       | `card-default`, `card-elevated`, `card-outlined`, `card-metric`        | Max 4 variants           |
| **Buttons**     | PrimeNG only                                                           | No custom button classes |
| **Inputs**      | PrimeNG + token mapping                                                | Consistent sizing        |
| **Badges/Tags** | `badge-success`, `badge-warning`, `badge-error`, `badge-info`          | Status indicators        |
| **Typography**  | `.text-page-title`, `.text-section-title`, `.text-body`, `.text-muted` | Consistent hierarchy     |
| **Layout**      | `.section-padding`, `.grid-gap-*`                                      | Consistent spacing       |

### Enforcement

- New UI must use standard recipes
- Exceptions require approval (Decision 10)

### Your Decision

- [ ] **APPROVED** - Implement component standard library (OPERATIONAL)
- [ ] **REJECTED** - Keep ad-hoc components (explain why)

---

## Decision 9A: Button Shape & Elevation Policy

### The Problem

138 components use `[rounded]="true"` (pill shape). This makes the UI feel "same-y" and clashes with cards/tables. Using `raised` everywhere makes UI heavy and noisy.

### Button Shape Policy

> **Default shape is standard radius, NOT pill**

| Shape                  | Token               | When to Use                                            |
| ---------------------- | ------------------- | ------------------------------------------------------ |
| **Standard (default)** | `--radius-lg` (8px) | All buttons by default                                 |
| **Pill**               | `--radius-full`     | Compact chips, icon-only, inline actions, special CTAs |

```scss
// ❌ STOP doing this everywhere
[rounded]="true"  // Makes everything pill-shaped

// ✅ Default button styling
.p-button {
  border-radius: var(--radius-lg); // Standard radius
}

// ✅ Pill only when intentional
.p-button.p-button-rounded {
  border-radius: var(--radius-full);
}
```

### Button Elevation Policy

> **`raised` is reserved for primary CTA only (max 1 per view)**

| Variant           | Elevation         | When to Use                           |
| ----------------- | ----------------- | ------------------------------------- |
| **Primary CTA**   | `raised` + shadow | Key conversion moment, 1 per view max |
| **Secondary**     | Flat/outlined     | Supporting actions                    |
| **Tertiary/Text** | None              | Low-emphasis actions                  |

### Button Hierarchy (use this)

```
┌─────────────────────────────────────────────────────┐
│  Page Header                              [Save] ← raised, primary CTA
│                                           [Cancel] ← outlined, secondary
├─────────────────────────────────────────────────────┤
│  Card                                               │
│  [Edit] [Delete] ← text buttons, tertiary           │
└─────────────────────────────────────────────────────┘
```

### Migration Plan

1. Remove `[rounded]="true"` from 138 locations
2. Apply `--radius-lg` as default in PrimeNG token mapping
3. Keep pill shape only where intentional (chips, icon buttons)
4. Audit `raised` usage — should be max 1 per view

### Your Decision

- [ ] **APPROVED** - Standard radius default, pill reserved ⭐ CORE
- [ ] **REJECTED** - Keep pill everywhere (explain why)

---

## Decision 9B: Toggle Accessibility Policy

### The Problem

Toggles often fail because they rely ONLY on color and knob position. Color-blind users and low-contrast situations make state unclear.

### The Rule

> **A toggle must communicate state using at least two cues, never only color**

### Required Toggle Pattern

| Element         | Required | Notes                            |
| --------------- | -------- | -------------------------------- |
| Label text      | ✅       | "Enable notifications"           |
| State indicator | ✅       | "On" / "Off" text OR icon change |
| Color change    | ✅       | But NOT the only cue             |
| `aria-checked`  | ✅       | Accessibility                    |
| Focus ring      | ✅       | Keyboard users                   |
| Min hit area    | ✅       | 44x44px minimum                  |

### Standard Toggle Wrapper

```html
<!-- ✅ REQUIRED pattern -->
<div class="toggle-field">
  <label for="notifications">Enable notifications</label>
  <div class="toggle-control">
    <p-toggleSwitch
      id="notifications"
      [(ngModel)]="enabled"
      [ariaLabel]="'Enable notifications'"
    />
    <span class="toggle-state">{{ enabled ? 'On' : 'Off' }}</span>
  </div>
  <small class="toggle-help">Receive push notifications for updates</small>
</div>
```

### Visual States

```scss
.toggle-field {
  .toggle-state {
    font-size: var(--font-body-xs);
    color: var(--color-text-muted);
    margin-left: var(--space-2);
  }

  // On state
  &.is-on .toggle-state {
    color: var(--color-status-success);
  }

  // Off state
  &.is-off .toggle-state {
    color: var(--color-text-muted);
  }
}
```

### Your Decision

- [ ] **APPROVED** - Two-cue toggle requirement ⭐ CORE
- [ ] **REJECTED** - Color-only toggles OK (explain why)

---

## Decision 10: Exception Process

### The Rule

> **Exceptions must be documented, scoped, and timeboxed**

### Requirements for Any Exception

| Field                 | Required | Example                                     |
| --------------------- | -------- | ------------------------------------------- |
| **Ticket/Issue Link** | ✅       | `#234`                                      |
| **Reason**            | ✅       | "Brand gradient not achievable with tokens" |
| **Scope**             | ✅       | "Campaign landing page only"                |
| **Removal Date**      | ✅       | "2026-03-01 or end of campaign"             |
| **Owner**             | ✅       | "@developer-name"                           |

### Technical Enforcement

```scss
// Exceptions ONLY allowed in @layer overrides
@layer overrides {
  /* 
   * EXCEPTION: Campaign gradient
   * Ticket: #234
   * Owner: @jane
   * Scope: campaign-hero component only
   * Remove by: 2026-03-01
   */
  .campaign-hero {
    background: linear-gradient(135deg, #custom1, #custom2);
  }
}
```

### Your Decision

- [ ] **APPROVED** - Require documented exceptions ⭐ CORE
- [ ] **REJECTED** - Allow undocumented exceptions (explain why)

---

## Decision 11: Migration Rules

### Rule 11.1: Strangler Pattern

> **Refactor feature-by-feature, never mass rewrites**

Migration order:

1. Tokens consolidation
2. PrimeNG theming
3. Shared components (cards, badges)
4. Feature-by-feature migration
5. Legacy cleanup

### Rule 11.2: Deprecation Labels

```scss
/**
 * @deprecated
 * @owner @original-author
 * @migration-ticket #345
 * @planned-removal 2026-Q1
 * @replacement Use var(--color-surface-primary) instead
 */
$legacy-card-bg: #f5f5f5;
```

### Your Decision

- [ ] **APPROVED** - Strangler pattern + deprecation labels ⭐ CORE
- [ ] **REJECTED** - Allow mass rewrites (explain why)

---

## Decision 12: Accessibility & Contrast Rules

### The Problem

`color-contrast-fixes.scss` (30 hardcoded colors) shows accessibility is being patched, not designed.

### The Rule

> **Tokens must guarantee accessible combinations**

### Requirements

| Requirement        | Standard                          | Token                                      |
| ------------------ | --------------------------------- | ------------------------------------------ |
| Text contrast      | WCAG AA (4.5:1 normal, 3:1 large) | Built into semantic color pairs            |
| Focus visibility   | 3px visible ring                  | `--color-focus-ring`, `--focus-ring-width` |
| Interactive states | Distinct hover/active/focus       | Consistent across components               |

### Implementation

```scss
// Tokens define accessible pairs
--color-text-on-primary: #ffffff; // Guaranteed contrast on --ds-primary-green
--color-text-on-surface: #1a1a1a; // Guaranteed contrast on --color-surface-primary

// Focus ring applied consistently
--color-focus-ring: var(--ds-primary-green);
--focus-ring-width: 3px;
--focus-ring-offset: 2px;
```

### Your Decision

- [ ] **APPROVED** - Accessibility baked into tokens ⭐ CORE
- [ ] **REJECTED** - Continue patching (explain why)

---

# PART 3: VISUAL SYSTEMS

---

## Decision 13: Border System

### The Rule

> **Borders must use semantic border tokens, not raw colors or ad-hoc widths**

### Border Width Scale

```scss
--border-1: 1px; // Default (cards, inputs, dividers)
--border-2: 2px; // Focus/active emphasis only
```

### Border Style

> **`solid` only** — avoid `dashed`/`dotted` unless documented exception

### Semantic Border Colors

```scss
--color-border-default: var(--primitive-neutral-300); // Card/input default
--color-border-muted: var(--primitive-neutral-200); // Subtle separators
--color-border-strong: var(--primitive-neutral-400); // Dividers, tables
--color-border-focus: var(--ds-primary-green); // Focus ring / active
--color-border-danger: var(--primitive-error-500); // Validation error
--color-border-warning: var(--primitive-warning-500); // Validation warning
```

### Enforcement

```scss
// ❌ FORBIDDEN
border: 1px solid #e5e5e5;
border-color: rgba(0, 0, 0, 0.12);

// ✅ REQUIRED
border: var(--border-1) solid var(--color-border-default);
```

### Your Decision

- [ ] **APPROVED** - Implement border system (OPERATIONAL)
- [ ] **REJECTED** - Keep ad-hoc borders (explain why)

---

## Decision 14: Shadow / Elevation System

### The Rule

> **Shadows are controlled by a small elevation scale**  
> **No raw `box-shadow` values outside the token file**

### Elevation Scale (4 Levels)

```scss
--shadow-0: none; // Flat / pressed
--shadow-1: 0 1px 3px rgba(0, 0, 0, 0.08); // Cards (default)
--shadow-2: 0 4px 12px rgba(0, 0, 0, 0.12); // Hover / raised
--shadow-3: 0 8px 24px rgba(0, 0, 0, 0.16); // Modals / dropdowns
```

### Card Surface Policy: ✅ BORDERLESS (UPDATED Jan 2026)

**Why Borderless (supersedes Border-first):**

- Cleaner, more modern aesthetic per user feedback
- Subtle shadows provide sufficient depth without visual clutter
- Reduces "boxy" feel especially in dense dashboards
- Better aligns with contemporary design trends
- Keyboard focus ring provides clear boundary when needed

### Hover Policy: ✅ Policy A — Shadow Increase (APPROVED)

**Why Policy A:**

- Shadow increase reads as "this is interactive" without turning UI into sea of green borders
- Focus ring reserved for keyboard focus, not casual hover

### Final Card Rules (UPDATED)

| State              | Styling                                                     |
| ------------------ | ----------------------------------------------------------- |
| **Default**        | `border: none` + `box-shadow: var(--shadow-sm)`             |
| **Hover**          | `box-shadow: var(--shadow-md)`                              |
| **Focus-visible**  | Focus ring tokens (Decision 12/18), NOT border highlighting |
| **Active/Pressed** | `box-shadow: var(--shadow-sm)` + optional `translateY(1px)` |

### Your Decision

- [x] **APPROVED** - ~~Border-first~~ → BORDERLESS + Hover Policy A ⭐ CORE (Updated Jan 8, 2026)

---

## Decision 15: Dark Mode / Theming Readiness

### The Rule

> **Tokens must support theming via attribute/class switch**

### Implementation (Even Without Dark Mode Now)

```scss
:root {
  /* Light theme (default) */
  --color-surface-primary: #ffffff;
  --color-text-primary: #1a1a1a;
}

[data-theme="dark"] {
  /* Dark theme (future) */
  --color-surface-primary: #1a1a1a;
  --color-text-primary: #ffffff;
}
```

### Minimum Requirement

> Tokens must be semantic enough to support a future theme without file duplication

### Your Decision

- [ ] **APPROVED** - Design tokens for theme-readiness (OPERATIONAL)
- [ ] **REJECTED** - Not planning themes (explain why)

---

## Decision 16: PrimeNG Integration Boundaries

### The Rule

> **PrimeNG styling lives in exactly two places + overrides layer exceptions**

### Allowed Locations

| File                           | Purpose                                  |
| ------------------------------ | ---------------------------------------- |
| `primeng/token-mapping.scss`   | Map PrimeNG vars → your tokens           |
| `primeng/brand-overrides.scss` | Minimal structural adjustments           |
| `@layer overrides`             | Documented exceptions only (Decision 10) |

### Forbidden

```scss
// ❌ Feature SCSS must NOT style .p-* classes directly
// dashboard.component.scss
.p-button {
  background: red; // NO!
}
```

### Exception Rule

> Any PrimeNG styling outside these two files must be in `@layer overrides` with the exception template (Decision 10).

### Your Decision

- [ ] **APPROVED** - PrimeNG in two files + exceptions ⭐ CORE
- [ ] **REJECTED** - Allow PrimeNG styling anywhere (explain why)

---

## Decision 17: File/Folder Structure

### Target Structure

```
assets/styles/
├── tokens/
│   └── design-system-tokens.scss   # Single source of truth
├── primeng/
│   ├── token-mapping.scss          # PrimeNG → token mapping
│   └── brand-overrides.scss        # Minimal structural fixes
├── primitives/
│   ├── cards.scss                  # Standard card recipes
│   ├── typography.scss             # Typography utilities
│   ├── badges.scss                 # Badge/tag styles
│   └── layout.scss                 # Grid, spacing utilities
├── features/
│   └── (feature-specific imports)  # If needed
└── overrides/
    └── temporary.scss              # Documented exceptions only
```

### Migration Path

1. Create target folders now
2. New files go in correct location
3. Migrate existing files incrementally (Decision 11)

### Your Decision

- [ ] **APPROVED** - Adopt target folder structure (OPERATIONAL)
- [ ] **REJECTED** - Keep current structure (explain why)

---

# PART 4: INTERACTION & MOTION

---

## Decision 18: Interaction State Model

### The Problem

Inconsistent states: hover works but focus doesn't, active states missing.

### The Rule

> **All interactive components must support: default / hover / active / focus-visible / disabled**

### State Requirements

| State            | Required | Notes                         |
| ---------------- | -------- | ----------------------------- |
| `default`        | ✅       | Base appearance               |
| `:hover`         | ✅       | Mouse over                    |
| `:active`        | ✅       | Click/tap pressed             |
| `:focus-visible` | ✅       | Keyboard focus (NOT `:focus`) |
| `:disabled`      | ✅       | Inactive state                |

### Rules

1. **`:focus` is NOT used** — only `:focus-visible`
2. **Focus ring is consistent** across all components
3. **Active state never relies only on color** — must include shadow/border/transform change

### Implementation

```scss
.interactive-element {
  // Default
  background: var(--color-surface-primary);
  border: var(--border-1) solid var(--color-border-default);

  &:hover {
    border-color: var(--color-border-focus);
  }

  &:active {
    transform: translateY(1px);
    box-shadow: var(--shadow-0);
  }

  &:focus-visible {
    outline: var(--focus-ring-width) solid var(--color-focus-ring);
    outline-offset: var(--focus-ring-offset);
  }

  &:disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}
```

### Your Decision

- [ ] **APPROVED** - Implement interaction state model ⭐ CORE
- [ ] **REJECTED** - Keep inconsistent states (explain why)

---

## Decision 19: Motion Tokens

### The Problem

Different transitions everywhere. No consistency in timing or easing.

### The Rule

> **All transitions must use `--motion-*` tokens**

### Motion Scale

```scss
--motion-fast: 120ms; // Micro-interactions (hover, focus)
--motion-base: 200ms; // Standard transitions
--motion-slow: 320ms; // Larger animations (modals, drawers)
--ease-standard: cubic-bezier(0.4, 0, 0.2, 1); // Material standard
--ease-decelerate: cubic-bezier(0, 0, 0.2, 1); // Enter animations
--ease-accelerate: cubic-bezier(0.4, 0, 1, 1); // Exit animations
```

### Rules

1. ❌ **No `transition: all`** — only transition what changes
2. ✅ **Explicit properties only**

### Enforcement

```scss
// ❌ FORBIDDEN
transition: all 0.3s ease;
transition: 200ms;

// ✅ REQUIRED
transition:
  background-color var(--motion-fast) var(--ease-standard),
  border-color var(--motion-fast) var(--ease-standard);
```

### Your Decision

- [ ] **APPROVED** - Implement motion tokens ⭐ CORE
- [ ] **REJECTED** - Keep ad-hoc transitions (explain why)

---

## Decision 20: Z-Index Scale

### The Problem

Z-index chaos: `z-index: 9999` scattered everywhere.

### The Rule

> **Z-index values must use `--z-*` tokens only**

### Z-Index Scale

```scss
--z-base: 0;
--z-dropdown: 100;
--z-sticky: 200;
--z-drawer: 300;
--z-modal-backdrop: 400;
--z-modal: 500;
--z-toast: 600;
--z-tooltip: 700;
```

### Enforcement

```scss
// ❌ FORBIDDEN
z-index: 9999;
z-index: 1000;

// ✅ REQUIRED
z-index: var(--z-modal);
z-index: var(--z-tooltip);
```

### Your Decision

- [ ] **APPROVED** - Implement z-index scale ⭐ CORE
- [ ] **REJECTED** - Keep raw z-index values (explain why)

---

# PART 5: LAYOUT & STRUCTURE

---

## Decision 21: Layout Constraints

### The Rule

> **All layouts use a single grid/gap system and standard container widths**

### Gap Tokens (Tied to Spacing Scale)

```scss
// Use --space-* for gaps
gap: var(--space-4); // 16px - default grid gap
gap: var(--space-6); // 24px - section gap
```

### Container Max Widths

```scss
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-max: 1440px; // App maximum
```

### Page Padding (Responsive)

```scss
--page-padding-mobile: var(--space-4); // 16px
--page-padding-tablet: var(--space-6); // 24px
--page-padding-desktop: var(--space-8); // 32px
```

### Bento Grid (Dashboard/Analytics Only)

```scss
// 12-column grid (desktop), 6 (tablet), 1 (mobile)
.layout-bento {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-4);
}

// Module types
.bento-item--metric {
  /* 3 cols */
}
.bento-item--chart {
  /* 6 cols */
}
.bento-item--list {
  /* 4 cols */
}
```

### Your Decision

- [ ] **APPROVED** - Implement layout constraints (OPERATIONAL)
- [ ] **REJECTED** - Keep ad-hoc layouts (explain why)

---

## Decision 22: No ::ng-deep Policy ✅ COMPLETE

### Status: FULLY REMOVED (January 2026)

All 84 instances of `::ng-deep` have been removed from the codebase.

### The Problem (Historical)

`::ng-deep` was the fastest way to reintroduce global chaos and is deprecated by Angular.

### The Rule

> **`::ng-deep` is fully removed from the codebase**

### Migration Strategies Used

1. **Wrapper components (e.g., modals):** Use `ViewEncapsulation.None` with scoped selectors
2. **Global stylesheets:** Remove `::ng-deep` (already global)
3. **Component SCSS:** Use CSS custom properties or class-based selectors

### Implementation Examples

```scss
// ❌ OLD APPROACH (removed)
:host ::ng-deep .p-datatable {
  background: red;
}

// ✅ NEW APPROACH 1: ViewEncapsulation.None with scoped selector
@component ({
  encapsulation: ViewEncapsulation.None,
  styles: [`
    app-my-component .p-datatable {
      background: var(--surface-secondary);
    }
  `]
})

// ✅ NEW APPROACH 2: CSS custom properties (preferred)
:host {
  --p-datatable-background: var(--surface-secondary);
}

// ✅ NEW APPROACH 3: Global stylesheet (for overrides)
.my-feature .p-datatable {
  background: var(--surface-secondary);
}
```

### Decision Status

- [x] **APPROVED** - `::ng-deep` fully removed from codebase ⭐ COMPLETE

---

# PART 6: UI PRIMITIVES COVERAGE

> These decisions prevent 80% of future ad-hoc CSS.

---

## Decision 23: Form System Standards

### The Problem

Forms are where users spend time and where inconsistency is most obvious.

### The Rule

> **All form inputs follow a single, standardized pattern**

### Form Input Sizing

| Size                 | Height | Padding     | Use Case                |
| -------------------- | ------ | ----------- | ----------------------- |
| **Small**            | 32px   | `--space-2` | Compact tables, filters |
| **Medium (default)** | 44px   | `--space-3` | Standard forms          |
| **Large**            | 56px   | `--space-4` | Hero inputs, onboarding |

### Label & Help Text Pattern

```html
<div class="form-field">
  <label for="email" class="form-label">
    Email address
    <span class="form-required">*</span>
  </label>
  <input pInputText id="email" class="form-input" />
  <small class="form-help">We'll never share your email</small>
  <small class="form-error" *ngIf="hasError">Invalid email format</small>
</div>
```

### Standardized Styles

```scss
.form-field {
  margin-bottom: var(--space-5);
}

.form-label {
  display: block;
  font-size: var(--font-body-sm);
  font-weight: 500;
  margin-bottom: var(--space-2);
  color: var(--color-text-primary);
}

.form-required {
  color: var(--color-status-error);
  margin-left: var(--space-1);
}

.form-help {
  display: block;
  font-size: var(--font-body-xs);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

.form-error {
  display: block;
  font-size: var(--font-body-xs);
  color: var(--color-status-error);
  margin-top: var(--space-1);
}
```

### Components Covered

- InputText, Textarea, InputNumber
- Select/Dropdown, MultiSelect
- DatePicker, Calendar
- Checkbox, RadioButton
- ToggleSwitch (see Decision 9B)

### Your Decision

- [ ] **APPROVED** - Implement form system standards ⭐ CORE
- [ ] **REJECTED** - Keep inconsistent forms (explain why)

---

## Decision 24: Table & Data Density Standards

### The Problem

Tables accumulate the most hacks and overrides. Row heights, hover states, and pagination vary wildly.

### The Rule

> **Tables follow two variants only: default and compact**

### Table Variants

| Variant     | Row Height | Padding                 | Use Case               |
| ----------- | ---------- | ----------------------- | ---------------------- |
| **Default** | 52px       | `--space-4`             | Standard data tables   |
| **Compact** | 40px       | `--space-2` `--space-3` | Dense data, dashboards |

### Required Table States

| State            | Styling                                       |
| ---------------- | --------------------------------------------- |
| Header           | `--color-surface-secondary`, bold text        |
| Row hover        | `--color-surface-hover`                       |
| Row selected     | `--color-primary-subtle` + border-left accent |
| Row disabled     | 50% opacity                                   |
| Zebra (optional) | Alternate `--color-surface-secondary`         |

### Empty State

```html
<ng-template pTemplate="emptymessage">
  <tr>
    <td [attr.colspan]="columns.length">
      <app-empty-state
        icon="pi pi-inbox"
        title="No data found"
        message="Try adjusting your filters"
        [action]="{ label: 'Clear filters', handler: clearFilters }"
      />
    </td>
  </tr>
</ng-template>
```

### Pagination

- Default page size: 10
- Options: [5, 10, 25, 50]
- Show "Showing X to Y of Z entries"

### Your Decision

- [ ] **APPROVED** - Implement table standards ⭐ CORE
- [ ] **REJECTED** - Keep inconsistent tables (explain why)

---

## Decision 25: Dialog & Drawer Standards

### The Problem

Modal inconsistency feels sloppy immediately — padding, button alignment, close behavior vary.

### The Rule

> **Dialogs and drawers follow strict sizing and spacing rules**

### Dialog Sizes

| Size                 | Max Width | Use Case                    |
| -------------------- | --------- | --------------------------- |
| **Small**            | 400px     | Confirmations, simple forms |
| **Medium (default)** | 560px     | Standard forms, details     |
| **Large**            | 800px     | Complex forms, tables       |
| **Full**             | 90vw      | Large data, multi-step      |

### Dialog Anatomy

```
┌─────────────────────────────────────────────────┐
│  Header (--space-5 padding)            [X]      │  ← Close button always right
├─────────────────────────────────────────────────┤
│                                                 │
│  Content (--space-5 padding)                    │
│  (scrollable if needed)                         │
│                                                 │
├─────────────────────────────────────────────────┤
│  Footer (--space-4 --space-5)    [Cancel] [OK]  │  ← Primary right, secondary left
└─────────────────────────────────────────────────┘
```

### Footer Button Order

- **Cancel/Secondary:** Left side
- **Primary action:** Right side (always last)
- Destructive actions: Use `severity="danger"`

### Scroll Behavior

- Content scrolls, header/footer fixed
- Max height: `80vh`

### Drawer Rules

- Always slide from right (or bottom on mobile)
- Width: 320px (narrow), 480px (wide), 100% (mobile)
- Same header/footer pattern as dialogs

### Your Decision

- [ ] **APPROVED** - Implement dialog/drawer standards ⭐ CORE
- [ ] **REJECTED** - Keep inconsistent dialogs (explain why)

---

## Decision 26: Feedback System (Toast/Message/Confirm)

### The Problem

Feedback messages use inconsistent severity colors, icons, placement, and duration.

### The Rule

> **All feedback uses consistent severity mapping and placement**

### Severity Mapping

| Severity    | Background                      | Icon                      | Duration        |
| ----------- | ------------------------------- | ------------------------- | --------------- |
| **Success** | `--color-status-success-subtle` | `pi-check-circle`         | 3s auto-dismiss |
| **Info**    | `--color-status-info-subtle`    | `pi-info-circle`          | 5s auto-dismiss |
| **Warning** | `--color-status-warning-subtle` | `pi-exclamation-triangle` | Sticky (manual) |
| **Error**   | `--color-status-error-subtle`   | `pi-times-circle`         | Sticky (manual) |

### Toast Placement

- **Default:** Top-right
- **Mobile:** Top-center, full-width

### Confirmation Dialog Pattern

```html
<p-confirmDialog>
  <ng-template pTemplate="header">
    <span class="confirm-icon confirm-icon--{{ severity }}">
      <i class="pi pi-{{ icon }}"></i>
    </span>
    <span class="confirm-title">{{ title }}</span>
  </ng-template>
</p-confirmDialog>
```

### Confirm Button Order

- Destructive: `[Cancel] [Delete]` — Delete is danger, right side
- Non-destructive: `[Cancel] [Confirm]` — Confirm is primary, right side

### Your Decision

- [ ] **APPROVED** - Implement feedback standards ⭐ CORE
- [ ] **REJECTED** - Keep inconsistent feedback (explain why)

---

## Decision 27: Empty, Error & Loading States

### The Problem

Empty/error/loading states cause the most style drift. Each feature invents its own.

### The Rule

> **All empty, error, and loading states use standardized components**

### Empty State Pattern

```html
<app-empty-state
  icon="pi pi-inbox"
  title="No exercises found"
  message="Try adjusting your search or filters"
  [action]="{ label: 'Clear filters', handler: clearFilters }"
/>
```

### Empty State Variants

| Variant        | Icon          | When to Use         |
| -------------- | ------------- | ------------------- |
| **No data**    | `pi-inbox`    | Initial empty state |
| **No results** | `pi-search`   | Filtered to nothing |
| **No access**  | `pi-lock`     | Permission denied   |
| **Offline**    | `pi-wifi-off` | No connection       |

### Error State Pattern

```html
<app-error-state
  title="Something went wrong"
  message="We couldn't load this data"
  [retry]="{ label: 'Try again', handler: reload }"
/>
```

### Loading Patterns

| Pattern          | When to Use                                    |
| ---------------- | ---------------------------------------------- |
| **Skeleton**     | Initial page/card load (default)               |
| **Spinner**      | Button actions, inline updates                 |
| **Progress bar** | Long processes with progress ("Uploading 60%") |
| **Top bar**      | Global page transitions (optional)             |

### Loading Rules

- **Inline loading:** Spinner or skeleton (default)
- **Long processes:** Progress bar with percentage
- **Global loading:** Top-of-page progress bar

### Skeleton Structure

```html
<!-- Card skeleton -->
<div class="skeleton-card">
  <p-skeleton width="100%" height="120px" />
  <p-skeleton width="60%" height="1.5rem" styleClass="mt-3" />
  <p-skeleton width="80%" height="1rem" styleClass="mt-2" />
</div>
```

### Your Decision

- [ ] **APPROVED** - Implement state standards ⭐ CORE
- [ ] **REJECTED** - Keep inconsistent states (explain why)

---

## Decision 28: Page Header Pattern

### The Problem

Page headers vary: title placement, action buttons, breadcrumbs inconsistent.

### The Rule

> **All pages use a standardized header component**

### Page Header Anatomy

```
┌─────────────────────────────────────────────────────────────┐
│  Breadcrumbs: Home > Training > Schedule                     │
├─────────────────────────────────────────────────────────────┤
│  Training Schedule                    [Filter] [+ Add New]   │
│  Manage your weekly training plan              ↑ primary CTA │
└─────────────────────────────────────────────────────────────┘
```

### Component Structure

```html
<app-page-header
  title="Training Schedule"
  subtitle="Manage your weekly training plan"
  [breadcrumbs]="[
    { label: 'Home', route: '/' },
    { label: 'Training', route: '/training' },
    { label: 'Schedule' }
  ]"
>
  <ng-container actions>
    <p-button label="Filter" [outlined]="true" icon="pi pi-filter" />
    <p-button label="Add New" icon="pi pi-plus" />
  </ng-container>
</app-page-header>
```

### Spacing

- Breadcrumbs: `--space-2` margin-bottom
- Title: `--font-heading-xl`
- Subtitle: `--font-body-md`, `--color-text-muted`
- Actions: Right-aligned, `--space-3` gap

### Your Decision

- [ ] **APPROVED** - Implement page header standard ⭐ CORE
- [ ] **REJECTED** - Keep inconsistent headers (explain why)

---

## Decision 29: Typography System (Poppins) — UNIFIED

**Status:** ✅ **UPDATED January 4, 2026**

### Current State

The typography system has been **unified** with predictable hierarchy across all components.

### Unified Typography Tokens (SINGLE SOURCE OF TRUTH)

**Source file:** `angular/src/scss/tokens/design-system-tokens.scss`  
**Implementation:** `angular/src/scss/utilities/typography-system.scss`

```scss
/* Font Families */
--font-family-sans:
  "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
--font-family-display: "Poppins", sans-serif;
--font-family-mono:
  "JetBrains Mono", "SF Mono", "Monaco", "Inconsolata", monospace;

/* Font Weights */
--font-weight-light: 300;
--font-weight-regular: 400;
--font-weight-normal: 400; /* Alias */
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Unified Heading Tokens (LOCKED)

```scss
/* H1: Page titles, hero greetings */
--font-h1-size: 2rem; /* 32px */
--font-h1-line-height: 1.2;
--font-h1-weight: 700; /* bold */

/* H2: Section headers, dialog titles */
--font-h2-size: 1.5rem; /* 24px */
--font-h2-line-height: 1.25;
--font-h2-weight: 600; /* semibold */

/* H3: Card titles, subsections */
--font-h3-size: 1.25rem; /* 20px */
--font-h3-line-height: 1.3;
--font-h3-weight: 400; /* regular (600 for card headers) */

/* H4: Small headings, group labels */
--font-h4-size: 1rem; /* 16px */
--font-h4-line-height: 1.35;
--font-h4-weight: 300; /* light */
```

### Unified Body & Text Tokens (LOCKED)

```scss
/* Body: Regular text, paragraphs */
--font-body-size: 1rem; /* 16px */
--font-body-line-height: 1.5;
--font-body-weight: 400; /* regular */

/* Body-sm: Helper text, descriptions */
--font-body-sm-size: 0.875rem; /* 14px */
--font-body-sm-line-height: 1.45;
--font-body-sm-weight: 400; /* regular */

/* Label: Form labels, table headers */
--font-label-size: 0.875rem; /* 14px */
--font-label-line-height: 1.2;
--font-label-weight: 600; /* semibold */

/* Caption: Timestamps, smallest text */
--font-caption-size: 0.75rem; /* 12px */
--font-caption-line-height: 1.3;
--font-caption-weight: 400; /* regular */
```

### Typography Hierarchy (UNIFIED)

| Role        | Size | Weight         | Line-Height | Use Case                       |
| ----------- | ---- | -------------- | ----------- | ------------------------------ |
| **H1**      | 32px | 700 (bold)     | 1.2         | Page titles, hero greetings    |
| **H2**      | 24px | 600 (semibold) | 1.25        | Section headers, dialog titles |
| **H3**      | 20px | 400/600        | 1.3         | Card titles, subsections       |
| **H4**      | 16px | 300 (light)    | 1.35        | Small headings, group labels   |
| **Body**    | 16px | 400 (regular)  | 1.5         | Regular text, paragraphs       |
| **Body-sm** | 14px | 400 (regular)  | 1.45        | Helper text, descriptions      |
| **Label**   | 14px | 600 (semibold) | 1.2         | Form labels, table headers     |
| **Caption** | 12px | 400 (regular)  | 1.3         | Timestamps, smallest text      |

### PrimeNG Component Typography Mapping (MANDATORY)

| Component                       | Token   | Specification               |
| ------------------------------- | ------- | --------------------------- |
| `p-dialog .p-dialog-title`      | H2      | 24px/600/1.25               |
| `p-card .p-card-title`          | H3      | 20px/600/1.3                |
| `p-card .p-card-subtitle`       | Body-sm | 14px/400/1.45               |
| `p-tabview .p-tabview-nav-link` | Body-sm | 14px/600/1.45               |
| `p-tabs .p-tab`                 | Body-sm | 14px/600/1.45               |
| `p-datatable thead th`          | Label   | 14px/600/1.2 + uppercase    |
| `p-datatable tbody td`          | Body    | 16px/400/1.5                |
| `p-panel .p-panel-header`       | H3      | 20px/600/1.3                |
| `p-accordion header`            | H3      | 20px/600/1.3                |
| Form labels                     | Label   | 14px/600/1.2                |
| Helper/description text         | Body-sm | 14px/400/1.45               |
| Error text                      | Body-sm | 14px/400/1.45 + error color |

### Typography CSS Classes (Use These)

```scss
/* Headings */
.ff-h1, .page-title, .hero-title   /* 32px/700/1.2 */
.ff-h2, .section-title, .dialog-title /* 24px/600/1.25 */
.ff-h3, .card-title, .subsection-title /* 20px/600/1.3 */
.ff-h4, .label-title, .group-title /* 16px/300/1.35 */

/* Body */
.ff-body, .body-text, .text-base   /* 16px/400/1.5 */
.ff-body-sm, .body-sm, .description, .helper-text /* 14px/400/1.45 */

/* Label & Caption */
.ff-label, .form-label, .table-header /* 14px/600/1.2 */
.ff-caption, .caption, .hint, .meta, .timestamp /* 12px/400/1.3 */

/* Semantic */
.form-label          /* 14px medium */
.helper-text         /* 12px muted */
.error-text          /* 12px error color */

/* Metrics */
.stat-value-xl       /* 48px bold */
.stat-value          /* 32px bold */
.stat-value-sm       /* 24px semibold */
.stat-label          /* 14px uppercase */
```

### The Rule

> **All font declarations must use typography tokens — no hardcoded Poppins**

### Current Violations (168 instances)

```scss
// ❌ FORBIDDEN (found 168 times across codebase)
font-family: "Poppins", sans-serif;
font-family: "Poppins", system-ui, sans-serif;

// ✅ REQUIRED
font-family: var(--font-family-sans);
font-family: var(--font-family-display);
font-family: inherit; // For components inheriting from parent
```

### Migration Required

| File                                | Hardcoded Instances |
| ----------------------------------- | ------------------- |
| `settings.component.scss`           | 15                  |
| `primeng-theme.scss`                | 6                   |
| `tournament-nutrition.component.ts` | 15                  |
| `profile.component.ts`              | 8                   |
| `ai-coach-chat.component.ts`        | 4                   |
| Various others                      | ~114                |

### Responsive Typography

Typography already has responsive breakpoints defined:

- **Desktop:** Full sizes
- **Tablet (≤768px):** One step down
- **Mobile (≤480px):** Two steps down (headings only)

### Poppins Weights Loaded

```html
<!-- From index.html -->
<link
  href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap"
/>
```

| Weight | Token                    | Use Case                         |
| ------ | ------------------------ | -------------------------------- |
| 300    | (not used)               | Consider removing to reduce load |
| 400    | `--font-weight-normal`   | Body text                        |
| 500    | `--font-weight-medium`   | Labels, emphasized body          |
| 600    | `--font-weight-semibold` | Headings, buttons                |
| 700    | `--font-weight-bold`     | Page titles, metrics             |
| 800    | (rarely used)            | Consider removing                |

### Optimization Recommendation

Remove unused weights to improve performance:

```html
<!-- Optimized -->
<link
  href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
/>
```

### Your Decision

- [ ] **APPROVED** - Enforce typography tokens, migrate 168 violations ⭐ CORE
- [ ] **REJECTED** - Allow hardcoded font-family (explain why)

---

# PART 7: UX BEHAVIOR STANDARDS

> These decisions govern _behavior_, not just appearance. High UX impact, low effort.

---

## Decision 30: Icon System Rules

### The Problem

Icons get inconsistent fast — sizes vary, stroke weights clash, color meaning drifts.

### The Rule

> **One icon library (PrimeIcons), three sizes only, semantic colors**

### Icon Library

- **Primary:** PrimeIcons only
- **Gap handling:** See Decision 62 (closest icon + label, or custom SVG pack)
- **Delivery method:** See Decision 63 (font + controlled SVG wrapper)
- **Exception:** Custom icons require documented exception (Decision 10)

### Icon Sizes (Only These 3)

| Size     | Token       | Use Case                       |
| -------- | ----------- | ------------------------------ |
| **16px** | `--icon-sm` | Inline with text, dense tables |
| **20px** | `--icon-md` | Default, buttons, form inputs  |
| **24px** | `--icon-lg` | Standalone, cards, navigation  |

```scss
--icon-sm: 1rem; /* 16px */
--icon-md: 1.25rem; /* 20px */
--icon-lg: 1.5rem; /* 24px */
```

### Icon Colors (Semantic Only)

| Context         | Color                                      |
| --------------- | ------------------------------------------ |
| **Default**     | `--color-text-muted`                       |
| **Interactive** | `--color-text-primary` on hover            |
| **Success**     | `--color-status-success` (status only)     |
| **Warning**     | `--color-status-warning` (status only)     |
| **Error**       | `--color-status-error` (status only)       |
| **On Primary**  | `--color-text-on-primary` (white on green) |

### Icon-Only Buttons

> **Must have `aria-label` AND `pTooltip`**

```html
<!-- ✅ REQUIRED for icon-only buttons -->
<p-button
  icon="pi pi-trash"
  [rounded]="true"
  [text]="true"
  aria-label="Delete item"
  pTooltip="Delete"
/>

<!-- ❌ FORBIDDEN -->
<p-button icon="pi pi-trash" />
```

### Your Decision

- [ ] **APPROVED** - Implement icon system rules ⭐ CORE
- [ ] **REJECTED** - Allow inconsistent icons (explain why)

---

## Decision 31: Tooltip & Helper Text Policy

### Current State

**137 `pTooltip` usages** — this is already a system, but needs rules.

### The Rule

> **Tooltips explain, they don't label. Never duplicate visible text.**

### Tooltip Purpose

| Use Case                          | Use Tooltip?        |
| --------------------------------- | ------------------- |
| Icon-only button needs label      | ✅ Yes              |
| Truncated text needs full version | ✅ Yes              |
| Complex action needs explanation  | ✅ Yes              |
| Field has helper text visible     | ❌ No (duplicates)  |
| Content is self-explanatory       | ❌ No (unnecessary) |

### Tooltip Tokens

```scss
--tooltip-max-width: 240px;
--tooltip-padding: var(--space-2) var(--space-3);
--tooltip-font-size: var(--font-body-xs);
--tooltip-background: var(--color-surface-inverse);
--tooltip-color: var(--color-text-on-inverse);
--tooltip-radius: var(--radius-md);
--tooltip-delay: 300ms;
```

### Mobile Behavior

- Touch devices: Show on long-press (500ms)
- Dismiss on tap outside
- Never rely on tooltip for critical information on mobile

### Helper Text vs Tooltip

| Information Type       | Use                   |
| ---------------------- | --------------------- |
| **Always needed**      | Helper text (visible) |
| **Nice to know**       | Tooltip (on demand)   |
| **Required indicator** | Visible asterisk (\*) |

### Your Decision

- [ ] **APPROVED** - Implement tooltip policy ⭐ CORE
- [ ] **REJECTED** - Allow inconsistent tooltips (explain why)

---

## Decision 32: Validation & Error Behavior

### The Problem

Apps fail UX when validation is inconsistent (spammy errors, unclear timing).

### The Rule

> **Single validation timing + single error display rule**

### Validation Timing Options (Pick ONE App-Wide)

**Option A (Recommended): Validate on blur + submit**

- Show errors after field is touched (blur)
- On submit, show all invalid fields
- Re-validate on change after error is shown (clear when fixed)

**Option B: Validate only on submit**

- Quiet UI while typing
- Errors appear only when user submits

### Error Display Rules

1. **One message per field** (first failing rule only)
2. Errors appear **below the field**
3. **Plain language** ("Required", "Must be a number", "Invalid email")
4. Use `--color-status-error` text + `--font-body-xs`
5. Field border becomes `--color-border-danger`

### Error Message Format

```
❌ BAD:  "Invalid input"
❌ BAD:  "Email must match pattern ^[a-z]+@[a-z]+\.[a-z]+$"
✅ GOOD: "Enter a valid email address"
✅ GOOD: "Password must be at least 8 characters"
```

### Required Field Pattern

```html
<label>
  Email address
  <span class="form-required" aria-hidden="true">*</span>
</label>
```

### Your Decision

- [ ] **Option A** - Blur + submit validation ⭐ CORE (Recommended)
- [ ] **Option B** - Submit only validation ⭐ CORE

---

## Decision 33: Card Information Hierarchy (OPERATIONAL)

### The Problem

Cards become inconsistent: headers, actions, padding, metric layouts.

### The Rule

> **Cards follow a standard anatomy and action limit**

### Card Header Pattern

```
┌─────────────────────────────────────────────────┐
│  [Icon] Title                    [Action1] [⋮]  │
│         Subtitle (optional)                     │
├─────────────────────────────────────────────────┤
│  Content                                        │
└─────────────────────────────────────────────────┘
```

### Header Rules

| Element       | Position         | Required        |
| ------------- | ---------------- | --------------- |
| Icon          | Left             | Optional        |
| Title         | Left, after icon | ✅ Required     |
| Subtitle      | Below title      | Optional        |
| Actions       | Right            | Optional        |
| Overflow menu | Right, last      | When >2 actions |

### Action Limits

| Location    | Max Actions | Overflow   |
| ----------- | ----------- | ---------- |
| Card header | 2           | Menu (`⋮`) |
| Card footer | 2           | Menu       |
| Table row   | 3           | Menu       |

### Card Padding Variants

```scss
--card-padding-default: var(--space-5); /* 20px */
--card-padding-compact: var(--space-4); /* 16px */
```

### Metric Card Format

```
┌─────────────────────┐
│  85%                │  ← Value (largest, bold)
│  Completion Rate    │  ← Label (small, muted)
│  ▲ +12%             │  ← Delta (optional, colored)
└─────────────────────┘
```

Order: **Value → Label → Delta**

### Your Decision

- [ ] **APPROVED** - Implement card hierarchy rules ⭐ CORE
- [ ] **REJECTED** - Allow inconsistent cards (explain why)

---

## Decision 34: Breadcrumb Rules (OPERATIONAL)

### The Problem

Breadcrumbs are often noisy or inconsistent.

### The Rule

> **Breadcrumbs appear only when they add orientation**

### When to Show Breadcrumbs

| Page Depth    | Show Breadcrumbs? |
| ------------- | ----------------- |
| 1 (top-level) | ❌ No             |
| 2+ (nested)   | ✅ Yes            |

### Breadcrumb Format

```
Home > Training > Schedule
      └─ links ─┘   └─ text (current page)
```

### Collapse Rules

| Crumb Count | Display                  |
| ----------- | ------------------------ |
| ≤ 4         | Show all                 |
| > 4         | First + `...` + last two |

Example: `Home > ... > Training > Schedule`

### Accessibility

- Use `<nav aria-label="Breadcrumb">`
- Current page: `aria-current="page"`

### Your Decision

- [ ] **APPROVED** - Implement breadcrumb rules (OPERATIONAL)
- [ ] **REJECTED** - Breadcrumbs ad-hoc (explain why)

---

## Decision 35: Responsive Breakpoints & Density

### The Problem

Without locked breakpoints, every feature invents its own responsive logic.

### The Rule

> **One breakpoint system + one density shift rule**

### Breakpoint Tokens

```scss
--bp-mobile: 480px;
--bp-tablet: 768px;
--bp-laptop: 1024px;
--bp-desktop: 1280px;
```

### Layout Behavior by Breakpoint

| Breakpoint | Grid Columns | Bento Spans | Table                       |
| ---------- | ------------ | ----------- | --------------------------- |
| ≤480px     | 1            | 1 col       | Compact + horizontal scroll |
| ≤768px     | 6            | 3 or 6      | Compact                     |
| ≤1024px    | 12           | 4 or 6      | Default                     |
| >1024px    | 12           | 3, 4, or 6  | Default                     |

### Component Density Rules

| Component    | Mobile             | Desktop        |
| ------------ | ------------------ | -------------- |
| Table rows   | Compact (40px)     | Default (52px) |
| Card padding | `--space-4`        | `--space-5`    |
| Button size  | Small              | Medium         |
| Sidebar      | Hidden (hamburger) | Visible        |

### Bento Grid Collapse

```scss
// Mobile (≤480px): 1 column, stacked
// Tablet (≤768px): 6 columns
// Desktop (>768px): 12 columns
```

### Your Decision

- [ ] **APPROVED** - Implement responsive rules ⭐ CORE
- [ ] **REJECTED** - Keep inconsistent responsive behavior (explain why)

---

## Decision 36: Keyboard Accessibility Baseline

### The Problem

Focus rings exist, but keyboard behavior still breaks in dialogs/overlays.

### The Rule

> **Keyboard behavior is standardized across dialogs and overlays**

### Required Behaviors

- Dialog open: focus goes to title (if no inputs) or first input
- ESC closes dialogs unless destructive confirmation is required
- Focus trap inside dialogs
- Dropdowns/select: arrow keys navigate, Enter selects, Esc closes
- Tooltip never steals focus

### Dialog Keyboard Behavior

| Key           | Behavior                                    |
| ------------- | ------------------------------------------- |
| **Tab**       | Cycles through focusable elements in dialog |
| **Shift+Tab** | Reverse cycle                               |
| **Escape**    | Closes dialog (unless destructive confirm)  |
| **Enter**     | Submits form / activates primary button     |

### Focus Management

| Event          | Focus Moves To                   |
| -------------- | -------------------------------- |
| Dialog opens   | First focusable element OR title |
| Dialog closes  | Element that triggered open      |
| Toast appears  | Does NOT steal focus             |
| Dropdown opens | First option                     |

### Tooltip Behavior

- ❌ Tooltips do NOT steal focus
- ✅ Show on focus for keyboard users
- ✅ Dismiss on blur

### Your Decision

- [ ] **APPROVED** - Implement keyboard rules ⭐ CORE
- [ ] **REJECTED** - Keep inconsistent keyboard behavior (explain why)

---

## Decision 37: Microcopy Rules (OPERATIONAL)

### The Problem

UI voice becomes inconsistent (button labels, confirmations, errors).

### The Rule

> **UI copy uses consistent verbs, clear consequences, and specific errors**

### Button Label Rules

| Action Type | Label Pattern                   | Examples                       |
| ----------- | ------------------------------- | ------------------------------ |
| **Create**  | "Create [noun]" or "Add [noun]" | "Create Session", "Add Player" |
| **Save**    | "Save" or "Save [noun]"         | "Save", "Save Changes"         |
| **Update**  | "Update" or "Save"              | "Update Profile"               |
| **Delete**  | "Delete" or "Remove"            | "Delete", "Remove Player"      |
| **Submit**  | "Submit" or specific action     | "Submit Feedback"              |
| **Cancel**  | "Cancel"                        | "Cancel"                       |
| **Close**   | "Close" or "Done"               | "Close", "Done"                |

### Forbidden Button Labels

```
❌ "OK"           → ✅ "Confirm" or specific action
❌ "Yes"          → ✅ "Delete" / "Confirm" / specific
❌ "No"           → ✅ "Cancel"
❌ "Click here"   → ✅ Describe the action
```

### Confirm Dialog Pattern

```
┌─────────────────────────────────────────────┐
│  Delete workout?                            │  ← Title IS the action
├─────────────────────────────────────────────┤
│  This workout and all associated data       │
│  will be permanently removed.               │  ← Consequence
├─────────────────────────────────────────────┤
│                    [Cancel]  [Delete]       │  ← Verb buttons
└─────────────────────────────────────────────┘
```

### Error Message Rules

```
❌ "Something went wrong"              → ✅ + "Try again" button
❌ "Error"                             → ✅ "Could not save. Please try again."
❌ "Invalid"                           → ✅ "Enter a valid email address"
```

### Your Decision

- [ ] **APPROVED** - Implement microcopy rules (OPERATIONAL)
- [ ] **REJECTED** - Copy ad-hoc (explain why)

---

## Decision 38: Destructive Action Safety

### The Problem

Delete actions cause irreversible mistakes or inconsistent confirmations.

### The Rule

> **Destructive actions follow a single safety model**

### Standards

- Destructive actions always use `severity="danger"`
- Confirmation required for ALL destructive actions
- Irreversible/high-impact actions require extra confirmation (pick one rule)

### Options (Pick ONE App-Wide)

**Option A (Recommended): Confirm dialog only**

- Standard confirm dialog with "Cancel / Delete"
- Danger styling on destructive button
- Works for most cases

**Option B: Extra step for high impact**

- Type "DELETE" or checkbox: "I understand this can't be undone"
- Use only for account deletion, bulk operations

### Standard Delete Confirmation

```html
<p-confirmDialog>
  <ng-template pTemplate="message">
    <p>This will permanently delete <strong>{{ itemName }}</strong>.</p>
    <p class="text-muted">This action cannot be undone.</p>
  </ng-template>
</p-confirmDialog>
```

### High-Risk Explicit Confirm (Option B only)

```html
<!-- For account deletion, bulk operations -->
<div class="explicit-confirm">
  <p>Type <strong>DELETE</strong> to confirm:</p>
  <input [(ngModel)]="confirmText" placeholder="DELETE" />
  <p-button
    label="Delete Account"
    severity="danger"
    [disabled]="confirmText !== 'DELETE'"
  />
</div>
```

### Soft Delete vs Hard Delete

| Type            | Behavior                                   | Use When                         |
| --------------- | ------------------------------------------ | -------------------------------- |
| **Soft delete** | Mark as deleted, hide from UI, recoverable | User data, content               |
| **Hard delete** | Permanent removal                          | Temp data, explicit user request |

**Default:** Soft delete with 30-day recovery window.

### Your Decision

- [ ] **Option A** - Confirm dialog only ⭐ CORE (Recommended)
- [ ] **Option B** - Extra step for high impact ⭐ CORE

---

## Decision 39: Date, Time & Number Formatting

### The Problem

Dates and numbers appear in many places; inconsistency breaks trust.

### The Rule

> **One formatting standard for dates, times, and numbers**

### Date Formats

| Context               | Format                  | Example       |
| --------------------- | ----------------------- | ------------- |
| **Display (full)**    | `DD MMM YYYY`           | `02 Jan 2026` |
| **Display (short)**   | `DD MMM`                | `02 Jan`      |
| **Input fields**      | Locale-aware DatePicker | User's locale |
| **Relative (recent)** | Time ago                | `2 hours ago` |
| **Relative (old)**    | Full date               | `02 Jan 2026` |

### Relative Time Rules

| Age        | Display         |
| ---------- | --------------- |
| < 1 minute | "Just now"      |
| < 1 hour   | "X minutes ago" |
| < 24 hours | "X hours ago"   |
| < 7 days   | "X days ago"    |
| ≥ 7 days   | Full date       |

### Number Formats

| Type              | Format                      | Example        |
| ----------------- | --------------------------- | -------------- |
| **Whole numbers** | Thousand separators         | `1,234`        |
| **Decimals**      | Max 2 places                | `12.34`        |
| **Percentages**   | No decimals (unless needed) | `85%`          |
| **Currency**      | Locale symbol + amount      | `$1,234.00`    |
| **Large numbers** | Abbreviated                 | `1.2K`, `3.4M` |

### Units Placement

```
✅ "85%" (no space)
✅ "12 kg" (space before unit)
✅ "5:30 PM" (time)
✅ "$1,234" (currency symbol before)
```

### Tokens

```scss
--date-format-full: "DD MMM YYYY";
--date-format-short: "DD MMM";
--number-decimal-places: 2;
```

### Your Decision

- [ ] **APPROVED** - Implement date/number formatting ⭐ CORE
- [ ] **REJECTED** - Allow inconsistent formats (explain why)

---

## Decision 40: Empty State Actions & First-Run Guidance

### The Rule

> **Every empty state offers a clear next step**

### Empty State Requirements

Every empty state MUST include:

1. **Icon** (contextual)
2. **Title** (what's empty)
3. **Message** (why or what to do)
4. **Action** (at least one of):
   - Primary action button ("Create first workout")
   - Guidance link ("Learn how")
   - Clear explanation if intentional

### Empty State Variants

| Type           | Icon                    | Title                | Action                      |
| -------------- | ----------------------- | -------------------- | --------------------------- |
| **No data**    | `pi-inbox`              | "No workouts yet"    | "Create Workout"            |
| **No results** | `pi-search`             | "No matches found"   | "Clear filters"             |
| **No access**  | `pi-lock`               | "Access restricted"  | "Request access" or explain |
| **Offline**    | `pi-wifi-off`           | "You're offline"     | "Retry when connected"      |
| **Error**      | `pi-exclamation-circle` | "Couldn't load data" | "Try again"                 |

### First-Run Guidance

For new users, provide contextual onboarding:

```html
<app-empty-state
  icon="pi pi-star"
  title="Welcome to Training!"
  message="Start by creating your first workout or importing from a template."
>
  <p-button label="Create Workout" icon="pi pi-plus" />
  <p-button label="Browse Templates" [outlined]="true" />
</app-empty-state>
```

### Differentiate States

| State        | Tone        | Action          |
| ------------ | ----------- | --------------- |
| "No data"    | Encouraging | Create          |
| "No results" | Helpful     | Clear filters   |
| "No access"  | Apologetic  | Request/explain |

### Your Decision

- [ ] **APPROVED** - Implement empty state rules ⭐ CORE
- [ ] **REJECTED** - Allow inconsistent empty states (explain why)

---

# PART 8: PRIMENG-SPECIFIC STANDARDS

---

## Decision 41: Overlay Components Policy

### The Rule

> **All overlays share the same z-index, shadow, radius, and behavior tokens**

### Overlay Surface Baseline

```scss
/* All overlays use these */
background: var(--color-surface-primary);
border: var(--border-1) solid var(--color-border-default);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-3);
```

### Overlay Spacing & Scroll

```scss
/* Panel padding */
--overlay-padding: var(--space-2);

/* Item padding (dropdown options, menu items) */
--overlay-item-padding: var(--space-2) var(--space-3);

/* Max height for list panels */
max-height: min(320px, 60vh);
overflow-y: auto; /* Internal scroll only — no page jump */
```

### Z-Index Scale (From Decision 20)

| Component                    | Token          | Value |
| ---------------------------- | -------------- | ----- |
| Dropdown / Menu / DatePicker | `--z-dropdown` | 100   |
| Tooltip                      | `--z-tooltip`  | 700   |
| Toast                        | `--z-toast`    | 600   |
| Dialog / Drawer              | `--z-modal`    | 500   |

### UX Rules

1. Open on click, close on outside click + Escape
2. Focus trapped in dialogs/drawers
3. Focus ring must never clip (overflow considerations)

### Your Decision

- [ ] **APPROVED** - Implement overlay standards ⭐ CORE
- [ ] **REJECTED** - Allow inconsistent overlays (explain why)

---

## Decision 42: Checkbox & Radio Standards

### The Rule

> **Checkboxes and radios follow consistent hit targets, spacing, and state rules**

### PrimeNG Checkbox Variant - MANDATORY

> **All `p-checkbox` components MUST use `variant="filled"`**

This ensures checkboxes have a clear visual indicator when checked (filled background) rather than just an outline.

```html
<!-- ✅ CORRECT: Always use variant="filled" -->
<p-checkbox
  [(ngModel)]="value"
  [binary]="true"
  variant="filled"
  inputId="myCheckbox"
></p-checkbox>

<!-- ❌ WRONG: Missing variant="filled" -->
<p-checkbox
  [(ngModel)]="value"
  [binary]="true"
  inputId="myCheckbox"
></p-checkbox>
```

### Hit Target & Spacing

```scss
/* Minimum hit target (WCAG) */
--control-hit-target: 44px;

/* Gap between control and label */
--control-label-gap: var(--space-2);

/* Stacked spacing (consistent everywhere) */
--control-stack-spacing: var(--space-2);
```

### Required States

| State         | Required      | Notes                            |
| ------------- | ------------- | -------------------------------- |
| Default       | ✅            | Unchecked appearance             |
| Hover         | ✅            | Subtle highlight                 |
| Active        | ✅            | Pressed feedback                 |
| Focus-visible | ✅            | Keyboard focus ring              |
| Disabled      | ✅            | Reduced contrast, no interaction |
| Error         | ✅            | Validation state                 |
| Indeterminate | ✅ (checkbox) | "Select all" partial state       |

### Selection Indicator Rules

- **Selected state is NEVER color-only**
- Checkmark (✓) or dot (●) is mandatory
- Plus focus ring on keyboard navigation

### Table "Select All" Pattern

```html
<p-tableHeaderCheckbox [indeterminate]="someSelected && !allSelected" />
```

### Your Decision

- [x] **APPROVED** - Implement checkbox/radio standards ⭐ CORE
- [ ] **REJECTED** - Allow inconsistent controls (explain why)

---

## Decision 43: Menu & Actions Pattern

### The Problem

Cards and tables have 3-5 inline buttons when they should use menus.

### The Rule

> **Max 2 visible actions; overflow goes to "More" menu**

### Action Patterns

| Location    | Pattern         | Visible | Overflow       |
| ----------- | --------------- | ------- | -------------- |
| Card header | Icon buttons    | 2 max   | `⋮` kebab menu |
| Table row   | Icon buttons    | 3 max   | `⋮` kebab menu |
| Page header | Regular buttons | 2 max   | Dropdown menu  |

### Menu Component Usage

| Component       | Use Case                      |
| --------------- | ----------------------------- |
| **Menu**        | General "More actions"        |
| **SplitButton** | Primary action + alternatives |
| **ContextMenu** | Right-click actions           |
| **Kebab (⋮)**   | Row/card overflow actions     |

### Standard Kebab Menu

```html
<p-button
  icon="pi pi-ellipsis-v"
  [text]="true"
  [rounded]="true"
  (click)="menu.toggle($event)"
  aria-label="More actions"
/>
<p-menu #menu [model]="menuItems" [popup]="true" />
```

### Your Decision

- [ ] **APPROVED** - Implement menu patterns ⭐ CORE
- [ ] **REJECTED** - Allow unlimited inline actions (explain why)

---

## Decision 44: Chart Styling Standards

### The Problem

19 chart usages, each potentially with different fonts, colors, and tooltip styles.

### The Rule

> **Charts follow design tokens for typography, colors, and containers**

### Chart Typography

```typescript
const chartDefaults = {
  font: {
    family: "'Poppins', sans-serif",
    size: 12, // --font-body-xs equivalent
    weight: 400,
  },
};
```

### Chart Colors

```scss
// Primary series colors (from design system)
--chart-color-1: var(--ds-primary-green);
--chart-color-2: var(--primitive-primary-400);
--chart-color-3: var(--color-status-info);
--chart-color-4: var(--color-status-warning);
--chart-color-5: var(--color-status-error);

// Grid and axis
--chart-gridline: var(--color-border-muted);
--chart-axis-text: var(--color-text-muted);
```

### Chart Tooltip

```scss
--chart-tooltip-background: var(--color-surface-inverse);
--chart-tooltip-text: var(--color-text-on-inverse);
--chart-tooltip-radius: var(--radius-md);
--chart-tooltip-padding: var(--space-2) var(--space-3);
```

### Chart Container

- Charts live inside cards with standard padding
- Legend position: Bottom (default) or Right (wide charts)
- Responsive: Reduce data points on mobile, not just size

### Your Decision

- [ ] **APPROVED** - Implement chart standards ⭐ CORE
- [ ] **REJECTED** - Allow inconsistent charts (explain why)

---

## Decision 45: Hover States Policy (App-Wide)

### The Rule

> **Hover is subtle and never required to understand meaning (touch users)**

### Global Hover Principles

1. Hover is subtle, never required to understand meaning (touch users)
2. No layout shift on hover
3. `:focus-visible` always wins over `:hover`
4. No `transition: all` (Decision 19)

### Standard Hover Behavior by Component

| Component                      | Hover Behavior                           | Notes                                      |
| ------------------------------ | ---------------------------------------- | ------------------------------------------ |
| **Cards / clickable surfaces** | `--shadow-1` → `--shadow-2`              | Border unchanged (border-first stays calm) |
| **Tables / lists / menus**     | Background tint: `--color-surface-hover` | No border or shadow changes                |
| **Primary buttons**            | Background change                        | Raised may keep subtle shadow              |
| **Outlined buttons**           | Background tint                          | Prefer over border change                  |
| **Text buttons**               | Background tint only                     | Subtle                                     |

### Transition Template

```scss
/* Only include properties that actually change */
transition:
  background-color var(--motion-fast),
  border-color var(--motion-fast),
  box-shadow var(--motion-fast);
```

### Your Decision

- [ ] **APPROVED** - Implement hover policy ⭐ CORE
- [ ] **REJECTED** - Allow inconsistent hover (explain why)

---

## Decision 46: Disabled & Read-only Semantics

### The Problem

"Why can I click this?" confusion when disabled/read-only states are unclear.

### The Rule

> **Disabled and read-only are distinct states with different behaviors**

### Disabled State

| Property           | Value                                    |
| ------------------ | ---------------------------------------- |
| **Interactive**    | ❌ No                                    |
| **Pointer events** | `none`                                   |
| **Contrast**       | Reduced (`opacity: 0.5` or muted colors) |
| **Hover**          | None                                     |
| **Focus**          | None                                     |
| **Cursor**         | `not-allowed`                            |

```scss
[disabled],
:disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}
```

### Read-only State

| Property           | Value                                 |
| ------------------ | ------------------------------------- |
| **Interactive**    | Limited (scrollable, selectable text) |
| **Pointer events** | `auto`                                |
| **Contrast**       | Full (distinct styling from disabled) |
| **Hover**          | None                                  |
| **Focus**          | Yes (for accessibility)               |
| **Cursor**         | `default`                             |

```scss
[readonly],
.read-only {
  background-color: var(--color-surface-secondary);
  border-color: var(--color-border-muted);
  cursor: default;
  /* NOT opacity-reduced */
}
```

### Use Cases

| State         | Use When                                                    |
| ------------- | ----------------------------------------------------------- |
| **Disabled**  | Action not available (permissions, prerequisites)           |
| **Read-only** | Data visible but not editable (review screens, locked rows) |

### Critical for

- Forms (read-only review screens)
- Tables (locked rows, "view only" users)
- Permissions ("view only" access)

### Your Decision

- [ ] **APPROVED** - Implement disabled/read-only semantics ⭐ CORE
- [ ] **REJECTED** - Allow ambiguous states (explain why)

---

# SUMMARY & APPROVAL STATUS

---

## ✅ All Decisions Approved

### CORE Decisions (59 total)

| #   | Decision                           | Status                       |
| --- | ---------------------------------- | ---------------------------- |
| 1   | Token Source of Truth              | ✅ APPROVED                  |
| 2   | Spacing Scale                      | ✅ Option A                  |
| 3   | Radius Scale                       | ✅ Option B                  |
| 4   | Typography Scale                   | ✅ Option A                  |
| 6   | PrimeNG Consumes Tokens            | ✅ APPROVED                  |
| 7   | CSS Layers                         | ✅ APPROVED                  |
| 8   | Semantic Token Taxonomy            | ✅ APPROVED                  |
| 9A  | Button Shape & Elevation           | ✅ APPROVED                  |
| 9B  | Toggle Accessibility               | ✅ APPROVED                  |
| 10  | Exception Process                  | ✅ APPROVED                  |
| 11  | Migration Rules                    | ✅ APPROVED                  |
| 12  | Accessibility Rules                | ✅ APPROVED                  |
| 14  | Elevation System                   | ✅ Border-first + Policy A   |
| 16  | PrimeNG Boundaries                 | ✅ APPROVED                  |
| 18  | Interaction States                 | ✅ APPROVED                  |
| 19  | Motion Tokens                      | ✅ APPROVED                  |
| 20  | Z-Index Scale                      | ✅ APPROVED                  |
| 22  | No ::ng-deep (fully removed)       | ✅ COMPLETE                  |
| 23  | Form System                        | ✅ APPROVED                  |
| 24  | Table Standards                    | ✅ APPROVED                  |
| 25  | Dialog/Drawer Standards            | ✅ APPROVED                  |
| 26  | Feedback System                    | ✅ APPROVED                  |
| 27  | Empty/Error/Loading States         | ✅ APPROVED                  |
| 28  | Page Header Pattern                | ✅ APPROVED                  |
| 29  | Typography System (Poppins)        | ✅ APPROVED                  |
| 30  | Icon System Rules                  | ✅ APPROVED                  |
| 31  | Tooltip & Helper Text Policy       | ✅ APPROVED                  |
| 32  | Validation & Error Behavior        | ✅ Option A (blur + submit)  |
| 35  | Responsive Breakpoints             | ✅ APPROVED                  |
| 36  | Keyboard Accessibility             | ✅ APPROVED                  |
| 38  | Destructive Action Safety          | ✅ Option A (confirm dialog) |
| 39  | Date/Time/Number Formatting        | ✅ APPROVED                  |
| 40  | Empty State Actions                | ✅ APPROVED                  |
| 41  | Overlay Components                 | ✅ APPROVED                  |
| 42  | Checkbox & Radio Standards         | ✅ APPROVED                  |
| 43  | Menu & Actions Pattern             | ✅ APPROVED                  |
| 44  | Chart Styling                      | ✅ APPROVED                  |
| 45  | Hover States Policy                | ✅ APPROVED                  |
| 46  | Disabled & Read-only Semantics     | ✅ APPROVED                  |
| 47  | Token Versioning & Deprecation     | ✅ APPROVED                  |
| 48  | Recipes vs Utilities Boundary      | ✅ APPROVED                  |
| 49  | Control Sizing Tokens              | ✅ APPROVED                  |
| 50  | Focus Ring Anti-Clipping           | ✅ APPROVED                  |
| 51  | Reduced Motion & High Contrast     | ✅ APPROVED                  |
| 52  | Pointer vs Keyboard Rule           | ✅ APPROVED                  |
| 53  | State Color Tokens                 | ✅ APPROVED                  |
| 54  | Form Error Summary & Scroll        | ✅ APPROVED                  |
| 55  | Testing Gates (Definition of Done) | ✅ APPROVED                  |
| 56  | Typography Fallback (JP)           | ✅ APPROVED                  |
| 57  | Line Height & Letter Spacing (JP)  | ✅ APPROVED                  |
| 58  | Text Expansion Tolerance           | ✅ APPROVED                  |
| 59  | Locale-Aware Formatting            | ✅ APPROVED                  |
| 60  | IME-Safe Validation                | ✅ APPROVED                  |
| 61  | CJK Line Breaking                  | ✅ APPROVED                  |
| 62  | Icon Gaps Policy                   | ✅ APPROVED                  |
| 63  | Icon Delivery Method               | ✅ Option B (Font + SVG)     |
| 64  | Token Output Contract              | ✅ APPROVED                  |
| 65  | Design System Ownership            | ✅ APPROVED                  |
| 66  | Visual Regression Baseline         | ✅ APPROVED                  |
| 67  | Component API Rules (Wrappers)     | ✅ APPROVED                  |
| 68  | Content Density by Context         | ✅ APPROVED                  |

### OPERATIONAL Decisions

| #   | Decision                   | Status      |
| --- | -------------------------- | ----------- |
| 5   | Spacing Enforcement        | ✅ APPROVED |
| 9   | Component Standard Library | ✅ APPROVED |
| 13  | Border System              | ✅ APPROVED |
| 15  | Theme Readiness            | ✅ APPROVED |
| 17  | File/Folder Structure      | ✅ APPROVED |
| 21  | Layout Constraints         | ✅ APPROVED |
| 33  | Card Information Hierarchy | ✅ APPROVED |
| 34  | Breadcrumb Rules           | ✅ APPROVED |
| 37  | Microcopy Rules            | ✅ APPROVED |

---

## Final Decision Rationale

| #   | Decision                               | Rationale                                    |
| --- | -------------------------------------- | -------------------------------------------- |
| 1   | **APPROVED**                           | Industry standard, enables theming           |
| 2   | **Option A**                           | CSS tokens already more complete             |
| 3   | **Option B**                           | Fewer tokens = less cognitive load           |
| 4   | **Option A**                           | Strict scale prevents drift                  |
| 5   | **APPROVED**                           | Enforces Decision 2                          |
| 6   | **APPROVED**                           | Required for maintainability                 |
| 7   | **APPROVED**                           | Eliminates specificity wars                  |
| 8   | **APPROVED**                           | Prevents token junk drawer                   |
| 9   | **APPROVED**                           | Prevents "card v5" scenarios                 |
| 9A  | **APPROVED**                           | Stop pill-everywhere, use raised selectively |
| 9B  | **APPROVED**                           | Two-cue toggle for accessibility             |
| 10  | **APPROVED**                           | Formalizes necessary exceptions              |
| 11  | **APPROVED**                           | Prevents "half-migrated forever"             |
| 12  | **APPROVED**                           | Accessibility by design                      |
| 13  | **APPROVED**                           | Consistent borders                           |
| 14  | **APPROVED + Border-first + Policy A** | Cleaner, dark-mode ready                     |
| 15  | **APPROVED**                           | Future-proofs architecture                   |
| 16  | **APPROVED**                           | Clear ownership                              |
| 17  | **APPROVED**                           | Organization by responsibility               |
| 18  | **APPROVED**                           | Consistent interaction states                |
| 19  | **APPROVED**                           | Consistent motion                            |
| 20  | **APPROVED**                           | No z-index chaos                             |
| 21  | **APPROVED**                           | Consistent layouts                           |
| 22  | **APPROVED**                           | Prevents global chaos                        |
| 23  | **APPROVED**                           | Forms are most visible inconsistency         |
| 24  | **APPROVED**                           | Tables accumulate most hacks                 |
| 25  | **APPROVED**                           | Modal inconsistency feels sloppy             |
| 26  | **APPROVED**                           | Feedback is your UI's voice                  |
| 27  | **APPROVED**                           | States cause most style drift                |
| 28  | **APPROVED**                           | Page headers set the tone                    |
| 29  | **APPROVED**                           | Typography already defined, enforce it       |
| 30  | **APPROVED**                           | Icons get inconsistent fast                  |
| 31  | **APPROVED**                           | 137 tooltips = needs rules                   |
| 32  | **Option A (blur + submit)**           | Consistent validation UX                     |
| 33  | **APPROVED**                           | Prevents cluttered cards (OPERATIONAL)       |
| 34  | **APPROVED**                           | Navigation clarity (OPERATIONAL)             |
| 35  | **APPROVED**                           | Consistent responsive behavior               |
| 36  | **APPROVED**                           | Accessibility beyond contrast                |
| 37  | **APPROVED**                           | Consistent voice/tone (OPERATIONAL)          |
| 38  | **Option A (confirm dialog)**          | User safety                                  |
| 39  | **APPROVED**                           | Data display consistency                     |
| 40  | **APPROVED**                           | Clear user guidance                          |
| 41  | **APPROVED**                           | Unified overlay behavior                     |
| 42  | **APPROVED**                           | Checkbox/radio consistency                   |
| 43  | **APPROVED**                           | Prevents button walls                        |
| 44  | **APPROVED**                           | Charts are data viz, need rules              |
| 45  | **APPROVED**                           | Hover consistency                            |
| 46  | **APPROVED**                           | Prevents "why can I click this?" UX          |
| 47  | **APPROVED**                           | Tokens are an API, need lifecycle            |
| 48  | **APPROVED**                           | Prevents class soup                          |
| 49  | **APPROVED**                           | Controls stay consistent                     |
| 50  | **APPROVED**                           | Critical accessibility fix                   |
| 51  | **APPROVED**                           | Enterprise/audit ready                       |
| 52  | **APPROVED**                           | Touch users matter                           |
| 53  | **APPROVED**                           | Consistent hover/active/selected             |
| 54  | **APPROVED**                           | "Why won't it save?" prevention              |
| 55  | **APPROVED**                           | Rules become a system, not a doc             |
| 56  | **APPROVED**                           | JP text renders cleanly                      |
| 57  | **APPROVED**                           | JP spacing doesn't break                     |
| 58  | **APPROVED**                           | Labels survive i18n                          |
| 59  | **APPROVED**                           | Locale-aware dates/numbers                   |
| 60  | **APPROVED**                           | IME input works correctly                    |
| 61  | **APPROVED**                           | CJK wrapping works                           |
| 62  | **APPROVED**                           | No icon chaos                                |
| 63  | **Option B**                           | Font + controlled SVG                        |
| 64  | **APPROVED**                           | Tokens are stable API                        |
| 65  | **APPROVED**                           | Clear ownership prevents drift               |
| 66  | **APPROVED**                           | Regression caught before merge               |
| 67  | **APPROVED**                           | Consistent component usage                   |
| 68  | **APPROVED**                           | UI density is predictable                    |

---

## Stylelint Rules to Implement

| Rule                                            | Enforces Decision |
| ----------------------------------------------- | ----------------- |
| Disallow hex colors outside tokens file         | 1                 |
| Disallow raw padding/margin/gap values          | 2, 5              |
| Disallow raw border-radius values               | 3                 |
| Disallow raw font-size values                   | 4                 |
| Disallow raw box-shadow values                  | 14                |
| Disallow raw border-color values                | 13                |
| Disallow raw z-index values                     | 20                |
| Disallow `transition: all`                      | 19                |
| Error on any `::ng-deep` usage (fully removed)  | 22                |
| Warn on `!important` outside overrides          | 7                 |
| Disallow hardcoded `font-family`                | 56                |
| Disallow fixed width on labels/buttons          | 58                |
| Warn on negative letter-spacing (review for JP) | 57                |

---

# PART 9: SYSTEM GUARDRAILS

> These decisions prevent drift once teams start shipping fast.

---

## Decision 47: Token Versioning & Deprecation

### The Problem

Tokens become a graveyard — unused tokens accumulate, deprecated tokens linger, teams stop trusting the system.

### The Rule

> **Tokens are an API. They have lifecycle rules.**

### Token Lifecycle Rules

1. **Deprecated tokens** must include:
   - Replacement token name
   - Owner (who deprecated it)
   - Removal quarter (e.g., Q2 2026)
2. **No deleting tokens** without:
   - "Search & replace completed" ticket
   - Zero usages verified in codebase

3. **Changelog required:** Maintain `tokens/changelog.md`

### Deprecation Format

```scss
/* @deprecated Q2 2026 - Use --color-surface-primary instead
 * Owner: @design-system-team
 * Ticket: DS-1234
 */
--old-background-color: var(--color-surface-primary);
```

### Changelog Format

```markdown
## [2026-01-15]

### Added

- --color-surface-hover (Decision 53)

### Changed

- --shadow-2 value adjusted for consistency

### Deprecated

- --old-card-bg → use --color-surface-primary (removal Q2 2026)
```

### Your Decision

- [ ] **APPROVED** - Implement token versioning ⭐ CORE
- [ ] **REJECTED** - No lifecycle rules (explain why)

---

## Decision 48: Recipes vs Utilities Boundary

### The Problem

Utility sprawl: one-off classes multiply, CSS becomes unpredictable "class soup."

### The Rule

> **Feature teams use recipes first; utilities are generic and proven**

### Utility Class Rules

1. **No new one-off utilities** unless truly generic:
   - Spacing (`.mt-4`, `.gap-3`)
   - Display (`.flex`, `.grid`, `.hidden`)
   - Text alignment (`.text-center`)
2. **Feature teams must use recipes first:**
   - `.card`, `.page-header`, `.form-field`, `.metric-card`
   - If a recipe doesn't exist, request it — don't invent local classes

3. **3-place rule:** A utility must be used in ≥3 places or it doesn't exist

### Forbidden Patterns

```scss
// ❌ One-off utilities
.workout-card-special-padding {
  padding: 1.5rem;
}
.dashboard-flex-thing {
  display: flex;
  gap: 12px;
}

// ✅ Use recipes or existing utilities
.card {
  /* recipe */
}
.flex.gap-3 {
  /* existing utilities */
}
```

### Your Decision

- [ ] **APPROVED** - Implement recipes-first policy ⭐ CORE
- [ ] **REJECTED** - Allow utility sprawl (explain why)

---

## Decision 49: Control Sizing Tokens

### The Problem

Buttons have sizes, forms have heights, but dropdown/multiselect/calendar/inputnumber drift because there's no unified control token layer.

### The Rule

> **All controls share sizing tokens, mapped to PrimeNG**

### Control Sizing Tokens

```scss
/* Heights */
--control-height-sm: 32px;
--control-height-md: 40px; /* Default */
--control-height-lg: 48px;

/* Horizontal padding */
--control-padding-x-sm: var(--space-3); /* 12px */
--control-padding-x-md: var(--space-4); /* 16px */
--control-padding-x-lg: var(--space-5); /* 20px */

/* Font sizes */
--control-font-size-sm: var(--font-body-sm); /* 14px */
--control-font-size-md: var(--font-body-md); /* 16px */
--control-font-size-lg: var(--font-body-lg); /* 18px */
```

### PrimeNG Mapping

| Component   | Size Prop      | Token Mapping         |
| ----------- | -------------- | --------------------- |
| Button      | `size="small"` | `--control-height-sm` |
| InputText   | (default)      | `--control-height-md` |
| Select      | (default)      | `--control-height-md` |
| DatePicker  | (default)      | `--control-height-md` |
| MultiSelect | (default)      | `--control-height-md` |
| InputNumber | (default)      | `--control-height-md` |

### Your Decision

- [ ] **APPROVED** - Implement control sizing tokens ⭐ CORE
- [ ] **REJECTED** - Let controls drift (explain why)

---

## Decision 50: Focus Ring Anti-Clipping

### The Problem

Focus rings get clipped by `overflow: hidden` on overlays, dialogs, cards — common accessibility regression.

### The Rule

> **Focus rings must never clip. Components with overflow must accommodate focus.**

### Rules

1. Any component with `overflow: hidden` must:
   - Use `overflow: clip` with `overflow-clip-margin: 4px`, OR
   - Use a focus-safe wrapper with padding, OR
   - Use `outline` with `outline-offset: 2px` (visible outside bounds)

2. **Overlay panels / dialog headers** must not clip focus rings on:
   - Close button
   - First focusable field
   - Any interactive element

### Implementation Pattern

```scss
/* Option 1: Clip margin (modern browsers) */
.card {
  overflow: clip;
  overflow-clip-margin: 4px;
}

/* Option 2: Outline instead of box-shadow for focus */
:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

/* Option 3: Inner padding wrapper */
.overflow-container {
  overflow: hidden;
}
.overflow-container__inner {
  padding: 4px;
  margin: -4px;
}
```

### Your Decision

- [ ] **APPROVED** - Implement focus anti-clipping ⭐ CORE
- [ ] **REJECTED** - Allow clipped focus rings (explain why)

---

## Decision 51: Reduced Motion & High Contrast Support

### The Problem

Enterprise users and accessibility audits require reduced motion and Windows High Contrast mode support.

### The Rule

> **Respect user preferences for motion and contrast**

### Reduced Motion

```scss
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Keep state changes obvious */
  :focus-visible {
    outline-width: 3px;
  }
}
```

### High Contrast Mode (Windows)

```scss
@media (forced-colors: active) {
  /* Ensure borders show */
  .card,
  .button,
  .input {
    border: 1px solid CanvasText;
  }

  /* Ensure focus rings show */
  :focus-visible {
    outline: 3px solid Highlight;
    outline-offset: 2px;
  }

  /* Don't rely on background colors for state */
  [aria-selected="true"],
  [aria-checked="true"] {
    border-width: 2px;
  }
}
```

### Your Decision

- [ ] **APPROVED** - Implement motion/contrast support ⭐ CORE
- [ ] **REJECTED** - Skip accessibility preferences (explain why)

---

## Decision 52: Pointer vs Keyboard Rule

### The Problem

Hover styles designed for mouse don't work for touch — "design for hover" happens accidentally.

### The Rule

> **Hover styling is conditional; pressed/selected states work for all**

### Implementation

```scss
/* Hover only for devices that support it */
@media (hover: hover) and (pointer: fine) {
  .card:hover {
    box-shadow: var(--shadow-2);
  }

  .button:hover {
    background-color: var(--color-primary-hover);
  }
}

/* Touch/keyboard users get clear pressed/selected states */
.card:active,
.card[aria-selected="true"] {
  /* Always visible, not hover-dependent */
  box-shadow: var(--shadow-0);
  border-color: var(--color-border-focus);
}
```

### Rules

1. Use `@media (hover: hover) and (pointer: fine)` for hover-only styling
2. `:active` and `[aria-selected]` states must work without hover
3. Touch users must get clear pressed feedback

### Your Decision

- [ ] **APPROVED** - Implement pointer/keyboard rule ⭐ CORE
- [ ] **REJECTED** - Design for hover only (explain why)

---

## Decision 53: State Color Tokens

### The Problem

Components invent their own hover/active/selected colors — tables, menus, lists become inconsistent.

### The Rule

> **Formalize a state palette so components don't hand-pick tints**

### State Surface Tokens

```scss
/* Interactive surface states */
--color-surface-hover: var(--primitive-neutral-100);
--color-surface-active: var(--primitive-neutral-200);
--color-surface-selected: var(--primitive-primary-50);
--color-surface-selected-hover: var(--primitive-primary-100);

/* Optional border states (muted, not focus green) */
--color-border-hover: var(--primitive-neutral-400);
```

### Usage by Component

| Component       | Hover                   | Active                   | Selected                   |
| --------------- | ----------------------- | ------------------------ | -------------------------- |
| Table row       | `--color-surface-hover` | —                        | `--color-surface-selected` |
| Menu item       | `--color-surface-hover` | `--color-surface-active` | `--color-surface-selected` |
| List item       | `--color-surface-hover` | —                        | `--color-surface-selected` |
| Dropdown option | `--color-surface-hover` | —                        | `--color-surface-selected` |

### Your Decision

- [ ] **APPROVED** - Implement state color tokens ⭐ CORE
- [ ] **REJECTED** - Let components pick colors (explain why)

---

## Decision 54: Form Error Summary & Scroll Behavior

### The Problem

"Why won't it save?" — users miss errors on long forms.

### The Rule

> **On submit failure: show error summary + scroll to first error + focus it**

### Behavior (extends Decision 32)

1. **Error summary** (top of form, for forms with >5 fields):

   ```html
   <div class="form-error-summary" role="alert">
     <p>Please fix 3 errors before saving:</p>
     <ul>
       <li><a href="#email">Email is required</a></li>
       <li><a href="#phone">Enter a valid phone number</a></li>
       <li><a href="#date">Select a date</a></li>
     </ul>
   </div>
   ```

2. **Auto-scroll** to first invalid field
3. **Focus** the first invalid field (keyboard-friendly)

### Implementation

```typescript
onSubmitError(errors: ValidationError[]) {
  // Show summary
  this.showErrorSummary = true;

  // Scroll to first error
  const firstErrorField = document.getElementById(errors[0].fieldId);
  firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Focus it
  setTimeout(() => firstErrorField?.focus(), 300);
}
```

### Your Decision

- [ ] **APPROVED** - Implement error summary + scroll ⭐ CORE
- [ ] **REJECTED** - Silent validation only (explain why)

---

## Decision 55: Testing Gates (Definition of Done)

### The Problem

Rules become a document, not a system. Without gates, drift returns.

### The Rule

> **UI changes require passing gates before merge**

### Required Gates

#### 1. Lint Gate (Automated)

| Check                                      | Enforces    |
| ------------------------------------------ | ----------- |
| No hex outside tokens file                 | Decision 1  |
| No raw padding/margin/gap                  | Decision 2  |
| No `transition: all`                       | Decision 19 |
| No `::ng-deep` (fully removed)             | Decision 22 |
| No `!important` outside `@layer overrides` | Decision 7  |

#### 2. Screenshot Regression (Automated)

- Key pages: Dashboard, Settings, Training, Forms
- Run on PR, compare to baseline
- Flag >0.1% pixel diff for review

#### 3. Accessibility Gate (Manual + Automated)

| Check                                     | Method          |
| ----------------------------------------- | --------------- |
| Keyboard tab through dialogs              | Manual          |
| Focus visible on all interactive elements | Automated (axe) |
| Color contrast ≥4.5:1                     | Automated       |
| No missing alt text                       | Automated       |

### Definition of Done for UI PRs

```markdown
## UI Change Checklist

- [ ] Lint passes (no token violations)
- [ ] Screenshot regression reviewed
- [ ] Keyboard navigation works (dialogs, forms)
- [ ] Focus rings visible
- [ ] No `::ng-deep` usage (fully removed from codebase)
```

### Your Decision

- [ ] **APPROVED** - Implement testing gates ⭐ CORE
- [ ] **REJECTED** - No automated enforcement (explain why)

---

# PART 10: INTERNATIONALIZATION (JP READINESS)

> These decisions prepare for Japanese localization without overbuilding.

---

## Decision 56: Typography Fallback & Language-Aware Rendering

### The Problem

Poppins doesn't cover Japanese glyphs. Without fallback tokens, JP text renders in system defaults inconsistently.

### The Rule

> **Font stacks include JP fallbacks; never hardcode font-family**

### Font Stack Tokens

```scss
/* Latin-optimized (current) */
--font-family-sans-latin:
  "Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

/* Japanese-optimized */
--font-family-sans-jp:
  "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", "Meiryo", sans-serif;

/* Universal (use this in components) */
--font-family-sans: var(--font-family-sans-latin), var(--font-family-sans-jp);
```

### Rules

1. **Never hardcode** `font-family: "Poppins"` — always use `var(--font-family-sans)`
2. JP fonts load **only when needed** (unicode-range or separate stylesheet)
3. Keep JP font weights lean: 400, 500, 600 only

### Font Loading Strategy

```css
/* Subset loading for JP */
@font-face {
  font-family: "Noto Sans JP";
  src: url("NotoSansJP-Regular.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
  unicode-range: U+3000-9FFF, U+FF00-FFEF; /* JP characters only */
}
```

### Your Decision

- [ ] **APPROVED** - Implement JP font fallbacks ⭐ CORE
- [ ] **REJECTED** - Latin only (explain why)

---

## Decision 57: Line Height & Letter Spacing per Script

### The Problem

Japanese text needs different spacing — negative letter-spacing looks broken, line-height needs to be taller.

### The Rule

> **Script-aware spacing: no negative tracking for JP, taller line-height**

### Spacing Tokens

```scss
/* Line heights */
--line-height-normal: 1.5; /* Latin body */
--line-height-jp: 1.7; /* Japanese body (taller) */

/* Letter spacing */
--letter-spacing-tight: -0.02em; /* Latin headings ONLY */
--letter-spacing-normal: 0; /* Default */
--letter-spacing-wide: 0.05em; /* Uppercase labels */
```

### Rules

1. **No negative letter-spacing** for JP text
2. `--letter-spacing-tight` scoped to Latin headings only
3. JP body text uses `--line-height-jp` (or 1.6 minimum)

### Implementation

```scss
/* Heading with tight tracking (Latin only) */
.page-title {
  letter-spacing: var(--letter-spacing-tight);
}

/* JP override */
:lang(ja) .page-title {
  letter-spacing: var(--letter-spacing-normal);
  line-height: var(--line-height-jp);
}
```

### Your Decision

- [ ] **APPROVED** - Implement script-aware spacing ⭐ CORE
- [ ] **REJECTED** - Same spacing for all scripts (explain why)

---

## Decision 58: Text Expansion Tolerance

### The Problem

Japanese often shortens labels, but German/French expand by 30-50%. Fixed widths break.

### The Rule

> **Labels must tolerate expansion; truncation only with tooltip**

### Expansion Rules

| Element       | Expansion Tolerance | Truncation Allowed |
| ------------- | ------------------- | ------------------ |
| Buttons       | 30% minimum         | ❌ No              |
| Tabs          | 30% minimum         | With tooltip       |
| Chips/Tags    | 20% minimum         | With tooltip       |
| Table headers | 30% minimum         | With tooltip       |
| Menu items    | 40% minimum         | With tooltip       |

### Forbidden Patterns

```scss
// ❌ Fixed width labels
.tab {
  width: 120px;
}
.button {
  max-width: 100px;
}

// ✅ Flexible with min/max
.tab {
  min-width: 80px;
  max-width: 200px;
}
.button {
  /* no fixed width */
}
```

### Truncation Pattern (if allowed)

```html
<span class="truncate" [pTooltip]="fullText">{{ truncatedText }}</span>
```

### Your Decision

- [ ] **APPROVED** - Implement expansion tolerance ⭐ CORE
- [ ] **REJECTED** - Fixed-width labels OK (explain why)

---

## Decision 59: Locale-Aware Formatting Tokens

### The Problem

Decision 39 sets date/number formats, but Japan uses different conventions. Need locale override capability.

### The Rule

> **Formatting tokens can be overridden by locale**

### Locale Tokens

```scss
/* Default (can be overridden per locale) */
--locale-date-format-full: "DD MMM YYYY"; /* 02 Jan 2026 */
--locale-date-format-short: "DD MMM"; /* 02 Jan */
--locale-time-format: "HH:mm"; /* 24h */
--locale-number-decimal: ".";
--locale-number-thousands: ",";
```

### Japan Overrides

```scss
:lang(ja) {
  --locale-date-format-full: "YYYY/MM/DD"; /* 2026/01/02 */
  --locale-date-format-short: "MM/DD"; /* 01/02 */
  --locale-time-format: "HH:mm"; /* Same */
}
```

### Implementation

- Use Angular's `DatePipe` with locale
- Format tokens inform display, not replace Angular i18n

### Your Decision

- [ ] **APPROVED** - Implement locale formatting tokens ⭐ CORE
- [ ] **REJECTED** - Single format only (explain why)

---

## Decision 60: IME-Safe Validation

### The Problem

Japanese input uses IME (Input Method Editor). Validating during composition breaks input flow.

### The Rule

> **Pause validation during IME composition**

### Behavior (extends Decision 32)

1. On `compositionstart` → pause validation
2. On `compositionend` → resume validation
3. On `blur` / `submit` → validate normally

### Implementation

```typescript
@HostListener('compositionstart')
onCompositionStart() {
  this.isComposing = true;
}

@HostListener('compositionend')
onCompositionEnd() {
  this.isComposing = false;
  this.validateField(); // Validate after composition
}

validateOnInput() {
  if (this.isComposing) return; // Skip during IME
  this.validateField();
}
```

### Affected Components

- All text inputs with live validation
- Search fields with instant results
- Autocomplete components

### Your Decision

- [ ] **APPROVED** - Implement IME-safe validation ⭐ CORE
- [ ] **REJECTED** - Break IME input (explain why)

---

## Decision 61: CJK Line Breaking & Text Wrapping

### The Problem

Japanese/Chinese text wraps differently — line-break opportunities, punctuation handling, and ellipsis behavior can break unexpectedly.

### The Rule

> **CJK text uses proper line-breaking; truncation works across scripts**

### CSS Rules for CJK

```scss
/* Base text handling */
body {
  word-break: normal;
  overflow-wrap: break-word;
}

/* Japanese-specific */
:lang(ja) {
  line-break: strict; /* Prevents bad breaks near punctuation */
  word-break: normal; /* Don't break mid-word for JP */
}

/* Truncation that works with CJK */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* CJK ellipsis renders correctly */
}

/* Multi-line truncation */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

### Rules

1. **No `word-break: break-all`** for JP text (breaks mid-character)
2. Truncation must show ellipsis correctly for CJK
3. Tooltip content (Decision 31) must handle CJK text width

### Your Decision

- [ ] **APPROVED** - Implement CJK text handling ⭐ CORE
- [ ] **REJECTED** - Latin-only text handling (explain why)

---

# PART 11: GOVERNANCE & OPERATIONS

> These decisions ensure the system survives shipping pressure.

---

## Decision 62: Icon Gaps Policy

### The Problem

PrimeIcons doesn't have every icon you need (sports, brand marks, specific pictograms). Without a policy, teams silently approximate or sneak in random libraries.

### The Rule

> **PrimeIcons first; gaps handled through controlled exceptions, never approximation**

### When PrimeIcons Doesn't Have What You Need

**Option A (Preferred): Closest PrimeIcon + Label**

- Use the closest available PrimeIcon
- Ensure meaning is carried by text, tooltip, or helper text
- Icon is not the only cue for meaning

**Option B (Controlled Exception): Custom SVG Icon Pack**
If PrimeIcons cannot represent the concept without confusion:

1. **Storage:** `assets/icons/custom/`
2. **Delivery:** Via `<app-icon>` wrapper component only
3. **No inline SVG** sprinkled around codebase
4. **Exception required:** Each custom icon needs Decision 10 template:
   - Ticket number
   - Reason PrimeIcon doesn't work
   - Scope (which features use it)
   - Owner
   - Review date (keep vs remove)

### Forbidden Patterns

```html
<!-- ❌ Random approximation -->
<i class="pi pi-star"></i>
<!-- Using star when you need "favorite workout" -->

<!-- ❌ Inline SVG chaos -->
<svg viewBox="0 0 24 24">...</svg>

<!-- ✅ Closest icon + label -->
<i class="pi pi-bookmark"></i>
<span>Save Workout</span>

<!-- ✅ Custom via wrapper (with exception) -->
<app-icon name="football" size="md" aria-label="Football drill" />
```

### Your Decision

- [ ] **APPROVED** - PrimeIcons + controlled custom pack ⭐ CORE
- [ ] **REJECTED** - Allow any icons (explain why)

---

## Decision 63: Icon Delivery Method

### The Problem

Decision 30 standardizes usage but not delivery. Need to pick font vs SVG approach.

### The Rule

> **PrimeIcons font + controlled custom SVG pack (via wrapper)**

### Delivery Options

| Method                               | Pros                                 | Cons                                    |
| ------------------------------------ | ------------------------------------ | --------------------------------------- |
| **A: Font only**                     | Fastest, simplest, already supported | Limited to PrimeIcons; alignment issues |
| **B: Font + SVG pack (RECOMMENDED)** | Solves gaps cleanly                  | Requires wrapper + review               |

### Implementation (Option B)

#### `<app-icon>` Wrapper Component

```typescript
@Component({
  selector: "app-icon",
  template: `
    <ng-container [ngSwitch]="source">
      <!-- PrimeIcon (default) -->
      <i
        *ngSwitchCase="'prime'"
        [class]="'pi pi-' + name"
        [class.icon-sm]="size === 'sm'"
        [class.icon-md]="size === 'md'"
        [class.icon-lg]="size === 'lg'"
        [attr.aria-label]="ariaLabel"
        [attr.aria-hidden]="!ariaLabel"
      >
      </i>

      <!-- Custom SVG (exception only) -->
      <svg
        *ngSwitchCase="'custom'"
        [class]="'icon-' + size"
        [attr.aria-label]="ariaLabel"
        role="img"
      >
        <use [attr.href]="'assets/icons/custom/sprite.svg#' + name"></use>
      </svg>
    </ng-container>
  `,
})
export class IconComponent {
  @Input() name: string;
  @Input() size: "sm" | "md" | "lg" = "md";
  @Input() source: "prime" | "custom" = "prime";
  @Input() ariaLabel?: string;
}
```

### Custom Icon Requirements

1. SVG sprite at `assets/icons/custom/sprite.svg`
2. Each icon follows naming: `icon-{name}.svg`
3. Viewbox standardized: `0 0 24 24`
4. No fill colors (inherit from CSS)

### Your Decision

- [ ] **Option A** - PrimeIcons font only
- [ ] **Option B** - Font + controlled SVG pack ⭐ CORE (Recommended)

---

## Decision 64: Token Output Contract

### The Problem

Without a defined output contract, refactors accidentally change token availability or cascade order.

### The Rule

> **Single generated token artifact with versioning and compatibility rules**

### Output Structure

```
angular/src/scss/tokens/
├── design-system-tokens.scss    # Source (authored here)
├── tokens.css                   # Generated via npm run sass:compile
└── changelog.md                 # Version history
```

### Authoring Rules

| Rule                             | Description                           |
| -------------------------------- | ------------------------------------- |
| **Source format**                | CSS custom properties in `:root`      |
| **SCSS consumption**             | Import tokens.css; use `var()` syntax |
| **No SCSS variables for tokens** | Prevents dual-system                  |

### Compatibility Contract

| Change Type      | Breaking? | Process                          |
| ---------------- | --------- | -------------------------------- |
| **Add token**    | No        | PR + changelog                   |
| **Change value** | Maybe     | Owner review + changelog         |
| **Rename token** | Yes       | Deprecation period (Decision 47) |
| **Remove token** | Yes       | Zero-usage verified + changelog  |

### Versioning

```markdown
## tokens.css versioning

- Major: Breaking changes (removals, renames)
- Minor: New tokens, value adjustments
- Patch: Bug fixes, documentation

Current: v1.0.0
```

### Build Integration

```javascript
// package.json script
"build:tokens": "sass tokens/design-system-tokens.scss dist/tokens.css"
```

### Your Decision

- [ ] **APPROVED** - Implement token output contract ⭐ CORE
- [ ] **REJECTED** - No formal output (explain why)

---

## Decision 65: Design System Ownership

### The Problem

"Approval strategy" exists, but not ongoing ownership. Without clear owners, helpful edits become regressions.

### The Rule

> **Token/recipe changes require review from designated owners**

### Ownership Structure

| Asset               | Owners          | Backup       |
| ------------------- | --------------- | ------------ |
| **Tokens**          | 1-2 senior devs | Design lead  |
| **Recipes**         | Component owner | Token owners |
| **PrimeNG mapping** | Token owners    | —            |
| **Exceptions**      | Token owners    | —            |

### Approval Rules

| Change Type        | Required Approval           |
| ------------------ | --------------------------- |
| New token          | 1 owner                     |
| Change token value | 1 owner + design review     |
| Deprecate token    | 1 owner + migration plan    |
| Remove token       | 2 owners + zero-usage proof |
| New recipe         | 1 owner                     |
| Exception request  | 1 owner                     |

### Change Classification

```markdown
## PR Template for Token/Recipe Changes

### Change Type

- [ ] New token/recipe
- [ ] Value change
- [ ] Deprecation
- [ ] Removal

### Impact Assessment

- [ ] Affects no existing components
- [ ] Affects <5 components (list them)
- [ ] Affects >5 components (requires migration plan)

### Changelog Entry

<!-- Paste your changelog addition -->
```

### Emergency Exception Rule

For production hotfixes:

1. Apply override in `@layer overrides`
2. Create exception ticket within 24h
3. Owner review within 48h
4. Either formalize change or revert

### Your Decision

- [ ] **APPROVED** - Implement ownership model ⭐ CORE
- [ ] **REJECTED** - No formal ownership (explain why)

---

## Decision 66: Visual Regression Baseline

### The Problem

Decision 55 mentions screenshot regression but doesn't define which routes, viewports, or thresholds. Without this, teams disable the gate when it becomes annoying.

### The Rule

> **Defined baseline routes, viewports, and diff approval process**

### Baseline Routes (Minimum Set)

| Route                  | Priority    | Reason                   |
| ---------------------- | ----------- | ------------------------ |
| `/dashboard`           | 🔴 Critical | Main entry, bento layout |
| `/training`            | 🔴 Critical | Tables, cards, forms     |
| `/settings`            | 🟠 High     | Forms, toggles           |
| `/workout/:id`         | 🟠 High     | Detail view, charts      |
| `/login`               | 🟠 High     | First impression         |
| `/exercise-library`    | 🟡 Medium   | Data grid                |
| Dialog: Confirm delete | 🟠 High     | Modal overlay            |
| Dialog: Create workout | 🟠 High     | Form in modal            |
| Empty state            | 🟡 Medium   | Empty patterns           |
| Error state            | 🟡 Medium   | Error patterns           |

### Viewport Sizes

| Name    | Width  | Height | Device    |
| ------- | ------ | ------ | --------- |
| Mobile  | 375px  | 667px  | iPhone SE |
| Tablet  | 768px  | 1024px | iPad      |
| Desktop | 1280px | 800px  | Laptop    |
| Wide    | 1920px | 1080px | Monitor   |

### Diff Thresholds

| Level      | Threshold | Action                |
| ---------- | --------- | --------------------- |
| **Pass**   | < 0.1%    | Auto-approve          |
| **Review** | 0.1% - 1% | Owner review required |
| **Fail**   | > 1%      | Block merge           |

### Approval Process

1. CI runs screenshot comparison on PR
2. Diffs posted as PR comment with before/after
3. If > 0.1%: Token owner must approve
4. Baseline updated on merge to main

### Tools (Recommended)

- Percy, Chromatic, or Playwright screenshots
- Store baselines in repo or dedicated bucket
- Run on every PR touching `/angular/src/`

### Your Decision

- [ ] **APPROVED** - Implement regression baseline ⭐ CORE
- [ ] **REJECTED** - No visual regression (explain why)

---

## Decision 67: Component API Rules (Angular Wrappers)

### The Problem

CSS is standardized, but teams hand-assemble PrimeNG prop combinations differently. Need component API rules.

### The Rule

> **Use wrapper components with sanctioned prop combinations**

### Button Wrapper

```typescript
@Component({
  selector: "app-button",
  template: `
    <p-button
      [label]="label"
      [icon]="icon"
      [severity]="severity"
      [outlined]="variant === 'outlined'"
      [text]="variant === 'text'"
      [raised]="variant === 'raised'"
      [rounded]="shape === 'pill'"
      [size]="size"
      [disabled]="disabled"
      [loading]="loading"
      (onClick)="onClick.emit($event)"
    />
  `,
})
export class ButtonComponent {
  @Input() label: string;
  @Input() icon?: string;
  @Input() severity:
    | "primary"
    | "secondary"
    | "success"
    | "info"
    | "warn"
    | "danger" = "primary";
  @Input() variant: "solid" | "outlined" | "text" | "raised" = "solid";
  @Input() shape: "default" | "pill" = "default";
  @Input() size: "small" | "large" | undefined;
  @Input() disabled = false;
  @Input() loading = false;
  @Output() onClick = new EventEmitter();
}
```

### Sanctioned Button Variants

| Context          | Severity    | Variant    | Shape     |
| ---------------- | ----------- | ---------- | --------- |
| Primary CTA      | `primary`   | `raised`   | `default` |
| Secondary action | `secondary` | `outlined` | `default` |
| Tertiary/link    | `secondary` | `text`     | `default` |
| Destructive      | `danger`    | `solid`    | `default` |
| Table row action | `secondary` | `text`     | `default` |
| Icon-only        | —           | `text`     | `pill`    |

### Default Props by Context

```typescript
// Form footer
<app-button label="Cancel" variant="text" />
<app-button label="Save" variant="raised" />

// Table row
<app-button iconLeft="pi-pencil" variant="text" shape="pill" />

// Dialog footer
<app-button label="Cancel" variant="outlined" />
<app-button label="Confirm" severity="primary" />
```

### Forbidden

```html
<!-- ❌ Direct PrimeNG with random props -->
<p-button [rounded]="true" [raised]="true" [outlined]="true" />

<!-- ✅ Use wrapper -->
<app-button variant="raised" />
```

### Your Decision

- [ ] **APPROVED** - Implement component wrappers ⭐ CORE
- [ ] **REJECTED** - Direct PrimeNG usage (explain why)

---

## Decision 68: Content Density by Context

### The Problem

Dashboards feel tight, forms feel loose (or vice versa). Need density rules by context.

### The Rule

> **Density varies by context; defaults are enforced**

### Density Definitions

| Density     | Row Height | Padding     | Font Size        | Use Case                            |
| ----------- | ---------- | ----------- | ---------------- | ----------------------------------- |
| **Compact** | 36-40px    | `--space-2` | `--font-body-sm` | Dashboards, analytics, dense tables |
| **Medium**  | 44-48px    | `--space-3` | `--font-body-md` | Forms, settings, most UI            |
| **Relaxed** | 52-56px    | `--space-4` | `--font-body-md` | Onboarding, marketing, key flows    |

### Defaults by Context

| Context                   | Default Density | Override Allowed          |
| ------------------------- | --------------- | ------------------------- |
| **Dashboard / Analytics** | Compact         | Via exception             |
| **Data tables**           | Compact         | Medium for editable       |
| **Forms**                 | Medium          | Relaxed for onboarding    |
| **Settings**              | Medium          | —                         |
| **Dialogs**               | Medium          | Compact for confirmations |
| **Cards (metric)**        | Compact         | —                         |
| **Cards (content)**       | Medium          | —                         |

### Implementation

```scss
/* Density modifiers */
.density-compact {
  --local-row-height: var(--control-height-sm);
  --local-padding: var(--space-2);
  --local-font-size: var(--font-body-sm);
}

.density-medium {
  --local-row-height: var(--control-height-md);
  --local-padding: var(--space-3);
  --local-font-size: var(--font-body-md);
}

.density-relaxed {
  --local-row-height: var(--control-height-lg);
  --local-padding: var(--space-4);
  --local-font-size: var(--font-body-md);
}
```

### Your Decision

- [ ] **APPROVED** - Implement density rules ⭐ CORE
- [ ] **REJECTED** - No density standards (explain why)

--- Use this to inform token mapping and avoid breaking existing functionality.

---

## PrimeNG Components in Use (by frequency)

### Tier 1: Heavy Usage (50+ imports)

| Component         | Imports | Priority    |
| ----------------- | ------- | ----------- |
| **ButtonModule**  | 120     | 🔴 Critical |
| **CardModule**    | 100     | 🔴 Critical |
| **TagModule**     | 71      | 🔴 Critical |
| **TooltipModule** | 54      | 🔴 Critical |

### Tier 2: Medium Usage (20-49 imports)

| Component             | Imports | Priority |
| --------------------- | ------- | -------- |
| **DialogModule**      | 41      | 🟠 High  |
| **InputTextModule**   | 37      | 🟠 High  |
| **ProgressBarModule** | 35      | 🟠 High  |
| **Select**            | 30      | 🟠 High  |
| **ToastModule**       | 25      | 🟠 High  |
| **BadgeModule**       | 25      | 🟠 High  |
| **AvatarModule**      | 20      | 🟠 High  |

### Tier 3: Light Usage (10-19 imports)

| Component         | Imports |
| ----------------- | ------- |
| ChartModule       | 19      |
| Textarea          | 18      |
| SkeletonModule    | 17      |
| InputNumberModule | 17      |
| Tabs/TabPanel     | 16      |
| TableModule       | 16      |
| CheckboxModule    | 15      |
| DatePicker        | 14      |

### Tier 4: Occasional Usage (<10 imports)

| Component       | Imports |
| --------------- | ------- |
| MessageModule   | 12      |
| Slider          | 11      |
| Divider         | 11      |
| ProgressSpinner | 8       |
| Chip            | 7       |
| Timeline        | 6       |
| Steps           | 6       |
| Ripple          | 5       |
| ToggleSwitch    | 4       |
| MultiSelect     | 4       |
| Accordion       | 4       |
| SelectButton    | 3       |
| Password        | 3       |
| Knob            | 3       |
| ConfirmDialog   | 3       |

---

## Button Patterns Currently Used

### Boolean Properties (must preserve)

| Property            | Usage Count | Token Mapping              |
| ------------------- | ----------- | -------------------------- |
| `[rounded]="true"`  | 138         | `--radius-full`            |
| `[text]="true"`     | 155         | Text-only button variant   |
| `[outlined]="true"` | 113         | Border-only button variant |
| `[disabled]="..."`  | 50+         | Disabled state             |
| `[loading]="..."`   | 40+         | Loading spinner            |

### Severity Values (standardize these)

| Severity               | Usage | Token Mapping               |
| ---------------------- | ----- | --------------------------- |
| `severity="danger"`    | 53    | `--color-status-error`      |
| `severity="secondary"` | 52    | `--color-surface-secondary` |
| `severity="info"`      | 35    | `--color-status-info`       |
| `severity="success"`   | 30    | `--color-status-success`    |
| `severity="warn"`      | 20    | `--color-status-warning`    |

### Size Values (standardize these)

| Size            | Usage | Token Mapping               |
| --------------- | ----- | --------------------------- |
| `size="small"`  | 111   | `--button-height-sm` (32px) |
| `size="normal"` | 6     | `--button-height-md` (44px) |
| `size="large"`  | 10    | `--button-height-lg` (56px) |

### Common Icons (top 15)

| Icon                  | Usage |
| --------------------- | ----- |
| `pi pi-check`         | 58    |
| `pi pi-plus`          | 46    |
| `pi pi-times`         | 40    |
| `pi pi-refresh`       | 23    |
| `pi pi-trash`         | 17    |
| `pi pi-play`          | 16    |
| `pi pi-pencil`        | 12    |
| `pi pi-arrow-right`   | 12    |
| `pi pi-send`          | 11    |
| `pi pi-eye`           | 10    |
| `pi pi-external-link` | 8     |
| `pi pi-download`      | 8     |
| `pi pi-arrow-left`    | 8     |
| `pi pi-home`          | 6     |
| `pi pi-cog`           | 6     |

---

## Dialog Patterns Currently Used

| Property              | Usage | Standard Value   |
| --------------------- | ----- | ---------------- |
| `[modal]="true"`      | 58    | Always modal     |
| `[closable]="true"`   | 29    | Usually closable |
| `[draggable]="false"` | 19    | Not draggable    |
| `[resizable]="false"` | 12    | Not resizable    |

---

## Table Patterns Currently Used

| Property                      | Usage | Standard Value      |
| ----------------------------- | ----- | ------------------- |
| `[paginator]="true"`          | 12    | Enable pagination   |
| `[rows]="10"`                 | 11    | Default page size   |
| `[scrollable]="true"`         | 3     | Enable scroll       |
| `styleClass="p-datatable-sm"` | 10    | Small table variant |

---

## Form Input Patterns Currently Used

| Property              | Usage |
| --------------------- | ----- |
| `[showClear]="true"`  | 15    |
| `[filter]="true"`     | 15    |
| `styleClass="w-full"` | 53    |

---

## Avatar Patterns Currently Used

| Property            | Usage |
| ------------------- | ----- |
| `shape="circle"`    | 37    |
| Various size values | Mixed |

---

## Directive Usage

| Directive  | Usage | Notes                       |
| ---------- | ----- | --------------------------- |
| `pTooltip` | 137   | Standardize tooltip styling |
| `pButton`  | 29    | Button directive            |
| `pRipple`  | 18    | Ripple effect               |

---

## Required Token Mappings for PrimeNG

Based on the audit above, these PrimeNG CSS variables must map to design tokens:

### Button Tokens

```scss
// Map to your tokens
--p-button-primary-background: var(--ds-primary-green);
--p-button-primary-hover-background: var(--ds-primary-green-hover);
--p-button-primary-active-background: var(--primitive-primary-800);
--p-button-primary-color: var(--color-text-on-primary);
--p-button-border-radius: var(--radius-full); // 138 uses [rounded]
--p-button-padding-x: var(--space-6);
--p-button-padding-y: var(--space-3);

// Severity colors
--p-button-danger-background: var(--color-status-error);
--p-button-success-background: var(--color-status-success);
--p-button-warning-background: var(--color-status-warning);
--p-button-info-background: var(--color-status-info);
--p-button-secondary-background: var(--color-surface-secondary);

// Sizes
--p-button-sm-padding-x: var(--space-4);
--p-button-sm-padding-y: var(--space-2);
--p-button-lg-padding-x: var(--space-8);
--p-button-lg-padding-y: var(--space-4);
```

### Card Tokens (UPDATED Jan 2026 - BORDERLESS)

```scss
--p-card-background: var(--color-surface-primary);
--p-card-border-radius: var(--radius-lg); // 8px - Design System standard
--p-card-shadow: var(--shadow-sm);
--p-card-padding: var(--space-5);
--p-card-border: none; // BORDERLESS per user preference
--p-card-header-border-bottom: none; // No separator line
--p-card-footer-border-top: var(--border-1) solid var(--color-border-muted); // Footer only
```

### Tag Tokens

```scss
--p-tag-padding-x: var(--space-3);
--p-tag-padding-y: var(--space-2);
--p-tag-border-radius: var(--radius-md); // Standard rounded rectangle (NO PILL)
--p-tag-font-size: var(--font-body-sm);

// Severity colors (same as buttons)
--p-tag-danger-background: var(--color-status-error-subtle);
--p-tag-danger-color: var(--color-status-error);
// ... etc
```

### Dialog Tokens

```scss
--p-dialog-border-radius: var(--radius-xl);
--p-dialog-shadow: var(--shadow-3);
--p-dialog-header-padding: var(--space-5);
--p-dialog-content-padding: var(--space-5);
--p-dialog-footer-padding: var(--space-4) var(--space-5);
```

### Input Tokens

```scss
--p-inputtext-border-radius: var(--radius-lg);
--p-inputtext-padding-x: var(--space-4);
--p-inputtext-padding-y: var(--space-3);
--p-inputtext-border-color: var(--color-border-default);
--p-inputtext-focus-border-color: var(--color-border-focus);
--p-inputtext-focus-ring-color: var(--color-focus-ring);
```

### Table Tokens

```scss
--p-datatable-header-background: var(--color-surface-secondary);
--p-datatable-row-hover-background: var(--color-surface-hover);
--p-datatable-border-color: var(--color-border-muted);
```

### Progress Bar Tokens

```scss
--p-progressbar-height: 8px;
--p-progressbar-border-radius: var(--radius-full);
--p-progressbar-background: var(--color-surface-secondary);
--p-progressbar-value-background: var(--ds-primary-green);
```

---

## After Approval

Once CORE decisions are locked:

1. **Update this document** with final choices
2. **Create Stylelint config** to enforce rules
3. **Set up CSS layers** (Decision 7)
4. **Create folder structure** (Decision 17)
5. **Create PrimeNG token mapping file** (based on Appendix A)
6. **Begin Phase 2** - Token consolidation
7. **Begin Phase 3** - Component standardization

---

## Sign-Off

**CORE Decisions Approved by:** \***\*\*\*\*\***\_\_\_\_\***\*\*\*\*\***  
**Date:** \***\*\*\*\*\***\_\_\_\_\***\*\*\*\*\***

**OPERATIONAL Decisions Approved by:** \***\*\*\*\*\***\_\_\_\_\***\*\*\*\*\***  
**Date:** \***\*\*\*\*\***\_\_\_\_\***\*\*\*\*\***

---
