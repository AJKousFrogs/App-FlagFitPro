# Training Database Installation Instructions

## Quick Installation via Supabase Dashboard

Since Supabase CLI doesn't have a direct SQL execution command, the easiest way to install is through the Supabase Dashboard SQL Editor.

### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **Flagfootballapp** (`pvziciccwxgftcielknm`)
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Create Database Schema

1. Open the file: `database/create-training-schema.sql`
2. **Copy the entire contents** (all 20,743 bytes)
3. **Paste into Supabase SQL Editor**
4. Click **Run** (or press Cmd+Enter)
5. Wait for completion (~10-15 seconds)

You should see: "Success. No rows returned"

### Step 3: Seed QB Program Data

1. Open the file: `database/seed-qb-annual-program-corrected.sql`
2. **Copy the entire contents** (all ~25,000 bytes)
3. **Paste into Supabase SQL Editor** (new query or clear previous)
4. Click **Run** (or press Cmd+Enter)
5. Wait for completion (~15-20 seconds)

You should see: "Success. No rows returned"

### Step 4: Verify Installation

Run this verification query in SQL Editor:

```sql
-- Check positions
SELECT 'positions' as table_name, COUNT(*) as count FROM positions
UNION ALL
SELECT 'training_programs', COUNT(*) FROM training_programs
UNION ALL
SELECT 'training_phases', COUNT(*) FROM training_phases
UNION ALL
SELECT 'training_weeks', COUNT(*) FROM training_weeks
UNION ALL
SELECT 'exercises', COUNT(*) FROM exercises;
```

**Expected results:**
```
positions          | 6     (QB, WR, DB, Center, LB, Blitzer)
training_programs  | 1     (QB Annual Program 2025-2026)
training_phases    | 7     (Pre-Season, Foundation, Power, etc.)
training_weeks     | 32    (Nov-Jun with proper volume progression)
exercises          | 30+   (QB-specific and general exercises)
```

---

## Alternative: Command Line Installation

If you prefer command line, follow these steps:

### Prerequisites
- Install PostgreSQL: `brew install postgresql`
- OR Install psql only: `brew install libpq`

### Installation Commands

```bash
# Set environment variable
export PGPASSWORD="your-service-key-from-.env"

# Install schema
psql "postgresql://postgres.pvziciccwxgftcielknm@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" \
  -f database/create-training-schema.sql

# Install seed data
psql "postgresql://postgres.pvziciccwxgftcielknm@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" \
  -f database/seed-qb-annual-program-corrected.sql
```

---

## Post-Installation: Assign Program to Test Player

After installation, assign the QB program to your test player:

```sql
-- Get your test player's UUID
SELECT id, email FROM auth.users WHERE email = 'manualtest@gmail.com';

-- Assign QB Program to player (replace 'player-uuid' with actual UUID)
INSERT INTO player_programs (
  player_id,
  program_id,
  assigned_by,
  start_date,
  is_active
) VALUES (
  'player-uuid', -- Replace with actual player UUID
  '11111111-1111-1111-1111-111111111111', -- QB Annual Program
  NULL, -- Or coach UUID if available
  '2025-11-01',
  true
);
```

---

## Verification Queries

### Check Throwing Volume Progression

```sql
SELECT
  week_number,
  start_date,
  end_date,
  (volume_multiplier * 100) AS throws_per_week,
  focus
FROM training_weeks
JOIN training_phases ON training_weeks.phase_id = training_phases.id
WHERE training_phases.program_id = '11111111-1111-1111-1111-111111111111'
ORDER BY start_date
LIMIT 25;
```

**Should show gradual progression:**
- Nov W1: 50 throws
- Dec W1: 80 throws
- Jan W1: 120 throws
- Feb W1: 170 throws
- Mar W1: 250 throws
- Apr W2: **320 throws** (PEAK)
- Apr W3+: 320 throws (MAINTAIN)

### Check Exercises Library

```sql
SELECT
  name,
  category,
  position_specific,
  metrics_tracked
FROM exercises
WHERE position_specific = true
  AND 'QB' = ANY(
    SELECT name FROM positions WHERE id = ANY(applicable_positions)
  )
ORDER BY category, name;
```

### Check ACWR Functions

```sql
-- Test ACWR calculation functions
SELECT
  calculate_daily_load('00000000-0000-0000-0000-000000000000'::UUID, CURRENT_DATE) AS daily_load,
  get_injury_risk_level(1.2) AS risk_level_optimal,
  get_injury_risk_level(1.6) AS risk_level_high;
```

---

## Troubleshooting

### Error: "relation already exists"
**Solution**: Tables already exist. Either:
1. Drop existing tables first (CAREFUL - this deletes data!)
2. Or modify the SQL to use `CREATE TABLE IF NOT EXISTS` (already included)

### Error: "permission denied"
**Solution**: Make sure you're using the `SUPABASE_SERVICE_KEY`, not `SUPABASE_ANON_KEY`

### Error: "syntax error near 'ARRAY'"
**Solution**: PostgreSQL version too old. Supabase uses PostgreSQL 15+, which supports arrays.

### No errors but empty tables
**Solution**: Check if RLS (Row Level Security) is blocking queries. Try disabling RLS temporarily:
```sql
ALTER TABLE positions DISABLE ROW LEVEL SECURITY;
```

---

## Files Reference

- **`create-training-schema.sql`**: Creates all 13 tables, indexes, RLS policies, triggers
- **`seed-qb-annual-program-corrected.sql`**: Populates with QB program, phases, weeks, exercises
- **`QB-THROWING-VOLUME-PERIODIZATION.md`**: Explains proper periodization
- **`README-TRAINING-DATABASE.md`**: Complete database documentation

---

## Next Steps After Installation

1. **Verify installation** using queries above
2. **Assign program to test player**
3. **Test workout logging**:
   ```sql
   INSERT INTO workout_logs (player_id, completed_at, rpe, duration_minutes)
   VALUES ('player-uuid', NOW(), 7.5, 60);
   ```
4. **Check ACWR auto-calculation**:
   ```sql
   SELECT * FROM load_monitoring WHERE player_id = 'player-uuid';
   ```
5. **Connect frontend** to display training schedule, programs, videos

---

## Support

If you encounter issues:
1. Check Supabase logs in Dashboard → Logs
2. Verify service key is correct in `.env`
3. Ensure you're using the correct project (`pvziciccwxgftcielknm`)
4. Review `README-TRAINING-DATABASE.md` for detailed documentation
