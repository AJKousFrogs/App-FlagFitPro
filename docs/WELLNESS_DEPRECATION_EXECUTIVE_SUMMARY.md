# Wellness Tables Deprecation - Executive Summary

**Date:** 2026-01-11  
**Status:** ✅ Phases 1-3 Complete  
**Timeline:** Phase 4 (final deprecation) in 6+ months  
**Business Impact:** LOW - Migration substantially complete

---

## TL;DR

**Question:** Can we deprecate the `wellness_entries` table now that we've fixed the split-brain issue?

**Answer:** **Not yet**, but we should start a **phased migration** over 6-8 months.

---

## Current Situation

### Two Wellness Tables

| Table | Status | Usage |
|-------|--------|-------|
| `daily_wellness_checkin` | ✅ **CANONICAL** (single source of truth) | All wellness operations |
| `wellness_entries` | 🔄 **LEGACY** (dual-write only) | Backend mirrors writes, no Angular reads |

### Current State (After Phase 3)
- ✅ **0 Angular reads** from `wellness_entries`
- ✅ **0 Angular writes** to `wellness_entries` directly
- ✅ **All operations** use `daily_wellness_checkin` or `/api/wellness-checkin`
- 🔄 Backend dual-write keeps `wellness_entries` in sync (for safety)

---

## Recommendation: Phased Migration (4 Phases)

### ✅ Phase 1: Stop New Writes - COMPLETE (2026-01-11)
**Status:** ✅ Complete

**Completed:**
- ✅ `DailyReadinessComponent` uses `/api/wellness-checkin`
- ✅ `WellnessService.logWellness()` routed to API
- ✅ `OnboardingComponent` uses API
- ✅ All "latest wellness" reads migrated

---

### ✅ Phase 2: Dual-Write Strategy - COMPLETE (2026-01-11)
**Status:** ✅ Complete

**Completed:**
- ✅ Backend writes to BOTH tables
- ✅ Non-fatal error handling for dual-write
- ✅ Historical continuity maintained

---

### ✅ Phase 3: Migrate Reads - COMPLETE (2026-01-11)
**Status:** ✅ Complete

**Completed:**
- ✅ `WellnessService.getWellnessData()` → `daily_wellness_checkin`
- ✅ `SettingsComponent` export → `daily_wellness_checkin`
- ✅ `AdminService` record counts → `daily_wellness_checkin`
- ✅ `PerformanceDataService` → `daily_wellness_checkin`
- ✅ `ProfileComponent` → `daily_wellness_checkin`
- ✅ `DataExportService` → `daily_wellness_checkin`
- ✅ Realtime subscriptions → `daily_wellness_checkin`

**Result:** 0 reads from `wellness_entries` in Angular

---

### 🔲 Phase 4: Full Deprecation (6+ months)
**Status:** Planned
**Timeline:** After 6 months of successful dual-write

**Actions:**
- 🔲 Remove dual-write from backend
- 🔲 Archive `wellness_entries` table
- 🔲 Drop table

**Result:** One table (`daily_wellness_checkin`), one source of truth

---

## Why Not Deprecate Immediately?

### ❌ Risks of Immediate Deprecation

1. **Data Loss:** 3+ years of historical wellness data lost
2. **Broken Features:** 13 locations still read from `wellness_entries`:
   - Historical trend charts
   - User data exports
   - Performance score calculations
   - Recovery metrics
   - Training safety checks
3. **No Rollback:** Once dropped, data is gone forever

### ✅ Benefits of Phased Approach

1. **Zero Data Loss:** Historical data preserved via backfill
2. **Zero Downtime:** Features continue working during migration
3. **Easy Rollback:** Each phase can be reverted if issues arise
4. **Low Risk:** Incremental changes tested at each step
5. **Maintains User Trust:** No broken exports or missing data

---

## Timeline & Effort

```
Week 1 (2026-01-11):   Phase 1 - Stop new writes          ✅ COMPLETE
Week 1 (2026-01-11):   Phase 2 - Dual-write               ✅ COMPLETE  
Week 1 (2026-01-11):   Phase 3 - Migrate reads            ✅ COMPLETE
Months 2-8:            Phase 4 - Full deprecation         🔲 PLANNED
───────────────────────────────────────────────────────────────────
COMPLETED:             ~18 hours in one session
REMAINING:             Phase 4 (2-3 hours in 6+ months)
```

**Status:** Migration substantially complete. Phase 4 (table drop) scheduled for 6+ months.

---

## Business Impact

### ✅ Benefits

- **Single source of truth** for wellness data (eliminates confusion)
- **Reduced database complexity** (one table instead of two)
- **Easier maintenance** (fewer tables to manage)
- **Better data integrity** (UPSERT prevents duplicates)
- **Cleaner API** (all wellness goes through one endpoint)

### ⚠️ Risks

- **Migration effort** (~20-25 hours total)
- **Temporary dual-write overhead** (minimal performance impact)
- **Testing required** at each phase

### 💰 Cost

- **Developer time:** ~3 weeks spread over 6-8 months
- **Infrastructure:** No additional costs (tables already exist)
- **Downtime:** Zero (phased migration)

---

## Current Status

### ✅ PHASES 1-3 COMPLETE

All Angular operations now use `daily_wellness_checkin`:
- ✅ All writes go through `/api/wellness-checkin`
- ✅ All reads query `daily_wellness_checkin`
- ✅ Realtime subscriptions use `daily_wellness_checkin`
- ✅ Export services use `daily_wellness_checkin`

### 🔄 Backend Dual-Write Active

The backend still writes to both tables (Phase 2 safety mechanism).

---

## Next Steps (Phase 4)

**After 6+ months of stable operation:**
1. Remove dual-write from `wellness-checkin.cjs`
2. Archive `wellness_entries` table
3. Drop table

**Do NOT proceed with Phase 4 until:**
- 6+ months of dual-write operation
- Zero issues reported
- All data verified

---

## Documentation

Complete documentation available at:

1. **`WELLNESS_PHASE1_ACTION_PLAN.md`** - Immediate action items (this week)
2. **`WELLNESS_ENTRIES_DEPRECATION_PLAN.md`** - Complete technical plan (all phases)
3. **`WELLNESS_MIGRATION_VISUAL_GUIDE.md`** - Visual diagrams & timeline
4. **`fixes/WELLNESS_SINGLE_SOURCE_OF_TRUTH.md`** - Split-brain fix details

---

## Questions?

**Q: Can we speed up the migration?**  
A: Yes, but phases 2-3 should not be rushed (data migration risk). Phase 1 can start immediately.

**Q: What if we have issues during migration?**  
A: Each phase can be rolled back. Dual-write (Phase 2) provides safety net.

**Q: Will users notice any changes?**  
A: No. Migration is transparent to users. Features continue working normally.

**Q: What happens to old wellness data?**  
A: Preserved via backfill in Phase 3. Zero data loss.

---

## Summary

**Migration Status:** ✅ Phases 1-3 Complete  
**Remaining:** Phase 4 (table drop) in 6+ months  
**Current State:** `daily_wellness_checkin` is the single source of truth  
**Dual-Write:** Active for safety during transition period

---

**Completed:** 2026-01-11  
**Phase 4 ETA:** July 2026 or later
