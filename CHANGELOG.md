# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Security

#### Supabase Database Linter Warnings Fixed (2026-01-09)

**Issues Resolved**: Fixed 4 security warnings identified by Supabase Database Linter.

**What Was Fixed**:
1. **Function Search Path Mutability** (2 functions):
   - Added `SET search_path = public` to `cleanup_expired_notifications` and `send_notification`
   - Prevents search path manipulation attacks on SECURITY DEFINER functions
2. **Overly Permissive RLS Policy**:
   - Replaced `WITH CHECK (true)` on `player_activity_tracking` table
   - Now requires: service role OR authenticated user inserting own record
3. **Auth Password Protection** (documented):
   - Added manual configuration steps for enabling leaked password protection
   - Requires Supabase Dashboard configuration (cannot be fixed via SQL)

**Security Improvements**:
- Function calls now use fixed schema search paths
- RLS policies follow least privilege principle
- Better protection against search path injection attacks
- Documented password security enhancement process

**Files Changed**:
- `supabase/migrations/20260109_fix_security_linter_warnings.sql` — Migration to fix 3 SQL issues
- `docs/SECURITY_LINTER_FIXES.md` — Detailed documentation of all issues and fixes
- `SECURITY_LINTER_FIXES_README.md` — Quick reference guide

**Verification**:
- Functions now have `search_path=public` in configuration
- No `WITH CHECK (true)` policies remain on INSERT operations
- All triggers continue to work (tested via service role)

**Reference**: [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)

### Fixed

#### PROMPT 2.19 — Excluded Athlete Override Bug (2026-01-07)

**Breach Resolved**: Excluded athletes were incorrectly receiving `flag_practice` or `film_room` overrides when they should receive `null`.

**Root Cause**: The override computation logic in `daily-protocol.cjs` was setting `sessionResolution.override` based on team activity type without checking the athlete's participation status.

**Fix Applied**:
1. Added centralized `computeOverride()` function with strict priority order:
   - `rehab_protocol > coach_alert > weather_override > teamActivity (only if NOT excluded) > taper > null`
2. Excluded athletes (`participation === 'excluded'`) now correctly receive `override: null`
3. Removed duplicate `override` field from `confidenceMetadata.sessionResolution` (single source of truth)
4. Added 11 unit tests in `netlify/functions/utils/compute-override.spec.cjs`

**Verification**:
- Production curl test confirmed: Athlete Y with `participation: "excluded"` now receives `sessionResolution.override: null`
- All 11 unit tests pass
- Consistency sweep confirms no legacy override patterns remain

**Files Changed**:
- `netlify/functions/daily-protocol.cjs` — Added `computeOverride()`, updated override logic
- `netlify/functions/utils/compute-override.spec.cjs` — New test file (11 tests)
- `docs/contracts/PROOF_PROMPT_2_12_AUTHORITY_SOT_FINAL_v1.md` — Updated with fix verification
- `docs/contracts/PROOF_PROMPT_2_19_CONSISTENCY_SWEEP.md` — New evidence document

