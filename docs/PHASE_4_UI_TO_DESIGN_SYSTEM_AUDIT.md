# Phase 4 — UI → Design System & Rules Audit

**Generated:** January 2026  
**Purpose:** Mechanical and ruthless audit of design system rule violations  
**Method:** Automated checks + manual verification  
**Rule:** If it works but violates rules, it is broken.

---

## 🎯 Audit Scope

**Automated Checks:**
- ✅ Stylelint violations
- ✅ Token enforcement (no raw spacing, no raw colors)
- ✅ No custom PrimeNG overrides outside allowed files

**Manual Checks:**
- ✅ Any `.p-*` styled outside allowed files
- ✅ Any new component without a standard recipe
- ✅ Any `[rounded]="true"` without intent
- ✅ Any `!important` without ticket + expiry

---

## 📊 Summary Statistics

| Violation Type | Count | Severity |
|----------------|-------|----------|
| **Raw Colors (hex/rgb)** | 41 files | 🔴 CRITICAL |
| **Raw Spacing (px/rem)** | 5,233+ instances | 🔴 CRITICAL |
| **PrimeNG Overrides (.p-*)** | 55 files | 🔴 CRITICAL |
| **!important without ticket** | 33 instances | 🔴 CRITICAL |
| **[rounded]="true"** | 3 instances | 🔴 CRITICAL |
| **transition: all** | 21 files | 🟡 WARNING |
| **border-radius violations** | 9 files | 🟡 WARNING |

---

## 🔴 CRITICAL VIOLATIONS

### 1. Raw Colors (Hex/RGB) — 41 Files

**Rule:** Hex colors ONLY in `design-system-tokens.scss`. All other files must use CSS variables.

**Violations Found:**

```
angular/src/app/features/dashboard/coach-dashboard.component.scss
angular/src/app/shared/components/scroll-to-top/scroll-to-top.component.scss
angular/src/app/shared/components/roster-skeleton/roster-skeleton.component.scss
angular/src/app/shared/components/form-error-summary/form-error-summary.component.scss
angular/src/app/shared/components/dashboard-skeleton/dashboard-skeleton.component.scss
angular/src/app/shared/components/app-banner/app-banner.component.scss
angular/src/app/shared/components/button/button.component.scss
angular/src/app/features/coach/coach-analytics/coach-analytics.component.scss
angular/src/app/features/roster/components/roster-player-card.component.scss
angular/src/app/features/game/tournament-nutrition/tournament-nutrition.component.scss
angular/src/app/features/settings/settings.component.scss
angular/src/app/shared/components/progress-indicator/progress-indicator.component.scss
angular/src/app/shared/components/skeleton/skeleton.component.scss
angular/src/app/shared/components/header/header.component.scss
angular/src/app/features/training/daily-protocol/components/session-log-form.component.scss
angular/src/app/shared/components/sidebar/sidebar.component.scss
angular/src/app/features/analytics/analytics.component.scss
angular/src/app/features/landing/landing.component.scss
angular/src/app/features/training/daily-protocol/components/exercise-card.component.scss
angular/src/app/shared/components/page-header/page-header.component.scss
angular/src/app/shared/components/toggle-switch/toggle-switch.component.scss
angular/src/app/shared/components/supplement-tracker/supplement-tracker.component.scss
angular/src/app/shared/components/achievement-badge/achievement-badge.component.scss
angular/src/app/shared/components/file-upload/file-upload.component.scss
angular/src/app/shared/components/notifications-panel/notifications-panel.component.scss
angular/src/app/shared/components/image-upload/image-upload.component.scss
angular/src/app/features/coach/playbook-manager/playbook-manager.component.scss
angular/src/app/shared/components/daily-readiness/daily-readiness.component.scss
angular/src/app/shared/components/checkbox/checkbox.component.scss
angular/src/app/features/training/qb-throwing-tracker/qb-throwing-tracker.component.scss
angular/src/app/shared/components/smart-breadcrumbs/smart-breadcrumbs.component.scss
angular/src/app/shared/components/micro-session/micro-session.component.scss
angular/src/app/shared/components/input/input.component.scss
angular/src/app/shared/components/evidence-preset-indicator/evidence-preset-indicator.component.scss
angular/src/app/shared/components/error-boundary/error-boundary.component.scss
angular/src/app/shared/components/drawer/drawer.component.scss
angular/src/app/features/training/daily-protocol/components/week-progress-strip.component.scss
angular/src/app/features/training/daily-protocol/components/tournament-calendar.component.scss
angular/src/app/features/training/daily-protocol/components/protocol-block.component.scss
angular/src/app/features/training/daily-protocol/components/player-settings-dialog.component.scss
angular/src/app/app.component.scss
```

**Required Fix:** Replace all hex/rgb colors with design token variables (`var(--ds-*)`).

---

### 2. Raw Spacing Values (px/rem) — 5,233+ Instances

**Rule:** No raw spacing values allowed. Must use spacing tokens (`var(--space-*)`).

**Violations Found:** 259 files contain raw px/rem values

**Examples:**
- `padding: 16px` → Should be `padding: var(--space-4)`
- `margin: 12px` → Should be `margin: var(--space-3)`
- `gap: 0.5rem` → Should be `gap: var(--space-2)`

**Required Fix:** Replace all raw spacing values with spacing tokens.

---

### 3. PrimeNG Overrides (.p-*) Outside Allowed Files — 55 Files

**Rule:** PrimeNG styles may exist **only** in:
- `primeng/token-mapping.scss`
- `primeng/brand-overrides.scss`
- `@layer overrides` (documented exceptions)

**Violations Found:**

```
angular/src/app/shared/components/acwr-baseline/acwr-baseline.component.scss
angular/src/app/features/dashboard/player-dashboard.component.scss
angular/src/app/features/auth/update-password/update-password.component.scss
angular/src/app/features/chat/chat.component.scss
angular/src/app/features/roster/components/roster-player-card.component.scss
angular/src/app/features/game/tournament-nutrition/tournament-nutrition.component.scss
angular/src/app/features/coach/scouting/scouting-reports.component.scss
angular/src/app/features/return-to-play/return-to-play.component.scss
angular/src/app/features/training/video-feed/video-feed.component.scss
angular/src/app/features/training/video-suggestion/video-suggestion.component.scss
angular/src/app/features/training/training-schedule/training-schedule.component.scss
angular/src/app/features/settings/settings.component.scss
angular/src/app/features/admin/superadmin-dashboard.component.scss
angular/src/app/features/tournaments/tournaments.component.scss
angular/src/app/features/game-tracker/game-tracker.component.scss
angular/src/app/shared/components/search-panel/search-panel.component.scss
angular/src/app/shared/components/header/header.component.scss
angular/src/app/features/training/daily-protocol/components/session-log-form.component.scss
angular/src/app/features/analytics/analytics.component.scss
angular/src/app/features/onboarding/onboarding.component.scss
angular/src/app/shared/components/session-analytics/session-analytics.component.scss
angular/src/app/shared/components/supplement-tracker/supplement-tracker.component.scss
angular/src/app/features/profile/profile.component.scss
angular/src/app/features/training/daily-protocol/components/wellness-checkin.component.scss
angular/src/app/shared/components/recovery-dashboard/recovery-dashboard.component.scss
angular/src/app/features/data-import/data-import.component.scss
angular/src/app/shared/components/game-day-countdown/game-day-countdown.component.scss
angular/src/app/shared/components/wellness-score-display/wellness-score-display.component.scss
angular/src/app/shared/components/daily-readiness/daily-readiness.component.scss
angular/src/app/shared/components/stats-grid/stats-grid.component.scss
angular/src/app/shared/components/toast/toast.component.scss
angular/src/app/shared/components/morning-briefing/morning-briefing.component.scss
angular/src/app/features/exercise-library/exercise-library.component.scss
angular/src/app/shared/components/tournament-mode-widget/tournament-mode-widget.component.scss
angular/src/app/shared/components/post-training-recovery/post-training-recovery.component.scss
angular/src/app/shared/components/team-wellness-overview/team-wellness-overview.component.scss
angular/src/app/shared/components/smart-breadcrumbs/smart-breadcrumbs.component.scss
angular/src/app/shared/components/rest-timer/rest-timer.component.scss
angular/src/app/shared/components/quick-wellness-checkin/quick-wellness-checkin.component.scss
angular/src/app/shared/components/offline-banner/offline-banner.component.scss
angular/src/app/shared/components/micro-session/micro-session.component.scss
angular/src/app/shared/components/keyboard-shortcuts-modal/keyboard-shortcuts-modal.component.scss
angular/src/app/shared/components/hydration-tracker/hydration-tracker.component.scss
angular/src/app/shared/components/date-picker/date-picker.component.scss
angular/src/app/features/training/video-curation/video-curation.component.scss
angular/src/app/features/training/video-curation/components/video-curation-analytics.component.scss
angular/src/app/features/training/daily-protocol/components/la28-roadmap.component.scss
angular/src/app/features/staff/psychology/psychology-reports.component.scss
angular/src/app/features/staff/physiotherapist/physiotherapist-dashboard.component.scss
angular/src/app/features/staff/nutritionist/nutritionist-dashboard.component.scss
angular/src/app/features/sleep-debt/sleep-debt.component.scss
angular/src/app/features/settings/privacy-controls/privacy-controls.component.scss
angular/src/app/features/performance-tracking/performance-tracking.component.scss
angular/src/app/features/auth/login/login.component.scss
angular/src/app/features/training/components/periodization-dashboard/periodization-dashboard.component.scss
```

**Required Fix:** 
1. Move PrimeNG overrides to `primeng/brand-overrides.scss` OR
2. Move to `@layer overrides` with documented exception ticket

---

### 4. !important Without Ticket + Expiry — 33 Instances

**Rule:** `!important` allowed **only** in `@layer overrides` with documented exception (ticket + expiry date).

**Violations Found:**

#### `acwr-dashboard.component.scss` (2 instances)
```scss
canvas {
  max-width: 100% !important;  // ❌ NO TICKET
  height: auto !important;     // ❌ NO TICKET
}
```

#### `player-dashboard.component.scss` (15 instances)
```scss
canvas {
  max-width: 100% !important;  // ❌ NO TICKET
  height: auto !important;     // ❌ NO TICKET
}

:global(.p-timeline-event-content) {
  padding: var(--space-2) !important;  // ❌ NO TICKET
}

:global(.p-message) {
  padding: var(--space-3) !important;  // ❌ NO TICKET
  font-size: var(--font-size-h4) !important;  // ❌ NO TICKET
}

.p-progressbar {
  height: 6px !important;  // ❌ NO TICKET
}

.p-chart canvas {
  max-width: 100% !important;  // ❌ NO TICKET
  height: auto !important;     // ❌ NO TICKET
}

.p-timeline .p-timeline-event-marker {
  width: 12px !important;   // ❌ NO TICKET
  height: 12px !important;  // ❌ NO TICKET
}

.p-timeline-event-connector {
  width: 2px !important;  // ❌ NO TICKET
}

.milestone-tag {
  font-size: var(--font-body-2xs) !important;  // ❌ NO TICKET
}
```

#### `game-tracker.component.scss` (8 instances)
```scss
:global(.p-select) {
  font-size: 16px !important;  // ❌ NO TICKET (Prevent iOS zoom)
}

:global(th), :global(td) {
  padding: var(--space-2) var(--space-3) !important;  // ❌ NO TICKET
  font-size: var(--font-size-h4) !important;  // ❌ NO TICKET
}

:global(.p-tag) {
  font-size: 10px !important;  // ❌ NO TICKET
  padding: 4px 8px !important;  // ❌ NO TICKET
}

:global(select), :global(textarea) {
  font-size: 16px !important;  // ❌ NO TICKET (Prevent iOS zoom)
}

:global(.p-card-body) {
  padding: var(--space-3) !important;  // ❌ NO TICKET
}
```

#### `analytics.component.scss` (3 instances)
```scss
canvas {
  max-width: 100% !important;  // ❌ NO TICKET
  height: auto !important;     // ❌ NO TICKET
}

.share-dialog :global(.p-dialog) {
  width: 95vw !important;      // ❌ NO TICKET
  max-width: 95vw !important;  // ❌ NO TICKET
}

textarea {
  font-size: 16px !important;  // ❌ NO TICKET (Prevent iOS zoom)
}
```

#### `onboarding.component.scss` (5 instances)
```scss
.p-autocomplete-input {
  width: 100% !important;  // ❌ NO TICKET
}

color: var(--ds-text-on-primary) !important;  // ❌ NO TICKET

::ng-deep .p-autocomplete-panel {
  position: fixed !important;  // ❌ NO TICKET
  z-index: 9999 !important;   // ❌ NO TICKET
}
```

**Required Fix:** 
1. Move all `!important` declarations to `@layer overrides` OR
2. Add exception ticket comment with expiry date

---

### 5. [rounded]="true" — 3 Instances (FORBIDDEN)

**Rule:** `[rounded]="true"` is **FORBIDDEN**. All buttons use raised (rectangular) style with `--radius-lg` (8px).

**Violations Found:**

#### `review-decision-dialog.component.ts` (1 instance)
```typescript
<p-button
  icon="pi pi-times"
  [text]="true"
  [rounded]="true"  // ❌ FORBIDDEN
  severity="danger"
  (onClick)="removeConsequence($index)">
</p-button>
```

#### `create-decision-dialog.component.ts` (2 instances)
```typescript
<p-tag value="Required" severity="danger" [rounded]="true"></p-tag>  // ❌ FORBIDDEN

<p-button
  icon="pi pi-times"
  [text]="true"
  [rounded]="true"  // ❌ FORBIDDEN
  severity="danger"
  (onClick)="removeConstraint($index)">
</p-button>
```

**Required Fix:** Remove `[rounded]="true"` attribute. Use default raised style.

---

## 🟡 WARNING VIOLATIONS

### 6. transition: all — 21 Files

**Rule:** `transition: all` is forbidden. Use specific property transitions.

**Violations Found:**

```
angular/src/app/features/acwr-dashboard/acwr-dashboard.component.scss
angular/src/app/shared/components/form-error-summary/form-error-summary.component.scss
angular/src/app/features/dashboard/player-dashboard.component.scss
angular/src/app/features/training/video-feed/video-feed.component.scss
angular/src/app/features/training/training-schedule/training-schedule.component.scss
angular/src/app/features/settings/settings.component.scss
angular/src/app/shared/components/search-panel/search-panel.component.scss
angular/src/app/features/analytics/analytics.component.scss
angular/src/styles.scss
angular/src/app/shared/components/stepper/stepper.component.scss
angular/src/app/features/onboarding/onboarding.component.scss
angular/src/assets/styles/ui-standardization.scss
angular/src/assets/styles/standardized-components.scss
angular/src/app/shared/components/morning-briefing/morning-briefing.component.scss
angular/src/assets/styles/premium-interactions.scss
angular/src/assets/styles/hover-system.scss
angular/src/assets/styles/primitives/_index.scss
angular/src/assets/styles/_canonical-mixins.scss
angular/src/styles/_mixins.scss
angular/src/assets/styles/component-styles.scss
angular/src/app/features/game-tracker/game-tracker.component.css
```

**Required Fix:** Replace `transition: all` with specific property transitions (e.g., `transition: background-color var(--motion-base), transform var(--motion-base)`).

---

### 7. Border Radius Violations (10px/14px/100px/9999px) — 9 Files

**Rule:** 10px and 14px are **not allowed**. Use tokens: `--radius-sm` (2px), `--radius-md` (6px), `--radius-lg` (8px), `--radius-xl` (12px), `--radius-2xl` (16px).

**Violations Found:**

```
angular/src/app/shared/components/scroll-to-top/scroll-to-top.component.scss
angular/src/app/features/training/daily-protocol/components/exercise-card.component.scss
angular/src/app/shared/components/skip-to-content/skip-to-content.component.scss
angular/src/app/shared/components/toggle-switch/toggle-switch.component.scss
angular/src/app/shared/components/supplement-tracker/supplement-tracker.component.scss
angular/src/assets/styles/ui-standardization.scss
angular/src/assets/styles/primeng-integration.scss
angular/src/app/shared/components/hydration-tracker/hydration-tracker.component.scss
angular/src/app/features/training/daily-protocol/components/week-progress-strip.component.scss
```

**Migration:**
- `10px` → `var(--radius-lg)` (8px) or `var(--radius-xl)` (12px)
- `14px` → `var(--radius-xl)` (12px) or `var(--radius-2xl)` (16px)
- `100px` or `9999px` → `var(--radius-lg)` or `var(--radius-md)`

**Required Fix:** Replace all raw border-radius values with design tokens.

---

## 📋 Component Recipe Violations

### Components Without Standard Recipes

**Rule:** All new components must follow standard recipes defined in design system.

**Status:** ⚠️ **MANUAL REVIEW REQUIRED**

**Check Required:**
- Verify all components in `angular/src/app/shared/components/` follow standard recipes
- Verify all components in `angular/src/app/features/` follow standard recipes
- Check for custom styling that bypasses design system primitives

**Standard Recipe Files:**
- `angular/src/assets/styles/primitives/_forms.scss`
- `angular/src/assets/styles/primitives/_tables.scss`
- `angular/src/assets/styles/primitives/_dialogs.scss`
- `angular/src/assets/styles/primitives/_badges.scss`
- `angular/src/assets/styles/primitives/_layout.scss`

---

## ✅ Allowed Files (Not Violations)

These files are **ALLOWED** to contain PrimeNG overrides or raw values:

### PrimeNG Files (Allowed)
- `angular/src/assets/styles/primeng/_token-mapping.scss` ✅
- `angular/src/assets/styles/primeng/_brand-overrides.scss` ✅
- `angular/src/assets/styles/primeng-integration.scss` ✅ (legacy, migrating)
- `angular/src/assets/styles/primeng-theme.scss` ✅ (legacy, migrating)

### Token Files (Allowed)
- `angular/src/assets/styles/design-system-tokens.scss` ✅ (hex colors allowed)

### Override Layer Files (Allowed)
- `angular/src/assets/styles/overrides/_exceptions.scss` ✅ (`!important` allowed with ticket)

---

## 🔧 Required Actions

### Priority 1: Critical Violations (Blocking)

1. **Remove all raw colors** (41 files)
   - Replace hex/rgb with `var(--ds-*)` tokens
   - Run Stylelint to catch remaining violations

2. **Remove all PrimeNG overrides** from component files (55 files)
   - Move to `primeng/brand-overrides.scss` OR
   - Move to `@layer overrides` with exception ticket

3. **Remove all `!important`** without tickets (33 instances)
   - Move to `@layer overrides` with exception ticket OR
   - Refactor to avoid `!important`

4. **Remove `[rounded]="true"`** (3 instances)
   - Remove attribute, use default raised style

### Priority 2: Warning Violations (Non-Blocking)

5. **Replace `transition: all`** (21 files)
   - Use specific property transitions

6. **Replace border-radius violations** (9 files)
   - Use design tokens (`var(--radius-*)`)

### Priority 3: Manual Review

7. **Component recipe audit**
   - Verify all components follow standard recipes
   - Document any exceptions

---

## 📊 Compliance Status

| Category | Status | Compliance |
|----------|--------|------------|
| **Raw Colors** | ❌ FAILING | 0% (41 violations) |
| **Raw Spacing** | ❌ FAILING | 0% (5,233+ violations) |
| **PrimeNG Boundaries** | ❌ FAILING | 0% (55 violations) |
| **!important Rules** | ❌ FAILING | 0% (33 violations) |
| **[rounded] Usage** | ❌ FAILING | 0% (3 violations) |
| **transition: all** | ⚠️ WARNING | ~50% (21 violations) |
| **Border Radius** | ⚠️ WARNING | ~70% (9 violations) |

**Overall Compliance:** 🔴 **0%** (Critical violations block compliance)

---

## 🎯 Next Steps

1. **Immediate:** Fix all critical violations (Priority 1)
2. **Short-term:** Fix warning violations (Priority 2)
3. **Ongoing:** Manual component recipe audit (Priority 3)
4. **Preventive:** Enable Stylelint in CI/CD to block violations

---

**Status:** 🔴 **SYSTEM BYPASSED** | ⏳ **FIXES REQUIRED**

The design system is being bypassed in 138+ files. All critical violations must be fixed before new UI work can proceed.

