-- =============================================================================
-- NATIUM Entry — local development seed. NOT for production.
-- Creates demo users (password: natium123) and a base event catalog.
-- =============================================================================

-- ---------- event catalog (examples; organizers may extend) ------------------
insert into public.event_catalog (distance_m, stroke, name, sort_order) values
  (50,  'free',   '50 m libre', 10),
  (100, 'free',   '100 m libre', 20),
  (200, 'free',   '200 m libre', 30),
  (400, 'free',   '400 m libre', 40),
  (800, 'free',   '800 m libre', 50),
  (1500,'free',   '1500 m libre', 60),
  (50,  'back',   '50 m dorso', 70),
  (100, 'back',   '100 m dorso', 80),
  (200, 'back',   '200 m dorso', 90),
  (50,  'breast', '50 m pecho', 100),
  (100, 'breast', '100 m pecho', 110),
  (200, 'breast', '200 m pecho', 120),
  (50,  'fly',    '50 m mariposa', 130),
  (100, 'fly',    '100 m mariposa', 140),
  (200, 'fly',    '200 m mariposa', 150),
  (100, 'medley', '100 m combinado individual', 160),
  (200, 'medley', '200 m combinado individual', 170),
  (400, 'medley', '400 m combinado individual', 180)
on conflict do nothing;

-- ---------- demo users ---------------------------------------------------------
create or replace function pg_temp.seed_user(p_id uuid, p_email text, p_name text, p_role text)
returns void language plpgsql as $$
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token,
    email_change_token_new, email_change)
  values (p_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email,
    extensions.crypt('natium123', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_name, 'role', p_role), now(), now(), '', '', '', '')
  on conflict (id) do nothing;
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), p_id, p_id::text, jsonb_build_object('sub', p_id::text, 'email', p_email), 'email', now(), now(), now())
  on conflict do nothing;
end $$;

select pg_temp.seed_user('11111111-1111-1111-1111-111111111111', 'admin@natium.local', 'Admin NATIUM', 'coach');
select pg_temp.seed_user('22222222-2222-2222-2222-222222222222', 'organizador@natium.local', 'Laura Organizadora', 'organizer');
select pg_temp.seed_user('33333333-3333-3333-3333-333333333333', 'entrenador@natium.local', 'Carlos Entrenador', 'coach');
select pg_temp.seed_user('44444444-4444-4444-4444-444444444444', 'entrenador2@natium.local', 'Ana Entrenadora', 'coach');

update public.profiles set role = 'platform_admin' where id = '11111111-1111-1111-1111-111111111111';

-- ---------- demo organization & competition --------------------------------------
insert into public.organizations (id, name, slug, city, state, created_by)
values ('aaaaaaaa-0000-0000-0000-000000000001', 'Federación Demo de Natación', 'federacion-demo', 'Monterrey', 'Nuevo León',
        '22222222-2222-2222-2222-222222222222')
on conflict do nothing;

insert into public.competitions (id, organization_id, name, code, description, start_date, end_date, venue, city,
  registration_opens_at, registration_closes_at, pool_course, pool_length_m, status, max_entries_per_athlete, allow_no_time, created_by)
values ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
  'Copa Demo de Primavera 2027', 'CDP27', 'Competencia de demostración para el entorno local.',
  current_date + 45, current_date + 46, 'Alberca Olímpica Demo', 'Monterrey',
  now() - interval '1 day', now() + interval '30 days', 'SCM', 25, 'published', 4, true,
  '22222222-2222-2222-2222-222222222222')
on conflict do nothing;

insert into public.competition_categories (competition_id, name, code, sex, min_age, max_age, sort_order) values
  ('bbbbbbbb-0000-0000-0000-000000000001', '10 y menores', 'C10', null, 0, 10, 1),
  ('bbbbbbbb-0000-0000-0000-000000000001', '11-12 años', 'C12', null, 11, 12, 2),
  ('bbbbbbbb-0000-0000-0000-000000000001', '13-14 años', 'C14', null, 13, 14, 3),
  ('bbbbbbbb-0000-0000-0000-000000000001', '15-17 años', 'C17', null, 15, 17, 4),
  ('bbbbbbbb-0000-0000-0000-000000000001', '18 y mayores', 'C18', null, 18, 99, 5)
on conflict do nothing;

insert into public.competition_events (competition_id, event_catalog_id, event_number, sex, sort_order)
select 'bbbbbbbb-0000-0000-0000-000000000001', ec.id,
       row_number() over (order by ec.sort_order, s.sex), s.sex, row_number() over (order by ec.sort_order, s.sex)
from public.event_catalog ec
cross join (values ('F'::public.athlete_sex), ('M'::public.athlete_sex)) as s(sex)
where ec.distance_m in (50, 100, 200) and ec.stroke in ('free', 'back', 'breast', 'fly')
   or (ec.distance_m = 200 and ec.stroke = 'medley')
on conflict do nothing;

-- ---------- demo team & athletes -----------------------------------------------------
insert into public.teams (id, name, short_name, code, city, state, contact_name, contact_email, created_by)
values ('cccccccc-0000-0000-0000-000000000001', 'Club Acuático Delfines', 'DELFINES', 'DELF', 'Monterrey', 'Nuevo León',
        'Carlos Entrenador', 'entrenador@natium.local', '33333333-3333-3333-3333-333333333333')
on conflict do nothing;

insert into public.athletes (first_name, last_name, birth_date, sex, team_id, created_by) values
  ('Sofía',   'Ramírez López',   '2014-03-12', 'F', 'cccccccc-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333'),
  ('Mateo',   'García Torres',   '2012-07-01', 'M', 'cccccccc-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333'),
  ('Valeria', 'Hernández Cruz',  '2010-11-23', 'F', 'cccccccc-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333'),
  ('Diego',   'Martínez Ruiz',   '2009-02-15', 'M', 'cccccccc-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333'),
  ('Camila',  'Flores Díaz',     '2016-05-30', 'F', 'cccccccc-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333')
on conflict do nothing;
