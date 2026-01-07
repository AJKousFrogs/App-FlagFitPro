# Offboarding Flows Implementation Summary

**Date:** January 2026  
**Status:** ✅ Complete

## Overview

All offboarding flows from the User Flow Design Document have been implemented, including season end archiving, inactive player detection, account pause functionality, and long-term injury analytics exclusion.

## Implemented Features

### 1. Season End Archiving ✅

**Database Migration:** `105_offboarding_flows.sql`

- **Seasons Table**: Tracks seasons with start/end dates and archive status
- **Archive Tables**: Separate archive tables for wellness check-ins, training sessions, game events, and ACWR history
- **Archive Function**: `archive_season_data()` function moves all season data to archive tables
- **Backend Function**: `season-archive.cjs` Netlify function handles archiving requests
- **Service**: `OffboardingService` provides frontend integration

**Usage:**
```typescript
await offboardingService.archiveSeason(seasonId);
```

### 2. Season End Summary Reports ✅

**Database Migration:** `105_offboarding_flows.sql`

- **Reports Table**: Stores generated summary reports for players, coaches, and teams
- **Report Generation**: `season-reports.cjs` Netlify function generates:
  - Team reports (aggregate statistics)
  - Coach reports (team insights)
  - Player reports (individual performance summaries)
- **Service**: `OffboardingService.generateSeasonReports()` method

**Usage:**
```typescript
const reports = await offboardingService.generateSeasonReports(seasonId);
```

### 3. Season End Analytics Freezing ✅

**Database Migration:** `105_offboarding_flows.sql`

- **ACWR Freeze Check**: `should_freeze_acwr()` function checks:
  - Account pause status
  - Active season status
- **Integration**: ACWR calculations check freeze status before computing

**Usage:**
```typescript
const frozen = await offboardingService.checkAcwrFrozen(userId);
```

### 4. Inactive Player Detection ✅

**Database Migration:** `105_offboarding_flows.sql`

- **Activity Tracking Table**: `player_activity_tracking` tracks:
  - Last activity date
  - Days inactive
  - Notification status (30d and 90d)
  - Analytics exclusion status
- **Auto-Update Triggers**: Automatically updates on wellness check-in and training session creation
- **Auto-Exclusion**: Players automatically excluded from analytics after 90 days inactive
- **Notification Function**: `inactive-player-notify.cjs` sends notifications
- **Service**: `OffboardingService` provides methods to load and notify inactive players

**Usage:**
```typescript
await offboardingService.loadInactivePlayers(teamId);
await offboardingService.notifyInactivePlayer(userId, daysInactive);
```

### 5. Account Pause Functionality ✅

**Database Migration:** `105_offboarding_flows.sql`

- **Pause Requests Table**: `account_pause_requests` tracks:
  - Pause start/end dates
  - Reason
  - ACWR freeze status
  - Resume status
- **User Status**: Added `account_status` column to users table
- **Pause/Resume Functions**: Database functions for pausing and resuming accounts
- **Backend Function**: `account-pause.cjs` Netlify function handles pause/resume
- **Service**: `OffboardingService` provides pause/resume methods

**Usage:**
```typescript
await offboardingService.pauseAccount(userId, pausedUntil, reason);
await offboardingService.resumeAccount(userId);
```

### 6. Long-Term Injury Analytics Exclusion ✅

**Database Migration:** `105_offboarding_flows.sql`

- **Injury Tracking Table**: `long_term_injury_tracking` tracks:
  - Injury start date
  - Days injured
  - Analytics exclusion status
- **Auto-Exclusion**: Injuries older than 90 days automatically excluded
- **Update Function**: `update_long_term_injuries()` function checks and updates exclusions
- **Service**: `OffboardingService` provides methods to load long-term injuries

**Usage:**
```typescript
await offboardingService.loadLongTermInjuries(teamId);
```

## Database Schema

### New Tables

1. **seasons** - Season tracking
2. **archived_wellness_checkins** - Archived wellness data
3. **archived_training_sessions** - Archived training data
4. **archived_game_events** - Archived game data
5. **archived_acwr_history** - Archived ACWR data
6. **account_pause_requests** - Account pause tracking
7. **player_activity_tracking** - Inactive player detection
8. **long_term_injury_tracking** - Long-term injury exclusion
9. **season_summary_reports** - Generated reports storage

### New Functions

1. `archive_season_data(p_season_id UUID)` - Archives season data
2. `update_player_activity(p_user_id UUID)` - Updates activity tracking
3. `update_long_term_injuries()` - Updates injury exclusions
4. `pause_account(p_user_id UUID, p_paused_until TIMESTAMPTZ, p_reason TEXT)` - Pauses account
5. `resume_account(p_user_id UUID)` - Resumes account
6. `should_freeze_acwr(p_user_id UUID)` - Checks if ACWR should be frozen

### New Triggers

1. `update_activity_on_wellness` - Updates activity on wellness check-in
2. `update_activity_on_training` - Updates activity on training session

## Backend Functions

1. **season-archive.cjs** - Handles season archiving requests
2. **season-reports.cjs** - Generates season summary reports
3. **account-pause.cjs** - Handles account pause/resume
4. **inactive-player-notify.cjs** - Sends notifications to inactive players

## Frontend Service

**OffboardingService** (`angular/src/app/core/services/offboarding.service.ts`)

Provides:
- Season management (load, create, archive)
- Report generation
- Account pause/resume
- Inactive player tracking
- Long-term injury tracking
- ACWR freeze checking

## Integration Points

### ACWR Calculation

ACWR calculations should check `should_freeze_acwr()` before computing:
- Account paused → Return frozen ACWR
- Season ended → Return frozen ACWR
- Otherwise → Calculate normally

### Team Statistics

Team statistics should exclude:
- Players with `excluded_from_analytics = TRUE` in `player_activity_tracking`
- Players with `excluded_from_analytics = TRUE` in `long_term_injury_tracking`

### Dashboard Display

Coaches should see:
- Inactive players badge (30+ days)
- Long-term injuries badge
- Season end warnings
- Account pause status

## Next Steps

1. **Frontend UI Components** (Optional):
   - Season management page (`/settings/seasons`)
   - Account pause settings in settings page
   - Inactive players dashboard widget
   - Long-term injuries dashboard widget

2. **Scheduled Jobs** (Optional):
   - Daily job to update inactive player tracking
   - Daily job to update long-term injury tracking
   - Weekly job to send inactive player notifications

3. **Email Notifications** (Optional):
   - Integrate email service for inactive player notifications
   - Season end summary report emails

## Testing

To test the implementation:

1. **Season Archiving:**
   ```sql
   SELECT archive_season_data('season-id-here');
   ```

2. **Account Pause:**
   ```sql
   SELECT pause_account('user-id-here', NULL, 'Testing pause');
   SELECT resume_account('user-id-here');
   ```

3. **Inactive Player Detection:**
   ```sql
   SELECT update_player_activity('user-id-here');
   ```

4. **Long-Term Injury:**
   ```sql
   SELECT update_long_term_injuries();
   ```

## Notes

- All database functions use `SECURITY DEFINER` for proper permissions
- RLS policies are enabled on all new tables
- Archive tables preserve all original data with timestamp
- Analytics exclusion is automatic but can be manually overridden
- Account pause can be indefinite or time-limited

