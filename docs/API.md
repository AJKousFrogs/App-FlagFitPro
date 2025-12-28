# FlagFit Pro API Documentation

**Version**: 2.1  
**Last Updated**: December 2025  
**Last Verified Against Codebase**: 2025-12-28  
**Status**: ✅ Production Ready

---

## Overview

FlagFit Pro uses **Supabase** for database and authentication, with **Netlify Functions** providing the API layer. All API endpoints are served from `/api/*` and routed through `netlify.toml` redirects.

## Base URL

- **Development**: `http://localhost:8888/api`
- **Production**: `https://your-site.netlify.app/api`

## Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Tokens are obtained via Supabase Auth and validated by the `baseHandler` middleware.

---

## Core API Endpoints

### Health & Status

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | API health check |
| GET | `/api/api-docs` | No | API documentation |

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login with credentials |
| POST | `/api/auth/reset-password` | No | Request password reset |
| GET | `/auth-me` | Yes | Verify token and get user |
| POST | `/api/accept-invitation` | No | Accept team invitation |
| GET | `/api/validate-invitation` | No | Validate invitation token |
| POST | `/api/team-invite` | Yes | Send team invitation |

### Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard` | Yes | Main dashboard data |
| GET | `/api/dashboard/overview` | Yes | Dashboard overview |
| GET | `/api/dashboard/notifications` | Yes | User notifications |
| GET | `/api/dashboard/notifications/count` | Yes | Unread notification count |
| POST | `/api/dashboard/notifications/create` | Yes | Create notification |
| GET | `/api/dashboard/notifications/preferences` | Yes | Notification preferences |
| PUT | `/api/dashboard/notifications/preferences` | Yes | Update preferences |

### Training Sessions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/training/sessions` | Yes | List training sessions |
| POST | `/api/training/sessions` | Yes | Create training session |
| POST | `/api/training/complete` | Yes | Mark session complete |
| GET | `/api/training/suggestions` | Yes | AI training suggestions |
| GET | `/api/training/stats` | Yes | Training statistics |
| GET | `/api/training/stats-enhanced` | Yes | Enhanced statistics |

### Training Programs (Annual Periodization)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/training-programs` | Yes | List programs |
| GET | `/api/training-programs?id={id}&full=true` | Yes | Full program with nested data |
| GET | `/api/training-programs/phases` | Yes | Program phases |
| GET | `/api/training-programs/weeks` | Yes | Training weeks |
| GET | `/api/training-programs/sessions` | Yes | Session templates |
| GET | `/api/training-programs/exercises` | Yes | Exercise library |
| GET | `/api/training-programs/current-week` | Yes | Current training week |

### Daily Training

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/daily-training` | Yes | Get daily training plan |
| POST | `/api/daily-training` | Yes | Log daily training |

### Smart Training Recommendations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/smart-training` | Yes | Smart recommendations |
| POST | `/api/smart-training` | Yes | Get recommendations with params |

### Load Management (Evidence-Based)

Based on 87 peer-reviewed studies with 12,453 athletes.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/load-management` | Yes | Overview (ACWR, monotony, TSB) |
| GET | `/api/load-management/acwr` | Yes | ACWR calculation |
| GET | `/api/load-management/monotony` | Yes | Training monotony |
| GET | `/api/load-management/tsb` | Yes | Training stress balance |
| GET | `/api/load-management/injury-risk` | Yes | Composite injury risk |
| GET | `/api/load-management/training-loads` | Yes | Training load history |

**ACWR Response:**
```json
{
  "acwr": 1.15,
  "riskZone": "safe",
  "injuryRiskMultiplier": 1.0,
  "acuteAverage": 450.5,
  "chronicAverage": 391.7,
  "recommendation": "Training load is in the optimal 'sweet spot'. Maintain current progression."
}
```

### Readiness

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/calc-readiness` | Yes | Calculate readiness score |
| GET | `/api/readiness-history` | Yes | Historical readiness data |

### Wellness

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/wellness/latest` | Yes | Latest wellness check-in |
| GET | `/api/wellness/checkins` | Yes | Wellness history |
| POST | `/api/wellness/checkin` | Yes | Submit wellness check-in |

### Performance

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/performance/metrics` | Yes | Performance metrics |
| GET | `/api/performance/trends` | Yes | Performance trends |
| GET | `/api/performance/heatmap` | Yes | Performance heatmap |

### Performance Data (Comprehensive)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/performance-data/measurements` | Yes | Body measurements |
| GET | `/api/performance-data/performance-tests` | Yes | Performance test results |
| GET | `/api/performance-data/wellness` | Yes | Wellness data |
| GET | `/api/performance-data/supplements` | Yes | Supplement logs |
| GET | `/api/performance-data/injuries` | Yes | Injury history |
| GET | `/api/performance-data/trends` | Yes | All trends combined |
| GET | `/api/performance-data/export` | Yes | Export all data |

### Games & Stats

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/games` | Yes | List games |
| POST | `/api/games` | Yes | Create game |
| GET | `/api/games/{id}` | Yes | Game details |
| GET | `/api/games/{id}/stats` | Yes | Game statistics |
| GET | `/api/player-stats` | Yes | Aggregated player stats |
| GET | `/api/fixtures` | Yes | Upcoming fixtures |

### Tournaments

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/tournaments` | Yes | List tournaments |
| GET | `/api/tournaments?year=2026` | Yes | Filter by year |
| GET | `/api/tournaments?id={id}` | Yes | Tournament details |
| POST | `/api/tournaments` | Yes | Create tournament (admin) |
| PUT | `/api/tournaments?id={id}` | Yes | Update tournament (admin) |
| DELETE | `/api/tournaments?id={id}` | Yes | Delete tournament (admin) |

### AI Chat (with Safety Tiers)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/chat` | Yes | AI chat with safety classification |
| POST | `/api/ai/feedback` | Yes | Submit feedback on AI response |

**Request Body:**
```json
{
  "message": "How do I improve my throwing mechanics?",
  "session_id": "optional-session-id",
  "team_id": "optional-team-id"
}
```

**Response:**
```json
{
  "answer_markdown": "...",
  "citations": [...],
  "risk_level": "low|medium|high",
  "disclaimer": "...",
  "suggested_actions": [...],
  "chat_session_id": "...",
  "message_id": "..."
}
```

### Knowledge Base

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/knowledge-search` | No | Search knowledge base |
| GET | `/knowledge-search/{topic}` | No | Get topic details |

### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/performance-trends` | Yes | Performance trends |
| GET | `/api/analytics/team-chemistry` | Yes | Team chemistry data |
| GET | `/api/analytics/training-distribution` | Yes | Training distribution |
| GET | `/api/analytics/injury-risk` | Yes | Injury risk analysis |
| GET | `/api/analytics/summary` | Yes | Analytics summary |

### Nutrition

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/nutrition/search-foods?query={term}` | Yes | Search food database |
| POST | `/api/nutrition/add-food` | Yes | Log food intake |
| GET | `/api/nutrition/goals` | Yes | Nutrition goals |
| GET | `/api/nutrition/meals` | Yes | Today's meals |
| GET | `/api/nutrition/ai-suggestions` | Yes | AI nutrition suggestions |
| GET | `/api/nutrition/performance-insights` | Yes | Nutrition-performance insights |

### Supplements

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/supplements/logs` | Yes | Supplement log history |
| POST | `/api/supplements/log` | Yes | Log supplement intake |

### Recovery

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/recovery/metrics` | Yes | Recovery metrics |
| GET | `/api/recovery/protocols` | Yes | Recommended protocols |
| POST | `/api/recovery/start-session` | Yes | Start recovery session |
| POST | `/api/recovery/complete-session` | Yes | Complete recovery session |
| POST | `/api/recovery/stop-session` | Yes | Stop recovery session |
| GET | `/api/recovery/weekly-trends` | Yes | Weekly recovery trends |
| GET | `/api/recovery/research-insights` | Yes | Research-based insights |
| GET | `/api/recovery/protocol-effectiveness` | Yes | Protocol effectiveness data |

### Exercise Libraries

#### Plyometrics (90 exercises)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/plyometrics` | Yes | List plyometric exercises |
| GET | `/api/plyometrics?position={pos}` | Yes | Filter by position |

#### Isometrics (23 exercises)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/isometrics` | Yes | List isometric exercises |
| GET | `/api/isometrics?muscle_group={group}` | Yes | Filter by muscle group |

### Coach

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/coach/dashboard` | Yes | Coach dashboard |
| GET | `/api/coach/team` | Yes | Team overview |
| GET | `/api/coach/training-analytics` | Yes | Training analytics |
| POST | `/api/coach/training-session` | Yes | Create team session |
| GET | `/api/coach/games` | Yes | Team games |

### Coach Activity Feed

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/coach-activity` | Yes | Activity feed |
| GET | `/api/coach-activity/recent` | Yes | Recent activity |

### Team Management

#### Attendance

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/attendance` | Yes | Get attendance records |
| POST | `/api/attendance` | Yes | Record attendance |
| GET | `/api/attendance/practice/{id}` | Yes | Practice attendance |

#### Depth Chart

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/depth-chart` | Yes | Get depth chart |
| POST | `/api/depth-chart` | Yes | Update depth chart |

#### Equipment

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/equipment` | Yes | List equipment |
| POST | `/api/equipment` | Yes | Add equipment |
| PUT | `/api/equipment/{id}` | Yes | Update equipment |

#### Officials

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/officials` | Yes | List officials |
| POST | `/api/officials` | Yes | Add official |

### Chat & Community

#### Real-time Chat

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/chat/channels` | Yes | List channels |
| POST | `/api/chat/channels` | Yes | Create channel |
| GET | `/api/chat/messages` | Yes | Get messages |
| POST | `/api/chat/messages` | Yes | Send message |

#### Community

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/community/feed` | Yes | Community feed |
| POST | `/api/community/posts` | Yes | Create post |
| GET | `/api/community/leaderboard` | Yes | Leaderboard |
| GET | `/api/community/challenges` | Yes | Challenges |

### Achievements

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/achievements` | Yes | List achievements |
| GET | `/api/achievements/progress` | Yes | Achievement progress |

### Push Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/push/subscribe` | Yes | Subscribe to push |
| POST | `/api/push/unsubscribe` | Yes | Unsubscribe from push |
| POST | `/api/push/send` | Yes | Send push notification |

### User Profile

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/user/profile` | Yes | Get user profile |
| PUT | `/api/user/profile` | Yes | Update profile |
| GET | `/api/user/context` | Yes | Get user context |

### Weather

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/weather/current` | Yes | Current weather |
| GET | `/api/weather/forecast` | Yes | Weather forecast |

### Trends

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/trends` | Yes | All trends |
| GET | `/api/trends/performance` | Yes | Performance trends |
| GET | `/api/trends/training` | Yes | Training trends |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/health-metrics` | Yes | System health metrics |
| POST | `/api/admin/sync-usda` | Yes | Sync USDA data |
| POST | `/api/admin/sync-research` | Yes | Sync research data |
| POST | `/api/admin/create-backup` | Yes | Create database backup |

### Compute Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/compute-acwr` | Yes | Compute ACWR |
| GET | `/api/training-metrics` | Yes | Training metrics |
| POST | `/api/import-open-data` | Yes | Import open data |

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error description",
  "code": "error_code",
  "requestId": "uuid-for-tracking"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `validation_error` | 400 | Invalid request parameters |
| `unauthorized` | 401 | Missing or invalid auth token |
| `forbidden` | 403 | Insufficient permissions |
| `not_found` | 404 | Resource not found |
| `method_not_allowed` | 405 | HTTP method not supported |
| `rate_limited` | 429 | Too many requests |
| `internal_error` | 500 | Server error |

---

## Rate Limiting

| Tier | Requests | Window | Endpoints |
|------|----------|--------|-----------|
| READ | 100 | 1 minute | GET requests |
| CREATE | 20 | 1 minute | POST requests |
| UPDATE | 30 | 1 minute | PUT/PATCH requests |
| DELETE | 10 | 1 minute | DELETE requests |

Rate limits can be configured via environment variables:
- `RATE_LIMIT_READ`
- `RATE_LIMIT_CREATE`
- `RATE_LIMIT_UPDATE`
- `RATE_LIMIT_DELETE`

---

## Angular Service Integration

```typescript
import { ApiService, API_ENDPOINTS } from '@core/services/api.service';

@Injectable({ providedIn: 'root' })
export class MyService {
  private api = inject(ApiService);

  getDashboard() {
    return this.api.get(API_ENDPOINTS.dashboard.overview);
  }

  createSession(data: SessionData) {
    return this.api.post(API_ENDPOINTS.training.createSession, data);
  }
}
```

---

## Netlify Functions Reference

All API endpoints are implemented as Netlify Functions in `/netlify/functions/`:

| Function File | Endpoints Handled |
|---------------|-------------------|
| `health.cjs` | `/api/health` |
| `dashboard.cjs` | `/api/dashboard/*` |
| `training-sessions.cjs` | `/api/training/sessions` |
| `training-programs.cjs` | `/api/training-programs/*` |
| `load-management.cjs` | `/api/load-management/*` |
| `nutrition.cjs` | `/api/nutrition/*` |
| `recovery.cjs` | `/api/recovery/*` |
| `ai-chat.cjs` | `/api/ai/chat` |
| `games.cjs` | `/api/games/*` |
| `tournaments.cjs` | `/api/tournaments/*` |
| `analytics.cjs` | `/api/analytics/*` |
| `coach.cjs` | `/api/coach/*` |
| `community.cjs` | `/api/community/*` |
| `plyometrics.cjs` | `/api/plyometrics` |
| `isometrics.cjs` | `/api/isometrics` |
| `attendance.cjs` | `/api/attendance/*` |
| `depth-chart.cjs` | `/api/depth-chart/*` |
| `equipment.cjs` | `/api/equipment/*` |
| `officials.cjs` | `/api/officials/*` |
| `chat.cjs` | `/api/chat/*` |
| `push.cjs` | `/api/push/*` |

---

## Related Documentation

- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Backend setup guide
- [AUTHENTICATION_PATTERN.md](AUTHENTICATION_PATTERN.md) - Auth patterns
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Database schema
- [RLS_POLICY_SPECIFICATION.md](RLS_POLICY_SPECIFICATION.md) - Row Level Security

---

_Last Updated: December 28, 2025_
