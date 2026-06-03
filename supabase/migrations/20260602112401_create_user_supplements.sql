-- The supplements read path (getUserSupplements) queries user_supplements for an
-- athlete's curated stack, but the table was never created — the query silently
-- returned []. Create it so the custom stack + "Add supplement" CTA have a home.
-- Applied via Supabase MCP (schema_migrations version 20260602112401); mirrored here.
CREATE TABLE IF NOT EXISTS public.user_supplements (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        varchar(100) NOT NULL,
  dosage      varchar(100),
  timing      varchar(50)  NOT NULL DEFAULT 'anytime',
  category    varchar(50)  NOT NULL DEFAULT 'other',
  active       boolean      NOT NULL DEFAULT true,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT user_supplements_user_name_uniq UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_user_supplements_user_active
  ON public.user_supplements (user_id) WHERE active;

ALTER TABLE public.user_supplements ENABLE ROW LEVEL SECURITY;

-- Self-scoped, mirrors supplement_logs_own (athlete owns their own stack).
CREATE POLICY user_supplements_own ON public.user_supplements
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
