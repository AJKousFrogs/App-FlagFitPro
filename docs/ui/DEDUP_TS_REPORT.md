# TS/JS Deduplication Report

## Repeated Logic Found
- Status → severity mappings duplicated across components
- Risk severity mappings duplicated in dashboards and roster cards
- Date formatting logic repeated for short US date strings

## Consolidated Into
- `angular/src/app/shared/utils/status.utils.ts`
  - `getMappedStatusSeverity` helper and shared maps:
    - `accountStatusSeverityMap`
    - `decisionStatusSeverityMap`
    - `goalStatusSeverityMap`
    - `injuryStatusSeverityMap`
    - `officialAssignmentStatusSeverityMap`
    - `paymentStatusSeverityMap`
    - `playerStatusSeverityMap`
    - `programStatusSeverityMap`
    - `reviewStatusSeverityMap`
    - `roadmapStatusSeverityMap`
    - `rosterStatusSeverityMap`
    - `teamMemberStatusSeverityMap`
- `angular/src/app/shared/utils/risk.utils.ts`
  - `getRiskSeverityFromAlert`
  - `getRiskSeverityFromZone`
  - `getRiskSeverityFromLevel`

## Files Updated
- `angular/src/app/features/exercisedb/exercisedb-manager.component.ts`
- `angular/src/app/features/dashboard/coach-dashboard.component.ts`
- `angular/src/app/features/coach/program-builder/program-builder.component.ts`
- `angular/src/app/features/coach/injury-management/injury-management.component.ts`
- `angular/src/app/features/coach/player-development/player-development.component.ts`
- `angular/src/app/features/coach/practice-planner/practice-planner.component.ts`
- `angular/src/app/features/coach/payment-management/payment-management.component.ts`
- `angular/src/app/features/coach/coach.component.ts`
- `angular/src/app/features/officials/officials.component.ts`
- `angular/src/app/features/training/training-schedule/training-schedule.component.ts`
- `angular/src/app/features/training/daily-protocol/components/la28-roadmap.component.ts`
- `angular/src/app/features/superadmin/superadmin-users.component.ts`
- `angular/src/app/features/superadmin/superadmin-teams.component.ts`
- `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.ts`
- `angular/src/app/features/roster/components/roster-player-card.component.ts`
- `angular/src/app/features/roster/roster.component.ts`
- `angular/src/app/shared/components/ai-coach-visibility/ai-coach-visibility.component.ts`
- `angular/src/app/features/training/video-curation/video-curation-utils.ts`

## Remaining Exceptions (Justified)
- Domain-specific label maps (e.g., decision type labels, UI copy) kept local to avoid over-generalization.
