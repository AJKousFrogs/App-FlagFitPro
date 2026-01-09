# Database Schema Fix - Action Checklist

**Created:** January 9, 2026  
**Issue:** Profile saves fail due to schema mismatch  
**Solution:** Apply migration 112

---

## ✅ Pre-Flight Checklist

Before starting, verify:

- [ ] You have access to Supabase Dashboard
- [ ] You have permissions to run SQL queries
- [ ] You have node/npm installed (for type generation)
- [ ] You know your Supabase project ID
- [ ] You have a backup of production data (if applying to prod)

---

## 🚀 Implementation Checklist

### Phase 1: Apply Database Migration (5 minutes)

**Responsible:** Database Administrator

- [ ] **Open Supabase Dashboard**
  - Go to https://supabase.com/dashboard
  - Select your project

- [ ] **Navigate to SQL Editor**
  - Click "SQL Editor" in left sidebar
  - Click "+ New query"

- [ ] **Load Migration 112**
  - Open file: `database/migrations/112_fix_users_table_profile_fields.sql`
  - Copy entire contents
  - Paste into SQL Editor

- [ ] **Review Migration**
  - Check that it adds: `full_name`, `jersey_number`, `phone`, `team`
  - Check that it renames: `birth_date` → `date_of_birth`
  - Check that it has: `IF NOT EXISTS` (safe to re-run)

- [ ] **Execute Migration**
  - Click "Run" button
  - Or press Cmd+Enter (Mac) / Ctrl+Enter (Windows)

- [ ] **Verify Success**
  - Check for green "Success" message
  - No red error messages
  - Note: Some notices are OK (e.g., "column already exists")

- [ ] **Run Verification Query**
  ```sql
  SELECT column_name, data_type, character_maximum_length 
  FROM information_schema.columns 
  WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name IN ('full_name', 'jersey_number', 'phone', 'team', 'date_of_birth')
  ORDER BY column_name;
  ```
  
  **Expected: 5 rows returned**
  - date_of_birth | date
  - full_name | character varying | 200
  - jersey_number | integer
  - phone | character varying | 20
  - team | character varying | 100

- [ ] **Check for birth_date column (should NOT exist)**
  ```sql
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'users' 
    AND column_name = 'birth_date';
  ```
  
  **Expected: 0 rows** (column was renamed)

---

### Phase 2: Regenerate TypeScript Types (2 minutes)

**Responsible:** Developer

- [ ] **Open Terminal**
  ```bash
  cd "/Users/aljosaursakous/Desktop/Flag football HTML - APP"
  ```

- [ ] **Find Your Project ID**
  - Supabase Dashboard → Settings → General → Project ID
  - Or: Check `.env` file for `SUPABASE_PROJECT_ID`

- [ ] **Generate Types**
  ```bash
  # Method 1: If Supabase CLI is linked to project
  npx supabase gen types typescript --linked > supabase-types.ts
  
  # Method 2: If not linked, use project ID
  npx supabase gen types typescript \
    --project-id YOUR_PROJECT_ID \
    --schema public > supabase-types.ts
  ```

- [ ] **Verify Types Generated**
  - Check file size: `wc -l supabase-types.ts` (should be ~4000+ lines)
  - Check timestamp: `ls -l supabase-types.ts` (should be just now)

- [ ] **Verify Types Include New Fields**
  ```bash
  grep "date_of_birth" supabase-types.ts
  grep "jersey_number" supabase-types.ts
  grep "phone.*string" supabase-types.ts
  grep "full_name" supabase-types.ts
  ```
  
  **Expected: All 4 commands return matches**

- [ ] **Verify OLD field name is gone**
  ```bash
  grep "birth_date:" supabase-types.ts
  ```
  
  **Expected: No matches** (or only in comments)

---

### Phase 3: Test Locally (5 minutes)

**Responsible:** Developer/QA

- [ ] **Restart Dev Server**
  ```bash
  # Stop current server (Ctrl+C)
  npm run dev
  # Or: npm start, or your dev command
  ```

- [ ] **Clear Browser Cache**
  - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
  - Or: Open DevTools → Application → Clear Storage → Clear site data

- [ ] **Open Settings Page**
  - Navigate to: app → Settings
  - Check for console errors (should be none)

- [ ] **Open DevTools**
  - Press F12
  - Open Console tab
  - Open Network tab

- [ ] **Test Profile Save**
  - Change Display Name
  - Change Date of Birth
  - Change Position
  - Change Jersey Number
  - Change Phone Number

- [ ] **Click "Save Changes"**
  - Watch Network tab for request
  - Watch Console for logs

- [ ] **Verify Success Response**
  - Network tab: Look for POST/PATCH to `/rest/v1/users`
  - Status should be: 200 OK
  - Response should include your data
  - Console should show: "User profile saved successfully:"

- [ ] **Verify Success Toast**
  - Should see green toast: "Settings saved successfully"
  - Should NOT see red error toast

- [ ] **Refresh Page (F5)**
  - Wait for page to reload

- [ ] **Verify Changes Persisted**
  - Display Name should match what you entered
  - Date of Birth should match
  - Position should match
  - Jersey Number should match
  - Phone Number should match

---

### Phase 4: Verify Database Directly (3 minutes)

**Responsible:** Database Administrator/Developer

- [ ] **Query Database**
  ```sql
  -- Replace with your actual email
  SELECT 
    id, 
    email,
    full_name, 
    first_name,
    last_name,
    jersey_number, 
    phone, 
    date_of_birth,
    position,
    created_at, 
    updated_at
  FROM users 
  WHERE email = 'your-email@example.com';
  ```

- [ ] **Verify Data Saved**
  - full_name: Should be your display name
  - jersey_number: Should be your jersey number
  - phone: Should be your phone number
  - date_of_birth: Should be your DOB (YYYY-MM-DD format)
  - position: Should be your position

- [ ] **Verify Timestamps**
  - created_at: Should be ORIGINAL date (NOT recent)
  - updated_at: Should be RECENT date (when you saved)
  - **CRITICAL:** created_at should NOT change on subsequent saves

- [ ] **Test Another Save**
  - Go back to Settings
  - Change one field (e.g., jersey number)
  - Save
  - Re-run the query above
  - Verify: updated_at changed, created_at did NOT change

---

### Phase 5: Deploy to Staging (Optional, 15 minutes)

**Responsible:** DevOps

- [ ] **Apply Migration to Staging Database**
  - Same steps as Phase 1, but for staging environment

- [ ] **Deploy Code to Staging**
  ```bash
  git add supabase-types.ts
  git commit -m "chore: regenerate types after migration 112"
  git push origin staging
  # Or your deployment process
  ```

- [ ] **Test in Staging**
  - Repeat Phase 3 tests in staging environment
  - Use real user account (not test account)

- [ ] **Verify Staging Success**
  - Profile saves work
  - Changes persist
  - No console errors
  - No user reports of issues

---

### Phase 6: Deploy to Production (15 minutes)

**Responsible:** DevOps + Product Lead

- [ ] **Pre-Production Checks**
  - [ ] Staging tests passed
  - [ ] Code review approved
  - [ ] Database backup completed
  - [ ] Rollback plan documented
  - [ ] Team notified of deployment

- [ ] **Apply Migration to Production**
  - Same steps as Phase 1, but for production
  - Run during low-traffic window if possible
  - Monitor for errors in real-time

- [ ] **Deploy Code to Production**
  ```bash
  git push origin main
  # Or: trigger your CD pipeline
  ```

- [ ] **Smoke Test in Production**
  - Use test account
  - Repeat Phase 3 tests
  - Verify profile save works

- [ ] **Monitor for 1 Hour**
  - Check error logs
  - Check user feedback channels
  - Check support tickets
  - Watch for any anomalies

- [ ] **Announce Fix (Optional)**
  - Email/Slack: "Profile save issue fixed"
  - Include: "You can now save your profile and it will persist"

---

## 🚨 Rollback Plan

**If something goes wrong:**

### Database Rollback

- [ ] **Identify Issue**
  - What error occurred?
  - Which step failed?
  - Is data corrupted?

- [ ] **Revert Migration (if needed)**
  ```sql
  -- Only run if migration caused critical issues
  -- This will LOSE any data in new columns!
  
  -- Remove new columns
  ALTER TABLE users DROP COLUMN IF EXISTS full_name;
  ALTER TABLE users DROP COLUMN IF EXISTS jersey_number;
  ALTER TABLE users DROP COLUMN IF EXISTS phone;
  ALTER TABLE users DROP COLUMN IF EXISTS team;
  
  -- Rename back (if needed)
  ALTER TABLE users RENAME COLUMN date_of_birth TO birth_date;
  ```

- [ ] **Restore from Backup (if data corrupted)**
  ```bash
  # If you made a backup before migration:
  pg_restore -d $DATABASE_URL backup_before_migration_112.sql
  ```

### Code Rollback

- [ ] **Revert TypeScript Types**
  ```bash
  git checkout HEAD~1 supabase-types.ts
  git commit -m "revert: rollback types after migration 112 failure"
  git push
  ```

- [ ] **Notify Team**
  - Post in Slack/Discord: "Rolled back migration 112 due to [reason]"
  - Document what went wrong
  - Plan next steps

---

## 📊 Success Metrics

After deployment, track:

- **Technical Metrics:**
  - [ ] Profile save success rate > 95%
  - [ ] Zero "profile save failed" errors in logs
  - [ ] Average save time < 500ms
  - [ ] No database errors related to users table

- **User Metrics:**
  - [ ] User complaints about profile saves drop to zero
  - [ ] Support tickets about "changes not saving" resolved
  - [ ] User engagement with profile page increases

- **Code Quality:**
  - [ ] No TypeScript errors
  - [ ] No linter errors
  - [ ] All tests passing
  - [ ] Code coverage maintained

---

## 🎉 Completion Checklist

Once all phases complete:

- [ ] Migration 112 applied to all environments (dev, staging, prod)
- [ ] TypeScript types regenerated in all environments
- [ ] Profile save tested and working in all environments
- [ ] Database verified to have correct schema
- [ ] No errors in production logs
- [ ] No user complaints
- [ ] Documentation updated
- [ ] Team notified of completion
- [ ] Ticket/Issue closed

---

## 📞 Contact Info

**If you need help:**

- **Database Issues:** Check Supabase Dashboard → Logs
- **TypeScript Issues:** Check output of `npx supabase gen types`
- **Runtime Issues:** Check browser console + network tab
- **General Issues:** See `SCHEMA_FIX_INSTRUCTIONS.md`

**Emergency Contact:**
- Check `DATABASE_SCHEMA_AUDIT_REPORT.md` for troubleshooting
- Run `./verify-schema-fix.sh` for automated checks

---

## ✅ Final Sign-Off

**After completing ALL checklist items:**

**Database Administrator:**
- Name: ___________________
- Date: ___________________
- Signature: ___________________

**Developer:**
- Name: ___________________
- Date: ___________________
- Signature: ___________________

**QA:**
- Name: ___________________
- Date: ___________________
- Signature: ___________________

**Deployment Approved:** ☐ Yes  ☐ No

---

**Document Version:** 1.0  
**Last Updated:** January 9, 2026  
**Status:** Ready for implementation
