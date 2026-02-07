# Calculation Specification

This document describes calculation formulas, window assumptions, missing-data handling, and rounding rules. Example values reference Fixture A in `angular/src/testing/athlete-fixtures`.

## Training Load (Session)
- Formula: `load = RPE × duration_minutes`
- Missing data: defaults handled at call sites (often RPE=5, duration=60).
- Rounding: none (integer arithmetic).
- Example (Fixture A, 2026-01-28): RPE 6 × 60 min = `360` load.

## Weekly Training Volume (Client-Side)
- Source: `angular/src/app/core/services/training-stats-calculation.service.ts`
- Week boundary: ISO week start (Monday) to Sunday.
- Load per session: `duration_minutes × rpe` (fallbacks: duration 0, rpe 5).
- Outputs:
  - `totalLoad`: sum of session loads (rounded)
  - `totalDuration`: sum of durations (rounded)
  - `sessionCount`: count of sessions in week
  - `avgIntensity`: average rpe (1 decimal)
- Example (Fixture A, week of 2026-01-26): 4 sessions → totalLoad `1295`, totalDuration `235`, avgIntensity `5.5`, weekEnd `2026-02-01` (UTC).

## Training Stats Aggregation (Client-Side)
- Source: `angular/src/app/core/services/training-stats.service.ts`
- Week boundary: Sunday start (uses `getDay()`), week = Sunday → Saturday.
- Month boundary: first day of current month (local time).
- Weekly metrics:
  - `weeklyVolume`: sum of `workload`
  - `weeklyDuration`: sum of `duration_minutes`
  - `weeklyAvgIntensity`: average `intensity_level`, 1 decimal
- Streak:
  - Active if trained today or yesterday
  - Requires consecutive daily training (no gaps) for streak to grow

## Sleep Debt & Safety Limits
- Source: `angular/src/app/core/services/training-safety.service.ts`
- Sleep debt:
  - `average = mean(last 7 days)`
  - `debt = max(0, (optimalSleep − average) × days)`
  - Debt levels: mild `>= 3`, moderate `>= 7`, severe `>= 14`
  - Training impact: `max(0.5, 1 − debt × 0.03)` rounded to 2 decimals
  - Days to recover: `ceil(debt)`
- Age-based limits:
  - Age groups: youth `<18`, adult `<35`, masters `<45`, senior `>=45`
  - Movement limits scaled by `recoveryTimeMultiplier` for masters/senior

## Next-Gen Metrics (Phase 1 Utilities)
- Source: `angular/src/app/core/utils/next-gen-metrics.ts`
- Load spike:
  - Acute load = sum of last 7 days
  - Prior load = sum of days 7–13 ago
  - Spike if > 15% week-over-week
  - Wellness integration via subjective score (0–100)
- Baseline readiness:
  - Uses z-score deviation against athlete baseline
  - Score = `70 + weightedZ × 10`, clamped 0–100
  - Reduced mode uses sleep + energy only
- LBM trend:
  - Compare current vs ~30 days prior (±7-day window)
  - Loss alert if change ≤ −1% or ≤ −0.5 kg

## ACWR (Acute:Chronic Workload Ratio)
- Source: `angular/src/app/core/services/acwr.service.ts`
- Acute window: 7 days (EWMA).
- Chronic window: 28 days (EWMA) with min chronic floor.
- Formula:
  - EWMA: `EWMA_today = λ × load_today + (1 − λ) × EWMA_yesterday`
  - `acute = EWMA(loads, λ_acute, 7)`
  - `chronic = max(EWMA(loads, λ_chronic, 28), minChronicLoad)`
  - `ACWR = acute ÷ chronic` (safe divide, precision rounding)
- Missing days: missing sessions treated as load `0` for that day.
- Insufficient data: ACWR returns `0` if days with data < minDaysForChronic or sessions < minSessionsForChronic.
- Rounding: `roundToPrecision` using `ACWR_PRECISION` (2 decimals).
- Example (Fixture A, last 7 days ending 2026-01-28):
  - Last 7 daily loads: `[360, 300, 275, 360, 300, 325, 360]`
  - Acute EWMA (λ=0.2): `~335.82`
  - Chronic EWMA (λ=0.05, 28 days): `~333.01`
  - ACWR ≈ `1.01`

## Acute / Chronic Windows (Configuration)
- Source: `angular/src/app/core/config/evidence-config.ts`, `angular/src/app/core/config/evidence-presets.ts`
- Acute window default: 7 days
- Chronic window default: 28 days
- Lambda defaults: acute `0.2`, chronic `0.05`
- Minimum chronic load floor: preset-dependent (default 50 AU)

## Readiness Scoring (Netlify Function)
- Source: `netlify/functions/calc-readiness.cjs` `/api/calc-readiness`
- Base score: 70
- Wellness adjustments:
  - `sleep`: `(sleep − 5) × 3`
  - `energy`: `(energy − 5) × 3`
  - `stress`: `(stress − 5) × 2` (subtract)
  - `soreness`: `(soreness − 5) × 2` (subtract)
  - `motivation`: `(motivation − 5) × 2`
- Weekly load adjustments:
  - if weeklyLoad > 3000: score −10
  - if weeklyLoad < 1000: score +5
- Clamp: `0–100` and round to integer.
- Missing data: if no wellness and no sessions => return `null` data with message.
- Example (Fixture A wellness-style values): sleep 8, energy 7, stress 3, soreness 3, motivation 7:
  - Adjustment = `(3×3) + (2×3) − (−2×2) − (−2×2) + (2×2)` = `9 + 6 + 4 + 4 + 4 = 27`
  - Score ≈ `97` before load adjustment.

## Wellness Score (Client-Side)
- Source: `angular/src/app/core/services/wellness.service.ts`
- Formula: average of available metrics, with stress/soreness inverted:
  - `score = mean([sleep, energy, (10−stress), (10−soreness), motivation, mood, hydration])`
- Missing data: metrics that are `null/undefined` are excluded; if none exist, score `0`.
- Rounding: 1 decimal.
- Example (Fixture A, day 1):
  - Metrics: sleep 8, energy 7, stress 3 → 7, soreness 3 → 7, mood 7, hydration 8
  - Average = `(8+7+7+7+7+8)/6 = 7.33` → `7.3`

## Wellness Averages (Client-Side)
- Source: `angular/src/app/core/services/wellness.service.ts`
- Formula: per-metric mean for each wellness field (sleep, energy, stress, soreness, motivation, mood, hydration).
- Missing data: metrics that are `null/undefined` are excluded from that metric’s average.
- Rounding: 1 decimal per metric.
- Example (Fixture A, 14 entries):
  - sleep `7.5`, energy `7.0`, stress `3.7`, soreness `3.5`, mood `7.0`, hydration `7.5`

## Readiness Score (Client-Side Wellness Only)
- Source: `angular/src/app/core/services/load-monitoring.service.ts`
- Required inputs: `sleepQuality`, `energyLevel` (returns `null` if either missing)
- Optional inputs: `stressLevel`, `muscleSoreness` (inverted)
- Full formula (with stress + soreness):
  - `sleepScore = (sleepQuality / 10) × 100`
  - `energyScore = (energyLevel / 10) × 100`
  - `stressScore = ((10 − stressLevel) / 10) × 100`
  - `sorenessScore = ((10 − muscleSoreness) / 10) × 100`
  - `score = sleepScore*0.3 + energyScore*0.25 + stressScore*0.25 + sorenessScore*0.2`
- Reduced formulas:
  - Sleep + energy + stress only: `sleep*0.375 + energy*0.3125 + stress*0.3125`
  - Sleep + energy + soreness only: `sleep*0.4 + energy*0.333 + soreness*0.267`
  - Sleep + energy only: `sleep*0.55 + energy*0.45`
- Rounding: `Math.round`, clamped 0–100.
- Example (Fixture A, day 1): sleep 8, energy 7, stress 3, soreness 3 → `73`

## Readiness Level Classification (Client-Side)
- Source: `angular/src/app/core/services/readiness.service.ts`
- Cut-points: `lowMax`, `moderateMax` from evidence config (defaults: 55, 75).
- Levels:
  - `low` if score < lowMax
  - `moderate` if score ≥ lowMax and ≤ moderateMax
  - `high` if score > moderateMax
- Suggestions:
  - `deload` if score < lowMax
  - `maintain` if score ≥ lowMax and ≤ moderateMax
  - `push` if score > moderateMax
- Color classes:
  - `text-red-600` for low
  - `text-yellow-600` for moderate
  - `text-green-600` for high

## Bodyweight Change & Trend
- Source: `angular/src/app/core/services/body-weight-load.service.ts`
- Weekly change:
  - `weeklyChange = currentWeight − weight_~7_days_ago`
  - `weeklyChangePercent = weeklyChange / weight_~7_days_ago × 100`
- Monthly change: same with ~30 days ago.
- Trend:
  - `gaining` if weeklyChange > 0.5 kg
  - `losing` if weeklyChange < −0.5 kg
  - `stable` otherwise
- Missing data: if fewer than 2 entries => trend stable with recommendation to log weight.
- Example (Fixture A, 2026-01-28):
  - Current = 80.4 kg, week-ago (2026-01-21) = 80.1 kg
  - Weekly change = `+0.3 kg`, trend = `stable`

## BMI
- Sources:
  - `angular/src/app/core/services/body-composition.service.ts`
  - `angular/src/app/core/services/performance-data.service.ts`
- Formula: `BMI = weight_kg / (height_m^2)` rounded to 1 decimal.
- Categories:
  - `< 18.5`: Underweight
  - `18.5 – < 25`: Normal
  - `25 – < 30`: Overweight
  - `>= 30`: Obese

## Lean Body Mass
- Source: `angular/src/app/core/services/performance-data.service.ts`
- Formula: `LBM = weight × (1 − bodyFat%)`, rounded to 1 decimal.
- Body composition service guard: if `bodyFat` is < 0 or > 100, return `weight` unchanged.

## QB Throwing Metrics
- Source: `angular/src/app/features/training/qb-throwing-tracker/qb-throwing-tracker.component.ts`
- Progress percent: `min(100, round(currentWeekAvg / targetThrows × 100))`
- Bar height: `min(100, max(15, throws / 800 × 100))`

## Performance Score (Dashboard)
- Source: `netlify/functions/dashboard.cjs`
- Formula: `performanceScore = 100 − (avgRpe − 5) × 10` (clamped 0–100).

## Trend Aggregations (Performance / Analytics)
- Sources:
  - `netlify/functions/analytics.cjs`
  - `netlify/functions/performance-data.cjs`
- Formula: averages of `performance_score` values with rounding to 1 decimal.

## Regression Protection
- If any formula changes:
  - Run calculation tests
  - Compare outputs with fixtures
  - Document changes and update expected values/spec
