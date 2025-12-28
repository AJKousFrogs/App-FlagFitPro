# Backend API Setup Guide

**Version**: 2.0  
**Last Updated**: December 2025  
**Last Verified Against Codebase**: 2025-12-28  
**Status**: ✅ Production Ready

---

## Overview

FlagFit Pro uses **Netlify Functions** (serverless) as the backend API layer, connecting to **Supabase PostgreSQL** for data storage and authentication. This guide covers setup for both local development and production deployment.

> **Note**: This project does NOT use Express.js. All 80 API functions are implemented as Netlify serverless functions in `/netlify/functions/`.

### Prerequisites Checklist

- [ ] Supabase project created with credentials
- [ ] Node.js version 20 or higher installed
- [ ] npm package manager installed
- [ ] Netlify CLI installed (for local development)
- [ ] Environment variables configured

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NETLIFY                                      │
│  ├── Angular SPA (dist/flagfit-pro/browser/)                   │
│  ├── 80 Serverless Functions (netlify/functions/)              │
│  └── CDN Distribution                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE                                      │
│  ├── PostgreSQL Database (250+ tables)                         │
│  ├── Auth Service (JWT tokens)                                 │
│  ├── Real-time Subscriptions                                   │
│  └── Row Level Security (RLS)                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Setup Steps

### 1. Install Dependencies

```bash
# Install project dependencies
npm install

# Install Netlify CLI globally (for local development)
npm install -g netlify-cli
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# JWT Configuration (for custom auth if needed)
JWT_SECRET=your-secret-key-change-in-production

# AI Coaching (Groq - FREE tier: 14,400 requests/day)
# Get your key at: https://console.groq.com/
GROQ_API_KEY=gsk_your_groq_api_key_here

# Optional: Weather API
OPENWEATHERMAP_API_KEY=your-weather-api-key
```

### 3. Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_KEY`

### 4. Start Local Development

```bash
# Start Netlify Dev (serves Angular + Functions locally)
netlify dev

# Or use npm script
npm run dev
```

This will start:
- **Frontend**: `http://localhost:8888`
- **Functions**: `http://localhost:8888/.netlify/functions/*`
- **API Routes**: `http://localhost:8888/api/*` (redirected to functions)

### 5. Test the API

```bash
# Health check
curl http://localhost:8888/api/health

# Should return:
# {"success":true,"data":{"status":"healthy","timestamp":"..."}}
```

---

## Netlify Functions Structure

All backend functions are in `/netlify/functions/`:

```
netlify/functions/
├── utils/                          # Shared utilities
│   ├── base-handler.cjs            # Standardized handler pattern
│   ├── error-handler.cjs           # Error response utilities
│   ├── auth-helper.cjs             # Auth verification
│   ├── rate-limiter.cjs            # Rate limiting
│   ├── ai-safety-classifier.cjs    # AI safety tiers
│   └── groq-client.cjs             # Groq LLM client
├── health.cjs                      # Health check
├── dashboard.cjs                   # Dashboard data
├── auth-login.cjs                  # Login endpoint
├── auth-me.cjs                     # Token verification
├── ai-chat.cjs                     # AI coaching
├── load-management.cjs             # ACWR, monotony, TSB
├── training-programs.cjs           # Training programs
├── nutrition.cjs                   # Nutrition tracking
├── recovery.cjs                    # Recovery protocols
└── ... (80 total functions)
```

### Base Handler Pattern

All functions use a standardized `baseHandler`:

```javascript
const { baseHandler } = require('./utils/base-handler.cjs');
const { createSuccessResponse, createErrorResponse } = require('./utils/error-handler.cjs');

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: 'my-function',
    allowedMethods: ['GET', 'POST'],
    rateLimitType: 'READ',  // READ, CREATE, UPDATE, DELETE
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      // Your function logic here
      return createSuccessResponse({ data: 'example' });
    }
  });
};
```

---

## API Endpoints

### Core Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check |
| GET | `/api/api-docs` | No | API documentation |

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login with credentials |
| POST | `/api/auth/reset-password` | No | Request password reset |
| GET | `/auth-me` | Yes | Verify token and get user |

### AI Coaching

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/chat` | Yes | AI chat with safety tiers |
| POST | `/api/ai/feedback` | Yes | Submit feedback on AI |

### Load Management

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/load-management` | Yes | Overview (ACWR, monotony, TSB) |
| GET | `/api/load-management/acwr` | Yes | ACWR calculation |
| GET | `/api/load-management/injury-risk` | Yes | Composite injury risk |

See [API.md](./API.md) for the complete API reference.

---

## Security Features

### 1. JWT Authentication

All protected endpoints verify JWT tokens from Supabase Auth:

```javascript
// In base-handler.cjs
const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) {
  return createErrorResponse('Unauthorized', 401, 'unauthorized');
}
```

### 2. Rate Limiting

| Tier | Requests | Window | Endpoints |
|------|----------|--------|-----------|
| READ | 100 | 1 minute | GET requests |
| CREATE | 20 | 1 minute | POST requests |
| UPDATE | 30 | 1 minute | PUT/PATCH requests |
| DELETE | 10 | 1 minute | DELETE requests |

### 3. Row Level Security (RLS)

All database access is protected by Supabase RLS policies:

```sql
-- Users can only access their own data
CREATE POLICY "Users can view own data" ON training_sessions
  FOR SELECT USING (auth.uid() = user_id);
```

### 4. AI Safety Tiers

AI responses are classified into safety tiers:

- **Tier 1 (Low)**: technique, warm-up, drills
- **Tier 2 (Medium)**: injury, recovery, pain
- **Tier 3 (High)**: supplements, dosage, medical

---

## Development Workflow

### Creating a New Function

1. Create file in `/netlify/functions/`:

```javascript
// netlify/functions/my-function.cjs
const { baseHandler } = require('./utils/base-handler.cjs');
const { createSuccessResponse } = require('./utils/error-handler.cjs');
const { supabaseAdmin } = require('./supabase-client.cjs');

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: 'my-function',
    allowedMethods: ['GET'],
    rateLimitType: 'READ',
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const { data, error } = await supabaseAdmin
        .from('my_table')
        .select('*')
        .eq('user_id', userId);
      
      if (error) throw error;
      return createSuccessResponse(data);
    }
  });
};
```

2. Add redirect in `netlify.toml`:

```toml
[[redirects]]
  from = "/api/my-function"
  to = "/.netlify/functions/my-function"
  status = 200
  force = true
```

3. Test locally:

```bash
curl http://localhost:8888/api/my-function \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Production Deployment

### Netlify Configuration

The `netlify.toml` file configures:

1. **Build command**: `cd angular && npm ci && npm run build`
2. **Publish directory**: `angular/dist/flagfit-pro/browser`
3. **API redirects**: `/api/*` → `/.netlify/functions/*`
4. **Security headers**: CSP, HSTS, X-Frame-Options

### Environment Variables

Set in Netlify UI (**Site Settings** → **Environment Variables**):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
GROQ_API_KEY=gsk_your_groq_api_key
JWT_SECRET=your-production-secret
```

### Deploy

```bash
# Deploy to Netlify
netlify deploy --prod

# Or push to main branch (auto-deploys via Netlify CI)
git push origin main
```

---

## Troubleshooting

### Common Issues

1. **Function Not Found (404)**
   - Check redirect in `netlify.toml`
   - Ensure function file has `.cjs` extension
   - Verify `exports.handler` is defined

2. **Unauthorized (401)**
   - Check JWT token is valid
   - Verify `SUPABASE_ANON_KEY` is set
   - Check token hasn't expired

3. **Database Errors**
   - Verify `SUPABASE_SERVICE_KEY` is set
   - Check RLS policies allow the operation
   - Ensure table exists in database

4. **CORS Errors**
   - CORS is handled by Netlify automatically
   - For custom origins, update function headers

### Debug Mode

Enable verbose logging:

```bash
# Local development with debug
DEBUG=* netlify dev
```

Check function logs in Netlify UI: **Functions** → **Select function** → **Logs**

---

## Related Documentation

- [API.md](./API.md) - Complete API reference
- [AUTHENTICATION_PATTERN.md](./AUTHENTICATION_PATTERN.md) - Auth architecture
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database configuration
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [RLS_POLICY_SPECIFICATION.md](./RLS_POLICY_SPECIFICATION.md) - Row Level Security

---

## Changelog

- **v2.0 (2025-12)**: Rewrote for Netlify Functions architecture
- **v1.0 (2025-01)**: Initial Express.js guide (deprecated)

---

Your backend is now ready! All 80 Netlify Functions are configured and deployed with Supabase integration.
