-- =============================================================================
-- NATIUM Entry — 0007 Row Level Security
-- Every exposed table has RLS enabled. Authorization is decided here and in
-- RPC functions, never only in the UI.
-- =============================================================================

alter table public.profiles                   enable row level security;
alter table public.organizations              enable row level security;
alter table public.organization_members       enable row level security;
alter table public.teams                      enable row level security;
alter table public.team_members               enable row level security;
alter table public.athletes                   enable row level security;
alter table public.athlete_team_memberships   enable row level security;
alter table public.event_catalog              enable row level security;
alter table public.competitions               enable row level security;
alter table public.competition_categories     enable row level security;
alter table public.competition_events         enable row level security;
alter table public.competition_custom_fields  enable row level security;
alter table public.registrations              enable row level security;
alter table public.registration_athletes      enable row level security;
alter table public.registration_entries       enable row level security;
alter table public.registration_status_history enable row level security;
alter table public.athlete_marks              enable row level security;
alter table public.athlete_custom_values      enable row level security;
alter table public.export_profiles            enable row level security;
alter table public.export_jobs                enable row level security;
alter table public.export_job_items           enable row level security;
alter table public.audit_logs                 enable row level security;

-- ---------- profiles -----------------------------------------------------------
create policy profiles_select on public.profiles for select to authenticated using (
  id = auth.uid()
  or public.is_platform_admin()
  -- teammates
  or exists (select 1 from public.team_members a join public.team_members b on a.team_id = b.team_id
             where a.user_id = auth.uid() and b.user_id = profiles.id and a.status = 'approved')
  -- organizer sees coaches who submitted to their competitions
  or exists (select 1 from public.registrations r where r.submitted_by = profiles.id
             and public.is_competition_organizer(r.competition_id))
  -- org colleagues
  or exists (select 1 from public.organization_members a join public.organization_members b on a.organization_id = b.organization_id
             where a.user_id = auth.uid() and b.user_id = profiles.id)
);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles p where p.id = auth.uid()));
create policy profiles_admin_update on public.profiles for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ---------- organizations ------------------------------------------------------
create policy organizations_select on public.organizations for select to authenticated using (
  public.is_org_member(id) or public.is_platform_admin()
  -- coaches see organizer name on published competitions
  or exists (select 1 from public.competitions c where c.organization_id = organizations.id and c.status <> 'draft')
);
create policy organizations_insert on public.organizations for insert to authenticated with check (
  created_by = auth.uid() and public.current_app_role() in ('organizer', 'platform_admin')
);
create policy organizations_update on public.organizations for update to authenticated using (
  public.is_platform_admin() or exists (select 1 from public.organization_members m
    where m.organization_id = id and m.user_id = auth.uid() and m.role in ('owner', 'admin'))
);

create policy org_members_select on public.organization_members for select to authenticated using (
  public.is_org_member(organization_id) or public.is_platform_admin()
);
create policy org_members_manage on public.organization_members for all to authenticated using (
  public.is_platform_admin() or exists (select 1 from public.organization_members m
    where m.organization_id = organization_members.organization_id and m.user_id = auth.uid() and m.role in ('owner', 'admin'))
) with check (
  public.is_platform_admin() or exists (select 1 from public.organization_members m
    where m.organization_id = organization_members.organization_id and m.user_id = auth.uid() and m.role in ('owner', 'admin'))
);

-- ---------- teams --------------------------------------------------------------
create policy teams_select on public.teams for select to authenticated using (
  public.is_team_member(id)
  or exists (select 1 from public.team_members m where m.team_id = id and m.user_id = auth.uid()) -- pending requesters see basics
  or public.organizer_can_see_team(id)
  or public.is_platform_admin()
);
create policy teams_insert on public.teams for insert to authenticated with check (
  created_by = auth.uid() and public.current_app_role() in ('coach', 'organizer', 'platform_admin')
);
create policy teams_update on public.teams for update to authenticated
  using (public.is_team_owner(id) or public.is_platform_admin())
  with check (public.is_team_owner(id) or public.is_platform_admin());
-- No delete policy: teams are deactivated, never deleted.

create policy team_members_select on public.team_members for select to authenticated using (
  user_id = auth.uid() or public.is_team_member(team_id) or public.is_platform_admin()
);
-- Inserts/updates go through RPC (request_team_access / decide_team_access) and the
-- on_team_created trigger, both security definer. No direct write policies.

-- ---------- athletes -----------------------------------------------------------
create policy athletes_select on public.athletes for select to authenticated using (
  public.is_team_member(team_id) or public.organizer_can_see_athlete(id) or public.is_platform_admin()
);
create policy athletes_insert on public.athletes for insert to authenticated with check (
  public.is_team_member(team_id) and created_by = auth.uid()
);
create policy athletes_update on public.athletes for update to authenticated
  using (public.is_team_member(team_id) or public.is_platform_admin())
  with check (public.is_team_member(team_id) or public.is_platform_admin());
-- No delete policy: athletes are deactivated to preserve history.

create policy athlete_team_memberships_select on public.athlete_team_memberships for select to authenticated using (
  public.is_team_member(team_id) or public.is_platform_admin()
  or exists (select 1 from public.athletes a where a.id = athlete_id and public.organizer_can_see_athlete(a.id))
);

create policy athlete_marks_select on public.athlete_marks for select to authenticated using (
  exists (select 1 from public.athletes a where a.id = athlete_id
          and (public.is_team_member(a.team_id) or public.organizer_can_see_athlete(a.id)))
  or public.is_platform_admin()
);
create policy athlete_marks_write on public.athlete_marks for insert to authenticated with check (
  exists (select 1 from public.athletes a where a.id = athlete_id and public.is_team_member(a.team_id))
);
create policy athlete_marks_delete on public.athlete_marks for delete to authenticated using (
  source = 'manual' and exists (select 1 from public.athletes a where a.id = athlete_id and public.is_team_member(a.team_id))
);

create policy athlete_custom_values_all on public.athlete_custom_values for all to authenticated
  using (exists (select 1 from public.athletes a where a.id = athlete_id and public.is_team_member(a.team_id))
         or exists (select 1 from public.competition_custom_fields f where f.id = field_id and public.is_competition_organizer(f.competition_id)))
  with check (exists (select 1 from public.athletes a where a.id = athlete_id and public.is_team_member(a.team_id)));

-- ---------- event catalog ------------------------------------------------------
create policy event_catalog_select on public.event_catalog for select to authenticated using (true);
create policy event_catalog_write on public.event_catalog for all to authenticated
  using (public.current_app_role() in ('organizer', 'platform_admin'))
  with check (public.current_app_role() in ('organizer', 'platform_admin'));

-- ---------- competitions -------------------------------------------------------
create policy competitions_select on public.competitions for select to authenticated using (
  status <> 'draft' or public.is_org_member(organization_id) or public.is_platform_admin()
);
create policy competitions_insert on public.competitions for insert to authenticated with check (
  public.is_org_member(organization_id) and created_by = auth.uid()
);
create policy competitions_update on public.competitions for update to authenticated
  using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id) or public.is_platform_admin());
create policy competitions_delete on public.competitions for delete to authenticated using (
  status = 'draft' and public.is_org_member(organization_id)
);

create policy competition_categories_select on public.competition_categories for select to authenticated using (
  exists (select 1 from public.competitions c where c.id = competition_id) -- inherits competitions RLS
);
create policy competition_categories_write on public.competition_categories for all to authenticated
  using (public.is_competition_organizer(competition_id)) with check (public.is_competition_organizer(competition_id));

create policy competition_events_select on public.competition_events for select to authenticated using (
  exists (select 1 from public.competitions c where c.id = competition_id)
);
create policy competition_events_write on public.competition_events for all to authenticated
  using (public.is_competition_organizer(competition_id)) with check (public.is_competition_organizer(competition_id));

create policy competition_custom_fields_select on public.competition_custom_fields for select to authenticated using (
  exists (select 1 from public.competitions c where c.id = competition_id)
);
create policy competition_custom_fields_write on public.competition_custom_fields for all to authenticated
  using (public.is_competition_organizer(competition_id)) with check (public.is_competition_organizer(competition_id));

-- ---------- registrations ------------------------------------------------------
create policy registrations_select on public.registrations for select to authenticated using (
  public.can_access_registration(id)
);
-- Creation goes through get_or_create_registration (RPC). Coaches may delete their own drafts.
create policy registrations_delete_draft on public.registrations for delete to authenticated using (
  status = 'draft' and public.is_team_member(team_id)
);
-- Status changes go through RPC only (submit_registration / review_registration).

create policy registration_athletes_select on public.registration_athletes for select to authenticated using (
  public.can_access_registration(registration_id)
);
create policy registration_athletes_write on public.registration_athletes for all to authenticated
  using (exists (select 1 from public.registrations r where r.id = registration_id and public.is_team_member(r.team_id)))
  with check (
    exists (select 1 from public.registrations r where r.id = registration_id and public.is_team_member(r.team_id))
    -- athlete must belong to the registering team
    and exists (select 1 from public.registrations r join public.athletes a on a.team_id = r.team_id
                where r.id = registration_id and a.id = athlete_id)
  );

create policy registration_entries_select on public.registration_entries for select to authenticated using (
  public.can_access_registration(registration_id)
);
create policy registration_entries_write on public.registration_entries for all to authenticated
  using (exists (select 1 from public.registrations r where r.id = registration_id and public.is_team_member(r.team_id)))
  with check (
    exists (select 1 from public.registrations r where r.id = registration_id and public.is_team_member(r.team_id))
    and exists (select 1 from public.registration_athletes ra where ra.id = registration_athlete_id and ra.registration_id = registration_id)
    and exists (select 1 from public.registrations r join public.competition_events ce on ce.competition_id = r.competition_id
                where r.id = registration_id and ce.id = competition_event_id)
  );

create policy registration_status_history_select on public.registration_status_history for select to authenticated using (
  public.can_access_registration(registration_id)
);

-- ---------- exports ------------------------------------------------------------
create policy export_profiles_all on public.export_profiles for all to authenticated
  using (public.is_org_member(organization_id) or public.is_platform_admin())
  with check (public.is_org_member(organization_id) or public.is_platform_admin());
create policy export_jobs_select on public.export_jobs for select to authenticated using (
  public.is_competition_organizer(competition_id) or public.is_platform_admin()
);
create policy export_jobs_insert on public.export_jobs for insert to authenticated with check (
  public.is_competition_organizer(competition_id) and requested_by = auth.uid()
);
create policy export_job_items_select on public.export_job_items for select to authenticated using (
  exists (select 1 from public.export_jobs j where j.id = export_job_id and public.is_competition_organizer(j.competition_id))
);

-- ---------- audit logs ---------------------------------------------------------
create policy audit_logs_select on public.audit_logs for select to authenticated using (public.is_platform_admin());

-- ---------- storage policies ---------------------------------------------------
create policy "team logos: members read" on storage.objects for select to authenticated using (
  bucket_id = 'team-logos' and public.is_team_member(((storage.foldername(name))[1])::uuid)
);
create policy "team logos: owners write" on storage.objects for insert to authenticated with check (
  bucket_id = 'team-logos' and public.is_team_owner(((storage.foldername(name))[1])::uuid)
);
create policy "team logos: owners update" on storage.objects for update to authenticated using (
  bucket_id = 'team-logos' and public.is_team_owner(((storage.foldername(name))[1])::uuid)
);
create policy "athlete photos: members" on storage.objects for all to authenticated
  using (bucket_id = 'athlete-photos' and public.is_team_member(((storage.foldername(name))[1])::uuid))
  with check (bucket_id = 'athlete-photos' and public.is_team_member(((storage.foldername(name))[1])::uuid));
create policy "exports: organizers read" on storage.objects for select to authenticated using (
  bucket_id = 'exports' and public.is_competition_organizer(((storage.foldername(name))[1])::uuid)
);

-- ---------- grants -------------------------------------------------------------
-- Supabase grants anon/authenticated usage on public by default; restrict anon.
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from anon;
