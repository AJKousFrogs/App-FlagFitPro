-- body_fat/muscle_percentage/body_water_percentage/protein_percentage/bone_mineral_percentage
-- were numeric(4,2), same overflow bug class fixed for readiness_scores in
-- 20260609115628 (a 0-100 scale hits exactly 100.00, which numeric(4,2) can't hold).
-- physical_measurements_latest depends on body_fat/body_water_percentage -> drop + recreate.
drop view public.physical_measurements_latest;

alter table public.physical_measurements
  alter column body_fat type numeric(5, 2),
  alter column muscle_percentage type numeric(5, 2),
  alter column body_water_percentage type numeric(5, 2),
  alter column protein_percentage type numeric(5, 2),
  alter column bone_mineral_percentage type numeric(5, 2);

create view public.physical_measurements_latest as
 SELECT DISTINCT ON (user_id) id,
    user_id,
    weight,
    height,
    body_fat,
    muscle_mass,
    body_water_percentage,
    visceral_fat_rating,
    basal_metabolic_rate,
    body_age,
    created_at,
    lag(weight) OVER (PARTITION BY user_id ORDER BY created_at) AS previous_weight,
    lag(body_fat) OVER (PARTITION BY user_id ORDER BY created_at) AS previous_body_fat
   FROM physical_measurements pm
  ORDER BY user_id, created_at DESC;

grant select, insert, update, delete, truncate, references, trigger
  on public.physical_measurements_latest to anon, authenticated, service_role, postgres;
