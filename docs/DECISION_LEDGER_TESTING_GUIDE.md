# Decision Ledger Testing Guide

**Date:** 2026-01-08  
**Status:** Ready for Testing  
**Migration Status:** ✅ Applied Successfully

---

## ✅ Pre-Testing Checklist

### Database Migration ✅
- [x] Migration `064_decision_ledger.sql` applied successfully
- [x] Tables created: `decision_ledger`, `decision_review_reminders`
- [x] Functions created: `calculate_review_date`, `calculate_review_priority`, `create_review_reminders`
- [x] Triggers created: `trigger_decision_ledger_create_reminders`, `trigger_update_decision_ledger_updated_at`
- [x] RLS policies enabled

### API Endpoints ✅
- [x] `GET /api/decisions` - List decisions
- [x] `GET /api/decisions/stats` - Get statistics
- [x] `GET /api/decisions/reminders` - Get reminders
- [x] `GET /api/decisions/:id` - Get single decision
- [x] `POST /api/decisions` - Create decision
- [x] `POST /api/decisions/:id/review` - Review decision

### UI Components ✅
- [x] Decision Ledger Dashboard
- [x] Decision Card Component
- [x] Decision Detail View
- [x] Create Decision Dialog
- [x] Review Decision Dialog
- [x] Confidence Indicator Component

---

## 🧪 Testing Scenarios

### 1. Dashboard Loading Test

**Steps:**
1. Navigate to `/staff/decisions`
2. Verify dashboard loads without errors
3. Check stats cards display (may show 0s if no data)
4. Verify filters are visible
5. Check empty state if no decisions exist

**Expected Results:**
- Dashboard loads successfully
- Stats cards show correct counts (0 if no data)
- Filters are functional
- No console errors

---

### 2. Create Decision Test

**Steps:**
1. Click "New Decision" button
2. Complete Step 1: Select an athlete
3. Complete Step 2: Select decision type (e.g., "Load Adjustment")
4. Complete Step 3: Enter summary (e.g., "Reduced sprint volume by 50%")
5. Complete Step 4: Select data points (check ACWR, Readiness, Sleep)
6. Complete Step 5: Add constraints (e.g., "No sprinting >80%")
7. Complete Step 6: Select review trigger (e.g., "In 72 hours")
8. Complete Step 7: Review and confirm
9. Verify confidence score displays
10. Click "Create Decision"

**Expected Results:**
- Wizard progresses through all 7 steps
- Form validation works
- Confidence score calculates correctly
- Decision is created successfully
- Dashboard refreshes with new decision
- Review reminders are created automatically

**Verify in Database:**
```sql
SELECT * FROM decision_ledger ORDER BY created_at DESC LIMIT 1;
SELECT * FROM decision_review_reminders WHERE decision_id = '<decision_id>';
```

---

### 3. View Decision Detail Test

**Steps:**
1. Click on a decision card
2. Navigate to detail view
3. Verify all sections display:
   - Decision Overview
   - Decision Maker
   - Confidence
   - Review Information
   - Decision Basis (expandable)
   - Outcome Tracking (if reviewed)

**Expected Results:**
- All decision information displays correctly
- Accordion sections expand/collapse
- Related decisions show if available
- Review button appears if decision is due for review

---

### 4. Review Decision Test

**Steps:**
1. Navigate to a decision that's due for review
2. Click "Review Now" button
3. Select review outcome (e.g., "Maintain Decision")
4. Add review notes
5. Fill outcome tracking:
   - Check "Goal was achieved"
   - Add unintended consequences (if any)
   - Add lessons learned
6. Click "Submit Review"

**Expected Results:**
- Review dialog opens
- All fields are editable
- Review is submitted successfully
- Decision status updates to "reviewed"
- Outcome data is saved
- Dashboard refreshes

**Verify in Database:**
```sql
SELECT 
    id,
    status,
    review_outcome,
    reviewed_at,
    outcome_data
FROM decision_ledger
WHERE id = '<decision_id>';
```

---

### 5. Filter Test

**Steps:**
1. Create multiple decisions with different:
   - Statuses (active, reviewed)
   - Categories (medical, load, nutrition)
   - Priorities (critical, high, normal)
2. Test each filter dropdown
3. Verify filtered results

**Expected Results:**
- Filters work correctly
- Results update when filters change
- Multiple filters can be combined
- Clear filters button resets all filters

---

### 6. Confidence Score Test

**Steps:**
1. Create a decision with all required data points
2. Verify confidence score is high (≥0.9)
3. Create a decision with missing required data points
4. Verify confidence score is low (<0.7)
5. Verify warning displays for low confidence

**Expected Results:**
- Confidence score calculates correctly
- Missing data warnings display
- Low confidence decisions are flagged
- Confidence indicator shows correct color

---

### 7. Review Trigger Test

**Steps:**
1. Create decisions with different review triggers:
   - `in_24h` - Should review in 24 hours
   - `in_72h` - Should review in 72 hours
   - `in_7d` - Should review in 7 days
   - `after_next_session` - Should review after next session
2. Verify review dates calculate correctly
3. Check reminders are created

**Expected Results:**
- Review dates calculate correctly for each trigger type
- Reminders are created automatically
- Review priority is set correctly based on trigger

---

### 8. Review Reminders Test

**Steps:**
1. Create a decision with review trigger `in_24h`
2. Wait or manually set review_date to past date
3. Navigate to `/staff/decisions`
4. Check "Due for Review" section
5. Verify reminders API returns due decisions

**Expected Results:**
- Due decisions appear in "Due for Review" section
- Overdue decisions are flagged
- Reminders API returns correct data
- Review buttons are enabled for due decisions

---

### 9. API Endpoint Test

**Test Each Endpoint:**

#### GET /api/decisions
```bash
curl -X GET "http://localhost:4000/api/decisions" \
  -H "Authorization: Bearer <token>"
```

**Expected:** Returns list of decisions

#### GET /api/decisions/stats
```bash
curl -X GET "http://localhost:4000/api/decisions/stats" \
  -H "Authorization: Bearer <token>"
```

**Expected:** Returns statistics object

#### GET /api/decisions/reminders
```bash
curl -X GET "http://localhost:4000/api/decisions/reminders" \
  -H "Authorization: Bearer <token>"
```

**Expected:** Returns list of due reminders

#### GET /api/decisions/:id
```bash
curl -X GET "http://localhost:4000/api/decisions/<decision_id>" \
  -H "Authorization: Bearer <token>"
```

**Expected:** Returns single decision with related decisions

#### POST /api/decisions
```bash
curl -X POST "http://localhost:4000/api/decisions" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "athleteId": "<athlete_id>",
    "decisionType": "load_adjustment",
    "decisionSummary": "Test decision",
    "decisionCategory": "load",
    "decisionBasis": {
      "dataPoints": ["ACWR: 1.45"],
      "constraints": [],
      "rationale": "Test",
      "confidence": 0.8,
      "dataQuality": {"completeness": 1.0, "staleDays": 0}
    },
    "reviewTrigger": "in_7d"
  }'
```

**Expected:** Creates decision and returns it

#### POST /api/decisions/:id/review
```bash
curl -X POST "http://localhost:4000/api/decisions/<decision_id>/review" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "reviewOutcome": "maintained",
    "reviewNotes": "Decision is working well",
    "outcomeData": {
      "goalAchieved": true,
      "unintendedConsequences": [],
      "lessonsLearned": "Test"
    }
  }'
```

**Expected:** Reviews decision and returns updated decision

---

### 10. Edge Cases Test

#### Test Cases:
1. **Empty State:** Dashboard with no decisions
2. **Low Confidence:** Decision with missing required data
3. **Overdue Review:** Decision past review date
4. **Superseded Decision:** Decision that supersedes another
5. **Related Decisions:** Decision with superseded/superseding decisions
6. **Invalid Data:** Try to create decision with missing required fields
7. **Unauthorized Access:** Try to access decisions from different team
8. **Review Extension:** Extend a decision's review date

**Expected Results:**
- Empty states display correctly
- Low confidence warnings appear
- Overdue flags display
- Supersession chains work
- Validation prevents invalid data
- RLS policies prevent unauthorized access
- Review extension updates review date

---

## 🐛 Common Issues & Solutions

### Issue: Dashboard shows "No decisions found"
**Solution:** Create a test decision via API or UI

### Issue: Confidence score always shows 0.8
**Solution:** Check that data points are being selected in Step 4

### Issue: Review reminders not appearing
**Solution:** Verify triggers are created correctly:
```sql
SELECT * FROM decision_review_reminders WHERE decision_id = '<decision_id>';
```

### Issue: RLS policy blocking access
**Solution:** Verify user is staff member on the team:
```sql
SELECT * FROM team_members WHERE user_id = '<user_id>' AND team_id = '<team_id>';
```

### Issue: Review date not calculating correctly
**Solution:** Check `calculate_review_date` function:
```sql
SELECT calculate_review_date('in_72h', NOW(), NULL, NULL);
```

---

## 📊 Test Data Creation

### Create Test Decisions via SQL

```sql
-- Create a test decision
INSERT INTO decision_ledger (
    athlete_id,
    team_id,
    decision_type,
    decision_summary,
    decision_category,
    made_by,
    made_by_role,
    made_by_name,
    decision_basis,
    review_trigger,
    review_date,
    review_priority,
    status
) VALUES (
    '<athlete_id>',
    '<team_id>',
    'load_adjustment',
    'Test: Reduced sprint volume by 50%',
    'load',
    '<user_id>',
    'head_coach',
    'Test Coach',
    '{"data_points": ["ACWR: 1.45", "Readiness: 62"], "constraints": ["No sprinting >80%"], "rationale": "Test decision", "confidence": 0.85, "data_quality": {"completeness": 0.92, "stale_days": 0}}'::jsonb,
    'in_72h',
    NOW() + INTERVAL '72 hours',
    'high',
    'active'
);
```

---

## ✅ Success Criteria

### Functional Requirements
- [ ] Can create decisions via UI
- [ ] Can view decision details
- [ ] Can review decisions
- [ ] Filters work correctly
- [ ] Confidence scores calculate correctly
- [ ] Review reminders are created
- [ ] Review dates calculate correctly
- [ ] Outcome tracking works

### Performance Requirements
- [ ] Dashboard loads in <2 seconds
- [ ] API endpoints respond in <500ms
- [ ] No memory leaks
- [ ] Smooth animations

### Security Requirements
- [ ] RLS policies enforce access control
- [ ] Only staff can create decisions
- [ ] Only team members can view decisions
- [ ] Unauthorized access is blocked

---

## 📝 Test Results Template

```
Test Date: __________
Tester: __________

Test Case | Status | Notes
----------|--------|------
Dashboard Loading | ✅/❌ | 
Create Decision | ✅/❌ | 
View Detail | ✅/❌ | 
Review Decision | ✅/❌ | 
Filters | ✅/❌ | 
Confidence Score | ✅/❌ | 
Review Triggers | ✅/❌ | 
Review Reminders | ✅/❌ | 
API Endpoints | ✅/❌ | 
Edge Cases | ✅/❌ | 

Issues Found:
1. 
2. 
3. 

Overall Status: ✅ Ready / ⚠️ Issues Found / ❌ Not Ready
```

---

## 🚀 Quick Test Script

Run this to quickly test the system:

```bash
# 1. Start Angular dev server
cd angular && npm start

# 2. In another terminal, test API endpoints
curl -X GET "http://localhost:4000/api/decisions/stats" \
  -H "Authorization: Bearer <token>"

# 3. Navigate to http://localhost:4200/staff/decisions
# 4. Create a test decision
# 5. Review the decision
# 6. Verify all features work
```

---

**End of Testing Guide**

