# Wellness Tables Deprecation - Executive Summary

**Date:** 2026-01-11  
**Status:** Analysis Complete, Ready for Phase 1  
**Timeline:** 6-8 months (phased migration)  
**Business Impact:** LOW (incremental, low-risk changes)

---

## TL;DR

**Question:** Can we deprecate the `wellness_entries` table now that we've fixed the split-brain issue?

**Answer:** **Not yet**, but we should start a **phased migration** over 6-8 months.

---

## Current Situation

### Two Wellness Tables

| Table | Status | Usage |
|-------|--------|-------|
| `daily_wellness_checkin` | ✅ **NEW** (single source of truth) | Daily check-ins via `/api/wellness-checkin` |
| `wellness_entries` | ⚠️ **LEGACY** (still in use) | Historical trends, exports, calculations (13 locations) |

### Problem
- `wellness_entries` has **3+ years of historical wellness data**
- **13 frontend locations** still read from it (trends, exports, calculations)
- **2 locations** still write to it (deprecated methods)
- Cannot drop table without **data loss** and **breaking existing features**

---

## Recommendation: Phased Migration (4 Phases)

### Phase 1: Stop New Writes (This Week) ⏱️ 3-4 hours
**Status:** Partially complete  
**Effort:** LOW  
**Risk:** LOW

**Actions:**
- ✅ `DailyReadinessComponent` already uses `/api/wellness-checkin`
- 🔲 Deprecate `WellnessService.logWellness()` method
- 🔲 Update onboarding to use `/api/wellness-checkin`
- 🔲 Migrate 5-6 "latest wellness" reads to API

**Result:** No new data written to `wellness_entries` (except via dual-write in Phase 2)

---

### Phase 2: Dual-Write Strategy (Weeks 2-3) ⏱️ 2-3 hours
**Effort:** LOW  
**Risk:** LOW

**Actions:**
- 🔲 Backend writes to BOTH tables temporarily
- 🔲 Ensures historical continuity during migration
- 🔲 Monitor for sync issues

**Result:** Both tables stay in sync, no data gaps

---

### Phase 3: Migrate Reads (Weeks 4-6) ⏱️ 10-15 hours
**Effort:** MEDIUM  
**Risk:** MEDIUM

**Actions:**
- 🔲 Backfill historical data from `wellness_entries` → `daily_wellness_checkin`
- 🔲 Update 13 read locations to use `daily_wellness_checkin`
- 🔲 Update all export services
- 🔲 Comprehensive testing

**Result:** All reads migrated, `wellness_entries` no longer accessed

---

### Phase 4: Full Deprecation (6+ months) ⏱️ 2-3 hours
**Effort:** LOW  
**Risk:** LOW

**Actions:**
- 🔲 Remove dual-write
- 🔲 Archive `wellness_entries` table
- 🔲 Wait 3-6 months for confidence
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
Week 1 (Now):          Phase 1 - Stop new writes          (3-4 hours)
Weeks 2-3:             Phase 2 - Dual-write               (2-3 hours)
Weeks 4-6:             Phase 3 - Migrate reads            (10-15 hours)
Months 2-8:            Phase 4 - Full deprecation         (2-3 hours)
───────────────────────────────────────────────────────────────────
TOTAL EFFORT:          ~20-25 hours over 6-8 months
```

**Developer Time:** ~3 hours/week for first month, then minimal maintenance

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

## Recommendation

### ✅ DO THIS (Recommended)

**Start Phase 1 this week:**
1. Mark `WellnessService.logWellness()` as deprecated
2. Update onboarding to use API
3. Migrate 5-6 "latest wellness" reads to API
4. Test thoroughly

**Then proceed with Phases 2-4 over next 6-8 months.**

**Rationale:**
- Low risk, incremental approach
- Preserves historical data
- Zero downtime
- Easy rollback if needed

---

### ❌ DO NOT DO THIS

**Drop `wellness_entries` table immediately:**
- ❌ Data loss (3+ years of wellness data)
- ❌ Broken features (13 read locations)
- ❌ User complaints (missing exports)
- ❌ No rollback path

---

## Next Steps

1. **Review:** Read `docs/WELLNESS_PHASE1_ACTION_PLAN.md` for detailed tasks
2. **Approve:** Confirm phased migration approach
3. **Execute:** Start Phase 1 (3-4 hours this week)
4. **Monitor:** Track progress over next 6-8 months

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

## Decision Required

**Option A: Proceed with Phased Migration** ✅ RECOMMENDED  
- Start Phase 1 this week
- Complete migration over 6-8 months
- Zero data loss, zero downtime

**Option B: Keep Both Tables Indefinitely** ⚠️ NOT RECOMMENDED  
- Maintain split-brain architecture
- Increased complexity & maintenance burden
- Potential for future data inconsistencies

**Option C: Immediate Deprecation** ❌ NOT RECOMMENDED  
- Data loss (3+ years)
- Broken features (13 locations)
- High risk, no rollback

---

**Recommended Decision:** **Option A** - Proceed with phased migration starting this week.

---

**Status:** Awaiting approval to begin Phase 1  
**ETA:** Phase 1 complete by end of week (if approved today)
