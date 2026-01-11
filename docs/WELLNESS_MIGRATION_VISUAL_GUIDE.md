# Wellness Tables Migration Strategy - Visual Guide

## Current State (After Split-Brain Fix)

```
┌─────────────────────────────────────────────────────────────┐
│                    WELLNESS DATA TABLES                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│  daily_wellness_checkin         │   │  wellness_entries (LEGACY)      │
│  ─────────────────────────────  │   │  ─────────────────────────────  │
│  ✅ NEW check-ins (today)       │   │  ⚠️  Historical data            │
│  ✅ Single source of truth      │   │  ⚠️  Multiple read locations    │
│  ✅ UPSERT via API              │   │  ❌ Old write locations         │
│                                 │   │                                 │
│  Table: ~30 days of data        │   │  Table: Years of data           │
│  Unique: (user_id, date)        │   │  Unique: (athlete_id, date)     │
└─────────────────────────────────┘   └─────────────────────────────────┘
         ↑                                       ↑
         │                                       │
         │ WRITE (✅)                            │ READ (⚠️ Still used)
         │                                       │
┌────────┴───────────────────────────────────────┴─────────────┐
│                   FRONTEND COMPONENTS                         │
│                                                               │
│  ✅ DailyReadinessComponent → POST /api/wellness-checkin     │
│  ⚠️  WellnessService.getWellnessData() → wellness_entries    │
│  ⚠️  ProfileComponent → wellness_entries (last 7 days)       │
│  ⚠️  RecoveryService → wellness_entries (latest)             │
│  ⚠️  Export services → wellness_entries (all history)        │
└───────────────────────────────────────────────────────────────┘
```

---

## Migration Strategy: 4 Phases

### Phase 1: Stop New Writes ✅ (Current - Week 1)

```
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│  daily_wellness_checkin         │   │  wellness_entries               │
│  ─────────────────────────────  │   │  ─────────────────────────────  │
│  ✅ NEW check-ins → HERE        │   │  📦 FROZEN (no new writes)      │
│  ✅ POST /api/wellness-checkin  │   │  ⚠️  Still has historical data  │
│                                 │   │  ⚠️  Still read by services     │
└─────────────────────────────────┘   └─────────────────────────────────┘
         ↑                                       ↑
         │                                       │
         │ WRITE (✅)                            │ READ ONLY (⚠️)
         │                                       │
┌────────┴───────────────────────────────────────┴─────────────┐
│  ACTIONS:                                                     │
│  ✅ DailyReadinessComponent uses /api/wellness-checkin       │
│  🔲 Deprecate WellnessService.logWellness()                  │
│  🔲 Update OnboardingComponent to use API                    │
│  🔲 Migrate "latest wellness" reads to API                   │
└───────────────────────────────────────────────────────────────┘

Result: wellness_entries stops growing, daily_wellness_checkin is authority
```

---

### Phase 2: Dual-Write Strategy (Weeks 2-3)

```
┌─────────────────────────────────────────────────────────────────┐
│            Backend: /api/wellness-checkin POST                   │
│                                                                  │
│  1. Validate data                                               │
│  2. UPSERT to daily_wellness_checkin ✅                         │
│  3. ALSO write to wellness_entries (for continuity) 🔄          │
│  4. Trigger safety overrides, recovery blocks, etc.             │
└─────────────────────────────────────────────────────────────────┘
              ↓                              ↓
              ↓                              ↓
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│  daily_wellness_checkin         │   │  wellness_entries               │
│  ─────────────────────────────  │   │  ─────────────────────────────  │
│  ✅ Primary table               │   │  🔄 Mirror of new check-ins     │
│  ✅ All new data                │   │  📦 + Historical data           │
│  ✅ Read via API                │   │  ⚠️  Still read by old services │
└─────────────────────────────────┘   └─────────────────────────────────┘

Benefit: Both tables stay in sync during migration period
Risk: Minimal (dual-write failures are non-fatal)

ACTIONS:
🔲 Add dual-write logic to wellness-checkin.cjs
🔲 Log errors but don't fail if wellness_entries write fails
🔲 Monitor logs for sync issues
```

---

### Phase 3: Migrate Reads (Weeks 4-6)

```
STEP 1: Backfill historical data
─────────────────────────────────

┌─────────────────────────────────┐
│  wellness_entries               │
│  ─────────────────────────────  │
│  📦 3 years of historical data  │
└──────────────┬──────────────────┘
               │
               │ MIGRATION SCRIPT
               │ (one-time backfill)
               ↓
┌─────────────────────────────────┐
│  daily_wellness_checkin         │
│  ─────────────────────────────  │
│  ✅ NOW has historical data     │
│  ✅ Complete wellness timeline  │
└─────────────────────────────────┘


STEP 2: Update read locations
─────────────────────────────

Before:
┌──────────────────────────────────────────┐
│  Component reads wellness_entries        │
└──────────────────────────────────────────┘

After:
┌──────────────────────────────────────────┐
│  Component reads daily_wellness_checkin  │
│  OR uses /api/wellness-checkin           │
└──────────────────────────────────────────┘

Files to Update (13 locations):
✅ UnifiedTrainingService.checkWellnessForTraining()
✅ AiTrainingSchedulerComponent (load wellness)
✅ ProfileComponent (performance score)
✅ RecoveryService (latest wellness)
✅ TrainingSafetyComponent (sleep debt)
✅ MissingDataDetectionService
✅ DirectSupabaseApiService (injury notes)
✅ WellnessService.getWellnessData() (30-day trends)
✅ PerformanceDataService (exports)
✅ DataExportService
✅ SettingsComponent (export)
✅ AdminService (backup size)

Pattern:
  OLD: .from("wellness_entries")
  NEW: .from("daily_wellness_checkin") OR use /api/wellness-checkin
```

---

### Phase 4: Full Deprecation (6+ months)

```
STEP 1: Remove dual-write
─────────────────────────

┌─────────────────────────────────────────────────────────────┐
│            Backend: /api/wellness-checkin POST               │
│                                                              │
│  1. Validate data                                           │
│  2. UPSERT to daily_wellness_checkin ✅                     │
│  3. ❌ STOP writing to wellness_entries                     │
│  4. Trigger safety overrides, recovery blocks, etc.         │
└─────────────────────────────────────────────────────────────┘
              ↓
              ↓
┌─────────────────────────────────┐   ┌─────────────────────────────────┐
│  daily_wellness_checkin         │   │  wellness_entries               │
│  ─────────────────────────────  │   │  ─────────────────────────────  │
│  ✅ ONLY wellness table         │   │  🗑️  DEPRECATED                 │
│  ✅ All reads & writes here     │   │  🗑️  No longer updated          │
│  ✅ Complete historical data    │   │  🗑️  Can be archived/dropped    │
└─────────────────────────────────┘   └─────────────────────────────────┘


STEP 2: Archive & drop table
────────────────────────────

1. Export wellness_entries to backup storage (S3, archive DB)
2. Add deprecation notice in schema
3. Wait 3-6 months for confidence
4. DROP TABLE wellness_entries; ✅


FINAL STATE:
───────────

┌─────────────────────────────────┐
│  daily_wellness_checkin         │
│  ─────────────────────────────  │
│  ✅ SINGLE SOURCE OF TRUTH      │
│  ✅ Daily check-ins             │
│  ✅ Historical trends           │
│  ✅ Export data                 │
│  ✅ All calculations            │
└─────────────────────────────────┘
         ↑
         │
         │ ALL reads & writes
         │
┌────────┴───────────────────┐
│  /api/wellness-checkin     │
│  Frontend components       │
└────────────────────────────┘

Result: One table, one API, one source of truth ✅
```

---

## Timeline Overview

```
Week 1 (NOW):
  ✅ Stop new writes to wellness_entries
  🔲 Deprecate WellnessService.logWellness()
  🔲 Update onboarding & latest wellness reads
  
Weeks 2-3:
  🔲 Add dual-write to backend
  🔲 Monitor for sync issues
  
Weeks 4-6:
  🔲 Backfill historical data
  🔲 Migrate 13 read locations
  🔲 Update export services
  🔲 Test thoroughly
  
Months 2-8:
  🔲 Remove dual-write
  🔲 Mark wellness_entries as deprecated
  🔲 Monitor for issues
  
After 6+ months:
  🔲 Archive wellness_entries
  🔲 Drop table
  🔲 Clean up schema
```

---

## Key Decisions

### ✅ DO THIS:
- Use phased migration (4 phases over 6+ months)
- Keep historical data via backfill
- Use dual-write during transition
- Test each phase before proceeding

### ❌ DON'T DO THIS:
- Drop wellness_entries immediately (data loss!)
- Migrate all reads at once (high risk)
- Skip dual-write phase (data gaps)
- Remove table before all reads migrated

---

## Success Metrics

### Phase 1 Complete When:
- ✅ No new writes to wellness_entries (except dual-write)
- ✅ All daily check-ins use /api/wellness-checkin
- ✅ "Latest wellness" queries use API

### Phase 2 Complete When:
- ✅ Dual-write running for 2+ weeks
- ✅ No sync errors in logs
- ✅ Both tables have same data

### Phase 3 Complete When:
- ✅ Historical data backfilled
- ✅ All 13 read locations migrated
- ✅ Export services updated
- ✅ No reads from wellness_entries

### Phase 4 Complete When:
- ✅ Dual-write removed
- ✅ 6+ months without issues
- ✅ wellness_entries archived
- ✅ Table dropped

---

## Rollback Plan

If issues arise at any phase:

**Phase 1 Rollback:**
```
Revert DailyReadinessComponent changes
Resume writing to wellness_entries
```

**Phase 2 Rollback:**
```
Remove dual-write
Continue Phase 1 approach
```

**Phase 3 Rollback:**
```
Revert read migrations
Continue reading from wellness_entries
Keep dual-write running
```

**Phase 4 Rollback:**
```
Re-enable dual-write
Do NOT drop table yet
Investigate issues
```

---

**Conclusion:** This is a **safe, phased migration** that preserves historical data while consolidating to a single wellness table. Each phase can be rolled back if issues arise.
