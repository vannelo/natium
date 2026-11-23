-- =============================================================================
-- NATIUM Entry — 0003 Competitions, categories, event catalog, custom fields
-- =============================================================================

-- Global, configurable catalog of events (distance + stroke). Organizers enable
-- a subset per competition through competition_events.
create table public.event_catalog (
  id            uuid primary key default gen_random_uuid(),
  distance_m    integer not null check (distance_m > 0 and distance_m <= 10000),
  stroke        public.stroke not null,
  name          text not null,              -- e.g. "50 m libre"
  external_code text,                       -- compatibility id for exporters
  is_relay      boolean not null default false,
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  unique (distance_m, stroke, is_relay)
);

create table public.competitions (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null references public.organizations (id),
  name                   text not null check (char_length(name) between 3 and 160),
  code                   text not null check (code ~ '^[A-Z0-9-]{2,12}$'),
  description            text,
  start_date             date not null,
  end_date               date not null,
  venue                  text,
  city                   text,
  registration_opens_at  timestamptz not null,
  registration_closes_at timestamptz not null,
  pool_course            public.pool_course not null default 'SCM',
  pool_length_m          integer not null default 25 check (pool_length_m > 0),
  age_reference_date     date,                    -- defaults to start_date when null
  max_entries_per_athlete integer check (max_entries_per_athlete is null or max_entries_per_athlete > 0),
  allow_no_time          boolean not null default false,
  requirements           text,
  status                 public.competition_status not null default 'draft',
  folio_seq              integer not null default 0,  -- per-competition registration folio counter
  created_by             uuid not null references public.profiles (id),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint competitions_dates check (end_date >= start_date),
  constraint competitions_registration_window check (registration_closes_at > registration_opens_at),
  unique (organization_id, code)
);
create index competitions_status_idx on public.competitions (status, registration_closes_at);
create trigger trg_competitions_updated before update on public.competitions
  for each row execute function public.set_updated_at();

-- Age categories are defined per competition; nothing is hard-coded.
create table public.competition_categories (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions (id) on delete cascade,
  name           text not null,
  code           text,
  sex            public.athlete_sex,                -- null = any
  min_age        integer not null default 0 check (min_age >= 0),
  max_age        integer not null default 99 check (max_age >= 0),
  sort_order     integer not null default 0,
  constraint categories_age_range check (max_age >= min_age),
  unique (competition_id, name, sex)
);
create index competition_categories_comp_idx on public.competition_categories (competition_id);

-- Events enabled for a competition.
create table public.competition_events (
  id               uuid primary key default gen_random_uuid(),
  competition_id   uuid not null references public.competitions (id) on delete cascade,
  event_catalog_id uuid not null references public.event_catalog (id),
  event_number     integer,
  sex              public.athlete_sex,              -- null = mixed / any
  category_id      uuid references public.competition_categories (id) on delete cascade, -- null = all categories
  external_code    text,
  is_active        boolean not null default true,
  sort_order       integer not null default 0,
  unique (competition_id, event_catalog_id, sex, category_id)
);
create index competition_events_comp_idx on public.competition_events (competition_id, is_active);

-- Organizer-defined additional athlete fields (type + validation rules).
create table public.competition_custom_fields (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions (id) on delete cascade,
  key            text not null check (key ~ '^[a-z][a-z0-9_]{1,40}$'),
  label          text not null,
  field_type     public.custom_field_type not null default 'text',
  is_required    boolean not null default false,
  options        jsonb,                              -- for 'select': ["A","B"]
  validation     jsonb,                              -- e.g. {"pattern": "^[A-Z]{3}$", "min": 0}
  justification  text,                               -- why this personal data is needed
  sort_order     integer not null default 0,
  unique (competition_id, key)
);

-- ---------- helpers ----------------------------------------------------------
create or replace function public.age_on(birth date, reference date)
returns integer language sql immutable parallel safe as $$
  select extract(year from age(reference, birth))::integer
$$;

-- Resolve category for an athlete in a competition. Returns null when none fits.
create or replace function public.resolve_category(p_competition_id uuid, p_athlete_id uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select c.id
  from public.competition_categories c
  join public.competitions comp on comp.id = c.competition_id
  join public.athletes a on a.id = p_athlete_id
  where c.competition_id = p_competition_id
    and (c.sex is null or c.sex = a.sex)
    and public.age_on(a.birth_date, coalesce(comp.age_reference_date, comp.start_date)) between c.min_age and c.max_age
  order by c.sort_order, c.min_age
  limit 1
$$;

-- Events an athlete may enter in a competition (sex + category compatible).
create or replace function public.eligible_events(p_competition_id uuid, p_athlete_id uuid)
returns setof public.competition_events language sql stable security definer set search_path = public as $$
  select e.*
  from public.competition_events e
  join public.athletes a on a.id = p_athlete_id
  where e.competition_id = p_competition_id
    and e.is_active
    and (e.sex is null or e.sex = a.sex)
    and (e.category_id is null or e.category_id = public.resolve_category(p_competition_id, p_athlete_id))
  order by e.sort_order, e.event_number
$$;
