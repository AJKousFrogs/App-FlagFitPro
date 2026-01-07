# Phase 4.3 — PrimeNG Boundary Migration Progress

**Status:** ✅ **IN PROGRESS**  
**Date:** January 2026  
**Goal:** Enforce PrimeNG styling boundaries by migrating `.p-*` overrides from component SCSS files to allowed override files.

---

## ✅ Completed Migrations

### 1. `acwr-baseline.component.scss`
**Type:** Component-specific exception  
**Migration:** Moved to `_exceptions.scss` (DS-EXC-001)  
**Details:**
- Component-specific progressbar styling override
- Custom height and styling for ACWR baseline widget
- Scoped to `.acwr-baseline` component

### 2. `player-dashboard.component.scss`
**Type:** Component-specific exceptions  
**Migration:** Moved to `_exceptions.scss` (DS-EXC-002)  
**Details:**
- Mobile-responsive timeline overrides
- Mobile-responsive message overrides
- Mobile-responsive progressbar overrides
- Mobile-responsive chart overrides
- Scoped to `.player-dashboard` component

### 3. `analytics.component.scss` (Partial)
**Type:** Global brand styling  
**Migration:** Moved to `_brand-overrides.scss`  
**Details:**
- Global `.p-tabs` styling (modern tab navigation)
- Applied globally to all tabs components

---

## 📋 Migration Pattern

### Categorization Rules

1. **Global Brand Styling** → `_brand-overrides.scss`
   - Styling that applies to all instances of a PrimeNG component
   - Examples: `.p-tabs`, `.p-card-body` padding patterns
   - No component-specific scoping needed

2. **Component-Specific Exceptions** → `_exceptions.scss`
   - Styling scoped to a specific component
   - Requires `!important` or high specificity
   - Mobile-responsive overrides
   - Must include ticket ID, owner, scope, expiry date, reason

3. **Token Mappings** → `_token-mapping.scss`
   - CSS variable assignments for PrimeNG tokens
   - Usually not needed unless creating new tokens

### Migration Steps

1. **Identify `.p-*` selectors** in component SCSS files
2. **Categorize** (global vs component-specific)
3. **Move to appropriate file:**
   - Global → `_brand-overrides.scss`
   - Component-specific → `_exceptions.scss` with ticket
4. **Remove from component SCSS** (leave comment with ticket reference)
5. **Verify visuals unchanged**

---

## 🔄 Remaining Files (52 files)

Based on Phase 4 audit, the following files still need migration:

```
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
angular/src/app/features/analytics/analytics.component.scss (partial - card overrides remain)
```

---

## 📝 Exception Ticket Format

```scss
/* ------------------------------------------------
 * COMPONENT: [component-name].component
 * Ticket: DS-EXC-###
 * Owner: @[owner-name]
 * Scope: [component-name] component only
 * Remove by: YYYY-MM-DD
 * Reason: [One-line reason for exception]
 * ------------------------------------------------ */
.[component-scope] {
  // PrimeNG overrides here
}
```

---

## ✅ Verification Checklist

After each migration:

- [ ] `.p-*` selectors removed from component SCSS
- [ ] Equivalent rules added to appropriate override file
- [ ] Exception ticket created (if component-specific)
- [ ] Visual appearance unchanged
- [ ] Build passes without errors

---

## 🎯 Next Steps

1. Continue migrating remaining files using established pattern
2. Group similar overrides (e.g., all card padding overrides)
3. Review exceptions quarterly and remove expired ones
4. Update design system documentation with migration status

---

**Last Updated:** January 2026  
**Maintained By:** Design System Governance Engineer

