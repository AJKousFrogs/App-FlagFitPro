# Database Refactor - Quick Reference Card

> **Scope:** This document applies after migrations 070–072 and assumes familiarity with the training database, load management (ACWR), and program compliance concepts. See `README-TRAINING-DATABASE.md` for domain fundamentals.

## 🚀 For Developers: What Changed & What to Do

### 📌 TL;DR

Your database schema just got a major upgrade. Exercise library is unified, metrics are typed, and ACWR is now versioned. Update your queries or use the compatibility views provided.

### ⚠️ Why This Refactor Matters for Safety

This refactor isn't just about performance - it directly improves **data safety and injury prevention**:

- **Typed metrics** → Eliminates garbage data that corrupts ACWR calculations
- **Baseline-aware risk levels** → Prevents false alarms during ramp-up periods
- **Views enforce calculations** → Impossible to compute compliance or ACWR incorrectly
- **Versioned ACWR** → Audit trail for safety-critical decisions
- **Domain constraints** → Database rejects invalid RPE, negative durations, etc.

**Bottom line:** Bad data can lead to incorrect injury risk assessment. This refactor makes that impossible at the database level.

---

## 🔄 Query Changes

### 1. Exercise Queries

#### ❌ OLD WAY (Deprecated)

```typescript
// Multiple queries for different exercise types
const plyoExercises = await supabase.from("plyometrics_exercises").select("*");

const isoExercises = await supabase.from("isometrics_exercises").select("*");

const allExercises = [...plyoExercises.data, ...isoExercises.data];
```

#### ✅ NEW WAY (Recommended)

```typescript
// Single query with unified ID space
const { data: exercises } = await supabase
  .from("exercise_registry")
  .select(
    `
    *,
    plyometric_details:plyometrics_exercises(*),
    isometric_details:isometrics_exercises(*),
    general_details:exercises(*)
  `,
  )
  .eq("is_active", true)
  .eq("is_public", true);
```

#### 🔧 BACKWARD COMPATIBLE

```typescript
// Old tables still exist and work
// But use exercise_registry for new code
```

---

### 2. Compliance Rate Queries

#### ❌ OLD WAY (Broken)

```typescript
const { data } = await supabase
  .from("player_programs")
  .select("compliance_rate")
  .eq("player_id", playerId)
  .single();

// Column 'compliance_rate' no longer exists!
```

#### ✅ NEW WAY (Required)

```typescript
const { data } = await supabase
  .from("v_player_program_compliance")
  .select("compliance_rate, total_planned_sessions, completed_sessions")
  .eq("player_id", playerId)
  .single();

// Real-time calculation, always accurate
```

---

### 3. Metric Tracking

#### ❌ OLD WAY (Deprecated)

```typescript
await supabase.from("position_specific_metrics").insert({
  player_id: playerId,
  metric_name: "Throwing Volume",
  metric_value: 150,
  metric_unit: "Throws",
  date: new Date(),
});
```

#### ✅ NEW WAY (Type-safe)

```typescript
// Step 1: Get metric definition ID (cache this!)
const { data: metricDef } = await supabase
  .from("metric_definitions")
  .select("id")
  .eq("code", "qb_throwing_volume")
  .single();

// Step 2: Insert metric entry
await supabase.from("metric_entries").insert({
  player_id: playerId,
  metric_definition_id: metricDef.id,
  value: 150,
  date: new Date().toISOString().split("T")[0],
});
```

#### 🔧 BACKWARD COMPATIBLE (View)

```typescript
// For gradual migration, use legacy view
const { data } = await supabase
  .from("v_position_specific_metrics_legacy")
  .select("*")
  .eq("player_id", playerId);

// Works like old table, but reads from new system
```

---

### 4. ACWR and Risk Level

#### ⚠️ IMPORTANT CHANGE

```typescript
// Risk level is now computed in a view
const { data } = await supabase
  .from("v_load_monitoring")
  .select("acwr, computed_risk_level, baseline_days")
  .eq("player_id", playerId)
  .order("date", { ascending: false })
  .limit(1);

// computed_risk_level accounts for baseline days
// 'Baseline_Building' = < 7 days
// 'Baseline_Low' = 7-27 days
// Then normal risk levels after 28 days
```

---

## 🎯 New TypeScript Types

### Update Your Types

```typescript
// New ENUMs to add
export type DifficultyLevel =
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Elite";

export type SessionType =
  | "Strength"
  | "Speed"
  | "Skill"
  | "Recovery"
  | "Mobility"
  | "Conditioning"
  | "Position-Specific";

export type RiskLevel =
  | "Low"
  | "Optimal"
  | "Moderate"
  | "High"
  | "Critical"
  | "Baseline_Building"
  | "Baseline_Low";

export type ExerciseType =
  | "plyometric"
  | "isometric"
  | "strength"
  | "skill"
  | "mobility";

export type ProgramStatus = "active" | "paused" | "completed" | "archived";

// New table interfaces
export interface ExerciseRegistry {
  id: string;
  name: string;
  exercise_type: ExerciseType;
  category: string;
  difficulty_level: DifficultyLevel;
  description: string;
  video_url?: string;
  is_active: boolean;
  is_public: boolean;
  // ... more fields
}

export interface MetricDefinition {
  id: string;
  code: string;
  display_name: string;
  value_type: "integer" | "decimal" | "percent" | "time" | "boolean";
  unit?: string;
  min_value?: number;
  max_value?: number;
  aggregation_method?: "sum" | "avg" | "max" | "min" | "count";
  position_id?: string;
  is_position_specific: boolean;
}

export interface MetricEntry {
  id: string;
  player_id: string;
  workout_log_id?: string;
  metric_definition_id: string;
  date: string;
  value: number;
  notes?: string;
}
```

---

## 🛠️ Common Patterns

### Pattern 1: Load Exercises with Details

```typescript
async function loadExerciseLibrary(filters: {
  type?: ExerciseType;
  difficulty?: DifficultyLevel;
  category?: string;
}) {
  let query = supabase
    .from("exercise_registry")
    .select(
      `
      id,
      name,
      exercise_type,
      difficulty_level,
      category,
      description,
      video_url,
      plyometric_details:plyometrics_exercises(
        coaching_cues,
        safety_notes,
        intensity_level
      ),
      isometric_details:isometrics_exercises(
        hold_duration_seconds,
        sets,
        reps
      )
    `,
    )
    .eq("is_active", true);

  if (filters.type) query = query.eq("exercise_type", filters.type);
  if (filters.difficulty)
    query = query.eq("difficulty_level", filters.difficulty);
  if (filters.category) query = query.eq("category", filters.category);

  const { data, error } = await query;
  return { exercises: data, error };
}
```

### Pattern 2: Track Player Metric

```typescript
async function trackMetric(
  playerId: string,
  metricCode: string,
  value: number,
  workoutLogId?: string,
) {
  // Get metric definition (cache this in production!)
  const { data: metricDef } = await supabase
    .from("metric_definitions")
    .select("id, min_value, max_value")
    .eq("code", metricCode)
    .single();

  if (!metricDef) {
    throw new Error(`Metric ${metricCode} not found`);
  }

  // Validate value
  if (metricDef.min_value !== null && value < metricDef.min_value) {
    throw new Error(`Value below minimum (${metricDef.min_value})`);
  }
  if (metricDef.max_value !== null && value > metricDef.max_value) {
    throw new Error(`Value above maximum (${metricDef.max_value})`);
  }

  // Insert metric entry
  const { data, error } = await supabase.from("metric_entries").insert({
    player_id: playerId,
    metric_definition_id: metricDef.id,
    value,
    date: new Date().toISOString().split("T")[0],
    workout_log_id: workoutLogId,
  });

  return { data, error };
}
```

### Pattern 3: Get Player Compliance

```typescript
async function getPlayerCompliance(playerId: string, programId: string) {
  const { data, error } = await supabase
    .from("v_player_program_compliance")
    .select("*")
    .eq("player_id", playerId)
    .eq("program_id", programId)
    .single();

  return {
    complianceRate: data?.compliance_rate || 0,
    plannedSessions: data?.total_planned_sessions || 0,
    completedSessions: data?.completed_sessions || 0,
    calculatedAt: data?.calculated_at,
  };
}
```

### Pattern 4: Check ACWR Status

```typescript
async function checkACWRStatus(playerId: string) {
  const { data, error } = await supabase
    .from("v_load_monitoring")
    .select("*")
    .eq("player_id", playerId)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  if (!data) {
    return {
      status: "no_data",
      message: "No training data yet",
    };
  }

  // Handle baseline building
  if (data.baseline_days < 7) {
    return {
      status: "baseline_building",
      message: `Building baseline (${data.baseline_days}/28 days)`,
      acwr: null,
    };
  }

  if (data.baseline_days < 28) {
    return {
      status: "baseline_low",
      message: `Partial baseline (${data.baseline_days}/28 days)`,
      acwr: data.acwr,
      riskLevel: data.computed_risk_level,
    };
  }

  // Full ACWR available
  return {
    status: "ready",
    acwr: data.acwr,
    riskLevel: data.computed_risk_level,
    acute: data.acute_load,
    chronic: data.chronic_load,
  };
}
```

---

## 🔍 Debugging

### Check Bootstrap Status

```sql
SELECT * FROM verify_database_bootstrap();
```

### Verify Exercise Registry

```sql
-- Count by type
SELECT exercise_type, COUNT(*)
FROM exercise_registry
GROUP BY exercise_type;

-- Find exercises without details (should be 0)
SELECT * FROM exercise_registry
WHERE plyometric_details_id IS NULL
  AND isometric_details_id IS NULL
  AND general_exercise_id IS NULL;
```

### Verify Metric System

```sql
-- Available metrics
SELECT code, display_name, value_type, unit
FROM metric_definitions
WHERE is_active = TRUE;

-- Recent metric entries
SELECT
  me.date,
  md.display_name,
  me.value,
  md.unit
FROM metric_entries me
JOIN metric_definitions md ON me.metric_definition_id = md.id
WHERE me.player_id = 'your-player-id'
ORDER BY me.date DESC
LIMIT 10;
```

### Verify Compliance View

```sql
SELECT * FROM v_player_program_compliance
WHERE player_id = 'your-player-id';
```

---

## ⚠️ Common Errors & Fixes

### Error: "column 'compliance_rate' does not exist"

**Fix:** Use `v_player_program_compliance` view instead of `player_programs`

### Error: "relation 'position_specific_metrics' does not exist"

**Fix:** Use `metric_entries` or `v_position_specific_metrics_legacy` view

### Error: "invalid input value for enum difficulty_level_enum"

**Fix:** Use exact ENUM values: 'Beginner', 'Intermediate', 'Advanced', 'Elite'

### Error: "duplicate key value violates unique constraint"

**Fix:** Check for existing entry before insert, or use `ON CONFLICT`

---

## 🚫 Post-Refactor Rules (Non-Negotiable)

These rules **must** be followed after migration. Violations will cause data corruption or incorrect safety calculations:

### 1. ❌ Do NOT Write Directly to Legacy Tables

```typescript
// ❌ FORBIDDEN - legacy table, will be deprecated
await supabase.from('position_specific_metrics').insert({...});

// ✅ REQUIRED - use new metric system
await supabase.from('metric_entries').insert({...});
```

**Why:** Legacy tables may be read-only or removed in future migrations. New system has validation.

### 2. ❌ Do NOT Compute Compliance Client-Side

```typescript
// ❌ FORBIDDEN - your calculation may differ from DB
const compliance = (completed / planned) * 100;

// ✅ REQUIRED - use authoritative view
const { compliance_rate } = await supabase
  .from("v_player_program_compliance")
  .select("compliance_rate")
  .single();
```

**Why:** Compliance logic is complex (date ranges, active programs, etc.). View is source of truth.

### 3. ❌ Do NOT Derive Risk Level Outside v_load_monitoring

```typescript
// ❌ FORBIDDEN - ignores baseline awareness
const risk = acwr > 1.5 ? "High" : "Optimal";

// ✅ REQUIRED - use view's computed_risk_level
const { computed_risk_level } = await supabase
  .from("v_load_monitoring")
  .select("computed_risk_level")
  .single();
```

**Why:** Risk calculation accounts for baseline days. Incorrect risk = potential injury.

### 4. ❌ Do NOT Introduce New Metrics Without Definitions

```typescript
// ❌ FORBIDDEN - no validation, no aggregation logic
await supabase.from("metric_entries").insert({
  metric_definition_id: null, // or made-up ID
  value: 999,
});

// ✅ REQUIRED - create definition first
const { data: metricDef } = await supabase
  .from("metric_definitions")
  .insert({
    code: "new_metric_code",
    display_name: "New Metric",
    value_type: "integer",
    // ... full definition
  })
  .select("id")
  .single();

// Then use it
await supabase.from("metric_entries").insert({
  metric_definition_id: metricDef.id,
  value: 150,
});
```

**Why:** Metrics without definitions have no validation, units, or aggregation rules.

### 5. ❌ Do NOT Bypass exercise_registry for Exercise Selection

```typescript
// ❌ FORBIDDEN - inconsistent IDs, missing exercises
const exercises = await supabase.from("plyometrics_exercises").select("*");

// ✅ REQUIRED - unified registry is source of truth
const exercises = await supabase.from("exercise_registry").select("*");
```

**Why:** Registry is the only complete catalog. Logs reference registry IDs.

### 6. ❌ Do NOT Store Computed Values (compliance_rate, risk_level, etc.)

```typescript
// ❌ FORBIDDEN - will become stale
await supabase.from("player_programs").update({
  compliance_rate: calculatedValue,
});

// ✅ REQUIRED - always read from views (computed in real-time)
// Views handle this automatically
```

**Why:** Stored computed values go stale. Views compute in real-time from source data.

### Enforcement

- **DB Level:** Constraints, foreign keys, and RLS policies enforce these rules
- **Code Review:** Flag violations in PR reviews
- **CI/CD:** Consider adding lint rules for direct legacy table access
- **Documentation:** Link to this section from API.md and onboarding docs

---

## 📚 Resources

- **Full Guide:** `/docs/DATABASE_REFACTOR_GUIDE.md`
- **Summary:** `/docs/DATABASE_REFACTOR_SUMMARY.md`
- **Migrations:** `/database/migrations/070_*.sql`, `071_*.sql`, `072_*.sql`
- **Training DB Concepts:** `/docs/README-TRAINING-DATABASE.md`
- **Safety Audit:** `/docs/BUSINESS_LOGIC_SAFETY_AUDIT.md`

---

## ✅ Migration Checklist for Your Code

- [ ] Update TypeScript types (copy from above)
- [ ] Replace `plyometrics_exercises` queries with `exercise_registry`
- [ ] Replace `isometrics_exercises` queries with `exercise_registry`
- [ ] Replace `player_programs.compliance_rate` with view
- [ ] Replace `position_specific_metrics` with `metric_entries`
- [ ] Update ACWR queries to use `v_load_monitoring`
- [ ] Add ENUM validation for difficulty_level, session_type, etc.
- [ ] Cache metric_definitions (don't query every time!)
- [ ] Test all exercise-related features
- [ ] Test all metric-related features
- [ ] Test all ACWR calculations

---

**Need Help?**

- Check the comprehensive guide: `/docs/DATABASE_REFACTOR_GUIDE.md`
- Review example queries above
- Search for "TODO: Update after migration 070" in codebase
- Create GitHub issue with error details

---

**Last Updated:** 29. December 2025  
**Migration Version:** 070, 071, 072  
**Status:** ✅ Complete
