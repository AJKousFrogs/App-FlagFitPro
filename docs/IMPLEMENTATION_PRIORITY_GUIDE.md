# Implementation Priority Guide

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ Implementation Roadmap

---

## Overview

This guide prioritizes the critical fixes and implementations needed to address the gaps identified in the technical review. It provides a clear roadmap for development teams.

---

## "If You Only Fix 10 Things" List

### 1. Define API Ownership Map ✅

**Status**: Documented in [API_OWNERSHIP_MAP.md](./API_OWNERSHIP_MAP.md)

**Action Items:**

- ✅ Document which requests hit Supabase directly vs Netlify Functions
- ⏳ Migrate write operations to Netlify Functions
- ⏳ Standardize error responses
- ⏳ Add request/response validation

**Priority**: **HIGH** - Foundation for all other work

---

### 2. Write Schema + Constraints for Core Tables ✅

**Status**: Documented in [DATABASE_SCHEMA_CONSTRAINTS.md](./DATABASE_SCHEMA_CONSTRAINTS.md)

**Action Items:**

- ✅ Document required fields, constraints, unique indexes
- ⏳ Create SQL migration for missing constraints
- ⏳ Add foreign key constraints
- ⏳ Add check constraints
- ⏳ Add unique indexes

**Priority**: **HIGH** - Data integrity foundation

---

### 3. Define RLS Rules Per Table ✅

**Status**: Documented in [RLS_POLICY_SPECIFICATION.md](./RLS_POLICY_SPECIFICATION.md)

**Action Items:**

- ✅ Document policy intent per table
- ⏳ Implement missing RLS policies
- ⏳ Test policies with different user roles
- ⏳ Add admin override patterns

**Priority**: **HIGH** - Security foundation

---

### 4. Fix ACWR: Baseline Requirement + Denominator Protection + Recalc Strategy

**Status**: Documented in [EDGE_CASE_HANDLING.md](./EDGE_CASE_HANDLING.md)

**Action Items:**

- ⏳ Implement baseline requirement check (< 28 days)
- ⏳ Add minimum denominator threshold (chronic_load < 50)
- ⏳ Implement safe ACWR calculation function
- ⏳ Add recalc strategy for session edits
- ⏳ Update UI to show baseline building status

**Priority**: **HIGH** - Core feature correctness

**Implementation:**

```sql
-- See EDGE_CASE_HANDLING.md for full implementation
CREATE OR REPLACE FUNCTION calculate_acwr_safe(...)
```

---

### 5. Separate Planned Sessions vs Completed Logs

**Status**: Documented in [EDGE_CASE_HANDLING.md](./EDGE_CASE_HANDLING.md)

**Action Items:**

- ⏳ Clarify entity separation (training_sessions vs workout_logs)
- ⏳ Update API endpoints:
  - `POST /api/training/sessions` → Creates planned session
  - `POST /api/training/workout-logs` → Creates completed session
- ⏳ Update frontend to use correct endpoints
- ⏳ Add `source_session_id` link in workout_logs

**Priority**: **HIGH** - Data model clarity

---

### 6. Implement Invitations with Token Hashing + DB Uniqueness

**Status**: Partially documented

**Action Items:**

- ⏳ Add `token_hash` column (hashed, not plain text)
- ⏳ Add unique constraint on `(team_id, email_normalized)` where `status = 'pending'`
- ⏳ Implement token hashing in backend
- ⏳ Add email normalization
- ⏳ Add acceptance validation (email match, expiration check)

**Priority**: **HIGH** - Security and data integrity

**Implementation:**

```sql
-- See DATABASE_SCHEMA_CONSTRAINTS.md for schema
-- Add token hashing in backend:
const tokenHash = await bcrypt.hash(token, 10);
```

---

### 7. Define Tournament Formats and Match Lifecycle States

**Status**: Documented in [EDGE_CASE_HANDLING.md](./EDGE_CASE_HANDLING.md)

**Action Items:**

- ⏳ Add `format` column to tournaments table
- ⏳ Add `bracket_metadata` JSONB column
- ⏳ Implement bracket generation logic
- ⏳ Add match lifecycle states (scheduled, in_progress, completed, cancelled)
- ⏳ Add match editing rules
- ⏳ Implement tie breaker logic

**Priority**: **MEDIUM** - Feature completeness

---

### 8. Add Analytics Retention + Aggregation Jobs

**Status**: Documented in [EDGE_CASE_HANDLING.md](./EDGE_CASE_HANDLING.md)

**Action Items:**

- ⏳ Implement 90-day retention policy for raw events
- ⏳ Create daily aggregation job
- ⏳ Create weekly aggregation job
- ⏳ Create monthly aggregation job
- ⏳ Add PII minimization for long-term storage
- ⏳ Schedule cleanup jobs (pg_cron or external scheduler)

**Priority**: **MEDIUM** - Performance and compliance

**Implementation:**

```sql
-- Daily cleanup
CREATE OR REPLACE FUNCTION cleanup_old_analytics_events()
RETURNS void AS $$
BEGIN
  DELETE FROM analytics_events
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Daily aggregation
CREATE OR REPLACE FUNCTION aggregate_daily_analytics()
RETURNS void AS $$
BEGIN
  INSERT INTO analytics_aggregates (user_id, aggregation_type, aggregation_date, metrics)
  SELECT
    user_id,
    'daily',
    DATE(created_at),
    jsonb_build_object(
      'event_count', COUNT(*),
      'unique_sessions', COUNT(DISTINCT session_id),
      'features_used', array_agg(DISTINCT event_data->>'feature')
    )
  FROM analytics_events
  WHERE DATE(created_at) = CURRENT_DATE - INTERVAL '1 day'
  GROUP BY user_id, DATE(created_at)
  ON CONFLICT (user_id, team_id, aggregation_type, aggregation_date)
  DO UPDATE SET metrics = EXCLUDED.metrics;
END;
$$ LANGUAGE plpgsql;
```

---

### 9. Add Moderation Workflow for Community

**Status**: Partially documented

**Action Items:**

- ⏳ Create `community_reports` table
- ⏳ Create `moderation_actions` table
- ⏳ Implement report reasons and thresholds
- ⏳ Create admin moderation queue
- ⏳ Add audit trail for moderation actions
- ⏳ Implement content takedown workflow
- ⏳ Add shadow ban patterns

**Priority**: **MEDIUM** - Community safety

**Schema:**

```sql
CREATE TABLE community_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason VARCHAR(100) NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
  details TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES community_reports(id),
  post_id UUID NOT NULL REFERENCES community_posts(id),
  action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('warn', 'hide', 'delete', 'ban_user', 'no_action')),
  reason TEXT NOT NULL,
  moderator_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### 10. Add AI Risk Tiers + Curated Retrieval and Feedback Loop

**Status**: Documented in [AI_COACHING_SYSTEM_REVAMP.md](./AI_COACHING_SYSTEM_REVAMP.md)

**Action Items:**

- ⏳ Implement risk classification stage
- ⏳ Create safety tier system (low/medium/high)
- ⏳ Build curated knowledge base
- ⏳ Add source scoring system
- ⏳ Implement response templates per risk level
- ⏳ Add feedback capture system
- ⏳ Create improvement loop

**Priority**: **HIGH** - Safety and liability

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

**Goal**: Establish core infrastructure

1. ✅ API Ownership Map
2. ✅ Database Schema + Constraints
3. ✅ RLS Policy Specification
4. ⏳ Create SQL migration for constraints
5. ⏳ Implement missing RLS policies

**Deliverables:**

- Complete API ownership documentation
- Database migration with constraints
- RLS policies implemented and tested

---

### Phase 2: Core Features (Weeks 3-4)

**Goal**: Fix critical feature gaps

1. ⏳ Fix ACWR calculation
2. ⏳ Separate planned vs completed sessions
3. ⏳ Implement invitation system with token hashing
4. ⏳ Add edge case handling

**Deliverables:**

- Working ACWR calculation with baseline checks
- Clear separation of planned/completed sessions
- Secure invitation system

---

### Phase 3: Feature Completeness (Weeks 5-6)

**Goal**: Complete remaining features

1. ⏳ Tournament formats and match lifecycle
2. ⏳ Analytics retention and aggregation
3. ⏳ Community moderation workflow
4. ⏳ AI coaching system revamp

**Deliverables:**

- Complete tournament system
- Analytics aggregation jobs
- Moderation workflow
- Safe AI coaching system

---

## Quick Wins (Can Do Immediately)

1. **Add missing unique constraints** (30 minutes)

   ```sql
   CREATE UNIQUE INDEX idx_team_members_unique
   ON team_members(team_id, user_id)
   WHERE deleted_at IS NULL;
   ```

2. **Add email normalization** (1 hour)

   ```sql
   ALTER TABLE profiles ADD COLUMN email_normalized VARCHAR(255);
   UPDATE profiles SET email_normalized = LOWER(TRIM(email));
   CREATE UNIQUE INDEX idx_profiles_email_normalized ON profiles(email_normalized);
   ```

3. **Add baseline check to ACWR** (2 hours)
   - Update `calculate_acwr_safe` function
   - Add `baseline_days` to response

4. **Standardize error responses** (2 hours)
   - Create error response utility
   - Update all endpoints to use it

---

## Testing Checklist

### Database Constraints

- [ ] Unique constraints prevent duplicates
- [ ] Foreign keys prevent orphaned records
- [ ] Check constraints enforce business rules
- [ ] Soft delete works correctly

### RLS Policies

- [ ] Users can only access their own data
- [ ] Team members can access team data
- [ ] Coaches can access team member data
- [ ] Admins can access all data
- [ ] Public resources accessible to all

### Edge Cases

- [ ] ACWR handles < 28 days baseline
- [ ] ACWR handles zero chronic load
- [ ] Invitations handle email mismatches
- [ ] Invitations handle expired tokens
- [ ] Session editing recalculates load

### API Ownership

- [ ] Write operations go through Netlify Functions
- [ ] Read operations can use Supabase direct
- [ ] Error responses are standardized
- [ ] Rate limiting works correctly

---

## Related Documentation

- [API_OWNERSHIP_MAP.md](./API_OWNERSHIP_MAP.md) - API structure
- [DATABASE_SCHEMA_CONSTRAINTS.md](./DATABASE_SCHEMA_CONSTRAINTS.md) - Schema details
- [RLS_POLICY_SPECIFICATION.md](./RLS_POLICY_SPECIFICATION.md) - Security policies
- [EDGE_CASE_HANDLING.md](./EDGE_CASE_HANDLING.md) - Edge cases
- [AI_COACHING_SYSTEM_REVAMP.md](./AI_COACHING_SYSTEM_REVAMP.md) - AI system
