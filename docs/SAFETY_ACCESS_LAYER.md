# Safety Access Layer

**Policy: "All coach-facing performance access must go through consent views"**

This document defines the mandatory data access patterns for reading player performance data in coach contexts. Following these patterns ensures GDPR compliance, user privacy, and consistent consent enforcement.

---

## Table of Contents

1. [Overview](#overview)
2. [Protected Tables](#protected-tables)
3. [Consent Views](#consent-views)
4. [DO: Approved Patterns](#do-approved-patterns)
5. [DON'T: Forbidden Patterns](#dont-forbidden-patterns)
6. [ConsentDataReader API](#consentdatareader-api)
7. [DataState Contract](#datastate-contract)
8. [CI Enforcement](#ci-enforcement)
9. [Refactoring Guide](#refactoring-guide)
10. [FAQ](#faq)

---

## Overview

The Safety Access Layer ensures that:

1. **Coaches only see data from players who have consented** to sharing
2. **Players always have full access** to their own data
3. **Consent status is always visible** in the UI (blocked vs accessible)
4. **DataState is always returned** so UI can display appropriate messages
5. **Access is audited** for GDPR Article 30 compliance

### Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI LAYER                                  │
│  - Displays dataState warnings                                   │
│  - Shows consent-blocked indicators                              │
│  - Guides users to enable sharing                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (Netlify Functions)               │
│  - Uses ConsentDataReader for coach contexts                     │
│  - Returns dataState in all responses                            │
│  - Never queries protected tables directly                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER (Supabase)                     │
│  - Consent views (v_*_consent) enforce access rules              │
│  - RLS policies provide base security                            │
│  - Helper functions check consent settings                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Protected Tables

These tables contain sensitive player performance data and **MUST NOT** be queried directly in coach contexts:

| Table | Contains | Consent View |
|-------|----------|--------------|
| `workout_logs` | Completed workouts, RPE, duration | `v_workout_logs_consent` |
| `load_monitoring` | ACWR, acute/chronic load, injury risk | `v_load_monitoring_consent` |
| `training_sessions` | Training history, workload | *(use ConsentDataReader)* |
| `training_load_metrics` | Calculated load metrics | *(use ConsentDataReader)* |
| `metric_entries` | Individual metric recordings | *(use ConsentDataReader)* |
| `wellness_entries` | Sleep, stress, recovery data | *(use ConsentDataReader)* |
| `wellness_logs` | Daily wellness check-ins | *(use ConsentDataReader)* |

---

## Consent Views

Consent views automatically:

1. **Return NULL** for sensitive fields when consent is missing
2. **Include `consent_blocked` flag** for UI handling
3. **Include `access_reason`** explaining why access was granted/denied
4. **Work with existing RLS** for base security

### v_load_monitoring_consent

```sql
-- Returns load monitoring data with consent enforcement
SELECT 
  id,
  player_id,
  daily_load,        -- NULL if consent blocked
  acute_load,        -- NULL if consent blocked
  chronic_load,      -- NULL if consent blocked
  acwr,              -- NULL if consent blocked
  injury_risk_level, -- NULL if consent blocked (requires health consent)
  consent_blocked,   -- TRUE if viewer lacks consent
  access_reason      -- 'own_data', 'team_consent', or 'no_consent'
FROM v_load_monitoring_consent;
```

### v_workout_logs_consent

```sql
-- Returns workout logs with consent enforcement
SELECT 
  id,
  player_id,
  session_id,
  completed_at,      -- NULL if consent blocked
  rpe,               -- NULL if consent blocked
  duration_minutes,  -- NULL if consent blocked
  notes,             -- NULL if consent blocked
  consent_blocked    -- TRUE if viewer lacks consent
FROM v_workout_logs_consent;
```

---

## DO: Approved Patterns

### ✅ Pattern 1: Use ConsentDataReader (Recommended)

```javascript
// netlify/functions/coach-dashboard.cjs
const { ConsentDataReader, AccessContext } = require('./utils/consent-data-reader.cjs');

async function getTeamLoadData(coachId, teamId) {
  const reader = new ConsentDataReader();
  
  const result = await reader.readLoadMonitoring({
    requesterId: coachId,
    teamId: teamId,
    context: AccessContext.COACH_TEAM_DATA,
    filters: { limit: 100 }
  });

  // Result includes:
  // - data: array of load monitoring records
  // - dataState: 'REAL_DATA', 'NO_DATA', etc.
  // - consentInfo: { blockedPlayerIds, accessibleCount }
  return result;
}
```

### ✅ Pattern 2: Use Consent Views Directly

```javascript
// When you need more control over the query
const { data, error } = await supabase
  .from('v_load_monitoring_consent')  // ✅ Uses consent view
  .select('*')
  .eq('team_id', teamId)
  .order('calculated_at', { ascending: false });

// Handle consent-blocked records in UI
const accessible = data.filter(d => !d.consent_blocked);
const blocked = data.filter(d => d.consent_blocked);
```

### ✅ Pattern 3: Player Accessing Own Data

```javascript
// Player accessing their own data - can use raw tables
// But still recommended to use views for consistency
const { data, error } = await supabase
  .from('workout_logs')  // ✅ OK for own data
  .select('*')
  .eq('player_id', userId)  // Must be the authenticated user
  .eq('player_id', authUserId); // Double-check
```

### ✅ Pattern 4: Return DataState in API Responses

```javascript
const { wrapWithDataState, DataState } = require('./utils/data-state.cjs');

// Always wrap responses with dataState
return createSuccessResponse(wrapWithDataState({
  loadData: result.data,
  summary: calculateSummary(result.data),
}, {
  dataState: result.dataState,
  currentDataPoints: result.consentInfo.accessibleCount,
  minimumRequiredDataPoints: 28,
  warnings: result.dataStateInfo.warnings,
}));
```

---

## DON'T: Forbidden Patterns

### ❌ Pattern 1: Direct Table Access in Coach Context

```javascript
// ❌ FORBIDDEN - Direct access to protected table
async function getTeamWorkouts(coachId, teamId) {
  const { data } = await supabase
    .from('workout_logs')  // ❌ Direct access!
    .select('*')
    .in('player_id', teamMemberIds);
  
  return data; // ❌ No consent checking, no dataState
}
```

**Fix:**
```javascript
// ✅ CORRECT - Use consent view
const { data } = await supabase
  .from('v_workout_logs_consent')  // ✅ Consent view
  .select('*')
  .in('player_id', teamMemberIds);
```

### ❌ Pattern 2: Missing DataState in Response

```javascript
// ❌ FORBIDDEN - No dataState in response
return createSuccessResponse({
  acwr: acwrData,
  players: playerList,
});
```

**Fix:**
```javascript
// ✅ CORRECT - Include dataState
return createSuccessResponse(wrapWithDataState({
  acwr: acwrData,
  players: playerList,
}, {
  dataState: DataState.REAL_DATA,
  currentDataPoints: playerList.length,
  minimumRequiredDataPoints: 28,
  warnings: [],
}));
```

### ❌ Pattern 3: Ignoring Consent-Blocked Flag

```javascript
// ❌ FORBIDDEN - Showing blocked data as real
const allPlayers = data.map(d => ({
  name: d.name,
  acwr: d.acwr,  // ❌ Could be NULL due to consent block
}));
```

**Fix:**
```javascript
// ✅ CORRECT - Handle consent-blocked records
const players = data.map(d => ({
  name: d.name,
  acwr: d.consent_blocked ? null : d.acwr,
  isConsentBlocked: d.consent_blocked,
  // UI should show "Data not shared" for blocked players
}));
```

### ❌ Pattern 4: Bypassing Views with Raw SQL

```javascript
// ❌ FORBIDDEN - Raw SQL bypasses consent views
const { data } = await supabase.rpc('custom_query', {
  sql: 'SELECT * FROM load_monitoring WHERE team_id = $1'
});
```

---

## ConsentDataReader API

### Constructor

```javascript
const reader = new ConsentDataReader(supabaseClient, {
  enableAuditLogging: true,  // Log access for GDPR compliance
  strictMode: true,          // Fail on consent violations
});
```

### Methods

#### readLoadMonitoring(params)

```javascript
const result = await reader.readLoadMonitoring({
  requesterId: string,        // User making the request
  playerId?: string,          // Specific player (optional)
  teamId?: string,            // Filter by team
  context: AccessContext,     // PLAYER_OWN_DATA or COACH_TEAM_DATA
  filters?: {
    startDate?: string,
    endDate?: string,
    limit?: number,
  }
});
```

#### readWorkoutLogs(params)

Same signature as `readLoadMonitoring`.

#### readTrainingSessions(params)

Same signature, but performs manual consent checking (no view exists yet).

### Response Shape

```typescript
interface ConsentDataResponse {
  success: boolean;
  data: Array<Record>;
  dataState: 'REAL_DATA' | 'NO_DATA' | 'INSUFFICIENT_DATA' | 'DEMO_DATA';
  dataStateInfo: {
    currentDataPoints: number;
    minimumRequiredDataPoints: number;
    isReliable: boolean;
    warnings: string[];
  };
  consentInfo: {
    blockedPlayerIds: string[];
    blockedCount: number;
    accessibleCount: number;
  };
  error?: string;
}
```

---

## DataState Contract

Every API response involving player performance data MUST include dataState:

| State | Meaning | UI Action |
|-------|---------|-----------|
| `REAL_DATA` | Sufficient real data available | Show data normally |
| `NO_DATA` | No data exists | Show "Start logging" prompt |
| `INSUFFICIENT_DATA` | Data exists but not enough | Show partial + warning |
| `DEMO_DATA` | Demonstration/sample data | Show "Demo" badge |

### Minimum Data Requirements

| Metric | Minimum Days | Source |
|--------|--------------|--------|
| ACWR | 28 | Gabbett (2016) |
| Acute Load | 7 | Standard rolling average |
| Chronic Load | 28 | Gabbett (2016) |
| Training Monotony | 7 | Foster (1998) |
| TSB | 42 | Bannister model |

---

## CI Enforcement

### Running the Checker

```bash
# Report mode (no failure)
npm run check:consent

# Strict mode (fails CI on violations)
npm run check:consent -- --strict

# Show fix suggestions
npm run check:consent -- --fix

# CI mode (JSON output)
npm run check:consent -- --ci --strict
```

### CI Integration

Add to `.github/workflows/ci.yml`:

```yaml
consent-check:
  name: Consent Violation Check
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '22.x'
    - run: npm ci
    - name: Check for consent violations
      run: npm run check:consent -- --strict --ci
```

### What Gets Flagged

The checker detects:

1. **Direct queries** to protected tables in coach-context files
2. **Missing consent views** where they should be used
3. **Coach-context functions** that bypass the safety layer

---

## Refactoring Guide

### Step 1: Identify Violations

```bash
npm run check:consent -- --fix
```

### Step 2: Import ConsentDataReader

```javascript
const { 
  ConsentDataReader, 
  AccessContext 
} = require('./utils/consent-data-reader.cjs');
```

### Step 3: Replace Direct Queries

**Before:**
```javascript
const { data } = await supabase
  .from('training_sessions')
  .select('*')
  .in('user_id', teamMemberIds);
```

**After:**
```javascript
const reader = new ConsentDataReader();
const result = await reader.readTrainingSessions({
  requesterId: coachId,
  teamId: teamId,
  context: AccessContext.COACH_TEAM_DATA,
});
```

### Step 4: Update Response Format

**Before:**
```javascript
return createSuccessResponse({ sessions: data });
```

**After:**
```javascript
return createSuccessResponse({
  sessions: result.data,
  dataState: result.dataState,
  dataStateInfo: result.dataStateInfo,
  consentInfo: result.consentInfo,
});
```

### Step 5: Update Frontend

Handle the new response shape:

```typescript
// Angular component
if (response.consentInfo.blockedCount > 0) {
  this.showConsentBlockedMessage(response.consentInfo.blockedPlayerIds);
}

if (response.dataState !== 'REAL_DATA') {
  this.showDataStateWarning(response.dataStateInfo.warnings);
}
```

---

## FAQ

### Q: Can players access their own data directly?

**A:** Yes, players can query their own data from raw tables. However, using consent views is still recommended for consistency. The views return `consent_blocked: false` and `access_reason: 'own_data'` for the player's own records.

### Q: What if I need a custom query?

**A:** Extend ConsentDataReader with a new method, or use consent views directly. Never query protected tables directly in coach context.

### Q: How do I add a new protected table?

**A:** 
1. Add the table to `CONSENT_PROTECTED_TABLES` in `consent-data-reader.cjs`
2. Create a consent view (see migration 071 for examples)
3. Add the view mapping to `CONSENT_VIEWS`
4. Update this documentation

### Q: What about admin users?

**A:** Admin operations should use `AccessContext.ADMIN_SYSTEM` and may have different rules. Document any exceptions in the allowed exceptions list.

### Q: How is access audited?

**A:** ConsentDataReader automatically logs access to `consent_access_log` table when `enableAuditLogging: true`. This supports GDPR Article 30 compliance.

---

## Related Documentation

- [Privacy Policy](./PRIVACY_POLICY.md)
- [Player Data Safety Guide](./PLAYER_DATA_SAFETY_GUIDE.md)
- [RLS Policy Specification](./RLS_POLICY_SPECIFICATION.md)
- [Privacy Safety Release Checklist](./PRIVACY_SAFETY_RELEASE_CHECKLIST.md)

---

*Last updated: 29. December 2025*
*Športno društvo Žabe - Athletes helping athletes since 2020*

