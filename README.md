# NATIUM Entry — Engineer Guide

**Swimming Competition Platform · Cada segundo cuenta.**

NATIUM Entry is the first product of the NATIUM ecosystem: a swimming-competition registration platform. Coaches keep permanent team and athlete records, register swimmers in competitions with entry times, and organizers review the registrations and (soon) export them to their meet-management software.

| | |
| --- | --- |
| **Status** | Deliverables 1–4 done (foundations, teams & athletes, competitions, registration wizard). Deliverable 5 (export engine) is blocked on a real reference `.mdb` file. Deliverable 6 (quality/production hardening) is partial. |
| **Language** | UI copy in **Spanish**. Code, comments, docs and commits in **English**. |
| **Stack** | React 19 · TypeScript (strict) · Vite 8 · Tailwind CSS v4 · React Router 7 · TanStack Query 5 · React Hook Form + Zod 4 · Supabase (PostgreSQL 17, Auth, RLS, RPC, Storage) · pnpm · Vitest · oxlint · Prettier |
| **Infra** | GitHub Actions CI · Vercel (SPA) · separate dev/prod Supabase projects (not created yet) |

Contents

1. [Local setup](#1-local-setup)
2. [Product tour](#2-product-tour)
3. [Repository map](#3-repository-map)
4. [How it works](#4-how-it-works)
5. [Key rules to keep intact](#5-key-rules-to-keep-intact)
6. [Common tasks](#6-common-tasks)
7. [Verifying your work](#7-verifying-your-work)
8. [Status and what comes next](#8-status-and-what-comes-next)
9. [Troubleshooting](#9-troubleshooting)
10. [Further documentation](#10-further-documentation)

---

## 1. Local setup

Prerequisites: Node 22+, pnpm 10+, Docker Desktop running. The Supabase CLI is a dev dependency, no global install needed.

```bash
pnpm install
pnpm db:start                  # starts Postgres/Auth/API/Storage locally, applies migrations + seed (first run downloads images)
pnpm db:status                 # prints the local anon key
cp .env.example .env.local     # paste the anon key into VITE_SUPABASE_ANON_KEY
pnpm dev                       # http://localhost:5173
```

Local tools: Supabase Studio at `http://127.0.0.1:54323`, Mailpit (local emails) at `http://127.0.0.1:54324`.

### Demo accounts (created by `supabase/seed.sql`, local only, password `natium123`)

| Email | Role | Good for testing |
| --- | --- | --- |
| `entrenador@natium.local` | Coach, owner of "Club Acuático Delfines" | 5 seeded athletes, full registration wizard against competition `CDP27` |
| `entrenador2@natium.local` | Coach with no team | Team directory search, access requests, RLS isolation |
| `organizador@natium.local` | Organizer of "Federación Demo" | Competition configuration, review of submitted registrations |
| `admin@natium.local` | Platform admin | Users and roles, audit log |

### Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm preview` | Dev server, production build, preview of the build |
| `pnpm typecheck` / `pnpm lint` / `pnpm test` | Strict TypeScript, oxlint, Vitest (CI runs these plus the build) |
| `pnpm format` | Prettier over `src`, `supabase`, `docs` |
| `pnpm db:start` / `pnpm db:stop` / `pnpm db:status` | Local Supabase stack |
| `pnpm db:reset` | Drop the local DB and re-apply every migration and the seed. Run after editing SQL. |
| `pnpm db:types` | Regenerate `src/lib/database.types.ts`. Run after any schema change. |
| `pnpm db:diff` / `pnpm db:push` | Create a migration from local changes / push migrations to the linked remote project |

---

## 2. Product tour

Three roles, three navigation trees. Routes live in `src/app/router.tsx`; the sidebar is built per role in `src/app/layouts/AppShell.tsx`.

| Area | Route root | What is there |
| --- | --- | --- |
| Coach | `/dashboard` | Teams and access requests, athlete records with duplicate detection, open competitions, five-step registration wizard, receipts and status |
| Organizer | `/org` | Organization setup, competitions with categories and enabled events, review of submitted registrations with mandatory reasons, event catalog |
| Platform admin | `/admin` | Global counters, user role assignment, audit log |

### The core flow to try first

1. As `entrenador@`, open **Competencias → Copa Demo de Primavera 2027 → Inscribir nadadores**.
2. Walk the wizard: pick athletes (category badges appear), pick events (only eligible ones show), type times like `1:05.3` (normalized to `01:05.30`), confirm. You receive folio `CDP27-0001`.
3. As `organizador@`, open **Inscripciones → the new folio → Solicitar corrección** and write a reason.
4. Back as the coach, the registration shows the note and reopens in the wizard. Resubmit; the folio is preserved.

---

## 3. Repository map

```
src/
  app/            App root, router, AppShell + AuthLayout, guards (RequireAuth, RequireRole)
  config/         brand.ts (white-label strings), env.ts (validated VITE_* vars)
  lib/            supabase.ts (typed client), database.types.ts (generated), errors.ts (unwrap, AppError), queryClient.ts
  shared/ui/      Design-system components: Button, Input, Field, Card, Badge, DataTable, Modal, EmptyState,
                  PageHeader, StatCard, Alert, SearchInput, Pagination, Tabs, Avatar, Skeleton, TimeInput, Toaster, Logo
  shared/utils/   time.ts (centiseconds), dates.ts, labels.ts (Spanish enum labels), cn.ts
  shared/hooks/   useDebounce
  features/
    auth/  dashboard/  teams/  athletes/  competitions/  catalog/  registrations/  admin/
      └─ api.ts (hooks + Zod schemas)   pages/   components/
supabase/
  migrations/     0001 types → 0002 core → 0003 competitions → 0004 registrations
                  → 0005 exports + audit → 0006 RPC business rules → 0007 RLS
  seed.sql        Local demo data only (never run remotely)
docs/             architecture, database, registrations, security, design-system,
                  export-engine, deployment, roadmap, sql/smoke.sql
CLAUDE.md         Conventions for AI-assisted work on this repo
```

Import rules: a feature may import other features only through their `api.ts` hooks and types. Pages and components never cross feature boundaries. `shared/ui` never imports from `features`.

---

## 4. How it works

There is no custom API server. The browser talks to Supabase with the anon key and the signed-in user's JWT. PostgreSQL decides what each user may read or write through Row Level Security, and multi-step operations run as `security definer` SQL functions so they are transactional and cannot be bypassed from the client.

```
Component ──▶ feature api.ts hook (TanStack Query) ──▶ supabase-js ──▶ PostgREST
                      │                                                   │
              Zod schema validates input                      RLS policy filters rows
              unwrap() maps errors to Spanish                 RPC re-checks permissions,
                                                              triggers enforce the state machine
```

### Layers of a feature

| Layer | Lives in | Responsibility |
| --- | --- | --- |
| Schema + rules | `supabase/migrations` | Tables, constraints, triggers, RPC. Source of truth for business rules. |
| Data hooks | `features/*/api.ts` | `useQuery` / `useMutation` wrappers, query key factories, Zod schemas, cache invalidation |
| Pages | `features/*/pages` | Compose hooks and UI; handle loading, empty, error and success states; show toasts |
| UI kit | `shared/ui` | Accessible primitives with the NATIUM tokens. Add here only when two features need it. |

### Authorization helpers used by RLS and RPC

`is_platform_admin()`, `is_org_member(org)`, `is_team_member(team)` (approved members only), `is_team_owner(team)`, `is_competition_organizer(comp)`, `can_access_registration(reg)`. Organizers can see a team or athlete only once that team has a non-draft registration in one of their competitions.

### RPC catalog

| Function | Who | What |
| --- | --- | --- |
| `request_team_access`, `decide_team_access`, `revoke_team_access` | coach / team owner | Membership requests and approvals |
| `search_teams_directory(query)` | any user | Fuzzy team search with limited columns |
| `find_similar_athletes(team, first, last, birth?)` | team member | Duplicate detection |
| `resolve_category`, `eligible_events` | internal | Category by age on the reference date; compatible events |
| `get_or_create_registration(comp, team)` | team member | Idempotent draft (unique constraint prevents races) |
| `validate_registration(reg)` | registration access | JSON list of `{level, code, message, athlete_id?, entry_id?}` |
| `submit_registration(reg)` | team member | Validate → snapshot categories → folio `CODE-0001` → `submitted` → history + audit, in one transaction |
| `review_registration(reg, status, reason?)` | organizer | Review transitions; reason mandatory for correction/rejection |
| `save_mark_from_entry(entry)` | team member | Explicit copy of an entry time into best marks |
| `coach_dashboard()`, `organizer_dashboard()` | by role | Aggregate counters |

---

## 5. Key rules to keep intact

- **Times are integers.** Centiseconds in `entry_time_cs` and `time_cs`. Parse and format only with `src/shared/utils/time.ts`. No floats, no strings in the database.
- **Nothing with history is deleted.** Teams, athletes and registrations are deactivated or transitioned. The only delete policy is for a coach's own draft registration.
- **Security is server-side.** Hiding a button is UX; RLS and RPC checks are the guard. Never ship the `service_role` key to the client.
- **No hard-coded sport rules.** Categories, event sets, NT policy and entry limits are configured per competition. The client mirrors eligibility (`features/registrations/eligibility.ts`) only for instant feedback; the server re-validates.
- **Entry time is not a best mark.** `athlete_marks` changes only through an explicit action (`save_mark_from_entry` or manual entry).
- **Brand is configuration.** Product names come from `src/config/brand.ts` and `VITE_BRAND_*`. Do not write "NATIUM" inside features.
- **Every page handles four states.** Loading (skeleton), empty (with a real action), error (`ErrorState` with retry), success (toast). No decorative buttons.

### Registration state machine

```
draft ──submit──▶ submitted ──▶ in_review ──▶ accepted ──▶ exported
  ▲                 │   │             │  │           │            │
  │                 │   └─ accepted ◀─┘  │           └─ in_review ◀┘  (controlled reopen)
  │                 ├── needs_correction ◀┤
  │                 └── rejected ◀───────┘
  └── coach edits ◀── needs_correction ──submit──▶ submitted (folio kept)
```

Allowed transitions live in `registration_transition_allowed()` and are enforced by trigger. Athletes and entries are editable only in `draft` and `needs_correction`. Reasons are mandatory for corrections and rejections. Every change is recorded in `registration_status_history` with actor, timestamp and reason. Details in [docs/registrations.md](docs/registrations.md).

---

## 6. Common tasks

### Add or change a table

1. Create `supabase/migrations/<timestamp>_<name>.sql`. Do not edit migrations already pushed to a shared environment.
2. Enable RLS on the new table and write policies next to the others, reusing the helper predicates.
3. `pnpm db:reset`, then `pnpm db:types`.
4. Extend `docs/sql/smoke.sql` with a check that impersonates the relevant users.

### Add a feature screen

1. Put hooks and the Zod schema in the feature's `api.ts`; use `unwrap()` and the feature's key factory; invalidate on mutation success.
2. Build the page from `shared/ui`. Cover loading, empty, error and success.
3. Register the route in `src/app/router.tsx` under the right `RequireRole` group and add the nav item in `AppShell`.
4. Forms: React Hook Form + `zodResolver`, inputs wrapped in `Field` for labels, errors and accessibility. Keep UI copy in Spanish.

### Add a business rule

Write it in SQL (constraint, trigger or RPC in a new migration), surface its message through `toAppError` in `src/lib/errors.ts`, then mirror it client-side only if the user needs instant feedback.

### Work with the local database directly

```bash
# psql inside the container
docker exec -it supabase_db_swim psql -U postgres -d postgres

# run the RLS/RPC smoke test (impersonates coach, organizer and an outsider)
docker exec -i supabase_db_swim psql -U postgres -d postgres -v ON_ERROR_STOP=1 < docs/sql/smoke.sql

# make yourself platform admin locally
# update public.profiles set role = 'platform_admin' where email = 'you@example.com';
```

---

## 7. Verifying your work

A change is done when all of these hold:

1. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` pass.
2. The feature reads and writes the real local database and survives a page reload.
3. Permissions were checked as the right user and as an outsider (`entrenador2@`). The smoke SQL is the fastest way.
4. Loading, empty, error and success states are visible and designed.
5. It works at phone width with no horizontal scroll (`DataTable` hides secondary columns with `hideOnMobile`).
6. New rules have a test: Vitest for TypeScript utilities, the smoke SQL for database behavior.

Existing tests: `src/shared/utils/time.test.ts` (time parsing/formatting) and `src/features/registrations/eligibility.test.ts` (category and event eligibility). Add component tests with Testing Library as the wizard evolves.

---

## 8. Status and what comes next

| Deliverable | State | Notes |
| --- | --- | --- |
| 1 Foundations | Done | Design tokens, auth, roles, 7 migrations, dashboards |
| 2 Teams & athletes | Done | Directory search, access approvals, duplicate detection, best marks |
| 3 Competitions | Done | Categories, event catalog, enabled events with external codes |
| 4 Registrations | Done | Wizard, server validation, folio, review, history |
| 5 Export engine | **Blocked** | Needs the organizer's real `.mdb` file and software name. Plan in [docs/export-engine.md](docs/export-engine.md). Tables already exist. |
| 6 Quality | Partial | pgTAP tests, route code splitting (main bundle ~940 kB), error reporting, photo/logo upload UI, custom athlete fields UI |

Explicit constraints: do **not** start Stage 2 (heats, lanes, timing, results) and do **not** invent the `.mdb` structure.

### Deploying

No remote Supabase or Vercel project exists yet. [docs/deployment.md](docs/deployment.md) describes the two-project setup (dev and prod), `supabase link` + `pnpm db:push`, Vercel environment variables, and the redirect URLs Auth needs (`/update-password`). Never run `seed.sql` remotely. Grant the first platform admin with SQL.

---

## 9. Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| App shows "Invalid environment configuration" | `.env.local` missing or anon key empty. Run `pnpm db:status` and paste the key. |
| `pnpm db:start` hangs or fails | Docker Desktop not running, or ports 54321–54324 in use. Start Docker, then `pnpm db:stop && pnpm db:start`. |
| Type errors after changing SQL | Run `pnpm db:reset` then `pnpm db:types`. Columns populated by triggers need a default so insert types do not require them. |
| "new row violates row-level security policy" | Expected when the user is not an approved member or organizer. Check the policy in migration 0007 and the helper predicate it uses. |
| "Could not embed because more than one relationship was found" | A table has two FKs to the same target. Hint the FK in the select, e.g. `profiles!team_members_user_id_fkey(...)`. |
| Submit button disabled in wizard step 5 | Server validation returned blocking errors (listed above the summary) or the registration window is closed. |
| Signup email never arrives locally | Open Mailpit at `http://127.0.0.1:54324`. Local auth confirms emails automatically by default. |

---

## 10. Further documentation

- [docs/architecture.md](docs/architecture.md) — folder structure, module boundaries, data-flow conventions, Stage 2 readiness
- [docs/database.md](docs/database.md) — schema, RLS model, RPC catalog, migration workflow
- [docs/registrations.md](docs/registrations.md) — state machine, validation rules, time representation, folio
- [docs/security.md](docs/security.md) — roles, authorization layers, privacy of minors, storage, auditing
- [docs/design-system.md](docs/design-system.md) — tokens, components, motion rules
- [docs/export-engine.md](docs/export-engine.md) — the pending `.mdb` analysis and adapter plan
- [docs/deployment.md](docs/deployment.md) — Supabase projects, Vercel, environments, CI
- [docs/roadmap.md](docs/roadmap.md) — what is done, what is next (NATIUM Meet)
- [CLAUDE.md](CLAUDE.md) — conventions for AI-assisted development

Keep this guide in sync when the setup or conventions change.
