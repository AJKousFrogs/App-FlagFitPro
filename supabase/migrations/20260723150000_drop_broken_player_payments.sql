-- Retire player_payments (0 live rows, broken write path).
-- payments-core.js read/wrote columns that never existed on this table
-- (payment_type, description, due_date, paid_at, reference_number,
-- receipt_url, created_by) and inserted rows without the two NOT NULL
-- columns the table actually has (tournament_id, payment_date) -- any real
-- insert through that code path would have failed outright. It was also a
-- manual/offline tracking feature (its own response told users to pay via
-- Venmo/Zelle/cash), a fundamentally different product than the Stripe
-- subscription billing in billing_and_subscriptions.sql. See
-- docs/payments_billing_and_data_retention_proposal.md §6.
--
-- No data migration needed -- confirmed 0 rows live before dropping.

DROP TABLE IF EXISTS public.player_payments;
