# ::ng-deep Removal Plan

> **Generated**: January 4, 2026  
> **Status**: Active  
> **Owner**: @design-system-team

---

## Executive Summary

Total files with `::ng-deep`: **80 files**  
Total `::ng-deep` occurrences: **~349 instances**

### Classification Breakdown

| Category                                 | Count    | Priority          |
| ---------------------------------------- | -------- | ----------------- |
| **A) Replace with DT tokens**            | 28 files | High              |
| **B) Move to central PrimeNG overrides** | 35 files | Medium            |
| **C) Temporary exceptions**              | 17 files | Low (with expiry) |

---

## Category A: Can Be Replaced with Design Tokens

These `::ng-deep` usages can be eliminated by using PrimeNG's built-in CSS variable system (dt tokens) or Pass Through (PT) options.

### A1. Form Control Width/Layout

| File                                     | Usage                                                       | Recommended Action                                              |
| ---------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| `date-picker/date-picker.component.scss` | `.p-datepicker { width: 100% }`                             | Use `[style]="{ width: '100%' }"` input binding or `styleClass` |
| `settings/settings.component.scss`       | `.p-inputtext { width: 100% }`, `.p-select { width: 100% }` | Use `fluid` attribute on p-select/p-inputtext                   |
| `login/login.component.scss`             | `.p-inputtext { width: 100% }`                              | Use `fluid` attribute or `pInputText` with host width           |
| `tournaments/tournaments.component.scss` | Form inputs width 100%                                      | Use `fluid` attribute on all form controls                      |

**Migration Pattern:**

```html
<!-- Before (requires ::ng-deep) -->
<p-select></p-select>
<!-- Component SCSS: :host ::ng-deep .p-select { width: 100% } -->

<!-- After (no ::ng-deep needed) -->
<p-select [style]="{ width: '100%' }"></p-select>
<!-- OR -->
<p-select styleClass="w-full"></p-select>
```

### A2. Card Styling (Padding, Borders)

| File                                       | Usage                                             | Recommended Action                                          |
| ------------------------------------------ | ------------------------------------------------- | ----------------------------------------------------------- |
| `onboarding/onboarding.component.scss`     | `.p-card { border-radius: 14px }`                 | Use `--p-card-border-radius` token in `:root`               |
| `profile/profile.component.scss`           | `.profile-tabs-container p-card { border: none }` | Use PT options: `[pt]="{ root: { class: 'border-none' } }"` |
| `game-tracker/game-tracker.component.scss` | Card header padding reset                         | Use `--p-card-header-padding` token                         |

**Migration Pattern:**

```typescript
// In component - use PT options
cardPT = {
  root: { class: "custom-card" },
  body: { style: { padding: "var(--space-4)" } },
  content: { style: { padding: "0" } },
};
```

### A3. Progress Bar Customization

| File                                   | Usage                | Recommended Action                 |
| -------------------------------------- | -------------------- | ---------------------------------- |
| `onboarding/onboarding.component.scss` | Custom height/radius | Use `--p-progressbar-height` token |

**Migration Pattern:**

```scss
// In primeng-integration.scss (global)
:root {
  --p-progressbar-height: 6px;
  --p-progressbar-border-radius: var(--radius-sm);
}
```

### A4. Tag/Badge Styling

| File                                     | Usage                                | Recommended Action                            |
| ---------------------------------------- | ------------------------------------ | --------------------------------------------- |
| `profile/profile.component.scss`         | `.p-tag { background: transparent }` | Use `severity="secondary"` or custom severity |
| `tournaments/tournaments.component.scss` | `.personal-badge { font-size }`      | Use `--p-tag-font-size` token                 |

---

## Category B: Move to Central PrimeNG Overrides Layer

These should be consolidated into `primeng-integration.scss` or a new `primeng-component-overrides.scss` file.

### B1. DataTable Overrides (Consolidate)

**Files to consolidate:**

- `game-tracker/game-tracker.component.scss`
- `enhanced-data-table/enhanced-data-table.component.scss`
- `roster/roster.component.scss`
- `analytics/analytics.component.scss`
- `video-curation/video-curation.component.scss`
- `exercisedb/exercisedb-manager.component.scss`

**Recommended Central Override:**

```scss
// primeng-component-overrides.scss
.p-datatable {
  // Header styling
  .p-datatable-thead > tr > th {
    background: var(--surface-secondary);
    border: none;
    border-bottom: var(--border-2) solid var(--color-border-secondary);
    padding: var(--space-3) var(--space-5);
    font-size: var(--font-size-caption);
    font-weight: var(--font-weight-semibold);
    text-transform: uppercase;
    letter-spacing: var(--letter-spacing-caption);
    color: var(--color-text-secondary);
  }

  // Row styling
  .p-datatable-tbody > tr {
    transition: background-color var(--transition-fast);

    &:hover {
      background: var(--ds-primary-green-ultra-subtle);
    }

    > td {
      border: none;
      border-bottom: var(--border-1) solid var(--color-border-secondary);
      padding: var(--space-4) var(--space-5);
    }
  }
}
```

### B2. Dialog/Modal Overrides (Consolidate)

**Files to consolidate:**

- `settings/settings.component.scss`
- `keyboard-shortcuts-modal/keyboard-shortcuts-modal.component.scss`
- `feature-walkthrough/feature-walkthrough.component.scss`

**Recommended Central Override:**

```scss
// primeng-component-overrides.scss
.p-dialog {
  border-radius: var(--radius-3xl);
  overflow: hidden;
  box-shadow: var(--shadow-lg);

  .p-dialog-content {
    padding: 0;
    background: var(--surface-primary);
  }

  .p-dialog-header {
    padding: var(--space-5) var(--space-6);
    border-bottom: 1px solid var(--color-border-primary);
  }

  .p-dialog-footer {
    padding: var(--space-4) var(--space-6);
    border-top: 1px solid var(--color-border-primary);
  }
}
```

### B3. Toast Overrides (Consolidate)

**Files to consolidate:**

- `toast/toast.component.scss`

**Action:** Move all toast styling to `primeng-component-overrides.scss` since it's a global component.

### B4. Tabs Overrides (Consolidate)

**Files to consolidate:**

- `profile/profile.component.scss`
- `settings/settings.component.scss`
- `training-schedule/training-schedule.component.scss`

**Recommended Central Override:**

```scss
// primeng-component-overrides.scss
.p-tablist {
  .p-tablist-tab-list {
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .p-tab {
    height: 40px;
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    padding: 0 var(--space-4);
    font-weight: var(--font-weight-semibold);

    &.p-tab-active {
      border-bottom-color: var(--ds-primary-green);
      color: var(--ds-primary-green);
    }
  }
}
```

### B5. Timeline Overrides

**Files to consolidate:**

- `la28-roadmap.component.scss`

**Action:** Add timeline tokens to `primeng-integration.scss`.

### B6. Stepper/Steps Overrides

**Files to consolidate:**

- `stepper/stepper.component.scss`

**Action:** Add stepper tokens to `primeng-integration.scss`.

### B7. Divider Overrides

**Files to consolidate:**

- `settings/settings.component.scss`

**Action:** Use `--p-divider-border-color` token.

---

## Category C: Temporary Exceptions (Must Include Expiry)

These require `::ng-deep` due to PrimeNG limitations or complex component structures. Each MUST have an expiry date.

### C1. Password Input Layout

**File:** `settings/settings.component.scss`

```scss
/*
 * EXCEPTION: Password Input Wrapper Layout
 * Ticket: DS-PASS-001
 * Owner: @design-system
 * Scope: settings component password fields only
 * Remove by: 2026-Q2
 * Reason: PrimeNG p-password wrapper structure requires deep styling
 *         for toggle icon positioning. Monitor PrimeNG 22 for PT options.
 */
:host ::ng-deep .password-input .p-password-wrapper {
  position: relative;
  width: 100%;
  display: block;
}
```

### C2. Calendar/DatePicker Trigger Position

**File:** `team-calendar/team-calendar.component.scss`

```scss
/*
 * EXCEPTION: Calendar Trigger Button Position
 * Ticket: DS-CAL-001
 * Owner: @design-system
 * Scope: team-calendar component only
 * Remove by: 2026-Q2
 * Reason: Calendar icon trigger positioning inside input.
 *         PrimeNG 21 doesn't expose PT for trigger element position.
 */
```

### C3. Print Media Overrides

**File:** `tournaments/tournaments.component.scss`

```scss
/*
 * EXCEPTION: Print Media Hiding
 * Ticket: DS-PRINT-001
 * Owner: @design-system
 * Scope: tournaments print view only
 * Remove by: 2026-Q3
 * Reason: Print media queries require hiding PrimeNG action buttons.
 *         Consider extracting print styles to separate stylesheet.
 */
@media print {
  :host ::ng-deep .header-actions,
  :host ::ng-deep .tournament-actions {
    display: none;
  }
}
```

### C4. Mobile Card View Actions

**File:** `enhanced-data-table/enhanced-data-table.component.scss`

```scss
/*
 * EXCEPTION: Mobile Card Actions Button Flex
 * Ticket: DS-MOBILE-001
 * Owner: @design-system
 * Scope: enhanced-data-table mobile view only
 * Remove by: 2026-Q2
 * Reason: p-button inside card actions needs flex: 1 for equal width.
 *         Use app-button wrapper instead once migrated.
 */
```

### C5. Selected Row Highlight

**File:** `enhanced-data-table/enhanced-data-table.component.scss`

```scss
/*
 * EXCEPTION: Selected Row Background Override
 * Ticket: DS-SELECT-001
 * Owner: @design-system
 * Scope: enhanced-data-table only
 * Remove by: 2026-Q2
 * Reason: Custom selection color not exposed via tokens.
 *         Use --p-datatable-row-selected-background in primeng-integration.scss
 */
```

### C6. 2FA Verification Code Input

**File:** `settings/settings.component.scss`

```scss
/*
 * EXCEPTION: Monospace Font for 2FA Code
 * Ticket: DS-2FA-001
 * Owner: @design-system
 * Scope: verification-code-input class only
 * Remove by: 2026-Q2
 * Reason: 2FA code input needs monospace font for readability.
 *         Consider creating dedicated <app-code-input> component.
 */
```

---

## Files Inventory with Recommended Actions

### Shared Components

| File                                                               | `::ng-deep` Count | Action                       |
| ------------------------------------------------------------------ | ----------------- | ---------------------------- |
| `button/button.component.scss`                                     | 0                 | ✅ Already clean             |
| `cookie-consent-banner/cookie-consent-banner.component.scss`       | 2                 | B - Move to central          |
| `date-picker/date-picker.component.scss`                           | 2                 | A - Use fluid/style binding  |
| `daily-readiness/daily-readiness.component.scss`                   | 3                 | B - Consolidate card styles  |
| `empty-state/empty-state.component.scss`                           | 1                 | A - Use PT options           |
| `enhanced-data-table/enhanced-data-table.component.scss`           | 2                 | C - Exception (selected row) |
| `feature-walkthrough/feature-walkthrough.component.scss`           | 4                 | B - Move dialog styles       |
| `game-day-countdown/game-day-countdown.component.scss`             | 2                 | A - Use tokens               |
| `hydration-tracker/hydration-tracker.component.scss`               | 3                 | B - Consolidate              |
| `keyboard-shortcuts-modal/keyboard-shortcuts-modal.component.scss` | 3                 | B - Move dialog styles       |
| `micro-session/micro-session.component.scss`                       | 2                 | A - Use tokens               |
| `morning-briefing/morning-briefing.component.scss`                 | 3                 | B - Consolidate              |
| `no-data-entry/no-data-entry.component.scss`                       | 1                 | A - Use PT options           |
| `offline-banner/offline-banner.component.scss`                     | 1                 | A - Use tokens               |
| `post-training-recovery/post-training-recovery.component.scss`     | 3                 | B - Consolidate              |
| `quick-wellness-checkin/quick-wellness-checkin.component.scss`     | 2                 | A - Use tokens               |
| `rest-timer/rest-timer.component.scss`                             | 2                 | A - Use tokens               |
| `session-analytics/session-analytics.component.scss`               | 4                 | B - Consolidate              |
| `smart-breadcrumbs/smart-breadcrumbs.component.scss`               | 2                 | A - Use tokens               |
| `stepper/stepper.component.scss`                                   | 1                 | B - Move to central          |
| `supplement-tracker/supplement-tracker.component.scss`             | 3                 | B - Consolidate              |
| `team-wellness-overview/team-wellness-overview.component.scss`     | 3                 | B - Consolidate              |
| `toast/toast.component.scss`                                       | 15                | B - Move to central (global) |
| `tournament-mode-widget/tournament-mode-widget.component.scss`     | 2                 | A - Use tokens               |
| `wellness-score-display/wellness-score-display.component.scss`     | 2                 | A - Use tokens               |

### Feature Components

| File                                                             | `::ng-deep` Count | Action                            |
| ---------------------------------------------------------------- | ----------------- | --------------------------------- |
| `ai-coach/ai-coach-chat.component.scss`                          | 4                 | B - Consolidate chat styles       |
| `analytics/analytics.component.scss`                             | 6                 | B - Move datatable styles         |
| `auth/login/login.component.scss`                                | 5                 | A - Use fluid/PT options          |
| `auth/update-password/update-password.component.scss`            | 3                 | A - Use fluid/PT options          |
| `chat/chat.component.scss`                                       | 5                 | B - Consolidate chat styles       |
| `coach/player-development/player-development.component.scss`     | 4                 | B - Consolidate                   |
| `coach/scouting/scouting-reports.component.scss`                 | 3                 | B - Consolidate                   |
| `community/community.component.scss`                             | 4                 | B - Consolidate                   |
| `dashboard/coach-dashboard.component.scss`                       | 5                 | B - Consolidate                   |
| `dashboard/player-dashboard.component.ts`                        | 2                 | A - Move to SCSS file             |
| `data-import/data-import.component.scss`                         | 4                 | B - Consolidate                   |
| `exercise-library/exercise-library.component.scss`               | 5                 | B - Consolidate                   |
| `exercisedb/exercisedb-manager.component.scss`                   | 6                 | B - Move datatable styles         |
| `film-room/film-room.component.scss`                             | 4                 | B - Consolidate                   |
| `game/game-day-readiness/game-day-readiness.component.scss`      | 3                 | B - Consolidate                   |
| `game/tournament-nutrition/tournament-nutrition.component.scss`  | 3                 | B - Consolidate                   |
| `game-tracker/game-tracker.component.scss`                       | 12                | B - Move datatable styles         |
| `landing/landing.component.scss`                                 | 3                 | A - Use tokens                    |
| `onboarding/onboarding.component.scss`                           | 2                 | A - Use tokens                    |
| `performance-tracking/performance-tracking.component.scss`       | 5                 | B - Consolidate                   |
| `profile/profile.component.scss`                                 | 8                 | B - Move tabs/card styles         |
| `return-to-play/return-to-play.component.scss`                   | 4                 | B - Consolidate                   |
| `roster/roster.component.scss`                                   | 5                 | B - Move datatable styles         |
| `roster/components/roster-filters.component.scss`                | 2                 | A - Use tokens                    |
| `roster/components/roster-player-card.component.scss`            | 2                 | A - Use tokens                    |
| `settings/settings.component.scss`                               | 22                | B/C - Split: central + exceptions |
| `settings/privacy-controls/privacy-controls.component.scss`      | 3                 | B - Consolidate                   |
| `sleep-debt/sleep-debt.component.scss`                           | 3                 | B - Consolidate                   |
| `staff/nutritionist/nutritionist-dashboard.component.scss`       | 4                 | B - Consolidate                   |
| `staff/physiotherapist/physiotherapist-dashboard.component.scss` | 4                 | B - Consolidate                   |
| `staff/psychology/psychology-reports.component.scss`             | 3                 | B - Consolidate                   |
| `superadmin/superadmin-dashboard.component.scss`                 | 5                 | B - Consolidate                   |
| `superadmin/superadmin-settings.component.scss`                  | 4                 | B - Consolidate                   |
| `team-calendar/team-calendar.component.scss`                     | 6                 | C - Calendar exceptions           |
| `today/today.component.ts`                                       | 2                 | A - Move to SCSS file             |
| `tournaments/tournaments.component.scss`                         | 8                 | B/C - Split: central + print      |
| `training/daily-protocol/components/*.scss`                      | 15                | B - Consolidate                   |
| `training/training-schedule/training-schedule.component.scss`    | 5                 | B - Consolidate                   |
| `training/video-curation/*.scss`                                 | 8                 | B - Move datatable styles         |
| `training/video-feed/video-feed.component.scss`                  | 3                 | B - Consolidate                   |
| `training/video-suggestion/video-suggestion.component.scss`      | 3                 | B - Consolidate                   |

### Global/Asset Files

| File                         | `::ng-deep` Count | Action                         |
| ---------------------------- | ----------------- | ------------------------------ |
| `_canonical-mixins.scss`     | 6                 | **CRITICAL** - Refactor mixins |
| `primeng-integration.scss`   | 0                 | ✅ Already clean               |
| `overrides/_exceptions.scss` | 2 (commented)     | ✅ Template only               |
| `primitives/_index.scss`     | 1                 | A - Use tokens                 |
| `premium-interactions.scss`  | 3                 | B - Move to central            |
| `primeng.config.ts`          | 1                 | C - Exception (config)         |

---

## Migration Priority Order

### Phase 1: Quick Wins (Week 1-2)

1. Replace `width: 100%` with `fluid` attribute or style bindings
2. Remove `::ng-deep` from `_canonical-mixins.scss` (refactor mixins)
3. Add missing tokens to `primeng-integration.scss`

### Phase 2: Consolidation (Week 3-4)

1. Create `primeng-component-overrides.scss` for DataTable, Dialog, Tabs, Toast
2. Remove component-level duplicates
3. Update component imports

### Phase 3: PT Migration (Week 5-6)

1. Migrate card styling to PT options
2. Migrate form control styling to PT options
3. Test all components

### Phase 4: Exception Documentation (Week 7)

1. Add exception templates to remaining `::ng-deep` usages
2. Create tracking tickets for each exception
3. Set calendar reminders for expiry dates

---

## Canonical Mixins Refactor

The `_canonical-mixins.scss` file contains `::ng-deep` in examples and the `card-complete` / `stat-card` mixins. This needs special attention:

### Current Problem:

```scss
// These mixins GENERATE ::ng-deep
@mixin card-complete($class) {
  :host ::ng-deep #{$class} {
    @include card-base;
    // ...
  }
}
```

### Recommended Solution:

```scss
// Option 1: Use CSS custom properties instead
@mixin card-complete($class) {
  #{$class} {
    border-radius: var(--ds-card-radius, var(--radius-lg));
    box-shadow: var(--ds-card-shadow, var(--shadow-sm));
    // ... no ::ng-deep needed if using :host-context or CSS vars
  }
}

// Option 2: Deprecate mixins, use PT options in components
// Document migration path for each component using these mixins
```

---

## Success Metrics

| Metric                      | Current | Target | Deadline |
| --------------------------- | ------- | ------ | -------- |
| Total `::ng-deep` instances | ~349    | <50    | 2026-Q2  |
| Files with `::ng-deep`      | 80      | <20    | 2026-Q2  |
| Undocumented exceptions     | ~300    | 0      | 2026-Q1  |
| Central override coverage   | 30%     | 90%    | 2026-Q2  |

---

## Related Documentation

- [PRIMENG_DESIGN_SYSTEM_RULES.md](./PRIMENG_DESIGN_SYSTEM_RULES.md)
- [primeng-integration.scss](../angular/src/assets/styles/primeng-integration.scss)
- [overrides/\_exceptions.scss](../angular/src/assets/styles/overrides/_exceptions.scss)

---

## Changelog

| Date       | Author         | Change                               |
| ---------- | -------------- | ------------------------------------ |
| 2026-01-04 | @design-system | Initial inventory and classification |
