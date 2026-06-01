-- Out-of-band seed (applied via execute_sql). Idempotent.
insert into public.meal_templates (name, category, meal_type, calories, protein_g, carbs_g, fat_g, ingredients, instructions)
values
 ('Pre-game oats & banana', 'endurance', 'pre-game', 520, 18, 95, 8,
   '["80g rolled oats","1 banana","300ml milk","1 tbsp honey"]'::jsonb,
   'Eat 2-3h before kickoff. High-carb, low-fat to top up glycogen.'),
 ('Post-game chicken rice bowl', 'recovery', 'post-game', 680, 45, 78, 18,
   '["180g chicken breast","200g cooked rice","mixed veg","olive oil"]'::jsonb,
   'Within 60min of final game: ~1.2g/kg carbs + 0.3g/kg protein to refuel and repair.'),
 ('Match-day breakfast', 'performance', 'breakfast', 600, 30, 80, 16,
   '["3 eggs","2 slices wholegrain toast","avocado","orange juice"]'::jsonb,
   'Balanced start on a game day; finish 3h before warm-up.'),
 ('Recovery protein shake', 'recovery', 'snack', 280, 30, 30, 4,
   '["1 scoop whey","300ml milk","1 banana"]'::jsonb,
   'Quick option between tournament games when appetite is low.')
on conflict do nothing;
