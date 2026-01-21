# Fix: Main Training Session Generation

## Changes Made

### 1. Sprint Session Detection
**Location**: `netlify/functions/daily-protocol.cjs` (before warmup section)

Added early detection of sprint sessions:
- Saturday (dayOfWeek === 6)
- Sprint Saturday override from session resolver
- Session template type is "speed" or "sprint"

```javascript
const isSprintSession = 
  context.dayOfWeek === 6 || // Saturday
  context.sessionResolution?.override?.type === "sprint_saturday" ||
  context.sessionTemplate?.session_type?.toLowerCase() === "speed" ||
  context.sessionTemplate?.session_type?.toLowerCase() === "sprint";
```

### 2. Sprint-Specific Warmup
**Location**: `netlify/functions/daily-protocol.cjs` (warmup section)

When sprint session is detected:
- Includes sprint-specific warmup exercises:
  - Askips
  - Bskips
  - Hamstring stretches
  - Toy soldiers
  - Pogos
  - Jump rope
- Skips QB/Center wall slides (sprint warmup takes priority)
- Falls back to standard warmup if sprint exercises not found in DB

### 3. Main Session Generation Logic
**Location**: `netlify/functions/daily-protocol.cjs` (main session section)

**Priority Order**:
1. **Session Template** (if exists and not practice/film room day)
2. **Sprint Session** (if Saturday or sprint session detected)
   - Generates sprint-focused exercises
   - Uses sprint/speed/agility categories
3. **Gym Training** (if `has_gym_access === true` and gym training day)
   - Uses existing gym blocks (isometrics, plyometrics, strength)
4. **Flag Training** (if `has_field_access === true` and no gym access)
   - Generates flag football-specific exercises
   - Uses skill/agility/conditioning categories
5. **Fallback** (if none of above)
   - Generates generic training session based on available exercises

### 4. Training Preferences Check
**Location**: `netlify/functions/daily-protocol.cjs` (main session section)

Now checks:
- `has_gym_access` from `athlete_training_config`
- `has_field_access` from `athlete_training_config`
- Day of week for sprint sessions
- Training focus (recovery days skip main session)

## Expected Behavior After Fix

### Saturday (Sprint Session):
- **Warmup**: Askips, Bskips, hamstring stretches, toy soldiers, pogos, jump rope
- **Main Session**: Sprint-focused exercises (speed, acceleration, agility)
- **QB/Center**: Wall slides skipped, sprint warmup used instead

### Gym Training Day (has_gym_access === true):
- **Warmup**: Standard warmup (unless sprint session)
- **Main Session**: Gym blocks (isometrics, plyometrics, strength) serve as main session

### Flag Training Day (has_field_access === true, no gym access):
- **Warmup**: Standard warmup
- **Main Session**: Flag football-specific exercises (skill, agility, conditioning)

### Regular Training Day (has session template):
- **Warmup**: Standard warmup (or QB/Center throwing warmup)
- **Main Session**: Exercises from session template

## Testing Checklist

- [ ] Saturday shows sprint session with sprint warmup
- [ ] Players with gym access get gym-based main session
- [ ] Players without gym access get flag training main session
- [ ] QB/Center wall slides skipped on sprint days
- [ ] Sprint warmup includes Askips, Bskips, hamstring stretches, toy soldiers, pogos, jump rope
- [ ] Main session always shows (unless recovery day or practice/film room day)
- [ ] Fallback main session generates when no template exists
