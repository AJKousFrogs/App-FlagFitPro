# 📡 FlagFit Pro API Documentation

**Version**: 2.0  
**Last Updated**: December 2025  
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
| POST | `/api/accept-invitation` | No | Accept team invitation |
| GET | `/api/validate-invitation` | No | Validate invitation token |

### Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard` | Yes | Main dashboard data |
| GET | `/api/dashboard/overview` | Yes | Dashboard overview |
| GET | `/api/dashboard/notifications` | Yes | User notifications |
| POST | `/api/dashboard/notifications/create` | Yes | Create notification |
| GET | `/api/dashboard/notifications/preferences` | Yes | Notification preferences |

### Training

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/training/sessions` | Yes | List training sessions |
| POST | `/api/training/sessions` | Yes | Create training session |
| POST | `/api/training/complete` | Yes | Mark session complete |
| GET | `/api/training/suggestions` | Yes | AI training suggestions |
| GET | `/api/training/stats` | Yes | Training statistics |
| GET | `/api/training/stats-enhanced` | Yes | Enhanced statistics |

### Training Programs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/training-programs` | Yes | List programs |
| GET | `/api/training-programs?id={id}&full=true` | Yes | Full program with nested data |
| GET | `/api/training-programs/phases` | Yes | Program phases |
| GET | `/api/training-programs/weeks` | Yes | Training weeks |
| GET | `/api/training-programs/sessions` | Yes | Session templates |
| GET | `/api/training-programs/exercises` | Yes | Exercise library |
| GET | `/api/training-programs/current-week` | Yes | Current training week |

### Smart Training Recommendations

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/smart-training` | Yes | Smart recommendations |
| POST | `/api/smart-training` | Yes | Get recommendations with params |

### Load Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/load-management/acwr` | Yes | ACWR calculation |
| GET | `/api/load-management/monotony` | Yes | Training monotony |
| GET | `/api/load-management/tsb` | Yes | Training stress balance |
| GET | `/api/load-management/injury-risk` | Yes | Injury risk assessment |
| GET | `/api/load-management/training-loads` | Yes | Training load history |

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
| POST | `/api/knowledge-search` | No | Search knowledge base |
| GET | `/api/knowledge-search/{topic}` | No | Get topic details |

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
| GET | `/api/nutrition/search-foods` | Yes | Search food database |
| POST | `/api/nutrition/add-food` | Yes | Log food intake |
| GET | `/api/nutrition/goals` | Yes | Nutrition goals |
| GET | `/api/nutrition/meals` | Yes | Daily meals |
| GET | `/api/nutrition/ai-suggestions` | Yes | AI nutrition suggestions |

### Recovery

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/recovery/metrics` | Yes | Recovery metrics |
| GET | `/api/recovery/protocols` | Yes | Recovery protocols |
| POST | `/api/recovery/start-session` | Yes | Start recovery session |
| POST | `/api/recovery/complete-session` | Yes | Complete recovery session |
| GET | `/api/recovery/weekly-trends` | Yes | Weekly recovery trends |

### Coach

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/coach/dashboard` | Yes | Coach dashboard |
| GET | `/api/coach/team` | Yes | Team overview |
| GET | `/api/coach/training-analytics` | Yes | Training analytics |
| POST | `/api/coach/training-session` | Yes | Create team session |
| GET | `/api/coach/games` | Yes | Team games |

### Community

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/community/feed` | Yes | Community feed |
| POST | `/api/community/posts` | Yes | Create post |
| GET | `/api/community/leaderboard` | Yes | Leaderboard |
| GET | `/api/community/challenges` | Yes | Challenges |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/health-metrics` | Yes | System health metrics |
| POST | `/api/admin/sync-usda` | Yes | Sync USDA data |
| POST | `/api/admin/sync-research` | Yes | Sync research data |
| POST | `/api/admin/create-backup` | Yes | Create database backup |

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

## Related Documentation

- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Algorithm API details
- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Backend setup guide
- [AUTHENTICATION_PATTERN.md](AUTHENTICATION_PATTERN.md) - Auth patterns
- [AI_COACHING_SYSTEM_REVAMP.md](AI_COACHING_SYSTEM_REVAMP.md) - AI safety tiers

---

_Last Updated: December 26, 2025_
