# Monitoring Feature — Status Ledger (live ground truth, 2026-07-07)

> Regenerated at Prompt-7 from the live Supabase schema + shipped code. Everything
> below is **additive** on `main`; rollback floor = Prompt-0 checkpoint `6136ae2f`
> (every feature commit is individually `git revert`-able above it).

## Per data layer

| Layer                  | Live table(s)                                                                   | Endpoint                          | Frontend                   | RLS                                | Status                            |
| ---------------------- | ------------------------------------------------------------------------------- | --------------------------------- | -------------------------- | ---------------------------------- | --------------------------------- |
| Roles                  | `team_member_roles` (+`team_roles_for`/`has_team_role`/`can_role_read_athlete`) | (all gate on it)                  | —                          | self-read                          | **live**                          |
| Reference/config       | `monitoring_config` (25 global seeds)                                           | `/api/monitoring-report` resolves | report footer (editable)   | team-member read, head_coach write | **live**                          |
| Daily wellness         | `daily_wellness_checkin`                                                        | report `daily`                    | daily panel + Hooper spark | own + consent-gated staff          | **live**                          |
| Weekly load            | `session_load` (+ `training_sessions`)                                          | report `weekly` (EWMA ACWR)       | weekly panel + shaded band | own + sc_coach/physio              | **live**                          |
| External load          | `external_load_metrics`                                                         | `/api/external-load`, import      | (athlete-detail)           | own + consent staff                | **live**                          |
| Bloodwork              | `bloodwork_panels`/`markers`/`bloodwork_baselines`                              | `/api/bloodwork`, report          | role-shaped panel          | own + physio (medical)             | **live**                          |
| Physio block           | `physio_blocks`                                                                 | report `physioBlock`              | top-precedence banner      | own + physio                       | **live** (engine wiring deferred) |
| Wearable health        | `wearable_health` (+ `wearable_consent`)                                        | `/api/wearable-health-ingest`     | daily morning-readiness    | own + physio only                  | **live**                          |
| Providers/pairing      | `monitoring_providers` (8), `device_pairings`                                   | import resolves pairing           | —                          | registry read; pairing own+staff   | **live**                          |
| Derived medical signal | `roster_medical_status()`                                                       | report (head_coach)               | bloodwork chip             | head_coach/physio only             | **live**                          |

## Per role (verified live under real RLS, Prompt-7)

| Role           | Sees                                                                            | Verified                                   |
| -------------- | ------------------------------------------------------------------------------- | ------------------------------------------ |
| athlete / self | own everything; **not** another athlete's                                       | own=1, other=0 ✓                           |
| physio         | full roster clinical (bloodwork, wearable, physio, load)                        | bloodwork 2, wearable 1, block 1, load 1 ✓ |
| sc_coach       | roster LOAD only                                                                | load 1; bloodwork 0; wearable 0 ✓          |
| head_coach     | readiness + **derived** medical signal only; **no raw** bloodwork/wearable/load | raw 0,0,0; derived=flagged ✓               |

## Per ingestion path

| Path            | Mechanism                                                                  | Guarantees                                                                                                                   | Verified                                                 |
| --------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Session load    | `/api/session-load-import` + provider adapters (Catapult ref + STATSports) | add provider = a mapping, not an engine edit; pairing resolved at ingest; failures surface in `failed[]`                     | adapter maps both formats; same session ×2 = **1 row** ✓ |
| Wearable health | `/api/wearable-health-ingest` (PUT consent / POST ingest)                  | gated on `wearable_consent='granted'`; revoke stops ingest; source+source_device per reading (never cross-brand); idempotent | consent-absent blocked; ×2 = 1 row; revoke → blocked ✓   |

## Proofs (Prompt-7)

- **Regression:** base tables 169 → 181 (**+12 additive**, 0 dropped); `netlify.toml` diff removed 0 existing redirects (only new `/api/*` added); build green.
- **Config:** `monitoring_config` global `acwr.elevated=1.50`, team override `=1.4` → resolver picks team → flag flips with **no code edit**.
- **CDN:** report fonts (Archivo / Archivo Narrow / JetBrains Mono) + Space Grotesk/Plus Jakarta self-hosted via `@fontsource`; redundant Google-Fonts CDN `<link>` removed from `index.html`; lucide icons bundled. **No runtime CDN fetch.**
- **Null states:** every layer returns explicit `null` + `promptRequired`; component renders prompts (spec-tested), never fabricates.

## Deferred / follow-ups

- **Phased `user_id` sweep:** `team_member_roles` is empty (unwired) — the feature grants nothing until roles are populated per team. Populating it (and back-filling from `team_members`) is the next rollout step.
- **Engine precedence wiring:** the prescription engine still reads `recovery_blocks`; wiring `physio_blocks` into engine precedence is a separate change.
- **owner/admin/superadmin** have no path into clinical data (role primitive defines only athlete/head_coach/sc_coach/physio) — deliberate; add explicitly if ops access is wanted.
- **Report ACWR trend:** rendered as position-on-shaded-band from the current ratio; a time-series ACWR trend would need the endpoint to return a series.
