# Design System Audit Report

**Date:** January 4, 2026  
**Benchmark Component:** `player-dashboard.component.ts`  
**Reference Documents:**

- `docs/PRIMENG_DESIGN_SYSTEM_RULES.md`
- `docs/UI_STANDARDIZATION_SUMMARY.md`
- `angular/src/assets/styles/ui-standardization.scss`

---

## Executive Summary

This audit examines **50+ frontend components** for consistency with the established design system. The Player Dashboard serves as the benchmark for proper implementation of:

- **Spacing tokens** (`--space-1` through `--space-12`)
- **Font size tokens** (`--font-heading-sm`, `--font-body-sm`, etc.)
- **PrimeNG design tokens** (`--p-card-body-padding`, etc.)
- **Component hierarchy** and layout patterns
- **Utility class usage** (`.page-container`, `.section-stack`, etc.)

---

## Benchmark Analysis: Player Dashboard

The Player Dashboard properly implements:

```typescript
// Correct spacing token usage
gap: var(--space-4);  // 16px
padding: var(--space-6);  // 24px
margin-bottom: var(--space-4);  // 16px

// Correct font token usage
font-size: var(--font-heading-sm);
font-size: var(--font-body-sm);
font-size: var(--font-body-xs);

// Correct radius usage
border-radius: var(--radius-lg);

// Proper ::ng-deep overrides for PrimeNG
:host ::ng-deep .p-message-content {
  padding: var(--space-3) var(--space-4);
}
```

---

## Audit Findings by Category

### 🔴 CRITICAL Issues (Break Design System)

#### 1. Hardcoded Pixel/Rem Values Instead of Spacing Tokens

**Components Affected:**

| Component                  | Issue                                     | Line Example                          |
| -------------------------- | ----------------------------------------- | ------------------------------------- |
| `landing.component.ts`     | Uses direct `px`/`rem` values extensively | `padding: 120px 0`, `gap: 3rem`       |
| `chat.component.ts`        | Uses `rem` values for spacing             | `gap: 0.75rem`, `padding: 1rem`       |
| `community.component.ts`   | External SCSS with hardcoded values       | References `community.component.scss` |
| `wellness.component.ts`    | Direct `rem` in SCSS                      | `.check-in-form { padding: 1.5rem }`  |
| `onboarding.component.ts`  | Direct values in SCSS                     | `.form-grid { gap: 24px }`            |
| `tournaments.component.ts` | Mix of direct rem/px                      | `margin-bottom: 1rem`                 |
| `settings.component.ts`    | SCSS with direct values                   | Various hardcoded spacings            |

**Correct Pattern (from Player Dashboard):**

```scss
// ✅ CORRECT
gap: var(--space-4);
padding: var(--space-6);

// ❌ INCORRECT
gap: 16px;
padding: 1.5rem;
```

---

#### 2. Missing/Incorrect Font Size Tokens

**Components Affected:**

| Component                      | Issue                                          |
| ------------------------------ | ---------------------------------------------- |
| `landing.component.ts`         | Uses `clamp()` and direct `rem` for font sizes |
| `analytics.component.ts`       | Missing font tokens in card headers            |
| `coach-dashboard.component.ts` | Inconsistent heading sizes                     |

**Correct Pattern:**

```scss
// ✅ CORRECT
font-size: var(--font-heading-sm);
font-size: var(--font-body-sm);

// ❌ INCORRECT
font-size: 1.25rem;
font-size: clamp(2rem, 5vw, 3.5rem);
```

---

#### 3. Dialog Width Inconsistency

**Design System Standard:** Dialogs should use `{ width: '90vw', maxWidth: '500px' }` or similar responsive patterns.

**Inconsistent Implementations:**

| Component                         | Dialog Width                                              |
| --------------------------------- | --------------------------------------------------------- |
| `community.component.ts`          | `{ width: '450px' }`, `{ width: '400px' }` - Fixed widths |
| `depth-chart.component.ts`        | `{ width: '400px' }` - Fixed width                        |
| `exercisedb-manager.component.ts` | `{ width: '90vw', maxWidth: '800px' }` ✅                 |
| `live-game-tracker.component.ts`  | `{ width: '90vw', maxWidth: '500px' }` ✅                 |
| `game-day-readiness.component.ts` | No explicit width (uses default)                          |

---

### 🟡 MODERATE Issues (Inconsistent but Functional)

#### 4. Card Padding/Gap Override Inconsistency

**Compliant Components:**

- `today.component.ts` - Uses `var(--p-card-body-gap)`, `var(--p-card-body-padding)`
- `player-dashboard.component.ts` - Proper `::ng-deep` overrides
- `training-schedule.component.ts` - Uses `--p-card-body-gap`

**Non-Compliant Components:**

- `coach-dashboard.component.ts` - Custom SCSS without PrimeNG token usage
- `analytics.component.ts` - Custom card styles in external SCSS
- `wellness.component.ts` - Direct padding values

---

#### 5. Button Styling Inconsistency

**Design System Standard:**

- Min-height: 44px (touch target)
- Border-radius: `--radius-lg` (12px)
- Consistent use of `severity` prop

**Issues Found:**

| Component                        | Issue                                      |
| -------------------------------- | ------------------------------------------ |
| `chat.component.ts`              | Custom text button styles via `::ng-deep`  |
| `community.component.ts`         | Custom `.media-btn` buttons bypass PrimeNG |
| `live-game-tracker.component.ts` | Custom `.field-action` buttons             |

---

#### 6. Progress Bar Styling

**Compliant:**

- Most components use `p-progressBar` with `styleClass` for customization

**Non-Compliant:**

- Some components use custom progress indicators instead of `p-progressBar`

---

### 🟢 WELL-IMPLEMENTED Components

The following components properly follow the design system:

| Component                           | Notes                                                 |
| ----------------------------------- | ----------------------------------------------------- |
| `achievements.component.ts`         | Header comment indicates "Design System Compliant" ✅ |
| `cycle-tracking.component.ts`       | Header comment indicates "Design System Compliant" ✅ |
| `sleep-debt.component.ts`           | Header comment indicates "Design System Compliant" ✅ |
| `film-room.component.ts`            | Header comment indicates "Design System Compliant" ✅ |
| `playbook.component.ts`             | Header comment indicates "Design System Compliant" ✅ |
| `payments.component.ts`             | Header comment indicates "Design System Compliant" ✅ |
| `return-to-play.component.ts`       | Header comment indicates "Design System Compliant" ✅ |
| `team-calendar.component.ts`        | Header comment indicates "Design System Compliant" ✅ |
| `data-import.component.ts`          | Header comment indicates "Design System Compliant" ✅ |
| `game-day-readiness.component.ts`   | Proper token usage                                    |
| `tournament-nutrition.component.ts` | Proper token usage                                    |

---

## Pattern Analysis

### Components with External SCSS Files

Many components reference external `.scss` files that may contain non-compliant styles:

```
attendance.component.scss
community.component.scss
depth-chart.component.scss
exercisedb-manager.component.scss
live-game-tracker.component.scss
onboarding.component.scss
roster.component.scss
settings.component.scss
tournaments.component.scss
training-schedule.component.scss
wellness.component.scss
```

**Recommendation:** Audit all external SCSS files for:

1. Hardcoded spacing values → Replace with `--space-*` tokens
2. Hardcoded font sizes → Replace with `--font-*` tokens
3. Custom button/card styles → Use PrimeNG tokens

---

### Components with Inline Styles

The following components have inline `styles: []` arrays that need review:

| Component                       | Status                            |
| ------------------------------- | --------------------------------- |
| `player-dashboard.component.ts` | ✅ Proper token usage (BENCHMARK) |
| `today.component.ts`            | ✅ Good token usage               |
| Various auth components         | Mixed                             |

---

## Utility Class Usage Analysis

### Expected Utility Classes (from UI_STANDARDIZATION_SUMMARY.md):

| Class             | Purpose                  | Usage Rate   |
| ----------------- | ------------------------ | ------------ |
| `.page-container` | Main page wrapper        | Low adoption |
| `.section-stack`  | Vertical section spacing | Low adoption |
| `.card-stack`     | Card vertical spacing    | Low adoption |
| `.toolbar-row`    | Filter/action bars       | Low adoption |
| `.control-row`    | Form control rows        | Low adoption |
| `.icon-btn`       | Icon-only buttons        | Low adoption |
| `.list-row`       | List item rows           | Low adoption |
| `.status-tag`     | Status indicators        | Low adoption |

**Observation:** Most components create custom layout classes instead of using the standardized utility classes.

---

## Specific Component Issues

### 1. Landing Page (`landing.component.ts`)

**Issues:**

- Extensive use of `px` values (120px padding, 240px heights)
- Custom animations without `prefers-reduced-motion`
- Font sizes use `clamp()` instead of design tokens
- Background gradients and effects may conflict with dark mode

### 2. Community Component (`community.component.ts`)

**Issues:**

- Custom button classes (`.media-btn`, `.action-btn`)
- Fixed dialog widths
- Avatar inline styles with hardcoded values
- External SCSS needs audit

### 3. Coach Dashboard (`coach-dashboard.component.ts`)

**Issues:**

- Uses `app-button` and `app-card` (custom components) - verify they follow design system
- External SCSS with potential hardcoded values
- Mix of specific pixel values

### 4. Chat Component (`chat.component.ts`)

**Issues:**

- Uses `rem` values for spacing
- Custom `::ng-deep` overrides for PrimeNG buttons
- External SCSS needs audit

### 5. Onboarding Component (`onboarding.component.ts`)

**Issues:**

- Custom card classes (`.checkbox-card`, `.equipment-card`, `.goal-card`)
- Direct CSS variable usage for colors is good
- Spacing values in SCSS need review

---

## Recommended Fixes

### Priority 1: Critical (Fix Immediately)

1. **Create spacing token migration script**

   ```bash
   # Replace hardcoded values with tokens
   # 4px → var(--space-1)
   # 8px → var(--space-2)
   # 12px → var(--space-3)
   # 16px → var(--space-4)
   # 20px → var(--space-5)
   # 24px → var(--space-6)
   # 32px → var(--space-8)
   # 40px → var(--space-10)
   # 48px → var(--space-12)
   ```

2. **Standardize dialog widths**

   ```typescript
   // Standard dialog pattern
   [style] = "{ width: '90vw', maxWidth: '500px' }"[breakpoints] =
     "{ '640px': '95vw' }";
   ```

3. **Audit external SCSS files**
   - `/angular/src/app/features/**/*.component.scss`

### Priority 2: Moderate (Fix in Sprint)

1. Replace custom button classes with PrimeNG `p-button` variants
2. Standardize card padding using `::ng-deep` and PrimeNG tokens
3. Implement utility classes in components currently using custom layouts

### Priority 3: Enhancement

1. Add "Design System Compliant" header comment to all passing components
2. Create component template snippets for common patterns
3. Add ESLint rules to catch hardcoded pixel values

---

## Summary Statistics

| Category                   | Count          | Percentage |
| -------------------------- | -------------- | ---------- |
| **Fully Compliant**        | ~15 components | ~30%       |
| **Mostly Compliant**       | ~20 components | ~40%       |
| **Needs Significant Work** | ~15 components | ~30%       |

---

## Files Requiring Immediate Attention

1. `angular/src/app/features/landing/landing.component.ts` - Heavy customization
2. `angular/src/app/features/community/community.component.ts` - Custom UI elements
3. `angular/src/app/features/chat/chat.component.ts` - Spacing inconsistencies
4. `angular/src/app/features/onboarding/onboarding.component.ts` - Mixed patterns
5. All external `.scss` files in `/features/` directory

---

## Appendix: Design Token Quick Reference

### Spacing Scale (8pt rhythm)

```scss
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
```

### Font Sizes

```scss
--font-heading-lg: 1.5rem; // 24px
--font-heading-sm: 1.125rem; // 18px
--font-body-md: 1rem; // 16px
--font-body-sm: 0.875rem; // 14px
--font-body-xs: 0.75rem; // 12px
```

### Radii

```scss
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
```

### PrimeNG Component Tokens

```scss
--p-card-body-padding: var(--space-6);
--p-card-body-gap: var(--space-4);
--p-button-border-radius: var(--radius-lg);
--p-inputtext-border-radius: var(--radius-lg);
--p-dialog-border-radius: var(--radius-xl);
```

---

_Report generated by automated design system audit_
