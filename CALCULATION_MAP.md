# Calculation Map

This document lists calculation hotspots responsible for athlete performance metrics and derived analytics.

## ACWR (Acute:Chronic Workload Ratio)
- `angular/src/app/core/services/acwr.service.ts`
  - Functions: `calculateEWMA`, `aggregateDailyLoads`, `acuteLoad` (Signal), `chronicLoad` (Signal), `acwrRatio` (Signal), `riskZone` (Signal), `weeklyProgression`, `predictNextSessionLoad`
  - Inputs: `TrainingSession[]` (RPE, duration, load), config from `EvidenceConfigService`
  - Outputs: acute/chronic load, ACWR ratio, risk zone, weekly progression, predictive recommendations
  - Formula: EWMA for acute/chronic (lambda-based), ACWR = acute ÷ chronic (safe divide)
  - Risk level: High

- `angular/src/app/core/services/acwr-spike-detection.service.ts`
  - Functions: `checkAndCapLoad`, `createLoadCap`, `getActiveLoadCap`, `decrementLoadCap`
  - Inputs: ACWR ratio, playerId
  - Outputs: load cap records and max load percentages
  - Formula: threshold gate (> 1.5) triggers caps
  - Risk level: Medium

- `netlify/functions/load-management.js`
  - Function: GET `/acwr`
  - Inputs: authenticated user
  - Outputs: stored `acwr`, `acute_load`, `chronic_load`
  - Formula: none (reads from persisted load monitoring)
  - Risk level: Medium

- `netlify/functions/load-management.js`
  - Function: GET `/api/load-management/acwr`
  - Inputs: training sessions (rpe, duration)
  - Outputs: acute, chronic, ACWR ratio, status label
  - Formula: rolling averages, ACWR = acute ÷ chronic with thresholds
  - Risk level: High

## Acute / Chronic Window Definitions
- `angular/src/app/core/config/evidence-config.ts`
  - Data: `acuteWindowDays`, `chronicWindowDays`, lambda values, thresholds
  - Risk level: High (single source for ACWR config)

- `angular/src/app/core/config/evidence-presets.ts`
  - Data: preset defaults for acute/chronic windows and thresholds
  - Risk level: Medium

## Training Load Aggregation
- `angular/src/app/core/services/training-stats-calculation.service.ts`
  - Functions: `calculateStatsFromSupabase`, `calculateWeeklyVolume`, `calculateStreak`, `calculateStreakFromSessions`
  - Inputs: training sessions (duration, RPE)
  - Outputs: totalDuration, avgDuration, avgLoad, weeklyDuration, avgIntensity, streaks
  - Formula: load = duration × RPE, averages = sum ÷ count
  - Risk level: High

- `angular/src/app/core/services/training-stats.service.ts`
  - Functions: `calculateStats`, `calculateStreak`, `calculateWeeklyTotals`
  - Inputs: training sessions (duration, workload)
  - Outputs: averages, streaks, weekly progress
  - Formula: averages and counts from session arrays
  - Risk level: Medium

## Readiness Scoring
- `angular/src/app/core/services/readiness.service.ts`
  - Function: `calculateToday`, `calculateForDay` (delegated to backend)
  - Inputs: wellness data, ACWR, sleep, proximity (server-derived)
  - Outputs: readiness score, level, suggestions, component scores
  - Formula: server-side weighted scoring
  - Risk level: High (core readiness logic is server-side)

- `netlify/functions/calc-readiness.js`
  - Function: `/api/calc-readiness`
  - Inputs: wellness check-in metrics, weekly training load
  - Outputs: readiness score and recommendations
  - Formula: base score 70 + metric deltas, load-based adjustments, clamp 0–100
  - Risk level: High

## Wellness Metrics Aggregation
- `angular/src/app/core/services/wellness.service.ts`
  - Functions: `getWellnessScore`, `calculateAverages`, `getWellnessTrends`
  - Inputs: wellness check-in values (sleep, energy, stress, soreness, etc.)
  - Outputs: wellness score, averages, trend labels
  - Formula: mean of metrics (stress/soreness inverted), trend = compare recent vs earlier average
  - Risk level: Medium

## Bodyweight Averages / Trend Logic
- `angular/src/app/core/services/body-weight-load.service.ts`
  - Functions: `analyzeWeightChanges`, `calculateBMI`, `normalizeLoadByWeight`, `estimateJointStress`
  - Inputs: weight history, athlete weight, reference weight
  - Outputs: weekly/monthly change, trend label, alerts, normalized load
  - Formula: change = current − past, trend threshold ±0.5kg
  - Risk level: Medium

- `angular/src/app/core/services/body-composition.service.ts`
  - Function: `calculateBMI`
  - Inputs: weight (kg), height (cm)
  - Outputs: BMI (rounded)
  - Formula: BMI = weight / (height_m^2), 1 decimal
  - Risk level: Low

- `angular/src/app/core/services/performance-data.service.ts`
  - Functions: `calculateBMI`, `calculateLeanBodyMass`
  - Inputs: weight, height, body fat
  - Outputs: BMI, lean body mass
  - Formula: BMI as above, LBM = weight × (1 − bodyFat%)
  - Risk level: Low

## Performance Scores / Analytics
- `netlify/functions/dashboard.js`
  - Formula: performance score = `100 − (avgRpe − 5) × 10`, clamped
  - Inputs: last 30 days training sessions
  - Risk level: Medium

- `netlify/functions/analytics.js`
  - Functions: performance trends, averages, grouped performance by type
  - Inputs: performance metrics tables
  - Outputs: per-week averages, top averages, summaries
  - Formula: average of performance_score with rounding to 1 decimal
  - Risk level: Medium

- `netlify/functions/performance-data.js`
  - Function: `calculatePerformanceTrends`
  - Inputs: performance tests data
  - Outputs: trends, deltas, averages
  - Formula: average and delta calculations
  - Risk level: Medium

## QB Throwing Metrics
- `angular/src/app/features/training/qb-throwing-tracker/qb-throwing-tracker.component.ts`
  - Functions: `getProgressPercent`, `getBarHeight`, `showArmCareReminder`
  - Inputs: weekly throw counts, target throws, session metadata
  - Outputs: progress %, bar height %, reminder state
  - Formula: progress = (currentWeekAvg / targetThrows) × 100 (capped)
  - Risk level: Low

## Other Derived Athlete Analytics
- `angular/src/app/core/services/training-safety.service.ts`
  - Functions: `calculateSleepDebt`, `calculateConsecutiveDays`, `loadWeeklyMovementTotals`
  - Inputs: sleep logs, training sessions
  - Outputs: sleep debt hours, training warnings
  - Formula: average sleep vs optimal, cumulative debt
  - Risk level: Medium

- `angular/src/app/core/services/phase-load-calculator.service.ts`
  - Functions: phase-specific load targets, ACWR zone guidance
  - Inputs: phase settings, ACWR thresholds
  - Outputs: target load recommendations
  - Formula: targets per phase + ACWR guidelines
  - Risk level: Medium
