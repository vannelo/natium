-- =============================================================================
-- NATIUM Entry — 0005 Export engine tables & audit log
-- =============================================================================
-- The export adapter itself is deferred until a real reference .mdb file is
-- analyzed (see docs/export-engine.md). The schema below is format-agnostic.

create table public.export_profiles (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name            text not null,
  format          text not null,            -- adapter key, e.g. 'mdb_meet_manager', 'csv_generic'
  config          jsonb not null default '{}'::jsonb,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.export_jobs (
  id                uuid primary key default gen_random_uuid(),
  competition_id    uuid not null references public.competitions (id),
  export_profile_id uuid references public.export_profiles (id),
  team_id           uuid references public.teams (id),   -- optional per-team export
  version           integer not null default 1,
  status            public.export_status not null default 'pending',
  file_path         text,                                  -- private storage path
  error_report      jsonb not null default '[]'::jsonb,
  requested_by      uuid not null references public.profiles (id),
  created_at        timestamptz not null default now(),
  completed_at      timestamptz
);
create index export_jobs_competition_idx on public.export_jobs (competition_id, created_at desc);

create table public.export_job_items (
  id              uuid primary key default gen_random_uuid(),
  export_job_id   uuid not null references public.export_jobs (id) on delete cascade,
  registration_id uuid not null references public.registrations (id),
  status          text not null default 'pending',
  message         text
);

-- ---------- audit log ---------------------------------------------------------
create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,          -- insert | update | delete | rpc:<name>
  entity      text not null,
  entity_id   text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_entity_idx on public.audit_logs (entity, entity_id);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

create or replace function public.audit_row_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  payload jsonb;
  target_id text;
begin
  if tg_op = 'DELETE' then
    payload := to_jsonb(old);
    target_id := old.id::text;
  elsif tg_op = 'UPDATE' then
    payload := jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new));
    target_id := new.id::text;
  else
    payload := to_jsonb(new);
    target_id := new.id::text;
  end if;
  insert into public.audit_logs (actor_id, action, entity, entity_id, metadata)
  values (auth.uid(), lower(tg_op), tg_table_name, target_id, payload);
  return coalesce(new, old);
end $$;

create trigger audit_teams after insert or update or delete on public.teams
  for each row execute function public.audit_row_change();
create trigger audit_athletes after insert or update or delete on public.athletes
  for each row execute function public.audit_row_change();
create trigger audit_competitions after insert or update or delete on public.competitions
  for each row execute function public.audit_row_change();
create trigger audit_registrations after insert or update or delete on public.registrations
  for each row execute function public.audit_row_change();
create trigger audit_export_jobs after insert or update or delete on public.export_jobs
  for each row execute function public.audit_row_change();

-- ---------- private storage buckets --------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('team-logos', 'team-logos', false, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('athlete-photos', 'athlete-photos', false, 3145728, array['image/png', 'image/jpeg', 'image/webp']),
  ('exports', 'exports', false, 52428800, null)
on conflict (id) do nothing;
