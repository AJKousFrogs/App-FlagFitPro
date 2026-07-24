-- Payment/subscription system schema.
-- See docs/payments_billing_and_data_retention_proposal.md for the full design.
-- No Stripe account is connected in this environment yet -- these tables are
-- written to exclusively by stripe-webhook.js (service_role) once real Stripe
-- keys exist. Until then they simply stay empty and every user resolves to
-- the free tier via utils/entitlements.js.

-- ============================================================================
-- Billing customers -- one row per Stripe Customer, owned by exactly one of
-- an individual user (Athlete Pro / Coach Pro / Professional Freelancer) or
-- a team (Team Package). Never both for the same row.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.billing_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_customer_id text NOT NULL UNIQUE,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exactly_one_owner CHECK (
    (owner_user_id IS NOT NULL) <> (owner_team_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_billing_customers_owner_user
  ON public.billing_customers(owner_user_id) WHERE owner_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_billing_customers_owner_team
  ON public.billing_customers(owner_team_id) WHERE owner_team_id IS NOT NULL;

-- ============================================================================
-- Subscriptions -- one row per Stripe Subscription, kept in sync via webhook.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_customer_id uuid NOT NULL REFERENCES public.billing_customers(id) ON DELETE CASCADE,
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
  -- Set the first time status becomes past_due/unpaid; cleared when it
  -- returns to active. Drives the 14-day grace -> suspended lifecycle
  -- (T&C 7.5: "retry 3 times, suspend after 14 days unpaid").
  past_due_since timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_billing_customer
  ON public.subscriptions(billing_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_past_due
  ON public.subscriptions(past_due_since) WHERE past_due_since IS NOT NULL;

-- ============================================================================
-- Invoices -- audit trail. Deliberately NOT touched by process_hard_deletion
-- (see 20260723141000_wire_invoices_into_retention.sql) -- financial records
-- are retained past account deletion for legal compliance, unlike the
-- personal/training data that migration hard-deletes.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  stripe_invoice_id text NOT NULL UNIQUE,
  amount_due_cents integer NOT NULL,
  currency text NOT NULL,
  status text NOT NULL,
  hosted_invoice_url text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_subscription
  ON public.invoices(subscription_id);

-- ============================================================================
-- Seat billing -- who counts as a billable seat on a team, and the queue
-- that syncs team_members headcount to a team's Stripe subscription quantity.
-- ============================================================================

ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS is_billable_seat boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.team_members.is_billable_seat IS
  'Whether this roster row counts toward a team''s Stripe subscription seat quantity. Defaults to true for every role (the simplest defensible default -- see docs/payments_billing_and_data_retention_proposal.md §3/§9 for why this is flagged as a policy call, not a fixed engineering decision). Deliberately a column, not a hardcoded role list, so the policy can change without a migration.';

CREATE TABLE IF NOT EXISTS public.seat_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  error_message text
);

CREATE INDEX IF NOT EXISTS idx_seat_sync_queue_pending
  ON public.seat_sync_queue(requested_at) WHERE processed_at IS NULL;

-- Trigger: any change to team_members' billable headcount queues a re-sync.
-- The trigger itself cannot call the Stripe API (Postgres can't make
-- outbound HTTP calls) -- it only enqueues; a polling function drains the
-- queue and calls Stripe, same shape as the existing
-- get_deletions_ready_for_processing pattern.
CREATE OR REPLACE FUNCTION public.enqueue_seat_sync()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.seat_sync_queue (team_id)
  VALUES (COALESCE(NEW.team_id, OLD.team_id));
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER team_members_seat_sync_trigger
AFTER INSERT OR UPDATE OF status, is_billable_seat OR DELETE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_seat_sync();

REVOKE EXECUTE ON FUNCTION public.enqueue_seat_sync() FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE public.billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_sync_queue ENABLE ROW LEVEL SECURITY;

-- billing_customers: an individual sees their own; a team's owner/admin sees the team's.
CREATE POLICY "billing_customers_owner_read" ON public.billing_customers
  FOR SELECT
  USING (
    owner_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = billing_customers.owner_team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
        AND tm.status = 'active'
    )
  );

CREATE POLICY "subscriptions_owner_read" ON public.subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.billing_customers bc
      WHERE bc.id = subscriptions.billing_customer_id
        AND (
          bc.owner_user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = bc.owner_team_id
              AND tm.user_id = auth.uid()
              AND tm.role IN ('owner', 'admin')
              AND tm.status = 'active'
          )
        )
    )
  );

CREATE POLICY "invoices_owner_read" ON public.invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      INNER JOIN public.billing_customers bc ON bc.id = s.billing_customer_id
      WHERE s.id = invoices.subscription_id
        AND (
          bc.owner_user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = bc.owner_team_id
              AND tm.user_id = auth.uid()
              AND tm.role IN ('owner', 'admin')
              AND tm.status = 'active'
          )
        )
    )
  );

-- seat_sync_queue is purely internal (service_role only) -- no read/write
-- policy for regular users; RLS with zero policies means default-deny.

-- All writes to billing_customers/subscriptions/invoices happen via
-- supabaseAdmin (service_role) in stripe-webhook.js, which bypasses RLS by
-- design -- same pattern as generated_alerts (Alert Engine) and
-- rtp_phase_progress. No INSERT/UPDATE policy is defined for any role here.
