# Profile Save Issue - Comprehensive Audit Report

## Executive Summary
The profile information is NOT being saved due to **multiple critical issues** in the save flow. This is the 4th attempt to fix this issue.

---

## 🔴 Critical Issues Found

### Issue #1: Schema Mismatch Between Code and Database
**Severity:** CRITICAL - Data Loss

**Location:** `settings.component.ts:654-670`

The code is trying to save fields that **DO NOT EXIST** in the database schema:

```typescript
// Code tries to save these fields:
const updateData = {
  full_name: settings.profile.displayName,     // ❌ Column doesn't exist
  first_name: nameParts[0] || null,            // ✅ Exists
  last_name: nameParts.slice(1).join(" "),     // ✅ Exists  
  date_of_birth: dateOfBirthStr,               // ❌ Column is 'birth_date' not 'date_of_birth'
  jersey_number: settings.profile.jerseyNumber, // ❌ Column doesn't exist
  phone: settings.profile.phone,                // ❌ Column doesn't exist
  // ... more mismatched fields
};
```

**Actual Database Schema** (from `001_base_tables.sql`):
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    position VARCHAR(20),
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    birth_date DATE,              -- NOT date_of_birth!
    profile_picture VARCHAR(500), -- NOT avatar_url!
    bio TEXT,
    is_active BOOLEAN,
    email_verified BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
-- Missing: full_name, jersey_number, phone, team
```

**Impact:** The upsert operation silently fails or inserts data that gets rejected by Postgres, causing the save to fail.

---

### Issue #2: Incorrect Upsert Logic - created_at Overwrites
**Severity:** HIGH - Data Corruption

**Location:** `settings.component.ts:668-669`

```typescript
const now = new Date().toISOString();
const updateData = {
  // ...
  created_at: now,  // ❌ WRONG! This should NEVER be updated
  updated_at: now,  // ✅ Correct
};
```

**Problem:** Every time the user saves their profile, `created_at` is being overwritten with the current timestamp. This:
- Destroys historical "member since" data
- Violates audit trail integrity
- Makes debugging impossible

**Fix Required:** Only set `created_at` on INSERT, never on UPDATE.

---

### Issue #3: Missing Error Handling
**Severity:** HIGH - Silent Failures

**Location:** `settings.component.ts:684-710`

The code catches and **SWALLOWS** errors without properly reporting them:

```typescript
if (profileError) {
  this.logger.error("User profile upsert failed:", profileError.message);
  // ❌ Don't throw - continue with other updates
} else if (!upsertedUser) {
  this.logger.warn("User profile upsert returned no data");
  // ❌ No error shown to user
}
```

**Impact:** 
- User sees "Settings saved successfully!" even when the database save failed
- Profile changes are stored in localStorage but NOT in the database
- On page refresh, all changes are lost
- User has NO IDEA their data wasn't actually saved

---

### Issue #4: Multiple Storage Locations Create Confusion
**Severity:** MEDIUM - Data Inconsistency

The save flow attempts to save data to 3 different locations:
1. **localStorage** (`user_settings`) - Lines 626-632
2. **Supabase `users` table** - Lines 675-695
3. **Supabase `user_settings` table** - Lines 734-765

**Problem:** If ANY of these saves fail (especially #2), the user sees success but data is inconsistent across storage layers.

---

### Issue #5: Auth Metadata Update Doesn't Persist Profile Changes
**Severity:** MEDIUM - Lost Updates

**Location:** `settings.component.ts:714-730`

```typescript
const { data: authData, error: authError } = await this.supabaseService.updateUser({
  data: {
    full_name: settings.profile.displayName,
    name: settings.profile.displayName,
    position: settings.profile.position,
  },
});
```

**Problem:** Auth metadata is separate from the `users` table. If the `users` table save fails (due to schema mismatch), but auth metadata succeeds, you have:
- Auth says: "John Doe, QB"
- Database says: "Jane Smith, WR" (old data)
- UI shows one thing, database has another

---

## 🔍 Root Cause Analysis

### Why Has This Failed 4 Times?

1. **Database schema was never aligned with the code expectations**
   - The code assumes columns that don't exist (`full_name`, `jersey_number`, `phone`, `date_of_birth`)
   - Previous fixes only addressed the TypeScript/UI layer, not the database layer

2. **Error handling masks the real problem**
   - Try-catch blocks swallow errors without alerting the user
   - Success toast shows even when database save fails
   - Developer logs are insufficient for debugging in production

3. **Incomplete testing**
   - Tests likely only checked localStorage, not database persistence
   - No integration tests that verify data round-trips through Supabase
   - No verification that upsert actually succeeds

---

## ✅ Required Fixes (Priority Order)

### Fix #1: Add Missing Columns to Database Schema
**Priority:** CRITICAL
**Estimated Time:** 5 minutes

Create migration: `database/migrations/XXX_add_missing_user_columns.sql`

```sql
-- Add missing columns to users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS full_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS jersey_number INTEGER,
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS team VARCHAR(100);

-- Rename birth_date to date_of_birth for consistency
ALTER TABLE public.users 
  RENAME COLUMN birth_date TO date_of_birth;

-- Update existing data: populate full_name from first_name + last_name
UPDATE public.users 
SET full_name = TRIM(CONCAT(first_name, ' ', last_name))
WHERE full_name IS NULL;
```

### Fix #2: Correct the Upsert Logic
**Priority:** CRITICAL
**Estimated Time:** 2 minutes

**In `settings.component.ts`:**

```typescript
// ❌ WRONG (current code):
const now = new Date().toISOString();
const updateData = {
  id: user.id,
  created_at: now,  // DON'T DO THIS
  updated_at: now,
};

// ✅ CORRECT:
const updateData = {
  id: user.id,
  // Don't include created_at - let database default handle it
  updated_at: new Date().toISOString(),
};
```

### Fix #3: Add Proper Error Reporting
**Priority:** HIGH
**Estimated Time:** 3 minutes

```typescript
const { data: upsertedUser, error: profileError } = await this.supabaseService.client
  .from("users")
  .upsert(updateData, { onConflict: 'id' })
  .select()
  .single();

if (profileError) {
  // ❌ Don't swallow the error
  this.logger.error("User profile upsert failed:", profileError);
  this.toastService.error(`Failed to save profile: ${profileError.message}`);
  throw profileError; // Stop execution
}

if (!upsertedUser) {
  this.logger.error("User profile upsert returned no data");
  this.toastService.error("Failed to save profile: No data returned");
  throw new Error("Upsert returned no data");
}

this.logger.info("User profile saved successfully:", upsertedUser);
```

### Fix #4: Align Field Names
**Priority:** HIGH
**Estimated Time:** 2 minutes

Update `settings.component.ts:664` to use correct database column names:

```typescript
const updateData = {
  id: user.id,
  email: user.email || null,
  full_name: settings.profile.displayName,
  first_name: nameParts[0] || null,
  last_name: nameParts.slice(1).join(" ") || null,
  position: settings.profile.position,
  jersey_number: settings.profile.jerseyNumber 
    ? parseInt(settings.profile.jerseyNumber, 10) 
    : null,
  height_cm: settings.profile.heightCm || null,
  weight_kg: settings.profile.weightKg || null,
  phone: settings.profile.phone || null,
  date_of_birth: dateOfBirthStr, // Now matches database
  updated_at: new Date().toISOString(),
};
```

---

## 🧪 Testing Checklist

After implementing fixes, verify:

- [ ] Open browser DevTools → Network tab
- [ ] Go to Settings page
- [ ] Change profile information (name, position, jersey number)
- [ ] Click "Save Changes"
- [ ] Verify network request to Supabase succeeds (200 status)
- [ ] Refresh the page
- [ ] Verify changes persist after refresh
- [ ] Check Supabase database directly - confirm row was updated
- [ ] Check that `created_at` did NOT change
- [ ] Check that `updated_at` DID change

---

## 📊 Impact Analysis

**Before Fix:**
- User changes profile → localStorage updated ✅
- Database NOT updated ❌
- User refreshes → sees old data ❌
- User frustrated 😡

**After Fix:**
- User changes profile → localStorage updated ✅
- Database updated ✅
- User refreshes → sees new data ✅
- Data persists across devices ✅
- User happy 😊

---

## 🔒 Prevention Measures

1. **Schema Validation:** Add TypeScript types that match database schema exactly
2. **Integration Tests:** Test data persistence through Supabase, not just localStorage
3. **Error Monitoring:** Use proper error tracking (Sentry, LogRocket) to catch these issues in production
4. **Database Migrations:** Always create migrations when adding new fields to forms
5. **Code Review Checklist:** Verify field names match database schema before merging

---

## Summary

**This issue has persisted through 4 fix attempts because the real problem was in the database schema, not the UI code.**

The settings component was trying to save data to columns that don't exist, and error handling was hiding this fact from both developers and users.

**Required Actions:**
1. Add missing database columns
2. Fix upsert logic (don't overwrite created_at)
3. Fix error handling (show errors to user)
4. Verify all field names match database schema

**Estimated Total Fix Time:** 15-20 minutes
