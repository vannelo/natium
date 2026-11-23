-- =============================================================================
-- NATIUM Entry — 0006 Authorization helpers & RPC (business rules live here)
-- =============================================================================

-- ---------- authorization helpers (used by RLS and RPC) ----------------------
create or replace function public.current_app_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'platform_admin' from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_org_member(p_org_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = p_org_id and m.user_id = auth.uid()
  )
$$;

create or replace function public.is_team_member(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.team_members m
    where m.team_id = p_team_id and m.user_id = auth.uid() and m.status = 'approved'
  )
$$;

create or replace function public.is_team_owner(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.team_members m
    where m.team_id = p_team_id and m.user_id = auth.uid() and m.status = 'approved' and m.role = 'owner'
  )
$$;

create or replace function public.is_competition_organizer(p_competition_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.competitions c
    join public.organization_members m on m.organization_id = c.organization_id
    where c.id = p_competition_id and m.user_id = auth.uid()
  )
$$;

-- Organizer can see a team/athlete when that team has a non-draft registration
-- in one of the organizer's competitions.
create or replace function public.organizer_can_see_team(p_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.registrations r
    join public.competitions c on c.id = r.competition_id
    join public.organization_members m on m.organization_id = c.organization_id
    where r.team_id = p_team_id and r.status <> 'draft' and m.user_id = auth.uid()
  )
$$;

create or replace function public.organizer_can_see_athlete(p_athlete_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.registration_athletes ra
    join public.registrations r on r.id = ra.registration_id
    join public.competitions c on c.id = r.competition_id
    join public.organization_members m on m.organization_id = c.organization_id
    where ra.athlete_id = p_athlete_id and r.status <> 'draft' and m.user_id = auth.uid()
  )
$$;

create or replace function public.can_access_registration(p_registration_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.registrations r
    where r.id = p_registration_id
      and (public.is_team_member(r.team_id)
           or (r.status <> 'draft' and public.is_competition_organizer(r.competition_id))
           or public.is_platform_admin())
  )
$$;

-- ---------- audit helper for RPCs --------------------------------------------
create or replace function public.log_action(p_action text, p_entity text, p_entity_id uuid, p_meta jsonb default null)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_logs (actor_id, action, entity, entity_id, metadata)
  values (auth.uid(), p_action, p_entity, p_entity_id::text, p_meta)
$$;

-- ---------- teams: access requests -------------------------------------------
create or replace function public.request_team_access(p_team_id uuid)
returns public.team_members language plpgsql security definer set search_path = public as $$
declare
  result public.team_members;
begin
  if auth.uid() is null then raise exception 'No autenticado' using errcode = '42501'; end if;
  insert into public.team_members (team_id, user_id, role, status)
  values (p_team_id, auth.uid(), 'coach', 'pending')
  on conflict (team_id, user_id) do update
    set status = case when public.team_members.status in ('rejected', 'revoked') then 'pending'::public.membership_status
                      else public.team_members.status end,
        requested_at = now()
  returning * into result;
  perform public.log_action('rpc:request_team_access', 'team_members', p_team_id);
  return result;
end $$;

create or replace function public.decide_team_access(p_team_id uuid, p_user_id uuid, p_approve boolean)
returns public.team_members language plpgsql security definer set search_path = public as $$
declare
  result public.team_members;
begin
  if not (public.is_team_owner(p_team_id) or public.is_platform_admin()) then
    raise exception 'Sin permiso para administrar este equipo' using errcode = '42501';
  end if;
  update public.team_members
    set status = case when p_approve then 'approved'::public.membership_status else 'rejected'::public.membership_status end,
        decided_at = now(), decided_by = auth.uid()
    where team_id = p_team_id and user_id = p_user_id
    returning * into result;
  if not found then raise exception 'Solicitud no encontrada' using errcode = 'P0002'; end if;
  perform public.log_action('rpc:decide_team_access', 'team_members', p_team_id,
    jsonb_build_object('user_id', p_user_id, 'approved', p_approve));
  return result;
end $$;

create or replace function public.revoke_team_access(p_team_id uuid, p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.is_team_owner(p_team_id) or public.is_platform_admin()) then
    raise exception 'Sin permiso para administrar este equipo' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'No puedes revocar tu propio acceso de propietario' using errcode = 'check_violation';
  end if;
  update public.team_members set status = 'revoked', decided_at = now(), decided_by = auth.uid()
    where team_id = p_team_id and user_id = p_user_id;
  perform public.log_action('rpc:revoke_team_access', 'team_members', p_team_id, jsonb_build_object('user_id', p_user_id));
end $$;

-- Directory search for teams (limited columns, so coaches can find and request access).
create or replace function public.search_teams_directory(p_query text)
returns table (id uuid, name text, short_name text, city text, state text, is_active boolean, similarity real)
language sql stable security definer set search_path = public as $$
  select t.id, t.name, t.short_name, t.city, t.state, t.is_active,
         extensions.word_similarity(public.normalize_text(p_query), t.name_normalized) as similarity
  from public.teams t
  where auth.uid() is not null
    and (p_query is null or p_query = ''
         or extensions.word_similarity(public.normalize_text(p_query), t.name_normalized) > 0.4
         or t.name_normalized like '%' || public.normalize_text(p_query) || '%')
  order by similarity desc, t.name
  limit 20
$$;

-- ---------- athletes: duplicate detection ------------------------------------
create or replace function public.find_similar_athletes(
  p_team_id uuid, p_first_name text, p_last_name text, p_birth_date date default null
) returns table (id uuid, display_id text, first_name text, last_name text, birth_date date, similarity real)
language sql stable security definer set search_path = public as $$
  select a.id, a.display_id, a.first_name, a.last_name, a.birth_date,
         extensions.similarity(a.name_normalized, public.normalize_text(p_first_name || ' ' || p_last_name)) as similarity
  from public.athletes a
  where public.is_team_member(p_team_id)
    and a.team_id = p_team_id
    and (
      extensions.similarity(a.name_normalized, public.normalize_text(p_first_name || ' ' || p_last_name)) > 0.45
      or (p_birth_date is not null and a.birth_date = p_birth_date
          and extensions.similarity(a.name_normalized, public.normalize_text(p_first_name || ' ' || p_last_name)) > 0.25)
    )
  order by similarity desc
  limit 5
$$;

-- ---------- registrations ----------------------------------------------------
-- Get or create the draft registration of a team for a competition (idempotent;
-- the unique constraint guarantees concurrent calls return the same row).
create or replace function public.get_or_create_registration(p_competition_id uuid, p_team_id uuid)
returns public.registrations language plpgsql security definer set search_path = public as $$
declare
  result public.registrations;
  comp public.competitions;
begin
  if not public.is_team_member(p_team_id) then
    raise exception 'No perteneces a este equipo' using errcode = '42501';
  end if;
  select * into comp from public.competitions where id = p_competition_id;
  if comp.id is null then raise exception 'Competencia no encontrada' using errcode = 'P0002'; end if;
  if comp.status <> 'published' then
    raise exception 'La competencia no acepta inscripciones' using errcode = 'check_violation';
  end if;
  insert into public.registrations (competition_id, team_id, created_by)
  values (p_competition_id, p_team_id, auth.uid())
  on conflict (competition_id, team_id) do update set updated_at = now()
  returning * into result;
  return result;
end $$;

-- Validation issues for a registration. Returns a JSON array of
-- {level: 'error'|'warning', code, message, athlete_id?, entry_id?}.
create or replace function public.validate_registration(p_registration_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  reg public.registrations;
  comp public.competitions;
  issues jsonb := '[]'::jsonb;
  r record;
begin
  if not public.can_access_registration(p_registration_id) then
    raise exception 'Sin acceso a la inscripción' using errcode = '42501';
  end if;
  select * into reg from public.registrations where id = p_registration_id;
  select * into comp from public.competitions where id = reg.competition_id;

  if comp.status <> 'published' then
    issues := issues || jsonb_build_object('level', 'error', 'code', 'competition_closed',
      'message', 'La competencia no está abierta a inscripciones.');
  elsif now() < comp.registration_opens_at then
    issues := issues || jsonb_build_object('level', 'error', 'code', 'registration_not_open',
      'message', 'El periodo de inscripción aún no inicia.');
  elsif now() > comp.registration_closes_at then
    issues := issues || jsonb_build_object('level', 'error', 'code', 'registration_closed',
      'message', 'El periodo de inscripción ha terminado.');
  end if;

  if not exists (select 1 from public.registration_athletes where registration_id = p_registration_id) then
    issues := issues || jsonb_build_object('level', 'error', 'code', 'no_athletes',
      'message', 'Debes seleccionar al menos un nadador.');
  end if;

  for r in
    select ra.id as ra_id, a.id as athlete_id, a.first_name || ' ' || a.last_name as athlete_name, a.status,
           public.resolve_category(comp.id, a.id) as category_id,
           (select count(*) from public.registration_entries e where e.registration_athlete_id = ra.id) as entry_count
    from public.registration_athletes ra
    join public.athletes a on a.id = ra.athlete_id
    where ra.registration_id = p_registration_id
  loop
    if r.status <> 'active' then
      issues := issues || jsonb_build_object('level', 'error', 'code', 'athlete_inactive', 'athlete_id', r.athlete_id,
        'message', r.athlete_name || ': el expediente está inactivo.');
    end if;
    if r.category_id is null and exists (select 1 from public.competition_categories where competition_id = comp.id) then
      issues := issues || jsonb_build_object('level', 'error', 'code', 'no_category', 'athlete_id', r.athlete_id,
        'message', r.athlete_name || ': no corresponde a ninguna categoría de la competencia.');
    end if;
    if r.entry_count = 0 then
      issues := issues || jsonb_build_object('level', 'error', 'code', 'no_entries', 'athlete_id', r.athlete_id,
        'message', r.athlete_name || ': no tiene pruebas asignadas.');
    end if;
    if comp.max_entries_per_athlete is not null and r.entry_count > comp.max_entries_per_athlete then
      issues := issues || jsonb_build_object('level', 'error', 'code', 'too_many_entries', 'athlete_id', r.athlete_id,
        'message', r.athlete_name || ': excede el máximo de ' || comp.max_entries_per_athlete || ' pruebas.');
    end if;
    -- athlete registered by another team in the same competition
    if exists (
      select 1 from public.registration_athletes ra2
      join public.registrations r2 on r2.id = ra2.registration_id
      where ra2.athlete_id = r.athlete_id and r2.competition_id = comp.id
        and r2.id <> p_registration_id and r2.status <> 'draft'
    ) then
      issues := issues || jsonb_build_object('level', 'warning', 'code', 'athlete_in_other_team', 'athlete_id', r.athlete_id,
        'message', r.athlete_name || ': ya aparece inscrito por otro equipo en esta competencia.');
    end if;
  end loop;

  for r in
    select e.id as entry_id, a.id as athlete_id, a.first_name || ' ' || a.last_name as athlete_name,
           ec.name as event_name, e.entry_time_cs, e.no_time, ce.id as ce_id
    from public.registration_entries e
    join public.registration_athletes ra on ra.id = e.registration_athlete_id
    join public.athletes a on a.id = ra.athlete_id
    join public.competition_events ce on ce.id = e.competition_event_id
    join public.event_catalog ec on ec.id = ce.event_catalog_id
    where e.registration_id = p_registration_id
  loop
    if r.entry_time_cs is null and not r.no_time then
      issues := issues || jsonb_build_object('level', 'error', 'code', 'missing_time', 'athlete_id', r.athlete_id, 'entry_id', r.entry_id,
        'message', r.athlete_name || ' · ' || r.event_name || ': falta el tiempo de inscripción.');
    elsif r.no_time and not comp.allow_no_time then
      issues := issues || jsonb_build_object('level', 'error', 'code', 'no_time_not_allowed', 'athlete_id', r.athlete_id, 'entry_id', r.entry_id,
        'message', r.athlete_name || ' · ' || r.event_name || ': la competencia no permite inscripciones sin tiempo.');
    end if;
    if not exists (select 1 from public.eligible_events(comp.id, r.athlete_id) ee where ee.id = r.ce_id) then
      issues := issues || jsonb_build_object('level', 'error', 'code', 'event_not_eligible', 'athlete_id', r.athlete_id, 'entry_id', r.entry_id,
        'message', r.athlete_name || ' · ' || r.event_name || ': la prueba no corresponde a su sexo o categoría.');
    end if;
  end loop;

  return issues;
end $$;

-- Submit (or re-submit) a registration. Transactional: validates, assigns folio,
-- snapshots categories, transitions status, writes history and audit.
create or replace function public.submit_registration(p_registration_id uuid)
returns public.registrations language plpgsql security definer set search_path = public as $$
declare
  reg public.registrations;
  comp public.competitions;
  issues jsonb;
  errors int;
  new_folio text;
  prev public.registration_status;
begin
  select * into reg from public.registrations where id = p_registration_id for update;
  if reg.id is null then raise exception 'Inscripción no encontrada' using errcode = 'P0002'; end if;
  if not public.is_team_member(reg.team_id) then
    raise exception 'No perteneces a este equipo' using errcode = '42501';
  end if;
  if reg.status not in ('draft', 'needs_correction') then
    raise exception 'La inscripción ya fue enviada' using errcode = 'check_violation';
  end if;

  issues := public.validate_registration(p_registration_id);
  select count(*) into errors from jsonb_array_elements(issues) i where i ->> 'level' = 'error';
  if errors > 0 then
    raise exception 'La inscripción tiene % error(es) bloqueante(s)', errors
      using errcode = 'check_violation', detail = issues::text;
  end if;

  -- snapshot categories
  update public.registration_athletes ra
    set category_id = public.resolve_category(reg.competition_id, ra.athlete_id)
    where ra.registration_id = p_registration_id;

  -- folio: per-competition sequence, locked row prevents duplicates
  if reg.folio is null then
    update public.competitions set folio_seq = folio_seq + 1
      where id = reg.competition_id returning * into comp;
    new_folio := comp.code || '-' || lpad(comp.folio_seq::text, 4, '0');
  else
    new_folio := reg.folio;
  end if;

  prev := reg.status;
  update public.registrations
    set status = 'submitted', folio = new_folio, submitted_at = now(), submitted_by = auth.uid(), review_note = null
    where id = p_registration_id
    returning * into reg;

  insert into public.registration_status_history (registration_id, from_status, to_status, changed_by)
  values (p_registration_id, prev, 'submitted', auth.uid());
  perform public.log_action('rpc:submit_registration', 'registrations', p_registration_id, jsonb_build_object('folio', new_folio));
  return reg;
end $$;

-- Organizer review transitions.
create or replace function public.review_registration(
  p_registration_id uuid, p_status public.registration_status, p_reason text default null
) returns public.registrations language plpgsql security definer set search_path = public as $$
declare
  reg public.registrations;
  prev public.registration_status;
begin
  select * into reg from public.registrations where id = p_registration_id for update;
  if reg.id is null then raise exception 'Inscripción no encontrada' using errcode = 'P0002'; end if;
  if not (public.is_competition_organizer(reg.competition_id) or public.is_platform_admin()) then
    raise exception 'Sin permiso para revisar esta inscripción' using errcode = '42501';
  end if;
  if p_status not in ('in_review', 'accepted', 'needs_correction', 'rejected', 'exported') then
    raise exception 'Estado destino inválido' using errcode = 'check_violation';
  end if;
  if p_status in ('needs_correction', 'rejected') and coalesce(trim(p_reason), '') = '' then
    raise exception 'Debes indicar el motivo' using errcode = 'check_violation';
  end if;
  prev := reg.status;
  update public.registrations set status = p_status, review_note = p_reason
    where id = p_registration_id returning * into reg;   -- guard trigger validates transition
  insert into public.registration_status_history (registration_id, from_status, to_status, changed_by, reason)
  values (p_registration_id, prev, p_status, auth.uid(), p_reason);
  perform public.log_action('rpc:review_registration', 'registrations', p_registration_id,
    jsonb_build_object('from', prev, 'to', p_status));
  return reg;
end $$;

-- Record an entry time as a historical mark explicitly (never automatic).
create or replace function public.save_mark_from_entry(p_entry_id uuid)
returns public.athlete_marks language plpgsql security definer set search_path = public as $$
declare
  e record;
  result public.athlete_marks;
begin
  select re.entry_time_cs, ra.athlete_id, ce.event_catalog_id, c.pool_course, c.id as competition_id, r.team_id
    into e
  from public.registration_entries re
  join public.registration_athletes ra on ra.id = re.registration_athlete_id
  join public.registrations r on r.id = re.registration_id
  join public.competition_events ce on ce.id = re.competition_event_id
  join public.competitions c on c.id = r.competition_id
  where re.id = p_entry_id;
  if e.athlete_id is null then raise exception 'Entrada no encontrada' using errcode = 'P0002'; end if;
  if not public.is_team_member(e.team_id) then raise exception 'Sin permiso' using errcode = '42501'; end if;
  if e.entry_time_cs is null then raise exception 'La entrada no tiene tiempo' using errcode = 'check_violation'; end if;
  insert into public.athlete_marks (athlete_id, event_catalog_id, pool_course, time_cs, source, competition_id, created_by)
  values (e.athlete_id, e.event_catalog_id, e.pool_course, e.entry_time_cs, 'entry', e.competition_id, auth.uid())
  returning * into result;
  return result;
end $$;

-- ---------- dashboard aggregates ---------------------------------------------
create or replace function public.coach_dashboard()
returns jsonb language sql stable security definer set search_path = public as $$
  with my_teams as (
    select team_id from public.team_members where user_id = auth.uid() and status = 'approved'
  )
  select jsonb_build_object(
    'teams', (select count(*) from my_teams),
    'athletes', (select count(*) from public.athletes a where a.team_id in (select team_id from my_teams) and a.status = 'active'),
    'open_competitions', (select count(*) from public.competitions c where c.status = 'published' and now() between c.registration_opens_at and c.registration_closes_at),
    'active_registrations', (select count(*) from public.registrations r where r.team_id in (select team_id from my_teams) and r.status not in ('rejected')),
    'needs_correction', (select count(*) from public.registrations r where r.team_id in (select team_id from my_teams) and r.status = 'needs_correction'),
    'pending_requests', (select count(*) from public.team_members tm where tm.status = 'pending' and public.is_team_owner(tm.team_id)),
    'deadlines', (
      select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'closes_at', c.registration_closes_at) order by c.registration_closes_at), '[]'::jsonb)
      from (select * from public.competitions c where c.status = 'published' and c.registration_closes_at > now() order by c.registration_closes_at limit 5) c
    )
  )
$$;

create or replace function public.organizer_dashboard()
returns jsonb language sql stable security definer set search_path = public as $$
  with my_comps as (
    select c.id, c.status from public.competitions c
    join public.organization_members m on m.organization_id = c.organization_id
    where m.user_id = auth.uid()
  ),
  regs as (
    select r.* from public.registrations r where r.competition_id in (select id from my_comps) and r.status <> 'draft'
  )
  select jsonb_build_object(
    'active_competitions', (select count(*) from my_comps where status = 'published'),
    'teams', (select count(distinct team_id) from regs),
    'athletes', (select count(distinct ra.athlete_id) from public.registration_athletes ra where ra.registration_id in (select id from regs)),
    'registrations', (select count(*) from regs),
    'entries', (select count(*) from public.registration_entries e where e.registration_id in (select id from regs)),
    'pending_review', (select count(*) from regs where status in ('submitted', 'in_review')),
    'needs_correction', (select count(*) from regs where status = 'needs_correction'),
    'exports', (select count(*) from public.export_jobs j where j.competition_id in (select id from my_comps))
  )
$$;
