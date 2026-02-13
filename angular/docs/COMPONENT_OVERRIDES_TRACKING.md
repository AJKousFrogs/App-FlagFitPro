# Component Overrides Tracking

PrimeNG component overrides in `src/assets/styles/overrides/_component-overrides.scss` are temporary exceptions until design-system migration. Per contract: component SCSS should not style `.p-*` directly.

**Related:** `_exceptions.scss` tracks legacy file exceptions (DS-LEGACY-001, DS-LEGACY-002, DS-LEGACY-003) with Remove by 2026-Q2. See that file for styles.scss, primeng-theme.scss, hover-system.scss migration status.

## Summary by Deadline

| Deadline   | Count | Action |
|-----------|-------|--------|
| 2026-04-01 | 54  | First wave: all component-specific overrides (player-dashboard, game-tracker, onboarding, analytics, acwr-dashboard, etc.) |
| 2026-06-01 | 6   | Second wave: enhanced-data-table, soreness-bar, dialog overlays (shortcuts, body-composition, quick-check-in), scroll/layout |

*Aligned 2026-03-31 → 2026-04-01 on 2026-02-13 for unified first wave.*

## Migration Path

1. **PrimeNG theme first** – Update `primeng-theme.scss` and `primeng-integration.scss` to support component-specific tokens (e.g. `--progress-bar-height-md`).
2. **Component encapsulation** – Move scoped overrides into component `:host ::ng-deep` or `:host-context` only where design system cannot provide tokens.
3. **Remove override block** – Delete from `_component-overrides.scss` once equivalent styling exists in theme or component.

## Exceptions by Ticket

| Ticket    | Component                  | Scope                    | Notes |
|----------|----------------------------|--------------------------|-------|
| DS-EXC-001 | acwr-baseline            | progressbar height       | |
| DS-EXC-002 | player-dashboard         | timeline, message, chart | Mobile-responsive |
| DS-EXC-003 | game-tracker             | form, datatable, tags    | Touch targets, font-size |
| DS-EXC-004 | enhanced-data-table     | card view on narrow      | 2026-06-01 |
| DS-EXC-005 | physiotherapist-dashboard| soreness-bar             | 2026-06-01 |
| DS-EXC-004 | header                   | component styling        | |
| DS-EXC-053 | header                   | shortcuts dialog         | 2026-06-01 |
| DS-EXC-054 | body-composition-card    | dialog overlay           | 2026-06-01 |
| DS-EXC-055 | today                    | quick check-in dialog    | 2026-06-01 |
| DS-EXC-006 | chat                     | chat-header              | |
| DS-EXC-007 | roster-player-card       | p-card overrides         | |
| DS-EXC-008 | session-log-form         | form controls            | |
| DS-EXC-009 | session-analytics        | chart/dialog             | |
| DS-EXC-010 | recovery-dashboard       | p-card                   | |
| DS-EXC-011 | supplement-tracker       | dialog                   | |
| DS-EXC-012 | wellness-checkin         | p-dialog                 | |
| DS-EXC-013 | search-panel             | overlay                  | |
| DS-EXC-014 | profile                  | form, dialog             | |
| DS-EXC-015 | onboarding               | multi-step layout         | 2026-04-01 |
| DS-EXC-016 | tournament-nutrition     | layout                   | |
| DS-EXC-017 | return-to-play           | p-card                   | |
| DS-EXC-018 | video-feed               | video card               | |
| DS-EXC-019 | video-suggestion         | suggestion cards         | |
| DS-EXC-020 | training-schedule        | calendar                 | |
| DS-EXC-021 | superadmin-dashboard     | modal                    | Removed 2026-02-13 (obsolete admin duplicate) |
| DS-EXC-022 | tournaments              | cards, dialog            | |
| DS-EXC-023 | data-import              | upload, form             | |
| DS-EXC-024 | game-day-countdown       | Removed 2026-02-13 (obsolete component) | |
| DS-EXC-025 | wellness-score-display   | Removed 2026-02-13 (dead component) | |
| DS-EXC-026 | daily-readiness          | chart, form              | |
| DS-PNGO-002| enhanced-data-table      | scroll/layout            | 2026-06-01 |
| DS-EXC-027 | stats-grid               | stat cards               | |
| DS-EXC-028 | morning-briefing         | Removed 2026-02-13 (obsolete component) | |
| DS-EXC-029 | exercise-library         | cards                    | |
| DS-EXC-030 | tournament-mode-widget    | Removed 2026-02-13 (obsolete component) | |
| DS-EXC-031 | post-training-recovery   | Removed 2026-02-13 (obsolete component) | |
| DS-EXC-032 | team-wellness-overview   | Removed 2026-02-13 (obsolete component) | |
| DS-EXC-033 | smart-breadcrumbs        | breadcrumb               | |
| DS-EXC-034 | toast                    | toast styling            | |
| DS-EXC-035 | rest-timer               | dialog                   | |
| DS-EXC-036 | quick-wellness-checkin   | Removed 2026-02-13 (obsolete component) | |
| DS-EXC-036b| today (quick check-in)   | modal                    | |
| DS-EXC-036c| body-composition-card    | dialog                   | |
| DS-EXC-037 | offline-banner           | banner                   | |
| DS-EXC-038 | micro-session            | layout                   | |
| DS-EXC-039 | keyboard-shortcuts-modal | overlay                  | |
| DS-EXC-040 | hydration-tracker        | form                     | |
| DS-EXC-041 | date-picker              | calendar                 | |
| DS-EXC-042 | video-curation-analytics | layout                   | |
| DS-EXC-043 | la28-roadmap             | roadmap                  | |
| DS-EXC-044 | psychology-reports       | reports                  | |
| DS-EXC-045 | physiotherapist-dashboard| dashboard                | |
| DS-EXC-046 | sleep-debt               | chart/form               | |
| DS-EXC-047 | privacy-controls         | form                     | |
| DS-EXC-048 | performance-tracking     | layout                   | |
| DS-EXC-049 | login                    | form, card               | |
| DS-EXC-050 | periodization-dashboard  | phase cards              | |
| DS-EXC-051 | settings                 | form, dialog             | |
| DS-EXC-052 | analytics                | charts                   | |
| DS-EXC-053 | acwr-dashboard           | layout                   | 2026-04-01 |

---

*Last updated: 2026-02-13. Run `grep -c "Remove by:" src/assets/styles/overrides/_component-overrides.scss` for current count.*
