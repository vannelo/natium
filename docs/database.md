# Database

PostgreSQL (Supabase). All identifiers are UUID. Migrations live in `supabase/migrations` and are applied in order.

## Entity map

```
profiles ──┬── organization_members ── organizations ── competitions ──┬── competition_categories
           │                                                          ├── competition_events ── event_catalog
           │                                                          ├── competition_custom_fields ── athlete_custom_values
           │                                                          └── export_jobs ── export_job_items
           └── team_members ── teams ──┬── athletes ──┬── athlete_team_memberships
                                       │              └── athlete_marks
                                       └── registrations ──┬── registration_athletes ── registration_entries
                                                           └── registration_status_history
audit_logs (generic)   export_profiles (per organization)
```

## Tables (summary)

| Table                                                | Purpose                                                        | Key constraints                                                      |
| ---------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------- |
| `profiles`                                           | App profile per auth user, platform role                       | created by trigger on `auth.users`                                   |
| `organizations`, `organization_members`              | Organizer entities                                             | creator auto-owner                                                   |
| `teams`                                              | Team record                                                    | unique `name_normalized` (accent/case-insensitive), unique `code`    |
| `team_members`                                       | Coach ↔ team with `status` (pending/approved/rejected/revoked) | creator auto-approved owner                                          |
| `athletes`                                           | Permanent record, `display_id` `ATL-000001`                    | unique (team, normalized name, birth date); soft delete via `status` |
| `athlete_team_memberships`                           | Team history (transfers)                                       | one open membership per athlete                                      |
| `event_catalog`                                      | Global distance+stroke catalog, `external_code`                | unique (distance, stroke, relay)                                     |
| `competitions`                                       | Convocatoria, dates, window, pool, rules, `folio_seq`          | unique (org, code), status enum                                      |
| `competition_categories`                             | Age/sex categories per competition                             | none hard-coded                                                      |
| `competition_events`                                 | Enabled events (sex, optional category, number, external code) |                                                                      |
| `registrations`                                      | One per (competition, team); `folio`, status                   | **unique (competition_id, team_id)**                                 |
| `registration_athletes`                              | Athletes in a registration + category snapshot                 | unique (registration, athlete)                                       |
| `registration_entries`                               | Event entries; `entry_time_cs` integer, `no_time`              | unique (reg athlete, event)                                          |
| `registration_status_history`                        | Every transition with actor, timestamp, reason                 | insert only via RPC                                                  |
| `athlete_marks`                                      | Best marks (`source`: entry/official/manual)                   | never auto-overwritten                                               |
| `export_profiles`, `export_jobs`, `export_job_items` | Export engine scaffolding                                      | adapter pending                                                      |
| `audit_logs`                                         | Row-level audit of critical tables + RPC actions               | admin read only                                                      |

## Business-rule functions (RPC)

| Function                                           | Who               | What                                                                                              |
| -------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------- |
| `request_team_access(team)`                        | any authenticated | create/reactivate a pending membership                                                            |
| `decide_team_access(team, user, approve)`          | team owner        | approve/reject                                                                                    |
| `revoke_team_access(team, user)`                   | team owner        | revoke                                                                                            |
| `search_teams_directory(query)`                    | any authenticated | fuzzy (trigram) team search with limited columns                                                  |
| `find_similar_athletes(team, first, last, birth?)` | team member       | duplicate detection                                                                               |
| `resolve_category(competition, athlete)`           | —                 | category by age on reference date + sex                                                           |
| `eligible_events(competition, athlete)`            | —                 | events compatible with sex/category                                                               |
| `get_or_create_registration(competition, team)`    | team member       | idempotent draft (unique constraint prevents races)                                               |
| `validate_registration(reg)`                       | reg access        | JSON list of `{level, code, message, athlete_id?, entry_id?}`                                     |
| `submit_registration(reg)`                         | team member       | transactional: validate → snapshot categories → folio `CODE-0001` → `submitted` → history + audit |
| `review_registration(reg, status, reason?)`        | organizer         | review transitions, reason required for correction/rejection                                      |
| `save_mark_from_entry(entry)`                      | team member       | explicit copy of an entry time into best marks                                                    |
| `coach_dashboard()`, `organizer_dashboard()`       | role              | aggregate counters                                                                                |

Guards implemented as triggers:

- `registrations_guard`: enforces the transition table (`registration_transition_allowed`) and immutability of competition/team.
- `registration_children_guard`: athletes/entries editable only while `draft` or `needs_correction`.
- `audit_row_change`: writes `audit_logs` for teams, athletes, competitions, registrations, export_jobs.
- `handle_new_user`: creates the profile; role restricted to `coach`/`organizer` (admin granted manually).

## RLS model (see `0007_rls_policies.sql`)

Helper predicates (all `security definer`, `stable`): `is_platform_admin()`, `is_org_member(org)`, `is_team_member(team)` (approved only), `is_team_owner(team)`, `is_competition_organizer(comp)`, `organizer_can_see_team/athlete(...)` (only once a non-draft registration exists), `can_access_registration(reg)`.

Principles:

- Coaches see only teams they are approved members of (and basic data of teams they requested), their athletes, their registrations.
- Organizers see competitions of their organization, and teams/athletes/registrations **only after submission** (drafts are private to the team).
- Registration creation/status changes have no direct write policies: they go through RPC.
- `anon` has all privileges revoked on `public`.
- Storage: `team-logos/<team_id>/…`, `athlete-photos/<team_id>/…`, `exports/<competition_id>/…` with folder-based policies.

## Working with migrations

```bash
# new migration
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_add_something.sql
pnpm db:reset        # applies everything from scratch + seed
pnpm db:types        # regenerate TS types
# promote to a remote project
supabase link --project-ref <ref>
pnpm db:push
```

## Smoke test (SQL)

The RPC/RLS flow was verified with a transaction that impersonates users via `set local role authenticated` + `request.jwt.claims`. Reproduce with:

```bash
docker exec -i supabase_db_swim psql -U postgres -d postgres -v ON_ERROR_STOP=1 < docs/sql/smoke.sql
```
