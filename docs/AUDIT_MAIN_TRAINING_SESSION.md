# Audit: Main Training Session Not Showing

## Issue
Today's training is not showing the main training session for each player. The main session should be determined based on:
1. Whether players have gym training scheduled
2. Sprint sessions (especially on Saturdays)
3. Flag training preference (from onboarding or settings)

## Root Causes Identified

### 1. Main Session Generation Logic Missing Key Checks
**Location**: `netlify/functions/daily-protocol.cjs` lines 2646-2753

**Problem**: Main session is only generated if:
- `context.sessionTemplate` exists AND
- `!isPracticeDay && !isFilmRoomDay`

**Missing Logic**:
- No check for `has_gym_access` from `athlete_training_config`
- No check for sprint sessions (especially Saturday)
- No check for flag training preference
- No fallback when session template doesn't exist but player should still have a main session

### 2. Warmup Not Sprint-Aware
**Location**: `netlify/functions/daily-protocol.cjs` lines 2176-2239

**Problem**: Warmup generation only checks:
- QB/Center for throwing warmup
- Standard warmup for other positions

**Missing Logic**:
- No check if it's a sprint session to include sprint-specific warmups:
  - Askips
  - Bskips
  - Hamstring stretches
  - Toy soldiers
  - Pogos
  - Jump rope
- Wall slides for QBs/Centers should be skipped on sprint days

### 3. Sprint Saturday Detection Not Used
**Location**: `netlify/functions/utils/session-resolver.cjs` line 287

**Problem**: `sprint_saturday` override exists but:
- Not used to determine main session type
- Not used to determine warmup type
- Only sets a generic `sessionModification` that doesn't affect protocol generation

### 4. Training Preferences Not Checked
**Location**: `netlify/functions/daily-protocol.cjs` `getUserTrainingContext` function

**Problem**: `has_gym_access` and `has_field_access` are in `context.config` but:
- Not exposed as separate fields in context
- Not checked when determining main session type
- No logic to choose between gym training vs flag training

## Expected Behavior

### Main Session Decision Logic (Priority Order):
1. **Sprint Session** (especially Saturday):
   - If `dayOfWeek === 6` (Saturday) OR session type is "speed"/"sprint"
   - Generate sprint-focused main session
   - Include sprint-specific warmup (Askips, Bskips, hamstring stretches, toy soldiers, pogos, jump rope)
   - Skip QB/Center wall slides

2. **Gym Training**:
   - If `has_gym_access === true` AND not sprint session AND not flag practice
   - Generate gym-based main session (strength, plyometrics, isometrics)
   - Use standard warmup (unless sprint session)

3. **Flag Training**:
   - If player prefers flag training (from onboarding/settings) AND not sprint session AND not gym day
   - Generate flag football-specific main session
   - Use standard warmup

4. **Fallback**:
   - If no session template but player should have training, generate appropriate session based on preferences

### Warmup Decision Logic:
- **Sprint Session**: Include Askips, Bskips, hamstring stretches, toy soldiers, pogos, jump rope. Skip QB/Center wall slides.
- **Gym Training**: Standard warmup (unless sprint session)
- **Flag Practice**: Standard warmup
- **QB/Center Non-Sprint**: Include throwing warmup (wall slides, rotator cuff, etc.)

## Fixes Required

1. Add sprint session detection logic
2. Check `has_gym_access` and training preferences
3. Generate appropriate warmup based on session type
4. Generate appropriate main session based on session type and preferences
5. Add fallback main session generation when session template doesn't exist
