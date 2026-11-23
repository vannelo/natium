# NATIUM Entry

**Swimming Competition Platform — Cada segundo cuenta.**

NATIUM Entry is the first product of the NATIUM ecosystem: a premium SaaS for competitive swimming that lets coaches keep permanent team and athlete records, register swimmers in competitions with entry times, and gives organizers structured registrations ready to export to their meet-management software.

> Status: **Deliverables 1–4 implemented** (foundations, teams & athletes, competitions, registration wizard). Deliverable 5 (export engine) is blocked on a real reference `.mdb` file — see [docs/export-engine.md](docs/export-engine.md). Deliverable 6 (quality/production hardening) is partially done.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4, React Router 7, TanStack Query 5, React Hook Form + Zod 4 |
| Backend | Supabase (PostgreSQL 17, Auth, Row Level Security, RPC functions, private Storage) |
| Tooling | pnpm, Vitest + Testing Library, oxlint, Prettier, Supabase CLI |
| Infra | GitHub (CI workflow), Vercel (SPA hosting), separate dev/prod Supabase projects |

## Quick start (local)

Prerequisites: Node 22+, pnpm 10+, Docker Desktop (for the local Supabase stack).

```bash
pnpm install
pnpm db:start            # starts Postgres/Auth/API locally, applies migrations + seed
pnpm db:status           # prints the local anon key
cp .env.example .env.local   # then paste the anon key into VITE_SUPABASE_ANON_KEY
pnpm dev                 # http://localhost:5173
```

Local demo accounts (password `natium123`, created by `supabase/seed.sql`, **local only**):

| Email | Role |
| --- | --- |
| `admin@natium.local` | Platform admin |
| `organizador@natium.local` | Organizer (owns "Federación Demo", competition `CDP27`) |
| `entrenador@natium.local` | Coach (owner of "Club Acuático Delfines", 5 athletes) |
| `entrenador2@natium.local` | Coach with no team (use to test access requests) |

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm preview` | Vite dev server, production build, preview |
| `pnpm typecheck` | `tsc -b` strict type check |
| `pnpm lint` / `pnpm format` | oxlint / Prettier |
| `pnpm test` / `pnpm test:watch` | Vitest unit tests |
| `pnpm db:start` / `db:stop` / `db:status` | Local Supabase stack |
| `pnpm db:reset` | Drop + re-apply all migrations and the seed |
| `pnpm db:types` | Regenerate `src/lib/database.types.ts` from the local schema |
| `pnpm db:diff` / `db:push` | Create a migration from local changes / push to the linked remote project |

## Documentation

- [docs/architecture.md](docs/architecture.md) — folder structure, module boundaries, data-flow conventions
- [docs/database.md](docs/database.md) — schema, RLS model, RPC catalog, how to add a migration
- [docs/registrations.md](docs/registrations.md) — registration state machine, validation rules, time representation
- [docs/security.md](docs/security.md) — roles, authorization layers, privacy of minors, storage
- [docs/design-system.md](docs/design-system.md) — tokens, components, motion rules
- [docs/export-engine.md](docs/export-engine.md) — the pending `.mdb` analysis and adapter plan
- [docs/deployment.md](docs/deployment.md) — Supabase projects, Vercel, environments, CI
- [docs/roadmap.md](docs/roadmap.md) — what's done, what's next (NATIUM Meet)
- [CLAUDE.md](CLAUDE.md) — conventions for AI-assisted development on this repo

## Project principles

1. Every feature is connected to the real database and protected by RLS; the UI never is the only gate.
2. Business rules live in Postgres functions (`supabase/migrations/*_functions_rpc.sql`) so they are transactional and testable.
3. Times are integers (centiseconds). No floats for official times.
4. Nothing is hard-deleted once it has history: teams, athletes and registrations are deactivated or transitioned.
5. Brand and product names are configuration (`src/config/brand.ts`, `VITE_BRAND_*`).
