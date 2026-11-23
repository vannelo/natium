# CLAUDE.md — NATIUM Entry

Guidance for AI assistants and new contributors working in this repository.

## What this is
React + TypeScript + Vite SPA with a Supabase (Postgres) backend for competitive-swimming registrations. UI copy is **Spanish**; code, comments, docs and commit messages are **English**.

## Commands
- `pnpm dev`, `pnpm build`, `pnpm typecheck`, `pnpm lint`, `pnpm test`
- `pnpm db:start` / `pnpm db:reset` (local Supabase via Docker), `pnpm db:types` after schema changes

## Architecture rules (read docs/architecture.md)
- Feature-first: `src/features/<module>/{api.ts,pages,components}`. Shared primitives in `src/shared/ui`, utilities in `src/shared/utils`.
- Data access only through hooks in each feature's `api.ts` (TanStack Query + `supabase` client + `unwrap`). No raw Supabase calls inside components.
- Business rules and state transitions live in SQL (RPC functions, triggers). The client mirrors them only for UX (e.g. `features/registrations/eligibility.ts`), and the server re-validates.
- Authorization: RLS policies + `security definer` RPCs. Never rely on hiding buttons. Never put the service_role key in the client.
- Times are integer centiseconds; use `shared/utils/time.ts`.
- Forms: React Hook Form + Zod schema exported from the feature `api.ts`. Reuse `Field`, `Input`, `Select`, `Button`.
- Every page handles loading (skeleton), empty, error (`ErrorState`), and success (`toast`) states.
- Brand strings come from `src/config/brand.ts`; never hard-code "NATIUM" in features.

## Schema changes
1. Add a new file `supabase/migrations/<timestamp>_<name>.sql` (never edit applied migrations once they are in a shared environment; locally before first push it is fine).
2. `pnpm db:reset`, then `pnpm db:types`.
3. Add/extend RLS policies for any new table. Add tests for new RPCs in `supabase/tests` (pgTAP planned) or the SQL smoke script in docs/database.md.

## Do not
- Implement timing, heats, lanes or results (Stage 2 — NATIUM Meet).
- Invent the `.mdb` export structure. The adapter waits for a real reference file (docs/export-engine.md).
- Hard-delete athletes/teams/registrations with history.
