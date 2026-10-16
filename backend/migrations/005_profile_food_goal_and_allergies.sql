alter table public.user_profiles
  add column if not exists food_goal text not null default 'Eat balanced',
  add column if not exists allergies jsonb not null default '[]'::jsonb;

update public.user_profiles
set food_goal = case
  when exists (
    select 1
    from jsonb_array_elements_text(coalesce(dietary_preferences, '[]'::jsonb)) as preference(value)
    where lower(preference.value) in ('weight loss', 'lose weight')
  ) then 'Lose weight'
  when exists (
    select 1
    from jsonb_array_elements_text(coalesce(dietary_preferences, '[]'::jsonb)) as preference(value)
    where lower(preference.value) in ('weight gain', 'gain weight', 'more protein')
  ) then 'Gain weight'
  else 'Eat balanced'
end
where exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'user_profiles'
    and column_name = 'dietary_preferences'
);

alter table public.user_profiles
  drop column if exists dietary_preferences;
