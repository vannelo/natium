# Architecture

## Overview

```
Browser (React SPA, Vercel)  ──HTTPS──▶  Supabase project
  TanStack Query cache                    ├─ Auth (GoTrue): email/password, JWT
  Supabase JS client (anon key)           ├─ PostgREST: tables + RPC, filtered by RLS
                                          ├─ PostgreSQL: schema, triggers, RPC (business rules)
                                          └─ Storage: private buckets (logos, photos, exports)
```

There is no custom API server. Authorization is enforced by Postgres Row Level Security using the JWT of the signed-in user; critical multi-step operations are `security definer` SQL functions that validate permissions explicitly and run in a single transaction.

## Folder structure

```
src/
  app/            App root, router, layouts (AppShell, AuthLayout), guards (RequireAuth, RequireRole)
  config/         brand.ts (white-label), env.ts (validated env)
  lib/            supabase.ts (typed client), database.types.ts (generated), queryClient.ts, errors.ts
  shared/
    ui/           Design-system primitives: Button, Input/Select/Textarea/Checkbox, Field, Card, Badge,
                  DataTable, Modal/ConfirmDialog, EmptyState, PageHeader, StatCard, Alert, SearchInput,
                  Pagination, Tabs, Avatar, Skeleton, TimeInput, Toaster, Logo, status pages
    utils/        cn, time (centiseconds), dates, labels (Spanish enum labels)
    hooks/        useDebounce
  features/
    auth/         AuthProvider (session + profile), login/register/reset pages, WaveBackground
    dashboard/    Coach & organizer dashboards (RPC aggregates)
    teams/        NATIUM Teams: CRUD, directory search, access requests
    athletes/     NATIUM Athletes: records, duplicate detection, history, best marks
    competitions/ NATIUM Events: organizer CRUD, categories, enabled events, public view, organization
    catalog/      Global event catalog
    registrations/NATIUM Entry: wizard, validation, submission, review, status history
    admin/        Platform admin: users/roles, audit log
supabase/
  migrations/     Versioned SQL (types → core → competitions → registrations → exports/audit → RPC → RLS)
  seed.sql        Local demo data (never run in production)
docs/             This documentation
```

## Module boundaries

- A feature may import from `shared/*`, `lib/*`, `config/*` and from other features' **`api.ts` hooks and types** only (e.g. the wizard uses `features/athletes/api` and `features/competitions/api`). Pages/components are not imported across features.
- `shared/ui` never imports from `features`.
- Routing is centralized in `src/app/router.tsx`; role-based navigation in `AppShell`.

## Data flow conventions

1. **Queries**: `useQuery` with hierarchical keys (`teamKeys`, `athleteKeys`, …) defined next to the hooks. `unwrap()` converts Supabase errors into `AppError` with Spanish messages.
2. **Mutations**: `useMutation` + `invalidateQueries` on the feature's root key. Components only call `mutate`/`mutateAsync` and show toasts.
3. **Validation**: Zod schema (client) → Postgres constraints/triggers/RPC (server). Server messages are surfaced through `toAppError`.
4. **Auth state**: `AuthProvider` exposes `session`, `profile`, `signOut`. `RequireAuth` redirects to `/login`; `RequireRole` shapes navigation (not security).

## Why these choices

- **Supabase + RLS** gives multi-tenant isolation without writing an API, and `security definer` RPCs give transactional business rules (folio sequencing, state machine) that cannot be bypassed.
- **TanStack Query** handles cache, loading and error states uniformly.
- **Tailwind v4 CSS-first tokens** keep the design system in one `@theme` block (`src/index.css`).
- **Feature-first folders** keep each module (Teams, Athletes, Events, Entry) independently evolvable toward NATIUM Meet.

## Future-proofing for Stage 2 (NATIUM Meet)

- `registration_entries` is keyed by `competition_event_id`, so heats/lanes/results tables can reference entries directly.
- `athlete_marks.source` already distinguishes `entry` / `official` / `manual`.
- `competition_events.event_number` and `external_code` map to external systems.
- `export_jobs` is format-agnostic (`export_profiles.format` selects the adapter).
