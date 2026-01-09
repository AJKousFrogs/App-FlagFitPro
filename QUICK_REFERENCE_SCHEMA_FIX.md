# 🚀 Database Schema Fix - Quick Reference Card

**Print this card and keep it handy during deployment**

---

## 🎯 The Problem (One Sentence)

Profile saves fail because the database is missing 4 columns that the code tries to write to.

---

## ✅ The Solution (One Command + Verification)

### 1. Apply Migration (Supabase Dashboard)
```sql
-- Paste this file into SQL Editor:
database/migrations/112_fix_users_table_profile_fields.sql
-- Click "Run"
```

### 2. Verify Migration Worked
```sql
-- Run this query - should return 5 rows:
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('full_name', 'jersey_number', 'phone', 'team', 'date_of_birth');
```

### 3. Regenerate Types
```bash
npx supabase gen types typescript --linked > supabase-types.ts
```

### 4. Test
```
Open app → Settings → Change profile → Save → Refresh → Verify persists ✅
```

---

## 📋 Missing Columns (What Migration Adds)

| Column | Type | Purpose |
|--------|------|---------|
| `full_name` | VARCHAR(200) | Display name |
| `jersey_number` | INTEGER | Player jersey # |
| `phone` | VARCHAR(20) | Contact phone |
| `team` | VARCHAR(100) | Team affiliation |
| ~~`birth_date`~~ → `date_of_birth` | DATE | DOB (renamed) |

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Apply migration | 2 min |
| Regenerate types | 2 min |
| Test locally | 3 min |
| Deploy to staging | 10 min |
| Deploy to prod | 10 min |
| **Total** | **27 min** |

---

## 🔍 Quick Verification Commands

```bash
# Check migration file exists
ls database/migrations/112_fix_users_table_profile_fields.sql

# Run verification script
./verify-schema-fix.sh

# Check if types have new fields
grep "date_of_birth" supabase-types.ts
grep "jersey_number" supabase-types.ts

# Test in browser console (after migration)
// Should see your data:
console.log(userProfile.full_name);
console.log(userProfile.jersey_number);
```

---

## 🚨 Rollback (If Needed)

```sql
-- Only use if migration causes critical issues!
ALTER TABLE users DROP COLUMN IF EXISTS full_name;
ALTER TABLE users DROP COLUMN IF EXISTS jersey_number;
ALTER TABLE users DROP COLUMN IF EXISTS phone;
ALTER TABLE users DROP COLUMN IF EXISTS team;
ALTER TABLE users RENAME COLUMN date_of_birth TO birth_date;
```

---

## ✅ Success Checklist

- [ ] Migration ran without errors
- [ ] Verification query returns 5 rows
- [ ] TypeScript types regenerated
- [ ] Dev server restarted
- [ ] Profile save works in browser
- [ ] Changes persist after F5 refresh
- [ ] No console errors
- [ ] Database query shows saved data
- [ ] `created_at` timestamp unchanged
- [ ] `updated_at` timestamp updated

---

## 📞 Emergency Contacts

| Issue | Check |
|-------|-------|
| Migration fails | Supabase Dashboard → Logs |
| Types missing fields | Re-run `npx supabase gen types` |
| Save still fails | Clear cache, restart dev server |
| TypeScript errors | Check for `birth_date` vs `date_of_birth` |

---

## 📚 Full Documentation

- **Overview:** `DATABASE_SCHEMA_AUDIT_INDEX.md`
- **Summary:** `DATABASE_SCHEMA_AUDIT_SUMMARY.md`
- **Instructions:** `SCHEMA_FIX_INSTRUCTIONS.md`
- **Checklist:** `SCHEMA_FIX_CHECKLIST.md`
- **Technical:** `DATABASE_SCHEMA_AUDIT_REPORT.md`
- **Verification:** `./verify-schema-fix.sh`

---

## 💡 Pro Tips

1. **Test in dev first** - Never apply directly to prod
2. **Backup before migration** - Even though it's safe
3. **Monitor after deploy** - Watch logs for 1 hour
4. **Clear browser cache** - Hard refresh after types regenerate
5. **Check created_at** - Should NEVER change on saves

---

## 🎯 Expected Results

### Before Fix ❌
- Profile save → localStorage only
- Page refresh → changes lost
- User sees "Success!" but it's a lie

### After Fix ✅
- Profile save → database + localStorage
- Page refresh → changes persist
- User sees "Success!" and it's true

---

**Version:** 1.0  
**Date:** 2026-01-09  
**Status:** Ready to deploy

---

## One-Liner Summary

> Apply migration 112 to add 4 missing columns to users table, regenerate types, test, deploy. Takes 27 minutes total. Fixes profile saves.

---

**Start Here:** `DATABASE_SCHEMA_AUDIT_INDEX.md`  
**Need Help?** `SCHEMA_FIX_INSTRUCTIONS.md` → Troubleshooting section
