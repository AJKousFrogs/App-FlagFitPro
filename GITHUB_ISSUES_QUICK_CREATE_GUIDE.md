# 🚀 Quick GitHub Issues Creation Guide

**Time Required**: 30 minutes  
**Issues to Create**: 27  
**Status**: Ready to copy-paste!

---

## 📋 How to Use This Guide

1. Navigate to your GitHub repository
2. Click "Issues" → "New Issue"
3. Copy the title and description from each issue below
4. Add the suggested labels
5. Click "Submit new issue"
6. Repeat for all 27 issues!

**Tip**: You can create them in batches of 5-10 at a time!

---

## 🔴 HIGH PRIORITY ISSUES (14 issues)

### Issue #1: Email Verification API
**Title**: `Implement Email Verification API Endpoint`

**Labels**: `api`, `authentication`, `backend`, `high-priority`

**Description**:
```markdown
## Description
Implement backend API endpoint to verify email tokens sent during user registration.

## Current State
```typescript
// File: verify-email.component.ts:186
// Frontend is ready, waiting for API endpoint
```

## Acceptance Criteria
- [ ] Create POST `/api/auth/verify-email` endpoint
- [ ] Validate JWT token from email link
- [ ] Update user's `email_verified` status in database
- [ ] Return success/error response
- [ ] Handle expired tokens gracefully
- [ ] Connect frontend to new endpoint

## Technical Details
- Token should expire after 24 hours
- Use Supabase Auth verification flow
- Update `auth.users` table metadata

## Estimated Effort
4 hours

## Dependencies
Supabase Auth setup

## Files Affected
- `angular/src/app/features/auth/verify-email/verify-email.component.ts:186`
```

---

### Issue #2: Resend Verification Email API
**Title**: `Implement Resend Verification Email API`

**Labels**: `api`, `authentication`, `backend`, `high-priority`

**Description**:
```markdown
## Description
Create endpoint to resend verification emails to users who didn't receive or lost the original email.

## Acceptance Criteria
- [ ] Create POST `/api/auth/resend-verification` endpoint
- [ ] Rate limit to prevent abuse (1 request per 5 minutes)
- [ ] Generate new verification token
- [ ] Send email via email service
- [ ] Return success confirmation
- [ ] Connect frontend to endpoint

## Technical Details
- Invalidate previous tokens
- Use email template service
- Track resend attempts

## Estimated Effort
3 hours

## Files Affected
- `angular/src/app/features/auth/verify-email/verify-email.component.ts:217`
```

---

### Issue #3: Team Creation API
**Title**: `Implement Team Creation API`

**Labels**: `api`, `team-management`, `backend`, `high-priority`

**Description**:
```markdown
## Description
Create backend endpoint for team/organization creation with proper access control.

## Acceptance Criteria
- [ ] Create POST `/api/teams` endpoint
- [ ] Validate team name uniqueness
- [ ] Set creator as team owner
- [ ] Create team record in database
- [ ] Set up default team roles
- [ ] Return team ID and details
- [ ] Connect frontend to endpoint

## Technical Details
- Table: `teams`
- Creator gets 'owner' role automatically
- Implement RLS policies for team data
- Generate invite codes

## Estimated Effort
6 hours

## Dependencies
Teams table schema, RLS policies

## Files Affected
- `angular/src/app/features/team/team-create/team-create.component.ts:189`
```

---

### Issue #4: Team Invitation System
**Title**: `Implement Team Invitation API (Load, Accept, Decline)`

**Labels**: `api`, `team-management`, `backend`, `high-priority`

**Description**:
```markdown
## Description
Create complete invitation system with endpoints to load, accept, and decline team invitations.

## Acceptance Criteria
- [ ] Create GET `/api/invitations/:token` endpoint
- [ ] Create POST `/api/invitations/:token/accept` endpoint
- [ ] Create POST `/api/invitations/:token/decline` endpoint
- [ ] Validate invitation tokens
- [ ] Check invitation expiry
- [ ] Add user to team on accept
- [ ] Mark invitation as declined
- [ ] Send notifications to team owner
- [ ] Connect all 3 frontend flows

## Technical Details
- Table: `team_invitations`
- Token expires after 7 days
- Handle already-accepted invitations
- Update team membership table

## Estimated Effort
8 hours

## Dependencies
Team invitations table, email service

## Files Affected
- `angular/src/app/features/team/accept-invitation/accept-invitation.component.ts:200,229,265`
```

---

### Issue #5: Onboarding Data Persistence
**Title**: `Implement Onboarding Data Persistence API`

**Labels**: `api`, `onboarding`, `backend`, `high-priority`

**Description**:
```markdown
## Description
Create endpoint to save user onboarding data including preferences, goals, and profile completion.

## Acceptance Criteria
- [ ] Create POST `/api/user/onboarding` endpoint
- [ ] Save user preferences
- [ ] Save training goals
- [ ] Save position/role information
- [ ] Mark onboarding as complete
- [ ] Update user metadata
- [ ] Connect frontend to endpoint

## Technical Details
- Update `profiles` table
- Set `onboarding_completed` flag
- Store JSON preferences in metadata
- Validate required fields

## Estimated Effort
4 hours

## Files Affected
- `angular/src/app/features/onboarding/onboarding.component.ts:309`
```

---

### Issue #6: Workout Status Update API
**Title**: `Implement Workout Status Update API`

**Labels**: `api`, `training`, `backend`, `high-priority`

**Description**:
```markdown
## Description
Create endpoints to update workout/training session status (completed, skipped, in-progress).

## Acceptance Criteria
- [ ] Create PATCH `/api/workouts/:id/status` endpoint
- [ ] Accept status values: completed, skipped, in-progress
- [ ] Record completion timestamp
- [ ] Calculate training load if completed
- [ ] Update ACWR data
- [ ] Return updated session data
- [ ] Connect frontend to endpoint

## Technical Details
- Table: `training_sessions`
- Calculate RPE × duration for load
- Trigger ACWR recalculation
- Store completion metrics

## Estimated Effort
5 hours

## Files Affected
- `angular/src/app/features/training/training.component.ts:718,727`
```

---

### Issue #7: Training Form Submission API
**Title**: `Implement Training Form Submission API`

**Labels**: `api`, `training`, `backend`, `high-priority`

**Description**:
```markdown
## Description
Create endpoint to save new training sessions from the smart training form.

## Acceptance Criteria
- [ ] Create POST `/api/training/sessions` endpoint
- [ ] Validate session data
- [ ] Save exercises and sets
- [ ] Calculate total volume
- [ ] Update training calendar
- [ ] Return session ID
- [ ] Connect frontend form

## Technical Details
- Tables: `training_sessions`, `training_exercises`
- Validate exercise references
- Calculate training load
- Support draft/scheduled status

## Estimated Effort
6 hours

## Files Affected
- `angular/src/app/features/training/smart-training-form/smart-training-form.component.ts:547`
```

---

### Issue #8: Training Schedule API
**Title**: `Implement Training Schedule API`

**Labels**: `api`, `training`, `backend`, `medium-priority`

**Description**:
```markdown
## Description
Create endpoint to load training sessions for calendar/schedule view.

## Acceptance Criteria
- [ ] Create GET `/api/training/schedule` endpoint
- [ ] Support date range filtering
- [ ] Return sessions with status
- [ ] Include session type and duration
- [ ] Support athlete/team filtering
- [ ] Connect frontend calendar

## Technical Details
- Query: `training_sessions` table
- Filter by date range (start_date, end_date)
- Include related exercises count
- Order by session_date

## Estimated Effort
3 hours

## Files Affected
- `angular/src/app/features/training/training-schedule/training-schedule.component.ts:185`
```

---

### Issue #9: QB Throwing Tracker API
**Title**: `Implement QB Throwing Tracker API`

**Labels**: `api`, `training`, `qb-specific`, `backend`, `medium-priority`

**Description**:
```markdown
## Description
Create endpoints for QB-specific throwing session tracking and statistics.

## Acceptance Criteria
- [ ] Create GET `/api/qb/throwing-stats/weekly` endpoint
- [ ] Create POST `/api/qb/throwing-sessions` endpoint
- [ ] Track throws by distance and result
- [ ] Calculate completion percentage
- [ ] Track arm fatigue metrics
- [ ] Return weekly summary
- [ ] Connect both frontend flows

## Technical Details
- Table: `qb_throwing_sessions`
- Store: distance, result, fatigue_rating
- Aggregate: weekly volume, completion rate
- Warning thresholds for overuse

## Estimated Effort
5 hours

## Files Affected
- `angular/src/app/features/training/qb-throwing-tracker/qb-throwing-tracker.component.ts:156,164`
```

---

### Issue #10: AI Training Scheduler
**Title**: `Implement AI Training Scheduler API`

**Labels**: `api`, `ai`, `training`, `backend`, `medium-priority`

**Description**:
```markdown
## Description
Create AI-powered training suggestion system with apply/dismiss functionality.

## Acceptance Criteria
- [ ] Create GET `/api/ai/training-suggestions` endpoint
- [ ] Create POST `/api/ai/suggestions/:id/apply` endpoint
- [ ] Create POST `/api/ai/suggestions/:id/dismiss` endpoint
- [ ] Generate personalized suggestions
- [ ] Consider ACWR, recovery, goals
- [ ] Track suggestion effectiveness
- [ ] Connect all frontend flows

## Technical Details
- Use OpenAI API or rule-based logic
- Consider: recent training, ACWR, goals
- Store: suggestion history, acceptance rate
- Learn from user preferences

## Estimated Effort
12 hours

## Files Affected
- `angular/src/app/features/training/ai-training-scheduler/ai-training-scheduler.component.ts:190,218,228`
```

---

### Issue #11: Enhanced Analytics API
**Title**: `Implement Enhanced Analytics API`

**Labels**: `api`, `analytics`, `backend`, `medium-priority`

**Description**:
```markdown
## Description
Create comprehensive analytics endpoint with advanced metrics and visualizations.

## Acceptance Criteria
- [ ] Create GET `/api/analytics/enhanced` endpoint
- [ ] Calculate advanced performance metrics
- [ ] Provide trend analysis
- [ ] Compare against benchmarks
- [ ] Support date range filtering
- [ ] Return visualization-ready data
- [ ] Connect frontend charts

## Technical Details
- Aggregate: performance, ACWR, injury risk
- Calculate: percentiles, z-scores, trends
- Optimize: query performance, caching
- Format: ready for Chart.js

## Estimated Effort
8 hours

## Files Affected
- `angular/src/app/features/analytics/enhanced-analytics/enhanced-analytics.component.ts:156`
```

---

### Issue #12: Performance Data Export
**Title**: `Implement Performance Data Export API`

**Labels**: `api`, `export`, `backend`, `low-priority`

**Description**:
```markdown
## Description
Create data export functionality for performance metrics in multiple formats (CSV, JSON, PDF).

## Acceptance Criteria
- [ ] Create GET `/api/export/performance` endpoint
- [ ] Support CSV, JSON, PDF formats
- [ ] Include all performance tables
- [ ] Apply user data filtering
- [ ] Generate downloadable file
- [ ] Stream large datasets
- [ ] Connect frontend download

## Technical Details
- Fetch: training_sessions, performance_tests, measurements
- Format: CSV headers, JSON structure, PDF template
- Security: validate user ownership
- Performance: streaming for large exports

## Estimated Effort
10 hours

## Files Affected
- `angular/src/app/core/services/performance-data.service.ts:819`
```

---

### Issue #13: Report Export API
**Title**: `Implement Report Export API`

**Labels**: `api`, `export`, `reports`, `backend`, `medium-priority`

**Description**:
```markdown
## Description
Create analytics report export with formatted PDF generation.

## Acceptance Criteria
- [ ] Create POST `/api/reports/export` endpoint
- [ ] Generate PDF with charts/graphs
- [ ] Include summary statistics
- [ ] Add team/athlete branding
- [ ] Support email delivery
- [ ] Return download link
- [ ] Connect frontend export button

## Technical Details
- Use: PDF generation library (e.g., puppeteer)
- Include: charts as images, data tables
- Template: professional report layout
- Storage: temporary S3/storage bucket

## Estimated Effort
12 hours

## Files Affected
- `angular/src/app/features/analytics/enhanced-analytics/enhanced-analytics.component.ts:185`
```

---

### Issue #14: Recent Performance & Upcoming Games API
**Title**: `Load Recent Performance and Upcoming Games API`

**Labels**: `api`, `training`, `games`, `backend`, `medium-priority`

**Description**:
```markdown
## Description
Create endpoints to load recent performance data and upcoming game schedule for training context.

## Acceptance Criteria
- [ ] Create GET `/api/performance/recent` endpoint
- [ ] Create GET `/api/games/upcoming` endpoint
- [ ] Return last 5 performance tests
- [ ] Return next 5 scheduled games
- [ ] Include relevant metrics
- [ ] Connect both components

## Technical Details
- Query: `performance_tests` table (last 5)
- Query: `fixtures` table (next 5, future dates)
- Include: test type, score, date, opponent
- Cache: reasonable TTL (5 minutes)

## Estimated Effort
4 hours

## Files Affected
- `angular/src/app/features/training/smart-training-form/smart-training-form.component.ts:445,446`
- `angular/src/app/shared/components/training-builder/training-builder.component.ts:702,703`
```

---

## 🟡 MEDIUM PRIORITY ISSUES (9 issues)

### Issue #15: ACWR Session Logging Modal
**Title**: `Implement ACWR Session Logging Modal`

**Labels**: `feature`, `ui`, `acwr`, `medium-priority`

**Description**:
```markdown
## Description
Create modal dialog for quick training session logging from ACWR dashboard.

## Acceptance Criteria
- [ ] Create modal component
- [ ] Form for RPE and duration
- [ ] Calculate training load
- [ ] Save to database
- [ ] Update ACWR immediately
- [ ] Connect open modal button

## Technical Details
- Use: PrimeNG Dialog
- Fields: date, RPE (1-10), duration (minutes)
- Calculate: load = RPE × duration
- Update: ACWR chart in real-time

## Estimated Effort
3 hours

## Files Affected
- `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.ts:583`
```

---

### Issue #16: ACWR History Navigation
**Title**: `Implement ACWR History Navigation`

**Labels**: `feature`, `navigation`, `acwr`, `medium-priority`

**Description**:
```markdown
## Description
Add navigation to dedicated ACWR history page with detailed timeline.

## Acceptance Criteria
- [ ] Create ACWR history route
- [ ] Create history page component
- [ ] Show timeline of ACWR values
- [ ] Display injury events
- [ ] Add filtering options
- [ ] Connect navigation button

## Technical Details
- Route: `/acwr/history`
- Display: 90-day ACWR timeline
- Highlight: danger zones, injuries
- Filter: date range, risk zone

## Estimated Effort
4 hours

## Files Affected
- `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.ts:588`
```

---

### Issue #17: PDF Report Generation
**Title**: `Implement PDF Report Generation`

**Labels**: `feature`, `pdf`, `reports`, `medium-priority`

**Description**:
```markdown
## Description
Generate downloadable PDF reports for ACWR analysis and training history.

## Acceptance Criteria
- [ ] Create PDF template
- [ ] Include ACWR chart
- [ ] Include summary statistics
- [ ] Add interpretation guide
- [ ] Generate downloadable file
- [ ] Connect generate button

## Technical Details
- Library: jsPDF or similar
- Content: charts (as images), tables, text
- Styling: professional template
- Format: A4, portrait

## Estimated Effort
8 hours

## Files Affected
- `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.ts:593`
```

---

### Issue #18: Skill Drill Functionality
**Title**: `Implement Skill Drill Functionality`

**Labels**: `feature`, `training`, `drills`, `low-priority`

**Description**:
```markdown
## Description
Create interactive skill drill exercises with video demonstrations and progress tracking.

## Acceptance Criteria
- [ ] Create drill library
- [ ] Add video demonstrations
- [ ] Track drill completion
- [ ] Record performance metrics
- [ ] Show improvement over time
- [ ] Connect to skill radar

## Technical Details
- Component: skill drill modal
- Content: video embed, instructions
- Tracking: completion date, reps, quality
- Integration: update skill scores

## Estimated Effort
10 hours

## Files Affected
- `angular/src/app/shared/components/interactive-skills-radar/interactive-skills-radar.component.ts:282`
```

---

### Issue #19: Search Functionality
**Title**: `Implement Global Search Functionality`

**Labels**: `feature`, `search`, `navigation`, `medium-priority`

**Description**:
```markdown
## Description
Add global search with navigation to results or triggering search service.

## Acceptance Criteria
- [ ] Create search service
- [ ] Index searchable content
- [ ] Implement search algorithm
- [ ] Create results page
- [ ] Handle search navigation
- [ ] Connect header search input

## Technical Details
- Search: players, exercises, sessions, analytics
- Algorithm: fuzzy matching, relevance scoring
- Results: categorized by type
- Navigation: route to `/search?q=query`

## Estimated Effort
8 hours

## Files Affected
- `angular/src/app/shared/components/header/header.component.ts:468`
```

---

### Issue #20: Notifications Panel
**Title**: `Implement Notifications Panel Toggle`

**Labels**: `feature`, `notifications`, `ui`, `medium-priority`

**Description**:
```markdown
## Description
Create slide-out notifications panel with list and actions.

## Acceptance Criteria
- [ ] Create notifications panel component
- [ ] Show unread notifications
- [ ] Mark as read action
- [ ] Navigate to notification source
- [ ] Toggle panel open/close
- [ ] Connect bell icon click

## Technical Details
- Component: slide panel (PrimeNG Sidebar)
- Display: list of notifications
- Actions: mark read, navigate, delete
- Animation: smooth slide from right

## Estimated Effort
4 hours

## Files Affected
- `angular/src/app/shared/components/header/header.component.ts:474`
```

---

### Issue #21: Backend Logging Service
**Title**: `Implement Backend Logging Service`

**Labels**: `infrastructure`, `logging`, `backend`, `low-priority`

**Description**:
```markdown
## Description
Create centralized logging service to send frontend logs to backend for monitoring.

## Acceptance Criteria
- [ ] Create POST `/api/logs` endpoint
- [ ] Accept log level, message, context
- [ ] Store in logging service (e.g., CloudWatch)
- [ ] Rate limit to prevent abuse
- [ ] Filter sensitive data
- [ ] Connect frontend logger

## Technical Details
- Endpoint: buffered batch logging
- Levels: error, warn, info, debug
- Storage: logging service or database
- Privacy: sanitize user data

## Estimated Effort
6 hours

## Files Affected
- `angular/src/app/core/services/evidence-config.service.ts:81`
```

---

### Issue #22: Recovery Protocols Table Migration
**Title**: `Migrate Recovery Protocols to Dedicated Table`

**Labels**: `infrastructure`, `database`, `backend`, `low-priority`

**Description**:
```markdown
## Description
Move recovery protocol storage from JSON to dedicated table for better querying.

## Acceptance Criteria
- [ ] Create `recovery_protocols` table
- [ ] Define schema for protocols
- [ ] Migrate existing protocol data
- [ ] Update service to use new table
- [ ] Add RLS policies
- [ ] Test data integrity

## Technical Details
- Table: `recovery_protocols` (id, name, type, duration, instructions)
- Migration: extract from JSON to rows
- Queries: join with recovery_sessions
- Benefits: better querying, validation

## Estimated Effort
4 hours

## Files Affected
- `angular/src/app/core/services/recovery.service.ts:394`
```

---

### Issue #23: Notification System Integration
**Title**: `Integrate ACWR Alerts with Notification System`

**Labels**: `integration`, `notifications`, `backend`, `medium-priority`

**Description**:
```markdown
## Description
Connect ACWR alerts to existing notification system for real-time alerts.

## Acceptance Criteria
- [ ] Call notification service on alerts
- [ ] Create notification records
- [ ] Set appropriate severity
- [ ] Include alert details
- [ ] Support user preferences
- [ ] Test alert delivery

## Technical Details
- Service: NotificationStateService (exists)
- Method: createNotification()
- Types: warning, danger, info
- Delivery: in-app, email (optional)

## Estimated Effort
3 hours

## Files Affected
- `angular/src/app/core/services/acwr-alerts.service.ts:173`
```

---

## 🟢 LOW PRIORITY ISSUES (4 issues)

### Issue #24: Email/SMS Coach Alerts
**Title**: `Implement Email/SMS Coach Alerts`

**Labels**: `integration`, `email`, `sms`, `backend`, `low-priority`

**Description**:
```markdown
## Description
Send email/SMS notifications to coaches for critical ACWR alerts.

## Acceptance Criteria
- [ ] Set up email service (e.g., SendGrid)
- [ ] Set up SMS service (e.g., Twilio)
- [ ] Create alert templates
- [ ] Get coach contact preferences
- [ ] Send notifications on critical alerts
- [ ] Track delivery status

## Technical Details
- Email: SendGrid or AWS SES
- SMS: Twilio or AWS SNS
- Triggers: injury risk, overtraining
- Rate limit: max 1 per hour per alert type

## Estimated Effort
10 hours

## Dependencies
Email/SMS service setup, billing

## Files Affected
- `angular/src/app/core/services/acwr-alerts.service.ts:191`
```

---

### Issue #25: OpenAI Nutrition Assistant
**Title**: `Implement OpenAI Nutrition AI Assistant`

**Labels**: `integration`, `ai`, `nutrition`, `backend`, `medium-priority`

**Description**:
```markdown
## Description
Integrate OpenAI for AI-powered nutrition recommendations via Supabase Edge Function.

## Acceptance Criteria
- [ ] Create Supabase Edge Function
- [ ] Integrate OpenAI API
- [ ] Send user goals and current intake
- [ ] Receive personalized recommendations
- [ ] Parse and format suggestions
- [ ] Display in nutrition dashboard
- [ ] Handle API errors gracefully

## Technical Details
- Function: `/functions/v1/nutrition-ai`
- Input: user profile, goals, current intake
- Output: meal suggestions, macro adjustments
- Model: GPT-4 or GPT-3.5-turbo
- Cost: ~$0.01-0.03 per request

## Estimated Effort
16 hours

## Dependencies
OpenAI API key, Supabase Edge Functions, budget approval

## Files Affected
- `angular/src/app/core/services/nutrition.service.ts:605`
```

---

### Issue #26: Player Context from Auth
**Title**: `Get Player Context from Auth Service`

**Labels**: `bug`, `data`, `context`, `high-priority`

**Description**:
```markdown
## Description
Replace hardcoded player ID with actual values from authentication context.

## Acceptance Criteria
- [ ] Inject AuthService
- [ ] Get current user from auth
- [ ] Fetch player profile if needed
- [ ] Replace hardcoded value
- [ ] Handle unauthenticated state
- [ ] Test with real user data

## Technical Details
- Service: AuthService.getUser()
- Fallback: guest/demo mode
- Profile: fetch from profiles table if needed
- Validation: ensure player exists

## Estimated Effort
1 hour

## Files Affected
- `angular/src/app/core/services/acwr-alerts.service.ts:138`
```

---

### Issue #27: Player Name from Auth
**Title**: `Get Player Name from Auth Service`

**Labels**: `bug`, `data`, `context`, `high-priority`

**Description**:
```markdown
## Description
Replace hardcoded player name with actual values from authentication context.

## Acceptance Criteria
- [ ] Use AuthService to get user data
- [ ] Get player name from profile
- [ ] Replace hardcoded value
- [ ] Handle missing name gracefully
- [ ] Test with real user data

## Technical Details
- Service: AuthService.getUser()
- Profile: fetch from profiles table
- Fallback: "Player" if name not set
- Format: first_name + last_name

## Estimated Effort
30 minutes

## Files Affected
- `angular/src/app/core/services/acwr-alerts.service.ts:139`
```

---

## ✅ DONE! Next Steps

1. **Copy each issue** above to GitHub
2. **Add to project board** (optional but recommended)
3. **Assign to team members** (if applicable)
4. **Start Sprint 1!**

---

## 🎯 Recommended Labels to Create

In your GitHub repository settings, create these labels:

- `api` (color: #0075ca)
- `backend` (color: #d73a4a)
- `frontend` (color: #cfd3d7)
- `feature` (color: #a2eeef)
- `high-priority` (color: #d73a4a)
- `medium-priority` (color: #fbca04)
- `low-priority` (color: #0e8a16)
- `authentication` (color: #7057ff)
- `training` (color: #008672)
- `team-management` (color: #e99695)
- `analytics` (color: #f9d0c4)
- `integration` (color: #d4c5f9)
- `infrastructure` (color: #c5def5)

---

**🎉 You're all set to create your GitHub issues! Good luck!** 🚀

