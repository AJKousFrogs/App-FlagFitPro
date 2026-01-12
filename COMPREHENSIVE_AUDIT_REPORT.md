# Comprehensive Audit Report - January 2026

## 1. Database/Frontend Wiring ✅

### Status: CORRECT
- Frontend uses `SUPABASE_ANON_KEY` correctly
- Backend uses `SUPABASE_SERVICE_ROLE_KEY` correctly (fixed in previous session)
- No cross-contamination between keys

### Issues Found:
- Multiple environment variable naming conventions (`SUPABASE_URL` vs `VITE_SUPABASE_URL`)
- No single source of truth documented

### Recommendations:
- Use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as primary names (Angular convention)
- Keep `SUPABASE_URL` and `SUPABASE_ANON_KEY` as aliases for backward compatibility
- Document in README that Netlify UI is the single source of truth

---

## 2. Auth Interceptor Supabase Initialization ✅

### Status: CORRECT
**File**: `angular/src/app/core/interceptors/auth.interceptor.ts`

**Findings**:
- ✅ Line 16: `supabaseService.waitForInit()` called for Supabase REST API requests
- ✅ Line 56: `supabaseService.waitForInit()` called for regular API endpoints
- ✅ Both paths properly await initialization before retrieving tokens

**Conclusion**: All auth interceptors correctly wait for Supabase initialization. No issues found.

---

## 3. Responsive Design Issues ⚠️

### Status: NEEDS VERIFICATION

**Files Audited**:
- `angular/src/index.html` - Viewport meta tag present ✅
- `angular/src/styles/_mobile-responsive.scss` - Comprehensive mobile styles ✅
- `angular/src/assets/styles/layout-system.scss` - Safari fixes present ✅

**Viewport Configuration**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover" />
```

**Mobile Breakpoints Defined**:
- xs: 0-479px (Small phones)
- sm: 480-639px (Phones)
- md: 640-767px (Large phones)
- lg: 768-1023px (Tablets)
- xl: 1024px+ (Desktop)

**Device-Specific Mixins**:
- `@mixin samsung-standard` (max-width: 412px) ✅
- `@mixin iphone-standard` (max-width: 414px) ✅
- `@mixin iphone-pro-max` (max-width: 430px) ✅

**Safari Fixes**:
- `min-height: -webkit-fill-available` ✅
- `min-height: 100dvh` ✅
- `-webkit-overflow-scrolling: touch` ✅

**Potential Issues**:
1. **Google Pixel 10**: No specific breakpoint (uses standard 430px max-width)
2. **Safari iOS**: Viewport meta tag allows `maximum-scale=5` which may cause zoom issues
3. **Input font-size**: Set to 16px to prevent iOS zoom ✅

**Recommendations**:
- Test on actual devices (Pixel 10, iPhone models, Samsung models)
- Consider adding Pixel-specific breakpoint if needed
- Review `maximum-scale=5` - may want to reduce to `maximum-scale=3`

---

## 4. Team Page Player Visibility Issue 🔴

### Status: IDENTIFIED ROOT CAUSE

**Problem**: Only 2 players visible (Aljoša Kous, João Maioto) when database shows 4 players

**Root Causes**:

1. **RLS Policy Filtering by Team**:
   - Players belong to different teams:
     - Team `97cd0cdd-7f38-4214-a4f5-14b4c6c3c36b`: João Maioto, Aljosa Kous, one null user
     - Team `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`: AJ Kous
   - Query filters by current user's team_id (line 220), so only players from that team show

2. **Missing User Record Filter**:
   - Line 853: `.filter((m) => m.users)` excludes players without user records
   - One player has `user_id` but no matching user record (null email/name)
   - This player is filtered out

3. **RLS Policy `users_select_for_roster`**:
   - Policy: `(id = auth.uid()) OR users_share_team(auth.uid(), id) OR is_coach_of_athlete(auth.uid(), id)`
   - If `users_share_team()` function doesn't work correctly, users from same team may not be visible

**Fix Required**:
1. Check `users_share_team()` function implementation
2. Verify RLS policies allow team members to see each other
3. Consider showing players without user records (with placeholder data)
4. Add logging to debug RLS filtering

---

## 5. Environment Variables Consolidation ⚠️

### Current State:
- **Netlify UI**: Primary source (production)
- **netlify.toml**: Fallback with hardcoded values
- **angular/src/environments/environment.ts**: Development defaults
- **scripts/inject-env-into-html-angular.js**: Build-time injection

### Issues:
1. Hardcoded values in `netlify.toml` (lines 21-22)
2. Multiple naming conventions across files
3. No clear documentation of required variables

### Recommendations:
1. Remove hardcoded values from `netlify.toml` (use Netlify UI only)
2. Standardize on `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Document required variables in README
4. Add validation script to check all required variables are set

---

## Summary of Actions Required

### High Priority:
1. ✅ Fix backend auth middleware (already done)
2. 🔴 Investigate team page player visibility (RLS policies)
3. ⚠️ Consolidate environment variables

### Medium Priority:
4. ⚠️ Test responsive design on actual devices
5. ⚠️ Review viewport meta tag settings

### Low Priority:
6. ⚠️ Add Pixel 10 specific breakpoint if needed
7. ⚠️ Document environment variable setup
