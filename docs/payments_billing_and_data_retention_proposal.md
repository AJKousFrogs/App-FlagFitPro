# Payments, Billing & Data Retention — Technical Proposal

**Status:** IMPLEMENTED (2026-07-23). Originally written as a pre-build proposal; every mechanism
described below has since been built (Stripe checkout/webhook/portal, seat counting, past-due →
suspended lifecycle, `player_payments` retired, retention reconciled) and the §9 open decisions
have been resolved — each is marked RESOLVED inline with the actual answer given, rather than left
as an open question. **This document is now historical design rationale, not a live spec** — for
current mechanics (entitlement logic, trial/paywall behavior, endpoint list) read
`docs/SOURCE_OF_TRUTH.md`, which is kept in sync with the code. Where this document and
SOURCE_OF_TRUTH disagree, SOURCE_OF_TRUTH wins.
**Date:** 2026-07-23 (proposal) / resolved 2026-07-23 (same day — decisions came back from the
user before implementation started)
**Companion documents:** `docs/legal/BUSINESS_PLAN_SUBSCRIPTIONS.md` (pricing/tiers, already
finalized), `docs/legal/TERMS_AND_CONDITIONS.md` §7–8 (billing terms, already finalized),
`docs/legal/PRIVACY_POLICY.md` / `docs/legal/GDPR_COMPLIANCE_DPA.md` (already name Stripe as a
sub-processor).

---

## 0. What already exists (audit findings)

A full repo audit before writing this proposal found:

- **No Stripe integration exists anywhere in code.** No SDK dependency, no webhook handler, no
  checkout/session code, no subscription-state table. The word "Stripe" appears only in three
  legal documents that assume it's already wired up. It isn't.
- **`player_payments` is a broken ghost table.** 0 live rows. The code that reads/writes it
  (`netlify/functions/payments-core.js`) references columns — `payment_type`, `description`,
  `due_date`, `paid_at`, `reference_number`, `receipt_url`, `created_by` — that **do not exist**
  on the live table, and inserts rows without the two `NOT NULL` columns the table actually has
  (`tournament_id`, `payment_date`). Any real insert through this path would fail outright. Its
  own test suite mocks the DB client entirely, so this has never been caught. Its own
  `payment.instructions` response (lines 144–167) tells users to pay via Venmo/Zelle/cash — i.e.
  even this feature's own design assumes payment happens *outside* the app. **Recommendation:
  retire this table and its endpoints rather than repair them** (see §6).
- **`tournament_budgets`** — 0 rows, zero code references anywhere. Fully inert, unrelated to
  monetization. No action needed here.
- **`sponsors`** — live, used, but it's a marketing/display feature (sponsor logos on the login
  screen), not a revenue mechanism. Out of scope for this proposal.
- **No seat/roster-size concept exists in the schema at all**, despite the business plan's
  per-seat Team Package pricing (€100/mo for 12 users + €4.99/user, etc.). `teams` and
  `team_members` have no cap, no billable/non-billable distinction, nothing to count against a
  price. This has to be built from scratch (§3).
- **`team_members.role`** has 13 values in one flat table (`owner`, `admin`, `head_coach`,
  `coach`, `offense_coordinator`, `defense_coordinator`, `assistant_coach`, `physiotherapist`,
  `nutritionist`, `strength_conditioning_coach`, `psychologist`, `player`, `manager`) with no
  column distinguishing which of them should count toward a paid seat.
- **Account pause and account deletion infrastructure already exists and is solid** —
  `account-pause.js` / `account-deletion.js` + their backing SQL RPCs
  (`pause_account`/`resume_account`/`initiate_account_deletion`/`process_hard_deletion`). This is
  the right foundation to extend for payment-lapse handling rather than building a parallel
  system (§4). One real gap found: `pause_account` sets `acwr_frozen = true` on the pause row by
  default, but **nothing in the codebase reads that flag** — pausing today only flips
  `users.account_status`; it doesn't actually freeze any calculation. Also: `player_payments` is
  absent from both the hard-deletion routine's table list and the GDPR export's table list — a
  gap that becomes actively wrong once real payment history exists (§8).
- **No `organizations` table** — everything is scoped at the `team` level; a user can belong to
  many teams with no upper grouping. Two unrelated tables (`alert_rules`, `alert_routes`, from
  the just-shipped Alert Engine) have an unused, vestigial `organization_id` column with no FK
  target and no code that reads it. Not a blocker, but confirms billing has to be modeled at
  `team_id` granularity (plus a new user-level individual-subscription case), not at some
  not-yet-existing org level.
- **Parental consent flow exists and is real** (`parental-consent.js`, `parental_consent` table,
  guardian email verification, per-feature consent scopes) but has **no billing-consent scope** —
  today there's no mechanism for a guardian to authorize a minor's paid tier, and the schema's
  `consent_scope` jsonb only knows about `healthData`/`biometrics`/`location`/`research`.
- **Retention-policy numbers already committed but inconsistent across docs:** the account
  deletion flow hard-deletes after **30 days**; `data-export.js`'s GDPR-rights text claims data is
  "retained for **3 years** after account deletion for legal compliance." These are talking about
  different things (account-initiated deletion vs. legally-mandated financial-record retention)
  but read as contradictory as written. This proposal reconciles them (§8).
- **The Terms & Conditions already answer more of "what happens on lapse" than you'd expect**,
  and I've kept every existing figure rather than inventing new ones:
  - Failed payment: retry 3×, **suspend at 14 days unpaid** (T&C §7.5).
  - Free tier: **30-day rolling data-visibility window** (Business Plan §2.1 Free tier limits, as
    originally proposed here). **Superseded before implementation** — the actual product decision
    (2026-07-23, same day) replaced the permanent Free tier with a single 7-day full-access trial
    followed by a hard paywall (no partial/read-only access afterward). §5 below documents the
    mechanism as originally proposed for historical reference; the as-built behavior is in
    `docs/SOURCE_OF_TRUTH.md`.
  - Roster removal: *"Data is archived; player can access via personal account (if applicable)"*
    (T&C §8.3) — this is the existing, already-stated intent that this proposal makes concrete.
  - Domestic Team Package: 30-day money-back guarantee (T&C §7.4).

Everything below is designed to fit these already-committed numbers, not replace them. Where a
real decision is still open (nothing in the legal docs answers it), it's flagged explicitly in
§9 rather than decided silently.

---

## 1. Architecture overview

```
                        ┌─────────────────────────────────────┐
                        │              Stripe                  │
                        │  Products/Prices (mirror the 6 tiers)│
                        │  Customers, Subscriptions, Invoices   │
                        │  Checkout Session, Billing Portal     │
                        └───────────────┬───────────────────────┘
                                        │ webhooks (signed)
                                        ▼
                      netlify/functions/stripe-webhook.js
                      (idempotent, verifies signature, writes
                       to subscriptions/invoices tables, then
                       calls entitlement-recompute)
                                        │
                       ┌────────────────┼────────────────┐
                       ▼                ▼                ▼
              subscriptions table  invoices table   entitlements
              (1 per Stripe sub)   (audit trail)     (materialized,
                                                       computed from
                                                       subscription +
                                                       seat count)
                                        │
                                        ▼
                     Every gated read/write path checks
                     entitlements via one shared helper —
                     NOT its own ad-hoc tier logic (single
                     source of truth, same principle as
                     the ACWR-engine rule in CLAUDE.md §4)
```

Three new Netlify functions, three new tables, one shared authorization helper. Nothing else in
the request path changes — existing endpoints gain one entitlement check, not a rewrite.

### 1.1 New tables

```sql
-- One row per Stripe Customer. A customer is either an individual user
-- (Athlete Pro / Coach Pro / Professional Freelancer) or a team
-- (Team Package) -- never both for the same row.
CREATE TABLE billing_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_customer_id text NOT NULL UNIQUE,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,  -- individual subscriber
  owner_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL, -- team subscriber
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exactly_one_owner CHECK (
    (owner_user_id IS NOT NULL) <> (owner_team_id IS NOT NULL)
  )
);

-- One row per Stripe Subscription, kept in sync via webhook.
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_customer_id uuid NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
  stripe_subscription_id text NOT NULL UNIQUE,
  tier text NOT NULL CHECK (tier IN (
    'athlete_pro', 'coach_pro', 'professional_freelancer', 'professional_plus',
    'team_domestic', 'team_national'
  )),
  status text NOT NULL CHECK (status IN (
    'trialing', 'active', 'past_due', 'unpaid', 'canceled', 'incomplete'
  )),
  seat_quantity integer,               -- NULL for individual tiers; set for team tiers
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  past_due_since timestamptz,          -- set when status first becomes past_due/unpaid
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Audit trail / what data-export and support need to show a customer their history.
-- Also closes the gap where player_payments never captured real payment records.
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_invoice_id text NOT NULL UNIQUE,
  amount_due_cents integer NOT NULL,
  currency text NOT NULL,
  status text NOT NULL,                -- stripe's invoice status verbatim
  hosted_invoice_url text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

`billing_customers`/`subscriptions`/`invoices` are the only tables Stripe webhook data ever
touches directly. RLS: owners (via `owner_user_id` or team ownership) can `SELECT` their own row;
all writes are `service_role`-only (webhook + checkout functions), matching the pattern already
used for `generated_alerts`.

### 1.2 New functions

- **`stripe-checkout.js`** (`POST /api/billing/checkout`) — creates a Stripe Checkout Session for
  a chosen tier (individual) or a chosen team + tier (team package), redirects to Stripe-hosted
  checkout. Never touches raw card data.
- **`stripe-webhook.js`** (`POST /api/billing/webhook`, no auth — verified by Stripe signature
  instead) — handles `checkout.session.completed`, `customer.subscription.updated/deleted`,
  `invoice.paid`, `invoice.payment_failed`. Idempotent (checks `stripe_subscription_id`/
  `stripe_invoice_id` before writing) since Stripe redelivers events.
- **`stripe-portal.js`** (`POST /api/billing/portal`) — creates a Stripe Billing Portal session
  (self-service cancel/update card/view invoices) so FlagFit Pro never has to build its own
  card-management UI.
- **`utils/entitlements.js`** — the single shared helper every gated feature calls:
  `getEntitlement(userId)` → `{tier, status, limits: {historyDays, maxTeams, ...}}`. This is the
  one place tier→feature-limit mapping lives (mirrors the ACWR single-source-of-truth rule).

---

## 2. Mapping the 6 tiers to enforceable checks

The business plan's tiers are marketing/pricing language; each needs one concrete, checkable rule.
**As originally proposed** (superseded — see §5's note; kept for rationale):

| Tier | Enforced as |
|---|---|
| Free | `entitlement.tier === 'free'` → reads to training/wellness/readiness history are filtered to `created_at >= now() - 30 days` (§5); writes still allowed at full rate (you don't stop someone logging today's session) |
| Athlete Pro | `subscriptions.tier = 'athlete_pro' AND status = 'active'` on `owner_user_id = <this user>` → unlimited history, export enabled, wearable sync enabled |
| Coach Pro | same, `tier = 'coach_pro'` → roster management enabled for up to 20 athletes (`team_members` count where `role='player'` on teams this coach owns/manages), bulk load programming enabled |
| Professional Freelancer / Plus | same, gates the specialized assessment tools (RTP/nutrition/psych/S&C client-management screens) + a 100-client cap (Plus: unlimited) |
| Team Package (Domestic/National) | `owner_team_id = <this team>`, `seat_quantity` synced to `team_members` count (§3) → unlocks Coach Pro features for every coach on that roster, team analytics, RTP dashboards |

`utils/entitlements.js` is the only place that ever contains a limit number (30 days, 20 athletes,
100 clients, etc.) — every gated endpoint imports it rather than hardcoding its own copy of the
business plan.

---

## 3. Who counts as a seat (the "21 or 12" question)

The business plan's Team Package base counts ("up to 12 users" domestic, "up to 20 users"
national) say "coaches + athletes" in prose but the schema has 13 roles in one flat
`team_members` table with no billable flag. **This is the one place I'd push back slightly on
inferring an answer rather than asking** — see the flagged question in §9 — but here's the
concrete mechanism either way, so the schema decision doesn't block on the policy decision:

```sql
ALTER TABLE public.team_members ADD COLUMN is_billable_seat boolean NOT NULL DEFAULT true;
```

Seat count for a team = `SELECT count(*) FROM team_members WHERE team_id = $1 AND status =
'active' AND is_billable_seat = true`. Default `true` for every role means "everyone with an
active roster row counts" (the simplest, most defensible default — a physiotherapist attached to
a national team's roster is clearly a paid seat's worth of usage). If the business decision is
instead "only `player`/coaching roles count, medical/support staff are free add-ons," that's a
one-line change to the default expression, not a schema redesign — I deliberately made this a
column, not a hardcoded role-list, so the policy can change without a migration.

**Seat sync to Stripe:** a `team_members` insert/update/delete trigger (same pattern as the Alert
Engine's `AFTER INSERT OR UPDATE` triggers) calls a lightweight
`recompute_team_seat_count(team_id)` function that, if the team has an active `team_domestic`/
`team_national` subscription, updates the Stripe subscription's `quantity` via the Stripe API
(from a queued job, not synchronously inside the DB trigger — Postgres can't make outbound HTTP
calls; the trigger writes to a `seat_sync_queue` table that a small polling function drains, same
shape as the existing `get_deletions_ready_for_processing` pattern). This is what makes "50 users
= €100 + (38 × €4.99)" actually track roster changes instead of requiimport a manual reconciliation.

---

## 4. Payment lapse → the full lifecycle (extends what's already built)

This reuses the existing `account_status` state machine (`active` / `paused` / `deleted`) rather
than inventing a parallel one, adding exactly one new state:

```
active ──(3 failed retries, 14 days)──► past_due_grace ──(still unpaid)──► suspended
  ▲                                            │                                │
  │                                     (payment succeeds)                      │
  └────────────────────────────────────────────┘                               │
  ▲                                                                             │
  └──────────────────(manual reactivation / new payment method)────────────────┘
```

- **`active`**: subscription in good standing. Full tier features.
- **`past_due_grace`** (NEW — maps to `subscriptions.status IN ('past_due','unpaid')` with
  `past_due_since` set): Stripe's own smart-retry schedule is doing the 3 retries. During this
  window (0–14 days from `past_due_since`, matching T&C §7.5 exactly): **read access continues
  unchanged, write access continues unchanged** — nobody loses functionality mid-retry over a
  card that might just need re-entering. A banner + email fires (reusing the existing
  notification infrastructure) telling the team owner/individual to update payment.
- **`suspended`** (at day 14, matching T&C exactly): entitlement helper downgrades the account to
  locked limits **without touching any row of athlete data**. This is the answer to "do
  athletes start over": **no** — every training session, readiness score, injury record, RTP
  assessment stays exactly where it is, in the same tables, with the same history. What changes
  is *what the UI/API will show and allow*. **As built, this is neither the original "30-day
  rolling window" proposal below nor a hard redirect-out** — it landed on a third design after two
  corrections the same day: a suspended account gets the same `LOCKED_LIMITS` lock as a
  trial-expired account (`entitlement.locked === true`), enforced as a 402 `subscription_required`
  on every WRITE (`utils/base-handler.js`'s freeze gate) — but reads are never gated, so the
  account can still open the app and see everything it already entered; it just can't add to it.
  This matches T&C §8.3's existing "data is archived, player can access via personal account" line
  precisely — suspension IS the archive-in-place mechanism, just made concrete.
- **Reactivation**: paying again (new card via the Stripe Billing Portal) flips `subscriptions.status`
  back to `active` and **everything reappears instantly** — there is no re-onboarding, no data
  migration, no "welcome back, let's rebuild your profile." Nothing was deleted, so lifting the
  lock just means the same rows become visible again.
- **Voluntary pause** (the existing `account-pause.js` flow, e.g. an athlete's off-season) —
  **RESOLVED, §9 item 2: billing continues through any voluntary pause; there is no discounted or
  free pause option.** (Originally flagged as an open pricing question here; the user's answer was
  explicit: *"Yes. There is no voluntary pause. And no discounts sad to see you go."*) Pausing via
  `account-pause.js` still changes the athlete-data-visibility behavior it always did, but does
  **not** pause or discount the underlying Stripe subscription — the only way to stop being billed
  is to cancel. **Also fixing the pre-existing `acwr_frozen` gap here**: since we're
  already touching the pause code path to add entitlement awareness, wire `acwr_frozen` into the
  ACWR-snapshot computation (skip/carry-forward rather than compute against a gap in training
  data) — it's a column that's existed with a `true` default since the pause feature shipped but
  was never actually read anywhere.
- **True deletion**: unchanged — still the existing 30-day soft-delete → hard-delete flow. A
  suspended-for-non-payment account is NOT auto-deleted; deletion still requires the user's own
  explicit request (or the existing 24-months-inactive path). Non-payment alone never triggers
  data deletion under this design — only suspension of the *paid-tier* features.

---

## 5. The Free-tier "30-day history" mechanism, precisely (superseded — see note)

> **Superseded 2026-07-23, before this was implemented.** The permanent Free tier described here
> never shipped — it was replaced with a single 7-day full-access trial (`TRIAL_LIMITS`: no
> history cap, everything unlocked) followed by a `locked: true` state (`LOCKED_LIMITS`:
> zeroed/false across the board) once the trial elapses with no paid subscription. There is no
> rolling 30-day filter in the shipped code — the design below is kept for historical rationale
> (why data is never deleted for tier reasons, why the ACWR engine is exempt from any tier-based
> filter) but the specific "add `.gte(..., 30 days)` per endpoint" mechanism it describes does not
> exist in `netlify/functions/utils/entitlements.js`. **Further corrected same day:** `locked`
> does NOT mean redirected-out/no-access — a locked account can still open the app and read
> whatever it already entered; only writes (`POST`/`PUT`/`PATCH`/`DELETE`) are refused (HTTP 402
> `subscription_required`), enforced once in `utils/base-handler.js` rather than per-endpoint. See
> `docs/SOURCE_OF_TRUTH.md` for the actual `getEntitlement()` contract and the frozen-mode
> mechanism.

Business Plan §2.1 already states this as a Free-tier limit. The mechanism (as originally
proposed — not what shipped):

- **No data is ever deleted or truncated because of tier.** `training_sessions`,
  `daily_wellness_checkin`, `readiness_scores`, `athlete_injuries`, RTP records — all keep
  accumulating regardless of subscription status. Deleting data because someone stopped paying
  would be both a bad product decision (punishes lapsed users, kills win-back conversion) and
  actively harmful to the ACWR engine, which needs a 21–28 day rolling window of continuous
  history to compute correctly — silently truncating a "free" user's window would produce wrong
  ACWR numbers for the very users least likely to notice or report it.
- Every read endpoint that returns historical data (`training_sessions`, `daily-load`, stats/trend
  views) calls `getEntitlement(userId)` and, if `tier === 'free'`, adds
  `.gte('date_column', now() - interval '30 days')` to its own query — a filter, applied at read
  time, on top of whatever the endpoint already does. This is a few lines per endpoint, using the
  entitlement helper's returned `historyDays` limit rather than each endpoint hardcoding `30`.
- The *engine* (ACWR/readiness computation) is explicitly exempt from this filter — it always
  reads the real window it needs (7/21/28 days) regardless of tier, because correctness of what an
  athlete is told (CLAUDE.md's safety-relevant-calculation rule) matters more than upsell
  friction, and because the numbers it computes are short-window anyway (well within even the
  free tier's 30 days in the common case).
- **Answer to "do they start over":** never, at any tier transition, in either direction. Nothing
  about this design has a concept of resetting an athlete's baseline.

---

## 6. What happens to `player_payments`

Recommendation: **retire it**, don't repair it. Reasoning:
- It has 0 live rows — there is no real data to migrate.
- Its own design (`payment.instructions` telling users to Venmo/Zelle/cash the coach) is a
  manual, out-of-band tracking feature — a fundamentally different product than "Stripe processes
  the charge and we record the result." Trying to make the old schema serve both purposes would
  produce exactly the kind of "two divergent paths for the same concept" bug this session already
  found and fixed twice today (Alert Engine's duplicate recovery-log tables, duplicate ACWR
  calculation).
- If manual/offline fee tracking (tournament entry fees, team dues collected in cash) is still a
  real need independent of Stripe subscriptions, that's a legitimate but *separate* feature — flag
  it to the user rather than conflating it with subscription billing (§9).
- Migration: `DROP TABLE player_payments` (or rename to `player_payments_deprecated` and leave it
  for one release cycle before dropping, if there's any concern about an in-flight integration
  I'm not aware of) + remove `payments-core.js`'s fee/payment endpoints, keep `sponsors.js`
  untouched (it's routed through the same `payments.js` file but is unrelated).

---

## 7. Minors and billing

- **Team Package billing never touches a minor's payment method at all** — the team
  manager/owner is the Stripe customer and pays for the whole roster (this already matches how
  Team Package is described in the business plan: "Team Manager subscribes for entire roster").
  A 14-year-old on a Team Package roster is never asked for a card.
- **Individual paid tiers (Athlete Pro) for a minor — RESOLVED, option 2, as built.** Stripe
  requires the cardholder to have contractual capacity, so a minor can never directly hold the
  subscription. Implemented: `stripe-checkout.js` blocks individual-tier checkout outright for any
  account under 18 (`ageFromDob()` on `date_of_birth ?? birth_date`, returning `403
  minor_account`); Team Package checkout is untouched by this check, since team billing never
  touches an individual's card. A minor still gets the same 7-day trial as everyone (trial access
  isn't gated on age — only *paid individual* checkout is), and any Team Package coverage from
  their roster is unaffected. Option 1 (a `billing` consent scope for guardian-authorized minor
  subscriptions) was not built — no fast-follow demand signal yet; revisit if it comes up.

---

## 8. Reconciling the retention-number inconsistency

`data-export.js`'s "3 years after deletion for legal compliance" line and the account-deletion
flow's 30-day hard-delete are not actually contradictory once you separate what they're each
about, but the current doc text conflates them:

- **30 days** = the *soft-delete grace window* (time to change your mind / cancel the deletion
  request) before personal/training data (`training_sessions`, `readiness_scores`, posts, etc.)
  is hard-deleted. This stays as-is.
- **3 years** (or whatever a jurisdiction's actual financial-record-keeping law requires — EU VAT
  invoice retention is typically 10 years in some member states, not 3; this needs a real
  compliance/legal check, flagged in §9) should apply **only to `invoices` and `subscriptions`
  rows** (financial records), which is exactly why `invoices`/`subscriptions` are *not* in
  `process_hard_deletion`'s table list in this design — they survive account hard-deletion,
  scrubbed of any direct PII beyond what Stripe itself already retains, for the legally-required
  financial-record period. `data-export.js`'s copy should be corrected to say this explicitly
  (right now it reads as if *all* data is kept 3 years post-deletion, which contradicts the 30-day
  flow it sits next to).
- Both `invoices` and `player_payments`(pre-retirement) being absent from `data-export.js`'s table
  list and `process_hard_deletion`'s table list is a real gap to close: add `invoices` (redacted
  of nothing — a user is entitled to their own billing history) to the GDPR export list, and
  explicitly document why it's *excluded* from hard-deletion (financial retention requirement) in
  a code comment, so a future reader doesn't "fix" that exclusion as a bug the way past-`80389b2`
  bugs in this codebase got fixed by someone who didn't know the reason.

---

## 9. Open decisions — RESOLVED (2026-07-23, same day as this proposal)

Per CLAUDE.md's own house rule on product/business decisions, each was flagged with a recommended
default rather than picked silently. All five came back from the user before implementation
started; the actual answer (not just the default) is recorded below for each.

1. **Who counts as a billable seat** (§3) — **RESOLVED: every active `team_members` row, all 13
   roles.** User's answer: *"Billable seat is every person who gets in."* This confirms the
   recommended default exactly as proposed — no roles are free roster add-ons. As built: every
   active row in `team_members` counts, unconditionally.
2. **Does a subscription keep billing during a voluntary pause** (§4) — **RESOLVED: yes, billing
   continues through any voluntary pause, and there is no retention discount on cancellation.**
   User's answer: *"Yes. There is no voluntary pause. And no discounts sad to see you go."* As
   built: `account-pause.js` still exists for the athlete-data-visibility behavior it already had,
   but pausing an account does **not** pause or discount the Stripe subscription — the only way to
   stop being billed is to cancel outright, and cancellation flows do not offer a retention
   discount.
3. **Minors + individual paid tiers** (§7) — **RESOLVED: option 2 (block individual paid-tier
   checkout for minors; Team Package unaffected), no billing-consent-scope guardian flow built.**
   See §7 above for the as-built behavior.
4. **Exact legal financial-record retention period** (§8) — **RESOLVED: 3 years, the existing
   number, confirmed acceptable.** User's answer: *"Is ok if you think its ok"* — the proposed
   default (3 years, already the number in `data-export.js`'s copy) stands. This is **not** a
   verified answer to the underlying EU VAT/tax-compliance question (the proposal's own caveat
   about member-state law requiring up to 10 years in some jurisdictions still applies) — it's the
   user accepting the engineering default rather than escalating to a real compliance review. If
   this app operates somewhere with a longer statutory requirement, this number needs a real legal
   check before that matters financially.
5. **Manual/offline fee tracking** (§6) — **RESOLVED: not built.** User's answer: *"I dont know,
   you decide"* — decided **not** to build a parallel cash/offline-fee-tracking feature.
   Reasoning: `player_payments` had 0 live rows and Stripe now covers all real subscription
   payments; a separate manual-fee feature (tournament entry fees, cash team dues) is new,
   unrequested scope, not a repair of the retired table. Revisit only if a real user need surfaces.

---

## 10. Suggested build order (maps onto the existing Q3 2026 MVP roadmap)

1. Schema: `billing_customers`, `subscriptions`, `invoices`, `team_members.is_billable_seat`.
2. `utils/entitlements.js` + wire it into the Free-tier 30-day read filter (lowest-risk, fully
   testable without any real Stripe traffic).
3. `stripe-checkout.js` + `stripe-webhook.js` for Athlete Pro + Team Package (Domestic) only —
   matches the plan's own Q3 2026 MVP scope, defers Coach Pro/Professional/National to their
   already-planned Q4 2026/Q1 2027 slots.
4. `stripe-portal.js` (self-service cancel/update card) before accepting a single real payment —
   this is a support-load and compliance requirement, not a nice-to-have.
5. `past_due_grace` → `suspended` lifecycle wired to webhook events, using Stripe's own retry
   schedule rather than building a custom one.
6. Seat-count sync trigger + queue-drain job (§3).
7. Retire `player_payments` + its endpoints.
8. Fix `data-export.js`/`process_hard_deletion` table-list gaps (§8).
9. Fix the dormant `acwr_frozen` flag while touching pause-related entitlement code (§4).

Each of these is small enough to be its own reviewable PR, consistent with the "small,
individually-revertible commits" house rule.
