# ⚠️ DEPRECATED: Static Data Files

**Status**: DEPRECATED as of December 2025  
**Reason**: Data migrated to Supabase database  
**Removal Date**: Planned for Q2 2026

---

## What Changed?

All training program data has been migrated to the Supabase database for:
- **Single source of truth** - No more data duplication
- **Easy updates** - Change data without code deployments
- **Multi-program support** - WR/DB, QB, and custom programs
- **User customization** - Athletes can have personalized programs

---

## Migration Guide

### ❌ Old Way (Deprecated)
```javascript
// Don't use these anymore
import { ANNUAL_TRAINING_PROGRAM } from "./data/training/annual-training-program.js";
import { TRAINING_PROGRAM } from "./data/training/training-program.js";
import { WEEKLY_SCHEDULES } from "./data/training/weekly-schedules.js";
import { EXERCISE_LIBRARY } from "./data/training/exercise-library.js";
```

### ✅ New Way (Use This)

**In Angular:**
```typescript
import { TrainingProgramService } from '@core/services/training-program.service';

// In component
const programService = inject(TrainingProgramService);
await programService.fetchLjubljanaFrogsProgram(true); // full=true for nested data

// Access via signals
const program = programService.currentProgram();
const currentPhase = programService.currentPhase();
const currentWeek = programService.currentWeek();
const todaysSessions = programService.todaysSessions();
```

**Via API:**
```bash
# Get full program with all nested data
GET /api/training-programs?id=ffffffff-ffff-ffff-ffff-ffffffffffff&full=true

# Get just phases
GET /api/training-programs/phases?programId=ffffffff-ffff-ffff-ffff-ffffffffffff

# Get current week
GET /api/training-programs/current-week?programId=ffffffff-ffff-ffff-ffff-ffffffffffff
```

---

## Files in This Directory

| File | Status | Replacement |
|------|--------|-------------|
| `annual-training-program.js` | DEPRECATED | `training_programs` + `training_phases` + `training_weeks` tables |
| `training-program.js` | DEPRECATED | `training_programs` table |
| `weekly-schedules.js` | DEPRECATED | `training_weeks` + `training_session_templates` tables |
| `exercise-library.js` | DEPRECATED | `exercises` table |
| `performance-tests.js` | DEPRECATED | `performance_tests` table |
| `nutrition-guidelines.js` | DEPRECATED | `nutrition_guidelines` table (if needed) |
| `index.js` | DEPRECATED | Use `TrainingProgramService` |

---

## Database Tables (New Source of Truth)

```
training_programs
├── training_phases
│   └── training_weeks
│       └── training_session_templates
│           └── session_exercises
│               └── exercises (master list)
```

### Key Tables:
- `training_programs` - Program metadata (name, dates, position)
- `training_phases` - Periodization phases (Foundation, Power, Explosive, etc.)
- `training_weeks` - Weekly structure with themes
- `training_session_templates` - Daily session templates
- `session_exercises` - Exercises within sessions
- `exercises` - Master exercise library
- `warmup_protocols` - Warmup/cooldown protocols
- `movement_patterns` - Movement pattern definitions

---

## Why Keep These Files?

These files are temporarily kept for:
1. **Legacy HTML pages** - Some standalone HTML pages still reference them
2. **Reference** - Useful for understanding the original data structure
3. **Gradual migration** - Allows time to update all consumers

Once all legacy HTML pages are migrated to Angular, these files will be deleted.

---

## Questions?

Contact the development team or check:
- `/docs/DATABASE_SCHEMA.md` - Full database documentation
- `/angular/src/app/core/services/training-program.service.ts` - Angular service
- `/netlify/functions/training-programs.cjs` - API endpoint

