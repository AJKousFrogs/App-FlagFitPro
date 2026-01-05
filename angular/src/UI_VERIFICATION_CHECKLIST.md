# UI Design System Verification Checklist

**Last Updated:** January 5, 2026  
**Reference:** `docs/DESIGN_SYSTEM_RULES.md`

---

## Pre-Commit Verification

Before committing any UI changes, verify:

### 1. Token Usage (Mandatory)

- [ ] **No hex colors** outside `design-system-tokens.scss`

  ```bash
  # Check for hex colors in feature files
  grep -rn "#[0-9a-fA-F]\{3,6\}" --include="*.scss" --include="*.ts" src/app/features/
  ```

- [ ] **No raw spacing values** (px/rem for padding, margin, gap)

  ```bash
  # Should use var(--space-*) tokens
  grep -rn "padding:\s*\d\+px\|margin:\s*\d\+px\|gap:\s*\d\+px" src/app/features/
  ```

- [ ] **No raw font sizes** (px/rem for font-size)

  ```bash
  # Should use var(--font-*) tokens
  grep -rn "font-size:\s*\d\+px" src/app/features/
  ```

- [ ] **No raw border-radius** (especially 10px, 14px, 100px, 9999px)

  ```bash
  # Should use var(--radius-*) tokens
  grep -rn "border-radius:\s*\(10\|14\|100\|9999\)px" src/app/
  ```

- [ ] **No raw box-shadow values**
  ```bash
  # Should use var(--shadow-*) tokens
  grep -rn "box-shadow:\s*[^v]" src/app/features/
  ```

---

### 2. CSS Architecture (Mandatory)

- [ ] **No `!important`** outside `@layer overrides`

  ```bash
  grep -rn "!important" --include="*.scss" --include="*.ts" src/app/features/
  ```

- [ ] **No `::ng-deep`** in feature components
  - Allowed ONLY in: `primeng/*.scss`, `@layer overrides`

  ```bash
  grep -rn "::ng-deep" --include="*.scss" --include="*.ts" src/app/features/
  ```

- [ ] **No direct `.p-*` styling** in feature SCSS
  - PrimeNG overrides go in `primeng/_brand-overrides.scss`

  ```bash
  grep -rn "\.p-[a-z]" --include="*.scss" src/app/features/
  ```

- [ ] **No `transition: all`**
  ```bash
  grep -rn "transition:\s*all" src/app/
  ```

---

### 3. Spacing Grid (8-point)

| Token       | Value | Use Case                   |
| ----------- | ----- | -------------------------- |
| `--space-1` | 4px   | Tight gaps, icon padding   |
| `--space-2` | 8px   | Small gaps, list items     |
| `--space-3` | 12px  | Component gaps             |
| `--space-4` | 16px  | Card padding, section gaps |
| `--space-5` | 20px  | Large gaps                 |
| `--space-6` | 24px  | Section spacing            |
| `--space-8` | 32px  | Major sections             |

**Verify:** All spacing uses tokens from this scale.

---

### 4. Radius Grid (Locked)

| Token           | Value  | Use Case                |
| --------------- | ------ | ----------------------- |
| `--radius-sm`   | 2px    | Small elements, inputs  |
| `--radius-md`   | 6px    | Buttons, tags           |
| `--radius-lg`   | 8px    | Cards, panels (DEFAULT) |
| `--radius-xl`   | 12px   | Large cards, dialogs    |
| `--radius-2xl`  | 16px   | Hero cards              |
| `--radius-full` | 9999px | Avatars ONLY            |

**Forbidden:** 10px, 14px, 100px (pill shapes for buttons/tags)

---

### 5. Typography Tokens (Unified System)

| Element | Token                  | Size    | Weight  |
| ------- | ---------------------- | ------- | ------- |
| H1      | `--font-h1-*`          | 32px    | 700     |
| H2      | `--font-h2-*`          | 24px    | 600     |
| H3      | `--font-h3-*`          | 20px    | 400/600 |
| H4      | `--font-h4-*`          | 16px    | 300     |
| Body    | `--font-body-*`        | 16px    | 400     |
| Body-sm | `--font-body-sm-*`     | 14px    | 400     |
| Label   | `--font-label-*`       | 14px    | 600     |
| Caption | `--font-caption-*`     | 12px    | 400     |
| Metric  | `--font-size-metric-*` | 24-32px | 700     |

**Verify:** Typography uses unified tokens, not legacy aliases.

---

### 6. Interactive States (All Required)

Every interactive element MUST have:

- [ ] **Default** state
- [ ] **Hover** state (desktop only via `@media (hover: hover)`)
- [ ] **Active/Pressed** state
- [ ] **Focus-visible** state (NOT `:focus`)
- [ ] **Disabled** state

```bash
# Check for :focus without :focus-visible
grep -rn ":focus[^-]" --include="*.scss" src/app/features/
```

---

### 7. PrimeNG Component Mapping

| Component     | styleClass            | Location                        |
| ------------- | --------------------- | ------------------------------- |
| Stat Card     | `stat-card`           | `primeng/_brand-overrides.scss` |
| Welcome Card  | `welcome-card`        | `primeng/_brand-overrides.scss` |
| Progress Card | `progress-card`       | `primeng/_brand-overrides.scss` |
| Schedule Card | `schedule-card`       | `primeng/_brand-overrides.scss` |
| Event Card    | `event-card`          | `primeng/_brand-overrides.scss` |
| Timeline      | `schedule-timeline`   | `primeng/_brand-overrides.scss` |
| Progress Bar  | `custom-progress`     | `primeng/_brand-overrides.scss` |
| Message       | `announcement-banner` | `primeng/_brand-overrides.scss` |

**Usage:** Apply via `styleClass` attribute, not `::ng-deep`.

---

### 8. Accessibility Baseline

- [ ] **Focus ring** visible on all interactive elements
- [ ] **Color contrast** meets WCAG AA (4.5:1 for text)
- [ ] **Touch targets** minimum 44px
- [ ] **Icon-only buttons** have `aria-label` + tooltip
- [ ] **No color-only** state indicators (use icons/text too)

---

## Post-Fix Verification

After fixing violations:

### Run Automated Checks

```bash
# CSS linting
npm run lint:css

# Design system validation
npm run lint:ds

# TypeScript compilation
npm run build
```

### Manual Spot Checks

1. **Player Dashboard** - Visual baseline
2. **Onboarding Flow** - User first impression
3. **Today's Practice** - Daily usage
4. **Settings** - Form controls
5. **Profile** - Data display

---

## Files Modified in Baseline Commit

### Player Dashboard Compliance

- `features/dashboard/player-dashboard.component.ts`
  - Removed 54 `::ng-deep` instances
  - Removed 6 `!important` instances
  - Replaced `transition: all` with explicit properties
  - Updated typography to unified tokens

### Shared Recipes (New)

- `assets/styles/primitives/_dashboard.scss`
  - `.dashboard-layout` - Main container
  - `.stats-overview` - 4-column stat grid
  - `.stat-card-content` - Stat card layout
  - `.card-header-custom` - Card headers
  - `.events-strip` - Event cards
  - `.welcome-wrapper` - Hero greeting
  - `.week-progress` - Progress indicators
  - `.schedule-item` - Timeline items

### PrimeNG Brand Overrides (Extended)

- `assets/styles/primeng/_brand-overrides.scss`
  - Dashboard card variants (stat-card, welcome-card, etc.)
  - Message/announcement banner styles
  - Timeline customizations
  - Progress bar slim variant
  - Tag size variants

---

## Violation Report

See `UI_VIOLATION_REPORT.md` for:

- Full list of violations by category
- Priority order for fixes
- File-by-file breakdown
- Recommended fix patterns

---

## Sign-Off

Before merging:

- [ ] All automated checks pass
- [ ] Visual review of affected pages
- [ ] No new violations introduced
- [ ] Documentation updated if needed

**Reviewer:** **\*\***\_\_\_**\*\***  
**Date:** **\*\***\_\_\_**\*\***
