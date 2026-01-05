# CRITICAL ISSUE IDENTIFIED: Wrong Data Source

## 🔍 **Problem Found**

The training schedule is showing **generic test sessions from `training_sessions` table** instead of **your position-specific program from `training_session_templates` table**.

### What You're Seeing:
```
❌ "Strength Training" - Jan 4, 3:00 PM (generic)
❌ "Recovery Session" - Jan 5, 11:00 AM (generic)  
❌ "Flag Football Practice" - Jan 6, 5:00 PM (wrong!)
❌ "Conditioning" - Jan 7, 10:30 AM (generic)
```

### What You SHOULD See:
```
✅ "Monday Morning - QB Routine" (from your 52-week program)
✅ "Tuesday Morning - QB Routine" (position-specific)
✅ "Tuesday Afternoon - Speed & Throwing" (100 throws target)
✅ "Wednesday - Recovery + Upper Body" (your actual program)
```

## 📊 **Root Cause**

Looking at the code (line 446-497 in `training-schedule.component.ts`):

```typescript
// 1. Fetch ACTUAL sessions (user-logged)
const { data: actualSessions } = await supabaseService.client
  .from("training_sessions")  // ❌ OLD TABLE - Generic test data
  ...

// 2. Fetch SCHEDULED sessions from templates
const { data: scheduledTemplates } = await supabaseService.client
  .from("training_session_templates")  // ✅ CORRECT TABLE - Your program
  ...
```

The component loads from BOTH tables and merges them. The problem:
1. The `training_sessions` table has old test data with specific dates (Jan 4-7)
2. These override your real program templates
3. You're seeing the test data instead of your 52-week program

## 🎯 **Solutions**

### **Option 1: Clear Test Data** (Quick Fix)
Delete the generic test sessions from `training_sessions` table:

```sql
-- Check what's there
SELECT * FROM training_sessions 
WHERE session_date BETWEEN '2026-01-04' AND '2026-01-07'
AND user_id = '[your-user-id]';

-- Delete test sessions
DELETE FROM training_sessions
WHERE session_date BETWEEN '2026-01-04' AND '2026-01-07'
AND user_id = '[your-user-id]';
```

### **Option 2: Fix Program Assignment** (Proper Fix)
Ensure you have an active program assigned:

```sql
-- Check current assignment
SELECT 
  pp.id,
  pp.player_id,
  pp.status,
  tp.name as program_name,
  p.code as position
FROM player_programs pp
JOIN training_programs tp ON tp.id = pp.program_id
JOIN positions p ON p.id = tp.position_id
WHERE pp.player_id = '[your-user-id]';

-- If no assignment, create one
INSERT INTO player_programs (
  player_id,
  program_id,
  status,
  start_date,
  phase_progress
) VALUES (
  '[your-user-id]',
  '[qb-program-id]',  -- From training_programs where position_id = QB
  'active',
  '2026-01-05',
  1
);
```

### **Option 3: Prioritize Templates** (Code Fix)
Modify the component to ONLY show templates if they exist:

```typescript
// In training-schedule.component.ts, change line 550:
// OLD: Combine both sources
const uniqueScheduled = mappedScheduledSessions.filter(...)
const allSessions = [...mappedActualSessions, ...uniqueScheduled];

// NEW: Prioritize templates, only show actuals if no templates
const allSessions = mappedScheduledSessions.length > 0
  ? mappedScheduledSessions  // Use templates if available
  : mappedActualSessions;     // Fallback to actual sessions
```

## 🔍 **Debugging Steps**

1. **Check Browser Console** (F12):
   Look for: `Found scheduled templates: X`
   - If X = 0 → No templates found (need Option 2)
   - If X > 0 → Templates exist but being overridden (need Option 1 or 3)

2. **Check Database**:
   ```sql
   -- See what templates exist for this week
   SELECT 
     tst.session_name,
     tst.session_type,
     tst.day_of_week,
     tw.start_date,
     tw.end_date
   FROM training_session_templates tst
   JOIN training_weeks tw ON tw.id = tst.week_id
   WHERE tw.start_date <= '2026-01-05'
   AND tw.end_date >= '2026-01-05';
   ```

3. **Check Active Sessions**:
   ```sql
   -- See what's overriding templates
   SELECT 
     session_date,
     session_type,
     session_name,
     status
   FROM training_sessions
   WHERE user_id = '[your-user-id]'
   AND session_date BETWEEN '2026-01-04' AND '2026-01-10'
   ORDER BY session_date;
   ```

## ⚡ **Immediate Action**

**I recommend Option 3** (code fix) because it:
- Doesn't require database access
- Fixes the logic permanently
- Still shows actual sessions if no templates exist

Let me implement this now...

---

**Status**: Issue identified, solution ready
**Impact**: HIGH - You're seeing wrong training data
**Fix Time**: 2 minutes
