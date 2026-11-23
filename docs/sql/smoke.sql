select 'profiles', count(*) from public.profiles;
select 'roles', string_agg(email||':'||role, ', ') from public.profiles;
select 'athletes', count(*) from public.athletes;
select 'memberships', count(*) from public.athlete_team_memberships;
select 'comp_events', count(*) from public.competition_events;
select 'team owner', count(*) from public.team_members where status='approved' and role='owner';
\echo === RPC smoke test ===
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select 'visible athletes', count(*) from public.athletes;
select 'visible comps', count(*) from public.competitions;
select id from public.get_or_create_registration('bbbbbbbb-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001') \gset
select 'same reg (idempotent)', (select id from public.get_or_create_registration('bbbbbbbb-0000-0000-0000-000000000001','cccccccc-0000-0000-0000-000000000001')) = :'id';
insert into public.registration_athletes (registration_id, athlete_id)
  select :'id', a.id from public.athletes a where a.first_name='Sofía' returning id as ra_id \gset
select 'category', (select name from public.competition_categories where id = public.resolve_category('bbbbbbbb-0000-0000-0000-000000000001', (select athlete_id from public.registration_athletes where id=:'ra_id')));
select 'eligible events', count(*) from public.eligible_events('bbbbbbbb-0000-0000-0000-000000000001', (select athlete_id from public.registration_athletes where id=:'ra_id'));
select 'issues before', public.validate_registration(:'id');
insert into public.registration_entries (registration_id, registration_athlete_id, competition_event_id, entry_time_cs)
  select :'id', :'ra_id', ce.id, 3520 from public.competition_events ce join public.event_catalog ec on ec.id=ce.event_catalog_id
  where ce.competition_id='bbbbbbbb-0000-0000-0000-000000000001' and ec.distance_m=50 and ec.stroke='free' and ce.sex='F';
insert into public.registration_entries (registration_id, registration_athlete_id, competition_event_id, entry_time_cs)
  select :'id', :'ra_id', ce.id, 3520 from public.competition_events ce join public.event_catalog ec on ec.id=ce.event_catalog_id
  where ce.competition_id='bbbbbbbb-0000-0000-0000-000000000001' and ec.distance_m=50 and ec.stroke='free' and ce.sex='M';
select 'issues with bad event', public.validate_registration(:'id');
delete from public.registration_entries where registration_id=:'id' and competition_event_id in (select id from public.competition_events where sex='M');
select 'issues clean', public.validate_registration(:'id');
select 'submit', folio, status from public.submit_registration(:'id');
savepoint sp;
do $$ begin
  begin
    insert into public.registration_entries (registration_id, registration_athlete_id, competition_event_id, entry_time_cs)
    select r.id, ra.id, ce.id, 1000 from public.registrations r join public.registration_athletes ra on ra.registration_id=r.id
    join public.competition_events ce on ce.competition_id=r.competition_id where ce.sex='F' limit 1;
    raise exception 'SHOULD HAVE FAILED';
  exception when check_violation then raise notice 'OK: edit blocked after submit: %', sqlerrm;
  end;
end $$;
rollback to sp;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select 'organizer sees regs', count(*) from public.registrations;
select 'organizer sees athlete', count(*) from public.athletes;
select 'review', status, review_note from public.review_registration(:'id', 'needs_correction', 'Falta tiempo en 100 libre');
select 'history', count(*) from public.registration_status_history where registration_id=:'id';
select 'organizer dashboard', public.organizer_dashboard();
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
select 'other coach athletes', count(*) from public.athletes;
select 'other coach regs', count(*) from public.registrations;
select 'other coach teams', count(*) from public.teams;
select 'directory search', count(*) from public.search_teams_directory('delfnes');
select 'dup detect (outsider)', count(*) from public.find_similar_athletes('cccccccc-0000-0000-0000-000000000001','Sofia','Ramirez Lopez',null);
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select 'dup detect (member)', count(*) from public.find_similar_athletes('cccccccc-0000-0000-0000-000000000001','Sofia','Ramirez Lopez',null);
select 'coach dashboard', public.coach_dashboard();
rollback;
