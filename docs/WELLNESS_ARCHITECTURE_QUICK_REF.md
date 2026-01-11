# Wellness Data Architecture - Quick Reference

## ⚠️ IMPORTANT: Single Source of Truth

**For daily wellness check-ins, ALWAYS use `/api/wellness-checkin` - NEVER write directly to database tables.**

---

## Data Tables

| Table | Purpose | Who Writes | Who Reads |
|-------|---------|------------|-----------|
| `daily_wellness_checkin` | Today's check-in | `/api/wellness-checkin` endpoint | `/api/wellness-checkin` endpoint |
| `wellness_entries` | Historical trends (legacy) | ❌ DO NOT USE for daily check-ins | Analytics services only |

**Unique Constraint:** `daily_wellness_checkin (user_id, checkin_date)` - ensures one entry per user per day.

---

## API Contract

### POST `/api/wellness-checkin`
Save or update today's wellness check-in (UPSERT).

**Request:**
```json
{
  "date": "2026-01-11",           // Optional, defaults to today
  "sleepQuality": 8,              // 0-10
  "sleepHours": 7.5,              // hours
  "energyLevel": 7,               // 0-10 (10 = high energy)
  "muscleSoreness": 3,            // 0-10 (10 = severe)
  "stressLevel": 4,               // 0-10 (10 = very stressed)
  "sorenessAreas": ["legs"],      // Array of strings
  "notes": "Feeling good today",  // Optional
  "readinessScore": 75            // Optional, auto-calculated if omitted
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
- ✅ UPSERT to `daily_wellness_checkin` (one row per user per day)
- ✅ Calculate readiness score if not provided
- ✅ Trigger safety override if `muscleSoreness > 3`
- ✅ Create recovery block if `readinessScore < 40`
- ✅ Log ownership transition for low wellness
- ✅ Detect mental fatigue (high stress + low energy)
- ✅ Check tournament nutrition compliance
- ✅ Update wellness streak
- ✅ Award achievements

---

### GET `/api/wellness-checkin?date=YYYY-MM-DD`
Retrieve wellness check-in for a specific date.

**Request:**
```
GET /api/wellness-checkin?date=2026-01-11
```

**Response (entry exists):**
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

**Response (no entry):**
```json
{
  "success": true,
  "data": null
}
```

---

## Frontend Usage

### Angular Components

**✅ CORRECT:**
```typescript
import { ApiService } from '@core/services/api.service';

// Inject
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
    next: (response) => {
      console.log('Wellness saved:', response.data);
    },
    error: (err) => {
      console.error('Failed to save:', err);
    }
  });
}

// Check if entry exists for today
checkIfAlreadyCheckedIn() {
  const today = new Date().toISOString().split('T')[0];
  
  this.api.get(`/api/wellness-checkin?date=${today}`).subscribe({
    next: (response) => {
      if (response?.data) {
        console.log('Already checked in today');
      } else {
        console.log('No check-in yet today');
      }
    }
  });
}
```

**❌ WRONG (DO NOT DO THIS):**
```typescript
// ❌ NEVER write directly to database tables for daily check-ins
const { error } = await supabase
  .from('wellness_entries')
  .insert({ ... });

// ❌ NEVER write directly to daily_wellness_checkin
const { error } = await supabase
  .from('daily_wellness_checkin')
  .insert({ ... });
```

**Why?** Direct writes bypass:
- Server-side validation
- Safety overrides
- Recovery block creation
- Ownership transitions
- Mental fatigue detection
- Tournament nutrition checks
- Streak updates
- Achievements

---

## Field Mapping

When saving from UI sliders to API:

| UI Field | API Field | Mapping |
|----------|-----------|---------|
| `pain_level` (0-10, 10=severe) | `muscleSoreness` | Direct (same scale) |
| `fatigue_level` (0-10, 10=exhausted) | `energyLevel` | **INVERTED:** `10 - fatigue_level` |
| `sleep_quality` (0-10) | `sleepQuality` | Direct |
| `motivation_level` (0-10) | `notes` | Store in notes field for now |
| `weight_kg` | N/A | Save separately via ProfileCompletionService |

---

## Common Pitfalls

### ❌ Pitfall 1: Writing to Wrong Table
```typescript
// ❌ WRONG
await supabase.from('wellness_entries').insert({ ... });

// ✅ CORRECT
this.api.post('/api/wellness-checkin', { ... }).subscribe();
```

### ❌ Pitfall 2: Reading from Wrong Table
```typescript
// ❌ WRONG
const { data } = await supabase
  .from('wellness_entries')
  .select('*')
  .eq('date', today);

// ✅ CORRECT
this.api.get(`/api/wellness-checkin?date=${today}`).subscribe();
```

### ❌ Pitfall 3: Forgetting Observable Subscription
```typescript
// ❌ WRONG (won't execute)
this.api.post('/api/wellness-checkin', payload);

// ✅ CORRECT
this.api.post('/api/wellness-checkin', payload).subscribe({
  next: () => console.log('Saved'),
  error: (err) => console.error(err)
});
```

### ❌ Pitfall 4: Using async/await with Observables
```typescript
// ❌ WRONG (ApiService returns Observable, not Promise)
const response = await this.api.post('/api/wellness-checkin', payload);

// ✅ CORRECT
this.api.post('/api/wellness-checkin', payload).subscribe({
  next: (response) => { /* handle response */ }
});
```

---

## Debugging Checklist

If wellness data isn't persisting:

1. **Check network tab:** Is POST `/api/wellness-checkin` returning 200?
2. **Check payload:** Are all required fields present?
3. **Check database:** Is data in `daily_wellness_checkin` table (not `wellness_entries`)?
4. **Check RLS:** Does user have permission to insert/update?
5. **Check backend logs:** Any errors in Netlify function logs?

---

## Database Schema

### `daily_wellness_checkin`
```sql
CREATE TABLE daily_wellness_checkin (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  checkin_date DATE NOT NULL,
  sleep_quality INTEGER,           -- 0-10
  sleep_hours NUMERIC(3,1),        -- e.g., 7.5
  energy_level INTEGER,            -- 0-10 (10 = high energy)
  muscle_soreness INTEGER,         -- 0-10 (10 = severe)
  stress_level INTEGER,            -- 0-10 (10 = very stressed)
  soreness_areas TEXT[],           -- Array of body parts
  notes TEXT,
  readiness_score INTEGER,         -- 0-100 (calculated)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)    -- One entry per user per day
);
```

### `wellness_entries` (Legacy)
**Purpose:** Historical trends, long-term analytics  
**Status:** Not used for daily check-ins  
**Schema:** Similar to `daily_wellness_checkin` but uses `athlete_id` instead of `user_id`

---

## Related Services

| Service | Reads From | Writes To | Purpose |
|---------|-----------|-----------|---------|
| `ApiService` | N/A | `/api/wellness-checkin` | HTTP client wrapper |
| `UnifiedTrainingService` | `/api/wellness-checkin` | N/A | Reads wellness for today |
| `WellnessService` | `wellness_entries` (legacy) | `wellness_entries` (legacy) | Historical trends only |
| `DailyReadinessComponent` | `/api/wellness-checkin` | `/api/wellness-checkin` | Daily check-in UI |

---

## Migration Notes

If you need to migrate old data from `wellness_entries` → `daily_wellness_checkin`:

```sql
INSERT INTO daily_wellness_checkin (
  user_id, checkin_date, sleep_quality, energy_level, 
  muscle_soreness, stress_level, notes
)
SELECT 
  athlete_id, 
  date, 
  sleep_quality, 
  energy_level, 
  muscle_soreness, 
  stress_level, 
  notes
FROM wellness_entries
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
ON CONFLICT (user_id, checkin_date) DO NOTHING;
```

---

## Support

**Questions?** Check:
- `/docs/fixes/WELLNESS_SINGLE_SOURCE_OF_TRUTH.md` - Full explanation
- `/docs/fixes/WELLNESS_BEFORE_AFTER_DIAGRAM.md` - Visual diagrams
- `netlify/functions/wellness-checkin.cjs` - Backend implementation

---

**Last Updated:** 2026-01-11  
**Owner:** Core Platform Team  
**Status:** Active
