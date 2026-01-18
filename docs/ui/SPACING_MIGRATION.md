# Spacing Migration (Phase 3)

## Inventory
Top px offenders found with `rg "(margin|padding|gap):\s*\d+px"` in `angular/src/app`:
- `shared/components/button/button.stories.ts` (18)
- `features/debug/debug-console.component.ts` (16)
- `features/analytics/analytics.component.ts` (7)
- `shared/components/header/header.component.scss` (3)
- `shared/components/skeleton-loader/skeleton-loader.stories.ts` (3)
- `features/coach/calendar/calendar-coach.component.scss` (2)
- `shared/components/data-quality-warning/data-quality-warning.component.ts` (1)
- `features/analytics/analytics.component.scss` (1)
- `shared/components/training-heatmap/training-heatmap.component.scss` (1)
- `shared/components/empty-state/empty-state.stories.ts` (1)

Repeated layout patterns observed:
- Cards and card-like panels (shared/patterned padding + gaps).
- Page sections with consistent top/bottom rhythm.
- Forms (label → field → helper/validation spacing).
- Toolbars/search bars with icons + input + actions.

## Refactor Summary
- Converted margin/padding/gap px values to `var(--ds-space-*)` tokens.
- Standardized tight 1px/2px spacing via `calc()` using spacing tokens.
- Consolidated search bar layout via a shared `@mixin search-bar`.

## Shared Search Bar Pattern
Mixin added in `styles/_mixins.scss` and adopted by:
- `features/ai-coach/ai-coach-chat.component.scss`
- `features/coach/knowledge-base/knowledge-base.component.scss`
- `features/training/video-feed/video-feed.component.scss`

## Files Changed
- `angular/src/app/app.component.scss`
- `angular/src/app/features/analytics/analytics.component.scss`
- `angular/src/app/features/analytics/analytics.component.ts`
- `angular/src/app/features/coach/calendar/calendar-coach.component.scss`
- `angular/src/app/features/coach/knowledge-base/knowledge-base.component.scss`
- `angular/src/app/features/debug/debug-console.component.ts`
- `angular/src/app/features/roster/roster.component.scss`
- `angular/src/app/features/today/today.component.html`
- `angular/src/app/features/training/microcycle-planner.component.scss`
- `angular/src/app/features/training/qb-throwing-tracker/qb-throwing-tracker.component.scss`
- `angular/src/app/features/training/video-feed/video-feed.component.scss`
- `angular/src/app/features/training/daily-protocol/components/exercise-card.component.scss`
- `angular/src/app/features/training/daily-protocol/components/player-settings-dialog.component.scss`
- `angular/src/app/features/training/daily-protocol/components/protocol-block.component.scss`
- `angular/src/app/features/training/daily-protocol/components/session-log-form.component.scss`
- `angular/src/app/features/training/daily-protocol/components/tournament-calendar.component.scss`
- `angular/src/app/features/training/daily-protocol/components/week-progress-strip.component.scss`
- `angular/src/app/shared/components/accessible-performance-chart/accessible-performance-chart.component.scss`
- `angular/src/app/shared/components/aria/aria-button.component.scss`
- `angular/src/app/shared/components/button/button.component.scss`
- `angular/src/app/shared/components/button/button.stories.ts`
- `angular/src/app/shared/components/data-quality-warning/data-quality-warning.component.ts`
- `angular/src/app/shared/components/drag-drop-list/drag-drop-list.component.scss`
- `angular/src/app/shared/components/empty-state/empty-state.stories.ts`
- `angular/src/app/shared/components/form-error-summary/form-error-summary.component.scss`
- `angular/src/app/shared/components/header/header.component.scss`
- `angular/src/app/shared/components/live-indicator/live-indicator.component.scss`
- `angular/src/app/shared/components/metric-ring/metric-ring.component.scss`
- `angular/src/app/shared/components/morning-briefing/morning-briefing.component.scss`
- `angular/src/app/shared/components/signal-form/signal-form.component.scss`
- `angular/src/app/shared/components/skeleton-loader/skeleton-loader.stories.ts`
- `angular/src/app/shared/components/status-tag/status-tag.component.ts`
- `angular/src/app/shared/components/status-timeline/status-timeline.component.scss`
- `angular/src/app/shared/components/supplement-tracker/supplement-tracker.component.scss`
- `angular/src/app/shared/components/swipe-table/swipe-table.component.scss`
- `angular/src/app/shared/components/tournament-mode-widget/tournament-mode-widget.component.scss`
- `angular/src/app/shared/components/training-heatmap/training-heatmap.component.scss`
- `angular/src/styles/_mixins.scss`

## Remaining Exceptions
- None. `rg "(margin|padding|gap):\s*\d+px" angular/src/app` returns no matches.
