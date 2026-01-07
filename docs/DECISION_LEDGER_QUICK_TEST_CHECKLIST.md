# Decision Ledger - Quick Test Checklist

**Date:** 2026-01-08  
**Status:** Ready for Testing

---

## 🚀 Quick Start Testing

### Prerequisites
- ✅ Database migration applied (`064_decision_ledger.sql`)
- ✅ Netlify functions deployed or running locally
- ✅ Angular app running (`npm start` in `angular/` directory)
- ✅ Logged in as staff member (coach, physiotherapist, nutritionist, etc.)

### Access the Dashboard
Navigate to: **`http://localhost:4200/staff/decisions`**

---

## ✅ Essential Tests (5 minutes)

### Test 1: Dashboard Loads
- [ ] Navigate to `/staff/decisions`
- [ ] Dashboard displays without errors
- [ ] Stats cards show (may be 0s)
- [ ] Filters section visible
- [ ] No console errors

**Expected:** Clean dashboard load

---

### Test 2: Create a Decision
- [ ] Click "New Decision" button
- [ ] Step 1: Select an athlete
- [ ] Step 2: Select decision type (e.g., "Load Adjustment")
- [ ] Step 3: Enter summary (e.g., "Reduced sprint volume by 50%")
- [ ] Step 4: Select at least 2 data points (ACWR, Readiness)
- [ ] Step 5: Add constraint (optional)
- [ ] Step 6: Select review trigger (e.g., "In 72 hours")
- [ ] Step 7: Review - verify confidence score displays
- [ ] Click "Create Decision"

**Expected:** 
- Wizard completes all steps
- Decision appears in dashboard
- Confidence score shows (≥0.7 if data points selected)

---

### Test 3: View Decision Detail
- [ ] Click on a decision card
- [ ] Detail view opens
- [ ] All sections display:
  - [ ] Decision Overview
  - [ ] Decision Maker info
  - [ ] Confidence indicator
  - [ ] Review Information
  - [ ] Decision Basis (expandable)
- [ ] "Review Now" button visible if due for review

**Expected:** Complete decision information displayed

---

### Test 4: Review a Decision
- [ ] Open a decision that's due for review
- [ ] Click "Review Now"
- [ ] Select outcome (e.g., "Maintain Decision")
- [ ] Add review notes
- [ ] Fill outcome tracking:
  - [ ] Goal achieved checkbox
  - [ ] Lessons learned (optional)
- [ ] Click "Submit Review"

**Expected:**
- Review submits successfully
- Decision status updates to "reviewed"
- Dashboard refreshes

---

### Test 5: Filters Work
- [ ] Create 2-3 decisions with different:
  - Statuses (active, reviewed)
  - Categories (load, medical)
  - Priorities (high, normal)
- [ ] Test each filter dropdown
- [ ] Verify results update
- [ ] Test "Clear Filters" button

**Expected:** Filters filter decisions correctly

---

## 🔍 Advanced Tests (Optional)

### Test 6: Confidence Score Calculation
- [ ] Create decision with ALL data points → Should show high confidence (≥0.9)
- [ ] Create decision with FEW data points → Should show lower confidence (<0.7)
- [ ] Verify warning displays for low confidence

**Expected:** Confidence reflects data completeness

---

### Test 7: Review Triggers
- [ ] Create decisions with different triggers:
  - `in_24h` → Review date = now + 24h
  - `in_72h` → Review date = now + 72h
  - `in_7d` → Review date = now + 7 days
- [ ] Verify review dates calculate correctly
- [ ] Check "Due for Review" section shows due decisions

**Expected:** Review dates match trigger types

---

### Test 8: API Endpoints (via Browser Console)

Open browser console and test:

```javascript
// Get decisions
fetch('/api/decisions', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}` }
})
  .then(r => r.json())
  .then(console.log);

// Get stats
fetch('/api/decisions/stats', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}` }
})
  .then(r => r.json())
  .then(console.log);
```

**Expected:** API returns data without errors

---

## 🐛 Common Issues

| Issue | Quick Fix |
|-------|-----------|
| Dashboard shows "No decisions found" | Create a test decision |
| Confidence always 0.8 | Select data points in Step 4 |
| Can't create decision | Verify you're logged in as staff |
| Review button not showing | Check decision review_date is in past |
| API errors | Check browser console for details |

---

## 📊 Database Verification (Optional)

If you have database access, verify:

```sql
-- Check decisions exist
SELECT id, decision_summary, status, review_date 
FROM decision_ledger 
ORDER BY created_at DESC 
LIMIT 5;

-- Check reminders created
SELECT decision_id, reminder_type, scheduled_for, status
FROM decision_review_reminders
ORDER BY created_at DESC
LIMIT 5;
```

---

## ✅ Success Criteria

**Minimum for "Ready":**
- [x] Dashboard loads
- [x] Can create decision
- [x] Can view decision detail
- [x] Can review decision
- [x] Filters work

**Full Success:**
- [x] All above + confidence scoring works
- [x] Review triggers work
- [x] Reminders created
- [x] API endpoints work
- [x] No console errors

---

## 🎯 Test Results

**Date:** __________  
**Tester:** __________

| Test | Status | Notes |
|------|--------|-------|
| Dashboard Loads | ⬜ | |
| Create Decision | ⬜ | |
| View Detail | ⬜ | |
| Review Decision | ⬜ | |
| Filters | ⬜ | |
| Confidence Score | ⬜ | |
| Review Triggers | ⬜ | |
| API Endpoints | ⬜ | |

**Overall:** ⬜ Ready / ⬜ Issues Found / ⬜ Not Ready

**Issues Found:**
1. 
2. 
3. 

---

**End of Quick Test Checklist**

