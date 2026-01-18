# Color + Status Migration

## Mapping Table (Status -> Tokens)

Status | Solid | Background | Text | Border
---|---|---|---|---
success | `var(--ds-status-success-solid)` | `var(--ds-status-success-bg)` | `var(--ds-status-success-text)` | `var(--ds-status-success-border)`
warning | `var(--ds-status-warning-solid)` | `var(--ds-status-warning-bg)` | `var(--ds-status-warning-text)` | `var(--ds-status-warning-border)`
danger | `var(--ds-status-danger-solid)` | `var(--ds-status-danger-bg)` | `var(--ds-status-danger-text)` | `var(--ds-status-danger-border)`
info | `var(--ds-status-info-solid)` | `var(--ds-status-info-bg)` | `var(--ds-status-info-text)` | `var(--ds-status-info-border)`
neutral | `var(--ds-status-neutral-solid)` | `var(--ds-status-neutral-bg)` | `var(--ds-status-neutral-text)` | `var(--ds-status-neutral-border)`

Status aliases (utility mapping):
- `active` -> `success`
- `inactive` -> `neutral`
- `low` -> `success`
- `moderate` -> `warning`
- `high` -> `warning`
- `critical` -> `danger`
- `under-training` -> `info`
- `sweet-spot` -> `success`
- `elevated-risk` -> `warning`
- `danger-zone` -> `danger`
- `no-data` -> `neutral`

## File Changes
- `angular/src/styles/design-system/design-tokens.scss` (added status aliases/glow)
- `angular/src/app/shared/utils/status.utils.ts` (single status variant map + tokens)
- `angular/src/app/shared/components/status-tag/status-tag.component.ts`
- `angular/src/app/shared/components/risk-badge/risk-badge.component.ts`
- `angular/src/app/shared/components/traffic-light-risk/traffic-light-risk.component.scss`
- `angular/src/app/shared/components/status-timeline/status-timeline.component.scss`
- `angular/src/app/shared/components/alert/alert.component.scss`
- `angular/src/app/shared/components/toast/toast.component.scss`
- `angular/src/app/shared/components/card/card.component.scss`
- `angular/src/assets/styles/primitives/_badges.scss`
- `angular/src/assets/styles/primitives/_feedback.scss`

## Remaining Hardcoded Colors (app styles)
Files still containing hex color literals in `angular/src/app`:
- `angular/src/app/app.component.scss`
- `angular/src/app/features/analytics/analytics.component.ts`
- `angular/src/app/features/coach/coach-activity-feed.component.ts`
- `angular/src/app/features/coach/coach-analytics/coach-analytics.component.scss`
- `angular/src/app/features/coach/payment-management/payment-management.component.ts`
- `angular/src/app/features/coach/player-development/player-development.component.ts`
- `angular/src/app/features/coach/team-management/team-management.component.ts`
- `angular/src/app/features/community/community.component.ts`
- `angular/src/app/features/debug/debug-console.component.ts`
- `angular/src/app/features/onboarding/onboarding.component.scss`
- `angular/src/app/features/return-to-play/return-to-play.component.ts`
- `angular/src/app/features/settings/settings.component.scss`
- `angular/src/app/features/sleep-debt/sleep-debt.component.ts`
- `angular/src/app/features/staff/psychology/psychology-reports.component.ts`
- `angular/src/app/features/training/daily-protocol/components/player-settings-dialog.component.scss`
- `angular/src/app/features/training/daily-protocol/components/protocol-block.component.scss`
- `angular/src/app/features/training/daily-protocol/components/tournament-calendar.component.scss`
- `angular/src/app/features/training/daily-protocol/components/week-progress-strip.component.scss`
- `angular/src/app/features/training/flag-load.component.ts`
- `angular/src/app/features/training/training-schedule/training-schedule.component.scss`
- `angular/src/app/features/coach/playbook-manager/playbook-manager.component.scss`
- `angular/src/app/features/game/tournament-nutrition/tournament-nutrition.component.scss`
- `angular/src/app/features/roster/components/roster-player-card.component.scss`
- `angular/src/app/shared/components/action-panel/action-panel.component.ts`
- `angular/src/app/shared/components/body-composition-card/body-composition-card.component.scss`
- `angular/src/app/shared/components/cookie-consent-banner/cookie-consent-banner.component.scss`
- `angular/src/app/shared/components/drawer/drawer.component.scss`
- `angular/src/app/shared/components/evidence-preset-indicator/evidence-preset-indicator.component.scss`
- `angular/src/app/shared/components/lazy-chart/lazy-chart.component.ts`
- `angular/src/app/shared/components/modal/modal.component.ts`
- `angular/src/app/shared/components/page-loading-state/page-loading-state.component.ts`
- `angular/src/app/shared/components/pagination/pagination.component.ts`
- `angular/src/app/features/analytics/enhanced-analytics/enhanced-analytics.component.ts`
- `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.ts`
- `angular/src/app/features/game-tracker/live-game-tracker.component.ts`
- `angular/src/app/core/constants/app.constants.ts`
- `angular/src/app/core/interceptors/debug.interceptor.ts`
- `angular/src/app/core/services/admin.service.ts`
- `angular/src/app/core/services/debug.service.ts`
- `angular/src/app/core/services/instagram-video.service.ts`
- `angular/src/app/core/services/lazy-pdf.service.ts`
- `angular/src/app/core/services/lazy-screenshot.service.ts`
- `angular/src/app/core/services/performance-data.service.ts`
- `angular/src/app/core/services/theme.service.ts`
- `angular/src/app/core/services/wellness.service.ts`
- `angular/src/app/core/services/wellness.service.spec.ts`
- `angular/src/app/core/utils/design-tokens.util.ts`
- `angular/src/app/shared/config/enhanced-chart.config.ts`
- `angular/src/app/shared/components/interactive-skills-radar/interactive-skills-radar.component.ts`
- `angular/src/app/shared/components/progress-indicator/progress-indicator.component.ts`
- `angular/src/app/shared/models/design-tokens.ts`
- `angular/src/app/accessibility.spec.ts`
