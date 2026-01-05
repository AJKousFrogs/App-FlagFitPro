# Card Shell Contract v1.0

**Status:** ✅ **LOCKED**  
**Effective Date:** January 4, 2026  
**Scope:** All card-like containers in FlagFit Pro Angular app  
**Benchmark:** Player Dashboard `progress-card` (canonical reference)

---

## 0. PR Review Checklist (Copy-Paste for PRs)

```markdown
### Card Shell Compliance ✅

- [ ] Uses `app-card-shell` for cards (not raw `p-card` styling)
- [ ] Interactive cards use `state="interactive"`
- [ ] Tables/charts in cards use `[flush]="true"`
- [ ] No `.p-card-*` styling in feature SCSS
- [ ] No hover rules on cards outside `card-shell`
- [ ] No raw shadows (`box-shadow: 0 ...`)
- [ ] No raw radius (`border-radius: 8px`)
- [ ] No raw padding on card containers
```

---

## 1. Purpose

This contract defines the **single source of truth** for card visual styling across FlagFit Pro. The Player Dashboard `progress-card` serves as the canonical reference. Any card that looks different elsewhere is a defect unless explicitly listed as an exception.

> **LOCKED: All card-like containers MUST use the `app-card-shell` component or match its token usage exactly.**

---

## 2. Card Container Baseline v1.0 (LOCKED)

### 2.1 Radius Token

| Property        | Token         | Value | Notes                     |
| --------------- | ------------- | ----- | ------------------------- |
| `border-radius` | `--radius-lg` | 8px   | All cards use this radius |

```scss
// ✅ LOCKED
border-radius: var(--radius-lg); // 8px

// ❌ FORBIDDEN
border-radius: 12px;
border-radius: var(--radius-xl);
border-radius: 16px;
```

---

### 2.2 Shadow Tokens

| State                        | Token         | Value                         |
| ---------------------------- | ------------- | ----------------------------- |
| **Rest**                     | `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.1)`   |
| **Hover (interactive only)** | `--shadow-md` | `0 4px 12px rgba(0,0,0,0.15)` |
| **Active/Pressed**           | `--shadow-sm` | Back to rest                  |

```scss
// ✅ LOCKED
box-shadow: var(--shadow-sm);

// Interactive cards only:
&:hover {
  box-shadow: var(--shadow-md);
}

&:active {
  box-shadow: var(--shadow-sm); // Back to rest
}

// ❌ FORBIDDEN - Raw shadows
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
box-shadow: var(--shadow-1); // Old alias
box-shadow: var(--shadow-2); // Old alias
```

---

### 2.3 Border Usage

| Property     | Token                   | Value              |
| ------------ | ----------------------- | ------------------ |
| Width        | `--border-1`            | 1px                |
| Color (rest) | `--color-border-subtle` | `rgba(0,0,0,0.05)` |

```scss
// ✅ LOCKED
border: var(--border-1) solid var(--color-border-subtle);

// ❌ FORBIDDEN - No border changes on hover for non-interactive cards
// Interactive cards: no green border on hover either (Dashboard baseline)

// ❌ FORBIDDEN
border: 1px solid #e0e0e0;
border: 2px solid var(--color-border-primary);
```

---

### 2.4 Padding Tokens

| Zone                 | Token                 | Value     | Notes                 |
| -------------------- | --------------------- | --------- | --------------------- |
| **Header** (default) | `--space-4`           | 16px      | All sides             |
| **Header** (compact) | `--space-3`           | 12px      | Compact density       |
| **Body** (default)   | `--space-4`           | 16px      | All sides             |
| **Body** (compact)   | `--space-3`           | 12px      | Compact density       |
| **Footer** (default) | `--space-3 --space-4` | 12px 16px | Vertical / Horizontal |
| **Footer** (compact) | `--space-2 --space-3` | 8px 12px  | Compact density       |

```scss
// ✅ REQUIRED - Default density
.card-header {
  padding: var(--space-4);
}
.card-body {
  padding: var(--space-4);
}
.card-footer {
  padding: var(--space-3) var(--space-4);
}

// ✅ REQUIRED - Compact density
.card-header--compact {
  padding: var(--space-3);
}
.card-body--compact {
  padding: var(--space-3);
}
.card-footer--compact {
  padding: var(--space-2) var(--space-3);
}

// ❌ FORBIDDEN
padding: 20px;
padding: 1.25rem;
```

---

### 2.5 Header Layout Rules

The card header follows a strict inline layout matching the Player Dashboard:

```
┌─────────────────────────────────────────────────────┐
│ [ICON]  TITLE                          [ACTIONS]    │
│                                                     │
│                    BODY                             │
└─────────────────────────────────────────────────────┘
```

> **CANONICAL REFERENCE:** Player Dashboard cards use inline icon + title, NO background, NO separator.

#### Header Structure

| Zone             | Position   | Contents                | Required |
| ---------------- | ---------- | ----------------------- | -------- |
| **Leading Icon** | Left       | Raw icon (no container) | Optional |
| **Title**        | After icon | Title text only         | Required |
| **Actions**      | Right      | Buttons, links, badges  | Optional |

#### Header Spacing

| Property            | Token                           | Value                            |
| ------------------- | ------------------------------- | -------------------------------- |
| Padding             | `--space-3 --space-4 --space-2` | 12px 16px 8px (top/sides/bottom) |
| Padding (compact)   | `--space-2 --space-3 --space-1` | 8px 12px 4px                     |
| Gap (icon to title) | `--space-2`                     | 8px                              |

#### Icon Specs (NO Container)

| Property  | Token                   | Value          |
| --------- | ----------------------- | -------------- |
| Font size | `--font-body-md`        | 16px           |
| Color     | `--color-brand-primary` | Primary green  |
| Opacity   | `0.85`                  | Slightly muted |

```scss
// ✅ CANONICAL - Player Dashboard style
.card-shell__header-icon {
  font-size: var(--font-body-md);
  color: var(--color-brand-primary);
  opacity: 0.85;
  flex-shrink: 0;
}

// ❌ FORBIDDEN - Icon containers
.card-header-icon {
  width: 40px;
  height: 40px;
  background: var(--ds-primary-green-subtle);
  border-radius: var(--radius-lg);
}
```

---

### 2.6 Header Separator Rules

**RULE: NO SEPARATOR between header and body.**

The Player Dashboard cards do NOT use a separator line between header and body. The header flows directly into the body content.

```scss
// ✅ CANONICAL - No separator
.card-shell__header {
  padding: var(--space-3) var(--space-4) var(--space-2);
  background: transparent; // Same as card body
  border-bottom: none; // NO separator
}

// ❌ FORBIDDEN
.card-header {
  border-bottom: 1px solid var(--color-border-default);
  background: var(--surface-secondary);
}
```

**Exception:** Footers MAY have a separator when needed for visual distinction:

```scss
.card-shell__footer {
  border-top: var(--border-1) solid var(--color-border-default);
  background: var(--surface-secondary);
}
```

---

### 2.7 Typography Rules

All typography MUST align with the Unified Typography System and match the Player Dashboard.

#### Card Title (CANONICAL)

| Property      | Token                    | Value                               |
| ------------- | ------------------------ | ----------------------------------- |
| Size          | `--font-size-h2`         | 18px                                |
| Weight        | `--font-weight-semibold` | 600                                 |
| Line-height   | `--line-height-tight`    | 1.2                                 |
| Color         | `--color-text-primary`   | Dark text                           |
| Margin-bottom | `--space-3`              | 12px (creates separation from body) |

```scss
// ✅ CANONICAL - Player Dashboard title style
.card-shell__title {
  margin: 0 0 var(--space-3) 0;
  font-size: var(--font-size-h2);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

// ❌ FORBIDDEN - Wrong size
.card-title {
  font-size: var(--font-h3-size); // 20px - too large
}
```

#### Card Subtitle

Subtitles are **NOT used** in the Player Dashboard canonical pattern. If needed:

| Property | Token                   | Value      |
| -------- | ----------------------- | ---------- |
| Size     | `--font-body-sm-size`   | 14px       |
| Weight   | `--font-weight-regular` | 400        |
| Color    | `--color-text-muted`    | Muted gray |

```scss
.card-shell__subtitle {
  margin: 0;
  font-size: var(--font-body-sm-size);
  font-weight: var(--font-weight-regular);
  color: var(--color-text-muted);
  line-height: var(--line-height-base);
}
```

#### Body Text

| Context        | Token                 | Value |
| -------------- | --------------------- | ----- |
| Default body   | `--font-body-size`    | 16px  |
| Secondary text | `--font-body-sm-size` | 14px  |
| Captions       | `--font-caption-size` | 12px  |

---

### 2.8 Hover Behavior

| Property   | Token                               | Specification                        |
| ---------- | ----------------------------------- | ------------------------------------ |
| Transform  | `translateY(-2px)`                  | Subtle lift (interactive cards only) |
| Shadow     | `--shadow-2`                        | Elevated shadow                      |
| Border     | `rgba(--ds-primary-green-rgb, 0.2)` | Green tint                           |
| Transition | `--motion-base --ease-standard`     | 200ms cubic-bezier                   |

```scss
// ✅ REQUIRED - Hover behavior
.card-shell {
  transition:
    transform var(--motion-base) var(--ease-standard),
    box-shadow var(--motion-base) var(--ease-standard),
    border-color var(--motion-base) var(--ease-standard);
}

// Non-interactive cards: shadow only
@media (hover: hover) and (pointer: fine) {
  .card-shell:hover {
    box-shadow: var(--shadow-2);
    border-color: rgba(var(--ds-primary-green-rgb), 0.2);
  }
}

// Interactive cards: lift + shadow
@media (hover: hover) and (pointer: fine) {
  .card-shell--interactive:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-2);
    border-color: var(--ds-primary-green);
  }
}

// ❌ FORBIDDEN
transform: translateY(-4px); // Too aggressive
transform: translateY(-8px); // Way too aggressive
transform: translateY(-12px); // Never
transform: scale(1.02); // Never use scale on cards
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); // Raw shadow values
```

#### Interaction Enforcement Rules (STRICT)

**Non-interactive cards:**

- Shadow change on hover: ✅ `--shadow-2`
- Border tint on hover: ✅ `rgba(--ds-primary-green-rgb, 0.2)`
- Transform on hover: ❌ NEVER
- Cursor: `default`

**Interactive cards (`state="interactive"`):**

- Shadow change on hover: ✅ `--shadow-2`
- Border color on hover: ✅ `--ds-primary-green`
- Transform on hover: ✅ `translateY(-2px)` ONLY
- Cursor: `pointer`

**Forbidden in feature SCSS:**

```scss
// ❌ ALL of these are forbidden in feature SCSS files
.my-card:hover {
  transform: translateY(-4px);
}
.my-card:hover {
  box-shadow: var(--shadow-lg);
}
.my-card {
  transition: transform 0.2s;
}
.my-card:hover .icon {
  transform: scale(1.1);
}
```

---

### 2.9 Focus Ring Behavior

| Property       | Token                    | Value       |
| -------------- | ------------------------ | ----------- |
| Outline width  | `--focus-outline-width`  | 2px         |
| Outline offset | `--focus-outline-offset` | 2px         |
| Outline color  | `--ds-primary-green`     | Brand green |
| Ring shadow    | `--focus-ring-shadow`    | Green glow  |

```scss
// ✅ REQUIRED - Focus visible only
.card-shell--interactive:focus-visible {
  outline: var(--focus-outline-width) solid var(--ds-primary-green);
  outline-offset: var(--focus-outline-offset);
  box-shadow: var(--focus-ring-shadow);
}

// Remove default focus (keyboard only)
.card-shell--interactive:focus:not(:focus-visible) {
  outline: none;
}

// ❌ FORBIDDEN
&:focus { ... }  // Never use :focus, always :focus-visible
```

---

## 3. Background Colors

| Context         | Token                 | Value                    |
| --------------- | --------------------- | ------------------------ |
| Card background | `--surface-primary`   | White                    |
| Header          | `transparent`         | Same as card body        |
| Footer          | `--surface-secondary` | Off-white (when present) |

```scss
// ✅ CANONICAL - Transparent header
.card-shell {
  background: var(--surface-primary);
}

.card-shell__header {
  background: transparent; // NO background color
}

.card-shell__footer {
  background: var(--surface-secondary); // Footer can have background
}
```

---

## 4. Density Options (ENFORCED)

> **RULE:** All cards MUST use only these three padding modes. No custom padding in feature SCSS.

The card shell supports **three** padding modes:

| Mode        | Input               | Header Padding                  | Body Padding       | Use Case                   |
| ----------- | ------------------- | ------------------------------- | ------------------ | -------------------------- |
| **Default** | `density="default"` | `--space-3 --space-4 --space-2` | `--space-4` (16px) | Standard cards, dashboards |
| **Compact** | `density="compact"` | `--space-2 --space-3 --space-1` | `--space-3` (12px) | Data tables, dense lists   |
| **Flush**   | `[flush]="true"`    | (unchanged)                     | `0`                | Tables, charts, media      |

### Enforcement Rules

```scss
// ✅ ALLOWED - Use card-shell inputs
<app-card-shell density="default">...</app-card-shell>
<app-card-shell density="compact">...</app-card-shell>
<app-card-shell [flush]="true">...</app-card-shell>

// ❌ FORBIDDEN - Feature SCSS padding overrides
::ng-deep .p-card-body {
  padding: var(--space-5);
}
::ng-deep .p-card-content {
  padding: 0;
}
.my-card {
  padding: 20px;
}
```

### Classification Guide

| Card Type                | Density | Flush |
| ------------------------ | ------- | ----- |
| Dashboard cards          | default | false |
| Stat/metric cards        | default | false |
| Schedule cards           | default | false |
| Data tables              | compact | true  |
| Dense lists              | compact | false |
| Charts/graphs            | default | true  |
| Media cards (thumbnails) | default | true  |
| Form cards               | default | false |

Both densities maintain the same visual language (radius, shadow, border, typography ratios).

---

## 5. State Options

| State           | Visual Treatment           | Interactive |
| --------------- | -------------------------- | ----------- |
| **Default**     | Standard styling           | No          |
| **Interactive** | Cursor pointer, hover lift | Yes         |
| **Disabled**    | Opacity 0.5, no hover      | No          |

```scss
.card-shell--disabled {
  opacity: 0.5;
  pointer-events: none;
}
```

---

## 6. PR Review Checklist

Before merging any card-related code, verify:

### Shell Tokens

- [ ] Uses `--radius-xl` (12px) for border-radius
- [ ] Uses `--shadow-1` at rest, `--shadow-2` on hover
- [ ] Uses `--border-1` with `--color-border-default`
- [ ] Uses `--surface-primary` for background
- [ ] Uses `--surface-secondary` for header/footer

### Spacing (STRICT)

- [ ] Uses `density="default"` OR `density="compact"` - no other values
- [ ] Uses `[flush]="true"` for zero-padding content (tables, charts)
- [ ] **NO** `::ng-deep .p-card-body { padding: ... }` in feature SCSS
- [ ] **NO** `::ng-deep .p-card-content { padding: ... }` in feature SCSS
- [ ] **NO** raw padding values (px, rem) on card containers
- [ ] **NO** inline style padding on card elements

### Typography

- [ ] Title uses `--font-h3-size` + `--font-weight-semibold`
- [ ] Subtitle uses `--font-body-sm-size` + `--color-text-muted`
- [ ] No raw font sizes

### Hover/Focus

- [ ] Hover uses `--shadow-2` + green border tint
- [ ] Interactive cards use `translateY(-2px)` lift
- [ ] Focus uses `:focus-visible` only
- [ ] Focus ring uses `--ds-primary-green`

### Forbidden Patterns

- [ ] No `::ng-deep` for card styling in feature components
- [ ] No `.p-card`, `.p-card-body`, `.p-card-content` overrides in feature SCSS
- [ ] No raw box-shadow values
- [ ] No raw border-radius values
- [ ] No inline styles for card shell properties
- [ ] No custom padding values - use `density` and `flush` inputs only

---

## 7. Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│  CARD SHELL CONTRACT - QUICK REFERENCE                      │
├─────────────────────────────────────────────────────────────┤
│  Radius:     --radius-xl (12px)                             │
│  Shadow:     --shadow-1 (rest) → --shadow-2 (hover)         │
│  Border:     --border-1 + --color-border-default            │
│  Header:     NO background, NO separator                    │
│  Header pad: --space-3 --space-4 --space-2 (top/sides/bot)  │
│  Body pad:   --space-4 (default) | --space-3 (compact)      │
│  Icon:       --font-body-md, --color-brand-primary, 0.85    │
│  Title:      --font-size-h2 (18px) / --font-weight-semibold │
│  Hover lift: translateY(-2px) (interactive only)            │
│  Focus:      :focus-visible + --ds-primary-green ring       │
│  Transition: --motion-base + --ease-standard                │
└─────────────────────────────────────────────────────────────┘
```

### 7.1 Final Canonical Header Markup

The canonical card header (Player Dashboard reference):

```html
<!-- CANONICAL: app-card-shell usage -->
<app-card-shell title="Today's Schedule" headerIcon="pi-calendar">
  <!-- Body content -->
</app-card-shell>

<!-- Renders as: -->
<article class="card-shell">
  <header class="card-shell__header">
    <div class="card-shell__header-content">
      <span class="card-shell__header-icon">
        <i class="pi pi-calendar"></i>
      </span>
      <div class="card-shell__header-text">
        <h3 class="card-shell__title">Today's Schedule</h3>
      </div>
    </div>
    <div class="card-shell__header-actions">
      <!-- Optional: header-actions slot content -->
    </div>
  </header>
  <div class="card-shell__body">
    <!-- Body content -->
  </div>
</article>
```

**Key characteristics:**

- Icon is a raw `<span>` with `<i>` inside (no container background)
- Icon uses `--font-body-md` (16px), `--color-brand-primary`, `opacity: 0.85`
- Title uses `--font-size-h2` (18px), `--font-weight-semibold`
- Header has NO background color (transparent)
- Header has NO separator (no `border-bottom`)
- Header padding: `--space-3 --space-4 --space-2` (12px 16px 8px)

---

## 8. Empty State Standard (CANONICAL)

**RULE: All card empty states MUST use the `.card-empty-state` classes defined in card-shell.component.scss.**

No feature may define its own `.empty-state`, `.no-data`, or similar styles.

### 8.1 Empty State Variants

| Variant     | Class                        | Use Case                                 |
| ----------- | ---------------------------- | ---------------------------------------- |
| **Default** | `.card-empty-state`          | Standard cards (180px min-height)        |
| **Compact** | `.card-empty-state--compact` | Small cards, sidebars (120px min-height) |
| **Inline**  | `.card-empty-state--inline`  | Horizontal layout, minimal space         |

### 8.2 Empty State Structure

```
┌─────────────────────────────────────────────────────┐
│ [ICON] Title                    [ACTIONS]           │  ← Header
├─────────────────────────────────────────────────────┤
│                                                     │
│                   [ICON] (optional)                 │
│                                                     │
│                   Title Line                        │
│               Supporting text line                  │
│                                                     │
│              [Action Button] (optional)             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 8.3 Empty State Tokens

| Element              | Token                               | Default    | Compact |
| -------------------- | ----------------------------------- | ---------- | ------- |
| Container padding    | `--space-6` / `--space-4`           | 24px       | 16px    |
| Container min-height | `180px` / `120px`                   | 180px      | 120px   |
| Icon size            | `--icon-3xl` / `--icon-2xl`         | 48px       | 32px    |
| Icon color           | `--color-text-muted`                | Muted gray | Same    |
| Icon opacity         | `0.5`                               | 50%        | Same    |
| Icon margin-bottom   | `--space-3` / `--space-2`           | 12px       | 8px     |
| Title size           | `--font-body-md` / `--font-body-sm` | 16px       | 14px    |
| Title weight         | `--font-weight-medium`              | 500        | Same    |
| Title color          | `--color-text-primary`              | Dark text  | Same    |
| Title margin-bottom  | `--space-1`                         | 4px        | Same    |
| Text size            | `--font-body-sm` / `--font-caption` | 14px       | 12px    |
| Text color           | `--color-text-muted`                | Muted gray | Same    |
| Text max-width       | `280px` / `240px`                   | 280px      | 240px   |
| Action margin-top    | `--space-3` / `--space-2`           | 12px       | 8px     |

### 8.4 Empty State Markup (CANONICAL)

```html
<!-- DEFAULT: Standard empty state inside card body -->
<div class="card-empty-state">
  <div class="card-empty-state__icon">
    <i class="pi pi-calendar"></i>
  </div>
  <div class="card-empty-state__content">
    <p class="card-empty-state__title">No training scheduled</p>
    <p class="card-empty-state__text">
      Enjoy your rest day, or add a session to get started.
    </p>
  </div>
  <div class="card-empty-state__action">
    <app-button variant="text" routerLink="/training">View Schedule</app-button>
  </div>
</div>

<!-- COMPACT: For smaller cards -->
<div class="card-empty-state card-empty-state--compact">
  <div class="card-empty-state__icon">
    <i class="pi pi-chart-line"></i>
  </div>
  <div class="card-empty-state__content">
    <p class="card-empty-state__title">Not enough data</p>
    <p class="card-empty-state__text">Complete more sessions to see trends.</p>
  </div>
</div>

<!-- INLINE: Horizontal layout for minimal space -->
<div class="card-empty-state card-empty-state--inline">
  <div class="card-empty-state__icon">
    <i class="pi pi-inbox"></i>
  </div>
  <div class="card-empty-state__content">
    <p class="card-empty-state__title">No notifications</p>
    <p class="card-empty-state__text">You're all caught up!</p>
  </div>
</div>
```

### 8.5 Forbidden Patterns

```html
<!-- ❌ FORBIDDEN: Custom empty state classes -->
<div class="empty-state">...</div>
<div class="no-data">...</div>
<div class="empty-message">...</div>

<!-- ❌ FORBIDDEN: p-message for empty states -->
<p-message severity="info">No data available</p-message>

<!-- ❌ FORBIDDEN: Plain text -->
<p>No sessions found</p>
<span>Coming soon</span>

<!-- ✅ REQUIRED: Use card-empty-state classes -->
<div class="card-empty-state">...</div>
```

### 8.4 Empty State SCSS

```scss
.card-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-6);
  min-height: 200px;
}

.card-empty-state__icon {
  font-size: var(--icon-3xl);
  color: var(--color-text-muted);
  opacity: 0.5;
  margin-bottom: var(--space-4);
}

.card-empty-state__title {
  margin: 0 0 var(--space-2) 0;
  font-size: var(--font-h3-size);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  line-height: var(--line-height-snug);
}

.card-empty-state__text {
  margin: 0;
  font-size: var(--font-body-sm-size);
  color: var(--color-text-muted);
  line-height: var(--line-height-base);
  max-width: 320px;
}

.card-empty-state__action {
  margin-top: var(--space-4);
}
```

### 8.5 Empty State Examples

#### Today's Schedule (empty)

```html
<app-card-shell title="Today's Schedule" headerIcon="pi-calendar">
  <div class="card-empty-state">
    <div class="card-empty-state__icon">
      <i class="pi pi-calendar"></i>
    </div>
    <h4 class="card-empty-state__title">No training scheduled</h4>
    <p class="card-empty-state__text">
      Enjoy your rest day, or add a session to get started.
    </p>
    <div class="card-empty-state__action">
      <app-button variant="text" iconLeft="pi-plus">Add Session</app-button>
    </div>
  </div>
</app-card-shell>
```

#### Training Mix (empty)

```html
<app-card-shell title="Training Mix" headerIcon="pi-chart-pie">
  <div class="card-empty-state">
    <div class="card-empty-state__icon">
      <i class="pi pi-chart-pie"></i>
    </div>
    <h4 class="card-empty-state__title">No training data yet</h4>
    <p class="card-empty-state__text">
      Complete your first session to see your training breakdown.
    </p>
  </div>
</app-card-shell>
```

#### Performance Trend (empty)

```html
<app-card-shell title="Performance Trend" headerIcon="pi-trending-up">
  <div class="card-empty-state">
    <div class="card-empty-state__icon">
      <i class="pi pi-chart-line"></i>
    </div>
    <h4 class="card-empty-state__title">Not enough data</h4>
    <p class="card-empty-state__text">
      Complete more sessions to see your performance trend over time.
    </p>
    <div class="card-empty-state__action">
      <app-button variant="text" routerLink="/training"
        >View Training</app-button
      >
    </div>
  </div>
</app-card-shell>
```

---

## 9. Stat Block Standard (CANONICAL)

**RULE: All stat/metric displays MUST use the canonical stat block pattern from Player Dashboard.**

No feature may define custom `.stat-value`, `.metric-value`, `.stat-label`, or similar typography styles.

### 9.1 Canonical Stat Block Structure

```
┌─────────────────────────────────────────────────────────────┐
│ [ICON]  VALUE                                    [TAG]       │
│         Label                                               │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Stat Block Tokens (LOCKED)

| Element                   | Token                      | Value      | Notes               |
| ------------------------- | -------------------------- | ---------- | ------------------- |
| **Value (default)**       | `--font-size-metric-md`    | 24px       | Primary KPI display |
| **Value (large)**         | `--font-size-metric-lg`    | 32px       | Hero stats only     |
| **Value weight**          | `--font-weight-bold`       | 700        | Always bold         |
| **Value color**           | `--color-text-primary`     | Dark text  | Default             |
| **Value line-height**     | `--line-height-tight`      | 1.2        | Compact             |
| **Label**                 | `--font-size-caption`      | 13px       | Helper text         |
| **Label weight**          | `--font-weight-regular`    | 400        | Regular             |
| **Label color**           | `--color-text-muted`       | Muted gray | Subdued             |
| **Label letter-spacing**  | `--letter-spacing-caption` | 0.04em     | Uppercase labels    |
| **Label text-transform**  | `uppercase`                | UPPERCASE  | Always              |
| **Icon container**        | `--space-10` (40px)        | 40px       | Square icon bg      |
| **Icon border-radius**    | `--radius-md`              | 8px        | Rounded corners     |
| **Gap (icon to content)** | `--space-3`                | 12px       | Consistent          |
| **Gap (value to label)**  | `--space-1`                | 4px        | Tight               |

### 9.3 Stat Block Variants

| Variant     | Value Size                     | Use Case               |
| ----------- | ------------------------------ | ---------------------- |
| **Default** | `--font-size-metric-md` (24px) | Dashboard stats, cards |
| **Large**   | `--font-size-metric-lg` (32px) | Hero/highlight stats   |
| **Compact** | `--font-size-h2` (18px)        | Dense grids, tables    |

### 9.4 Canonical Stat Block Markup

```html
<!-- CANONICAL: Player Dashboard stat card pattern -->
<div class="stat-block">
  <div class="stat-block__icon stat-block__icon--success">
    <i class="pi pi-heart"></i>
  </div>
  <div class="stat-block__content">
    <span class="stat-block__value">85%</span>
    <span class="stat-block__label">READINESS</span>
  </div>
  <p-tag
    value="Optimal"
    severity="success"
    styleClass="stat-block__tag"
  ></p-tag>
</div>

<!-- LARGE variant for hero stats -->
<div class="stat-block stat-block--large">
  <div class="stat-block__content">
    <span class="stat-block__value">1.24</span>
    <span class="stat-block__label">ACWR</span>
  </div>
</div>

<!-- COMPACT variant for dense layouts -->
<div class="stat-block stat-block--compact">
  <div class="stat-block__content">
    <span class="stat-block__value">7</span>
    <span class="stat-block__label">DAY STREAK</span>
  </div>
</div>
```

### 9.5 Stat Block SCSS (CANONICAL)

```scss
// ============================================
// STAT BLOCK - CANONICAL (Player Dashboard)
// Single source of truth for stat/metric displays
// ============================================

.stat-block {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.stat-block__icon {
  width: var(--space-10); // 40px
  height: var(--space-10);
  min-width: var(--space-10);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-body-lg);
  flex-shrink: 0;

  // Icon color variants
  &--success {
    background: rgba(var(--ds-primary-green-rgb), 0.08);
    color: var(--color-brand-primary);
  }
  &--warning {
    background: rgba(var(--color-status-warning-rgb), 0.08);
    color: var(--color-status-warning);
  }
  &--error {
    background: rgba(var(--color-status-error-rgb), 0.08);
    color: var(--color-status-error);
  }
  &--info {
    background: rgba(var(--color-status-info-rgb), 0.08);
    color: var(--color-status-info);
  }
}

.stat-block__content {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: var(--space-1);
}

.stat-block__value {
  font-size: var(--font-size-metric-md); // 24px
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  line-height: var(--line-height-tight);
}

.stat-block__label {
  font-size: var(--font-size-caption); // 13px
  font-weight: var(--font-weight-regular);
  color: var(--color-text-muted);
  line-height: var(--line-height-base);
  letter-spacing: var(--letter-spacing-caption);
  text-transform: uppercase;
}

// Large variant (hero stats)
.stat-block--large .stat-block__value {
  font-size: var(--font-size-metric-lg); // 32px
}

// Compact variant (dense layouts)
.stat-block--compact .stat-block__value {
  font-size: var(--font-size-h2); // 18px
}

.stat-block__tag {
  flex-shrink: 0;
}
```

### 9.6 Forbidden Stat Patterns

```scss
// ❌ FORBIDDEN: Custom stat typography in feature SCSS
.stat-value {
  font-size: var(--font-size-h1); // Wrong token
  font-size: var(--text-3xl); // Non-standard token
  font-size: var(--font-size-h2); // Should use metric tokens
  font-weight: var(--font-weight-semibold); // Should be bold
}

.metric-value {
  font-size: 1.5rem; // Raw value - forbidden
  font-size: 24px; // Raw value - forbidden
}

// ❌ FORBIDDEN: Inconsistent label styles
.stat-label {
  text-transform: capitalize; // Should be uppercase
  letter-spacing: normal; // Should use caption spacing
  font-size: var(--font-size-h4); // Wrong token
}

// ✅ REQUIRED: Use stat-block classes
.stat-block__value {
  font-size: var(--font-size-metric-md);
}
.stat-block__label {
  font-size: var(--font-size-caption);
}
```

### 9.7 PR Review Checklist - Stats

- [ ] Uses `.stat-block` classes for all stat displays
- [ ] Value uses `--font-size-metric-md` or `--font-size-metric-lg`
- [ ] Value uses `--font-weight-bold`
- [ ] Label uses `--font-size-caption` + `uppercase`
- [ ] Label uses `--letter-spacing-caption`
- [ ] **NO** custom `.stat-value` or `.metric-value` in feature SCSS
- [ ] **NO** raw font sizes (px, rem) for stat values
- [ ] **NO** `--font-size-h1`, `--font-size-h2` for stat values

---

## 10. Usage Examples

### 10.1 Today's Schedule Card

```html
<app-card-shell
  title="Today's Schedule"
  subtitle="3 sessions planned"
  headerIcon="pi-calendar"
  headerIconVariant="primary"
  [hasFooter]="true"
>
  <!-- Header Actions -->
  <ng-container header-actions>
    <app-button variant="text" size="sm" iconRight="pi-external-link">
      Full Day
    </app-button>
  </ng-container>

  <!-- Body Content -->
  <div class="schedule-list">
    <div class="schedule-item">
      <span class="time">8:00 AM</span>
      <span class="title">Morning Warmup</span>
      <span class="duration">30 min</span>
    </div>
    <div class="schedule-item">
      <span class="time">10:00 AM</span>
      <span class="title">Strength Training</span>
      <span class="duration">60 min</span>
    </div>
  </div>

  <!-- Footer -->
  <ng-container footer>
    <app-button variant="text" block routerLink="/todays-practice">
      View Full Schedule
    </app-button>
  </ng-container>
</app-card-shell>
```

### 9.2 Morning Check-in Card

```html
<app-card-shell
  title="Morning Check-in"
  subtitle="How are you feeling today?"
  headerIcon="pi-sun"
  headerIconVariant="warning"
  state="interactive"
  (cardClick)="openCheckin()"
>
  <div class="checkin-preview">
    <div class="checkin-status">
      <i class="pi pi-check-circle"></i>
      <span>Completed at 7:45 AM</span>
    </div>
    <div class="readiness-score">
      <span class="score">85%</span>
      <span class="label">Readiness</span>
    </div>
  </div>
</app-card-shell>
```

### 9.3 Dense Table Card (Player Statistics)

```html
<app-card-shell
  title="Player Statistics"
  headerIcon="pi-users"
  density="compact"
  [flush]="true"
  [hasFooter]="true"
>
  <!-- Header Actions -->
  <ng-container header-actions>
    <app-button variant="text" size="sm" icon="pi-filter">Filter</app-button>
    <app-button variant="text" size="sm" icon="pi-download">Export</app-button>
  </ng-container>

  <!-- Flush body for table -->
  <p-table [value]="players" styleClass="p-datatable-sm">
    <ng-template pTemplate="header">
      <tr>
        <th>Player</th>
        <th>Position</th>
        <th>Performance</th>
        <th>Attendance</th>
      </tr>
    </ng-template>
    <ng-template pTemplate="body" let-player>
      <tr>
        <td>{{ player.name }}</td>
        <td>{{ player.position }}</td>
        <td>{{ player.performance }}%</td>
        <td>{{ player.attendance }}%</td>
      </tr>
    </ng-template>
  </p-table>

  <!-- Footer -->
  <ng-container footer>
    <div class="table-footer">
      <span class="count">Showing 10 of 25 players</span>
      <app-button variant="text" size="sm">View All</app-button>
    </div>
  </ng-container>
</app-card-shell>
```

---

## 11. Migration Patterns

### 10.1 From `p-card` with styleClass

**Before:**

```html
<p-card styleClass="custom-card schedule-card">
  <ng-template pTemplate="header">
    <div class="card-header-custom">
      <i class="pi pi-calendar"></i>
      <span>Today's Schedule</span>
    </div>
  </ng-template>
  <div class="schedule-content">...</div>
</p-card>
```

**After:**

```html
<app-card-shell title="Today's Schedule" headerIcon="pi-calendar">
  <div class="schedule-content">...</div>
</app-card-shell>
```

**Delete from SCSS:**

```scss
// DELETE ALL OF THIS
:host ::ng-deep .custom-card { ... }
:host ::ng-deep .schedule-card { ... }
.card-header-custom { ... }
```

### 10.2 From `div` with card styling

**Before:**

```html
<div class="stat-card">
  <div class="stat-header">
    <i class="pi pi-heart"></i>
    <span>Readiness</span>
  </div>
  <div class="stat-body">
    <span class="value">85%</span>
  </div>
</div>
```

**After:**

```html
<app-card-shell
  title="Readiness"
  headerIcon="pi-heart"
  headerIconVariant="error"
  density="compact"
>
  <div class="stat-value">85%</div>
</app-card-shell>
```

### 10.3 From feature-specific panel

**Before:**

```html
<div class="analytics-panel">
  <div class="panel-header">
    <h3>Performance Trend</h3>
    <button class="panel-action">Export</button>
  </div>
  <div class="panel-content">
    <p-chart type="line" [data]="chartData"></p-chart>
  </div>
</div>
```

**After:**

```html
<app-card-shell title="Performance Trend" headerIcon="pi-trending-up">
  <ng-container header-actions>
    <app-button variant="text" size="sm" icon="pi-download">Export</app-button>
  </ng-container>

  <p-chart type="line" [data]="chartData"></p-chart>
</app-card-shell>
```

---

## 12. Table-in-Card Standard (CANONICAL)

**RULE: Tables inside cards MUST use the canonical table-in-card pattern.**

No feature may define custom table padding, header spacing, or density overrides inside cards.

### 12.1 Table-in-Card Structure

```
┌─────────────────────────────────────────────────────────────┐
│ [ICON] Card Title                              [ACTIONS]    │ ← Card Header
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ COLUMN A    │ COLUMN B    │ COLUMN C    │ ACTIONS      │ │ ← Table Header
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Row 1       │ Data        │ Data        │ [Edit]       │ │ ← Table Body
│ │ Row 2       │ Data        │ Data        │ [Edit]       │ │
│ │ Row 3       │ Data        │ Data        │ [Edit]       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 12.2 Table-in-Card Rules

| Rule                             | Token/Value                                 | Notes                              |
| -------------------------------- | ------------------------------------------- | ---------------------------------- |
| **Card body padding**            | `0` (flush)                                 | Table fills card body edge-to-edge |
| **Table header bg**              | `--surface-secondary`                       | Matches card header                |
| **Table header padding**         | `--space-3 --space-4`                       | Default density                    |
| **Table header typography**      | `--font-label-size` (14px)                  | Uppercase, `--letter-spacing-wide` |
| **Table body padding**           | `--space-4`                                 | Default density                    |
| **Table body padding (compact)** | `--space-2 --space-3`                       | Compact density                    |
| **Row hover**                    | `--ds-primary-green-ultra-subtle`           | Subtle brand tint                  |
| **Row border**                   | `--border-1 solid --color-border-secondary` | Bottom border only                 |
| **First/last row radius**        | Inherit from card                           | Rounded corners                    |

### 12.3 Density Variants

| Density     | Header Padding        | Body Padding          | Row Height | Use Case              |
| ----------- | --------------------- | --------------------- | ---------- | --------------------- |
| **Default** | `--space-3 --space-4` | `--space-4`           | 52px       | Standard tables       |
| **Compact** | `--space-2 --space-3` | `--space-2 --space-3` | 40px       | Dense data, many rows |

### 12.4 Table-in-Card Markup (CANONICAL)

```html
<!-- CANONICAL: Table inside card shell with flush body -->
<app-card-shell
  title="Player Attendance Statistics"
  headerIcon="pi-users"
  [flush]="true"
>
  <p-table
    [value]="playerStats()"
    [paginator]="true"
    [rows]="10"
    styleClass="table-default"
  >
    <ng-template pTemplate="header">
      <tr>
        <th>Player</th>
        <th>Attendance Rate</th>
        <th>Streak</th>
      </tr>
    </ng-template>
    <ng-template pTemplate="body" let-stat>
      <tr>
        <td>{{ stat.name }}</td>
        <td>{{ stat.rate }}%</td>
        <td>{{ stat.streak }}</td>
      </tr>
    </ng-template>
  </p-table>
</app-card-shell>

<!-- COMPACT: Dense table with many rows -->
<app-card-shell
  title="Game History"
  headerIcon="pi-calendar"
  [flush]="true"
  density="compact"
>
  <p-table [value]="games()" styleClass="table-compact">
    <!-- ... -->
  </p-table>
</app-card-shell>
```

### 12.5 Table-in-Card SCSS (Global)

These styles are defined in `_tables.scss` and `primeng-theme.scss`:

```scss
// Card shell with flush body for tables
.card-shell__body--flush {
  padding: 0;
}

// Table inside card - first row corners
.card-shell__body--flush .p-datatable {
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  overflow: hidden;
}

// Remove table's own border when inside card
.card-shell__body--flush .p-datatable {
  border: none;
  box-shadow: none;
}
```

### 12.6 Forbidden Table-in-Card Patterns

```scss
// ❌ FORBIDDEN: Custom padding around table in card
.my-card ::ng-deep .p-card-body {
  padding: 0;  // Don't do this - use [flush]="true"
}

// ❌ FORBIDDEN: Custom table header styles in feature
.my-card ::ng-deep .p-datatable-thead > tr > th {
  padding: var(--space-5);  // Don't override globally
  background: custom-color;
}

// ❌ FORBIDDEN: Wrapper div with padding
<div class="table-wrapper" style="padding: 16px">
  <p-table>...</p-table>
</div>

// ✅ REQUIRED: Use card shell with flush
<app-card-shell [flush]="true">
  <p-table styleClass="table-default">...</p-table>
</app-card-shell>
```

### 12.7 PR Review Checklist - Tables in Cards

- [ ] Card uses `[flush]="true"` when containing a table
- [ ] Table uses `styleClass="table-default"` or `styleClass="table-compact"`
- [ ] **NO** `::ng-deep .p-datatable-*` overrides in feature SCSS
- [ ] **NO** wrapper divs with padding around tables
- [ ] **NO** custom header/body padding values
- [ ] Table inherits card's border-radius at bottom corners

---

## 13. Exceptions

### 13.1 Allowed Exceptions

| Component        | Deviation | Reason | Ticket |
| ---------------- | --------- | ------ | ------ |
| _None currently_ | —         | —      | —      |

**Default assumption:** No exceptions are needed. If you believe an exception is required, document it with:

1. **Ticket ID** - Link to issue tracker
2. **Reason** - Why the standard doesn't work
3. **Scope** - Which component/feature only
4. **Owner** - Who is responsible
5. **Removal date** - When to revisit

### 11.2 Exception Request Template

```markdown
## Exception Request

**Ticket:** #XXX
**Component:** feature-name
**Requested by:** @developer

### Deviation

[What styling differs from Card Shell Contract]

### Reason

[Why the standard card shell doesn't work]

### Scope

[Which specific component/feature only]

### Proposed removal date

[When we expect to remove this exception]

### Approval

- [ ] Design System Lead
- [ ] Tech Lead
```

---

**Document Version:** 1.0  
**Last Updated:** January 4, 2026  
**Author:** Design System Team
