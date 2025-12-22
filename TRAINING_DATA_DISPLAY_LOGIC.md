# Training Data Display Logic - Frontend

## Overview

This document explains how training sessions and data are fetched, filtered, and displayed on the frontend. Training data now follows the same consistent date filtering pattern as game statistics, ensuring data accuracy and consistency across the application.

## Current Architecture

### 1. Backend API: `training-sessions.cjs`

**Endpoint**: `/.netlify/functions/training-sessions`

**GET Request Logic**:
```javascript
async function getTrainingSessions(userId, queryParams) {
  const { status, startDate, endDate, limit = 50, includeUpcoming = false } = queryParams || {};
  
  let query = supabaseAdmin
    .from("training_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("session_date", { ascending: false })  // Most recent first
    .limit(parseInt(limit));

  // By default, only show sessions up to and including today
  // This ensures training statistics only reflect real, completed data
  if (!includeUpcoming) {
    const today = new Date().toISOString().split("T")[0];
    query = query.lte("session_date", today);
  }

  // Optional filters
  if (status) query = query.eq("status", status);
  if (startDate) query = query.gte("session_date", startDate);
  if (endDate) {
    const endDateInclusive = new Date(endDate);
    endDateInclusive.setHours(23, 59, 59, 999);
    query = query.lte("session_date", endDateInclusive.toISOString().split("T")[0]);
  }
  
  return sessions || [];
}
```

**Key Points**:
- ✅ Orders by `session_date` descending (newest first)
- ✅ **Automatic date filtering** - filters to "up to and including today" by default
- ✅ **Consistent with game stats** - same date filtering pattern
- ✅ Supports optional `includeUpcoming` parameter to show future sessions
- ✅ Supports optional `startDate` and `endDate` query parameters
- ✅ Supports `status` filter (e.g., "completed", "planned", "in_progress")
- ✅ Default limit of 50 sessions

### 2. Frontend: Vanilla JS (`training-api-service.js`)

**Data Loading Flow**:
```javascript
async getTrainingSessions(options = {}) {
  // Uses backend API with automatic date filtering
  // By default, filters to sessions up to and including today
  const params = new URLSearchParams();
  
  if (options.startDate) {
    params.append("startDate", options.startDate);
  }
  
  if (options.endDate) {
    params.append("endDate", options.endDate);
  }
  
  if (options.includeUpcoming) {
    params.append("includeUpcoming", "true");
  }
  
  // Backend automatically filters to today unless includeUpcoming is true
  const response = await fetch(`${API_ENDPOINTS.training.sessions}?${params}`);
  return await response.json();
}
```

**Key Points**:
- ✅ **Uses backend API** - single source of truth
- ✅ **Automatic date filtering** - backend filters to today by default
- ✅ **Consistent with game stats** - same pattern
- ✅ Supports `includeUpcoming` option for future sessions
- ✅ Supports date range queries

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
getTrainingSessions(options?: TrainingSessionsOptions): Observable<TrainingSession[]> {
  const params: Record<string, any> = {};
  
  if (options?.startDate) {
    params.startDate = options.startDate;
  }
  
  if (options?.endDate) {
    params.endDate = options.endDate;
  }
  
  if (options?.includeUpcoming) {
    params.includeUpcoming = options.includeUpcoming.toString();
  }
  
  // Uses backend API which automatically filters to today by default
  return this.apiService.get<TrainingSession[]>(
    API_ENDPOINTS.training.sessions,
    params
  );
}
```

**Key Points**:
- ✅ **Uses backend API** - consistent date filtering
- ✅ **Automatic date filtering** - backend filters to today by default
- ✅ Orders by date descending
- ✅ Supports `includeUpcoming` option for future sessions
- ✅ Consistent with game stats pattern

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

## Current Status

### ✅ Resolved: Consistent Date Filtering
- Backend filters to "up to and including today" by default
- Frontend services use backend API with automatic filtering
- Consistent date handling across all pages

### ✅ Resolved: Single Source of Truth
- All services use backend API (`/.netlify/functions/training-sessions`)
- Centralized filtering logic in backend
- Consistent stats calculations

### ✅ Resolved: Future Sessions Handling
- Future sessions excluded by default
- Optional `includeUpcoming` parameter for planned sessions
- Consistent with game stats filtering pattern

### ✅ Resolved: Data Consistency
- Single backend endpoint for all training session queries
- Consistent date filtering across Angular and vanilla JS
- Stats calculated from same data source

## Comparison with Game Stats

| Feature | Game Stats | Training Data |
|---------|-----------|---------------|
| Date Filtering | ✅ Always filters to "up to and including today" | ✅ Always filters to "up to and including today" |
| Future Data | ✅ Never shows future games | ✅ Never shows future sessions (by default) |
| Backend Filtering | ✅ Automatic in backend | ✅ Automatic in backend |
| Frontend Filtering | ✅ Uses centralized endpoint | ✅ Uses centralized endpoint |
| Single Source | ✅ Centralized `player-stats.cjs` | ✅ Centralized `training-sessions.cjs` |
| Consistency | ✅ Same numbers everywhere | ✅ Same numbers everywhere |

## Implementation Details

### 1. Backend Date Filtering

**File**: `netlify/functions/training-sessions.cjs`

The backend automatically filters sessions to "up to and including today" by default:
- Uses `includeUpcoming` parameter to optionally include future sessions
- Filters at database level for performance
- Consistent with game stats filtering pattern

### 2. Frontend Services

**Angular**: `angular/src/app/core/services/training-data.service.ts`
- Uses backend API endpoint
- Automatically inherits date filtering from backend
- Supports optional `includeUpcoming` parameter

**Vanilla JS**: `src/js/services/training-api-service.js`
- Uses backend API endpoint
- Automatically inherits date filtering from backend
- Supports optional `includeUpcoming` parameter

### 3. Data Formatting

All training data uses centralized formatting utilities:
- **Angular**: `angular/src/app/shared/utils/format.utils.ts`
- **Vanilla JS**: `src/js/utils/shared.js`

These utilities ensure consistent formatting of:
- Numbers (with thousand separators)
- Percentages (1 decimal place)
- Averages (2 decimal places)
- Dates and durations

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

Training data display logic is now **consistent** with game stats. Key improvements:

1. ✅ **Automatic date filtering** - sessions filtered to "up to and including today" by default
2. ✅ **Single data source** - all services use backend API
3. ✅ **Consistent filtering** - same logic across all pages
4. ✅ **Centralized formatting** - consistent number/percentage/date formatting utilities

Training data now follows the same patterns as game statistics, ensuring a consistent user experience across the entire application.
