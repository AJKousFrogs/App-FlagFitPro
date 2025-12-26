# ⚠️ DEPRECATED: QB Training Static Data Files

**Status**: DEPRECATED as of December 2025  
**Reason**: Data migrated to Supabase database  
**Removal Date**: Planned for Q2 2026

---

## What Changed?

QB-specific training data has been migrated to the database:
- `QB_TRAINING_PROGRAM` → `training_programs` table (with position_id for QB)
- `QB_EXERCISE_LIBRARY` → `exercises` table (with QB-specific exercises)
- `QB_WEEKLY_SCHEDULES` → `training_weeks` + `training_session_templates`
- `QB_ASSESSMENTS` → `performance_tests` table

---

## New Way to Access QB Data

**Via API:**
```bash
# Get QB program (use QB position ID)
GET /api/training-programs?positionId=<qb-position-uuid>&full=true

# Or by program ID if known
GET /api/training-programs?id=11111111-1111-1111-1111-111111111111&full=true
```

**In Angular:**
```typescript
const programService = inject(TrainingProgramService);
// Fetch QB-specific program by ID or position
```

---

## Files in This Directory

| File | Status | Replacement |
|------|--------|-------------|
| `qb-training-program.js` | DEPRECATED | `training_programs` table (QB position) |
| `qb-exercise-library.js` | DEPRECATED | `exercises` table |
| `qb-weekly-schedules.js` | DEPRECATED | `training_weeks` table |
| `qb-assessments.js` | DEPRECATED | `performance_tests` table |
| `tournament-simulation.js` | DEPRECATED | Custom game simulation logic |
| `index.js` | DEPRECATED | Use API/Service |

---

See `/src/data/DEPRECATED.md` for full migration guide.

