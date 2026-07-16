# DPIA — Menstrual Cycle Module (v3 M3)

> **Status: DRAFT — requires human data-protection / legal sign-off before this
> module is promoted to real users.** The feature ships **disabled by default**
> and **U18 force-disabled**; enabling it records explicit, versioned consent.
> This document is the engineering record of the privacy design; it is **not** a
> substitute for a completed, signed DPIA under GDPR Art. 35. Owner: club data
> controller (Ljubljana Frogs). Reviewer: _to be assigned_.

## 1. What & why (necessity, proportionality)

Optional, athlete-only cycle logging and a private phase-awareness advisory.
Purpose: help an athlete understand their own body and set expectations; it does
**not** drive training. Lawful basis: **explicit consent** (Art. 6(1)(a) + Art.
9(2)(a) for special-category health data). Consent is granular (this module only),
versioned (`CYCLE_CONSENT_VERSION`, currently `2026-07-16.v1`), timestamped, and
withdrawable with immediate erasure.

## 2. Data

| Data | Category | Where |
|---|---|---|
| Cycle logs (flow, symptoms, date) | **Special-category (Art. 9)** | `cycle_logs` |
| Module settings + consent record | Special-category-adjacent | `cycle_tracking_profiles` |
| Estimated phase | **Never stored** — computed on the client, on read | — |

## 3. Privacy design (safety by construction)

- **Owner-only, no staff surface.** Both tables have owner-only RLS
  (`auth.uid() = user_id`) with **no** staff/coach policy. `/api/cycle` runs on
  the caller's JWT and has no `athleteId`/staff branch — it physically cannot
  return another user's data. V3.0 has **zero** staff cycle surface.
- **The engine never receives cycle data.** No `PeriodizationInputs` field. What
  adapts training is the athlete's own daily wellness check-in (same path as for
  every athlete). The phase advisory is **inform-only** and never issues a
  training instruction (enforced by a tested `FORBIDDEN_CYCLE_ADVICE` guard).
- **No phase is persisted or server-computed.** `estimateCycle` is a pure client
  function; hormonal contraception ⇒ `phase = null` (no fabricated physiology);
  < 2 logged cycles ⇒ low confidence + tentative.
- **Containment.** An ESLint rule forbids importing the cycle module outside
  `cycle/`; the ONLY other reader is the GDPR export path (`data-export.js`).
  Cycle fields must never appear in telemetry, logs, or error reports.

## 4. Rights

- **Access / portability:** cycle data is included in the athlete's data export
  (Settings → Account → Export my data; `data-export.js` `cycle_profile` +
  `cycle_logs`).
- **Erasure / withdrawal:** `DELETE /api/cycle` hard-deletes all logs + profile
  and writes a `privacy_audit_log` record. Surfaced as "Delete everything" (typed
  `DELETE` confirm) in the module.
- **Rectification:** per-day edit/delete in the module.

## 5. Open items requiring human sign-off (BLOCKING for real-user launch)

1. **Signed DPIA** by the club's data controller / DPO (this draft → final).
2. **Consent copy** legal review (currently in-app + `CYCLE_CONSENT_VERSION`).
3. **Retention**: automated trim of `cycle_logs` to `healthRetentionMonths`
   (org default 24) is **not yet implemented** — a scheduled destructive job,
   deferred with the rest of the retention machinery (retention periods are a
   legal decision). Until then, data persists until the athlete deletes it.
4. **U18**: force-disabled now; a minors release with guardian consent + legal
   review is a separate future project.
5. **Aggregate/research staff lane** (k≥5, adults, separate consent) is **not**
   built and must not be added without its own DPIA.

## 6. Residual risk

Low by design (owner-only, no staff surface, no engine coupling, client-only
phase, disabled by default). The main residual risk is **consent quality** and
**retention** — both in the sign-off list above. Do not rely on this module for
any real user until items 1–3 are closed.
