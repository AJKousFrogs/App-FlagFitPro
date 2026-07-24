# GPS Trackers, CSV Import & Wearable Sync — Audit & Proposal

**Status:** PROPOSAL — nothing below is built yet, except where explicitly noted as already
existing. Companion to `docs/payments_billing_and_data_retention_proposal.md` (that doc's §7 flags
"Wearable integrations" as a Team Package National feature and a Q2–Q3 2027 roadmap item — this
doc is the engineering detail behind that line).
**Date:** 2026-07-23

---

## 0. What already exists (audit findings)

The schema is more thoughtfully designed here than the payments audit found elsewhere — it
already cleanly separates two genuinely different device categories that get conflated in casual
conversation ("GPS trackers" and "Garmin/Apple Watch" are not the same product category, and the
schema already knows this):

| | GPS tracking **vests** (team-sports specific) | Consumer **wrist wearables** |
|---|---|---|
| Vendors | Catapult, STATSports | Garmin, Apple Watch, Oura, WHOOP, Polar |
| Table | `session_load` | `wearable_health` |
| Function | `session-load-import.js` | `wearable-health-ingest.js` |
| Shape | Vendor-specific columns (player load, HSR, sprint count, CoD, accel/decel bands, HR zones, IMA, jump count — this table is genuinely GPS-vest-shaped, matching real Catapult/STATSports export vocabulary) | Generic `(metric, value, unit, source)` — provider-agnostic by design |
| Working adapters | 2 of 2 relevant providers (`catapult`, `statsports`) — real, tested | 0 of 5 relevant providers — no real vendor connection exists |
| Consent | Gated via `callerWritableAthletes()` (self, or `sc_coach`/`physio` on the athlete's team) | Gated via `wearable_consent`, per-provider, athlete-owned (well-designed: PK is `(user_id, source)`, so granting Oura ≠ granting WHOOP) |

**The gap in both paths, though, is the same thing you're actually asking about: how does data
get INTO these tables in the first place, if not by an athlete typing one row at a time?**

- **CSV import doesn't exist anywhere in the codebase.** No CSV-parsing library is installed
  (`papaparse`, `csv-parse` — neither in root nor Angular `package.json`). Every CSV-related hit
  in the repo is data *export* (a hand-rolled `convertToCSV()` in `performance-data.js` for
  downloading your own measurements) — never import.
- **`session-load-import.js`, despite its name, is not a file-upload endpoint.** It's a JSON API:
  `POST { provider, rows: [...] }`, where `rows` must already be an array of parsed JS objects.
  Whatever produces that JSON — today, nothing — happens outside this codebase. There's no
  `multipart/form-data` handling, no CSV-text parser, anywhere in the function or its adapter
  layer (`utils/session-load-adapters.js`).
- **`device_pairings`** (the table that would let the system know "external athlete ID `12345` in
  Catapult's export = user X on our roster") has the right shape — `external_athlete_id`,
  `device_identifier`, `provider_id`, `is_active` — but **zero code anywhere writes to it**. It's
  read-only-consumed by `session-load-import.js` and otherwise empty. There is no UI, no endpoint,
  nothing that lets a coach actually create a pairing.
- **No real OAuth exists for any vendor.** Repo-wide search for `oauth`, `client_secret`,
  `redirect_uri`, webhook-signature verification: zero hits in `netlify/functions/`. `wearable-
  health-ingest.js` accepts a free-form `source` string with no vendor validation and a generic
  normalized reading shape — it's built to be *fed* by an adapter, not to *be* one.
- **`GET /api/wearables/status` returns hardcoded fake data** (`netlify/functions/wearables.js`)
  — a static array with every device `connected: false`, never touching `device_pairings` or
  `monitoring_providers` at all. Harmless today only because it happens to match reality (nothing
  really is connected), but it's not actually reading the DB.
- **The `/device-data` screen is honest about all of this** — it's manual-entry-only (distance,
  duration, top speed, player load, etc., typed in by the athlete), and its own copy says outright:
  *"Direct sync with these brands is on the roadmap — it needs each provider's approval, so it
  isn't live yet. Until then, log your session numbers manually above."* Good, accurate UI copy;
  the gap is entirely on the backend/integration side, not a case of the UI overclaiming.
- **`monitoring_providers` is a real, seeded 8-row registry** (`catapult`, `statsports`, `polar`,
  `garmin`, `whoop`, `oura`, `apple_health`, `manual`, each tagged `kind: external_load | wearable
  | both`) — the registry itself is in good shape and forward-looking; it's just mostly unused.
- **One material inconsistency to flag**: `docs/legal/BUSINESS_PLAN_SUBSCRIPTIONS.md` currently
  lists *"Wearable integration (Garmin, Apple Watch, Oura Ring)"* as a **current** Athlete Pro
  feature (line 98) while its own roadmap section separately schedules *"Wearable integrations"*
  as a **Q2–Q3 2027 premium add-on** (line 559-562). Right now, neither is built — the feature
  list oversells something that doesn't exist yet. This should be corrected before the tier
  feature list goes anywhere customer-facing, regardless of which build timeline is chosen.

---

## 1. CSV import — the quickest real win

This is the smallest gap to close because the hard part (validated ingestion, idempotent upsert,
per-provider adapters, athlete-writability checks) is already built and working for GPS-vest data.
What's missing is purely the "turn a CSV file into `rows: [...]`" step in front of it.

**Proposed: a thin, generic CSV→JSON bridge, not a new ingestion system.**

```
Coach uploads a .csv export from Catapult/STATSports/a spreadsheet
              │
              ▼
   POST /api/session-load-import/csv  (NEW — multipart/form-data)
   1. Parse CSV → array of row objects (header row = column names)
   2. Forward to the EXACT SAME internal logic session-load-import.js
      already uses (same adapters, same device_pairings lookup, same
      callerWritableAthletes() gate, same upsert/onConflict)
              │
              ▼
        session_load (unchanged)
```

- Add a CSV-parsing library (recommend `papaparse` — battle-tested, handles quoted fields/BOM/
  encoding edge cases that a hand-rolled `.split(',')` will get wrong on real vendor exports).
- New route accepts a file upload, parses to objects keyed by header row, and calls the *existing*
  `provider`-adapter dispatch — this is additive, not a rewrite; `POST /api/session-load-import`
  (JSON) keeps working unchanged for any caller that already produces JSON.
- Validation: reject files >N rows/size (prevent an accidental multi-MB dump from timing out a
  serverless function — chunked/batched insert if large files are a real use case), and surface
  the existing `failed[]` array (unpaired athlete, missing session id/timestamp) back to the coach
  as "row 14: no device pairing for external ID X" rather than a silent partial import.
- **This also directly fixes the raw "CSV numbers" case you asked about** — a coach with a
  spreadsheet of manually-recorded GPS numbers (no vendor export at all, just typed-up training
  log data) can use the same upload with a `provider: "manual"` adapter (the registry already has
  a `manual` provider key reserved for exactly this) — a light adapter that maps arbitrary
  column names the coach chooses (with a simple column-mapping step, similar in spirit to how
  spreadsheet-import tools usually ask "which column is distance?") rather than requiring the
  coach's CSV to already match Catapult's exact export schema.
- Extend the same CSV path to `external_load_metrics` (the athlete-manual-entry table) for a
  single-athlete "here's my last 8 weeks of watch data I tracked in a spreadsheet" bulk-import
  case — smaller effort, reusing `external-load.js`'s existing validation, just accepting an array
  of rows instead of one POST per session.

---

## 2. Garmin / Oura / WHOOP — real OAuth is feasible; do these first

Unlike Apple (§3), these three vendors all support genuine server-to-server integration:

- **Garmin Connect** — has a real Health API / Activity API with OAuth 1.0a (legacy) or a newer
  OAuth2 + Push/Ping webhook model (Garmin pushes new activity notifications to a registered
  webhook URL, you then pull the detail). This requires a Garmin developer account and their
  approval process (their API access isn't instant/self-serve — budget real calendar time for
  this, not just engineering time).
- **Oura** — has a clean, well-documented OAuth2 API (also supports a simpler personal-access-
  token flow for early testing before building the full OAuth consent screen).
- **WHOOP** — also OAuth2, webhook-based for near-real-time data.

**Proposed shape** (all three follow the same pattern, so build one reusable OAuth-adapter
framework rather than three bespoke integrations):

```sql
-- Extends the existing device_pairings table (finally giving it a writer) rather than a
-- new table -- the pairing concept it already models is exactly right, it's just never written.
ALTER TABLE public.device_pairings
  ADD COLUMN access_token_encrypted text,
  ADD COLUMN refresh_token_encrypted text,
  ADD COLUMN token_expires_at timestamptz,
  ADD COLUMN scopes text[];
```

- **`GET /api/wearables/connect/:provider`** — redirects to the vendor's OAuth consent screen
  (`provider` ∈ `garmin`/`oura`/`whoop`, validated against `monitoring_providers.kind='wearable'`).
- **`GET /api/wearables/callback/:provider`** — exchanges the auth code for tokens, encrypts them
  (never store raw tokens — use the same secrets-handling pattern as any other credential in this
  codebase, e.g. Supabase Vault or an equivalent envelope-encryption helper) into the now-writable
  `device_pairings` row, flips `is_active = true`.
- **`POST /api/wearables/webhook/:provider`** (no auth — verified by the vendor's own webhook
  signature, same principle as the Stripe webhook in the payments proposal) — receives the
  vendor's push notification, fetches the actual reading via their API using the stored token,
  normalizes it into `{metric, value, unit, recordedAt, source}`, and calls the *same*
  `wearable-health-ingest.js` ingestion path that manual entry already uses (respecting the
  existing `wearable_consent` gate — a webhook arriving for a user who revoked consent should be
  discarded, not silently written).
- Fix `GET /api/wearables/status` to actually read `device_pairings`/`monitoring_providers`
  (`is_active`, `paired_at`, last-successful-ingest timestamp) instead of returning a hardcoded
  array — small, contained fix, worth doing the moment any real pairing exists (no urgency before
  that, since the hardcoded response happens to be accurate today).
- Token refresh: a scheduled job (same "polling queue" pattern proposed for Stripe seat-sync in
  the payments doc) that refreshes tokens nearing `token_expires_at` before they lapse, so a
  connected athlete doesn't silently stop syncing without any signal.

---

## 3. Apple Watch / Apple Health — this one is structurally different, not just unbuilt

This needs to be flagged clearly rather than lumped in with Garmin/Oura/WHOOP, because **Apple
does not offer a server-to-server API for HealthKit data at all** — this is a deliberate Apple
privacy design choice, not a gap FlagFit Pro's engineering can close by building more backend
code. HealthKit data lives on-device; there is no "Apple Health OAuth" a server can call.

The only real paths to get Apple Watch/Health data into FlagFit Pro:

1. **A native companion app (iOS)** that uses Apple's actual `HealthKit` framework directly on
   the device, then POSTs the readings to the existing `wearable-health-ingest.js` endpoint (which
   already accepts exactly this normalized shape — `source: "apple_health"` is already seeded in
   `monitoring_providers`). This is the only way to get *automatic, ongoing* sync. It requires
   building and maintaining a native (or Capacitor/React-Native-wrapped) iOS app — real,
   non-trivial scope, distinct from the current pure-web Angular app.
2. **Manual/periodic export**: Apple's own Health app lets a user export their data as a ZIP of
   XML; a user could export and upload that file, and the CSV/file-import path from §1 could be
   extended with an Apple-Health-XML parser as a special case. Clunky (no user is going to do this
   weekly), but zero new infrastructure beyond the CSV import work already proposed, and doesn't
   require shipping a native app.
3. **A third-party wearable-aggregation API** (Terra, Spike API, Vital, Human API, Validic) —
   these companies exist specifically to solve "one integration, many wearables including Apple
   Health via their own lightweight companion SDK," at a per-user monthly cost. This trades
   engineering effort for a recurring vendor bill, and is worth pricing out against the business
   plan's own "+€500/year premium add-on" line — if that revenue is meant to *fund* wearable
   integration rather than be pure margin, a paid aggregator might make the whole line item
   break-even from day one instead of requiring months of in-house OAuth/native-app work first.

**Recommendation:** don't promise "Apple Watch sync" with the same shape as "Garmin sync" in any
customer-facing copy until one of these three paths is actually chosen — they have very different
cost/timeline profiles, and (1) in particular is a much bigger commitment (a native app) than the
rest of this proposal.

---

## 4. Suggested build order

1. Fix the Business Plan's feature-list/roadmap inconsistency (§0) — either mark "Wearable
   integration" as a Q2–Q3 2027 line consistently everywhere, or explicitly scope what ships now.
2. CSV import (§1) — smallest, self-contained, reuses fully-working existing ingestion logic,
   immediately useful for Catapult/STATSports customers who currently have no way to get their
   own vendor exports in beyond typing numbers by hand, and for coaches with manual spreadsheets.
3. Garmin/Oura/WHOOP OAuth (§2) — pick one vendor first (Oura's API is the least friction to start
   with — no lengthy vendor approval process the way Garmin's is), prove the pattern, then repeat
   for the other two against the same `device_pairings` schema/webhook framework.
4. Decide Apple Health's path (§3) — this is a genuine product/roadmap decision (native app vs.
   manual export vs. paid aggregator), not an engineering default I'd pick silently.
5. Wire up `device_pairings`-writing UI (a coach/athlete-facing "connect" flow) once at least one
   real OAuth adapter exists to connect to.
