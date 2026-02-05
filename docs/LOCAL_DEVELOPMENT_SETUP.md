# Local Development Setup

**Version:** 3.0  
**Last Updated:** January 2026  
**Stack:** Angular 21 + PrimeNG 21 + Supabase + Netlify Functions

---

## Prerequisites

| Requirement | Version    | Check Command       |
| ----------- | ---------- | ------------------- |
| Node.js     | ≥ 22.0.0   | `node --version`    |
| npm/pnpm    | ≥ 10.0.0   | `npm --version`     |
| Angular CLI | 21.x       | `ng version`        |
| Git         | Any recent | `git --version`     |
| Netlify CLI | Latest     | `netlify --version` |

---

## Quick Start (5 Minutes)

### 1. Clone & Install

```bash
# Clone repository
git clone <your-repo-url>
cd "Flag football HTML - APP"

# Install root dependencies
npm install

# Install Angular dependencies (uses pnpm)
cd angular
npx pnpm install
cd ..

# Install Netlify CLI globally
npm install -g netlify-cli
```

> **Note:** The Angular folder uses **pnpm** as its package manager. If you don't have pnpm installed globally, you can use `npx pnpm install` which will download and run pnpm automatically.

### 2. Configure Environment

Create `.env` file in project root:

```env
# Supabase (Required)
SUPABASE_URL=https://grfjmnjpzvknmsxrwesx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDI4OTksImV4cCI6MjA4NTA3ODg5OX0.63Do5rUEHBT7-pZEXzFFHB5LqFRaXWAt-YrH2v45vo0
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwMjg5OSwiZXhwIjoyMDg1MDc4ODk5fQ.GIETcsbB9U_CRoeOhONwykUgMWzdWdU--QuyDr2BPaw

# AI Chat - Groq (Required for AI Coach)
# Get free key at: https://console.groq.com/
# Free tier: 14,400 requests/day
GROQ_API_KEY=gsk_your_groq_api_key

# Weather - Open-Meteo (No key required)
# Using https://open-meteo.com - free, open-source, no API key needed
# Weather endpoints work automatically

# JWT (for custom auth if needed)
JWT_SECRET=your-secret-key-change-in-production
```

Create `angular/.env` for frontend:

```env
# Frontend environment (used by Angular)
NG_APP_SUPABASE_URL=https://grfjmnjpzvknmsxrwesx.supabase.co
NG_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDI4OTksImV4cCI6MjA4NTA3ODg5OX0.63Do5rUEHBT7-pZEXzFFHB5LqFRaXWAt-YrH2v45vo0
```

### 3. Start Development Server

```bash
# Option A: Full stack (Angular + Netlify Functions)
netlify dev

# Option B: Angular only (no backend functions)
cd angular && ng serve
```

**Access URLs:**

- **Full Stack (Netlify Dev):** `http://localhost:8888`
- **Angular Only:** `http://localhost:4200`
- **API Functions:** `http://localhost:8888/api/*`

---

## Getting API Credentials

### Supabase (Database & Auth)

1. Go to [supabase.com](https://supabase.com) and create a project
2. Navigate to **Settings** → **API**
3. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_KEY`

### Groq (AI Coach)

1. Go to [console.groq.com](https://console.groq.com/)
2. Create free account
3. Generate API key → `GROQ_API_KEY`
4. **Free tier:** 14,400 requests/day (sufficient for development)

### Open-Meteo (Weather)

**No API key required!** Open-Meteo is free and open-source.

```bash
# Example API call (works immediately)
curl "https://api.open-meteo.com/v1/forecast?latitude=46.05&longitude=14.51&current=temperature_2m,wind_speed_10m"
```

Features:

- 16-day weather forecasts
- 80+ years historical data
- 1-11 km resolution
- Hourly updates
- No rate limits for reasonable use

---

## Project Structure

```
Flag football HTML - APP/
├── angular/                    # Angular 21 Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/          # Services, guards, interceptors
│   │   │   ├── features/      # Feature components (49 features)
│   │   │   └── shared/        # Shared components
│   │   ├── assets/
│   │   └── environments/
│   ├── angular.json
│   └── package.json
│
├── netlify/                    # Netlify Functions (Backend API)
│   └── functions/
│       ├── utils/             # Shared utilities
│       ├── ai-chat.cjs        # AI Coach endpoint
│       ├── load-management.cjs # ACWR calculations
│       └── ... (80+ functions)
│
├── database/                   # SQL migrations
│   └── migrations/
│
├── docs/                       # Documentation
│   └── FEATURE_DOCUMENTATION.md  # Source of truth
│
├── supabase/                   # Supabase config & edge functions
├── netlify.toml                # Netlify configuration
├── package.json                # Root dependencies
└── .env                        # Environment variables (create this)
```

---

## Development Commands

### Angular Frontend

```bash
cd angular

# Start dev server (port 4200)
ng serve

# Build for production
ng build

# Run linter
ng lint

# Run tests
ng test
```

### Full Stack (with Netlify Functions)

```bash
# Start everything (recommended)
netlify dev

# This starts:
# - Angular dev server
# - Netlify Functions locally
# - Proxy for /api/* routes
```

### Database

```bash
# Run migrations (requires Supabase CLI)
supabase db push

# Generate TypeScript types from schema
supabase gen types typescript --local > supabase-types.ts

Note: `supabase-types.ts` is not tracked in git. Generate it locally when
you need up-to-date types.
```

---

## Verify Setup

### 1. Health Check

```bash
# With netlify dev running:
curl http://localhost:8888/api/health

# Expected response:
# {"success":true,"data":{"status":"healthy","timestamp":"..."}}
```

### 2. Angular Build

```bash
cd angular
ng build

# Should complete without errors
# Output in: angular/dist/flagfit-pro/browser/
```

### 3. Database Connection

```bash
# In Supabase SQL Editor, run:
SELECT COUNT(*) FROM positions;

# Expected: 7 (or your seeded count)
```

---

## Common Issues & Solutions

### Port Already in Use

```bash
# Kill process on port 4200
lsof -ti:4200 | xargs kill -9

# Kill process on port 8888
lsof -ti:8888 | xargs kill -9
```

### Angular CLI Not Found

```bash
npm install -g @angular/cli@21
```

### Netlify Functions 404

1. Check `netlify.toml` has correct redirect
2. Ensure function file has `.cjs` extension
3. Verify `exports.handler` is defined

### Supabase Connection Error

1. Verify `.env` file exists in project root
2. Check `SUPABASE_URL` format: `https://xxx.supabase.co`
3. Ensure keys are correct (no extra spaces)

### CORS Errors

CORS is handled automatically by Netlify Dev. If issues persist:

1. Restart `netlify dev`
2. Clear browser cache
3. Check no duplicate servers running

---

## Environment Files Reference

### Root `.env` (Backend)

```env
# Required
SUPABASE_URL=https://grfjmnjpzvknmsxrwesx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDI4OTksImV4cCI6MjA4NTA3ODg5OX0.63Do5rUEHBT7-pZEXzFFHB5LqFRaXWAt-YrH2v45vo0
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwMjg5OSwiZXhwIjoyMDg1MDc4ODk5fQ.GIETcsbB9U_CRoeOhONwykUgMWzdWdU--QuyDr2BPaw

# AI Coach
GROQ_API_KEY=gsk_...

# Optional
JWT_SECRET=your-secret
NODE_ENV=development
```

### Angular Environment

Located at `angular/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabaseUrl: "https://xxx.supabase.co",
  supabaseAnonKey: "eyJ...",
  apiUrl: "http://localhost:8888/api",
};
```

---

## Next Steps After Setup

1. **Verify all features work:** Navigate through the app
2. **Check database:** Ensure tables are populated
3. **Test AI Coach:** Try the chat feature (requires Groq key)
4. **Review docs:** Read `FEATURE_DOCUMENTATION.md` for all 49 features

---

## External Services Summary

| Service                              | Purpose                  | Key Required | Free Tier                       |
| ------------------------------------ | ------------------------ | ------------ | ------------------------------- |
| [Supabase](https://supabase.com)     | Database, Auth, Realtime | Yes          | 500MB DB, 50K auth users        |
| [Groq](https://console.groq.com)     | AI Coach (LLM)           | Yes          | 14,400 req/day                  |
| [Open-Meteo](https://open-meteo.com) | Weather API              | No           | Unlimited (fair use)            |
| [Netlify](https://netlify.com)       | Hosting, Functions       | No           | 100GB bandwidth, 125K functions |
| [GitHub](https://github.com)         | Version Control          | No           | Unlimited                       |

---

## Tech Stack Reference

| Layer            | Technology           | Version  |
| ---------------- | -------------------- | -------- |
| Frontend         | Angular              | 21.x     |
| UI Components    | PrimeNG              | 21.x     |
| State Management | Angular Signals      | Built-in |
| Styling          | SCSS + CSS Variables | -        |
| Backend          | Netlify Functions    | Node.js  |
| Database         | Supabase PostgreSQL  | -        |
| Auth             | Supabase Auth        | -        |
| AI               | Groq (Llama 3.1 70B) | -        |
| Weather          | Open-Meteo           | -        |
| Deployment       | Netlify              | -        |

---

**Ready to develop!** Run `netlify dev` and open `http://localhost:8888` 🚀
