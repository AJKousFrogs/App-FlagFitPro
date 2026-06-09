# FlagFit Pro

FlagFit Pro is a flag football performance, wellness, and team-operations platform built with Angular, PrimeNG, Netlify Functions, and Supabase.

**Current release:** [4.0.0](docs/RELEASE_NOTES_4.0.0.md) — UI redesign, Supabase polish, and TypeScript/JavaScript fixes.

## Start Here

- Canonical documentation index: [docs/DOCS_INDEX.md](./docs/DOCS_INDEX.md)
- Local development setup: [docs/LOCAL_DEVELOPMENT_SETUP.md](./docs/LOCAL_DEVELOPMENT_SETUP.md)
- Architecture: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- Single source of truth rules: [docs/SINGLE_SOURCE_OF_TRUTH.md](./docs/SINGLE_SOURCE_OF_TRUTH.md)
- Angular workspace guide: [angular/README.md](./angular/README.md)

## Documentation Rule

- `docs/DOCS_INDEX.md` is the canonical entry point for durable product and engineering docs.
- Docs must describe current behavior or enforced rules.
- One-off audits, progress reports, and temporary trackers should be deleted once their outcome is merged into durable docs or code.
- A local README is allowed when it explains a specific subdirectory, script set, or operational area.

## Quick Start

Prerequisites:

- Node.js 22+
- npm 11+

Install and run:

```bash
npm install
cd angular && npm install && cd ..
npm run dev
```

Preferred local workflow:

- `npm run dev` runs Netlify Dev and proxies the Angular app plus local functions.
- `npm run dev:angular-only` is for isolated Angular work when backend parity is not needed.

## Common Commands

```bash
npm run dev
npm run build
npm run type-check
npm run lint
npm run test
```

For workspace-specific commands, use [angular/README.md](./angular/README.md).

## Repository Layout

```text
angular/              Angular application
netlify/functions/    Serverless backend
database/             Migrations and database support material
docs/                 Canonical product and engineering docs
tests/                Integration, privacy, and logic tests
scripts/              Tooling, audits, and repo automation
```

## Source Of Truth

The repo now uses one clear documentation hierarchy:

- product, architecture, security, API, and design rules live under [docs/](./docs/)
- Angular implementation guidance lives under [angular/](./angular/)
- SCSS implementation guidance lives next to the style system under [angular/src/scss/](./angular/src/scss/)

If two docs disagree, prefer:

1. [docs/DOCS_INDEX.md](./docs/DOCS_INDEX.md)
2. the topic-specific canonical doc linked from that index
3. the code

## Recovery Modalities & Adaptive Load

Durable product spec. These are **product rules**, not implementation notes — keep them
true in code.

### Canonical engines (decided)

- The athlete-facing prescription ("Today" / "This week") is owned by the **client
  `periodization.service.ts`** (`prescribeFor` / `decideBasePrescription`). Recovery and
  injury precedence are wired **here**, not in the legacy server-side
  `daily_protocols` / `ai-chat` generator (which remains for coach/AI features but is not
  the source of truth for the athlete plan).
- The equipment inventory is stored on **`athlete_training_config.available_equipment`**
  (jsonb array of equipment ids). We **reuse** this column; we do **not** use the
  dead/missing `athlete_recovery_profiles` / `equipment_items` tables.

### Equipment inventory model

- A player owns a set of recovery equipment, stored as a jsonb array of stable ids on
  `athlete_training_config.available_equipment`, e.g.
  `["compression_boots","massage_gun","massage_knife","foam_roller","bands","physio_access"]`.
- The catalogue of known equipment ids + labels lives as **data** (a reference constant),
  never hardcoded into business logic. Adding a new modality = adding a catalogue entry.
- **Equipment gate (LAW):** the prescription/recovery engine may only ever recommend a
  modality the player actually owns/has access to. No Normatec recommendation for a player
  without compression boots, ever.

### Modality prescription logic (triggers)

Data-driven rules. Each modality has trigger conditions; the engine emits a modality only
when its trigger fires **and** the player owns it.

- **Compression boots** → post-session on high-load days, on an ACWR spike, or during a
  congested fixture run.
- **Massage gun (percussion)** → pre-session activation, or post-session localized tightness.
- **Stretching / mobility drills** → tightness reports, low-readiness days, scheduled
  maintenance. (Always available — no equipment gate; bodyweight.)
- **Massage knives (IASTM)** → persistent / recurring localized soft-tissue tightness.
- **Foam roller** → general post-session, low-grade soreness.
- **Physio referral** → triggered when a self-reported issue crosses a severity threshold
  **or recurs** across multiple days.

### Self-report → recalculation (the Merlin loop) — SPEC LAW

When a player reports soft-tissue tightness / soreness for a body region (via the Wellness
check-in region selector **or** by telling Merlin "my achilles/gastroc is tight"):

1. The report is persisted to a canonical store the engine reads:
   - structured per-region soreness → `daily_wellness_checkin.soreness_areas`, and
   - an active restriction → `athlete_injuries` (`injury_location`, `injury_grade`,
     `recovery_status='active'`, `activity_restrictions[]`, short auto-expiry for
     self-reported tightness).
2. The system **MUST recalculate** training load / RPE targets / prescription. It does not
   silently keep the old plan.
3. **Injury/physio precedence overrides training (LAW):** a relevant tightness/injury
   signal for a region used by sprint/high-intensity work **down-regulates or removes that
   work for the affected region** — regardless of what the periodization plan wanted.
   Severity scales the response: minor tightness → substitute sprints with mobility; moderate
   /severe → recovery/rest. This precedence sits **above** the normal plan and the
   team-practice/accumulation defaults (but the existing competition/taper safety branches
   still apply).
4. The recalculation is **deterministic and traceable**: every override logs what triggered
   it (region, severity, source) and what changed (intent before → after), so it can be
   audited.

### Write-path integrity (LAW)

Every critical write in this feature — equipment profile, self-report, recalculation result
— must check success and surface failure to the user/caller. **No silent advance, no
swallowed error.** A failed self-report write is a P0: the athlete must not believe their
tightness was logged when it wasn't.
