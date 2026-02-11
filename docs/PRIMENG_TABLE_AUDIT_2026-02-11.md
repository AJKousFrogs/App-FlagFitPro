# PrimeNG Table Module Audit — February 11, 2026

**Scope:** `TableModule` usage across the app  
**PrimeNG Version:** 21.1.1  
**Result:** **No migration possible** — Table is not standalone in PrimeNG 21.1

---

## Executive Summary

PrimeNG 21.1’s **Table component is not standalone** (`isStandalone: false` in the package). It must be imported via **TableModule**. Migration to a standalone `Table` import is not supported in this version.

---

## Verification

Migration attempt:

```ts
// ❌ Fails with NG2011
import { Table } from "primeng/table";
@Component({ imports: [Table, ...] })
```

**Error:** `The component 'Table' appears in 'imports', but is not standalone and cannot be imported directly. It must be imported via an NgModule.`

**Conclusion:** Continue using `TableModule`. No migration needed.

---

## Current Usage (27 components)

All components correctly use `TableModule`:

| Component | File |
|-----------|------|
| coach-analytics | `features/coach/coach-analytics/coach-analytics.component.ts` |
| swipe-table | `shared/components/swipe-table/swipe-table.component.ts` |
| superadmin-users | `features/superadmin/superadmin-users.component.ts` |
| superadmin-teams | `features/superadmin/superadmin-teams.component.ts` |
| cycle-tracking | `features/cycle-tracking/cycle-tracking.component.ts` |
| ai-coach-visibility | `shared/components/ai-coach-visibility/ai-coach-visibility.component.ts` |
| analytics | `features/analytics/analytics.component.ts` |
| performance-tracking | `features/performance-tracking/performance-tracking.component.ts` |
| equipment | `features/equipment/equipment.component.ts` |
| coach-dashboard | `features/dashboard/coach-dashboard.component.ts` |
| officials | `features/officials/officials.component.ts` |
| attendance | `features/attendance/attendance.component.ts` |
| return-to-play | `features/return-to-play/return-to-play.component.ts` |
| playbook-manager | `features/coach/playbook-manager/playbook-manager.component.ts` |
| injury-management | `features/coach/injury-management/injury-management.component.ts` |
| player-development | `features/coach/player-development/player-development.component.ts` |
| payment-management | `features/coach/payment-management/payment-management.component.ts` |
| superadmin-dashboard | `features/admin/superadmin-dashboard.component.ts` |
| superadmin-settings | `features/superadmin/superadmin-settings.component.ts` |
| superadmin-dashboard (duplicate) | `features/superadmin/superadmin-dashboard.component.ts` |
| video-curation-video-table | `features/training/video-curation/components/video-curation-video-table.component.ts` |
| achievements | `features/achievements/achievements.component.ts` |
| data-import | `features/data-import/data-import.component.ts` |
| nutritionist-dashboard | `features/staff/nutritionist/nutritionist-dashboard.component.ts` |
| physiotherapist-dashboard | `features/staff/physiotherapist/physiotherapist-dashboard.component.ts` |
| tournament-management | `features/coach/tournament-management/tournament-management.component.ts` |
| program-builder | `features/coach/program-builder/program-builder.component.ts` |
| scouting-reports | `features/coach/scouting/scouting-reports.component.ts` |
| game-tracker | `features/game-tracker/game-tracker.component.ts` |
| flag-load | `features/training/flag-load.component.ts` |
| enhanced-data-table | `shared/components/enhanced-data-table/enhanced-data-table.component.ts` |
| payments | `features/payments/payments.component.ts` |

---

## enhanced-data-table Additional Exports

`enhanced-data-table.component.ts` imports:

```ts
import {
  TableModule,
  TableColumnReorderEvent,
  TableColResizeEvent,
} from "primeng/table";
```

- `TableColumnReorderEvent` and `TableColResizeEvent` are types/interfaces — keep importing from `primeng/table`.
- `TableModule` — keep as is (required for Table usage).

---

## Recommendations

1. **Keep `TableModule`** — Required until PrimeNG exposes a standalone Table (if ever).
2. **Re-audit after PrimeNG upgrades** — Check release notes for a future standalone Table.
3. **Bundle impact** — `TableModule` pulls in Table + directives. There is no lighter option in 21.1.

---

*Audit completed — February 11, 2026*
