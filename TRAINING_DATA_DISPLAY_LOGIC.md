# Training Data Display Logic - Frontend

## Overview

This document explains how training sessions and data are fetched, filtered, and displayed on the frontend. Unlike game statistics (which we just standardized), training data currently has **inconsistent date filtering** across different parts of the app.

## Current Architecture

### 1. Backend API: `training-sessions.cjs`

**Endpoint**: `/.netlify/functions/training-sessions`

**GET Request Logic**:
```javascript
async function getTrainingSessions(userId, queryParams) {
  const { status, startDate, endDate, limit = 50 } = queryParams || {};
  
  let query = supabaseAdmin
    .from("training_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("session_date", { ascending: false })  // Most recent first
    .limit(parseInt(limit));

  // Optional filters
  if (status) query = query.eq("status", status);
  if (startDate) query = query.gte("session_date", startDate);
  if (endDate) query = query.lte("session_date", endDate);
  
  return sessions || [];
}
```

**Key Points**:
- ✅ Orders by `session_date` descending (newest first)
- ⚠️ **No automatic date filtering** - can return future sessions
- ⚠️ **No "up to today" filter** by default
- ✅ Supports optional `startDate` and `endDate` query parameters
- ✅ Supports `status` filter (e.g., "completed", "planned", "in_progress")
- ✅ Default limit of 50 sessions

### 2. Frontend: Vanilla JS (`training-page.js`)

**Data Loading Flow**:
```javascript
async function initializePageState() {
  // 1. Load from localStorage (not backend!)
  const recentWorkouts = storageService.getRecentWorkouts();
  
  // 2. Calculate stats from stored workouts
  const weeklyStats = statsService.calculateWeeklyStats(recentWorkouts, today);
  const overallStats = statsService.calculateOverallStats(recentWorkouts);
  const streak = statsService.computeStreak(recentWorkouts, today);
  
  // 3. Generate weekly schedule
  const weeklySchedule = scheduleService.generateWeekSchedule({
    today,
    scheduleSettings,
    recentWorkouts,
  });
}
```

**Key Points**:
- ⚠️ **Uses localStorage, not backend API** for initial load
- ✅ Calculates stats using `today` as reference date
- ✅ Generates schedule based on current date
- ⚠️ **No date filtering** - shows all workouts from localStorage
- ⚠️ **No synchronization** with backend by default

**Stats Calculation** (`statsService.calculateWeeklyStats`):
```javascript
// Filters workouts within the current week
const weekStart = getISOWeekStart(referenceDate);
const weekEnd = new Date(weekStart);
weekEnd.setDate(weekEnd.getDate() + 6);
weekEnd.setHours(23, 59, 59, 999);

const weekWorkouts = workouts.filter(w => {
  const workoutDate = new Date(w.date);
  return workoutDate >= weekStart && workoutDate <= weekEnd;
});
```

**Streak Calculation** (`statsService.computeStreak`):
```javascript
// Calculates current streak backwards from today
// Only counts workouts up to and including today
let currentStreak = 0;
let expectedDate = new Date(refNormalized); // Today

for (const workoutDate of workoutDates) {
  const dayDifference = (expectedDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24);
  
  if (dayDifference === 0) {
    currentStreak++;
    expectedDate.setDate(expectedDate.getDate() - 1);
  } else if (dayDifference === 1) {
    // Rest day (skip one day)
    expectedDate.setDate(expectedDate.getDate() - 2);
  } else {
    // Gap too large, streak broken
    break;
  }
}
```

### 3. Angular Service: `training-data.service.ts`

**Get All Sessions**:
```typescript
getTrainingSessions(): Observable<TrainingSession[]> {
  return from(
    this.supabase.client
      .from("training_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })  // Newest first
  );
}
```

**Key Points**:
- ⚠️ **No date filtering** - returns all sessions (including future)
- ✅ Orders by date descending
- ✅ Uses Supabase client directly (not Netlify function)
- ⚠️ **No "up to today" filter**

**Real-time Subscriptions**:
```typescript
subscribeToTrainingSessions(callback: (payload: any) => void) {
  // Subscribes to all changes for user's sessions
  // Includes future sessions
}
```

### 4. Dashboard Page: `dashboard-page.js`

**Date Picker Logic**:
```javascript
setupDatePicker() {
  // Initialize with today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  this.selectedDate = today;
  
  // Load data for selected date
  this.loadDateData();
}

loadDateData() {
  // Loads training sessions for selectedDate
  // Can be today, past, or future date
}
```

**Key Points**:
- ✅ Defaults to today's date
- ✅ Allows navigation to past/future dates
- ⚠️ **Shows future sessions** if date is in the future
- ✅ Updates when date changes

## Data Flow Summary

### Current Flow (Vanilla JS Pages):
```
1. Page Load
   ↓
2. Load from localStorage (recentWorkouts)
   ↓
3. Calculate stats using today as reference
   ↓
4. Display on page
```

### Current Flow (Angular Pages):
```
1. Component Init
   ↓
2. Call training-data.service.getTrainingSessions()
   ↓
3. Query Supabase directly (no date filter)
   ↓
4. Display all sessions (including future)
```

### Current Flow (Backend API):
```
1. Frontend calls /training-sessions
   ↓
2. Backend queries training_sessions table
   ↓
3. Returns sessions (no automatic date filter)
   ↓
4. Frontend receives all sessions
```

## Issues & Inconsistencies

### ❌ Problem 1: No Consistent Date Filtering
- Backend doesn't filter to "up to and including today" by default
- Frontend services don't filter future sessions
- Different pages handle dates differently

### ❌ Problem 2: localStorage vs Backend Mismatch
- Vanilla JS pages use localStorage
- Angular pages use backend API
- Data can be out of sync

### ❌ Problem 3: Future Sessions Shown
- Users can see planned/future training sessions
- Stats calculations may include future data
- Inconsistent with game stats (which filter to today)

### ❌ Problem 4: No Single Source of Truth
- Multiple data sources (localStorage, Supabase, Netlify functions)
- No centralized filtering logic
- Stats calculated differently in different places

## Comparison with Game Stats (After Our Fix)

| Feature | Game Stats (Fixed) | Training Data (Current) |
|---------|-------------------|------------------------|
| Date Filtering | ✅ Always filters to "up to and including today" | ❌ No automatic filtering |
| Future Data | ✅ Never shows future games | ⚠️ Shows future sessions |
| Backend Filtering | ✅ Automatic in backend | ❌ Optional query params only |
| Frontend Filtering | ✅ Uses centralized endpoint | ❌ Different logic per page |
| Single Source | ✅ Centralized `player-stats.cjs` | ❌ Multiple sources |
| Consistency | ✅ Same numbers everywhere | ⚠️ Can differ by page |

## Recommended Fixes

### 1. Update Backend to Filter by Default

**File**: `netlify/functions/training-sessions.cjs`

```javascript
async function getTrainingSessions(userId, queryParams) {
  const { status, startDate, endDate, limit = 50, includeFuture = false } = queryParams || {};
  
  let query = supabaseAdmin
    .from("training_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("session_date", { ascending: false })
    .limit(parseInt(limit));

  // By default, only show sessions up to and including today
  if (!includeFuture) {
    const todayEndOfDay = new Date();
    todayEndOfDay.setHours(23, 59, 59, 999);
    query = query.lte("session_date", todayEndOfDay.toISOString());
  }

  if (status) query = query.eq("status", status);
  if (startDate) query = query.gte("session_date", startDate);
  if (endDate) query = query.lte("session_date", endDate);
  
  return sessions || [];
}
```

### 2. Update Angular Service

**File**: `angular/src/app/core/services/training-data.service.ts`

```typescript
getTrainingSessions(includeFuture = false): Observable<TrainingSession[]> {
  let query = this.supabase.client
    .from("training_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  // Filter to today by default
  if (!includeFuture) {
    const todayEndOfDay = new Date();
    todayEndOfDay.setHours(23, 59, 59, 999);
    query = query.lte("date", todayEndOfDay.toISOString());
  }

  return from(query);
}
```

### 3. Create Centralized Training Stats Function

Similar to `player-stats.cjs`, create `training-stats.cjs`:
- Aggregates training stats up to and including today
- Consistent calculation formulas
- Single source of truth

## Current Behavior Examples

### Example 1: User Opens App on Dec 14, 2025

**Game Stats** (After our fix):
- ✅ Shows all games up to Dec 14, 2025
- ✅ Future games excluded
- ✅ Stats consistent across all pages

**Training Data** (Current):
- ⚠️ Shows all training sessions (including future)
- ⚠️ May include sessions scheduled for Dec 15+
- ⚠️ Stats may include future data

### Example 2: User Views Training Page

**What They See**:
- Recent workouts from localStorage
- Weekly stats calculated from stored workouts
- Weekly schedule generated from current date
- **No filtering to "today"**

**What Should Happen** (After fix):
- Only sessions up to and including today
- Stats calculated from sessions up to today
- Future sessions only shown if explicitly requested

## Conclusion

Training data display logic is **less consistent** than game stats. The main issues are:

1. **No automatic date filtering** - future sessions are shown by default
2. **Multiple data sources** - localStorage vs backend vs Supabase
3. **Inconsistent filtering** - different logic in different places
4. **No centralized stats** - calculations done in multiple places

**Recommendation**: Apply the same date filtering pattern we used for game stats to training data for consistency.
