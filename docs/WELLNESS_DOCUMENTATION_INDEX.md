# Wellness Data Architecture - Documentation Index

**Last Updated:** 2026-01-11  
**Status:** Split-brain fixed, deprecation analysis complete  

---

## 📋 Start Here

**New to wellness data architecture?** Read in this order:

1. **[Wellness Fix Summary](fixes/WELLNESS_FIX_SUMMARY.md)** ⏱️ 5 min
   - Quick overview of split-brain fix
   - Testing instructions
   - What was changed

2. **[Wellness Deprecation Executive Summary](WELLNESS_DEPRECATION_EXECUTIVE_SUMMARY.md)** ⏱️ 8 min
   - Should we deprecate `wellness_entries` table?
   - Phased migration strategy
   - Business impact & timeline

3. **[Phase 1 Action Plan](WELLNESS_PHASE1_ACTION_PLAN.md)** ⏱️ 10 min
   - What to do THIS WEEK
   - Detailed task list
   - Testing checklist

---

## 📚 Complete Documentation

### 🔧 Fixes & Implementation

| Document | Purpose | Audience | Length |
|----------|---------|----------|--------|
| [Wellness Single Source of Truth](fixes/WELLNESS_SINGLE_SOURCE_OF_TRUTH.md) | Technical deep-dive on split-brain fix | Developers | 15 min |
| [Before/After Diagram](fixes/WELLNESS_BEFORE_AFTER_DIAGRAM.md) | Visual comparison of old vs new flow | All | 10 min |
| [Wellness Architecture Quick Reference](WELLNESS_ARCHITECTURE_QUICK_REF.md) | API contract, field mappings, common pitfalls | Developers | 12 min |

### 📊 Deprecation & Migration

| Document | Purpose | Audience | Length |
|----------|---------|----------|--------|
| [Deprecation Executive Summary](WELLNESS_DEPRECATION_EXECUTIVE_SUMMARY.md) | Business case for phased migration | Stakeholders | 8 min |
| [Deprecation Plan](WELLNESS_ENTRIES_DEPRECATION_PLAN.md) | Complete 4-phase technical plan | Developers | 20 min |
| [Migration Visual Guide](WELLNESS_MIGRATION_VISUAL_GUIDE.md) | Visual diagrams of all 4 phases | All | 15 min |
| [Phase 1 Action Plan](WELLNESS_PHASE1_ACTION_PLAN.md) | Immediate tasks for this week | Developers | 10 min |

---

## 🎯 By Role

### For Product Managers
1. [Wellness Fix Summary](fixes/WELLNESS_FIX_SUMMARY.md) - What was broken, what's fixed
2. [Deprecation Executive Summary](WELLNESS_DEPRECATION_EXECUTIVE_SUMMARY.md) - Should we deprecate?

### For Backend Developers
1. [Wellness Single Source of Truth](fixes/WELLNESS_SINGLE_SOURCE_OF_TRUTH.md) - Backend contract
2. [Deprecation Plan](WELLNESS_ENTRIES_DEPRECATION_PLAN.md) - Dual-write strategy

### For Frontend Developers
1. [Wellness Architecture Quick Reference](WELLNESS_ARCHITECTURE_QUICK_REF.md) - API usage, pitfalls
2. [Phase 1 Action Plan](WELLNESS_PHASE1_ACTION_PLAN.md) - Code changes needed
3. [Before/After Diagram](fixes/WELLNESS_BEFORE_AFTER_DIAGRAM.md) - Visual flow

### For QA/Testing
1. [Wellness Fix Summary](fixes/WELLNESS_FIX_SUMMARY.md) - Testing scenarios
2. [Phase 1 Action Plan](WELLNESS_PHASE1_ACTION_PLAN.md) - Test plan

---

## 🔍 Quick Reference

### Data Tables

| Table | Purpose | Status | Access Pattern |
|-------|---------|--------|----------------|
| `daily_wellness_checkin` | Daily check-ins | ✅ Active | `/api/wellness-checkin` |
| `wellness_entries` | Historical trends | ⚠️ Legacy | Direct reads only (for now) |

### API Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/wellness-checkin` | POST | Save/update daily check-in | ✅ Active |
| `/api/wellness-checkin?date=YYYY-MM-DD` | GET | Get check-in for date | ✅ Active |

### Key Files

| File | Purpose | Last Modified |
|------|---------|---------------|
| `daily-readiness.component.ts` | Daily check-in modal | 2026-01-11 (fixed) |
| `wellness-checkin.cjs` | Backend API handler | Existing (working) |
| `wellness.service.ts` | Legacy wellness service | Needs deprecation |

---

## 📈 Migration Status

### ✅ Phase 0: Split-Brain Fix (Complete)
- **Status:** ✅ Complete
- **Date:** 2026-01-11
- **Impact:** Daily check-ins now persist correctly

### 🔲 Phase 1: Stop New Writes (Planned)
- **Status:** 🔲 Ready to start
- **Timeline:** This week (3-4 hours)
- **Impact:** No new data to `wellness_entries`

### 🔲 Phase 2: Dual-Write (Planned)
- **Status:** 🔲 Not started
- **Timeline:** Weeks 2-3 (2-3 hours)
- **Impact:** Both tables stay in sync

### 🔲 Phase 3: Migrate Reads (Planned)
- **Status:** 🔲 Not started
- **Timeline:** Weeks 4-6 (10-15 hours)
- **Impact:** All reads use `daily_wellness_checkin`

### 🔲 Phase 4: Full Deprecation (Planned)
- **Status:** 🔲 Not started
- **Timeline:** 6+ months (2-3 hours)
- **Impact:** `wellness_entries` archived/dropped

---

## 🚨 Known Issues

### Resolved
- ✅ Split-brain wellness data (fixed 2026-01-11)
- ✅ "Says done, but after refresh nothing changed" (fixed 2026-01-11)

### Open
- ⚠️ `WellnessService.logWellness()` still writes to legacy table (deprecate in Phase 1)
- ⚠️ 13 locations read from `wellness_entries` (migrate in Phase 3)
- ⚠️ Onboarding writes to `wellness_entries` (fix in Phase 1)

---

## 🔗 Related Documentation

### Local Files
- `netlify/functions/wellness-checkin.cjs` - Backend implementation
- `angular/src/app/shared/components/daily-readiness/` - Daily check-in UI
- `angular/src/app/core/services/wellness.service.ts` - Wellness service (legacy)

### Other Docs
- [Backend Setup](BACKEND_SETUP.md) - API configuration
- [Database Setup](DATABASE_SETUP.md) - Schema details
- [Error Handling Guide](ERROR_HANDLING_GUIDE.md) - API error patterns

---

## 📝 Changelog

### 2026-01-11
- ✅ Fixed split-brain wellness data issue
- ✅ Updated `DailyReadinessComponent` to use `/api/wellness-checkin`
- ✅ Created comprehensive deprecation documentation
- ✅ Analyzed all `wellness_entries` usage (13 reads, 2 writes)
- ✅ Designed 4-phase migration strategy

### Previous
- `wellness_entries` table created (original wellness table)
- `daily_wellness_checkin` table added
- `/api/wellness-checkin` endpoint implemented

---

## 🤝 Contributing

### Adding New Wellness Features

**✅ DO:**
- Use `/api/wellness-checkin` for daily check-ins
- Read from `daily_wellness_checkin` table
- Follow patterns in `DailyReadinessComponent`

**❌ DON'T:**
- Write directly to `wellness_entries` table
- Write directly to `daily_wellness_checkin` table (use API)
- Read from `wellness_entries` (unless historical trends)

### Code Review Checklist

When reviewing wellness-related PRs:
- [ ] Uses `/api/wellness-checkin` API (not direct DB writes)
- [ ] Handles Observable subscriptions correctly
- [ ] Maps field names properly (see Quick Reference)
- [ ] Includes error handling
- [ ] No direct writes to `wellness_entries`

---

## 🆘 Support

**Having issues?**

1. Check [Wellness Architecture Quick Reference](WELLNESS_ARCHITECTURE_QUICK_REF.md) for common pitfalls
2. Review [Before/After Diagram](fixes/WELLNESS_BEFORE_AFTER_DIAGRAM.md) for data flow
3. Search closed issues for similar problems
4. Ask in #platform-support channel

**Found a bug?**

1. Check if it's related to split-brain issue (fixed 2026-01-11)
2. Verify using correct table (`daily_wellness_checkin` vs `wellness_entries`)
3. Report with steps to reproduce

---

## 📅 Next Review

**Date:** 2026-01-18 (1 week)  
**Purpose:** Assess Phase 1 progress  
**Attendees:** Platform Team

**Agenda:**
- Review Phase 1 completion status
- Discuss any blockers
- Plan Phase 2 timeline

---

**Last Updated:** 2026-01-11  
**Maintained By:** Platform Team  
**Next Update:** After Phase 1 completion
