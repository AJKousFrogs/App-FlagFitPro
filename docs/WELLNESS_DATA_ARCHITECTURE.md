# Wellness Data Architecture

**Last Updated:** January 2026  
**Status:** ✅ Migration Complete (Phases 1-3)

---

## 📋 Quick Summary

**All wellness operations now use `daily_wellness_checkin` table.**

| Phase   | Status      | Description                                    |
| ------- | ----------- | ---------------------------------------------- |
| Phase 1 | ✅ Complete | All Angular writes use `/api/wellness-checkin` |
| Phase 2 | ✅ Complete | Backend dual-writes to both tables             |
| Phase 3 | ✅ Complete | All Angular reads use `daily_wellness_checkin` |
| Phase 4 | 🔲 Planned  | Drop `wellness_entries` table (July 2026+)     |

---

## ⚠️ IMPORTANT: Single Source of Truth

**For daily wellness check-ins, ALWAYS use `/api/wellness-checkin` - NEVER write directly to database tables.**

---

## Data Tables

| Table                    | Purpose                  | Status                              |
| ------------------------ | ------------------------ | ----------------------------------- |
| `daily_wellness_checkin` | All wellness data        | ✅ Canonical source                 |
| `wellness_entries`       | Legacy (dual-write only) | 🔄 Deprecated - backend writes only |

**Unique Constraint:** `daily_wellness_checkin (user_id, checkin_date)` - ensures one entry per user per day.

---

## API Contract

### POST `/api/wellness-checkin`

Save or update today's wellness check-in (UPSERT).

**Request:**

```json
{
  "date": "2026-01-11",
  "sleepQuality": 8,
  "sleepHours": 7.5,
  "energyLevel": 7,
  "muscleSoreness": 3,
  "stressLevel": 4,
  "sorenessAreas": ["legs"],
  "notes": "Feeling good today",
  "readinessScore": 75
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "sleepQuality": 8,
    "sleepHours": 7.5,
    "energyLevel": 7,
    "muscleSoreness": 3,
    "stressLevel": 4,
    "sorenessAreas": ["legs"],
    "notes": "Feeling good today",
    "readinessScore": 75
  }
}
```

**Backend Actions:**

- ✅ UPSERT to `daily_wellness_checkin`
- ✅ Calculate readiness score if not provided
- ✅ Trigger safety override if `muscleSoreness > 3`
- ✅ Create recovery block if `readinessScore < 40`
- ✅ Detect mental fatigue
- ✅ Update wellness streak & achievements

### GET `/api/wellness-checkin?date=YYYY-MM-DD`

Retrieve wellness check-in for a specific date.

**Response (entry exists):**

```json
{ "success": true, "data": { ... } }
```

**Response (no entry):**

```json
{ "success": true, "data": null }
```

---

## Frontend Usage

### ✅ CORRECT

```typescript
import { ApiService } from '@core/services/api.service';

private api = inject(ApiService);

// Save wellness
saveWellness() {
  const payload = {
    sleepQuality: 8,
    sleepHours: 7.5,
    energyLevel: 7,
    muscleSoreness: 3,
    stressLevel: 4,
    sorenessAreas: [],
    notes: 'Feeling good'
  };

  this.api.post('/api/wellness-checkin', payload).subscribe({
    next: (response) => console.log('Saved:', response.data),
    error: (err) => console.error('Failed:', err)
  });
}

// Check if entry exists
checkIfAlreadyCheckedIn() {
  const today = new Date().toISOString().split('T')[0];

  this.api.get(`/api/wellness-checkin?date=${today}`).subscribe({
    next: (response) => {
      if (response?.data) {
        console.log('Already checked in today');
      }
    }
  });
}
```

### ❌ WRONG (DO NOT DO)

```typescript
// ❌ NEVER write directly to database tables
const { error } = await supabase
  .from('wellness_entries')
  .insert({ ... });

// ❌ NEVER write directly to daily_wellness_checkin
const { error } = await supabase
  .from('daily_wellness_checkin')
  .insert({ ... });
```

**Why?** Direct writes bypass server-side validation, safety overrides, recovery blocks, streak updates, and achievements.

---

## Field Mapping

| UI Field                             | API Field        | Mapping                            |
| ------------------------------------ | ---------------- | ---------------------------------- |
| `pain_level` (0-10, 10=severe)       | `muscleSoreness` | Direct                             |
| `fatigue_level` (0-10, 10=exhausted) | `energyLevel`    | **INVERTED:** `10 - fatigue_level` |
| `sleep_quality` (0-10)               | `sleepQuality`   | Direct                             |
| `motivation_level` (0-10)            | `notes`          | Store in notes field               |

---

## Common Pitfalls

### ❌ Writing to Wrong Table

```typescript
// ❌ WRONG
await supabase.from('wellness_entries').insert({ ... });

// ✅ CORRECT
this.api.post('/api/wellness-checkin', { ... }).subscribe();
```

### ❌ Forgetting Observable Subscription

```typescript
// ❌ WRONG (won't execute)
this.api.post("/api/wellness-checkin", payload);

// ✅ CORRECT
this.api.post("/api/wellness-checkin", payload).subscribe();
```

### ❌ Using async/await with Observables

```typescript
// ❌ WRONG
const response = await this.api.post("/api/wellness-checkin", payload);

// ✅ CORRECT
this.api.post("/api/wellness-checkin", payload).subscribe({
  next: (response) => {
    /* handle */
  },
});
```

---

## Database Schema

### `daily_wellness_checkin`

```sql
CREATE TABLE daily_wellness_checkin (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  checkin_date DATE NOT NULL,
  sleep_quality INTEGER,
  sleep_hours NUMERIC(3,1),
  energy_level INTEGER,
  muscle_soreness INTEGER,
  stress_level INTEGER,
  soreness_areas TEXT[],
  notes TEXT,
  readiness_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);
```

---

## Related Services

| Service                   | Reads From               | Writes To               |
| ------------------------- | ------------------------ | ----------------------- |
| `ApiService`              | N/A                      | `/api/wellness-checkin` |
| `WellnessService`         | `daily_wellness_checkin` | `/api/wellness-checkin` |
| `DailyReadinessComponent` | `/api/wellness-checkin`  | `/api/wellness-checkin` |
| `RecoveryService`         | `/api/wellness-checkin`  | N/A                     |
| `SettingsComponent`       | `daily_wellness_checkin` | N/A                     |
| `ProfileComponent`        | `daily_wellness_checkin` | N/A                     |
| `DataExportService`       | `daily_wellness_checkin` | N/A                     |

---

## Debugging Checklist

If wellness data isn't persisting:

1. **Check network tab:** Is POST `/api/wellness-checkin` returning 200?
2. **Check payload:** Are all required fields present?
3. **Check database:** Is data in `daily_wellness_checkin` (not `wellness_entries`)?
4. **Check RLS:** Does user have permission?
5. **Check backend logs:** Netlify function logs for errors

---

## Adding New Wellness Features

**✅ DO:**

- Use `/api/wellness-checkin` for writes
- Read from `daily_wellness_checkin` table
- Follow patterns in `DailyReadinessComponent`

**❌ DON'T:**

- Write directly to any wellness table
- Read from `wellness_entries` (deprecated)

---

## Phase 4 Plan (July 2026+)

When ready to fully deprecate `wellness_entries`:

1. Remove dual-write from `wellness-checkin.cjs`
2. Archive `wellness_entries` data
3. Verify all reads migrated
4. Drop table after 6+ months confidence period

---

## Migration Notes

If migrating old data:

```sql
INSERT INTO daily_wellness_checkin (
  user_id, checkin_date, sleep_quality, energy_level,
  muscle_soreness, stress_level, notes
)
SELECT
  athlete_id, date, sleep_quality, energy_level,
  muscle_soreness, stress_level, notes
FROM wellness_entries
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ON CONFLICT (user_id, checkin_date) DO NOTHING;
```

---

**Maintained By:** Platform Team  
**Next Review:** July 2026 (Phase 4 evaluation)
