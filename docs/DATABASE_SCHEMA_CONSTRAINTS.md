# Database Schema & Constraints Specification

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ Implementation Guide

---

## Overview

This document defines the complete database schema with required fields, constraints, unique indexes, foreign keys, soft delete rules, audit fields, and expected row volume.

---

## Core Tables

### `profiles` (User Profiles)

**Purpose**: Extended user profile information

**Schema:**

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role_global VARCHAR(50) NOT NULL DEFAULT 'player' CHECK (role_global IN ('player', 'coach', 'admin')),
  height_cm INTEGER CHECK (height_cm > 0 AND height_cm < 300),
  weight_kg DECIMAL(5,2) CHECK (weight_kg > 0 AND weight_kg < 500),
  dob DATE CHECK (dob < CURRENT_DATE),
  email_normalized VARCHAR(255) NOT NULL, -- Normalized email (lowercase, trimmed)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Constraints
CREATE UNIQUE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE UNIQUE INDEX idx_profiles_email_normalized ON profiles(email_normalized);
CREATE INDEX idx_profiles_role_global ON profiles(role_global);

-- Audit trigger
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Required Fields:**

- `user_id` (FK to auth.users)
- `role_global`
- `email_normalized`

**Constraints:**

- `user_id` unique (one profile per user)
- `email_normalized` unique
- `role_global` must be one of: 'player', 'coach', 'admin'
- `height_cm` and `weight_kg` must be positive

**Expected Volume:** 1 row per user (~10,000 users = 10,000 rows)

---

### `teams`

**Purpose**: Team information

**Schema:**

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  league VARCHAR(100),
  season VARCHAR(50),
  home_city VARCHAR(100),
  description TEXT,
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  logo_url VARCHAR(500),
  primary_color VARCHAR(7), -- Hex color code
  secondary_color VARCHAR(7), -- Hex color code
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Constraints
CREATE UNIQUE INDEX idx_teams_name_unique ON teams(name) WHERE deleted_at IS NULL; -- Optional: unique name per active team
CREATE INDEX idx_teams_coach_id ON teams(coach_id);
CREATE INDEX idx_teams_deleted_at ON teams(deleted_at) WHERE deleted_at IS NULL;
```

**Required Fields:**

- `name`
- `coach_id`

**Constraints:**

- `name` unique per active team (if enforced)
- `coach_id` must reference valid user

**Soft Delete:** Yes (`deleted_at`)

**Expected Volume:** ~1,000 teams

---

### `team_members`

**Purpose**: Team membership with roles

**Schema:**

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_team VARCHAR(50) NOT NULL DEFAULT 'player' CHECK (role_team IN ('coach', 'assistant_coach', 'player')),
  position VARCHAR(50),
  jersey_number INTEGER CHECK (jersey_number > 0 AND jersey_number < 100),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Constraints
CREATE UNIQUE INDEX idx_team_members_unique ON team_members(team_id, user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(role_team);
CREATE INDEX idx_team_members_status ON team_members(status);
```

**Required Fields:**

- `team_id`
- `user_id`
- `role_team`
- `status`

**Constraints:**

- `(team_id, user_id)` unique per active membership
- `role_team` must be one of: 'coach', 'assistant_coach', 'player'
- `status` must be one of: 'active', 'inactive', 'suspended'
- `jersey_number` must be between 1 and 99

**Soft Delete:** Yes (`deleted_at`)

**Expected Volume:** ~20,000 memberships (20 players per team × 1,000 teams)

---

### `team_invitations`

**Purpose**: Team invitation system

**Schema:**

```sql
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  email_normalized VARCHAR(255) NOT NULL, -- Normalized email
  role_team VARCHAR(50) NOT NULL DEFAULT 'player' CHECK (role_team IN ('coach', 'assistant_coach', 'player')),
  position VARCHAR(50),
  jersey_number INTEGER CHECK (jersey_number > 0 AND jersey_number < 100),
  token_hash VARCHAR(255) NOT NULL UNIQUE, -- Hashed invitation token
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
CREATE UNIQUE INDEX idx_team_invitations_pending ON team_invitations(team_id, email_normalized)
  WHERE status = 'pending';
CREATE INDEX idx_team_invitations_team_id ON team_invitations(team_id);
CREATE INDEX idx_team_invitations_email ON team_invitations(email_normalized);
CREATE INDEX idx_team_invitations_token_hash ON team_invitations(token_hash);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);
CREATE INDEX idx_team_invitations_expires_at ON team_invitations(expires_at);
```

**Required Fields:**

- `team_id`
- `email_normalized`
- `token_hash`
- `status`
- `expires_at`
- `invited_by`

**Constraints:**

- `(team_id, email_normalized)` unique where `status = 'pending'`
- `token_hash` unique
- `status` must be one of: 'pending', 'accepted', 'expired', 'revoked'
- `expires_at` must be in the future when created

**Expected Volume:** ~5,000 invitations (5 per team × 1,000 teams)

---

### `training_programs`

**Purpose**: Training program templates

**Schema:**

```sql
CREATE TABLE training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date > start_date),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  is_active BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1, -- Version for immutability tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Constraints
CREATE INDEX idx_training_programs_position ON training_programs(position_id);
CREATE INDEX idx_training_programs_active ON training_programs(is_active) WHERE deleted_at IS NULL;
CREATE INDEX idx_training_programs_created_by ON training_programs(created_by);
CREATE INDEX idx_training_programs_dates ON training_programs(start_date, end_date);
```

**Required Fields:**

- `name`
- `start_date`
- `end_date`
- `created_by`

**Constraints:**

- `end_date` must be after `start_date`
- `version` increments on updates (if immutability enforced)

**Soft Delete:** Yes (`deleted_at`)

**Expected Volume:** ~500 programs

---

### `program_assignments`

**Purpose**: Assign programs to players

**Schema:**

```sql
CREATE TABLE program_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES training_programs(id) ON DELETE RESTRICT,
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active_from DATE NOT NULL,
  active_to DATE CHECK (active_to IS NULL OR active_to > active_from),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
CREATE UNIQUE INDEX idx_program_assignments_active ON program_assignments(player_id, program_id)
  WHERE status = 'active' AND (active_to IS NULL OR active_to >= CURRENT_DATE);
CREATE INDEX idx_program_assignments_player ON program_assignments(player_id);
CREATE INDEX idx_program_assignments_program ON program_assignments(program_id);
CREATE INDEX idx_program_assignments_status ON program_assignments(status);
CREATE INDEX idx_program_assignments_dates ON program_assignments(active_from, active_to);
```

**Required Fields:**

- `program_id`
- `player_id`
- `assigned_by`
- `active_from`
- `status`

**Constraints:**

- Only one active assignment per `(player_id, program_id)` at a time
- `active_to` must be after `active_from` if provided
- `status` must be one of: 'active', 'paused', 'completed', 'cancelled'

**Expected Volume:** ~10,000 assignments (20 players × 500 programs)

---

### `workout_logs`

**Purpose**: Completed workout sessions

**Schema:**

```sql
CREATE TABLE workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
  planned_date DATE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  rpe DECIMAL(3,1) NOT NULL CHECK (rpe >= 1 AND rpe <= 10),
  notes TEXT,
  is_late BOOLEAN GENERATED ALWAYS AS (planned_date IS NOT NULL AND DATE(completed_at) > planned_date) STORED,
  is_early BOOLEAN GENERATED ALWAYS AS (planned_date IS NOT NULL AND DATE(completed_at) < planned_date) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Constraints
CREATE INDEX idx_workout_logs_player ON workout_logs(player_id);
CREATE INDEX idx_workout_logs_completed_at ON workout_logs(completed_at);
CREATE INDEX idx_workout_logs_planned_date ON workout_logs(planned_date);
CREATE INDEX idx_workout_logs_player_date ON workout_logs(player_id, DATE(completed_at));
```

**Required Fields:**

- `player_id`
- `completed_at`
- `duration_minutes`
- `rpe`

**Constraints:**

- `duration_minutes` must be positive
- `rpe` must be between 1 and 10

**Expected Volume:** ~500,000 logs (50 workouts per player per year × 10,000 players)

---

### `exercise_logs`

**Purpose**: Individual exercise performance within workouts

**Schema:**

```sql
CREATE TABLE exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  session_exercise_id UUID REFERENCES session_exercises(id) ON DELETE SET NULL,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  exercise_version INTEGER DEFAULT 1, -- Version of exercise at time of logging
  prescribed_json JSONB, -- Prescribed parameters
  actual_json JSONB NOT NULL, -- Actual performance data
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
CREATE INDEX idx_exercise_logs_workout ON exercise_logs(workout_log_id);
CREATE INDEX idx_exercise_logs_exercise ON exercise_logs(exercise_id);
CREATE INDEX idx_exercise_logs_exercise_version ON exercise_logs(exercise_id, exercise_version);
```

**Required Fields:**

- `workout_log_id`
- `exercise_id`
- `actual_json`

**Expected Volume:** ~2,500,000 logs (5 exercises per workout × 500,000 workouts)

---

### `load_daily`

**Purpose**: Daily training load aggregation

**Schema:**

```sql
CREATE TABLE load_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  daily_load INTEGER NOT NULL CHECK (daily_load >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
CREATE UNIQUE INDEX idx_load_daily_unique ON load_daily(player_id, date);
CREATE INDEX idx_load_daily_player ON load_daily(player_id);
CREATE INDEX idx_load_daily_date ON load_daily(date);
CREATE INDEX idx_load_daily_player_date_range ON load_daily(player_id, date);
```

**Required Fields:**

- `player_id`
- `date`
- `daily_load`

**Constraints:**

- `(player_id, date)` unique
- `daily_load` must be non-negative

**Expected Volume:** ~3,650,000 rows (365 days × 10,000 players)

---

### `load_metrics`

**Purpose**: ACWR and load metrics

**Schema:**

```sql
CREATE TABLE load_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  acute_7 DECIMAL(10,2) CHECK (acute_7 >= 0),
  chronic_28 DECIMAL(10,2) CHECK (chronic_28 >= 0),
  acwr DECIMAL(5,2) CHECK (acwr IS NULL OR acwr >= 0),
  risk_level VARCHAR(20) CHECK (risk_level IN ('baseline_building', 'baseline_low', 'low', 'optimal', 'moderate', 'high')),
  baseline_days INTEGER CHECK (baseline_days >= 0 AND baseline_days <= 28),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
CREATE UNIQUE INDEX idx_load_metrics_unique ON load_metrics(player_id, date);
CREATE INDEX idx_load_metrics_player ON load_metrics(player_id);
CREATE INDEX idx_load_metrics_date ON load_metrics(date);
CREATE INDEX idx_load_metrics_acwr ON load_metrics(acwr) WHERE acwr IS NOT NULL;
CREATE INDEX idx_load_metrics_risk ON load_metrics(risk_level);
```

**Required Fields:**

- `player_id`
- `date`

**Constraints:**

- `(player_id, date)` unique
- `baseline_days` must be between 0 and 28
- `risk_level` must be one of: 'baseline_building', 'baseline_low', 'low', 'optimal', 'moderate', 'high'

**Expected Volume:** ~3,650,000 rows (365 days × 10,000 players)

---

### `exercise_library`

**Purpose**: Exercise library with versioning

**Schema:**

```sql
CREATE TABLE exercise_library (
  id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  default_params_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, version)
);

-- Constraints
CREATE UNIQUE INDEX idx_exercise_library_id_version ON exercise_library(id, version);
CREATE INDEX idx_exercise_library_name ON exercise_library(name);
CREATE INDEX idx_exercise_library_category ON exercise_library(category);
```

**Required Fields:**

- `id`
- `version`
- `name`

**Constraints:**

- `(id, version)` unique (immutable per version)
- New versions created instead of updates

**Expected Volume:** ~1,000 exercises × 3 versions = 3,000 rows

---

### `tournaments`

**Purpose**: Tournament information

**Schema:**

```sql
CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL CHECK (end_date > start_date),
  location VARCHAR(255),
  registration_deadline DATE NOT NULL CHECK (registration_deadline <= start_date),
  max_teams INTEGER CHECK (max_teams > 0),
  entry_fee DECIMAL(10,2) CHECK (entry_fee >= 0),
  is_public BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status VARCHAR(50) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Constraints
CREATE INDEX idx_tournaments_dates ON tournaments(start_date, end_date);
CREATE INDEX idx_tournaments_status ON tournaments(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tournaments_public ON tournaments(is_public) WHERE deleted_at IS NULL;
CREATE INDEX idx_tournaments_created_by ON tournaments(created_by);
```

**Required Fields:**

- `name`
- `start_date`
- `end_date`
- `registration_deadline`
- `created_by`
- `status`

**Constraints:**

- `end_date` must be after `start_date`
- `registration_deadline` must be before or equal to `start_date`
- `status` must be one of: 'upcoming', 'active', 'completed', 'cancelled'

**Soft Delete:** Yes (`deleted_at`)

**Expected Volume:** ~500 tournaments

---

### `tournament_registrations`

**Purpose**: Team tournament registrations

**Schema:**

```sql
CREATE TABLE tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(50) NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'withdrawn', 'disqualified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
CREATE UNIQUE INDEX idx_tournament_registrations_unique ON tournament_registrations(tournament_id, team_id);
CREATE INDEX idx_tournament_registrations_tournament ON tournament_registrations(tournament_id);
CREATE INDEX idx_tournament_registrations_team ON tournament_registrations(team_id);
CREATE INDEX idx_tournament_registrations_status ON tournament_registrations(status);
```

**Required Fields:**

- `tournament_id`
- `team_id`
- `registered_at`
- `status`

**Constraints:**

- `(tournament_id, team_id)` unique
- `status` must be one of: 'registered', 'withdrawn', 'disqualified'

**Expected Volume:** ~5,000 registrations (10 teams per tournament × 500 tournaments)

---

### `analytics_events`

**Purpose**: Raw analytics events (short retention)

**Schema:**

```sql
CREATE TABLE analytics_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB,
  session_id VARCHAR(255) NOT NULL,
  page_url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id);

-- Partitioning (optional, for high volume)
-- CREATE TABLE analytics_events_2025_01 PARTITION OF analytics_events
--   FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

**Required Fields:**

- `event_type`
- `session_id`
- `created_at`

**Retention:** 90 days (automated cleanup)

**Expected Volume:** ~10,000,000 events per month (100 events per user per month × 10,000 users)

---

### `analytics_aggregates`

**Purpose**: Aggregated analytics (long retention)

**Schema:**

```sql
CREATE TABLE analytics_aggregates (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  aggregation_type VARCHAR(50) NOT NULL CHECK (aggregation_type IN ('daily', 'weekly', 'monthly')),
  aggregation_date DATE NOT NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Constraints
CREATE UNIQUE INDEX idx_analytics_aggregates_unique ON analytics_aggregates(user_id, team_id, aggregation_type, aggregation_date);
CREATE INDEX idx_analytics_aggregates_user ON analytics_aggregates(user_id);
CREATE INDEX idx_analytics_aggregates_team ON analytics_aggregates(team_id);
CREATE INDEX idx_analytics_aggregates_date ON analytics_aggregates(aggregation_date);
```

**Required Fields:**

- `aggregation_type`
- `aggregation_date`
- `metrics`

**Constraints:**

- `(user_id, team_id, aggregation_type, aggregation_date)` unique
- `aggregation_type` must be one of: 'daily', 'weekly', 'monthly'

**Retention:** Indefinite

**Expected Volume:** ~300,000 rows per year (30 daily aggregates × 10,000 users)

---

## Role Model

### Global Roles (`profiles.role_global`)

- `player`: Default role, can train and participate
- `coach`: Can create teams, assign programs, view team data
- `admin`: Platform administrator, full access

### Team-Scoped Roles (`team_members.role_team`)

- `coach`: Full team management
- `assistant_coach`: Can manage players, view analytics
- `player`: Standard team member

### Precedence Rule

1. **Team context**: `team_members.role_team` takes precedence
2. **Global context**: `profiles.role_global` applies
3. **Admin override**: `profiles.role_global = 'admin'` bypasses team restrictions

---

## Audit Fields

All tables include:

- `created_at`: Timestamp of creation
- `updated_at`: Timestamp of last update (auto-updated via trigger)
- `created_by`: User who created the record (if applicable)
- `updated_by`: User who last updated the record (if applicable)

**Trigger Function:**

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Soft Delete Pattern

Tables with soft delete include:

- `deleted_at TIMESTAMPTZ`: NULL = active, timestamp = deleted

**Query Pattern:**

```sql
-- Active records only
SELECT * FROM teams WHERE deleted_at IS NULL;

-- Include deleted
SELECT * FROM teams;
```

---

## Related Documentation

- [RLS_POLICY_SPECIFICATION.md](./RLS_POLICY_SPECIFICATION.md) - RLS policy details
- [database/schema.sql](../database/schema.sql) - Full schema SQL
