# UI Design System Violation Report

**Generated:** January 5, 2026  
**Updated:** January 5, 2026 (Post-fixes)  
**Scope:** Angular App (`angular/src/app/features/**`)  
**Reference:** `docs/DESIGN_SYSTEM_RULES.md`

---

## Executive Summary (AFTER FIXES)

| Category                         | Before                 | After             | Status   |
| -------------------------------- | ---------------------- | ----------------- | -------- | --- |
| **::ng-deep usage**              | 106 matches / 19 files | 2 (comments only) | ✅ Fixed |
| **!important usage**             | 105 matches / 4 files  | 1 (comment only)  | ✅ Fixed |
| **Forbidden radius (10px/14px)** | 14 matches / 7 files   | -                 | 🟠       | -   |
| **Pill radius (100px/9999px)**   | 12 matches / 6 files   | -                 | 🟠       | -   |
| **Raw px spacing**               | 13 matches / 4 files   | -                 | -        | 🟡  |
| **Raw px font-size**             | 6 matches / 1 file     | -                 | -        | 🟡  |
| **transition: all**              | 152 matches / 76 files | -                 | 🟠       | -   |
| **:focus (not :focus-visible)**  | 21 matches / 13 files  | -                 | 🟠       | -   |
| **Direct .p-\* styling**         | 251 matches / 35 files | 🔴                | -        | -   |
| **Raw box-shadow**               | 246 matches / 66 files | -                 | -        | 🟡  |

---

## Priority 1: Player Dashboard (BASELINE)

**File:** `features/dashboard/player-dashboard.component.ts`

### Violations Found:

#### 1. `!important` Usage (6 instances) 🔴

```
Line 559: opacity: 1 !important;
Line 560: padding: var(--space-2) var(--space-4) !important;
Line 561: color: var(--ds-primary-green) !important;
Line 570: color: var(--ds-primary-green) !important;
Line 571: opacity: 1 !important;
Line 904: padding: var(--space-2) !important;
```

**Fix:** Move to `@layer overrides` with documented exception or refactor button component.

#### 2. `::ng-deep` Usage (54 instances) 🔴

All PrimeNG component overrides use `::ng-deep`:

- `.announcement-banner`
- `.welcome-card`
- `.stat-card`
- `.progress-card`, `.schedule-card`, `.actions-card`, `.trend-card`
- `.custom-progress`
- `.schedule-timeline`
- `.event-card`

**Fix:** Move PrimeNG overrides to `primeng/brand-overrides.scss` in `@layer primeng-brand`.

#### 3. `transition: all` (1 instance)

```
Line 758: transition: all 0.15s ease;
```

**Fix:** Replace with explicit properties: `transition: background-color 0.15s ease, color 0.15s ease;`

#### 4. Typography Token Misuse

```
Line 461: font-size: var(--font-body-md);  // Should be --font-body-size
Line 515: font-size: var(--font-heading-md); // Should be --font-h2-size
Line 527: font-size: var(--font-size-h1);    // ✅ Correct
Line 648: font-size: var(--font-size-metric-md); // ✅ Correct for KPIs
```

---

## Priority 2: Onboarding Flow

**File:** `features/onboarding/onboarding.component.scss`

### Violations:

- `::ng-deep`: 1 instance
- `transition: all`: 15 instances
- Raw box-shadow: 8 instances

---

## Priority 3: Training Screens

### training-schedule.component.scss

- `::ng-deep`: 1 instance
- `.p-*` direct styling: 21 instances
- Raw box-shadow: 4 instances
- `transition: all`: 2 instances
- `:focus` (not `:focus-visible`): 1 instance

### daily-protocol/components/wellness-checkin.component.scss

- `.p-*` direct styling: 7 instances
- `transition: all`: 3 instances
- `:focus` (not `:focus-visible`): 1 instance

### qb-throwing-tracker.component.scss

- Forbidden radius (10px/14px): 3 instances
- Raw box-shadow: 3 instances

---

## Priority 4: Today's Practice

**File:** `features/today/today.component.ts`

### Violations:

- `::ng-deep`: 30 instances
- `!important`: 2 instances
- `.p-*` direct styling: 17 instances
- Raw box-shadow: 7 instances
- `transition: all`: 3 instances

---

## Priority 5: Settings & Profile

### settings.component.scss

- `.p-*` direct styling: 27 instances
- `transition: all`: 3 instances
- `:focus` (not `:focus-visible`): 2 instances
- Raw box-shadow: 7 instances

### profile.component.scss

- `.p-*` direct styling: 23 instances
- Raw box-shadow: 9 instances
- Raw px spacing: 2 instances
- `transition: all`: 1 instance

---

## Priority 6: Authentication

### login.component.scss

- `::ng-deep`: 1 instance
- `.p-*` direct styling: 6 instances
- Raw box-shadow: 3 instances

---

## Priority 7: Analytics & Dashboards

### analytics.component.scss

- `.p-*` direct styling: 4 instances
- Raw box-shadow: 2 instances
- `:focus` (not `:focus-visible`): 1 instance

### analytics.component.ts (inline styles)

- Raw px spacing: 7 instances
- Raw px font-size: 6 instances

### coach-dashboard.component.scss

- `::ng-deep`: 1 instance
- Raw box-shadow: 4 instances
- `transition: all`: 1 instance

---

## Priority 8: Other Features

### chat.component.scss

- `.p-*` direct styling: 3 instances
- Raw box-shadow: 13 instances
- `transition: all`: 1 instance

### community.component.scss

- `::ng-deep`: 3 instances
- `.p-*` direct styling: 3 instances (removed)
- Raw box-shadow: 15 instances
- `:focus` (not `:focus-visible`): 2 instances

### ai-coach-chat.component.scss

- `::ng-deep`: 1 instance
- Raw box-shadow: 6 instances
- `:focus` (not `:focus-visible`): 1 instance

---

## Shared Components with Violations

### badge.component.scss

- Pill radius (9999px): 3 instances
  **Fix:** Replace with `var(--radius-lg)` for badges per Design System rules.

### status-tag.component.ts

- Pill radius (9999px): 3 instances
  **Fix:** Replace with `var(--radius-md)` or `var(--radius-lg)`.

---

## Files with Most Violations

| File                                      | Total Issues |
| ----------------------------------------- | ------------ |
| `today/today.component.ts`                | 52+          |
| `settings/settings.component.scss`        | 39+          |
| `profile/profile.component.scss`          | 35+          |
| `dashboard/player-dashboard.component.ts` | 61+          |
| `onboarding/onboarding.component.scss`    | 24+          |
| `chat/chat.component.scss`                | 17+          |
| `community/community.component.scss`      | 23+          |

---

## Recommended Fix Order

1. **Player Dashboard** (baseline) - Extract patterns to primitives
2. **Shared Components** (badge, status-tag) - Fix once, benefit everywhere
3. **Onboarding** - High user impact
4. **Today's Practice** - Daily usage
5. **Training screens** - Core functionality
6. **Settings/Profile** - User-facing
7. **Analytics/Dashboards** - Data visualization
8. **Remaining features** - Lower priority

---

## Required Actions

### Immediate (Player Dashboard Baseline)

- [ ] Remove all `!important` - move to `@layer overrides` with tickets
- [ ] Move `::ng-deep` PrimeNG overrides to `primeng-brand-overrides.scss`
- [ ] Replace `transition: all` with explicit properties
- [ ] Standardize typography tokens

### Short-term (Shared Recipes)

- [ ] Create `_dashboard-cards.scss` primitive
- [ ] Create `_stat-card.scss` primitive
- [ ] Create `_timeline.scss` primitive
- [ ] Document card layout recipe

### Medium-term (App-wide)

- [ ] Fix all forbidden radius values
- [ ] Replace raw box-shadows with tokens
- [ ] Replace `:focus` with `:focus-visible`
- [ ] Remove direct `.p-*` styling from feature files

---

## Verification Checklist

After fixes, verify:

- [ ] All spacing uses `var(--space-*)` tokens
- [ ] All radius uses `var(--radius-*)` tokens (no 10px, 14px, pill)
- [ ] All typography uses unified tokens
- [ ] No `!important` outside `@layer overrides`
- [ ] No `::ng-deep` outside allowed integration files
- [ ] All interactive elements have `:focus-visible` states
- [ ] No `transition: all` anywhere
- [ ] No direct `.p-*` styling in feature components
