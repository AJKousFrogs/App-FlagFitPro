# PROMPT 2.10 — STEP A: REPOSITORY INVENTORY

## Search Results Summary

### 1. "practice" references
**Backend:**
- `netlify/functions/daily-protocol.cjs` (lines 221-224, 940-952)
  - Reads `athlete_training_config.flag_practice_schedule` (JSONB array)
  - Checks day of week against practice schedule
  - Used to adjust training focus for practice days
- `netlify/functions/utils/session-resolver.cjs` (lines 265-291)
  - Checks `athlete_training_config.flag_practice_schedule`
  - Returns `flag_practice` override type when practice scheduled

**Frontend:**
- `angular/src/app/features/coach/practice-planner/practice-planner.component.ts`
  - Coach UI for planning practice sessions
  - Creates practice plans with timeline, activities, equipment
  - Calls `/api/coach/practices` endpoint (not yet implemented)
- `angular/src/app/features/team-calendar/team-calendar.component.ts`
  - Player view of team events including practices
  - Shows RSVP functionality for events
  - Calls `/api/team-calendar` endpoint

**Database:**
- `athlete_training_config.flag_practice_schedule` (JSONB)
  - Array of objects: `{day: 0-6, start_time: "HH:MM", expected_throws?: number}`
  - Stored per-athlete, NOT team-wide
  - Currently player self-declared (onboarding flow)

### 2. "film" / "film_room" references
**Frontend:**
- `angular/src/app/features/film-room/film-room.component.ts`
  - Player film room component
- `angular/src/app/features/coach/film-room/film-room-coach.component.ts`
  - Coach film room component
- `angular/src/app/today/resolution/today-state.resolver.ts` (line 458)
  - Checks `film_room_scheduled` flag in protocol JSON
  - Priority 7 in resolution stack

**Database:**
- No dedicated film room table found
- Referenced in wireframes/docs but not implemented

### 3. "team activity" / "teamActivity" references
**Frontend:**
- `angular/src/app/features/team-calendar/team-calendar.component.ts`
  - Uses `TeamEvent` interface with types: `"practice" | "game" | "team-event" | "meeting" | "tournament"`
  - No database backing yet

**Database:**
- No `team_activities` table exists
- `supabase/migrations/20251213000000_team_system.sql` creates:
  - `teams` table (team metadata)
  - `team_members` table (membership)
  - `team_invitations` table (invitations)
  - **NO team activities/events table**

### 4. "training calendar" / "schedule" references
**Backend:**
- `athlete_training_config.flag_practice_schedule` (per-athlete JSONB)
- No team-wide schedule table

**Frontend:**
- `angular/src/app/features/training/training-schedule/training-schedule.component.ts`
  - Shows individual athlete training schedule (from program)
  - Not team activities

### 5. "event" references
**Frontend:**
- `team-calendar.component.ts` uses `TeamEvent` interface
- Wireframes mention team events
- No database table backing

**Database:**
- `database/migrations/029_game_events_system.sql` creates `games` and `game_events` tables
  - For tracking game performance, not team activities

### 6. "whatsapp" / "poll" references
**Result:** No matches found in codebase

## Current State Analysis

### What EXISTS:
1. **Per-athlete practice schedule** (`athlete_training_config.flag_practice_schedule`)
   - JSONB array stored per athlete
   - Currently player self-declared during onboarding
   - Used by `daily-protocol.cjs` and `session-resolver.cjs` to adjust training
   - **NOT authoritative** - no coach attribution

2. **Team system tables** (`teams`, `team_members`, `team_invitations`)
   - Team structure exists
   - No team activities table

3. **UI components** (practice planner, team calendar)
   - Frontend components exist but no backend API/database backing
   - Practice planner calls `/api/coach/practices` (not implemented)
   - Team calendar calls `/api/team-calendar` (not implemented)

### What DOES NOT EXIST:
1. **Team activities table** - No canonical source of truth for team practices/film room
2. **Coach-attributed schedule** - Current practice schedule is player self-declared
3. **Team activity API endpoints** - No backend for creating/managing team activities
4. **Film room database table** - Referenced in UI but no data model
5. **WhatsApp/poll integration** - Not found (good - not needed)

## Key Findings

### CRITICAL ISSUE:
- **Current practice schedule is player self-declared** (`athlete_training_config.flag_practice_schedule`)
- This violates the requirement: "No WhatsApp polls, no player self-declared schedule as authority"
- Need to replace with coach-created `team_activities` table

### ARCHITECTURE GAP:
- Frontend components exist but backend is missing
- Need to create:
  1. `team_activities` table (coach-created, team-wide)
  2. `team_activity_attendance` table (athlete participation mapping)
  3. `team_activity_audit` table (append-only audit log)
  4. API endpoints for CRUD operations
  5. Resolver function to determine team activity for athlete-day

## Next Steps

1. Create database migration for `team_activities` + related tables
2. Implement resolver function `resolveTeamActivityForAthleteDay()`
3. Update `/api/daily-protocol` to include `teamActivity` field
4. Update `session-resolver.cjs` to check team activities instead of player config
5. Create proof tests document

