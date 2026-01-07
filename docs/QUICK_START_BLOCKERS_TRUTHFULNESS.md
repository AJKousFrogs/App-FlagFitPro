# Quick Start: Blockers A & B + Truthfulness Contract

## TL;DR

We've implemented the "backend is truth" foundation that fixes two critical blockers and enables clean UI work.

**What Changed:**
1. ✅ Every athlete now **always** has a real session from their 52-week plan (no generic fallbacks)
2. ✅ Every athlete **must** have an active program (enforced at onboarding + backfill for existing)
3. ✅ Backend stores **truthful nulls** instead of misleading defaults (75, 1.05)
4. ✅ Backend provides **confidence metadata** so UI can render missing data clearly

---

## Immediate Actions Required

### 1. Apply Database Migration

```bash
# Run the migration to add confidence_metadata column
psql $DATABASE_URL -f database/migrations/097_add_confidence_metadata.sql
```

### 2. Backfill Existing Users (One-Time)

```bash
# First, dry run to see what will happen
node scripts/backfill-player-programs.cjs --dry-run

# Review the output, then run for real
node scripts/backfill-player-programs.cjs
```

**What this does:**
- Finds all users without active programs
- Assigns them to QB or WR/DB program based on their position
- Logs all assignments for audit

### 3. Deploy Code Changes

**Backend changes:**
- `netlify/functions/daily-protocol.cjs` - Now uses session resolver and truthful data
- `netlify/functions/utils/session-resolver.cjs` - NEW: Deterministic session resolver

**Frontend changes:**
- `angular/src/app/features/onboarding/onboarding.component.ts` - Program assignment now mandatory

**Deploy these together** so onboarding enforcement and backfill are aligned.

---

## For Frontend Developers

### New API Response Format

**Before (lying):**
```json
{
  "readiness_score": 75,  // ❌ Default when no check-in
  "acwr_value": 1.05      // ❌ Default when no training
}
```

**Now (truthful):**
```json
{
  "readiness_score": null,  // ✅ NULL when no check-in
  "acwr_value": null,       // ✅ NULL when no training
  "confidence_metadata": {
    "readiness": {
      "hasData": false,
      "source": "none",
      "confidence": "none"
    },
    "acwr": {
      "hasData": false,
      "trainingDaysLogged": 0,
      "confidence": "building_baseline"
    },
    "sessionResolution": {
      "success": true,
      "status": "resolved",
      "hasProgram": true,
      "hasSessionTemplate": true
    }
  }
}
```

### How to Render Missing Data

**Readiness Score (null):**
```html
<!-- Instead of showing "75" -->
<div class="readiness-widget">
  <span class="value">—</span>
  <span class="label">Readiness</span>
  <p-tooltip>Do today's check-in to unlock personalized intensity</p-tooltip>
  <p-button label="2-min Check-in" (click)="openCheckin()"></p-button>
</div>
```

**ACWR (null, early phase):**
```html
<!-- Instead of "Low Confidence" -->
<div class="acwr-widget">
  <span class="value">—</span>
  <span class="label">Building your load baseline</span>
  <div class="progress">
    <span>{{ trainingDaysLogged }}/21 training days logged</span>
    <p-progressBar [value]="(trainingDaysLogged / 21) * 100"></p-progressBar>
  </div>
  <span class="hint">Keep logging to unlock injury-risk insights</span>
</div>
```

### Check Confidence Before Showing Features

```typescript
// Example: Only show detailed ACWR insights if confidence is high
if (protocol.confidence_metadata?.acwr?.confidence === 'high') {
  // Show injury risk zones, recommendations, etc.
} else if (protocol.confidence_metadata?.acwr?.confidence === 'building_baseline') {
  // Show "Building baseline" message with progress
} else {
  // Show "— No data yet" with CTA to log training
}
```

---

## For Backend Developers

### Using the Session Resolver

```javascript
const { resolveTodaySession } = require('./utils/session-resolver.cjs');

const resolution = await resolveTodaySession(supabase, userId, date);

if (resolution.success) {
  // We have a real session from the program
  const sessionTemplate = resolution.session;
  const override = resolution.override; // e.g., 'rehab_protocol', 'flag_practice'
  
  console.log('Session:', sessionTemplate.session_name);
  console.log('Override:', override?.type || 'none');
} else {
  // Resolution failed - handle truthfully
  console.error('Cannot resolve session:', resolution.status);
  console.error('Reason:', resolution.reason);
  
  // Return explicit error to user:
  // "No scheduled session found. Coach needs to publish plan."
}
```

### Truthful Data Pattern

```javascript
// ❌ OLD WAY: Lie with defaults
const readiness = data.readiness_score || 75;

// ✅ NEW WAY: Truth in storage, safe defaults for logic
const readinessTruth = data.readiness_score || null;  // What we store
const readinessForLogic = readinessTruth ?? 70;      // What we use in calculations

// Persist TRUTH
await supabase.from('daily_protocols').insert({
  readiness_score: readinessTruth,  // NULL if no checkin
  confidence_metadata: {
    readiness: {
      hasData: readinessTruth !== null,
      confidence: readinessTruth !== null ? 'high' : 'none',
    }
  }
});
```

---

## Testing Checklist

### Blocker A: Session Resolver
- [ ] User with active program → resolves session ✅
- [ ] User without program → returns 'no_program' status ✅
- [ ] Rest day (no template) → returns 'no_template' status ✅
- [ ] Active injury → applies 'rehab_protocol' override ✅
- [ ] Flag practice day → applies 'flag_practice' override ✅
- [ ] Taper period → applies 'taper_period' override ✅

### Blocker B: Program Assignment
- [ ] New user onboarding (QB position) → assigns QB program ✅
- [ ] New user onboarding (WR position) → assigns WR/DB program ✅
- [ ] Onboarding without position → fails with error ✅
- [ ] Backfill script (dry-run) → shows assignments without changes ✅
- [ ] Backfill script (live) → creates assignments for all users ✅

### Prompt 6: Truthfulness
- [ ] User with no checkin → `readiness_score: null` ✅
- [ ] User with no training → `acwr_value: null` ✅
- [ ] Confidence metadata populated correctly ✅
- [ ] Protocol generation still works with nulls ✅
- [ ] Internal logic uses safe defaults, doesn't persist them ✅

---

## Common Issues & Solutions

### "User has no program assigned"

**Cause:** Existing user who signed up before Blocker B enforcement.

**Solution:** Run backfill script:
```bash
node scripts/backfill-player-programs.cjs
```

### "Session resolution failed: no_template"

**Cause:** The 52-week program doesn't have a template for this day (may be intentional rest day).

**Solution:** 
- Check if it's a rest day (Sunday = 0) → show "Rest Day" UI
- If not a rest day, coach needs to add template for that week/day

### "Onboarding fails at final step"

**Cause:** Program assignment failed (network issue, database issue, or position not selected).

**Check:**
1. User selected a position? (Required)
2. Database connection OK?
3. Training programs exist in database? (QB and WR/DB UUIDs)

**Fix:** User can retry onboarding, or admin can manually assign program.

### "Frontend shows 75 instead of —"

**Cause:** Frontend not updated to handle null values.

**Fix:** Update component to check for null:
```typescript
// Before
<span>{{ protocol.readiness_score }}</span>

// After
<span>{{ protocol.readiness_score ?? '—' }}</span>
```

---

## Environment Setup

**Required environment variables:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

**Program UUIDs (must exist in database):**
```javascript
QB_PROGRAM_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
WRDB_PROGRAM_ID = 'ffffffff-ffff-ffff-ffff-ffffffffffff'
```

---

## Monitoring

**Watch for these in logs:**

### Session Resolution
```
[daily-protocol] Session resolved successfully: { sessionName: "Lower Body Power", override: "none" }
[daily-protocol] Session resolution failed: { status: "no_program", reason: "..." }
```

### Program Assignment
```
[Onboarding] ✅ Successfully assigned program: Ljubljana Frogs QB Annual Program
[Onboarding] ❌ Program assignment FAILED (CRITICAL - BLOCKER B)
```

### Truthfulness
```
[daily-protocol] Truthfulness contract check: {
  readiness: { truth: null, forLogic: 70, willPersist: null },
  acwr: { truth: null, forLogic: 1.0, willPersist: null }
}
```

---

## Next: UI Consistency (Prompts 1-5)

Now that backend truth is in place, you can proceed with clean UI work:

1. **Dashboard:** "2-minute check-in" primary CTA
2. **Today:** Render `—` + tooltip for missing data
3. **ACWR:** "Building baseline (X/21 days)" messaging
4. **Merlin:** Respect confidence levels in recommendations
5. **Stale data:** Warning icon when check-in > 1 day old

See full implementation doc: `IMPLEMENTATION_BLOCKERS_AND_PROMPT6.md`

---

## Questions?

- **Session resolution failing?** Check `sessionResolution.status` and `reason` in confidence metadata
- **Backfill not working?** Run with `--dry-run` first to diagnose
- **Null values breaking UI?** Use nullish coalescing: `value ?? '—'`
- **Need to test locally?** Use test database and create test programs with correct UUIDs

**Key principle:** Backend provides **truth + confidence**. Frontend renders **clarity + action**.

