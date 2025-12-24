# 📋 GitHub Issues Template - TODO Documentation

**Generated**: December 24, 2025  
**Total TODOs**: 36  
**Source**: Angular TypeScript codebase  
**Purpose**: Professional issue tracking for product backlog

---

## 📊 Issue Categories

| Category | Count | Priority | Effort |
|----------|-------|----------|--------|
| API Integration | 23 | High | Medium-High |
| Feature Enhancement | 6 | Medium | Low-Medium |
| External Integration | 3 | Medium | High |
| Infrastructure | 2 | Low | Medium |
| UX Improvements | 2 | Medium | Low |

---

## 🔴 HIGH PRIORITY - API Integration (23 issues)

### Issue #1: Implement Email Verification API Endpoint
**Priority**: High  
**Effort**: Medium  
**Labels**: `api`, `authentication`, `backend`

**Description**:
Implement backend API endpoint to verify email tokens sent during user registration.

**Current State**:
```typescript
// File: verify-email.component.ts:186
// TODO: Call API to verify email token
// Currently using mock implementation
```

**Acceptance Criteria**:
- [ ] Create POST `/api/auth/verify-email` endpoint
- [ ] Validate JWT token from email link
- [ ] Update user's `email_verified` status in database
- [ ] Return success/error response
- [ ] Handle expired tokens gracefully
- [ ] Connect frontend to new endpoint

**Technical Details**:
- Token should expire after 24 hours
- Use Supabase Auth verification flow
- Update `auth.users` table metadata

**Files Affected**:
- `angular/src/app/features/auth/verify-email/verify-email.component.ts:186`

**Estimated Effort**: 4 hours  
**Dependencies**: Supabase Auth setup

---

### Issue #2: Implement Resend Verification Email API
**Priority**: High  
**Effort**: Low  
**Labels**: `api`, `authentication`, `backend`

**Description**:
Create endpoint to resend verification emails to users who didn't receive or lost the original email.

**Current State**:
```typescript
// File: verify-email.component.ts:217
// TODO: Call API to resend verification email
```

**Acceptance Criteria**:
- [ ] Create POST `/api/auth/resend-verification` endpoint
- [ ] Rate limit to prevent abuse (1 request per 5 minutes)
- [ ] Generate new verification token
- [ ] Send email via email service
- [ ] Return success confirmation
- [ ] Connect frontend to endpoint

**Technical Details**:
- Invalidate previous tokens
- Use email template service
- Track resend attempts

**Files Affected**:
- `angular/src/app/features/auth/verify-email/verify-email.component.ts:217`

**Estimated Effort**: 3 hours  
**Dependencies**: Email service configuration

---

### Issue #3: Implement Team Creation API
**Priority**: High  
**Effort**: Medium  
**Labels**: `api`, `team-management`, `backend`

**Description**:
Create backend endpoint for team/organization creation with proper access control.

**Current State**:
```typescript
// File: team-create.component.ts:189
// TODO: Call API to create team
```

**Acceptance Criteria**:
- [ ] Create POST `/api/teams` endpoint
- [ ] Validate team name uniqueness
- [ ] Set creator as team owner
- [ ] Create team record in database
- [ ] Set up default team roles
- [ ] Return team ID and details
- [ ] Connect frontend to endpoint

**Technical Details**:
- Table: `teams`
- Creator gets 'owner' role automatically
- Implement RLS policies for team data
- Generate invite codes

**Files Affected**:
- `angular/src/app/features/team/team-create/team-create.component.ts:189`

**Estimated Effort**: 6 hours  
**Dependencies**: Teams table schema, RLS policies

---

### Issue #4: Implement Team Invitation API (Load, Accept, Decline)
**Priority**: High  
**Effort**: High  
**Labels**: `api`, `team-management`, `backend`

**Description**:
Create complete invitation system with endpoints to load, accept, and decline team invitations.

**Current State**:
```typescript
// File: accept-invitation.component.ts:200
// TODO: Call API to load invitation data
// TODO: Call API to accept invitation (line 229)
// TODO: Call API to decline invitation (line 265)
```

**Acceptance Criteria**:
- [ ] Create GET `/api/invitations/:token` endpoint
- [ ] Create POST `/api/invitations/:token/accept` endpoint
- [ ] Create POST `/api/invitations/:token/decline` endpoint
- [ ] Validate invitation tokens
- [ ] Check invitation expiry
- [ ] Add user to team on accept
- [ ] Mark invitation as declined
- [ ] Send notifications to team owner
- [ ] Connect all 3 frontend flows

**Technical Details**:
- Table: `team_invitations`
- Token should expire after 7 days
- Handle already-accepted invitations
- Update team membership table

**Files Affected**:
- `angular/src/app/features/team/accept-invitation/accept-invitation.component.ts:200,229,265`

**Estimated Effort**: 8 hours  
**Dependencies**: Team invitations table, email service

---

### Issue #5: Implement Onboarding Data Persistence API
**Priority**: High  
**Effort**: Medium  
**Labels**: `api`, `onboarding`, `backend`

**Description**:
Create endpoint to save user onboarding data including preferences, goals, and profile completion.

**Current State**:
```typescript
// File: onboarding.component.ts:309
// TODO: Call API to save onboarding data
```

**Acceptance Criteria**:
- [ ] Create POST `/api/user/onboarding` endpoint
- [ ] Save user preferences
- [ ] Save training goals
- [ ] Save position/role information
- [ ] Mark onboarding as complete
- [ ] Update user metadata
- [ ] Connect frontend to endpoint

**Technical Details**:
- Update `profiles` table
- Set `onboarding_completed` flag
- Store JSON preferences in metadata
- Validate required fields

**Files Affected**:
- `angular/src/app/features/onboarding/onboarding.component.ts:309`

**Estimated Effort**: 4 hours  
**Dependencies**: User profiles table

---

### Issue #6: Implement Workout Status Update API
**Priority**: High  
**Effort**: Medium  
**Labels**: `api`, `training`, `backend`

**Description**:
Create endpoints to update workout/training session status (completed, skipped, in-progress).

**Current State**:
```typescript
// File: training.component.ts:718,727
// TODO: Update workout status in backend (2 instances)
```

**Acceptance Criteria**:
- [ ] Create PATCH `/api/workouts/:id/status` endpoint
- [ ] Accept status values: completed, skipped, in-progress
- [ ] Record completion timestamp
- [ ] Calculate training load if completed
- [ ] Update ACWR data
- [ ] Return updated session data
- [ ] Connect frontend to endpoint

**Technical Details**:
- Table: `training_sessions`
- Calculate RPE × duration for load
- Trigger ACWR recalculation
- Store completion metrics

**Files Affected**:
- `angular/src/app/features/training/training.component.ts:718,727`

**Estimated Effort**: 5 hours  
**Dependencies**: Training sessions table, ACWR service

---

### Issue #7: Implement Training Form Submission API
**Priority**: High  
**Effort**: Medium  
**Labels**: `api`, `training`, `backend`

**Description**:
Create endpoint to save new training sessions from the smart training form.

**Current State**:
```typescript
// File: smart-training-form.component.ts:547
// TODO: Submit to API
```

**Acceptance Criteria**:
- [ ] Create POST `/api/training/sessions` endpoint
- [ ] Validate session data
- [ ] Save exercises and sets
- [ ] Calculate total volume
- [ ] Update training calendar
- [ ] Return session ID
- [ ] Connect frontend form

**Technical Details**:
- Tables: `training_sessions`, `training_exercises`
- Validate exercise references
- Calculate training load
- Support draft/scheduled status

**Files Affected**:
- `angular/src/app/features/training/smart-training-form/smart-training-form.component.ts:547`

**Estimated Effort**: 6 hours  
**Dependencies**: Training schema, exercise library

---

### Issue #8: Implement Training Schedule API
**Priority**: Medium  
**Effort**: Medium  
**Labels**: `api`, `training`, `backend`

**Description**:
Create endpoint to load training sessions for calendar/schedule view.

**Current State**:
```typescript
// File: training-schedule.component.ts:185
// TODO: Call API to load training sessions
```

**Acceptance Criteria**:
- [ ] Create GET `/api/training/schedule` endpoint
- [ ] Support date range filtering
- [ ] Return sessions with status
- [ ] Include session type and duration
- [ ] Support athlete/team filtering
- [ ] Connect frontend calendar

**Technical Details**:
- Query: `training_sessions` table
- Filter by date range (start_date, end_date)
- Include related exercises count
- Order by session_date

**Files Affected**:
- `angular/src/app/features/training/training-schedule/training-schedule.component.ts:185`

**Estimated Effort**: 3 hours  
**Dependencies**: Training sessions table

---

### Issue #9: Implement QB Throwing Tracker API
**Priority**: Medium  
**Effort**: Medium  
**Labels**: `api`, `training`, `qb-specific`, `backend`

**Description**:
Create endpoints for QB-specific throwing session tracking and statistics.

**Current State**:
```typescript
// File: qb-throwing-tracker.component.ts:156,164
// TODO: Load weekly throwing stats
// TODO: Save throwing session
```

**Acceptance Criteria**:
- [ ] Create GET `/api/qb/throwing-stats/weekly` endpoint
- [ ] Create POST `/api/qb/throwing-sessions` endpoint
- [ ] Track throws by distance and result
- [ ] Calculate completion percentage
- [ ] Track arm fatigue metrics
- [ ] Return weekly summary
- [ ] Connect both frontend flows

**Technical Details**:
- Table: `qb_throwing_sessions`
- Store: distance, result, fatigue_rating
- Aggregate: weekly volume, completion rate
- Warning thresholds for overuse

**Files Affected**:
- `angular/src/app/features/training/qb-throwing-tracker/qb-throwing-tracker.component.ts:156,164`

**Estimated Effort**: 5 hours  
**Dependencies**: QB throwing schema

---

### Issue #10: Implement AI Training Scheduler API
**Priority**: Medium  
**Effort**: High  
**Labels**: `api`, `ai`, `training`, `backend`

**Description**:
Create AI-powered training suggestion system with apply/dismiss functionality.

**Current State**:
```typescript
// File: ai-training-scheduler.component.ts:190,218,228
// TODO: Call API to load AI suggestions
// TODO: Apply suggestion
// TODO: Dismiss suggestion
```

**Acceptance Criteria**:
- [ ] Create GET `/api/ai/training-suggestions` endpoint
- [ ] Create POST `/api/ai/suggestions/:id/apply` endpoint
- [ ] Create POST `/api/ai/suggestions/:id/dismiss` endpoint
- [ ] Generate personalized suggestions
- [ ] Consider ACWR, recovery, goals
- [ ] Track suggestion effectiveness
- [ ] Connect all frontend flows

**Technical Details**:
- Use OpenAI API or rule-based logic
- Consider: recent training, ACWR, goals
- Store: suggestion history, acceptance rate
- Learn from user preferences

**Files Affected**:
- `angular/src/app/features/training/ai-training-scheduler/ai-training-scheduler.component.ts:190,218,228`

**Estimated Effort**: 12 hours  
**Dependencies**: AI integration, training history

---

### Issue #11: Implement Enhanced Analytics API
**Priority**: Medium  
**Effort**: High  
**Labels**: `api`, `analytics`, `backend`

**Description**:
Create comprehensive analytics endpoint with advanced metrics and visualizations.

**Current State**:
```typescript
// File: enhanced-analytics.component.ts:156
// TODO: Call API to load enhanced analytics
```

**Acceptance Criteria**:
- [ ] Create GET `/api/analytics/enhanced` endpoint
- [ ] Calculate advanced performance metrics
- [ ] Provide trend analysis
- [ ] Compare against benchmarks
- [ ] Support date range filtering
- [ ] Return visualization-ready data
- [ ] Connect frontend charts

**Technical Details**:
- Aggregate: performance, ACWR, injury risk
- Calculate: percentiles, z-scores, trends
- Optimize: query performance, caching
- Format: ready for Chart.js

**Files Affected**:
- `angular/src/app/features/analytics/enhanced-analytics/enhanced-analytics.component.ts:156`

**Estimated Effort**: 8 hours  
**Dependencies**: Analytics schema, performance data

---

### Issue #12: Implement Performance Data Export API
**Priority**: Low  
**Effort**: High  
**Labels**: `api`, `export`, `backend`

**Description**:
Create data export functionality for performance metrics in multiple formats (CSV, JSON, PDF).

**Current State**:
```typescript
// File: performance-data.service.ts:819
// TODO: Implement data export by fetching all tables and formatting
```

**Acceptance Criteria**:
- [ ] Create GET `/api/export/performance` endpoint
- [ ] Support CSV, JSON, PDF formats
- [ ] Include all performance tables
- [ ] Apply user data filtering
- [ ] Generate downloadable file
- [ ] Stream large datasets
- [ ] Connect frontend download

**Technical Details**:
- Fetch: training_sessions, performance_tests, measurements
- Format: CSV headers, JSON structure, PDF template
- Security: validate user ownership
- Performance: streaming for large exports

**Files Affected**:
- `angular/src/app/core/services/performance-data.service.ts:819`

**Estimated Effort**: 10 hours  
**Dependencies**: PDF generation library, export service

---

### Issue #13: Implement Report Export API
**Priority**: Medium  
**Effort**: High  
**Labels**: `api`, `export`, `reports`, `backend`

**Description**:
Create analytics report export with formatted PDF generation.

**Current State**:
```typescript
// File: enhanced-analytics.component.ts:185
// TODO: Implement report export
```

**Acceptance Criteria**:
- [ ] Create POST `/api/reports/export` endpoint
- [ ] Generate PDF with charts/graphs
- [ ] Include summary statistics
- [ ] Add team/athlete branding
- [ ] Support email delivery
- [ ] Return download link
- [ ] Connect frontend export button

**Technical Details**:
- Use: PDF generation library (e.g., puppeteer)
- Include: charts as images, data tables
- Template: professional report layout
- Storage: temporary S3/storage bucket

**Files Affected**:
- `angular/src/app/features/analytics/enhanced-analytics/enhanced-analytics.component.ts:185`

**Estimated Effort**: 12 hours  
**Dependencies**: PDF library, chart rendering, storage

---

### Issue #14: Load Recent Performance and Upcoming Games (2 components)
**Priority**: Medium  
**Effort**: Medium  
**Labels**: `api`, `training`, `games`, `backend`

**Description**:
Create endpoints to load recent performance data and upcoming game schedule for training context.

**Current State**:
```typescript
// File: smart-training-form.component.ts:445,446
// File: training-builder.component.ts:702,703
// TODO: Load from API (4 instances total)
```

**Acceptance Criteria**:
- [ ] Create GET `/api/performance/recent` endpoint
- [ ] Create GET `/api/games/upcoming` endpoint
- [ ] Return last 5 performance tests
- [ ] Return next 5 scheduled games
- [ ] Include relevant metrics
- [ ] Connect both components

**Technical Details**:
- Query: `performance_tests` table (last 5)
- Query: `fixtures` table (next 5, future dates)
- Include: test type, score, date, opponent
- Cache: reasonable TTL (5 minutes)

**Files Affected**:
- `angular/src/app/features/training/smart-training-form/smart-training-form.component.ts:445,446`
- `angular/src/app/shared/components/training-builder/training-builder.component.ts:702,703`

**Estimated Effort**: 4 hours  
**Dependencies**: Performance tests table, fixtures table

---

## 🟡 MEDIUM PRIORITY - Feature Enhancements (6 issues)

### Issue #15: Implement ACWR Session Logging Modal
**Priority**: Medium  
**Effort**: Low  
**Labels**: `feature`, `ui`, `acwr`

**Description**:
Create modal dialog for quick training session logging from ACWR dashboard.

**Current State**:
```typescript
// File: acwr-dashboard.component.ts:583
// TODO: Open session logging modal
```

**Acceptance Criteria**:
- [ ] Create modal component
- [ ] Form for RPE and duration
- [ ] Calculate training load
- [ ] Save to database
- [ ] Update ACWR immediately
- [ ] Connect open modal button

**Technical Details**:
- Use: PrimeNG Dialog
- Fields: date, RPE (1-10), duration (minutes)
- Calculate: load = RPE × duration
- Update: ACWR chart in real-time

**Files Affected**:
- `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.ts:583`

**Estimated Effort**: 3 hours  
**Dependencies**: Training session API

---

### Issue #16: Implement ACWR History Navigation
**Priority**: Medium  
**Effort**: Low  
**Labels**: `feature`, `navigation`, `acwr`

**Description**:
Add navigation to dedicated ACWR history page with detailed timeline.

**Current State**:
```typescript
// File: acwr-dashboard.component.ts:588
// TODO: Navigate to history page
```

**Acceptance Criteria**:
- [ ] Create ACWR history route
- [ ] Create history page component
- [ ] Show timeline of ACWR values
- [ ] Display injury events
- [ ] Add filtering options
- [ ] Connect navigation button

**Technical Details**:
- Route: `/acwr/history`
- Display: 90-day ACWR timeline
- Highlight: danger zones, injuries
- Filter: date range, risk zone

**Files Affected**:
- `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.ts:588`

**Estimated Effort**: 4 hours  
**Dependencies**: ACWR history component

---

### Issue #17: Implement PDF Report Generation
**Priority**: Medium  
**Effort**: High  
**Labels**: `feature`, `pdf`, `reports`

**Description**:
Generate downloadable PDF reports for ACWR analysis and training history.

**Current State**:
```typescript
// File: acwr-dashboard.component.ts:593
// TODO: Generate PDF report
```

**Acceptance Criteria**:
- [ ] Create PDF template
- [ ] Include ACWR chart
- [ ] Include summary statistics
- [ ] Add interpretation guide
- [ ] Generate downloadable file
- [ ] Connect generate button

**Technical Details**:
- Library: jsPDF or similar
- Content: charts (as images), tables, text
- Styling: professional template
- Format: A4, portrait

**Files Affected**:
- `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.ts:593`

**Estimated Effort**: 8 hours  
**Dependencies**: PDF generation library

---

### Issue #18: Implement Skill Drill Functionality
**Priority**: Low  
**Effort**: Medium  
**Labels**: `feature`, `training`, `drills`

**Description**:
Create interactive skill drill exercises with video demonstrations and progress tracking.

**Current State**:
```typescript
// File: interactive-skills-radar.component.ts:282
// TODO: Implement skill drill functionality
```

**Acceptance Criteria**:
- [ ] Create drill library
- [ ] Add video demonstrations
- [ ] Track drill completion
- [ ] Record performance metrics
- [ ] Show improvement over time
- [ ] Connect to skill radar

**Technical Details**:
- Component: skill drill modal
- Content: video embed, instructions
- Tracking: completion date, reps, quality
- Integration: update skill scores

**Files Affected**:
- `angular/src/app/shared/components/interactive-skills-radar/interactive-skills-radar.component.ts:282`

**Estimated Effort**: 10 hours  
**Dependencies**: Drill content, video hosting

---

### Issue #19: Implement Search Functionality
**Priority**: Medium  
**Effort**: Medium  
**Labels**: `feature`, `search`, `navigation`

**Description**:
Add global search with navigation to results or triggering search service.

**Current State**:
```typescript
// File: header.component.ts:468
// TODO: Navigate to search results or trigger search service
```

**Acceptance Criteria**:
- [ ] Create search service
- [ ] Index searchable content
- [ ] Implement search algorithm
- [ ] Create results page
- [ ] Handle search navigation
- [ ] Connect header search input

**Technical Details**:
- Search: players, exercises, sessions, analytics
- Algorithm: fuzzy matching, relevance scoring
- Results: categorized by type
- Navigation: route to `/search?q=query`

**Files Affected**:
- `angular/src/app/shared/components/header/header.component.ts:468`

**Estimated Effort**: 8 hours  
**Dependencies**: Search service, indexed content

---

### Issue #20: Implement Notifications Panel Toggle
**Priority**: Medium  
**Effort**: Low  
**Labels**: `feature`, `notifications`, `ui`

**Description**:
Create slide-out notifications panel with list and actions.

**Current State**:
```typescript
// File: header.component.ts:474
// TODO: Implement notifications panel toggle
```

**Acceptance Criteria**:
- [ ] Create notifications panel component
- [ ] Show unread notifications
- [ ] Mark as read action
- [ ] Navigate to notification source
- [ ] Toggle panel open/close
- [ ] Connect bell icon click

**Technical Details**:
- Component: slide panel (PrimeNG Sidebar)
- Display: list of notifications
- Actions: mark read, navigate, delete
- Animation: smooth slide from right

**Files Affected**:
- `angular/src/app/shared/components/header/header.component.ts:474`

**Estimated Effort**: 4 hours  
**Dependencies**: Notification service (exists)

---

## 🟢 LOW PRIORITY - Infrastructure & Integration (5 issues)

### Issue #21: Implement Backend Logging Service
**Priority**: Low  
**Effort**: Medium  
**Labels**: `infrastructure`, `logging`, `backend`

**Description**:
Create centralized logging service to send frontend logs to backend for monitoring.

**Current State**:
```typescript
// File: evidence-config.service.ts:81
// TODO: Implement logging to backend
```

**Acceptance Criteria**:
- [ ] Create POST `/api/logs` endpoint
- [ ] Accept log level, message, context
- [ ] Store in logging service (e.g., CloudWatch)
- [ ] Rate limit to prevent abuse
- [ ] Filter sensitive data
- [ ] Connect frontend logger

**Technical Details**:
- Endpoint: buffered batch logging
- Levels: error, warn, info, debug
- Storage: logging service or database
- Privacy: sanitize user data

**Files Affected**:
- `angular/src/app/core/services/evidence-config.service.ts:81`

**Estimated Effort**: 6 hours  
**Dependencies**: Logging infrastructure

---

### Issue #22: Migrate Recovery Protocols to Dedicated Table
**Priority**: Low  
**Effort**: Medium  
**Labels**: `infrastructure`, `database`, `backend`

**Description**:
Move recovery protocol storage from JSON to dedicated table for better querying.

**Current State**:
```typescript
// File: recovery.service.ts:394
// TODO: Store protocols in recovery_protocols table
```

**Acceptance Criteria**:
- [ ] Create `recovery_protocols` table
- [ ] Define schema for protocols
- [ ] Migrate existing protocol data
- [ ] Update service to use new table
- [ ] Add RLS policies
- [ ] Test data integrity

**Technical Details**:
- Table: `recovery_protocols` (id, name, type, duration, instructions)
- Migration: extract from JSON to rows
- Queries: join with recovery_sessions
- Benefits: better querying, validation

**Files Affected**:
- `angular/src/app/core/services/recovery.service.ts:394`

**Estimated Effort**: 4 hours  
**Dependencies**: Database migration

---

### Issue #23: Integrate with Notification System
**Priority**: Medium  
**Effort**: High  
**Labels**: `integration`, `notifications`, `backend`

**Description**:
Connect ACWR alerts to existing notification system for real-time alerts.

**Current State**:
```typescript
// File: acwr-alerts.service.ts:173
// TODO: Integrate with your notification system
```

**Acceptance Criteria**:
- [ ] Call notification service on alerts
- [ ] Create notification records
- [ ] Set appropriate severity
- [ ] Include alert details
- [ ] Support user preferences
- [ ] Test alert delivery

**Technical Details**:
- Service: NotificationStateService (exists)
- Method: createNotification()
- Types: warning, danger, info
- Delivery: in-app, email (optional)

**Files Affected**:
- `angular/src/app/core/services/acwr-alerts.service.ts:173`

**Estimated Effort**: 3 hours  
**Dependencies**: Notification service (exists)

---

### Issue #24: Implement Email/SMS Coach Alerts
**Priority**: Low  
**Effort**: High  
**Labels**: `integration`, `email`, `sms`, `backend`

**Description**:
Send email/SMS notifications to coaches for critical ACWR alerts.

**Current State**:
```typescript
// File: acwr-alerts.service.ts:191
// TODO: Send email/SMS to coach
```

**Acceptance Criteria**:
- [ ] Set up email service (e.g., SendGrid)
- [ ] Set up SMS service (e.g., Twilio)
- [ ] Create alert templates
- [ ] Get coach contact preferences
- [ ] Send notifications on critical alerts
- [ ] Track delivery status

**Technical Details**:
- Email: SendGrid or AWS SES
- SMS: Twilio or AWS SNS
- Triggers: injury risk, overtraining
- Rate limit: max 1 per hour per alert type

**Files Affected**:
- `angular/src/app/core/services/acwr-alerts.service.ts:191`

**Estimated Effort**: 10 hours  
**Dependencies**: Email/SMS service setup, billing

---

### Issue #25: Implement OpenAI Nutrition AI Assistant
**Priority**: Medium  
**Effort**: Very High  
**Labels**: `integration`, `ai`, `nutrition`, `backend`

**Description**:
Integrate OpenAI for AI-powered nutrition recommendations via Supabase Edge Function.

**Current State**:
```typescript
// File: nutrition.service.ts:605
// TODO: Implement via Supabase Edge Function with OpenAI
```

**Acceptance Criteria**:
- [ ] Create Supabase Edge Function
- [ ] Integrate OpenAI API
- [ ] Send user goals and current intake
- [ ] Receive personalized recommendations
- [ ] Parse and format suggestions
- [ ] Display in nutrition dashboard
- [ ] Handle API errors gracefully

**Technical Details**:
- Function: `/functions/v1/nutrition-ai`
- Input: user profile, goals, current intake
- Output: meal suggestions, macro adjustments
- Model: GPT-4 or GPT-3.5-turbo
- Cost: ~$0.01-0.03 per request

**Files Affected**:
- `angular/src/app/core/services/nutrition.service.ts:605`
- `supabase/functions/nutrition-ai/` (new)

**Estimated Effort**: 16 hours  
**Dependencies**: OpenAI API key, Supabase Edge Functions, budget approval

---

### Issue #26-27: Get Player Context from Auth Service
**Priority**: High  
**Effort**: Low  
**Labels**: `bug`, `data`, `context`

**Description**:
Replace hardcoded player ID/name with actual values from authentication context.

**Current State**:
```typescript
// File: acwr-alerts.service.ts:138,139
playerId: "current-player", // TODO: Get from context
playerName: "Current Player", // TODO: Get from player service
```

**Acceptance Criteria**:
- [ ] Inject AuthService
- [ ] Get current user from auth
- [ ] Fetch player profile if needed
- [ ] Replace hardcoded values
- [ ] Handle unauthenticated state
- [ ] Test with real user data

**Technical Details**:
- Service: AuthService.getUser()
- Fallback: guest/demo mode
- Profile: fetch from profiles table if needed
- Validation: ensure player exists

**Files Affected**:
- `angular/src/app/core/services/acwr-alerts.service.ts:138,139`

**Estimated Effort**: 1 hour  
**Dependencies**: AuthService (exists)

---

## 📝 Issue Creation Summary

### Total Issues to Create: 27

**By Priority**:
- 🔴 High: 14 issues (52%)
- 🟡 Medium: 11 issues (41%)
- 🟢 Low: 2 issues (7%)

**By Effort**:
- Low: 6 issues (2-4 hours each)
- Medium: 13 issues (4-8 hours each)
- High: 6 issues (8-12 hours each)
- Very High: 2 issues (12+ hours each)

**Total Estimated Effort**: ~180 hours (4-5 weeks)

**By Category**:
- API Integration: 14 issues
- Feature Enhancement: 6 issues
- External Integration: 5 issues
- Infrastructure: 2 issues

---

## 🎯 Recommended Prioritization

### Sprint 1: High-Priority APIs (2 weeks)
- Issues #1-2: Authentication APIs
- Issues #3-4: Team management APIs
- Issues #5-6: Core training APIs
- Issue #26-27: Context fixes

### Sprint 2: Training & Analytics (2 weeks)
- Issues #7-9: Training schedule & tracking
- Issues #11: Enhanced analytics
- Issue #10: AI suggestions (if budget approved)

### Sprint 3: Features & UX (1 week)
- Issues #15-16: ACWR enhancements
- Issues #19-20: Search & notifications
- Issue #18: Skill drills

### Sprint 4: Infrastructure & Integration (1 week)
- Issues #21-22: Backend infrastructure
- Issue #23: Notification integration
- Issues #12-13: Export functionality (if needed)

### Future: Advanced Features
- Issue #24: Email/SMS (requires service setup)
- Issue #25: OpenAI integration (requires budget)
- Issue #17: PDF generation (as needed)

---

## 🚀 Next Steps

1. **Copy issues to GitHub**:
   - Use issue templates above
   - Add labels and milestones
   - Assign to team members

2. **Update codebase**:
   - Replace inline TODOs with issue references
   - Format: `// See issue #1 - Email verification API`
   - Keep one-line reference for context

3. **Create project board**:
   - Columns: Backlog, Sprint, In Progress, Review, Done
   - Add all 27 issues to backlog
   - Prioritize for sprints

4. **Estimate & plan**:
   - Team capacity planning
   - Sprint planning meetings
   - Dependency identification

---

**Generated**: December 24, 2025  
**Status**: Ready for GitHub issue creation  
**Next**: Copy to GitHub and update inline TODOs with issue references

