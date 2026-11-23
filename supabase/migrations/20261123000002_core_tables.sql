-- =============================================================================
-- NATIUM Entry — 0002 Core tables: profiles, organizations, teams, athletes
-- =============================================================================

-- ---------- utility: updated_at --------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- utility: text normalization (duplicate prevention) -------------
create or replace function public.normalize_text(input text)
returns text language sql immutable parallel safe as $$
  select regexp_replace(lower(extensions.unaccent(coalesce(input, ''))), '[^a-z0-9]+', ' ', 'g')
$$;

-- ---------- profiles --------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text not null default '',
  phone       text,
  role        public.app_role not null default 'coach',
  avatar_path text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.profiles is 'Application profile for each auth user. role is platform-wide.';

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile when a user signs up. Role comes from signup metadata
-- but is restricted to coach|organizer; platform_admin is granted manually.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data ->> 'role', 'coach');
  final_role public.app_role;
begin
  final_role := case when requested_role = 'organizer' then 'organizer'::public.app_role
                     else 'coach'::public.app_role end;
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''), final_role)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- organizations (organizers) --------------------------------------
create table public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  contact_email text,
  city          text,
  state         text,
  country       text not null default 'MX',
  is_active     boolean not null default true,
  created_by    uuid not null references public.profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_organizations_updated before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id         uuid not null references public.profiles (id) on delete cascade,
  role            public.org_role not null default 'member',
  created_at      timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index organization_members_user_idx on public.organization_members (user_id);

-- Creator becomes owner automatically.
create or replace function public.handle_new_organization()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict do nothing;
  return new;
end $$;
create trigger on_organization_created after insert on public.organizations
  for each row execute function public.handle_new_organization();

-- ---------- teams -----------------------------------------------------------
create table public.teams (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  name_normalized text not null default '',  -- set by trigger
  short_name      text not null,
  code            text,                      -- external code required by some organizers
  city            text,
  state           text,
  country         text not null default 'MX',
  contact_name    text,
  contact_email   text,
  contact_phone   text,
  logo_path       text,
  is_active       boolean not null default true,
  created_by      uuid not null references public.profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint teams_name_len check (char_length(name) between 2 and 120),
  constraint teams_short_name_len check (char_length(short_name) between 1 and 20)
);
-- Prevent duplicate teams created by typos (accent/case-insensitive).
create unique index teams_name_normalized_key on public.teams (name_normalized);
create unique index teams_code_key on public.teams (upper(code)) where code is not null;
create index teams_name_trgm_idx on public.teams using gin (name_normalized extensions.gin_trgm_ops);

create or replace function public.teams_before_write()
returns trigger language plpgsql as $$
begin
  new.name_normalized := public.normalize_text(new.name);
  new.updated_at := now();
  return new;
end $$;
create trigger trg_teams_before_write before insert or update on public.teams
  for each row execute function public.teams_before_write();

create table public.team_members (
  team_id      uuid not null references public.teams (id) on delete cascade,
  user_id      uuid not null references public.profiles (id) on delete cascade,
  role         public.team_role not null default 'coach',
  status       public.membership_status not null default 'pending',
  requested_at timestamptz not null default now(),
  decided_at   timestamptz,
  decided_by   uuid references public.profiles (id),
  primary key (team_id, user_id)
);
create index team_members_user_idx on public.team_members (user_id);

-- Creator becomes approved owner automatically.
create or replace function public.handle_new_team()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.team_members (team_id, user_id, role, status, decided_at, decided_by)
  values (new.id, new.created_by, 'owner', 'approved', now(), new.created_by)
  on conflict do nothing;
  return new;
end $$;
create trigger on_team_created after insert on public.teams
  for each row execute function public.handle_new_team();

-- ---------- athletes --------------------------------------------------------
create sequence public.athlete_display_seq start 1000;

create table public.athletes (
  id              uuid primary key default gen_random_uuid(),
  display_id      text not null unique default ('ATL-' || lpad(nextval('public.athlete_display_seq')::text, 6, '0')),
  first_name      text not null,
  last_name       text not null,
  name_normalized text not null default '',  -- set by trigger
  birth_date      date not null,
  sex             public.athlete_sex not null,
  team_id         uuid not null references public.teams (id),
  photo_path      text,
  status          public.record_status not null default 'active',
  created_by      uuid not null references public.profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint athletes_birth_date_sane check (birth_date > date '1900-01-01' and birth_date <= current_date),
  constraint athletes_first_name_len check (char_length(first_name) between 1 and 80),
  constraint athletes_last_name_len check (char_length(last_name) between 1 and 120)
);
comment on table public.athletes is 'Permanent athlete record. Never hard-deleted once it has registrations.';
-- Exact duplicate guard inside a team (same normalized name + birth date).
create unique index athletes_team_identity_key on public.athletes (team_id, name_normalized, birth_date);
create index athletes_team_idx on public.athletes (team_id, status);
create index athletes_name_trgm_idx on public.athletes using gin (name_normalized extensions.gin_trgm_ops);

create or replace function public.athletes_before_write()
returns trigger language plpgsql as $$
begin
  new.name_normalized := public.normalize_text(new.first_name || ' ' || new.last_name);
  new.updated_at := now();
  return new;
end $$;
create trigger trg_athletes_before_write before insert or update on public.athletes
  for each row execute function public.athletes_before_write();

-- Team history for athletes (transfers keep past registrations intact).
create table public.athlete_team_memberships (
  id         uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  team_id    uuid not null references public.teams (id),
  joined_at  date not null default current_date,
  left_at    date,
  constraint athlete_membership_dates check (left_at is null or left_at >= joined_at)
);
create index athlete_team_memberships_athlete_idx on public.athlete_team_memberships (athlete_id);
create unique index athlete_team_memberships_current_key
  on public.athlete_team_memberships (athlete_id) where left_at is null;

create or replace function public.athletes_track_team()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.athlete_team_memberships (athlete_id, team_id) values (new.id, new.team_id);
  elsif new.team_id is distinct from old.team_id then
    update public.athlete_team_memberships set left_at = current_date
      where athlete_id = new.id and left_at is null;
    insert into public.athlete_team_memberships (athlete_id, team_id) values (new.id, new.team_id);
  end if;
  return new;
end $$;
create trigger trg_athletes_track_team after insert or update of team_id on public.athletes
  for each row execute function public.athletes_track_team();
