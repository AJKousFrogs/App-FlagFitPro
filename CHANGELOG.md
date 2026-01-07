# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

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

