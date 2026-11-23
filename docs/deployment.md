# Deployment

## Environments

| Environment         | Supabase                       | Frontend                   | Env file                |
| ------------------- | ------------------------------ | -------------------------- | ----------------------- |
| Local               | `supabase start` (Docker)      | `pnpm dev`                 | `.env.local`            |
| Development/Staging | Supabase project `natium-dev`  | Vercel preview deployments | Vercel env (Preview)    |
| Production          | Supabase project `natium-prod` | Vercel production          | Vercel env (Production) |

Required variables (see `.env.example`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, optional `VITE_BRAND_*`.

## Supabase (per environment)

```bash
supabase login
supabase link --project-ref <ref>
supabase db push                 # applies supabase/migrations
```

Do **not** run `supabase/seed.sql` on remote projects (demo users). Set Auth → URL configuration → Site URL and Redirect URLs to the Vercel domains (`/update-password` is used for recovery links). Enable email confirmations as desired.

Grant the first platform admin manually:

```sql
update public.profiles set role = 'platform_admin' where email = '<you>';
```

## Vercel

- Framework: Vite. Build `pnpm build`, output `dist`.
- `vercel.json` rewrites all routes to `index.html` (SPA).
- Add the env vars for Preview and Production separately (different Supabase projects).

## CI

`.github/workflows/ci.yml` runs typecheck, lint, unit tests and build on every push/PR. Add a job with the Supabase CLI (`supabase db start && supabase db lint`) when pgTAP tests are introduced.

## Pending for production hardening (Deliverable 6)

- pgTAP tests for RLS and RPCs (the SQL smoke script in `docs/sql/smoke.sql` is the seed for these).
- Route-level code splitting (`React.lazy`) to reduce the ~940 kB main bundle.
- Error reporting (e.g. Sentry) wired to `toAppError`.
- Rate limiting / captcha on signup via Supabase Auth settings.
