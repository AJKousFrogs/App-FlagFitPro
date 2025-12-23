# Open Data Integration Guide

This guide explains the complete data pipeline for importing open-source sport-science datasets into FlagFit Pro, computing flag-football-specific metrics, and displaying ACWR (Acute:Chronic Workload Ratio) analysis.

## Overview

The system allows you to:

1. Import any open-source dataset (GPS samples, high-speed running logs, RPE logs)
2. Automatically compute flag-football-specific metrics
3. Store results in Supabase
4. Calculate ACWR using rolling averages
5. Display metrics in Angular components

## Architecture

### 1. Database Schema

**Sessions Table** (`database/migrations/031_open_data_sessions_system.sql`)

- Stores imported training sessions
- Fields: `athlete_id`, `date`, `rpe`, `total_volume`, `high_speed_distance`, `sprint_count`, `duration_minutes`
- Includes `raw_data` JSONB field for original dataset reference

**ACWR Function** (`database/migrations/032_acwr_compute_function.sql`)

- PostgreSQL stored procedure: `compute_acwr(athlete uuid)`
- Computes rolling 7-day (acute) and 28-day (chronic) averages
- Returns ACWR ratio for each session date

### 2. Backend (Netlify Functions)

**Import Open Data** (`netlify/functions/import-open-data.cjs`)

- Endpoint: `/api/import-open-data`
- Accepts: `{ athleteId, dataset }`
- Computes metrics using flag-football thresholds:
  - High-speed: >5.5 m/s
  - Sprint: >7.0 m/s
- Stores results in `sessions` table

**Compute ACWR** (`netlify/functions/compute-acwr.cjs`)

- Endpoint: `/api/compute-acwr`
- Accepts: `{ athleteId }`
- Calls PostgreSQL stored procedure
- Returns ACWR data for all sessions

**Training Metrics** (`netlify/functions/training-metrics.cjs`)

- Endpoint: `/api/training-metrics`
- Accepts: `athleteId` and optional `startDate` query params
- Returns flag-football metrics (total volume, high-speed distance, sprint count)

### 3. Frontend (Angular)

**TrainingMetricsService** (`angular/src/app/core/services/training-metrics.service.ts`)

- `getACWR(athleteId)` - Fetches ACWR calculations
- `importOpenDataset(athleteId, dataset)` - Imports dataset
- `get4WeekFlagMetrics(athleteId)` - Gets 4-week metrics

**FlagLoadComponent** (`angular/src/app/features/training/flag-load.component.ts`)

- Displays ACWR table with color-coded risk zones
- Shows 4-week trend chart (sprint count, high-speed distance, total volume)
- Input: `@Input() athleteId`

**ImportDatasetComponent** (`angular/src/app/features/training/import-dataset.component.ts`)

- UI for importing datasets
- Textarea for JSON input
- Validates and imports data
- Shows computed metrics after import

## Usage

### Step 1: Run Database Migrations

```bash
# Connect to your Supabase database and run:
psql $DATABASE_URL -f database/migrations/031_open_data_sessions_system.sql
psql $DATABASE_URL -f database/migrations/032_acwr_compute_function.sql
```

Or via Supabase SQL Editor:

1. Copy contents of `031_open_data_sessions_system.sql`
2. Paste into Supabase SQL Editor
3. Execute
4. Repeat for `032_acwr_compute_function.sql`

### Step 2: Deploy Netlify Functions

The functions are automatically deployed when you push to your repository. Ensure these environment variables are set in Netlify:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_ANON_KEY`

### Step 3: Use in Angular

**Display ACWR for an athlete:**

```typescript
<app-flag-load [athleteId]="'athlete-uuid-here'"></app-flag-load>
```

**Import a dataset:**

```typescript
<app-import-dataset></app-import-dataset>
```

**Programmatically import:**

```typescript
import { TrainingMetricsService } from './core/services/training-metrics.service';

constructor(private metrics: TrainingMetricsService) {}

async importData() {
  const dataset = [
    { speed_m_s: 6.1, distance_m: 3.2 },
    { speed_m_s: 7.8, distance_m: 2.9 },
    // ... more entries
  ];

  const result = await this.metrics.importOpenDataset('athlete-id', dataset);
  console.log('Imported:', result);
}
```

## Dataset Format

The system accepts datasets in this format:

```json
[
  { "speed_m_s": 6.1, "distance_m": 3.2 },
  { "speed_m_s": 7.8, "distance_m": 2.9 },
  { "speed": 5.2, "distance": 4.1 }
]
```

**Supported field names:**

- `speed_m_s` or `speed` (meters per second)
- `distance_m` or `distance` (meters)

## ACWR Risk Zones

- **< 0.80** (Orange): Under-training - insufficient conditioning
- **0.80-1.30** (Green): Sweet spot - optimal, lowest injury risk
- **1.30-1.50** (Yellow): Elevated risk - caution needed
- **> 1.50** (Red): Danger zone - highest injury risk

## Flag-Football Thresholds

- **High-speed running**: >5.5 m/s
- **Sprint efforts**: >7.0 m/s

These thresholds are optimized for flag-football movement patterns.

## API Endpoints

### POST `/api/import-open-data`

```json
{
  "athleteId": "uuid",
  "dataset": [{ "speed_m_s": 6.1, "distance_m": 3.2 }]
}
```

### POST `/api/compute-acwr`

```json
{
  "athleteId": "uuid"
}
```

### GET `/api/training-metrics?athleteId=uuid&startDate=2024-01-01`

## Files Created

### Database

- `database/migrations/031_open_data_sessions_system.sql`
- `database/migrations/032_acwr_compute_function.sql`

### Backend

- `netlify/functions/import-open-data.cjs`
- `netlify/functions/compute-acwr.cjs`
- `netlify/functions/training-metrics.cjs`

### Frontend

- `angular/src/app/core/services/training-metrics.service.ts`
- `angular/src/app/features/training/flag-load.component.ts`
- `angular/src/app/features/training/import-dataset.component.ts`

### Configuration

- Updated `netlify.toml` with new API routes

## Next Steps

1. Run the database migrations
2. Deploy to Netlify (functions will be deployed automatically)
3. Add the components to your Angular routes
4. Test with sample data
5. Fill in RPE values post-session for accurate ACWR calculations

## Notes

- RPE (Rate of Perceived Exertion) defaults to 0 on import and should be filled post-session
- The system assumes 1 Hz sampling rate for duration estimation
- All metrics are stored in meters
- The ACWR calculation uses RPE × duration_minutes as the load metric
