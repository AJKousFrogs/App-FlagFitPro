# Onboarding Program Assignment Fix

## Problem
When users complete onboarding, they see an orange "Setup incomplete" banner with the message:
> "Training program assignment is pending. You can still access the app, but your personalized plan may not be ready yet."

This occurs because the program assignment is failing during the onboarding process.

## Root Cause
**UUID Mismatch Between Code and Database**

The frontend and backend code were referencing incorrect program UUIDs that don't exist in the database:

### Before (Incorrect):
- QB Program: `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb` ❌
- WR/DB Program: `ffffffff-ffff-ffff-ffff-ffffffffffff` ❌

### After (Correct):
- QB Program: `11111111-1111-1111-1111-111111111111` ✅
- WR/DB Program: `22222222-2222-2222-2222-222222222222` ✅

## Database Programs
The actual programs that exist in the database are:

1. **QB Annual Program 2025-2026**
   - UUID: `11111111-1111-1111-1111-111111111111`
   - Seeded in: `database/seed-qb-annual-program-corrected.sql`
   - Comprehensive QB training with proper throwing volume progression

2. **WR/DB Speed & Agility Program 2025-2026**
   - UUID: `22222222-2222-2222-2222-222222222222`
   - Created in: `database/migrations/067_wrdb_training_program.sql`
   - Position-specific program for Wide Receivers and Defensive Backs

## Files Fixed

### Frontend
- `angular/src/app/core/services/player-program.service.ts`
  - Updated `PROGRAM_IDS` constants to match database UUIDs

### Backend
- `netlify/functions/player-programs.cjs`
  - Updated `PROGRAM_IDS` constants to match database UUIDs

## Testing
After deployment, verify:
1. ✅ New user completes onboarding
2. ✅ Select position (QB, WR, DB, etc.)
3. ✅ Click "Complete Setup"
4. ✅ Should see success message (green)
5. ✅ Should NOT see "Setup incomplete" warning (orange)
6. ✅ Redirected to dashboard
7. ✅ Check database: `player_programs` table has active row
8. ✅ Program assignment visible in app

## Impact
- **Critical**: Fixes onboarding for ALL new users
- **Severity**: High - prevents users from getting assigned training programs
- **User Experience**: Eliminates confusing "Setup incomplete" message
- **Data Integrity**: Ensures player_programs table is properly populated

## Deployment Required
**YES** - These changes must be deployed to production immediately.

The fix updates hardcoded UUIDs in both frontend and backend code to match the actual database records.
