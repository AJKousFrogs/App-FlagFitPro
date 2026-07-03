# V2 — Implementation Tracker

This folder tracks the *build* against the vision in [`../V2_PROPOSAL.md`](../V2_PROPOSAL.md) (the original audit + full roadmap). Each phase doc below is a living status record — **status reflects what's actually verified in this repo right now** (typecheck/build/tests run, or explicitly not), not what's planned. Update it in the same PR as the code, same rule as the Feature Status Ledger in `SOURCE_OF_TRUTH.md` §4.

Status legend: **BUILT** (code + tests exist, verified locally) · **BUILT, NOT DEPLOYED** (built + verified, migration not yet applied to the live DB) · **PARTIAL** (some of the phase's scope landed) · **SPEC** (designed, not built) · **PLANNED** (not started).

| Phase | Doc | Status |
|---|---|---|
| V2.0 — Tournament Mode (per-game timeline) | [`V2.0-tournament-mode.md`](V2.0-tournament-mode.md) | BUILT, NOT DEPLOYED |
| V2.1 — Travel, supplement timing, season plan | [`V2.1-plan-travel.md`](V2.1-plan-travel.md) | PARTIAL — travel legs + caffeine timing built; season plan builder + KB context tags not started |
| V2.2 — Breadth & calibration (coach console, session library) | [`V2.2-breadth-calibration.md`](V2.2-breadth-calibration.md) | PARTIAL — QB throw-count logger built; coach console/session breadth/calibration specced only |
| V2.3 — Bug sweep | [`V2.3-bugfixes.md`](V2.3-bugfixes.md) | tracked as findings land |

**Live-DB caveat (applies to every migration below):** this session does not have authenticated Supabase MCP access, so no migration in this tracker has been applied to the live project — they exist as committed `supabase/migrations/*.sql` files only. Apply them (`supabase db push` or the Supabase MCP `apply_migration` once authorized) before any of this is reachable in a deployed environment. Don't mark a row LIVE in the `SOURCE_OF_TRUTH.md` Ledger until that's done and re-verified against the live schema.
