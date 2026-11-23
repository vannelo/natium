# Security & privacy

## Roles

| Role             | Scope                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| `platform_admin` | Global supervision: users/roles, audit log, catalog. Granted only via SQL/admin UI, never at signup. |
| `organizer`      | Member of an organization; manages its competitions and reviews submitted registrations.             |
| `coach`          | Member of teams; manages athletes and registrations of approved teams.                               |

Signup accepts only `coach` or `organizer` (enforced in `handle_new_user`). Users cannot change their own role (`profiles_update_own` policy checks role unchanged).

## Authorization layers

1. **RLS** on every public table (`0007_rls_policies.sql`). `anon` has no privileges on `public`.
2. **RPC functions** (`security definer`, `set search_path = public`) re-check membership/ownership before acting and raise `42501` otherwise.
3. **Triggers** enforce the state machine and edit locks regardless of the caller.
4. **UI guards** (`RequireAuth`, `RequireRole`) only shape navigation.

Cross-tenant protection: organizers never see draft registrations or athletes of teams that have not submitted to their competitions; coaches never see other teams' athletes (verified in `docs/sql/smoke.sql`: outsider coach sees 0 athletes, 0 registrations, 0 teams, and `find_similar_athletes` returns nothing).

## Data minimization (minors)

Athlete records store only: name, birth date, sex, team, optional photo. Any additional identifying field must be declared by the organizer in `competition_custom_fields` with a `justification`; values live in `athlete_custom_values`, visible only to the team and that competition's organizer. Photos are in a private bucket with folder-based policies.

Athletes with registrations are never hard-deleted (no delete policy); they are deactivated.

## Secrets

- Browser gets only `VITE_SUPABASE_URL` and the anon/publishable key.
- `service_role` key is never used in this repo. Server-side jobs (future exporter) run as Edge Functions or trusted scripts with their own secret management.
- `.env*` files are git-ignored except `.env.example`.

## Auditing

`audit_logs` records insert/update/delete on teams, athletes, competitions, registrations, export_jobs with before/after payloads, plus RPC actions (`rpc:submit_registration`, …). Readable only by platform admins (`/admin/audit`).

## Error handling

Supabase/Postgres errors map to user-safe Spanish messages in `src/lib/errors.ts`; raw details are not shown. Session expiry (`PGRST301`) is surfaced as "Tu sesión ha expirado".
