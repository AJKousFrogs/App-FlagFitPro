# CLAUDE.md — house rules for this repo

FlagFit Pro: Angular + Netlify Functions + Supabase, load-management for athletes.
**`docs/SOURCE_OF_TRUTH.md` is the domain ground truth** (schema, endpoints, feature
status, spec laws) — read it, don't duplicate it here. This file is _process_ rules:
how to work in this repo, not what's true about it.

## 1. Green before done

A task isn't finished when the code looks right — it's finished when CI says so.

- Run the relevant test suite(s) locally before pushing (backend `npx vitest run
tests/`, Angular `npx vitest run` in `angular/`, `npm run lint:tooling`, `tsc
--noEmit`). Don't push on faith.
- After every push to `main`, poll `gh run list --branch main` until CI/E2E/Mobile
  Responsive Testing complete. **Confirm success before reporting the work as done.**
  A push that hasn't been checked is not a finished task.
- If CI goes red, fix it in a follow-up commit immediately — don't leave `main` red
  and move on. Investigate the root cause; don't skip hooks or checks to make it
  pass.
- Prefer small, individually-revertible commits over one large one. Each commit
  should be a coherent, testable unit — if something needs reverting, `git revert`
  on one commit shouldn't take back three unrelated changes with it.

## 2. Docs don't drift

Docs are only useful if they're true. Stale docs are worse than no docs — they
actively mislead (this repo has shipped real bugs from exactly that: a doc telling
a future reader that an already-fixed security hole "must stay open").

- **Any change to a table, endpoint, or feature updates `docs/SOURCE_OF_TRUTH.md`
  §4 (Feature Status Ledger) in the same commit or PR.** This is an existing rule
  in that file (§8) — it is not optional, and it has been violated before (a whole
  feature shipped without a Ledger row).
- After a schema change applied live (via Supabase MCP or a migration): refresh
  `docs/generated/live-schema.snapshot.json` from live introspection, regenerate
  `supabase-types.ts`, then `npm run docs:regen`, then commit all four together.
  Don't let the snapshot go stale — check its `generatedOn` date against the last
  migration date before trusting it.
- When you find a doc claim that no longer matches reality — a stale count, a
  reversed security fact, a contradiction between two sections — **fix it in the
  same pass you found it in**, don't just note it and move on. Log what changed and
  why in `docs/SOURCE_OF_TRUTH.md` §6 (dated entry, matching its existing style).
- If two sections of `SOURCE_OF_TRUTH.md` genuinely disagree (an aspirational law
  vs. current reality, e.g. Law #6 vs. §5a), don't silently pick one — state the
  honest current state, point at what resolves it, and delete the note once it's
  resolved.

## 3. Decision authority

Default to deciding and proceeding, not asking. This applies to engineering and
architecture judgment calls in this repo — which library, which extraction
boundary, how to sequence a migration, whether two calculations should be unified
or deliberately kept separate. Explain the reasoning as you go; don't stop mid-task
to request approval on calls like these.

This does **not** relax the safety discipline that makes the speed safe:

- Safety/injury-relevant calculations (readiness, ACWR, periodization, anything
  that changes what an athlete is told to do) still get the full treatment before
  being unified or changed: understand _why_ they currently differ before merging
  them, add a test/parity harness that proves the change is safe, verify against
  real before/after numbers, not just "the code looks equivalent."
- Destructive/irreversible actions (force-push, `git reset --hard`, dropping
  live data, disabling a safety guard) still get flagged explicitly, even under
  this authority — the bar there is "would reverting this be a new investigation,"
  not "did I ask permission."
- When a call is genuinely a product/business decision (not an engineering one) —
  which formula is _correct_ for a sports-science tradeoff, what a feature should
  do, pricing, legal — that's still not mine to make silently. Flag it, propose a
  default, and proceed with the default if there's no response, rather than
  blocking.

## 4. Single source of truth for calculations

This is a load-management app: a wrong number can mean a wrong training decision,
which can mean an injury. The throughline rule for every safety-relevant
calculation (readiness, ACWR, periodization, RPE/workload, injury-risk flags, CNS
classification, …):

- **One calculation, one place it's computed, everywhere else fetches/displays.**
  If you find the same formula in two places, that's a bug even if the numbers
  currently agree — they will drift.
- Before merging two calculations that look similar, verify they're actually the
  same intent, not two different things sharing a name (this repo has both cases —
  see `docs/ground-truth/calculation-ownership-audit-*.md` for the readiness
  example: two formulas that looked like drift but were deliberately different,
  one with a safety property the other lacked).
- When in doubt about whether a metric has drifted or diverged between
  frontend/backend, grep for it on both sides and check the DB (triggers/RPCs) too
  — don't assume the obvious two files are the only two places it lives.
