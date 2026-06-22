create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_nutrition_catalog_updated_at on public.nutrition_catalog;
create trigger set_nutrition_catalog_updated_at
before update on public.nutrition_catalog
for each row
execute function public.set_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (
    id,
    full_name,
    email,
    age,
    gender,
    height_cm,
    weight_kg
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    nullif(new.raw_user_meta_data ->> 'age', '')::int,
    nullif(new.raw_user_meta_data ->> 'gender', ''),
    nullif(new.raw_user_meta_data ->> 'height_cm', '')::numeric(5,2),
    nullif(new.raw_user_meta_data ->> 'weight_kg', '')::numeric(5,2)
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    age = excluded.age,
    gender = excluded.gender,
    height_cm = excluded.height_cm,
    weight_kg = excluded.weight_kg,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

alter table public.user_profiles enable row level security;
alter table public.food_images enable row level security;
alter table public.analysis_requests enable row level security;
alter table public.analysis_results enable row level security;

drop policy if exists "Users can view own profile" on public.user_profiles;
create policy "Users can view own profile"
on public.user_profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Users can update own profile" on public.user_profiles;
create policy "Users can update own profile"
on public.user_profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can view own food images" on public.food_images;
create policy "Users can view own food images"
on public.food_images
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own food images" on public.food_images;
create policy "Users can insert own food images"
on public.food_images
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can delete own food images" on public.food_images;
create policy "Users can delete own food images"
on public.food_images
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can view own analysis requests" on public.analysis_requests;
create policy "Users can view own analysis requests"
on public.analysis_requests
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own analysis requests" on public.analysis_requests;
create policy "Users can insert own analysis requests"
on public.analysis_requests
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can view own analysis results" on public.analysis_results;
create policy "Users can view own analysis results"
on public.analysis_results
for select
to authenticated
using (
  exists (
    select 1
    from public.analysis_requests ar
    where ar.id = analysis_results.request_id
      and ar.user_id = auth.uid()
  )
);
