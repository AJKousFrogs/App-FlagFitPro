# FlagFit Pro - Workflow and Business Logic Documentation

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [User Management & Authentication](#user-management--authentication)
3. [Team Management](#team-management)
4. [Training System](#training-system)
5. [Tournament Management](#tournament-management)
6. [Analytics & Performance Tracking](#analytics--performance-tracking)
7. [AI Coaching System](#ai-coaching-system)
8. [Community Features](#community-features)
9. [Data Flow Diagrams](#data-flow-diagrams)
10. [Business Rules](#business-rules)

---

## Overview

FlagFit Pro is a comprehensive flag football training platform designed to help athletes track performance, manage training, participate in tournaments, and connect with teams. The platform combines modern web technologies with sports science to deliver personalized training experiences and advanced analytics.

### Core User Types

- **Players**: Athletes who train, track performance, and participate in tournaments
- **Coaches**: Team managers who create teams, assign training programs, and track player progress
- **Administrators**: Platform administrators with system-wide access

### Key Business Domains

1. **User Authentication & Profile Management**
2. **Team Creation & Member Management**
3. **Training Program Creation & Execution**
4. **Tournament Registration & Management**
5. **Performance Analytics & Load Monitoring**
6. **AI-Powered Coaching & Recommendations**
7. **Community Engagement & Social Features**

---

## User Management & Authentication

### Registration Workflow

```
1. User visits registration page
   ↓
2. User fills out form:
   - Full Name
   - Email (must be unique)
   - Password (min 8 chars, uppercase, lowercase, number, special char)
   - Confirm Password
   ↓
3. Frontend validates input client-side
   ↓
4. POST request to Supabase Auth API
   - Endpoint: Supabase Auth signUp()
   - Includes metadata: name, role (default: 'player'), first_name, last_name
   ↓
5. Supabase creates user account
   - User status: unverified
   - Email verification token generated
   ↓
6. Verification email sent
   - Redirect URL: /verify-email.html
   - Contains verification token
   ↓
7. User receives email and clicks verification link
   ↓
8. Email verification processed
   - Token validated
   - User email_verified flag set to true
   ↓
9. User can now log in
```

**Business Rules:**
- Email verification is **required** before login
- Password must meet complexity requirements
- Email addresses are normalized to lowercase
- Duplicate email addresses are rejected
- Registration creates a user profile with default role 'player'

### Login Workflow

```
1. User enters email and password
   ↓
2. Frontend validates input
   ↓
3. POST request to Supabase Auth API
   - Endpoint: Supabase Auth signIn()
   ↓
4. Supabase validates credentials
   - Checks email exists
   - Verifies password hash
   - Checks email_verified status
   ↓
5. If valid:
   - Session created
   - JWT token generated
   - Token stored in secure httpOnly cookie
   ↓
6. Frontend receives session
   - User data loaded
   - Token stored for API calls
   ↓
7. User redirected to dashboard
```

**Business Rules:**
- Unverified users cannot log in
- Failed login attempts are rate-limited
- Sessions expire after inactivity (configurable)
- Tokens are automatically refreshed before expiration

### Password Reset Workflow

```
1. User clicks "Forgot Password"
   ↓
2. User enters email address
   ↓
3. POST request to /auth-reset-password
   ↓
4. Backend validates email exists
   ↓
5. Reset token generated (expires in 1 hour)
   ↓
6. Reset email sent with token link
   ↓
7. User clicks link → redirected to reset-password.html?token=xxx
   ↓
8. User enters new password
   ↓
9. POST request with token and new password
   ↓
10. Token validated and password updated
   ↓
11. User can log in with new password
```

**Business Rules:**
- Reset tokens expire after 1 hour
- Tokens are single-use
- Password must meet complexity requirements
- Old password cannot be reused

---

## Team Management

### Team Creation Workflow

```
1. Coach navigates to "Create Team" page
   ↓
2. Coach fills out team form:
   - Team Name (required)
   - League (optional)
   - Season (optional)
   - Home City (optional)
   - Description (optional)
   - Team Logo URL (optional)
   - Primary/Secondary Colors (optional)
   ↓
3. POST request to /api/teams
   - Includes coach_id (from authenticated user)
   ↓
4. Backend validates:
   - Coach has permission to create teams
   - Team name is unique (optional business rule)
   ↓
5. Team record created in database
   - coach_id set to current user
   - created_at timestamp set
   ↓
6. Coach automatically added as team member
   - Role: 'coach'
   - Status: 'active'
   ↓
7. Team created successfully
   - Coach redirected to team roster page
```

**Business Rules:**
- Only authenticated users can create teams
- Coach automatically becomes team member with 'coach' role
- Team name uniqueness can be enforced (optional)
- Teams can have one primary coach (coach_id)

### Team Invitation Workflow

```
1. Coach navigates to team roster page
   ↓
2. Coach clicks "Invite Player"
   ↓
3. Coach enters:
   - Email address (required)
   - Role: 'player' or 'assistant_coach' (default: 'player')
   - Position (optional)
   - Jersey Number (optional)
   - Custom Message (optional)
   ↓
4. POST request to /team-invite
   - Includes: teamId, email, role, position, jerseyNumber, coachMessage
   ↓
5. Backend validates:
   - User is team coach (coach_id matches)
   - Email format is valid
   - No pending invitation exists for this email
   ↓
6. Invitation token generated
   - Unique token created
   - Expires in 7 days
   ↓
7. Invitation record created in team_invitations table
   - Status: 'pending'
   - Token stored
   - Expires_at set
   ↓
8. Invitation email sent
   - Contains invitation link: /accept-invitation.html?token=xxx
   - Includes team name, inviter name, custom message
   ↓
9. Invitee receives email
   ↓
10. Invitee clicks link (if not logged in, redirected to login)
   ↓
11. GET request to /accept-invitation?token=xxx
   ↓
12. Backend validates:
   - Token exists and is valid
   - Invitation not expired
   - Invitation status is 'pending'
   - User email matches invitation email
   ↓
13. If valid:
   - Team member record created
   - Invitation status updated to 'accepted'
   - accepted_at timestamp set
   ↓
14. User redirected to team roster page
```

**Business Rules:**
- Only team coaches can send invitations
- Invitations expire after 7 days
- One pending invitation per email per team
- User must be logged in to accept invitation
- Email address must match invitation email
- Users cannot accept expired invitations
- If user is already a team member, invitation is marked as accepted but no duplicate member is created

### Team Member Management

**Roles:**
- `coach`: Full team management access
- `assistant_coach`: Can manage players but not team settings
- `player`: Standard team member

**Permissions:**
- **Coaches** can:
  - Update team information
  - Invite/remove members
  - Assign positions and jersey numbers
  - View all team analytics
  - Create training programs for team
  
- **Assistant Coaches** can:
  - View team roster
  - View team analytics
  - Create training programs
  
- **Players** can:
  - View team roster
  - View their own performance data
  - Participate in team training programs

---

## Training System

### Training Program Structure

The training system follows a periodized approach:

```
Training Program (Annual/Seasonal)
  ├── Phase 1: Foundation (Mesocycle)
  │   ├── Week 1 (Microcycle)
  │   │   ├── Session 1: Morning Routine
  │   │   │   ├── Exercise 1: 3-Step Acceleration
  │   │   │   ├── Exercise 2: Deceleration Drills
  │   │   │   └── Exercise 3: Core Stability
  │   │   ├── Session 2: Speed Session
  │   │   └── Session 3: Strength Training
  │   ├── Week 2
  │   └── Week 3-4
  ├── Phase 2: Power
  ├── Phase 3: Explosive
  └── Phase 4: Tournament Maintenance
```

### Training Program Creation Workflow

```
1. Coach navigates to Training Programs page
   ↓
2. Coach clicks "Create Program"
   ↓
3. Coach defines program:
   - Program Name (e.g., "QB Annual Program 2025-2026")
   - Position (QB, WR, DB, etc.)
   - Start Date / End Date
   - Description
   ↓
4. Coach creates phases (Mesocycles):
   - Phase 1: Foundation (dates, focus areas)
   - Phase 2: Power (dates, focus areas)
   - Phase 3: Explosive (dates, focus areas)
   - Phase 4: Tournament Maintenance (dates, focus areas)
   ↓
5. For each phase, coach creates weeks (Microcycles):
   - Week Number (1, 2, 3, 4)
   - Start/End Dates
   - Load Percentage (20%, 30%, 40% BW)
   - Volume Multiplier (for throwing volume: 1.0 → 1.5 → 2.0 → 3.2)
   - Focus Description
   ↓
6. For each week, coach creates sessions:
   - Session Name (e.g., "Morning Routine")
   - Session Type (Strength, Speed, Skill, Recovery, Position-Specific)
   - Day of Week (0-6, Monday-Sunday)
   - Session Order (1=Morning, 2=Afternoon, 3=Evening)
   - Duration (minutes)
   - Warm-up/Cool-down Protocols
   ↓
7. For each session, coach adds exercises:
   - Select from exercise library
   - Set Sets/Reps
   - Set Load Type (Percentage BW, Fixed Weight, Bodyweight, Time-based)
   - Set Load Value (e.g., 20% BW)
   - Set Rest Periods
   - Add Position-Specific Parameters (JSONB)
   ↓
8. Program saved to database
   ↓
9. Coach assigns program to players
```

**Business Rules:**
- Programs are position-specific
- Phases must be sequential (no gaps)
- Weeks within phases must be sequential
- Load progression follows periodization principles
- Exercises can be reused across multiple sessions

### Training Session Execution Workflow

```
1. Player navigates to Training page
   ↓
2. Player sees assigned programs
   - Active programs displayed
   - Today's sessions highlighted
   ↓
3. Player selects a session to start
   ↓
4. Session details displayed:
   - Exercises list
   - Sets/Reps for each exercise
   - Load requirements
   - Duration estimate
   ↓
5. Player clicks "Start Session"
   ↓
6. Session timer starts
   ↓
7. Player completes exercises:
   - For each exercise:
     - Mark sets as completed
     - Record actual reps/weight/distance/time
     - Add notes (optional)
   ↓
8. Player completes session
   ↓
9. Player enters:
   - RPE (Rate of Perceived Exertion, 1-10)
   - Duration (actual minutes)
   - Notes (optional)
   ↓
10. POST request to /api/training/sessions
    - Includes: session_id, exercises_completed, rpe, duration, notes
   ↓
11. Backend creates workout_log record:
    - Links to training_session
    - Records RPE, duration, notes
    - Timestamp set
   ↓
12. Backend creates exercise_log records:
    - One per exercise completed
    - Records actual performance vs. prescribed
   ↓
13. Load monitoring updated:
    - Daily load calculated: RPE × Duration
    - Acute load updated (7-day rolling average)
    - Chronic load updated (28-day rolling average)
    - ACWR calculated: Acute / Chronic
    - Injury risk level determined:
      * Low: ACWR < 0.8
      * Moderate: 0.8 ≤ ACWR ≤ 1.3
      * High: ACWR > 1.3
   ↓
14. Position-specific metrics updated:
    - If QB: Throwing volume tracked
    - If WR: Route completion tracked
    - Other position-specific metrics
   ↓
15. Session marked as completed
   ↓
16. Player sees completion confirmation
    - Performance summary
    - Load metrics
    - Injury risk indicator
```

**Business Rules:**
- Sessions can be completed ahead of schedule
- Sessions can be completed late (marked as such)
- RPE is required for load calculation
- Duration must be positive integer
- ACWR thresholds determine injury risk
- High ACWR triggers warning notification

### Training Session Creation (Quick Builder)

```
1. Player/Coach navigates to Training Builder
   ↓
2. User selects exercises from library
   ↓
3. User configures each exercise:
   - Sets
   - Reps
   - Rest periods
   - Load/Weight
   ↓
4. User sets session details:
   - Duration
   - Intensity (Low, Medium, High)
   - Goals (array)
   - Equipment needed
   - Scheduled Date
   - Notes
   ↓
5. POST request to /api/training/sessions
   ↓
6. Backend creates training_session record:
   - Status: 'planned'
   - Links to user
   - Calculates total duration
   - Maps intensity to numeric value (Low=3, Medium=6, High=9)
   ↓
7. Backend creates session_exercises records
   ↓
8. Session saved and displayed in training schedule
```

**Business Rules:**
- Sessions can be planned in advance
- Status changes from 'planned' to 'completed' when executed
- Intensity maps to numeric values for analytics
- Duration can be auto-calculated from exercises

---

## Tournament Management

### Tournament Creation Workflow

```
1. Organizer navigates to Tournaments page
   ↓
2. Organizer clicks "Create Tournament"
   ↓
3. Organizer fills tournament form:
   - Tournament Name (required)
   - Description
   - Start Date / End Date
   - Location
   - Registration Deadline
   - Max Teams (optional)
   - Entry Fee (optional)
   - Is Public (boolean)
   ↓
4. POST request to /api/tournaments
   ↓
5. Backend creates tournament record:
   - Status: 'upcoming'
   - created_by set to organizer user_id
   ↓
6. Tournament created successfully
   ↓
7. Tournament appears in public list (if is_public = true)
```

**Business Rules:**
- Anyone can create tournaments
- Tournament organizers can manage their tournaments
- Public tournaments visible to all users
- Private tournaments visible only to organizer and registered teams

### Tournament Registration Workflow

```
1. Team Admin/Coach views tournament details
   ↓
2. Team Admin clicks "Register Team"
   ↓
3. Backend validates:
   - Registration deadline not passed
   - Tournament not full (if max_teams set)
   - Team not already registered
   ↓
4. POST request to /api/tournaments/{id}/register
   - Includes: team_id, tournament_id
   ↓
5. Backend creates tournament_registration record:
   - Status: 'registered'
   - registered_at timestamp set
   ↓
6. Registration confirmed
   ↓
7. Team appears in tournament bracket/participants list
```

**Business Rules:**
- Only team admins/coaches can register teams
- Teams cannot register after deadline
- Teams cannot register if tournament is full
- Teams can cancel registration before tournament starts

### Tournament Match Management

```
1. Organizer creates tournament matches
   ↓
2. Matches assigned to teams:
   - Match Date/Time
   - Team 1 vs Team 2
   - Round (e.g., "Quarterfinal", "Semifinal", "Final")
   ↓
3. Match results recorded:
   - Team 1 Score
   - Team 2 Score
   - Winner determined
   ↓
4. Bracket updated automatically
   ↓
5. Next round matches created
```

**Business Rules:**
- Only tournament organizers can create/manage matches
- Match results determine bracket progression
- Completed matches cannot be edited (unless organizer)

---

## Analytics & Performance Tracking

### Performance Data Collection

```
1. User performs actions throughout app:
   - Completes training sessions
   - Participates in games
   - Updates profile
   - Uses features
   ↓
2. Analytics events tracked:
   - Event Type (e.g., 'training_completed', 'game_played')
   - Event Data (JSONB with details)
   - Session ID
   - Page URL
   - User Agent
   - Timestamp
   ↓
3. Events stored in analytics_events table
   ↓
4. Aggregated into user_behavior table:
   - Page sequence
   - Session duration
   - Features used
   - Conversion events
   ↓
5. Training-specific analytics:
   - Training type
   - Duration
   - Performance score
   - Goals achieved
   - Personal bests
   ↓
6. Data available for:
   - Dashboard visualizations
   - Performance reports
   - Trend analysis
```

### Load Monitoring (ACWR System)

```
1. Daily load calculated after each training session:
   Daily Load = RPE × Duration (minutes)
   ↓
2. Acute Load calculated (7-day rolling average):
   Acute Load = Sum of daily loads (last 7 days) / 7
   ↓
3. Chronic Load calculated (28-day rolling average):
   Chronic Load = Sum of daily loads (last 28 days) / 28
   ↓
4. ACWR calculated:
   ACWR = Acute Load / Chronic Load
   ↓
5. Injury Risk Level determined:
   - Low: ACWR < 0.8 (under-training)
   - Moderate: 0.8 ≤ ACWR ≤ 1.3 (optimal)
   - High: ACWR > 1.3 (injury risk)
   ↓
6. Warnings triggered:
   - High ACWR → Warning notification
   - Low ACWR → Suggestion to increase training
   ↓
7. Data stored in load_monitoring table
   ↓
8. Visualized in dashboard:
   - ACWR trend chart
   - Injury risk indicator
   - Load recommendations
```

**Business Rules:**
- ACWR requires minimum 28 days of data
- High ACWR triggers immediate warning
- Load recommendations based on ACWR thresholds
- Historical data used for trend analysis

### Position-Specific Metrics

**Quarterback (QB):**
- Throwing Volume (total throws per week/month)
- Throwing Accuracy
- Completion Percentage
- Throwing Distance

**Wide Receiver (WR):**
- Route Completion Rate
- Catch Percentage
- Yards After Catch
- Route Running Time

**Defensive Back (DB):**
- Interceptions
- Pass Breakups
- Tackles
- Coverage Success Rate

**Other Positions:**
- Custom metrics via JSONB field
- Flexible tracking system

---

## AI Coaching System

### Chatbot Question Processing Workflow

```
1. User types question in chatbot
   ↓
2. Question sent to chatbot service
   ↓
3. Question Parser analyzes:
   - Intent detection (dosage, timing, safety, how_to, what_is, why, protocol)
   - Entity extraction (supplements, injuries, recovery methods, training types)
   - Body stats parsing (height, weight, age)
   - Context understanding (urgency, specificity, time frame)
   ↓
4. Knowledge Base searched:
   - Primary: Knowledge base entries (structured data)
   - Secondary: Research articles (raw data)
   - Fallback: Local knowledge base
   ↓
5. Answer Generator creates response:
   - Uses intent-based templates
   - Personalizes with body stats (if provided)
   - Synthesizes multiple sources
   - Formats with markdown
   ↓
6. Response Enhancer adds:
   - Follow-up suggestions
   - Related topics
   - Disclaimers (medical, safety)
   - Evidence level indicators
   ↓
7. Response cached (1-hour cache)
   ↓
8. Response displayed to user
```

### Personalization Logic

```
1. User context loaded:
   - User profile data
   - Active injuries
   - Training schedule
   - Body metrics (height, weight, age)
   ↓
2. Question enriched with context:
   - Injury-aware advice added
   - Schedule-aware recommendations
   - Body stats used for calculations
   ↓
3. Personalized recommendations generated:
   - Dosage calculations based on body stats
   - Injury-specific modifications
   - Schedule-aligned suggestions
   ↓
4. Response adjusted for user role:
   - Coach vs Player perspectives
   - Position-specific advice (QB, WR, DB, etc.)
```

**Business Rules:**
- Personalization requires user to be logged in
- Body stats used for dosage calculations
- Active injuries modify recommendations
- Role-aware responses provide appropriate context

### Intent Types

1. **dosage**: "How much iron should I take?"
2. **timing**: "When should I take creatine?"
3. **safety**: "Is iron supplementation safe?"
4. **comparison**: "Which is better: sauna or cold therapy?"
5. **how_to**: "How do I prevent hamstring strains?"
6. **what_is**: "What is creatine?"
7. **why**: "Why is protein important for recovery?"
8. **protocol**: "What's the best sauna protocol?"

---

## Community Features

### Post Creation Workflow

```
1. User navigates to Community page
   ↓
2. User clicks "Create Post"
   ↓
3. User fills post form:
   - Title (required)
   - Content (required)
   - Category (optional)
   - Tags (optional)
   ↓
4. POST request to /api/community/posts
   ↓
5. Backend creates post record:
   - author_id set to current user
   - created_at timestamp set
   - Status: 'published'
   ↓
6. Post appears in community feed
```

**Business Rules:**
- All authenticated users can create posts
- Posts are public by default
- Users can edit/delete their own posts
- Posts can be reported for moderation

### Leaderboard System

```
1. Performance data aggregated:
   - Training sessions completed
   - Performance scores
   - Goals achieved
   - Tournament results
   ↓
2. Leaderboard calculated:
   - Points assigned based on activities
   - Rankings updated
   ↓
3. Leaderboard displayed:
   - Top performers
   - Category-specific rankings
   - Team rankings
```

**Business Rules:**
- Leaderboard updates in real-time
- Multiple leaderboard categories
- Team vs Individual rankings
- Historical rankings preserved

---

## Data Flow Diagrams

### Authentication Flow

```
┌─────────┐         ┌──────────┐         ┌──────────┐
│ Browser │────────▶│  Angular │────────▶│ Supabase │
│         │         │  Frontend │         │   Auth   │
└─────────┘         └──────────┘         └──────────┘
                            │                   │
                            │                   │
                            ▼                   ▼
                    ┌──────────────┐    ┌──────────────┐
                    │   Session    │    │     JWT      │
                    │   Storage    │    │    Token     │
                    └──────────────┘    └──────────────┘
```

### Training Session Flow

```
┌─────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐
│ Player  │───▶│ Angular  │───▶│ Netlify      │───▶│ Supabase │
│         │    │ Frontend │    │ Functions    │    │ Database │
└─────────┘    └──────────┘    └──────────────┘    └──────────┘
                      │                 │                 │
                      │                 │                 │
                      ▼                 ▼                 ▼
              ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
              │   Training   │  │   Load       │  │   Analytics  │
              │   Session    │  │   Monitor    │  │   Events     │
              └──────────────┘  └──────────────┘  └──────────────┘
```

### Team Invitation Flow

```
┌─────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐
│ Coach   │───▶│ Angular  │───▶│ Netlify      │───▶│ Supabase │
│         │    │ Frontend │    │ Functions    │    │ Database │
└─────────┘    └──────────┘    └──────────────┘    └──────────┘
                      │                 │                 │
                      │                 │                 │
                      ▼                 ▼                 ▼
              ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
              │   Email      │  │   Invitation │  │   Team       │
              │   Service    │  │   Token      │  │   Member     │
              └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Business Rules

### User Management

1. **Email Uniqueness**: Email addresses must be unique across the platform
2. **Email Verification**: Users must verify email before login
3. **Password Complexity**: Minimum 8 characters, uppercase, lowercase, number, special character
4. **Session Expiration**: Sessions expire after configurable inactivity period
5. **Role Assignment**: Default role is 'player', can be changed by admin

### Team Management

1. **Team Creation**: Only authenticated users can create teams
2. **Coach Assignment**: Team creator automatically becomes coach
3. **Invitation Expiration**: Invitations expire after 7 days
4. **Invitation Uniqueness**: One pending invitation per email per team
5. **Member Roles**: Roles include 'coach', 'assistant_coach', 'player'
6. **Permission Hierarchy**: Coaches > Assistant Coaches > Players

### Training System

1. **Program Assignment**: Programs can be assigned to multiple players
2. **Session Completion**: Sessions can be completed ahead of or behind schedule
3. **RPE Requirement**: RPE (1-10) required for load calculation
4. **ACWR Thresholds**: 
   - Low: < 0.8
   - Moderate: 0.8 - 1.3
   - High: > 1.3
5. **Load Calculation**: Daily Load = RPE × Duration
6. **Injury Risk Warnings**: High ACWR triggers immediate warning

### Tournament Management

1. **Tournament Creation**: Anyone can create tournaments
2. **Registration Deadline**: Teams cannot register after deadline
3. **Team Capacity**: Tournaments can have max team limits
4. **Registration Authority**: Only team admins/coaches can register teams
5. **Match Management**: Only tournament organizers can create/manage matches

### Analytics

1. **Event Tracking**: All user interactions tracked
2. **Data Retention**: Analytics data retained for reporting
3. **Privacy**: User data anonymized where possible
4. **Performance Metrics**: Core Web Vitals tracked

### AI Coaching

1. **Personalization**: Requires user to be logged in
2. **Body Stats**: Used for dosage calculations
3. **Injury Awareness**: Active injuries modify recommendations
4. **Response Caching**: Responses cached for 1 hour
5. **Evidence-Based**: Responses cite research sources

### Community

1. **Post Creation**: All authenticated users can create posts
2. **Post Moderation**: Posts can be reported
3. **Leaderboard Updates**: Real-time ranking updates
4. **Privacy**: User profiles visible to community

---

## Error Handling

### Authentication Errors

- **Invalid Credentials**: "Email or password is incorrect"
- **Unverified Email**: "Please verify your email before logging in"
- **Expired Token**: "Session expired, please log in again"
- **Rate Limiting**: "Too many attempts, please try again later"

### Training Errors

- **Missing RPE**: "RPE is required to calculate training load"
- **Invalid Session**: "Session not found or not assigned to you"
- **High ACWR Warning**: "Your ACWR is high, consider reducing training load"

### Team Errors

- **Invitation Expired**: "This invitation has expired"
- **Already Member**: "You are already a member of this team"
- **Permission Denied**: "You don't have permission to perform this action"

### Tournament Errors

- **Registration Closed**: "Registration deadline has passed"
- **Tournament Full**: "Tournament has reached maximum capacity"
- **Already Registered**: "Your team is already registered"

---

## Security Considerations

1. **Authentication**: JWT tokens with secure httpOnly cookies
2. **Authorization**: Role-based access control (RBAC)
3. **Rate Limiting**: API endpoints rate-limited
4. **Input Validation**: All user input validated and sanitized
5. **SQL Injection Prevention**: Parameterized queries
6. **XSS Protection**: Content Security Policy headers
7. **CSRF Protection**: Token-based CSRF protection
8. **Row Level Security**: Database-level access control via Supabase RLS

---

## Performance Optimizations

1. **Response Caching**: AI chatbot responses cached
2. **Database Indexing**: Strategic indexes on frequently queried columns
3. **Lazy Loading**: Components loaded on demand
4. **Pagination**: Large datasets paginated
5. **CDN**: Static assets served via CDN
6. **Compression**: API responses compressed

---

## Future Enhancements

1. **Real-Time Updates**: WebSocket integration for live updates
2. **Mobile App**: Native mobile applications
3. **Wearable Integration**: GPS and wearable device data
4. **Advanced Analytics**: Machine learning predictions
5. **Video Analysis**: Video upload and analysis
6. **Social Features**: Enhanced community interactions
7. **Payment Integration**: Tournament entry fees and subscriptions

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [DESIGN_SYSTEM_DOCUMENTATION.md](./DESIGN_SYSTEM_DOCUMENTATION.md) - Design system guide
- [CHATBOT_LOGIC_DOCUMENTATION.md](./docs/CHATBOT_LOGIC_DOCUMENTATION.md) - AI chatbot logic
- [DATABASE_SETUP.md](./docs/DATABASE_SETUP.md) - Database schema and setup

---

## Changelog

- **v1.0 (2025-01)**: Initial workflow and business logic documentation
  - User authentication workflows documented
  - Team management workflows documented
  - Training system workflows documented
  - Tournament management workflows documented
  - Analytics and AI coaching workflows documented
  - Business rules and error handling documented




