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

insert into public.nutrition_catalog (
  food_name,
  category,
  serving_size,
  calories,
  protein,
  carbohydrates,
  fats,
  fiber,
  vitamins,
  minerals,
  health_benefits,
  warnings,
  source_type
)
values (
  'Apple',
  'Fruit',
  '100 g',
  52,
  0.3,
  14,
  0.2,
  2.4,
  '["Vitamin C", "Vitamin K"]'::jsonb,
  '["Potassium"]'::jsonb,
  '["Supports digestion because it contains fiber", "Provides antioxidants"]'::jsonb,
  '["Excess consumption may cause bloating", "People with blood sugar problems should control portion size"]'::jsonb,
  'mock'
)
on conflict (food_name) do nothing;
