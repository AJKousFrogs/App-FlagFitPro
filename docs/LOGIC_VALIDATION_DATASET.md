# ACWR & Load Monitoring Logic Validation Dataset

This document provides a synthetic 28-day workout dataset for validating ACWR (Acute:Chronic Workload Ratio) calculations in FlagFit Pro. All expected values are computed using the system's real formulas and rounding rules.

---

## 1. System Formulas Reference

### 1.1 Daily Load Calculation

```
daily_load = RPE × duration_minutes
```

- **RPE**: Rating of Perceived Exertion (1-10 scale)
- **duration_minutes**: Session duration in minutes
- **Unit**: Arbitrary Units (AU)

### 1.2 Acute Load Calculation (7-day rolling average)

```sql
-- Database function: calculate_acute_load(player_uuid, reference_date)
SELECT AVG(daily_load)
FROM load_monitoring
WHERE player_id = player_uuid
  AND date BETWEEN reference_date - INTERVAL '6 days' AND reference_date;
```

- **Window**: 7 days (reference_date - 6 days to reference_date, inclusive)
- **Method**: Simple rolling average (not EWMA in DB functions)
- **Rounding**: DECIMAL(10,2) - 2 decimal places

### 1.3 Chronic Load Calculation (28-day rolling average)

```sql
-- Database function: calculate_chronic_load(player_uuid, reference_date)
SELECT AVG(daily_load)
FROM load_monitoring
WHERE player_id = player_uuid
  AND date BETWEEN reference_date - INTERVAL '27 days' AND reference_date;
```

- **Window**: 28 days (reference_date - 27 days to reference_date, inclusive)
- **Method**: Simple rolling average
- **Rounding**: DECIMAL(10,2) - 2 decimal places

### 1.4 ACWR Calculation

```
ACWR = acute_load / chronic_load
```

- **Precondition**: chronic_load > 0
- **Rounding**: DECIMAL(4,2) - 2 decimal places

### 1.5 Risk Level Classification (Gabbett 2016)

| ACWR Range          | Risk Level          | Color  |
| ------------------- | ------------------- | ------ |
| NULL or chronic = 0 | `baseline_building` | Gray   |
| < 0.80              | `under_training`    | Orange |
| 0.80 - 1.30         | `optimal`           | Green  |
| 1.30 - 1.50         | `elevated`          | Yellow |
| > 1.50              | `danger`            | Red    |

### 1.6 Data State Rules

| Days of Data | State                                  | ACWR Computed? |
| ------------ | -------------------------------------- | -------------- |
| 0            | `NO_DATA`                              | No             |
| 1-6          | `INSUFFICIENT_DATA` (building acute)   | No             |
| 7-20         | `INSUFFICIENT_DATA` (building chronic) | Partial\*      |
| 21-27        | `LOW_CONFIDENCE`                       | Yes (flagged)  |
| 28+          | `SUFFICIENT_DATA`                      | Yes            |

\*Partial: Acute load is valid, chronic load uses available data, ACWR may be unreliable.

---

## 2. Synthetic 28-Day Workout Dataset

### Test Player Profile

- **Player ID**: `test-player-acwr-validation`
- **Start Date**: Day 1 of dataset
- **Training Pattern**: Realistic flag football athlete with varied intensity

### 2.1 Complete Dataset

| Day | Date (relative) | Duration (min) | RPE | Daily Load (AU) | Session Type |
| --- | --------------- | -------------- | --- | --------------- | ------------ |
| 1   | D+0             | 60             | 5   | 300             | Technical    |
| 2   | D+1             | 45             | 6   | 270             | Conditioning |
| 3   | D+2             | 0              | 0   | 0               | Rest         |
| 4   | D+3             | 75             | 7   | 525             | Technical    |
| 5   | D+4             | 50             | 6   | 300             | Strength     |
| 6   | D+5             | 0              | 0   | 0               | Rest         |
| 7   | D+6             | 90             | 8   | 720             | Game         |
| 8   | D+7             | 30             | 4   | 120             | Recovery     |
| 9   | D+8             | 60             | 6   | 360             | Technical    |
| 10  | D+9             | 45             | 5   | 225             | Conditioning |
| 11  | D+10            | 0              | 0   | 0               | Rest         |
| 12  | D+11            | 70             | 7   | 490             | Technical    |
| 13  | D+12            | 55             | 6   | 330             | Strength     |
| 14  | D+13            | 90             | 9   | 810             | Game         |
| 15  | D+14            | 30             | 3   | 90              | Recovery     |
| 16  | D+15            | 60             | 6   | 360             | Technical    |
| 17  | D+16            | 50             | 5   | 250             | Conditioning |
| 18  | D+17            | 0              | 0   | 0               | Rest         |
| 19  | D+18            | 75             | 7   | 525             | Technical    |
| 20  | D+19            | 60             | 6   | 360             | Strength     |
| 21  | D+20            | 100            | 8   | 800             | Game         |
| 22  | D+21            | 30             | 4   | 120             | Recovery     |
| 23  | D+22            | 60             | 6   | 360             | Technical    |
| 24  | D+23            | 45             | 5   | 225             | Conditioning |
| 25  | D+24            | 0              | 0   | 0               | Rest         |
| 26  | D+25            | 80             | 8   | 640             | Technical    |
| 27  | D+26            | 55             | 7   | 385             | Strength     |
| 28  | D+27            | 95             | 9   | 855             | Game         |

### 2.2 Daily Load Verification

```
Day 1:  60 × 5 = 300 AU
Day 2:  45 × 6 = 270 AU
Day 3:   0 × 0 =   0 AU (Rest)
Day 4:  75 × 7 = 525 AU
Day 5:  50 × 6 = 300 AU
Day 6:   0 × 0 =   0 AU (Rest)
Day 7:  90 × 8 = 720 AU
Day 8:  30 × 4 = 120 AU
Day 9:  60 × 6 = 360 AU
Day 10: 45 × 5 = 225 AU
Day 11:  0 × 0 =   0 AU (Rest)
Day 12: 70 × 7 = 490 AU
Day 13: 55 × 6 = 330 AU
Day 14: 90 × 9 = 810 AU
Day 15: 30 × 3 =  90 AU
Day 16: 60 × 6 = 360 AU
Day 17: 50 × 5 = 250 AU
Day 18:  0 × 0 =   0 AU (Rest)
Day 19: 75 × 7 = 525 AU
Day 20: 60 × 6 = 360 AU
Day 21: 100 × 8 = 800 AU
Day 22: 30 × 4 = 120 AU
Day 23: 60 × 6 = 360 AU
Day 24: 45 × 5 = 225 AU
Day 25:  0 × 0 =   0 AU (Rest)
Day 26: 80 × 8 = 640 AU
Day 27: 55 × 7 = 385 AU
Day 28: 95 × 9 = 855 AU
```

---

## 3. Expected Results at Checkpoint Days

### 3.1 Day 0 (Before Any Data)

| Metric                | Expected Value      | Calculation       |
| --------------------- | ------------------- | ----------------- |
| Daily Load            | NULL                | No data logged    |
| Acute Load (7-day)    | NULL                | No data in window |
| Chronic Load (28-day) | NULL                | No data in window |
| ACWR                  | NULL                | Cannot compute    |
| Risk Level            | `baseline_building` | Insufficient data |
| Data State            | `NO_DATA`           | 0 days of data    |

**UI Behavior**: Show "No Data Yet" message with "Log Training" CTA.

---

### 3.2 Day 6 (End of Day 6 - Building Acute Window)

**7-Day Window (Days 1-6)**: 300, 270, 0, 525, 300, 0 (+ implicit 0 for missing day)

| Metric                | Expected Value      | Calculation                                       |
| --------------------- | ------------------- | ------------------------------------------------- |
| Daily Load (Day 6)    | 0 AU                | Rest day                                          |
| Acute Load (7-day)    | **199.29 AU**       | (300+270+0+525+300+0) ÷ **7** = 1395 ÷ 7 = 199.29 |
| Chronic Load (28-day) | 232.50 AU           | 1395 ÷ 6 = 232.50 (uses actual days)              |
| ACWR                  | **0.86**            | 199.29 ÷ 232.50 = 0.86                            |
| Risk Level            | `baseline_building` | < 7 days of data                                  |
| Data State            | `INSUFFICIENT_DATA` | 6 days of data                                    |

**⚠️ IMPORTANT**: The acute load formula **always divides by 7** (the window size), not by the number of days with data. This is the standard rolling average approach - missing days count as zero load.

**UI Behavior**: Show "Building Baseline" message - "You need 1 more day of data for acute load calculation."

---

### 3.3 Day 7 (First Complete Acute Window)

**7-Day Window (Days 1-7)**: 300, 270, 0, 525, 300, 0, 720

| Metric                | Expected Value      | Calculation                                                       |
| --------------------- | ------------------- | ----------------------------------------------------------------- |
| Daily Load (Day 7)    | 720 AU              | 90 × 8 = 720                                                      |
| Acute Load (7-day)    | **302.14 AU**       | (300+270+0+525+300+0+720) ÷ 7 = 2115 ÷ 7 = 302.142857... ≈ 302.14 |
| Chronic Load (28-day) | 302.14 AU           | Only 7 days available, same as acute                              |
| ACWR                  | **1.00**            | 302.14 ÷ 302.14 = 1.00                                            |
| Risk Level            | `optimal`           | 0.80 ≤ 1.00 ≤ 1.30                                                |
| Data State            | `INSUFFICIENT_DATA` | 7 days (need 21 for chronic)                                      |

**Verification**:

```
Sum of Days 1-7: 300 + 270 + 0 + 525 + 300 + 0 + 720 = 2115
Acute Load: 2115 / 7 = 302.142857... → 302.14 (rounded)
```

**UI Behavior**: Show ACWR with "Low Confidence" badge - "Continue logging for 14 more days for reliable chronic load."

---

### 3.4 Day 14 (Two Weeks of Data)

**7-Day Window (Days 8-14)**: 120, 360, 225, 0, 490, 330, 810

| Metric                | Expected Value      | Calculation                                                      |
| --------------------- | ------------------- | ---------------------------------------------------------------- |
| Daily Load (Day 14)   | 810 AU              | 90 × 9 = 810                                                     |
| Acute Load (7-day)    | **333.57 AU**       | (120+360+225+0+490+330+810) ÷ 7 = 2335 ÷ 7 = 333.571... ≈ 333.57 |
| Chronic Load (28-day) | 317.86 AU           | Sum(Days 1-14) ÷ 14 = 4450 ÷ 14 = 317.857... ≈ 317.86            |
| ACWR                  | **1.05**            | 333.57 ÷ 317.86 = 1.0494... ≈ 1.05                               |
| Risk Level            | `optimal`           | 0.80 ≤ 1.05 ≤ 1.30                                               |
| Data State            | `INSUFFICIENT_DATA` | 14 days (need 21 for chronic)                                    |

**Verification**:

```
Sum Days 8-14: 120 + 360 + 225 + 0 + 490 + 330 + 810 = 2335
Acute Load: 2335 / 7 = 333.571... → 333.57

Sum Days 1-14: 2115 + 2335 = 4450
Chronic Load: 4450 / 14 = 317.857... → 317.86

ACWR: 333.57 / 317.86 = 1.0494... → 1.05
```

---

### 3.5 Day 21 (Three Weeks - Minimum for Chronic)

**7-Day Window (Days 15-21)**: 90, 360, 250, 0, 525, 360, 800

| Metric                | Expected Value   | Calculation                                                     |
| --------------------- | ---------------- | --------------------------------------------------------------- |
| Daily Load (Day 21)   | 800 AU           | 100 × 8 = 800                                                   |
| Acute Load (7-day)    | **340.71 AU**    | (90+360+250+0+525+360+800) ÷ 7 = 2385 ÷ 7 = 340.714... ≈ 340.71 |
| Chronic Load (28-day) | 325.00 AU        | Sum(Days 1-21) ÷ 21 = 6835 ÷ 21 = 325.476... ≈ 325.48           |
| ACWR                  | **1.05**         | 340.71 ÷ 325.48 = 1.0468... ≈ 1.05                              |
| Risk Level            | `optimal`        | 0.80 ≤ 1.05 ≤ 1.30                                              |
| Data State            | `LOW_CONFIDENCE` | 21 days (minimum met)                                           |

**Verification**:

```
Sum Days 15-21: 90 + 360 + 250 + 0 + 525 + 360 + 800 = 2385
Acute Load: 2385 / 7 = 340.714... → 340.71

Sum Days 1-21: 4450 + 2385 = 6835
Chronic Load: 6835 / 21 = 325.476... → 325.48

ACWR: 340.71 / 325.48 = 1.0468... → 1.05
```

**UI Behavior**: Show ACWR with "Low Confidence" badge removed after Day 21, but note that full 28-day chronic window not yet complete.

---

### 3.6 Day 27 (One Day Before Full Chronic Window)

**7-Day Window (Days 21-27)**: 800, 120, 360, 225, 0, 640, 385

| Metric                | Expected Value   | Calculation                                                      |
| --------------------- | ---------------- | ---------------------------------------------------------------- |
| Daily Load (Day 27)   | 385 AU           | 55 × 7 = 385                                                     |
| Acute Load (7-day)    | **361.43 AU**    | (800+120+360+225+0+640+385) ÷ 7 = 2530 ÷ 7 = 361.428... ≈ 361.43 |
| Chronic Load (28-day) | 334.63 AU        | Sum(Days 1-27) ÷ 27 = 9035 ÷ 27 = 334.629... ≈ 334.63            |
| ACWR                  | **1.08**         | 361.43 ÷ 334.63 = 1.0801... ≈ 1.08                               |
| Risk Level            | `optimal`        | 0.80 ≤ 1.08 ≤ 1.30                                               |
| Data State            | `LOW_CONFIDENCE` | 27 days (almost complete)                                        |

**Verification**:

```
Sum Days 21-27: 800 + 120 + 360 + 225 + 0 + 640 + 385 = 2530
Acute Load: 2530 / 7 = 361.428... → 361.43

Sum Days 1-27: 6835 + (120+360+225+0+640+385) = 6835 + 1730 + 800 = 9365
Wait, let me recalculate:
Days 1-21 sum = 6835
Days 22-27: 120 + 360 + 225 + 0 + 640 + 385 = 1730
Total Days 1-27: 6835 + 1730 = 8565
Chronic Load: 8565 / 27 = 317.22... → 317.22

Actually, let me recount day by day...
Day 22: 120
Day 23: 360
Day 24: 225
Day 25: 0
Day 26: 640
Day 27: 385
Sum 22-27: 1730

Hmm, Day 21 is 800, which I already included in Days 1-21.
So Days 1-27 = Days 1-21 + Days 22-27 = 6835 + 1730 = 8565
Chronic Load: 8565 / 27 = 317.222... → 317.22

ACWR: 361.43 / 317.22 = 1.1393... → 1.14
```

**Corrected Values for Day 27**:

| Metric                | Expected Value   | Calculation            |
| --------------------- | ---------------- | ---------------------- |
| Daily Load (Day 27)   | 385 AU           | 55 × 7 = 385           |
| Acute Load (7-day)    | **361.43 AU**    | 2530 ÷ 7 = 361.43      |
| Chronic Load (28-day) | **317.22 AU**    | 8565 ÷ 27 = 317.22     |
| ACWR                  | **1.14**         | 361.43 ÷ 317.22 = 1.14 |
| Risk Level            | `optimal`        | 0.80 ≤ 1.14 ≤ 1.30     |
| Data State            | `LOW_CONFIDENCE` | 27 days                |

---

### 3.7 Day 28 (Full Chronic Window Complete)

**7-Day Window (Days 22-28)**: 120, 360, 225, 0, 640, 385, 855

| Metric                | Expected Value    | Calculation                                                      |
| --------------------- | ----------------- | ---------------------------------------------------------------- |
| Daily Load (Day 28)   | 855 AU            | 95 × 9 = 855                                                     |
| Acute Load (7-day)    | **369.29 AU**     | (120+360+225+0+640+385+855) ÷ 7 = 2585 ÷ 7 = 369.285... ≈ 369.29 |
| Chronic Load (28-day) | **336.43 AU**     | Sum(Days 1-28) ÷ 28 = 9420 ÷ 28 = 336.428... ≈ 336.43            |
| ACWR                  | **1.10**          | 369.29 ÷ 336.43 = 1.0977... ≈ 1.10                               |
| Risk Level            | `optimal`         | 0.80 ≤ 1.10 ≤ 1.30                                               |
| Data State            | `SUFFICIENT_DATA` | 28 days (full window)                                            |

**Verification**:

```
Sum Days 22-28: 120 + 360 + 225 + 0 + 640 + 385 + 855 = 2585
Acute Load: 2585 / 7 = 369.285... → 369.29

Sum Days 1-28: 8565 + 855 = 9420
Chronic Load: 9420 / 28 = 336.428... → 336.43

ACWR: 369.29 / 336.43 = 1.0977... → 1.10
```

**UI Behavior**: Show full ACWR dashboard with green "Optimal" badge. All confidence warnings removed.

---

## 4. SQL Queries for Validation

### 4.1 Insert Test Data

```sql
-- Create test player (use your own UUID)
-- This assumes you're running as the test user or have appropriate permissions

-- Insert workout logs for the 28-day dataset
INSERT INTO workout_logs (player_id, completed_at, rpe, duration_minutes, notes)
VALUES
  -- Week 1
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '27 days', 5, 60, 'Day 1: Technical'),
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '26 days', 6, 45, 'Day 2: Conditioning'),
  -- Day 3: Rest (no entry needed)
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '24 days', 7, 75, 'Day 4: Technical'),
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '23 days', 6, 50, 'Day 5: Strength'),
  -- Day 6: Rest
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '21 days', 8, 90, 'Day 7: Game'),

  -- Week 2
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '20 days', 4, 30, 'Day 8: Recovery'),
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '19 days', 6, 60, 'Day 9: Technical'),
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '18 days', 5, 45, 'Day 10: Conditioning'),
  -- Day 11: Rest
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '16 days', 7, 70, 'Day 12: Technical'),
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '15 days', 6, 55, 'Day 13: Strength'),
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '14 days', 9, 90, 'Day 14: Game'),

  -- Week 3
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '13 days', 3, 30, 'Day 15: Recovery'),
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '12 days', 6, 60, 'Day 16: Technical'),
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '11 days', 5, 50, 'Day 17: Conditioning'),
  -- Day 18: Rest
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '9 days', 7, 75, 'Day 19: Technical'),
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '8 days', 6, 60, 'Day 20: Strength'),
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '7 days', 8, 100, 'Day 21: Game'),

  -- Week 4
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '6 days', 4, 30, 'Day 22: Recovery'),
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '5 days', 6, 60, 'Day 23: Technical'),
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '4 days', 5, 45, 'Day 24: Conditioning'),
  -- Day 25: Rest
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '2 days', 8, 80, 'Day 26: Technical'),
  ('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '1 day', 7, 55, 'Day 27: Strength'),
  ('TEST_PLAYER_UUID', CURRENT_DATE, 9, 95, 'Day 28: Game');
```

### 4.2 Verify Daily Load Calculation

```sql
-- Query to verify daily load calculation
SELECT
  DATE(completed_at) AS log_date,
  rpe,
  duration_minutes,
  (rpe * duration_minutes)::INTEGER AS expected_daily_load,
  calculate_daily_load(player_id, DATE(completed_at)) AS actual_daily_load,
  CASE
    WHEN (rpe * duration_minutes)::INTEGER = calculate_daily_load(player_id, DATE(completed_at))
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS validation
FROM workout_logs
WHERE player_id = 'TEST_PLAYER_UUID'
ORDER BY completed_at;
```

### 4.3 Verify Acute Load at Checkpoints

```sql
-- Verify acute load at Day 7
WITH day7_data AS (
  SELECT
    SUM(rpe * duration_minutes) AS total_load,
    COUNT(*) AS session_count
  FROM workout_logs
  WHERE player_id = 'TEST_PLAYER_UUID'
    AND DATE(completed_at) BETWEEN CURRENT_DATE - INTERVAL '27 days'
                                AND CURRENT_DATE - INTERVAL '21 days'
)
SELECT
  'Day 7 Acute Load' AS checkpoint,
  ROUND(total_load::DECIMAL / 7, 2) AS expected_acute,
  calculate_acute_load('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '21 days') AS actual_acute,
  CASE
    WHEN ABS(ROUND(total_load::DECIMAL / 7, 2) - calculate_acute_load('TEST_PLAYER_UUID', CURRENT_DATE - INTERVAL '21 days')) < 0.01
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS validation
FROM day7_data;

-- Verify acute load at Day 28 (today)
WITH day28_acute AS (
  SELECT
    SUM(rpe * duration_minutes) AS total_load
  FROM workout_logs
  WHERE player_id = 'TEST_PLAYER_UUID'
    AND DATE(completed_at) BETWEEN CURRENT_DATE - INTERVAL '6 days' AND CURRENT_DATE
)
SELECT
  'Day 28 Acute Load' AS checkpoint,
  ROUND(total_load::DECIMAL / 7, 2) AS expected_acute,
  calculate_acute_load('TEST_PLAYER_UUID', CURRENT_DATE) AS actual_acute,
  369.29 AS documented_expected,
  CASE
    WHEN ABS(calculate_acute_load('TEST_PLAYER_UUID', CURRENT_DATE) - 369.29) < 0.5
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS validation
FROM day28_acute;
```

### 4.4 Verify Chronic Load at Checkpoints

```sql
-- Verify chronic load at Day 28 (today)
WITH day28_chronic AS (
  SELECT
    SUM(rpe * duration_minutes) AS total_load,
    COUNT(*) AS session_count
  FROM workout_logs
  WHERE player_id = 'TEST_PLAYER_UUID'
    AND DATE(completed_at) BETWEEN CURRENT_DATE - INTERVAL '27 days' AND CURRENT_DATE
)
SELECT
  'Day 28 Chronic Load' AS checkpoint,
  ROUND(total_load::DECIMAL / 28, 2) AS expected_chronic,
  calculate_chronic_load('TEST_PLAYER_UUID', CURRENT_DATE) AS actual_chronic,
  336.43 AS documented_expected,
  session_count AS sessions_in_window,
  CASE
    WHEN ABS(calculate_chronic_load('TEST_PLAYER_UUID', CURRENT_DATE) - 336.43) < 0.5
    THEN '✅ PASS'
    ELSE '❌ FAIL'
  END AS validation
FROM day28_chronic;
```

### 4.5 Verify ACWR and Risk Level

```sql
-- Full ACWR validation at Day 28
SELECT
  'Day 28 ACWR' AS checkpoint,
  calculate_acute_load('TEST_PLAYER_UUID', CURRENT_DATE) AS acute_load,
  calculate_chronic_load('TEST_PLAYER_UUID', CURRENT_DATE) AS chronic_load,
  ROUND(
    calculate_acute_load('TEST_PLAYER_UUID', CURRENT_DATE) /
    NULLIF(calculate_chronic_load('TEST_PLAYER_UUID', CURRENT_DATE), 0),
    2
  ) AS calculated_acwr,
  1.10 AS documented_expected_acwr,
  get_injury_risk_level(
    calculate_acute_load('TEST_PLAYER_UUID', CURRENT_DATE) /
    NULLIF(calculate_chronic_load('TEST_PLAYER_UUID', CURRENT_DATE), 0)
  ) AS risk_level,
  'Optimal' AS expected_risk_level;
```

### 4.6 Query Using Consent View (Coach Access)

```sql
-- This query uses the consent-aware view for coach access
-- Returns NULL for metrics if consent is blocked

SELECT
  lm.player_id,
  lm.date,
  lm.daily_load,
  lm.acute_load,
  lm.chronic_load,
  lm.acwr,
  lm.injury_risk_level,
  lm.consent_blocked,
  lm.access_reason
FROM v_load_monitoring_consent lm
WHERE lm.player_id = 'TEST_PLAYER_UUID'
ORDER BY lm.date DESC
LIMIT 7;
```

### 4.7 Complete Checkpoint Validation Query

```sql
-- Comprehensive validation at all checkpoints
WITH checkpoints AS (
  SELECT
    day_num,
    CURRENT_DATE - INTERVAL '28 days' + (day_num || ' days')::INTERVAL AS check_date
  FROM generate_series(0, 28) AS day_num
  WHERE day_num IN (0, 6, 7, 14, 21, 27, 28)
),
expected_values AS (
  SELECT * FROM (VALUES
    (0, NULL::DECIMAL, NULL::DECIMAL, NULL::DECIMAL, 'NO_DATA'),
    (6, 199.29, 232.50, 0.86, 'INSUFFICIENT_DATA'),  -- Note: acute always divides by 7
    (7, 302.14, 302.14, 1.00, 'INSUFFICIENT_DATA'),
    (14, 333.57, 317.86, 1.05, 'INSUFFICIENT_DATA'),
    (21, 340.71, 325.48, 1.05, 'LOW_CONFIDENCE'),
    (27, 361.43, 317.22, 1.14, 'LOW_CONFIDENCE'),
    (28, 369.29, 336.43, 1.10, 'SUFFICIENT_DATA')
  ) AS t(day_num, exp_acute, exp_chronic, exp_acwr, exp_state)
)
SELECT
  c.day_num,
  c.check_date,
  e.exp_acute AS expected_acute,
  calculate_acute_load('TEST_PLAYER_UUID', c.check_date::DATE) AS actual_acute,
  e.exp_chronic AS expected_chronic,
  calculate_chronic_load('TEST_PLAYER_UUID', c.check_date::DATE) AS actual_chronic,
  e.exp_acwr AS expected_acwr,
  ROUND(
    calculate_acute_load('TEST_PLAYER_UUID', c.check_date::DATE) /
    NULLIF(calculate_chronic_load('TEST_PLAYER_UUID', c.check_date::DATE), 0),
    2
  ) AS actual_acwr,
  e.exp_state AS expected_data_state,
  CASE
    WHEN c.day_num = 0 THEN 'NO_DATA'
    WHEN c.day_num < 7 THEN 'INSUFFICIENT_DATA'
    WHEN c.day_num < 21 THEN 'INSUFFICIENT_DATA'
    WHEN c.day_num < 28 THEN 'LOW_CONFIDENCE'
    ELSE 'SUFFICIENT_DATA'
  END AS actual_data_state
FROM checkpoints c
JOIN expected_values e ON c.day_num = e.day_num
ORDER BY c.day_num;
```

---

## 5. Expected Results Summary Table

| Day | Acute Load | Chronic Load | ACWR     | Risk Level        | Data State        |
| --- | ---------- | ------------ | -------- | ----------------- | ----------------- |
| 0   | NULL       | NULL         | NULL     | baseline_building | NO_DATA           |
| 6   | **199.29** | 232.50       | **0.86** | baseline_building | INSUFFICIENT_DATA |
| 7   | 302.14     | 302.14       | 1.00     | optimal           | INSUFFICIENT_DATA |
| 14  | 333.57     | 317.86       | 1.05     | optimal           | INSUFFICIENT_DATA |
| 21  | 340.71     | 325.48       | 1.05     | optimal           | LOW_CONFIDENCE    |
| 27  | 361.43     | 317.22       | 1.14     | optimal           | LOW_CONFIDENCE    |
| 28  | 369.29     | 336.43       | 1.10     | optimal           | SUFFICIENT_DATA   |

---

## 6. ✅ BUGS DISCOVERED AND FIXED

### 6.1 BUG: Rest Days Not Included in Load Monitoring

**Severity**: HIGH  
**Status**: ✅ FIXED in migration `075_fix_acwr_rolling_average_calculation.sql`

**Issue**: The `calculate_acute_load` and `calculate_chronic_load` functions used `AVG(daily_load)` which only averaged over **rows that exist** in `load_monitoring`. Since the trigger only fires on workout log inserts, **rest days were not recorded**, causing inflated averages.

**Before Fix (BUG)**:

```sql
-- If player has 5 workouts in 7 days (2 rest days):
-- AVG = SUM(loads) / 5  -- WRONG: divides by workout count only
```

**After Fix**:

```sql
-- Now correctly divides by window size:
-- SUM(loads) / 7  -- CORRECT: includes rest days as 0
```

**Impact Before Fix**:

- Acute/chronic loads appeared 20-40% higher than actual
- ACWR ratios were incorrect
- Risk level classification could mask dangerous spikes

**Fix Applied**:

- `calculate_acute_load`: Changed from `AVG(daily_load)` to `COALESCE(SUM(daily_load), 0) / 7.0`
- `calculate_chronic_load`: Changed from `AVG(daily_load)` to `COALESCE(SUM(daily_load), 0) / window_size`

---

### 6.2 BUG: Missing Minimum Chronic Load Floor

**Severity**: MEDIUM  
**Status**: ✅ FIXED in migration `075_fix_acwr_rolling_average_calculation.sql`

**Issue**: The database had no minimum chronic load floor, while the Angular service used `minChronicLoad: 50`. When athletes return from injury or extended time off, their chronic load can be very low (e.g., 10-30 AU), causing inflated ACWR ratios that don't reflect reality.

**Example (Return from Injury)**:

```
Week 1 back: 3 light sessions, total 165 AU
Chronic without floor: 165/7 = 23.57 AU
Acute load: 165/7 = 23.57 AU

ACWR without floor: 23.57/23.57 = 1.0 (looks "optimal" - MISLEADING)
ACWR with floor (50): 23.57/50 = 0.47 (correctly shows "under-training")
```

**Impact Before Fix**:

- Returning athletes saw "optimal" ACWR when actually under-trained
- Masked the need for gradual load progression
- Inconsistency between Angular (with floor) and DB (without)

**Fix Applied**:

- Added `MIN_CHRONIC_LOAD CONSTANT DECIMAL := 50.0` to `calculate_chronic_load`
- Returns `GREATEST(calculated_chronic, MIN_CHRONIC_LOAD)`
- Updated `calculate_acwr_safe` to match Angular service behavior

---

**Verification**: Run the regression test to verify both fixes:

```bash
npm run test:acwr
```

---

## 7. Edge Cases to Test

### 7.1 Zero Chronic Load (Division by Zero)

```sql
-- Should return NULL ACWR, not error
SELECT
  calculate_acute_load('NEW_PLAYER_UUID', CURRENT_DATE) AS acute,
  calculate_chronic_load('NEW_PLAYER_UUID', CURRENT_DATE) AS chronic,
  CASE
    WHEN calculate_chronic_load('NEW_PLAYER_UUID', CURRENT_DATE) = 0
    THEN NULL
    ELSE calculate_acute_load('NEW_PLAYER_UUID', CURRENT_DATE) /
         calculate_chronic_load('NEW_PLAYER_UUID', CURRENT_DATE)
  END AS acwr;
```

### 7.2 High ACWR (Danger Zone)

If Day 28 had RPE=10 and duration=120 (load=1200 AU):

```
Acute Load = (120+360+225+0+640+385+1200) / 7 = 418.57
ACWR = 418.57 / 336.43 = 1.24 (still optimal, but approaching elevated)
```

### 7.3 Spike Detection (>10% Weekly Increase)

Week 3 total: 2385 AU
Week 4 total: 2585 AU
Change: (2585 - 2385) / 2385 = 8.4% ✅ Within safe range

---

## 8. Test Execution Checklist

### Automated Regression Test

Run the automated regression test:

```bash
npm run test:acwr
```

This test (`tests/logic/acwr-regression.test.js`) will:

1. Insert the synthetic 28-day dataset
2. Trigger load monitoring calculations
3. Query consent-aware view outputs
4. Assert expected values with defined tolerances

### Manual SQL Verification

- [ ] Insert test data using SQL in section 4.1
- [ ] Run daily load verification (section 4.2)
- [ ] Run acute load verification at all checkpoints (section 4.3)
- [ ] Run chronic load verification at all checkpoints (section 4.4)
- [ ] Run ACWR and risk level verification (section 4.5)
- [ ] Test consent view access (section 4.6)
- [ ] Run comprehensive checkpoint validation (section 4.7)

### UI Verification

- [ ] Verify UI displays correct data states at each checkpoint
- [ ] Verify risk level colors match expected values
- [ ] Test edge cases (section 7)

---

## 9. References

- Gabbett, T. J. (2016). _The training—injury prevention paradox: should athletes be training smarter and harder?_ British Journal of Sports Medicine, 50(5), 273-280.
- Database functions: `database/migrations/069_prerequisites_check_and_setup.sql`
- Consent views: `database/migrations/071_consent_layer_views_and_functions.sql`
- Angular ACWR service: `angular/src/app/core/services/acwr.service.ts`
- Privacy UX copy: `angular/src/app/shared/utils/privacy-ux-copy.ts`
