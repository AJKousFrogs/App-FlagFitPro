# Release Notes — v11.0.0 (baseline)

**v11.0.0 is the unified version baseline. Everything goes forward from v11.**

## Why v11
The repo carried two conflicting version schemes at once: a product release line at
**v4.0.0** (`package.json`, release notes) and an architecture line labelled **v10**
(`ARCHITECTURE_v10`, "v10 spine", "v10 contract"). Two numbers for one product is exactly
the kind of ambiguity that breeds confusion. **v11 supersedes both** — one number past the
higher of the two — and is justified by the scope of change below (a genuine major version).

## What v11 encompasses
- **Static-first front-end rebuild (in progress).** The entire Angular UI layer was demolished
  (recoverable from tag `pre-rebuild-main`); the rebuild proceeds wireframes → static design
  system → port, on top of a clean engine. The business engine (services, schedule spine,
  prescription) was kept.
- **Backend / Supabase consolidation.** 28 tables + 2 consent views + 8 functions removed across
  12+ migration phases; one canonical home per domain (hydration, wellness, training/sessions,
  ACWR/load); broken stored functions repaired; trigger functions un-exposed from RPC. Governed
  by `DATA_MODEL.md`.
- **State-of-the-art ACWR.** Single EWMA + uncoupled implementation (`netlify/functions/utils/acwr.js`),
  replacing 4 divergent ones.
- **Engine contract.** `ENGINE_CONTRACT.md` pins the input → derived → prescription pipeline,
  the multi-team schedule spine, and the Roles / Authority / Consent model.
- **Identity convention.** `user_id` (= `auth.uid()`) standard for athlete-owned data, with
  "athlete-owned, staff-authored" authorship (`ATHLETE_ID_CONVENTION.md`).

## Versioning rule going forward
- `package.json` (root + `angular/`) is the single source of version truth: **11.0.0**.
- Architecture docs use the **v11** label (`ARCHITECTURE_v11.md`); the "v10" label is retired.
- Pre-v11 release notes (`RELEASE_NOTES_1.x`–`4.0.0`) are retained as **history**.
