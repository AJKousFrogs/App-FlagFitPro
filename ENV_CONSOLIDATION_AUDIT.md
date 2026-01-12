# Environment Variables Consolidation Audit

## Current State Analysis

### Frontend (Angular)
- **Source**: `angular/src/environments/environment.ts` and `environment.prod.ts`
- **Variables Used**:
  - `SUPABASE_URL` / `VITE_SUPABASE_URL`
  - `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`
- **Injection**: Via `window._env` in `index.html` (injected by `scripts/inject-env-into-html-angular.js`)

### Backend (Express Routes)
- **Source**: `routes/middleware/auth.middleware.js`
- **Variables Used**:
  - `SUPABASE_URL` / `VITE_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SERVICE_KEY` (CRITICAL: Must NOT use ANON_KEY)

### Netlify Functions
- **Source**: `netlify/functions/supabase-client.cjs`
- **Variables Used**:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY` (for admin operations)
  - `SUPABASE_ANON_KEY` (for regular operations)

### Netlify Build Config
- **Source**: `netlify.toml` (build.environment section)
- **Variables Set**:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

## Issues Found

1. **Multiple naming conventions**: `SUPABASE_URL` vs `VITE_SUPABASE_URL`
2. **Backend fallback to ANON_KEY**: Fixed in `routes/middleware/auth.middleware.js`
3. **No single source of truth**: Variables scattered across multiple files

## Recommended Single Source of Truth

### Netlify Environment Variables (Primary Source)
Set these in Netlify UI → Site Settings → Environment Variables:

**Required for all contexts:**
- `SUPABASE_URL` (primary name)
- `VITE_SUPABASE_URL` (alias for Angular build)
- `SUPABASE_ANON_KEY` (primary name)
- `VITE_SUPABASE_ANON_KEY` (alias for Angular build)
- `SUPABASE_SERVICE_ROLE_KEY` (backend only - NEVER expose to frontend)

### Fallback Chain
1. Netlify Environment Variables (production)
2. `netlify.toml` build.environment (fallback)
3. `angular/src/environments/environment.ts` defaults (development only)

## Action Items

1. ✅ Remove ANON_KEY fallback from backend middleware
2. ⚠️ Consolidate variable names in `netlify.toml`
3. ⚠️ Update all scripts to use consistent naming
4. ⚠️ Document required variables in README
