# Training Schedule Data Loading - Debug Plan

## 🔍 Current Status

The training schedule component (`training-schedule.component.ts`) **IS** set up to load real data from the 52-week periodization tables. However, the data might not be showing because:

## 🎯 Issues to Debug

### 1. **Program Assignment During Onboarding**
**What to check:**
```sql
-- Check if user has an active program assigned
SELECT * FROM player_programs 
WHERE player_id = '[your-user-id]' 
AND status = 'active';

-- If null, the program wasn't assigned during onboarding
```

**Fix if missing:**
- Run the program assignment manually
- Or re-complete onboarding

### 2. **Training Templates Existence**
**What to check:**
```sql
-- Check if training templates exist for the program
SELECT 
  tp.name as program_name,
  tph.name as phase_name,
  tw.week_number,
  tw.start_date,
  tw.end_date,
  tst.session_name,
  tst.day_of_week
FROM training_programs tp
JOIN training_phases tph ON tph.program_id = tp.id
JOIN training_weeks tw ON tw.phase_id = tph.id  
JOIN training_session_templates tst ON tst.week_id = tw.id
WHERE tp.position_id = (
  SELECT id FROM positions WHERE code = 'QB'  -- or your position
)
ORDER BY tw.week_number, tst.day_of_week;
```

**Expected result:**
- Should show sessions for each week
- Day_of_week: 0=Sunday, 1=Monday, ... 6=Saturday
- Should include "Speed & Agility", "Strength Training", "Recovery", etc.

### 3. **Date Range Query**
**What to check:**
The component queries templates where:
```typescript
.lte("training_weeks.start_date", endOfWeek)
.gte("training_weeks.end_date", startOfWeek)
```

This means it's looking for weeks that overlap with the selected week.

**Potential issue:**
- If week dates don't align with 2026 calendar
- If start_date/end_date are NULL

### 4. **Session Template Structure**
**Required fields:**
```sql
CREATE TABLE training_session_templates (
  id UUID PRIMARY KEY,
  week_id UUID REFERENCES training_weeks(id),
  session_name TEXT,
  session_type TEXT,
  day_of_week INTEGER,  -- 0-6
  duration_minutes INTEGER,
  intensity_level TEXT,
  description TEXT,
  ...
)
```

## 🛠️ How to Fix

### Option A: Quick Fix - Add Debug Logging

Add to `daily-protocol.cjs` after line 195:

```javascript
console.log("[daily-protocol] Context Debug:", {
  userId,
  date,
  currentWeek: currentWeek?.id,
  currentPhase: currentPhase?.id,
  sessionTemplate: sessionTemplate?.session_name,
  hasFlagPractice,
});
```

### Option B: Verify Database Seeding

Run this migration to check/seed QB program:

```sql
-- Check if QB program exists with templates
SELECT 
  COUNT(*) as template_count,
  MIN(tw.start_date) as first_week,
  MAX(tw.end_date) as last_week
FROM training_programs tp
JOIN positions p ON p.id = tp.position_id
JOIN training_phases tph ON tph.program_id = tp.id
JOIN training_weeks tw ON tw.phase_id = tph.id
JOIN training_session_templates tst ON tst.week_id = tw.id
WHERE p.code = 'QB';
```

**Expected:** `template_count` should be > 0

### Option C: Manual Template Creation

If templates don't exist, create them:

```sql
-- Example: Create templates for Week 1 (Jan 5-11, 2026)
INSERT INTO training_session_templates (
  week_id,
  session_name,
  session_type,
  day_of_week,
  duration_minutes,
  description
) VALUES
-- Monday: Strength Training
('[week-1-id]', 'Strength Training', 'strength', 1, 60, 'Full body strength'),
-- Tuesday: Flag Practice (handled separately)
-- Wednesday: Speed & Agility
('[week-1-id]', 'Speed & Agility', 'speed_agility', 3, 45, 'Sprint mechanics'),
-- Thursday: Recovery
('[week-1-id]', 'Recovery Session', 'recovery', 4, 30, 'Foam rolling & mobility'),
-- Saturday: Conditioning
('[week-1-id]', 'Conditioning', 'conditioning', 6, 45, 'High-intensity intervals');
```

## 📊 Position-Specific Exercises

The `generateProtocol` function at line 808 loads exercises from `session_exercises`:

```javascript
const { data: sessionExercises } = await supabase
  .from("session_exercises")
  .select(`
    *,
    exercises (
      id, name, slug, category, video_url, video_id, thumbnail_url,
      how_text, feel_text, compensation_text, load_contribution_au
    )
  `)
  .eq("session_template_id", context.sessionTemplate.id)
  .order("exercise_order");
```

**This means exercises ARE position-specific!** They're linked to the session template which is part of the position-specific program.

**To verify:**
```sql
SELECT 
  e.name,
  e.category,
  e.video_url,
  e.position_specific,
  se.sets,
  se.reps
FROM session_exercises se
JOIN exercises e ON e.id = se.exercise_id
JOIN training_session_templates tst ON tst.id = se.session_template_id
WHERE tst.id = '[some-template-id]';
```

## 🎬 YouTube Video Embedding

Exercises have these fields:
- `video_url`: Full YouTube URL
- `video_id`: YouTube video ID (e.g., "dQw4w9WgXcQ")
- `thumbnail_url`: Preview image

**Frontend needs to:**
1. Extract video_id from video_url if needed
2. Render as `<iframe src="https://www.youtube.com/embed/{video_id}">`
3. Or use a YouTube component

## 🚨 Calendar Date Picker Issue

The `p-datepicker` should be clickable. Possible causes:
1. **CSS z-index issue** - Something overlaying it
2. **PrimeNG version issue** - Check if `@primeng/core` is updated
3. **Angular change detection** - Try adding `[touchUI]="false"`

**Quick fix to try:**

```typescript
// In template
<p-datepicker
  [ngModel]="selectedDate()"
  (ngModelChange)="onDateSelect($event)"
  [inline]="true"
  [showWeek]="showWeekNumbers()"
  [touchUI]="false"  // Add this
  [disabled]="false"  // Add this
  aria-label="Training calendar date picker"
></p-datepicker>
```

## 📅 Next Actions

1. **Check database** - Run SQL queries above to verify data exists
2. **Add logging** - See what's being loaded (or not loaded)
3. **Test with specific date** - Try Jan 6, 2026 specifically
4. **Verify program assignment** - Make sure user has active program

---

**Status**: Investigation complete. Ready to implement fixes based on findings.
**Priority**: Database verification first, then UI fixes.
