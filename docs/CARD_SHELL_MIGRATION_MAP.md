# Card Shell Migration Map

**Status:** 📋 **ACTIONABLE**  
**Effective Date:** January 4, 2026  
**Target:** Migrate all card-like containers to `app-card-shell`

---

## 1. Overview

This document provides a file-by-file migration plan for replacing existing card patterns with the unified `app-card-shell` component.

### Priority Order

1. **Training features** (highest user traffic)
2. **Dashboard components** (first impression)
3. **Coach features** (power users)
4. **Staff dashboards**
5. **Remaining features**

---

## 2. Patterns to Replace

### 2.1 Pattern A: `p-card` with styleClass overrides

```html
<!-- BEFORE -->
<p-card styleClass="custom-card my-feature-card">
  <ng-template pTemplate="header">...</ng-template>
  ...
</p-card>

<!-- AFTER -->
<app-card-shell title="..." headerIcon="..."> ... </app-card-shell>
```

**Conversion steps:**

1. Replace `<p-card>` with `<app-card-shell>`
2. Move title from `pTemplate="header"` to `title` input
3. Add `headerIcon` if header had an icon
4. Remove `styleClass` attribute
5. Delete all `:host ::ng-deep .p-card` overrides from SCSS
6. Delete custom header styling from SCSS

---

### 2.2 Pattern B: `div` with card styling

```html
<!-- BEFORE -->
<div class="stat-card">
  <div class="stat-header">...</div>
  <div class="stat-body">...</div>
</div>

<!-- AFTER -->
<app-card-shell title="..." density="compact"> ... </app-card-shell>
```

**Conversion steps:**

1. Replace outer `<div class="*-card">` with `<app-card-shell>`
2. Remove header div, use `title`/`subtitle` inputs
3. Move body content directly into component
4. Delete all `.stat-card`, `.stat-header`, `.stat-body` from SCSS

---

### 2.3 Pattern C: Feature-specific panel containers

```html
<!-- BEFORE -->
<div class="analytics-panel">
  <div class="panel-header">
    <h3>Title</h3>
    <button>Action</button>
  </div>
  <div class="panel-content">...</div>
</div>

<!-- AFTER -->
<app-card-shell title="Title">
  <ng-container header-actions>
    <app-button>Action</app-button>
  </ng-container>
  ...
</app-card-shell>
```

**Conversion steps:**

1. Replace panel container with `<app-card-shell>`
2. Move h3 text to `title` input
3. Move action buttons to `header-actions` slot
4. Delete panel-specific SCSS classes

---

## 3. Migration Table

### 3.1 Training Features (PRIORITY 1)

| File                                                                                 | Current Pattern                     | New Usage                                                           | SCSS to Delete                              |
| ------------------------------------------------------------------------------------ | ----------------------------------- | ------------------------------------------------------------------- | ------------------------------------------- |
| `training/training-schedule/training-schedule.component.ts`                          | `p-card styleClass="schedule-card"` | `<app-card-shell title="Weekly Schedule" headerIcon="pi-calendar">` | `.schedule-card`, `:host ::ng-deep .p-card` |
| `training/training-schedule/training-schedule.component.scss`                        | Custom card header styling          | Remove all                                                          | Lines with `.card-header`, `.schedule-card` |
| `training/training-log/training-log.component.ts`                                    | `p-card` with custom header         | `<app-card-shell title="Training Log" headerIcon="pi-list">`        | Custom header SCSS                          |
| `training/video-suggestion/video-suggestion.component.ts`                            | `p-card styleClass="video-card"`    | `<app-card-shell title="Suggested Videos" headerIcon="pi-video">`   | `.video-card` styles                        |
| `training/video-suggestion/video-suggestion.component.scss`                          | `:host ::ng-deep .video-card`       | Delete                                                              | All `.video-card` rules                     |
| `training/smart-training-form/smart-training-form.component.ts`                      | `p-card` form container             | `<app-card-shell title="Log Training">`                             | Form card overrides                         |
| `training/ai-training-scheduler/ai-training-scheduler.component.ts`                  | `p-card styleClass`                 | `<app-card-shell>`                                                  | Custom card styles                          |
| `training/ai-training-scheduler/ai-training-scheduler.component.scss`                | `.card-header` custom               | Delete                                                              | `.card-header`, `.card-body`                |
| `training/training-safety/training-safety.component.ts`                              | `p-card`                            | `<app-card-shell>`                                                  | Card overrides                              |
| `training/training-safety/training-safety.component.scss`                            | `:host ::ng-deep` card rules        | Delete                                                              | All card-related rules                      |
| `training/qb-assessment-tools/qb-assessment-tools.component.ts`                      | `p-card`                            | `<app-card-shell>`                                                  | —                                           |
| `training/qb-training-schedule/qb-training-schedule.component.ts`                    | `p-card`                            | `<app-card-shell>`                                                  | —                                           |
| `training/components/periodization-dashboard/periodization-dashboard.component.ts`   | `p-card styleClass`                 | `<app-card-shell>`                                                  | Phase card styles                           |
| `training/components/periodization-dashboard/periodization-dashboard.component.scss` | `.phase-card`, `.card-header`       | Delete                                                              | All custom card rules                       |
| `training/daily-protocol/components/la28-roadmap.component.ts`                       | `p-card styleClass`                 | `<app-card-shell>`                                                  | Roadmap card styles                         |

---

### 3.2 Dashboard Components (PRIORITY 2)

| File                                       | Current Pattern                     | New Usage                                    | SCSS to Delete             |
| ------------------------------------------ | ----------------------------------- | -------------------------------------------- | -------------------------- |
| `dashboard/player-dashboard.component.ts`  | `p-card styleClass="stat-card"`     | `<app-card-shell density="compact">`         | `.stat-card` overrides     |
| `dashboard/player-dashboard.component.ts`  | `p-card styleClass="progress-card"` | `<app-card-shell title="Weekly Progress">`   | `.progress-card` overrides |
| `dashboard/player-dashboard.component.ts`  | `p-card styleClass="schedule-card"` | `<app-card-shell title="Today's Schedule">`  | `.schedule-card` overrides |
| `dashboard/player-dashboard.component.ts`  | `p-card styleClass="actions-card"`  | `<app-card-shell title="Quick Actions">`     | `.actions-card` overrides  |
| `dashboard/player-dashboard.component.ts`  | `p-card styleClass="trend-card"`    | `<app-card-shell title="Performance Trend">` | `.trend-card` overrides    |
| `dashboard/player-dashboard.component.ts`  | `p-card styleClass="welcome-card"`  | Keep as special gradient card                | Exception documented       |
| `dashboard/coach-dashboard.component.ts`   | Uses `app-card` already             | Migrate to `app-card-shell`                  | —                          |
| `dashboard/coach-dashboard.component.scss` | `.card-header` custom               | Delete                                       | Custom header rules        |

---

### 3.3 Coach Features (PRIORITY 3)

| File                                                             | Current Pattern                   | New Usage          | SCSS to Delete     |
| ---------------------------------------------------------------- | --------------------------------- | ------------------ | ------------------ |
| `coach/player-development/player-development.component.ts`       | `p-card`                          | `<app-card-shell>` | Custom card styles |
| `coach/player-development/player-development.component.scss`     | `.card-header`, `:host ::ng-deep` | Delete             | All card rules     |
| `coach/scouting/scouting-reports.component.ts`                   | `p-card styleClass`               | `<app-card-shell>` | Report card styles |
| `coach/scouting/scouting-reports.component.scss`                 | Custom card styling               | Delete             | All `.report-card` |
| `coach/practice-planner/practice-planner.component.ts`           | `p-card`                          | `<app-card-shell>` | —                  |
| `coach/playbook-manager/playbook-manager.component.ts`           | `p-card`                          | `<app-card-shell>` | —                  |
| `coach/injury-management/injury-management.component.ts`         | `p-card`                          | `<app-card-shell>` | —                  |
| `coach/team-management/team-management.component.ts`             | `p-card`                          | `<app-card-shell>` | —                  |
| `coach/tournament-management/tournament-management.component.ts` | `p-card`                          | `<app-card-shell>` | —                  |
| `coach/ai-scheduler/ai-scheduler.component.ts`                   | `p-card styleClass`               | `<app-card-shell>` | —                  |
| `coach/ai-scheduler/ai-scheduler.component.scss`                 | `.card-header`, `.card-body`      | Delete             | All card rules     |
| `coach/program-builder/program-builder.component.ts`             | `p-card`                          | `<app-card-shell>` | —                  |
| `coach/payment-management/payment-management.component.ts`       | `p-card`                          | `<app-card-shell>` | —                  |
| `coach/payment-management/payment-management.component.scss`     | Custom card styling               | Delete             | Card overrides     |
| `coach/calendar/calendar-coach.component.ts`                     | `p-card`                          | `<app-card-shell>` | —                  |
| `coach/coach-analytics/coach-analytics.component.ts`             | `p-card`                          | `<app-card-shell>` | —                  |

---

### 3.4 Staff Dashboards (PRIORITY 4)

| File                                                             | Current Pattern           | New Usage          | SCSS to Delete     |
| ---------------------------------------------------------------- | ------------------------- | ------------------ | ------------------ |
| `staff/nutritionist/nutritionist-dashboard.component.ts`         | `p-card styleClass`       | `<app-card-shell>` | Custom card styles |
| `staff/nutritionist/nutritionist-dashboard.component.scss`       | `:host ::ng-deep .p-card` | Delete             | All card rules     |
| `staff/physiotherapist/physiotherapist-dashboard.component.ts`   | `p-card styleClass`       | `<app-card-shell>` | Custom card styles |
| `staff/physiotherapist/physiotherapist-dashboard.component.scss` | `:host ::ng-deep .p-card` | Delete             | All card rules     |
| `staff/psychology/psychology-reports.component.ts`               | `p-card styleClass`       | `<app-card-shell>` | Custom card styles |
| `staff/psychology/psychology-reports.component.scss`             | `:host ::ng-deep .p-card` | Delete             | All card rules     |

---

### 3.5 Analytics & Performance (PRIORITY 5)

| File                                                           | Current Pattern     | New Usage          | SCSS to Delete        |
| -------------------------------------------------------------- | ------------------- | ------------------ | --------------------- |
| `analytics/analytics.component.ts`                             | `p-card styleClass` | `<app-card-shell>` | Analytics card styles |
| `analytics/enhanced-analytics/enhanced-analytics.component.ts` | `p-card styleClass` | `<app-card-shell>` | Enhanced card styles  |
| `performance-tracking/performance-tracking.component.ts`       | `p-card`            | `<app-card-shell>` | —                     |

---

### 3.6 Remaining Features (PRIORITY 6)

| File                                                            | Current Pattern           | New Usage          | SCSS to Delete          |
| --------------------------------------------------------------- | ------------------------- | ------------------ | ----------------------- |
| `today/today.component.ts`                                      | `p-card`                  | `<app-card-shell>` | —                       |
| `wellness/wellness.component.ts`                                | `p-card`                  | `<app-card-shell>` | —                       |
| `sleep-debt/sleep-debt.component.ts`                            | `p-card styleClass`       | `<app-card-shell>` | Custom styles           |
| `sleep-debt/sleep-debt.component.scss`                          | `:host ::ng-deep`         | Delete             | Card overrides          |
| `cycle-tracking/cycle-tracking.component.ts`                    | `p-card`                  | `<app-card-shell>` | —                       |
| `film-room/film-room.component.ts`                              | `p-card styleClass`       | `<app-card-shell>` | Video card styles       |
| `film-room/film-room.component.scss`                            | `.card-header`            | Delete             | Custom header           |
| `playbook/playbook.component.ts`                                | `p-card`                  | `<app-card-shell>` | —                       |
| `achievements/achievements.component.ts`                        | `p-card`                  | `<app-card-shell>` | —                       |
| `profile/profile.component.ts`                                  | `p-card styleClass`       | `<app-card-shell>` | Profile card styles     |
| `profile/profile.component.scss`                                | `:host ::ng-deep .p-card` | Delete             | All card rules          |
| `settings/privacy-controls/privacy-controls.component.ts`       | `p-card`                  | `<app-card-shell>` | —                       |
| `equipment/equipment.component.ts`                              | `p-card styleClass`       | `<app-card-shell>` | Equipment card styles   |
| `equipment/equipment.component.scss`                            | `:host ::ng-deep`         | Delete             | Card overrides          |
| `tournaments/tournaments.component.ts`                          | `p-card styleClass`       | `<app-card-shell>` | Tournament card styles  |
| `team-calendar/team-calendar.component.ts`                      | `p-card styleClass`       | `<app-card-shell>` | Calendar card styles    |
| `team-calendar/team-calendar.component.scss`                    | `:host ::ng-deep`         | Delete             | Card overrides          |
| `roster/components/roster-player-card.component.ts`             | `p-card`                  | `<app-card-shell>` | —                       |
| `roster/components/roster-staff-card.component.ts`              | `p-card`                  | `<app-card-shell>` | —                       |
| `roster/components/roster-overview.component.ts`                | `p-card`                  | `<app-card-shell>` | —                       |
| `depth-chart/depth-chart.component.ts`                          | `p-card styleClass`       | `<app-card-shell>` | Depth chart card styles |
| `depth-chart/depth-chart.component.scss`                        | `:host ::ng-deep`         | Delete             | Card overrides          |
| `attendance/attendance.component.ts`                            | `p-card styleClass`       | `<app-card-shell>` | Attendance card styles  |
| `attendance/attendance.component.scss`                          | `:host ::ng-deep`         | Delete             | Card overrides          |
| `officials/officials.component.ts`                              | `p-card styleClass`       | `<app-card-shell>` | Officials card styles   |
| `officials/officials.component.scss`                            | `:host ::ng-deep`         | Delete             | Card overrides          |
| `payments/payments.component.ts`                                | `p-card`                  | `<app-card-shell>` | —                       |
| `payments/payments.component.scss`                              | Custom card styles        | Delete             | Card overrides          |
| `data-import/data-import.component.ts`                          | `p-card`                  | `<app-card-shell>` | —                       |
| `exercisedb/exercisedb-manager.component.ts`                    | `p-card styleClass`       | `<app-card-shell>` | Exercise card styles    |
| `exercisedb/exercisedb-manager.component.scss`                  | `:host ::ng-deep`         | Delete             | Card overrides          |
| `game/tournament-nutrition/tournament-nutrition.component.ts`   | `p-card styleClass`       | `<app-card-shell>` | Nutrition card styles   |
| `game/tournament-nutrition/tournament-nutrition.component.scss` | `:host ::ng-deep`         | Delete             | Card overrides          |
| `travel/travel-recovery/travel-recovery.component.ts`           | `p-card`                  | `<app-card-shell>` | —                       |
| `travel/travel-recovery/travel-recovery.component.scss`         | Custom card styles        | Delete             | Card overrides          |
| `return-to-play/return-to-play.component.ts`                    | `p-card`                  | `<app-card-shell>` | —                       |
| `workout/workout.component.ts`                                  | `p-card`                  | `<app-card-shell>` | —                       |

---

### 3.7 Admin/Superadmin Features

| File                                             | Current Pattern     | New Usage          | SCSS to Delete    |
| ------------------------------------------------ | ------------------- | ------------------ | ----------------- |
| `superadmin/superadmin-dashboard.component.ts`   | `p-card styleClass` | `<app-card-shell>` | Admin card styles |
| `superadmin/superadmin-dashboard.component.scss` | `:host ::ng-deep`   | Delete             | Card overrides    |
| `superadmin/superadmin-settings.component.ts`    | `p-card`            | `<app-card-shell>` | —                 |
| `superadmin/superadmin-settings.component.scss`  | Custom card styles  | Delete             | Card overrides    |
| `admin/superadmin-dashboard.component.scss`      | `:host ::ng-deep`   | Delete             | Card overrides    |

---

### 3.8 Auth Features (Special handling)

| File                                                | Current Pattern     | New Usage               | SCSS to Delete        |
| --------------------------------------------------- | ------------------- | ----------------------- | --------------------- |
| `auth/login/login.component.ts`                     | `p-card styleClass` | Keep centered auth card | Exception: Auth cards |
| `auth/register/register.component.ts`               | `p-card`            | Keep centered auth card | Exception: Auth cards |
| `auth/reset-password/reset-password.component.ts`   | `p-card`            | Keep centered auth card | Exception: Auth cards |
| `auth/verify-email/verify-email.component.ts`       | `p-card`            | Keep centered auth card | Exception: Auth cards |
| `auth/update-password/update-password.component.ts` | `p-card`            | Keep centered auth card | Exception: Auth cards |
| `auth/auth-callback/auth-callback.component.ts`     | `p-card`            | Keep centered auth card | Exception: Auth cards |

**Note:** Auth cards use a special centered layout and may retain `p-card` with minimal customization.

---

### 3.9 Onboarding & Landing

| File                                   | Current Pattern         | New Usage            | SCSS to Delete          |
| -------------------------------------- | ----------------------- | -------------------- | ----------------------- |
| `onboarding/onboarding.component.ts`   | `p-card styleClass`     | `<app-card-shell>`   | Onboarding card styles  |
| `onboarding/onboarding.component.scss` | `:host ::ng-deep`       | Delete               | Card overrides          |
| `landing/landing.component.ts`         | `p-card styleClass`     | Keep marketing cards | Exception: Landing page |
| `landing/landing.component.scss`       | Custom marketing styles | Keep                 | Marketing exception     |

---

## 4. Component Import Updates

After migration, update component imports:

```typescript
// BEFORE
import { CardModule } from "primeng/card";

// AFTER (if no p-card remains)
import { CardShellComponent } from "@shared/components/card-shell";

// Component imports array
imports: [
  // Remove: CardModule (if unused)
  CardShellComponent,
];
```

---

## 5. SCSS Cleanup Checklist

For each migrated component, delete:

- [ ] `:host ::ng-deep .p-card { ... }`
- [ ] `:host ::ng-deep .p-card-body { ... }`
- [ ] `:host ::ng-deep .p-card-content { ... }`
- [ ] `:host ::ng-deep .p-card-header { ... }`
- [ ] `.custom-card { ... }`
- [ ] `.card-header { ... }` (feature-specific)
- [ ] `.card-body { ... }` (feature-specific)
- [ ] `.card-footer { ... }` (feature-specific)
- [ ] Any `styleClass` referenced styling

---

## 6. Testing Checklist

After each migration:

- [ ] Card renders with correct radius (12px)
- [ ] Card has correct shadow at rest
- [ ] Card shadow elevates on hover
- [ ] Header icon renders in correct color
- [ ] Title and subtitle typography correct
- [ ] Body padding correct (16px default, 12px compact)
- [ ] Footer renders with separator
- [ ] Interactive cards have hover lift
- [ ] Focus ring visible on keyboard navigation
- [ ] Dark mode renders correctly
- [ ] Reduced motion preference respected

---

## 7. Migration Commands

### Find all p-card usages

```bash
grep -r "p-card" --include="*.ts" angular/src/app/features/
```

### Find all ::ng-deep card overrides

```bash
grep -r "::ng-deep.*p-card\|::ng-deep.*\.card" --include="*.scss" angular/src/app/features/
```

### Find styleClass card patterns

```bash
grep -r 'styleClass=".*card' --include="*.ts" angular/src/app/features/
```

---

## 8. Estimated Effort

| Priority     | Files  | Estimated Hours |
| ------------ | ------ | --------------- |
| 1. Training  | 15     | 8-10            |
| 2. Dashboard | 8      | 4-6             |
| 3. Coach     | 16     | 8-10            |
| 4. Staff     | 6      | 3-4             |
| 5. Analytics | 3      | 2-3             |
| 6. Remaining | 35     | 15-20           |
| **Total**    | **83** | **40-53**       |

---

**Document Version:** 1.0  
**Last Updated:** January 4, 2026  
**Author:** Design System Team
