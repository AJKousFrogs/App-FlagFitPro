# UI Consistency Audit Baseline

Date: 2026-01-18; Scope: Angular 21 + PrimeNG UI layer; Method: rg --count-matches over .html/.ts/.js/.scss/.css/.less in repo root.

Notes: Counts reflect regex matches (not unique tokens). Mixed UI layers (legacy + Angular) will inflate counts in non-Angular folders.

## Inventory by Category (Top 20 Files)

### Typography: font-family

| File | Matches |
| --- | ---: |
| `angular/src/assets/styles/typography-system.scss` | 52 |
| `angular/src/app/features/game/tournament-nutrition/tournament-nutrition.component.scss` | 24 |
| `angular/src/app/features/settings/settings.component.scss` | 24 |
| `angular/src/assets/styles/primeng-theme.scss` | 19 |
| `angular/src/assets/styles/design-system-tokens.scss` | 11 |
| `angular/src/styles.scss` | 10 |
| `angular/src/app/features/ai-coach/ai-coach-chat.component.scss` | 9 |
| `angular/src/app/features/game-tracker/game-tracker.component.scss` | 8 |
| `angular/src/app/features/landing/landing.component.scss` | 8 |
| `angular/src/app/features/profile/profile.component.scss` | 8 |
| `angular/src/app/shared/components/header/header.component.scss` | 8 |
| `angular/src/assets/fonts/poppins.css` | 5 |
| `angular/src/assets/styles/primeng/_brand-overrides.scss` | 5 |
| `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.scss` | 4 |
| `angular/src/app/features/roster/components/roster-player-card.component.scss` | 4 |
| `angular/src/app/features/tournaments/tournaments.component.scss` | 4 |
| `angular/src/app/shared/components/action-panel/action-panel.component.ts` | 4 |
| `angular/src/app/shared/components/ai-mode-explanation/ai-mode-explanation.component.ts` | 4 |
| `angular/src/assets/styles/primeng/_token-mapping.scss` | 4 |
| `angular/src/assets/styles/standardized-components.scss` | 4 |

### Typography: font-size

| File | Matches |
| --- | ---: |
| `angular/src/app/features/settings/settings.component.scss` | 163 |
| `angular/src/app/features/analytics/analytics.component.scss` | 131 |
| `angular/src/app/features/travel/travel-recovery/travel-recovery.component.scss` | 126 |
| `angular/src/app/features/onboarding/onboarding.component.scss` | 120 |
| `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.scss` | 112 |
| `angular/src/app/features/community/community.component.scss` | 97 |
| `angular/src/app/features/ai-coach/ai-coach-chat.component.scss` | 96 |
| `angular/src/app/features/training/video-feed/video-feed.component.scss` | 88 |
| `angular/src/app/shared/components/morning-briefing/morning-briefing.component.scss` | 82 |
| `angular/src/assets/styles/overrides/_exceptions.scss` | 82 |
| `angular/src/app/features/game/tournament-nutrition/tournament-nutrition.component.scss` | 81 |
| `angular/src/app/features/training/training-schedule/training-schedule.component.scss` | 72 |
| `angular/src/app/features/training/video-suggestion/video-suggestion.component.scss` | 68 |
| `angular/src/app/features/staff/physiotherapist/physiotherapist-dashboard.component.scss` | 65 |
| `angular/src/assets/styles/primeng-theme.scss` | 65 |
| `angular/src/app/features/chat/chat.component.scss` | 64 |
| `angular/src/app/features/exercise-library/exercise-library.component.scss` | 63 |
| `angular/src/app/features/game-tracker/game-tracker.component.scss` | 62 |
| `angular/src/app/shared/components/search-panel/search-panel.component.scss` | 61 |
| `angular/src/app/features/dashboard/player-dashboard.component.scss` | 60 |

### Typography: font-weight

| File | Matches |
| --- | ---: |
| `angular/src/app/features/settings/settings.component.scss` | 66 |
| `angular/src/app/features/onboarding/onboarding.component.scss` | 62 |
| `angular/src/assets/styles/primeng-theme.scss` | 60 |
| `angular/src/assets/styles/typography-system.scss` | 55 |
| `angular/src/app/features/game/tournament-nutrition/tournament-nutrition.component.scss` | 52 |
| `angular/src/app/shared/components/morning-briefing/morning-briefing.component.scss` | 50 |
| `angular/src/app/features/analytics/analytics.component.scss` | 49 |
| `angular/src/app/features/community/community.component.scss` | 48 |
| `angular/src/app/features/game-tracker/game-tracker.component.scss` | 44 |
| `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.scss` | 42 |
| `angular/src/app/features/exercise-library/exercise-library.component.scss` | 42 |
| `angular/src/app/features/chat/chat.component.scss` | 38 |
| `angular/src/app/features/training/video-feed/video-feed.component.scss` | 38 |
| `angular/src/assets/styles/overrides/_exceptions.scss` | 38 |
| `angular/src/assets/styles/standardized-components.scss` | 38 |
| `angular/src/app/features/coach/team-management/team-management.component.scss` | 36 |
| `angular/src/app/features/dashboard/coach-dashboard.component.scss` | 36 |
| `angular/src/app/features/return-to-play/return-to-play.component.scss` | 36 |
| `angular/src/app/features/today/today.component.ts` | 36 |
| `angular/src/app/features/coach/tournament-management/tournament-management.component.scss` | 34 |

### Typography: line-height

| File | Matches |
| --- | ---: |
| `angular/src/assets/styles/typography-system.scss` | 80 |
| `angular/src/app/features/onboarding/onboarding.component.scss` | 41 |
| `angular/src/app/features/settings/settings.component.scss` | 27 |
| `angular/src/assets/styles/primeng-theme.scss` | 27 |
| `angular/src/assets/styles/primitives/_typography.scss` | 24 |
| `angular/src/assets/styles/design-system-tokens.scss` | 23 |
| `angular/src/styles.scss` | 17 |
| `angular/src/app/features/dashboard/player-dashboard.component.ts` | 16 |
| `angular/src/app/shared/components/card-shell/card-shell.component.scss` | 15 |
| `angular/src/app/features/profile/profile.component.scss` | 14 |
| `angular/src/app/features/game/tournament-nutrition/tournament-nutrition.component.scss` | 13 |
| `angular/src/assets/styles/primitives/_dashboard.scss` | 13 |
| `angular/src/app/features/training/daily-protocol/components/wellness-checkin.component.scss` | 12 |
| `angular/src/assets/styles/primeng-integration.scss` | 12 |
| `angular/src/app/features/today/today.component.ts` | 11 |
| `angular/src/app/features/community/community.component.scss` | 10 |
| `angular/src/app/features/training/components/periodization-dashboard/periodization-dashboard.component.scss` | 10 |
| `angular/src/app/features/training/video-suggestion/video-suggestion.component.scss` | 10 |
| `angular/src/assets/styles/ui-standardization.scss` | 9 |
| `angular/src/assets/styles/primitives/_tables.scss` | 8 |

### Spacing: px-based margin/padding/gap

| File | Matches |
| --- | ---: |
| `angular/src/stories/DesignSystem.stories.ts` | 33 |
| `angular/src/app/features/training/daily-protocol/components/exercise-card.component.scss` | 26 |
| `angular/src/app/features/training/qb-throwing-tracker/qb-throwing-tracker.component.scss` | 25 |
| `angular/src/app/shared/components/supplement-tracker/supplement-tracker.component.scss` | 24 |
| `src/profile-completion.js` | 20 |
| `angular/src/app/features/training/daily-protocol/components/tournament-calendar.component.scss` | 19 |
| `angular/src/app/shared/components/button/button.stories.ts` | 18 |
| `angular/src/assets/styles/primeng-theme.scss` | 18 |
| `angular/src/app/features/debug/debug-console.component.ts` | 17 |
| `scripts/archive/fix-responsive-design.js` | 17 |
| `src/email-service.js` | 17 |
| `supabase/functions/send-guardian-email/index.ts` | 17 |
| `src/js/achievements-widget.js` | 11 |
| `angular/src/app/features/training/daily-protocol/components/session-log-form.component.scss` | 10 |
| `angular/src/app/features/training/daily-protocol/components/player-settings-dialog.component.scss` | 8 |
| `angular/src/app/features/training/daily-protocol/components/protocol-block.component.scss` | 8 |
| `angular/src/app/features/training/daily-protocol/components/week-progress-strip.component.scss` | 8 |
| `angular/src/app/shared/components/form-error-summary/form-error-summary.component.scss` | 8 |
| `src/js/wellness-export-buttons.js` | 8 |
| `angular/src/app/features/analytics/analytics.component.ts` | 7 |

### Colors: hex/rgb/hsl

| File | Matches |
| --- | ---: |
| `angular/src/assets/styles/design-system-tokens.scss` | 385 |
| `angular/src/assets/styles/primeng-theme.scss` | 149 |
| `angular/src/app/shared/models/design-tokens.ts` | 134 |
| `angular/src/app/features/game/tournament-nutrition/tournament-nutrition.component.scss` | 84 |
| `angular/src/app/features/onboarding/onboarding.component.scss` | 83 |
| `src/analytics-data-service.js` | 72 |
| `src/chart-manager.js` | 54 |
| `scripts/archive/fix-design-system-issues.js` | 51 |
| `angular/src/assets/styles/color-contrast-fixes.scss` | 50 |
| `angular/src/app/core/utils/design-tokens.util.ts` | 48 |
| `angular/src/app/features/debug/debug-console.component.ts` | 46 |
| `angular/src/assets/styles/primeng-integration.scss` | 42 |
| `angular/e2e/color-contrast.spec.ts` | 38 |
| `src/js/achievements-widget.js` | 37 |
| `src/performance-charts.js` | 37 |
| `src/enhanced-chart-config.js` | 36 |
| `angular/src/assets/styles/overrides/_exceptions.scss` | 33 |
| `angular/src/stories/DesignSystem.stories.ts` | 30 |
| `angular/src/app/core/constants/app.constants.ts` | 29 |
| `angular/src/app/shared/components/action-panel/action-panel.component.ts` | 29 |

### Effects: box-shadow

| File | Matches |
| --- | ---: |
| `angular/src/assets/styles/primeng-theme.scss` | 91 |
| `angular/src/app/features/onboarding/onboarding.component.scss` | 72 |
| `angular/src/assets/styles/standardized-components.scss` | 55 |
| `angular/src/app/features/game/tournament-nutrition/tournament-nutrition.component.scss` | 43 |
| `angular/src/assets/styles/primeng/_brand-overrides.scss` | 38 |
| `angular/src/assets/styles/overrides/_exceptions.scss` | 37 |
| `angular/src/app/features/community/community.component.scss` | 25 |
| `angular/src/assets/styles/hover-system.scss` | 23 |
| `angular/src/app/features/training/video-feed/video-feed.component.scss` | 21 |
| `angular/src/app/shared/components/card/card.component.scss` | 19 |
| `angular/src/app/features/chat/chat.component.scss` | 16 |
| `angular/src/app/features/exercise-library/exercise-library.component.scss` | 15 |
| `angular/src/styles.scss` | 15 |
| `angular/src/assets/styles/premium-interactions.scss` | 14 |
| `angular/src/app/shared/components/button/button.component.scss` | 13 |
| `angular/src/app/shared/components/button/icon-button.component.ts` | 13 |
| `angular/src/styles/_mixins.scss` | 12 |
| `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.scss` | 11 |
| `angular/src/app/features/settings/settings.component.scss` | 11 |
| `angular/src/assets/styles/primeng-integration.scss` | 11 |

### Effects: border-radius

| File | Matches |
| --- | ---: |
| `angular/src/assets/styles/primeng-theme.scss` | 79 |
| `angular/src/assets/styles/primeng/_brand-overrides.scss` | 62 |
| `angular/src/assets/styles/overrides/_exceptions.scss` | 53 |
| `angular/src/assets/styles/primeng-integration.scss` | 49 |
| `angular/src/assets/styles/ui-standardization.scss` | 44 |
| `angular/src/app/features/onboarding/onboarding.component.scss` | 40 |
| `angular/src/app/features/ai-coach/ai-coach-chat.component.scss` | 36 |
| `angular/src/app/features/settings/settings.component.scss` | 36 |
| `angular/src/app/features/travel/travel-recovery/travel-recovery.component.scss` | 34 |
| `angular/e2e/primeng-styling-smoke.spec.ts` | 31 |
| `angular/src/assets/styles/standardized-components.scss` | 30 |
| `angular/src/app/features/community/community.component.scss` | 28 |
| `angular/src/app/features/chat/chat.component.scss` | 26 |
| `angular/src/app/features/exercise-library/exercise-library.component.scss` | 25 |
| `angular/src/app/features/game/tournament-nutrition/tournament-nutrition.component.scss` | 22 |
| `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.scss` | 21 |
| `angular/src/app/shared/components/morning-briefing/morning-briefing.component.scss` | 21 |
| `angular/src/app/features/profile/profile.component.scss` | 20 |
| `angular/src/app/features/training/daily-training/daily-training.component.ts` | 19 |
| `angular/src/app/features/analytics/analytics.component.scss` | 18 |

### States: :hover/:focus/:active

| File | Matches |
| --- | ---: |
| `angular/src/assets/styles/primeng-theme.scss` | 121 |
| `angular/src/assets/styles/standardized-components.scss` | 67 |
| `angular/src/assets/styles/hover-system.scss` | 48 |
| `angular/src/assets/styles/primeng-integration.scss` | 48 |
| `angular/src/app/features/community/community.component.scss` | 46 |
| `angular/src/assets/styles/primeng/_brand-overrides.scss` | 44 |
| `angular/src/app/features/onboarding/onboarding.component.scss` | 34 |
| `angular/src/assets/styles/premium-interactions.scss` | 33 |
| `angular/src/assets/styles/overrides/_exceptions.scss` | 32 |
| `angular/src/styles.scss` | 31 |
| `angular/src/app/shared/components/card/card.component.scss` | 20 |
| `angular/src/app/shared/components/button/button.component.scss` | 19 |
| `angular/src/app/features/ai-coach/ai-coach-chat.component.scss` | 18 |
| `angular/src/app/features/training/video-feed/video-feed.component.scss` | 18 |
| `angular/src/styles/_mixins.scss` | 18 |
| `angular/src/app/features/settings/settings.component.scss` | 17 |
| `angular/src/app/shared/components/button/icon-button.component.ts` | 17 |
| `angular/src/app/shared/components/notifications-panel/notifications-panel.component.scss` | 16 |
| `angular/src/assets/styles/ui-standardization.scss` | 15 |
| `angular/src/app/features/game/tournament-nutrition/tournament-nutrition.component.scss` | 13 |

### Overrides: !important

| File | Matches |
| --- | ---: |
| `angular/src/assets/styles/overrides/_exceptions.scss` | 48 |
| `angular/src/styles/_responsive-utilities.scss` | 9 |
| `angular/src/assets/styles/_layers.scss` | 8 |
| `angular/src/assets/styles/primitives/_icons.scss` | 8 |
| `scripts/quick-fixes.js` | 8 |
| `angular/src/assets/styles/primeng-integration.scss` | 7 |
| `src/accessibility-utils.js` | 4 |
| `angular/src/app/features/game-tracker/game-tracker.component.scss` | 3 |
| `angular/src/assets/styles/cascade-layers.scss` | 3 |
| `angular/src/assets/styles/primitives/_forms.scss` | 3 |
| `angular/src/app/shared/animations/view-transitions.config.ts` | 2 |
| `angular/src/app/shared/components/data-source-banner/data-source-banner.component.scss` | 2 |
| `angular/src/styles.scss` | 2 |
| `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.ts` | 1 |
| `angular/src/app/features/analytics/analytics.component.scss` | 1 |
| `angular/src/app/features/dashboard/player-dashboard.component.ts` | 1 |
| `angular/src/app/features/onboarding/onboarding.component.scss` | 1 |
| `angular/src/app/features/profile/profile.component.scss` | 1 |
| `angular/src/assets/styles/_main.scss` | 1 |
| `angular/src/assets/styles/primeng/_brand-overrides.scss` | 1 |

### Icons: PrimeIcons (pi-)

| File | Matches |
| --- | ---: |
| `angular/src/app/features/onboarding/onboarding.component.ts` | 119 |
| `angular/src/app/features/tournaments/tournaments.component.ts` | 74 |
| `angular/src/app/features/settings/settings.component.html` | 65 |
| `angular/src/app/core/services/context.service.ts` | 64 |
| `angular/src/app/shared/components/notifications-panel/notifications-panel.component.ts` | 53 |
| `angular/src/app/features/exercise-library/exercise-library.component.ts` | 50 |
| `angular/src/app/features/dashboard/player-dashboard.component.ts` | 49 |
| `angular/src/app/features/travel/travel-recovery/travel-recovery.component.ts` | 49 |
| `angular/src/app/features/ai-coach/ai-coach-chat.component.ts` | 46 |
| `angular/src/app/shared/components/sidebar/sidebar.component.ts` | 42 |
| `angular/src/app/features/staff/psychology/psychology-reports.component.ts` | 41 |
| `angular/src/app/features/chat/chat.component.ts` | 39 |
| `angular/src/app/features/community/community.component.ts` | 38 |
| `angular/src/app/features/profile/profile.component.ts` | 38 |
| `angular/src/app/shared/components/button/button.stories.ts` | 37 |
| `angular/src/app/features/staff/physiotherapist/physiotherapist-dashboard.component.ts` | 34 |
| `angular/src/app/features/training/video-suggestion/video-suggestion.component.ts` | 32 |
| `angular/src/app/shared/components/recovery-dashboard/recovery-dashboard.component.ts` | 32 |
| `angular/src/app/features/training/smart-training-form/smart-training-form.component.ts` | 31 |
| `angular/src/app/features/training/video-feed/video-feed.component.ts` | 30 |

### Icons: Non-PrimeIcons (fa-, material-icons, <svg, icon=)

| File | Matches |
| --- | ---: |
| `angular/src/app/features/settings/settings.component.html` | 34 |
| `angular/src/app/shared/components/button/button.stories.ts` | 20 |
| `angular/src/app/features/chat/chat.component.ts` | 11 |
| `angular/src/app/features/tournaments/tournaments.component.ts` | 9 |
| `angular/src/stories/DesignSystem.stories.ts` | 7 |
| `angular/src/app/features/dashboard/coach-dashboard.component.ts` | 6 |
| `angular/src/app/shared/components/button/icon-button.component.ts` | 6 |
| `angular/src/app/features/game-tracker/game-tracker.component.html` | 5 |
| `angular/src/app/features/officials/officials.component.ts` | 5 |
| `angular/src/app/features/roster/components/roster-player-card.component.ts` | 5 |
| `angular/src/app/features/training/video-curation/components/video-curation-video-table.component.ts` | 5 |
| `angular/src/app/features/training/video-suggestion/video-suggestion.component.ts` | 5 |
| `angular/src/app/shared/components/header/header.component.html` | 5 |
| `angular/src/app/features/analytics/analytics.component.ts` | 4 |
| `angular/src/app/features/coach/coach.component.ts` | 4 |
| `angular/src/app/features/dashboard/athlete-dashboard.component.ts` | 4 |
| `angular/src/app/features/equipment/equipment.component.ts` | 4 |
| `angular/src/app/features/roster/roster.component.ts` | 4 |
| `angular/src/app/features/superadmin/superadmin-teams.component.ts` | 4 |
| `angular/src/app/features/superadmin/superadmin-users.component.ts` | 4 |

### Search inputs (variants)

| File | Matches |
| --- | ---: |
| `angular/src/assets/styles/standardized-components.scss` | 2 |
| `angular/src/styles/_mobile-touch-components.scss` | 2 |
| `src/keyboard-shortcuts.js` | 2 |
| `scripts/archive/apply-unified-theme.js` | 1 |
| `src/help-system.js` | 1 |

## Known Hotspots (cross-category concentration)

| File | Total Matches | Categories Touched |
| --- | ---: | ---: |
| `angular/src/assets/styles/primeng-theme.scss` | 631 | 10 |
| `angular/src/assets/styles/design-system-tokens.scss` | 464 | 7 |
| `angular/src/app/features/onboarding/onboarding.component.scss` | 453 | 8 |
| `angular/src/app/features/settings/settings.component.scss` | 368 | 8 |
| `angular/src/assets/styles/overrides/_exceptions.scss` | 335 | 10 |
| `angular/src/app/features/game/tournament-nutrition/tournament-nutrition.component.scss` | 332 | 8 |
| `angular/src/app/features/community/community.component.scss` | 257 | 8 |
| `angular/src/assets/styles/standardized-components.scss` | 256 | 9 |
| `angular/src/assets/styles/typography-system.scss` | 236 | 7 |
| `angular/src/app/features/travel/travel-recovery/travel-recovery.component.scss` | 222 | 7 |
| `angular/src/app/features/analytics/analytics.component.scss` | 221 | 9 |
| `angular/src/assets/styles/primeng-integration.scss` | 218 | 9 |
| `angular/src/app/features/ai-coach/ai-coach-chat.component.scss` | 207 | 8 |
| `angular/src/assets/styles/primeng/_brand-overrides.scss` | 201 | 9 |
| `angular/src/app/features/training/video-feed/video-feed.component.scss` | 196 | 7 |
| `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.scss` | 195 | 6 |
| `angular/src/app/shared/components/morning-briefing/morning-briefing.component.scss` | 175 | 7 |
| `angular/src/app/features/dashboard/player-dashboard.component.ts` | 163 | 9 |
| `angular/src/app/features/chat/chat.component.scss` | 161 | 7 |
| `angular/src/app/features/exercise-library/exercise-library.component.scss` | 161 | 7 |

## Recommended Refactor Order (by blast radius)

1) Core design tokens + PrimeNG theme layer (highest global impact).
   - Focus: design-system token alignment, PrimeNG token mapping, exception overrides.
2) Global/shared style primitives and interaction systems.
   - Focus: typography system, standardized components, hover/premium interactions, integration layers.
3) High-traffic feature modules with large style footprints.
   - Focus: onboarding, settings, analytics, community, tournament nutrition, travel recovery, video feed, AI coach chat.
4) Component-level UI kits with repeated patterns.
   - Focus: buttons, cards, tables, search panels, header/sidebar, form elements.
5) Legacy/utility scripts and non-Angular UI fragments (lowest immediate user-facing impact).
