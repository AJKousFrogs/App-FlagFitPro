create table if not exists public.athlete_nutrition_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  weight_kg numeric(5,2),
  height_cm numeric(5,2),
  age integer check (age is null or (age >= 5 and age <= 100)),
  sex text check (sex in ('male','female')),
  activity_level text,
  goal text,
  training_time text check (training_time in ('morning','afternoon','evening')),
  bmr numeric,
  tdee numeric,
  target_calories integer,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  calculated_profile jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  plan_type text,
  calories integer,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  fluid_l numeric,
  meals jsonb,
  start_date date,
  end_date date,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists nutrition_plans_one_active_per_user
  on public.nutrition_plans (user_id) where is_active;
create index if not exists idx_nutrition_plans_user_id on public.nutrition_plans (user_id);

create table if not exists public.meal_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  meal_type text,
  calories integer,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  ingredients jsonb,
  instructions text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
