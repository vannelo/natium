-- =============================================================================
-- NATIUM Entry — 0004 Registrations, entries, marks, status history
-- =============================================================================

create table public.registrations (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid not null references public.competitions (id),
  team_id        uuid not null references public.teams (id),
  status         public.registration_status not null default 'draft',
  folio          text unique,                          -- assigned on first submission
  submitted_at   timestamptz,
  submitted_by   uuid references public.profiles (id),
  review_note    text,                                  -- organizer's correction/rejection reason
  created_by     uuid not null references public.profiles (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  -- One registration per team per competition: prevents duplicate submissions.
  unique (competition_id, team_id)
);
create index registrations_team_idx on public.registrations (team_id, status);
create index registrations_competition_idx on public.registrations (competition_id, status);
create trigger trg_registrations_updated before update on public.registrations
  for each row execute function public.set_updated_at();

create table public.registration_athletes (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations (id) on delete cascade,
  athlete_id      uuid not null references public.athletes (id),
  category_id     uuid references public.competition_categories (id),  -- snapshot at submission
  created_at      timestamptz not null default now(),
  unique (registration_id, athlete_id)
);
create index registration_athletes_athlete_idx on public.registration_athletes (athlete_id);

-- Entry times are stored as integer centiseconds (hundredths). Never floats.
create table public.registration_entries (
  id                      uuid primary key default gen_random_uuid(),
  registration_id         uuid not null references public.registrations (id) on delete cascade,
  registration_athlete_id uuid not null references public.registration_athletes (id) on delete cascade,
  competition_event_id    uuid not null references public.competition_events (id),
  entry_time_cs           integer check (entry_time_cs is null or (entry_time_cs > 0 and entry_time_cs < 360000)),
  no_time                 boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint entries_time_or_nt check ((no_time and entry_time_cs is null) or (not no_time and entry_time_cs is not null) or (not no_time and entry_time_cs is null)),
  unique (registration_athlete_id, competition_event_id)
);
create index registration_entries_registration_idx on public.registration_entries (registration_id);
create trigger trg_registration_entries_updated before update on public.registration_entries
  for each row execute function public.set_updated_at();

-- Full audit of state transitions.
create table public.registration_status_history (
  id              uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations (id) on delete cascade,
  from_status     public.registration_status,
  to_status       public.registration_status not null,
  changed_by      uuid references public.profiles (id),
  changed_at      timestamptz not null default now(),
  reason          text
);
create index registration_status_history_reg_idx on public.registration_status_history (registration_id, changed_at desc);

-- Historical best marks: separate from entry times. Entry times never
-- overwrite a best mark automatically (see docs/registrations.md).
create table public.athlete_marks (
  id               uuid primary key default gen_random_uuid(),
  athlete_id       uuid not null references public.athletes (id) on delete cascade,
  event_catalog_id uuid not null references public.event_catalog (id),
  pool_course      public.pool_course not null,
  time_cs          integer not null check (time_cs > 0 and time_cs < 360000),
  source           public.mark_source not null default 'manual',
  competition_id   uuid references public.competitions (id),
  recorded_at      date not null default current_date,
  created_by       uuid references public.profiles (id),
  created_at       timestamptz not null default now()
);
create index athlete_marks_lookup_idx on public.athlete_marks (athlete_id, event_catalog_id, pool_course, time_cs);

-- Athlete custom field values captured for a competition's requirements.
create table public.athlete_custom_values (
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  field_id   uuid not null references public.competition_custom_fields (id) on delete cascade,
  value      jsonb,
  updated_at timestamptz not null default now(),
  primary key (athlete_id, field_id)
);

-- ---------- state machine guard ---------------------------------------------
-- Allowed transitions. Enforced by trigger so no client can bypass them.
create or replace function public.registration_transition_allowed(
  p_from public.registration_status, p_to public.registration_status
) returns boolean language sql immutable as $$
  select (p_from, p_to) in (
    ('draft', 'submitted'),
    ('needs_correction', 'submitted'),
    ('submitted', 'in_review'),
    ('submitted', 'accepted'),
    ('submitted', 'needs_correction'),
    ('submitted', 'rejected'),
    ('in_review', 'accepted'),
    ('in_review', 'needs_correction'),
    ('in_review', 'rejected'),
    ('accepted', 'exported'),
    ('accepted', 'in_review'),      -- organizer reopens before export
    ('exported', 'in_review'),      -- controlled post-export change (organizer only)
    ('rejected', 'in_review')
  )
$$;

create or replace function public.registrations_guard()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if not public.registration_transition_allowed(old.status, new.status) then
      raise exception 'Transición de estado no permitida: % → %', old.status, new.status
        using errcode = 'check_violation';
    end if;
  end if;
  -- competition/team are immutable after creation
  if new.competition_id <> old.competition_id or new.team_id <> old.team_id then
    raise exception 'No se puede cambiar la competencia o el equipo de una inscripción'
      using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger trg_registrations_guard before update on public.registrations
  for each row execute function public.registrations_guard();

-- Entries / athletes of a registration are editable only while the registration is
-- draft or needs_correction. Everything else requires an organizer transition first.
create or replace function public.registration_editable(p_registration_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.registrations r
    where r.id = p_registration_id and r.status in ('draft', 'needs_correction')
  )
$$;

create or replace function public.registration_children_guard()
returns trigger language plpgsql as $$
declare
  reg uuid := coalesce(new.registration_id, old.registration_id);
begin
  if not public.registration_editable(reg) then
    raise exception 'La inscripción no se puede modificar en su estado actual'
      using errcode = 'check_violation';
  end if;
  return coalesce(new, old);
end $$;
create trigger trg_registration_athletes_guard before insert or update or delete on public.registration_athletes
  for each row execute function public.registration_children_guard();
create trigger trg_registration_entries_guard before insert or update or delete on public.registration_entries
  for each row execute function public.registration_children_guard();
