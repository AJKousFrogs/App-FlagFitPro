alter table public.athlete_nutrition_profiles enable row level security;
alter table public.nutrition_plans enable row level security;
alter table public.meal_templates enable row level security;

create policy nutrition_profile_self on public.athlete_nutrition_profiles
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy nutrition_plans_self on public.nutrition_plans
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy meal_templates_read on public.meal_templates
  for select to authenticated using (true);

grant select, insert, update, delete on public.athlete_nutrition_profiles to authenticated, service_role;
grant select, insert, update, delete on public.nutrition_plans to authenticated, service_role;
grant select on public.meal_templates to authenticated;
grant select, insert, update, delete on public.meal_templates to service_role;
