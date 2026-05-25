create table if not exists foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  image_url text,
  created_at timestamp with time zone default now()
);

create table if not exists nutrition_values (
  id uuid primary key default gen_random_uuid(),
  food_id uuid references foods(id) on delete cascade,
  serving_size text default '100g',
  calories numeric,
  protein numeric,
  carbohydrates numeric,
  fats numeric,
  fiber numeric,
  vitamins jsonb default '{}'::jsonb,
  minerals jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists analysis_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  food_name text,
  confidence numeric,
  result jsonb,
  created_at timestamp with time zone default now()
);
