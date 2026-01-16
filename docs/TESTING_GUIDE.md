# Testing Guide - FlagFit Pro

A cross-platform guide for setting up and testing the Angular frontend with API connections.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Running the Application](#running-the-application)
4. [Sanity Checks](#sanity-checks)
5. [Testing API Connections](#testing-api-connections)
6. [Unit & E2E Tests](#unit--e2e-tests)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version    | Check Command    |
| -------- | ---------- | ---------------- |
| Node.js  | ≥ 22.0.0   | `node --version` |
| npm      | ≥ 10.0.0   | `npm --version`  |
| Git      | Any recent | `git --version`  |

### Optional (for full stack testing)

| Software     | Purpose               | Install                |
| ------------ | --------------------- | ---------------------- |
| Netlify CLI  | Run functions locally | `npm i -g netlify-cli` |
| Supabase CLI | Database management   | `npm i -g supabase`    |
| curl / wget  | API testing           | Usually pre-installed  |

### Platform-Specific Notes

**macOS:**

```bash
# Install Node.js via Homebrew
brew install node@22
```

**Linux (Ubuntu/Debian):**

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Windows:**

```powershell
# Install Node.js via winget
winget install OpenJS.NodeJS.LTS

# Or download from https://nodejs.org
```

---

## Environment Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd app-new-flag

# Install root dependencies (for Netlify functions)
npm install

# Install Angular dependencies (uses pnpm)
cd angular
npx pnpm install
```

> **Note:** The Angular folder uses **pnpm** as its package manager (`packageManager: "pnpm@10.28.0"` in package.json). Use `npx pnpm install` if you don't have pnpm installed globally.

### 2. Environment Variables

Create environment files based on the examples below.

#### `.env.example` (Root - for Netlify Functions)

Create a `.env` file in the project root with these variables:

```bash
# =============================================================================
# SUPABASE CONFIGURATION
# =============================================================================
# Get these from: https://supabase.com/dashboard/project/_/settings/api

# Public URL (safe to expose)
SUPABASE_URL=https://your-project-ref.supabase.co

# Anon/Public key (safe to expose - limited by RLS)
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role key (NEVER expose in frontend - full database access)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# =============================================================================
# JWT CONFIGURATION
# =============================================================================
# Used for token verification in Netlify functions
JWT_SECRET=your-supabase-jwt-secret

# =============================================================================
# OPTIONAL: RATE LIMITING
# =============================================================================
# Override default rate limits (requests per minute)
# RATE_LIMIT_AUTH_MAX=5
# RATE_LIMIT_READ_MAX=200
# RATE_LIMIT_CREATE_MAX=50

# =============================================================================
# OPTIONAL: ERROR TRACKING
# =============================================================================
# VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
# VITE_ENABLE_SENTRY=true
```

#### Angular Environment (Already Configured)

The Angular app uses `angular/src/environments/environment.ts` which supports runtime injection via `window._env`. For local development, the defaults work out of the box.

To override at runtime, set these in your shell before running:

```bash
# macOS/Linux
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# Windows (PowerShell)
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_ANON_KEY="your-anon-key"

# Windows (CMD)
set SUPABASE_URL=https://your-project.supabase.co
set SUPABASE_ANON_KEY=your-anon-key
```

### 3. Common Environment Variables

| Variable               | Required     | Description              | Where to Find              |
| ---------------------- | ------------ | ------------------------ | -------------------------- |
| `SUPABASE_URL`         | Yes          | Supabase project URL     | Dashboard → Settings → API |
| `SUPABASE_ANON_KEY`    | Yes          | Public API key           | Dashboard → Settings → API |
| `SUPABASE_SERVICE_KEY` | Backend only | Service role key (admin) | Dashboard → Settings → API |
| `JWT_SECRET`           | Backend only | JWT signing secret       | Dashboard → Settings → API |
| `VITE_SENTRY_DSN`      | No           | Sentry error tracking    | Sentry dashboard           |

---

## Running the Application

### Option A: Angular Frontend Only (Mock API) - DEVELOPMENT ONLY

⚠️ **WARNING: Mock data is ONLY for local development and testing. NEVER use mock data in production.**

```bash
cd angular
npm start
```

- **URL:** http://localhost:4200
- **API Mode:** Uses mock data (no backend required)
- **⚠️ Development Only:** This mode is for testing UI only. Mock data must NEVER be used in production builds or shown to real users. See [DATA_SAFETY_POLICY.md](./DATA_SAFETY_POLICY.md) for critical safety information.

### Option B: Full Stack with Netlify Dev

```bash
# From project root
netlify dev
```

- **Frontend:** http://localhost:8888
- **Functions:** http://localhost:8888/.netlify/functions/\*
- **Supabase:** Connected (requires `.env`)

### Option C: Angular + Separate Backend

**Terminal 1 - Backend:**

```bash
# From project root
node server.js
```

**Terminal 2 - Frontend:**

```bash
cd angular
npm start
```

- **Frontend:** http://localhost:4200
- **Backend:** http://localhost:3001

---

## Sanity Checks

Run these checks to verify your setup is working correctly.

### ✅ Check 1: Health Endpoint

Verify the API is responding:

```bash
# If using Netlify Dev (port 8888)
curl http://localhost:8888/.netlify/functions/health

# If using standalone backend (port 3001)
curl http://localhost:3001/api/health
```

**Expected Response:**

```json
{
  "status": "OK",
  "message": "Flag Football Training App Server is running",
  "timestamp": "2024-..."
}
```

**Troubleshooting:**

- `Connection refused` → Backend not running
- `404 Not Found` → Wrong port or path
- `500 Error` → Check backend logs

### ✅ Check 2: Frontend Build

Verify Angular compiles without errors:

```bash
cd angular
npm run build
```

**Expected:** Build completes with no errors. Warnings are acceptable.

**Troubleshooting:**

- TypeScript errors → Check for missing dependencies
- Memory errors → Increase Node memory: `NODE_OPTIONS=--max-old-space-size=4096 npm run build`

### ✅ Check 3: Login Flow

1. Open http://localhost:4200 (or :8888 with Netlify Dev)
2. Navigate to `/login`
3. Enter test credentials:
   - Email: `test@example.com`
   - Password: `testpassword123`
4. Verify redirect to `/dashboard`

**Expected:** Successful login, dashboard loads with data.

**Troubleshooting:**

- "Invalid credentials" → Check Supabase has test user
- Network errors → Check CORS settings
- Blank dashboard → Check API responses in DevTools

### ✅ Check 4: Supabase Connection

Verify Supabase is reachable:

```bash
# Test from browser console (after app loads)
# Open DevTools → Console, paste:
const { data, error } = await supabase.from('users').select('id').limit(1);
console.log({ data, error });
```

**Expected:** Returns data or RLS-based empty array (not an error).

---

## Testing API Connections

### Test Authentication Endpoint

```bash
# Get current user (requires valid session)
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Test User",
    "role": "player"
  }
}
```

### Test Login Endpoint

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

**Expected:**

```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": { "id": "1", "email": "test@example.com" }
  }
}
```

### Available API Endpoints

| Endpoint             | Description        |
| -------------------- | ------------------ |
| `/api/health`        | Health check       |
| `/api/auth/*`        | Authentication     |
| `/api/dashboard/*`   | Dashboard data     |
| `/api/training/*`    | Training sessions  |
| `/api/analytics/*`   | Analytics data     |
| `/api/tournaments/*` | Tournament data    |
| `/api/community/*`   | Community features |
| `/api/wellness/*`    | Wellness tracking  |
| `/api/coach/*`       | Coach dashboard    |

---

## Unit & E2E Tests

### Unit Tests (Vitest)

```bash
cd angular

# Run all tests
npm test

# Run with watch mode
npm run test:watch

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
cd angular

# Install browsers (first time only)
npx playwright install

# Run all E2E tests
npm run e2e

# Run with UI mode
npm run e2e:ui

# Run headed (see browser)
npm run e2e:headed
```

### Test Configuration Files

| File                           | Purpose                 |
| ------------------------------ | ----------------------- |
| `angular/vitest.config.ts`     | Unit test configuration |
| `angular/playwright.config.ts` | E2E test configuration  |
| `angular/e2e/`                 | E2E test files          |

---

## Troubleshooting

### Backend Not Responding

```bash
# Check if port is in use
# macOS/Linux
lsof -ti:3001

# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 3001

# Kill process on port (macOS/Linux)
kill $(lsof -ti:3001)

# Kill process on port (Windows)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess
```

### Angular Not Compiling

```bash
# Clear cache and reinstall
cd angular
rm -rf node_modules .angular
npm install
npm start
```

### CORS Errors

1. Check browser console for specific error
2. Verify backend has CORS enabled
3. Ensure request origin matches allowed origins
4. For Netlify Dev, use port 8888 (handles CORS automatically)

### API Connection Errors

1. Verify backend is running:
   ```bash
   curl http://localhost:3001/api/health
   ```
2. Check Angular environment:
   ```
   angular/src/environments/environment.ts
   ```
3. Verify API service configuration:
   ```
   angular/src/app/core/services/api.service.ts
   ```

### Port Already in Use

```bash
# Find and kill process on port 4200
# macOS/Linux
lsof -ti:4200 | xargs kill -9

# Windows (PowerShell)
Stop-Process -Id (Get-NetTCPConnection -LocalPort 4200).OwningProcess -Force
```

### Node Memory Issues

```bash
# Increase Node.js memory limit
# macOS/Linux
export NODE_OPTIONS="--max-old-space-size=4096"

# Windows (PowerShell)
$env:NODE_OPTIONS="--max-old-space-size=4096"

# Then run your command
npm run build
```

---

## Quick Reference

### Important URLs (Local Development)

| Service      | URL                              |
| ------------ | -------------------------------- |
| Angular App  | http://localhost:4200            |
| Netlify Dev  | http://localhost:8888            |
| Backend API  | http://localhost:3001            |
| Health Check | http://localhost:3001/api/health |

### API Response Format

All API endpoints return responses in this format:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

The Angular `ApiService` expects this format and handles it automatically.

### Useful Commands

```bash
# Start Angular dev server
cd angular && npm start

# Start Netlify Dev (full stack)
netlify dev

# Run unit tests
cd angular && npm test

# Run E2E tests
cd angular && npm run e2e

# Build for production
cd angular && npm run build

# Check bundle size
cd angular && npm run bundle:check
```

---

**Last Updated:** 29. December 2025  
**Tested On:** macOS, Ubuntu 22.04, Windows 11
