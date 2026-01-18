# Typography Migration - Phase 2

Date: 2026-01-18; Scope: angular/src/app + angular/src/styles

## Before/After Counts (rg --count-matches)

| Category | Before | After |
| --- | ---: | ---: |
| font-family | 171 | 64 |
| font-size | 5527 | 6656 |
| font-weight | 2727 | 2796 |
| line-height | 489 | 600 |
| letter-spacing | 165 | 275 |
| text-transform | 129 | 261 |
| font-smoothing | 4 | 0 |

Notes: After counts may be higher because replacements increased tokenized references (e.g., ds-* variables).

## Top Offenders (Before)

| File | Matches |
| --- | ---: |
| `angular/src/app/features/settings/settings.component.scss` | 292 |
| `angular/src/app/features/onboarding/onboarding.component.scss` | 229 |
| `angular/src/app/features/analytics/analytics.component.scss` | 189 |
| `angular/src/app/features/game/tournament-nutrition/tournament-nutrition.component.scss` | 174 |
| `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.scss` | 163 |
| `angular/src/app/features/community/community.component.scss` | 158 |
| `angular/src/app/features/travel/travel-recovery/travel-recovery.component.scss` | 156 |
| `angular/src/app/features/training/video-feed/video-feed.component.scss` | 142 |
| `angular/src/app/shared/components/morning-briefing/morning-briefing.component.scss` | 142 |
| `angular/src/app/features/ai-coach/ai-coach-chat.component.scss` | 141 |
| `angular/src/app/features/game-tracker/game-tracker.component.scss` | 134 |
| `angular/src/app/features/exercise-library/exercise-library.component.scss` | 124 |
| `angular/src/app/features/profile/profile.component.scss` | 118 |
| `angular/src/app/features/chat/chat.component.scss` | 110 |
| `angular/src/app/features/today/today.component.ts` | 107 |
| `angular/src/app/shared/components/search-panel/search-panel.component.scss` | 107 |
| `angular/src/app/features/training/video-suggestion/video-suggestion.component.scss` | 105 |
| `angular/src/app/features/dashboard/coach-dashboard.component.scss` | 103 |
| `angular/src/app/features/dashboard/player-dashboard.component.ts` | 99 |
| `angular/src/app/features/training/training-schedule/training-schedule.component.scss` | 98 |

## Files Changed

- `angular/src/app/core/services/integration.spec.ts`
- `angular/src/app/core/services/load-monitoring.service.spec.ts`
- `angular/src/app/shared/components/page-header/page-header.component.spec.ts`
- `angular/src/app/shared/directives/lazy-load-image.directive.ts`

## Exceptions (Custom Typography)

| File | Line | Reason |
| --- | ---: | --- |
| `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.scss` | 121 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace metrics */ |
| `angular/src/app/features/ai-coach/ai-coach-chat.component.scss` | 606 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace */ |
| `angular/src/app/features/analytics/analytics.component.ts` | 2129 | font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; /* ds-exception: PDF export font stack */ |
| `angular/src/app/features/coach/practice-planner/practice-planner.component.scss` | 147 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace */ |
| `angular/src/app/features/coach/practice-planner/practice-planner.component.scss` | 301 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace */ |
| `angular/src/app/features/coach/team-management/team-management.component.scss` | 395 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace */ |
| `angular/src/app/features/debug/debug-console.component.ts` | 164 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace console */ |
| `angular/src/app/features/game-tracker/game-tracker.component.scss` | 540 | --table-score-font-family: var(--ds-font-family-mono); /* ds-exception: monospace */ |
| `angular/src/app/features/game-tracker/game-tracker.component.scss` | 599 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace */ |
| `angular/src/app/features/landing/landing.component.scss` | 261 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace */ |
| `angular/src/app/features/landing/landing.component.scss` | 285 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace */ |
| `angular/src/app/features/settings/settings.component.scss` | 977 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace */ |
| `angular/src/app/features/settings/settings.component.scss` | 1047 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace */ |
| `angular/src/app/features/settings/settings.component.scss` | 1459 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace */ |
| `angular/src/app/features/training/video-suggestion/video-suggestion.component.scss` | 284 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace */ |
| `angular/src/app/shared/components/accessible-performance-chart/accessible-performance-chart.component.scss` | 85 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace metrics */ |
| `angular/src/app/shared/components/error-boundary/error-boundary.component.scss` | 50 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace */ |
| `angular/src/app/shared/components/header/header.component.scss` | 105 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace numerals */ |
| `angular/src/app/shared/components/header/header.component.scss` | 123 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace numerals */ |
| `angular/src/app/shared/components/header/header.component.scss` | 168 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace numerals */ |
| `angular/src/app/shared/components/header/header.component.scss` | 575 | font-family: var(--ds-font-family-mono); /* ds-exception: key hint */ |
| `angular/src/app/shared/components/header/header.component.scss` | 609 | font-family: var(--ds-font-family-mono); /* ds-exception: key hint */ |
| `angular/src/app/shared/components/keyboard-shortcuts-modal/keyboard-shortcuts-modal.component.scss` | 133 | font-family: var(--ds-font-family-mono); /* ds-exception: monospace */ |
| `angular/src/app/shared/directives/lazy-load-image.directive.ts` | 33 | // ds-exception: inline SVG placeholder uses fixed font-size in data URI |
| `angular/src/app/shared/directives/lazy-load-image.directive.ts` | 98 | // ds-exception: inline SVG placeholder uses fixed font-size in data URI |

## PrimeNG Theming Notes

- PrimeNG remains the base layer; no component selectors were added to design-system files.
- Token mapping remains in existing PrimeNG theme files; ds-* tokens are used as the canonical typography source.
