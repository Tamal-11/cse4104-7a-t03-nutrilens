create extension if not exists pgcrypto;

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  age int,
  gender text,
  height_cm numeric(5,2),
  weight_kg numeric(5,2),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.food_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  public_url text,
  mime_type text not null,
  size_bytes bigint,
  meal_type text,
  notes text,
  uploaded_at timestamp with time zone not null default now()
);

create table if not exists public.nutrition_catalog (
  id uuid primary key default gen_random_uuid(),
  food_name text not null unique,
  category text,
  serving_size text not null default '100 g',
  calories numeric(8,2),
  protein numeric(8,2),
  carbohydrates numeric(8,2),
  fats numeric(8,2),
  fiber numeric(8,2),
  vitamins jsonb not null default '[]'::jsonb,
  minerals jsonb not null default '[]'::jsonb,
  health_benefits jsonb not null default '[]'::jsonb,
  warnings jsonb not null default '[]'::jsonb,
  source_type text not null default 'mock',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.analysis_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  image_id uuid not null references public.food_images(id) on delete cascade,
  status text not null default 'pending',
  requested_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone
);

create table if not exists public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.analysis_requests(id) on delete cascade,
  matched_catalog_id uuid references public.nutrition_catalog(id) on delete set null,
  predicted_food_name text not null,
  confidence_score numeric(5,4),
  nutrition_snapshot jsonb not null default '{}'::jsonb,
  health_insights jsonb not null default '{}'::jsonb,
  model_name text,
  model_version text,
  is_mock boolean not null default true,
  created_at timestamp with time zone not null default now()
);
