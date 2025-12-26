# 📊 Data Sources Documentation

**Last Updated**: December 2025  
**Status**: Active

---

## Overview

This document describes the data sources used in the FlagFit Pro application and the migration from static JavaScript files to the Supabase database.

---

## 🗄️ Primary Data Source: Supabase Database [[memory:12543532]]

All application data is now stored in and retrieved from **Supabase**. This is the ONLY database system used.

### Key Tables

| Table | Purpose | Angular Service | API Endpoint |
|-------|---------|-----------------|--------------|
| `training_programs` | Training program metadata | `TrainingProgramService` | `/api/training-programs` |
| `training_phases` | Periodization phases | `TrainingProgramService` | `/api/training-programs/phases` |
| `training_weeks` | Weekly training structure | `TrainingProgramService` | `/api/training-programs/weeks` |
| `session_templates` | Daily session templates | `TrainingProgramService` | `/api/training-programs/sessions` |
| `exercises` | Master exercise library | `TrainingProgramService` | `/api/training-programs/exercises` |
| `tournaments` | Tournament schedule | `TournamentService` | `/api/tournaments` |
| `training_sessions` | User training sessions | `TrainingDataService` | `/api/training-sessions` |
| `wellness_entries` | Wellness check-ins | `WellnessService` | `/api/wellness` |
| `games` | Game records | `GamesService` | `/api/games` |
| `player_game_stats` | Player statistics | `PlayerStatsService` | `/api/player-stats` |

---

## 🚫 Deprecated Data Sources

The following static JavaScript files are **DEPRECATED** and should NOT be used for new development:

### `/src/data/training/` (DEPRECATED)

| File | Status | Replacement |
|------|--------|-------------|
| `annual-training-program.js` | ⚠️ DEPRECATED | `training_programs` + `training_phases` tables |
| `training-program.js` | ⚠️ DEPRECATED | `training_programs` table |
| `weekly-schedules.js` | ⚠️ DEPRECATED | `training_weeks` + `session_templates` tables |
| `exercise-library.js` | ⚠️ DEPRECATED | `exercises` table |
| `performance-tests.js` | ⚠️ DEPRECATED | `performance_tests` table |
| `index.js` | ⚠️ DEPRECATED | Use `TrainingProgramService` |

### `/src/data/qb-training/` (DEPRECATED)

| File | Status | Replacement |
|------|--------|-------------|
| `qb-training-program.js` | ⚠️ DEPRECATED | `training_programs` (QB position) |
| `qb-exercise-library.js` | ⚠️ DEPRECATED | `exercises` table |
| `qb-weekly-schedules.js` | ⚠️ DEPRECATED | `training_weeks` table |
| `qb-assessments.js` | ⚠️ DEPRECATED | `performance_tests` table |

### `/src/js/data/` (DEPRECATED)

| File | Status | Replacement |
|------|--------|-------------|
| `exercise-library.js` | ⚠️ DEPRECATED | `exercises` table |
| `qb-exercise-library.js` | ⚠️ DEPRECATED | `exercises` table |

### Other Deprecated Files

| File | Status | Replacement |
|------|--------|-------------|
| `src/tournament-schedule.js` | ⚠️ DEPRECATED | `tournaments` table |
| `src/training-program-engine.js` | ⚠️ DEPRECATED | `TrainingProgramService` |
| `src/qb-training-engine.js` | ⚠️ DEPRECATED | `TrainingProgramService` |
| `src/js/services/aiTrainingScheduler.js` | ⚠️ DEPRECATED | `/api/smart-training` endpoint |

---

## ✅ How to Access Data (New Way)

### Angular Services

```typescript
// Training Programs
import { TrainingProgramService } from '@core/services/training-program.service';
const programService = inject(TrainingProgramService);
await programService.fetchLjubljanaFrogsProgram(true);

// Tournaments
import { TournamentService } from '@core/services/tournament.service';
const tournamentService = inject(TournamentService);
await tournamentService.fetchTournaments();

// Wellness
import { WellnessService } from '@core/services/wellness.service';
const wellnessService = inject(WellnessService);
await wellnessService.getWellnessData();
```

### API Endpoints

```bash
# Training Programs
GET /api/training-programs                              # List all programs
GET /api/training-programs?id={id}&full=true           # Full program with nested data
GET /api/training-programs/phases?programId={id}       # Phases for a program
GET /api/training-programs/weeks?phaseId={id}          # Weeks for a phase
GET /api/training-programs/sessions?weekId={id}        # Sessions for a week
GET /api/training-programs/exercises?sessionId={id}    # Exercises for a session
GET /api/training-programs/current-week?programId={id} # Current week based on date

# Tournaments
GET /api/tournaments                    # List all tournaments
GET /api/tournaments?year=2026          # Filter by year
GET /api/tournaments/{id}               # Get specific tournament
POST /api/tournaments                   # Create tournament (admin)
PUT /api/tournaments/{id}               # Update tournament (admin)
DELETE /api/tournaments/{id}            # Delete tournament (admin)

# Smart Training Recommendations
GET /api/smart-training-recommendations?athleteId={id}
```

### Direct Supabase Access

```typescript
// For complex queries not covered by services
import { SupabaseService } from '@core/services/supabase.service';

const supabase = inject(SupabaseService);
const { data, error } = await supabase.client
  .from('exercises')
  .select('*')
  .eq('category', 'Strength')
  .order('name');
```

---

## 📅 Migration Timeline

| Phase | Status | Date |
|-------|--------|------|
| Database schema created | ✅ Complete | Dec 2025 |
| Seed data migrated | ✅ Complete | Dec 2025 |
| API endpoints created | ✅ Complete | Dec 2025 |
| Angular services created | ✅ Complete | Dec 2025 |
| Deprecation notices added | ✅ Complete | Dec 2025 |
| Legacy files removal | 🔄 Planned | Q2 2026 |

---

## 🔧 Why This Migration?

### Problems with Static JS Files
- ❌ Data duplication across files
- ❌ Code changes required for data updates
- ❌ No user customization possible
- ❌ No multi-program support
- ❌ No real-time updates

### Benefits of Database Approach
- ✅ Single source of truth
- ✅ Easy updates without deployments
- ✅ User-specific programs
- ✅ Multiple programs (WR/DB, QB, custom)
- ✅ Real-time sync across devices
- ✅ Admin/coach management UI
- ✅ Better data integrity

---

## Questions?

- See `/src/data/DEPRECATED.md` for migration guide
- See `/src/data/qb-training/DEPRECATED.md` for QB-specific migration
- Contact the development team for assistance

