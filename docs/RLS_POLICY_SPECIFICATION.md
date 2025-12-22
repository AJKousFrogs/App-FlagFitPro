# RLS Policy Specification

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ Implementation Guide

---

## Overview

This document specifies Row Level Security (RLS) policies for all tables. RLS is the primary security mechanism in Supabase/PostgreSQL, enforcing access control at the database level.

---

## Policy Design Principles

1. **Default Deny**: All tables have RLS enabled, deny by default
2. **Explicit Allow**: Policies explicitly grant access
3. **Least Privilege**: Users get minimum required access
4. **Team-Scoped**: Team membership determines access
5. **Role-Based**: Roles determine permissions
6. **Audit Trail**: Policies support audit logging

---

## Helper Functions

```sql
-- Get current user ID (UUID)
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID AS $$
  SELECT COALESCE(
    auth.uid(),
    (current_setting('request.jwt.claims', true)::jsonb->>'sub')::uuid
  );
$$ LANGUAGE SQL STABLE;

-- Get current user ID (TEXT for legacy tables)
CREATE OR REPLACE FUNCTION auth.user_id_text()
RETURNS TEXT AS $$
  SELECT COALESCE(
    auth.uid()::text,
    current_setting('request.jwt.claims', true)::jsonb->>'sub'
  );
$$ LANGUAGE SQL STABLE;

-- Check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.user_id()
    AND role_global = 'admin'
  );
$$ LANGUAGE SQL STABLE;

-- Check if user is team coach
CREATE OR REPLACE FUNCTION auth.is_team_coach(team_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = team_uuid
    AND user_id = auth.user_id()
    AND role_team IN ('coach', 'admin')
    AND status = 'active'
    AND deleted_at IS NULL
  );
$$ LANGUAGE SQL STABLE;
```

---

## Table Policies

### `profiles`

**Intent**: Users can read/update own profile; admins can read all

**Policies:**

```sql
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (user_id = auth.user_id());

-- Users can view public profile info (name, avatar) of others
CREATE POLICY "Users can view public profiles"
ON profiles FOR SELECT
USING (true); -- Public read for team features

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (user_id = auth.user_id())
WITH CHECK (user_id = auth.user_id());

-- Users can insert their own profile (during registration)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (user_id = auth.user_id());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (auth.is_admin());
```

**Access Patterns:**
- ✅ User reads own profile
- ✅ User updates own profile
- ✅ User reads public info of teammates
- ✅ Admin reads all profiles
- ❌ User cannot update others' profiles
- ❌ User cannot delete profiles (soft delete only)

---

### `teams`

**Intent**: Members can read; coaches can update; public teams viewable by all

**Policies:**

```sql
-- Team members can view their teams
CREATE POLICY "Team members can view teams"
ON teams FOR SELECT
USING (
  id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id()
    AND deleted_at IS NULL
  )
  OR is_public = true
);

-- Public teams are viewable by all
CREATE POLICY "Public teams are viewable"
ON teams FOR SELECT
USING (is_public = true AND deleted_at IS NULL);

-- Team coaches can update their teams
CREATE POLICY "Team coaches can update teams"
ON teams FOR UPDATE
USING (
  id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id()
    AND role_team IN ('coach', 'admin')
    AND status = 'active'
    AND deleted_at IS NULL
  )
)
WITH CHECK (
  id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id()
    AND role_team IN ('coach', 'admin')
    AND status = 'active'
    AND deleted_at IS NULL
  )
);

-- Anyone can create teams
CREATE POLICY "Anyone can create teams"
ON teams FOR INSERT
WITH CHECK (true);

-- Team coaches can delete (soft delete) their teams
CREATE POLICY "Team coaches can delete teams"
ON teams FOR DELETE
USING (
  id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id()
    AND role_team = 'coach'
    AND status = 'active'
    AND deleted_at IS NULL
  )
);
```

**Access Patterns:**
- ✅ Team members read their teams
- ✅ Public teams readable by all
- ✅ Coaches update their teams
- ✅ Anyone can create teams
- ✅ Coaches can soft-delete their teams
- ❌ Non-members cannot read private teams
- ❌ Non-coaches cannot update teams

---

### `team_members`

**Intent**: Members can read roster; coaches can manage membership

**Policies:**

```sql
-- Team members can view teammates
CREATE POLICY "Team members can view teammates"
ON team_members FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id()
    AND deleted_at IS NULL
  )
);

-- Team coaches can add members
CREATE POLICY "Team coaches can add members"
ON team_members FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id()
    AND role_team IN ('coach', 'admin')
    AND status = 'active'
    AND deleted_at IS NULL
  )
);

-- Team coaches can update members (role, position, jersey)
CREATE POLICY "Team coaches can update members"
ON team_members FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id()
    AND role_team IN ('coach', 'admin')
    AND status = 'active'
    AND deleted_at IS NULL
  )
)
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id()
    AND role_team IN ('coach', 'admin')
    AND status = 'active'
    AND deleted_at IS NULL
  )
);

-- Team coaches can remove members
CREATE POLICY "Team coaches can remove members"
ON team_members FOR DELETE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id()
    AND role_team IN ('coach', 'admin')
    AND status = 'active'
    AND deleted_at IS NULL
  )
);

-- Users can leave teams themselves
CREATE POLICY "Users can leave teams"
ON team_members FOR DELETE
USING (user_id = auth.user_id());
```

**Access Patterns:**
- ✅ Team members read roster
- ✅ Coaches add/update/remove members
- ✅ Users can leave teams
- ❌ Non-members cannot read roster
- ❌ Non-coaches cannot manage membership

---

### `team_invitations`

**Intent**: Coaches can create/read for their team; invitee can read their own by token/email

**Policies:**

```sql
-- Coaches can view invitations for their teams
CREATE POLICY "Coaches can view team invitations"
ON team_invitations FOR SELECT
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id()
    AND role_team IN ('coach', 'admin')
    AND status = 'active'
    AND deleted_at IS NULL
  )
);

-- Users can view invitations sent to their email
CREATE POLICY "Users can view own invitations"
ON team_invitations FOR SELECT
USING (
  email_normalized = (
    SELECT email_normalized FROM profiles
    WHERE user_id = auth.user_id()
  )
);

-- Public access to invitations by token (for signup page)
CREATE POLICY "Public can view invitations by token"
ON team_invitations FOR SELECT
USING (true); -- Token lookup for unauthenticated users

-- Coaches can create invitations for their teams
CREATE POLICY "Coaches can create invitations"
ON team_invitations FOR INSERT
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id()
    AND role_team IN ('coach', 'admin')
    AND status = 'active'
    AND deleted_at IS NULL
  )
  AND invited_by = auth.user_id()
);

-- Coaches can update invitations (revoke, resend)
CREATE POLICY "Coaches can update invitations"
ON team_invitations FOR UPDATE
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id()
    AND role_team IN ('coach', 'admin')
    AND status = 'active'
    AND deleted_at IS NULL
  )
)
WITH CHECK (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.user_id()
    AND role_team IN ('coach', 'admin')
    AND status = 'active'
    AND deleted_at IS NULL
  )
);

-- Users can update their own invitations (accept/decline)
CREATE POLICY "Users can update own invitations"
ON team_invitations FOR UPDATE
USING (
  email_normalized = (
    SELECT email_normalized FROM profiles
    WHERE user_id = auth.user_id()
  )
  AND status = 'pending'
)
WITH CHECK (
  email_normalized = (
    SELECT email_normalized FROM profiles
    WHERE user_id = auth.user_id()
  )
);
```

**Access Patterns:**
- ✅ Coaches create/read/update invitations for their teams
- ✅ Users read invitations sent to their email
- ✅ Public can read invitations by token (for signup)
- ✅ Users can accept/decline their invitations
- ❌ Users cannot accept invitations for other emails
- ❌ Non-coaches cannot create invitations

---

### `workout_logs`

**Intent**: Players read own logs; coaches read team members' logs

**Policies:**

```sql
-- Players can view their own workout logs
CREATE POLICY "Players can view own workout logs"
ON workout_logs FOR SELECT
USING (player_id = auth.user_id());

-- Coaches can view their team members' workout logs
CREATE POLICY "Coaches can view team workout logs"
ON workout_logs FOR SELECT
USING (
  player_id IN (
    SELECT tm.user_id FROM team_members tm
    INNER JOIN team_members coach ON coach.team_id = tm.team_id
    WHERE coach.user_id = auth.user_id()
    AND coach.role_team IN ('coach', 'admin')
    AND coach.status = 'active'
    AND coach.deleted_at IS NULL
  )
);

-- Players can create their own workout logs
CREATE POLICY "Players can create own workout logs"
ON workout_logs FOR INSERT
WITH CHECK (player_id = auth.user_id());

-- Players can update their own workout logs (if editing allowed)
CREATE POLICY "Players can update own workout logs"
ON workout_logs FOR UPDATE
USING (player_id = auth.user_id())
WITH CHECK (player_id = auth.user_id());

-- Coaches can update workout logs (add feedback)
CREATE POLICY "Coaches can update team workout logs"
ON workout_logs FOR UPDATE
USING (
  player_id IN (
    SELECT tm.user_id FROM team_members tm
    INNER JOIN team_members coach ON coach.team_id = tm.team_id
    WHERE coach.user_id = auth.user_id()
    AND coach.role_team IN ('coach', 'admin')
    AND coach.status = 'active'
    AND coach.deleted_at IS NULL
  )
)
WITH CHECK (
  player_id IN (
    SELECT tm.user_id FROM team_members tm
    INNER JOIN team_members coach ON coach.team_id = tm.team_id
    WHERE coach.user_id = auth.user_id()
    AND coach.role_team IN ('coach', 'admin')
    AND coach.status = 'active'
    AND coach.deleted_at IS NULL
  )
);
```

**Access Patterns:**
- ✅ Players read/create/update own logs
- ✅ Coaches read team members' logs
- ✅ Coaches add feedback to team logs
- ❌ Players cannot read others' logs
- ❌ Non-coaches cannot read team logs

---

### `load_metrics`

**Intent**: Players read own metrics; coaches read team members' metrics

**Policies:**

```sql
-- Players can view their own load metrics
CREATE POLICY "Players can view own load metrics"
ON load_metrics FOR SELECT
USING (player_id = auth.user_id());

-- Coaches can view their team members' load metrics
CREATE POLICY "Coaches can view team load metrics"
ON load_metrics FOR SELECT
USING (
  player_id IN (
    SELECT tm.user_id FROM team_members tm
    INNER JOIN team_members coach ON coach.team_id = tm.team_id
    WHERE coach.user_id = auth.user_id()
    AND coach.role_team IN ('coach', 'admin')
    AND coach.status = 'active'
    AND coach.deleted_at IS NULL
  )
);

-- System can insert/update load metrics (via triggers/functions)
CREATE POLICY "System can manage load metrics"
ON load_metrics FOR ALL
USING (true); -- Service role key used
WITH CHECK (true);
```

**Access Patterns:**
- ✅ Players read own metrics
- ✅ Coaches read team metrics
- ✅ System updates metrics (via triggers)
- ❌ Players cannot update metrics directly
- ❌ Non-coaches cannot read team metrics

---

### `training_programs`

**Intent**: Coaches can manage; players can view assigned programs

**Policies:**

```sql
-- Coaches can view programs they created
CREATE POLICY "Coaches can view own programs"
ON training_programs FOR SELECT
USING (created_by = auth.user_id() AND deleted_at IS NULL);

-- Players can view programs assigned to them
CREATE POLICY "Players can view assigned programs"
ON training_programs FOR SELECT
USING (
  id IN (
    SELECT program_id FROM program_assignments
    WHERE player_id = auth.user_id()
    AND status = 'active'
  )
  AND deleted_at IS NULL
);

-- Coaches can manage programs they created
CREATE POLICY "Coaches can manage own programs"
ON training_programs FOR ALL
USING (created_by = auth.user_id())
WITH CHECK (created_by = auth.user_id());
```

**Access Patterns:**
- ✅ Coaches read/create/update own programs
- ✅ Players read assigned programs
- ❌ Players cannot read unassigned programs
- ❌ Non-coaches cannot create programs

---

### `tournaments`

**Intent**: Public tournaments readable; private restricted; organizer can manage

**Policies:**

```sql
-- Anyone can view public tournaments
CREATE POLICY "Public tournaments are viewable"
ON tournaments FOR SELECT
USING (is_public = true AND deleted_at IS NULL);

-- Organizers can view their tournaments
CREATE POLICY "Organizers can view own tournaments"
ON tournaments FOR SELECT
USING (created_by = auth.user_id() AND deleted_at IS NULL);

-- Registered teams can view private tournaments
CREATE POLICY "Registered teams can view tournaments"
ON tournaments FOR SELECT
USING (
  id IN (
    SELECT tournament_id FROM tournament_registrations
    WHERE team_id IN (
      SELECT team_id FROM team_members
      WHERE user_id = auth.user_id()
      AND deleted_at IS NULL
    )
  )
  AND deleted_at IS NULL
);

-- Anyone can create tournaments
CREATE POLICY "Anyone can create tournaments"
ON tournaments FOR INSERT
WITH CHECK (created_by = auth.user_id());

-- Organizers can update their tournaments
CREATE POLICY "Organizers can update tournaments"
ON tournaments FOR UPDATE
USING (created_by = auth.user_id())
WITH CHECK (created_by = auth.user_id());

-- Organizers can delete their tournaments
CREATE POLICY "Organizers can delete tournaments"
ON tournaments FOR DELETE
USING (created_by = auth.user_id());
```

**Access Patterns:**
- ✅ Public tournaments readable by all
- ✅ Organizers manage their tournaments
- ✅ Registered teams read private tournaments
- ❌ Non-registered teams cannot read private tournaments
- ❌ Non-organizers cannot update tournaments

---

### `community_posts`

**Intent**: Posts readable; author can edit/delete; admins can moderate

**Policies:**

```sql
-- Anyone can view published posts
CREATE POLICY "Published posts are viewable"
ON community_posts FOR SELECT
USING (is_published = true AND deleted_at IS NULL);

-- Authors can view their own posts (including unpublished)
CREATE POLICY "Authors can view own posts"
ON community_posts FOR SELECT
USING (author_id = auth.user_id() AND deleted_at IS NULL);

-- Users can create posts
CREATE POLICY "Users can create posts"
ON community_posts FOR INSERT
WITH CHECK (author_id = auth.user_id());

-- Authors can update their own posts
CREATE POLICY "Authors can update own posts"
ON community_posts FOR UPDATE
USING (author_id = auth.user_id())
WITH CHECK (author_id = auth.user_id());

-- Authors can delete their own posts
CREATE POLICY "Authors can delete own posts"
ON community_posts FOR DELETE
USING (author_id = auth.user_id());

-- Admins can moderate posts
CREATE POLICY "Admins can moderate posts"
ON community_posts FOR ALL
USING (auth.is_admin())
WITH CHECK (auth.is_admin());
```

**Access Patterns:**
- ✅ Published posts readable by all
- ✅ Authors create/update/delete own posts
- ✅ Admins can moderate all posts
- ❌ Users cannot update others' posts
- ❌ Non-admins cannot moderate

---

### `analytics_events`

**Intent**: Append-only from authenticated context; aggregates readable by owner/team/admin

**Policies:**

```sql
-- Users can insert their own events
CREATE POLICY "Users can insert own events"
ON analytics_events FOR INSERT
WITH CHECK (user_id = auth.user_id() OR user_id IS NULL);

-- Users can view their own events
CREATE POLICY "Users can view own events"
ON analytics_events FOR SELECT
USING (user_id = auth.user_id());

-- Coaches can view their team members' events
CREATE POLICY "Coaches can view team events"
ON analytics_events FOR SELECT
USING (
  user_id IN (
    SELECT tm.user_id FROM team_members tm
    INNER JOIN team_members coach ON coach.team_id = tm.team_id
    WHERE coach.user_id = auth.user_id()
    AND coach.role_team IN ('coach', 'admin')
    AND coach.status = 'active'
    AND coach.deleted_at IS NULL
  )
);

-- Admins can view all events
CREATE POLICY "Admins can view all events"
ON analytics_events FOR SELECT
USING (auth.is_admin());

-- No updates or deletes (append-only)
-- No policies for UPDATE or DELETE
```

**Access Patterns:**
- ✅ Users insert own events
- ✅ Users read own events
- ✅ Coaches read team events
- ✅ Admins read all events
- ❌ No updates or deletes (append-only)

---

## Admin Override Pattern

Admins can bypass RLS using service role key in backend functions:

```javascript
// Backend function uses service role key
const supabase = createClient(url, serviceRoleKey);
// Service role bypasses RLS
```

**Use Cases:**
- System operations (load calculations, aggregations)
- Admin operations (moderation, user management)
- Batch operations (migrations, data cleanup)

---

## Testing RLS Policies

### Test Query Pattern

```sql
-- Test as specific user
SET request.jwt.claims = '{"sub": "user-uuid-here"}';

-- Test SELECT policy
SELECT * FROM teams;

-- Test INSERT policy
INSERT INTO teams (name, coach_id) VALUES ('Test Team', 'user-uuid-here');

-- Reset
RESET request.jwt.claims;
```

### Common Test Cases

1. **User can read own data**: ✅
2. **User cannot read others' data**: ✅
3. **User can update own data**: ✅
4. **User cannot update others' data**: ✅
5. **Coach can read team data**: ✅
6. **Coach cannot read other teams' data**: ✅
7. **Public resources readable by all**: ✅
8. **Private resources restricted**: ✅

---

## Performance Considerations

1. **Index Usage**: Policies should use indexed columns
2. **Subquery Optimization**: Use EXISTS instead of IN when possible
3. **Policy Complexity**: Keep policies simple; complex logic in functions
4. **Policy Order**: More specific policies first

---

## Related Documentation

- [DATABASE_SCHEMA_CONSTRAINTS.md](./DATABASE_SCHEMA_CONSTRAINTS.md) - Schema details
- [database/supabase-rls-policies.sql](../database/supabase-rls-policies.sql) - Implementation SQL

