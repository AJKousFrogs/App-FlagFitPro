# 502 Error Fix - Quick Reference

## Problem
- **Error**: HTTP 502 when submitting wellness check-in
- **Cause**: Frontend → `wellness_entries`, Backend → `wellness_logs`
- **Result**: Data disconnect, "Missing wellness log" error

## Solution
✅ **Database trigger automatically syncs the two tables**

```
wellness_entries → [TRIGGER] → wellness_logs
```

## Status
✅ **FIXED** (2026-01-11)
- Trigger deployed
- Data backfilled (8 rows)
- Enhanced logging added
- Ready for testing

## Test It
1. Go to: https://webflagfootballfrogs.netlify.app
2. Log in → Today page
3. Quick Check-in
4. Submit wellness data
5. ✅ Should see success + readiness score

## Verify It
```sql
-- Both should have same count
SELECT COUNT(*) FROM wellness_entries;
SELECT COUNT(*) FROM wellness_logs;
```

## Monitor It
- Netlify logs: https://app.netlify.com/sites/webflagfootballfrogs/logs
- Look for: `[calc-readiness] Calculation complete`
- No more 502 errors!

## If Issues Persist
1. Check trigger active:
   ```sql
   SELECT * FROM information_schema.triggers 
   WHERE trigger_name = 'sync_wellness_entries_to_logs';
   ```
2. Run diagnostic: `./scripts/diagnose-calc-readiness.sh`
3. Review: `docs/WELLNESS_DATA_SYNC_FIX.md`

## Files Changed
- `database/migrations/fix_wellness_sync_trigger.sql` ← The fix
- `netlify/functions/calc-readiness.cjs` ← Enhanced logging
- `docs/*` ← Documentation

## Next Sprint
Consider consolidating tables (remove trigger, use one table)

---
**Status**: ✅ Deployed  
**Date**: 2026-01-11
