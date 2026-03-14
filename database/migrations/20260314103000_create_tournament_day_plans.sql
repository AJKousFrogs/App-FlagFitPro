-- Tournament day continuity state
-- Stores per-user tournament schedule and nutrition-window progress for the active day.

CREATE TABLE IF NOT EXISTS public.tournament_day_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    tournament_date DATE NOT NULL,
    tournament_name TEXT NOT NULL DEFAULT 'Tournament Day',
    games JSONB NOT NULL DEFAULT '[]'::jsonb,
    nutrition_windows JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT tournament_day_plans_user_date_unique UNIQUE (user_id, tournament_date)
);

CREATE INDEX IF NOT EXISTS idx_tournament_day_plans_user_date
    ON public.tournament_day_plans(user_id, tournament_date DESC);

ALTER TABLE public.tournament_day_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tournament_day_plans_own_select ON public.tournament_day_plans;
CREATE POLICY tournament_day_plans_own_select
    ON public.tournament_day_plans
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS tournament_day_plans_own_insert ON public.tournament_day_plans;
CREATE POLICY tournament_day_plans_own_insert
    ON public.tournament_day_plans
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS tournament_day_plans_own_update ON public.tournament_day_plans;
CREATE POLICY tournament_day_plans_own_update
    ON public.tournament_day_plans
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS tournament_day_plans_own_delete ON public.tournament_day_plans;
CREATE POLICY tournament_day_plans_own_delete
    ON public.tournament_day_plans
    FOR DELETE
    USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_tournament_day_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_tournament_day_plans_updated_at ON public.tournament_day_plans;
CREATE TRIGGER trigger_tournament_day_plans_updated_at
    BEFORE UPDATE ON public.tournament_day_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tournament_day_plans_updated_at();
