# ACWR Calculation Fix - Baseline Checks Implementation

**Version**: 1.0  
**Date**: January 2025  
**Status**: ✅ Complete

---

## Overview

This document describes the implementation of safe ACWR calculation with baseline requirements and zero-division protection.

---

## Problem Statement

The original ACWR calculation had critical issues:

1. **No baseline requirement**: Calculated ACWR immediately, even with insufficient data
2. **Zero division risk**: Could explode if chronic load was 0 or very small
3. **No baseline tracking**: Didn't track how many days of data were available
4. **Unclear risk levels**: Didn't distinguish between "insufficient data" and actual risk

---

## Solution

### Baseline Requirements

1. **Minimum 21 days of data** required for reliable ACWR
   - Status: `baseline_building` if < 21 days
   - ACWR: `NULL` until sufficient baseline

2. **Minimum chronic load threshold** of 50
   - Status: `baseline_low` if chronic < 50
   - ACWR: `NULL` until chronic load sufficient

### Risk Levels

| Risk Level          | Condition         | ACWR Value | Meaning                                       |
| ------------------- | ----------------- | ---------- | --------------------------------------------- |
| `baseline_building` | < 21 days of data | `NULL`     | Building baseline, ACWR not yet reliable      |
| `baseline_low`      | Chronic load < 50 | `NULL`     | Baseline too low, increase training gradually |
| `low`               | ACWR < 0.8        | 0.0 - 0.79 | Detraining risk                               |
| `optimal`           | ACWR 0.8-1.3      | 0.8 - 1.3  | Sweet spot, optimal training load             |
| `moderate`          | ACWR 1.3-1.5      | 1.3 - 1.5  | Moderate injury risk                          |
| `high`              | ACWR > 1.5        | > 1.5      | High injury risk                              |

---

## Implementation

### Migration File

**File**: `database/migrations/046_fix_acwr_baseline_checks.sql`

**Key Functions Created:**

1. **`calculate_acwr_safe()`**
   - Main calculation function with baseline checks
   - Returns: acwr, risk_level, baseline_days, acute_7, chronic_28, daily_load

2. **`get_acwr_with_baseline()`**
   - API-friendly function with status messages
   - Returns: acwr, risk_level, baseline_days, acute_7, chronic_28, daily_load, baseline_status, message

3. **`recalculate_load_metrics_range()`**
   - Recalculates ACWR for date range (for session edits)
   - Updates both load_monitoring and load_metrics tables

4. **`update_load_daily_for_date()`**
   - Updates load_daily table from workout_logs
   - Ensures daily loads are aggregated correctly

### Database Changes

1. **Added `baseline_days` column** to `load_monitoring` table
2. **Created `load_daily` table** for daily load aggregation
3. **Created `load_metrics` table** for separate metrics tracking (optional)
4. **Updated trigger function** to use safe calculation

---

## Usage Examples

### Get ACWR with Baseline Status

```sql
-- Get current ACWR with baseline status
SELECT * FROM get_acwr_with_baseline('player-uuid-here', CURRENT_DATE);

-- Returns:
-- acwr: NULL (if baseline insufficient) or decimal value
-- risk_level: 'baseline_building', 'baseline_low', 'low', 'optimal', 'moderate', 'high'
-- baseline_days: 0-28
-- acute_7: 7-day rolling average
-- chronic_28: 28-day rolling average
-- daily_load: Today's load
-- baseline_status: 'building', 'low', 'unknown', 'ready'
-- message: Human-readable status message
```

### Recalculate After Session Edit

```sql
-- Recalculate ACWR for date range (e.g., after editing a session)
SELECT recalculate_load_metrics_range(
  'player-uuid-here',
  '2025-01-01'::DATE,
  '2025-01-28'::DATE
);
```

### Direct Calculation

```sql
-- Calculate ACWR directly
SELECT * FROM calculate_acwr_safe('player-uuid-here', CURRENT_DATE);
```

---

## Frontend Integration

### Display Baseline Status

```typescript
interface ACWRData {
  acwr: number | null;
  risk_level:
    | "baseline_building"
    | "baseline_low"
    | "low"
    | "optimal"
    | "moderate"
    | "high";
  baseline_days: number;
  acute_7: number;
  chronic_28: number;
  daily_load: number;
  baseline_status: "building" | "low" | "unknown" | "ready";
  message: string;
}

// Display logic
function displayACWRStatus(data: ACWRData) {
  if (data.baseline_status === "building") {
    return `Building baseline (${data.baseline_days}/28 days). ACWR will be calculated once sufficient data is available.`;
  }

  if (data.baseline_status === "low") {
    return `Baseline load is low (${data.chronic_28}). Consider gradually increasing training volume.`;
  }

  if (data.acwr === null) {
    return "Unable to calculate ACWR. Please ensure you have logged training sessions.";
  }

  return `ACWR: ${data.acwr.toFixed(2)} (Risk: ${data.risk_level})`;
}
```

### UI Components

1. **Baseline Progress Bar**

   ```
   Building baseline: [████████░░░░░░░░░░░░░░░░░░] 8/28 days
   ```

2. **ACWR Display** (when ready)

   ```
   ACWR: 1.15 (Optimal)
   Acute Load: 450
   Chronic Load: 390
   ```

3. **Risk Indicator**
   - 🟢 Optimal (0.8-1.3)
   - 🟡 Moderate (1.3-1.5)
   - 🔴 High (>1.5)
   - ⚪ Building baseline (<21 days)

---

## Migration Steps

1. **Run Migration**

   ```sql
   -- Run in development first
   \i database/migrations/046_fix_acwr_baseline_checks.sql
   ```

2. **Backfill Existing Data**

   ```sql
   -- Update existing records with baseline_days
   SELECT backfill_baseline_days();
   ```

3. **Verify Calculation**

   ```sql
   -- Test with a player
   SELECT * FROM get_acwr_with_baseline('test-player-uuid', CURRENT_DATE);
   ```

4. **Update Frontend**
   - Update API calls to use new endpoint
   - Display baseline status in UI
   - Show progress indicator for baseline building

---

## Testing Scenarios

### Scenario 1: New User (< 21 days)

- **Expected**: `baseline_status = 'building'`, `acwr = NULL`
- **Message**: "Building baseline (X/28 days)"

### Scenario 2: Low Chronic Load (< 50)

- **Expected**: `baseline_status = 'low'`, `acwr = NULL`
- **Message**: "Baseline load is low. Consider gradually increasing training volume."

### Scenario 3: Sufficient Baseline (≥ 21 days, chronic ≥ 50)

- **Expected**: `baseline_status = 'ready'`, `acwr = calculated value`
- **Message**: "ACWR: X.XX (Risk: Y)"

### Scenario 4: Session Edit

- **Expected**: Recalculation updates affected date range
- **Test**: Edit a session, verify ACWR recalculates for next 28 days

---

## API Endpoint Updates

### GET /api/training/load

**Response Format:**

```json
{
  "acwr": 1.15,
  "risk_level": "optimal",
  "baseline_days": 25,
  "acute_7": 450.0,
  "chronic_28": 390.0,
  "daily_load": 60,
  "baseline_status": "ready",
  "message": "ACWR: 1.15 (Risk: optimal)"
}
```

**When Baseline Insufficient:**

```json
{
  "acwr": null,
  "risk_level": "baseline_building",
  "baseline_days": 8,
  "acute_7": 120.0,
  "chronic_28": 85.0,
  "daily_load": 60,
  "baseline_status": "building",
  "message": "Building baseline (8/28 days). ACWR will be calculated once sufficient data is available."
}
```

---

## Related Documentation

- [EDGE_CASE_HANDLING.md](./EDGE_CASE_HANDLING.md) - Edge case details
- [IMPLEMENTATION_PRIORITY_GUIDE.md](./IMPLEMENTATION_PRIORITY_GUIDE.md) - Priority #4
- [database/migrations/046_fix_acwr_baseline_checks.sql](../database/migrations/046_fix_acwr_baseline_checks.sql) - Migration file

---

## Notes

- The migration is backward compatible - old functions still work
- New functions use `calculate_acwr_safe()` for safe calculation
- Baseline checks prevent unreliable ACWR values
- UI should clearly communicate baseline status to users
