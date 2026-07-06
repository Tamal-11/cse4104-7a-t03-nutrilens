alter table public.user_profiles
  add column if not exists health_conditions jsonb not null default '[]'::jsonb,
  add column if not exists dietary_preferences jsonb not null default '[]'::jsonb,
  add column if not exists account_status text not null default 'Active',
  add column if not exists last_active_at timestamptz not null default now();

alter table public.analysis_results
  alter column is_mock set default false;

alter table public.nutrition_catalog
  alter column source_type set default 'manual';

delete from public.nutrition_catalog where source_type = 'mock';

create table if not exists public.system_events (
  id bigint generated always as identity primary key,
  level text not null default 'INFO',
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists system_events_created_idx
  on public.system_events(created_at desc);
