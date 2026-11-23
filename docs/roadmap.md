# Roadmap

## Done (v0.1)

- **Deliverable 1 – Foundations**: Vite/React/TS, Tailwind v4 tokens, routing with role-aware shell, Supabase Auth (signup with role, login, password reset), profiles & roles, 7 migrations with RLS, dashboards.
- **Deliverable 2 – Teams & athletes**: team CRUD, fuzzy directory + access requests + owner approvals, athlete records with duplicate detection, history, best marks, soft deactivation.
- **Deliverable 3 – Competitions**: organization setup, competition CRUD with configurable rules, categories, event catalog + per-competition enabled events (number, external code), publish/close/finish.
- **Deliverable 4 – Registrations**: 5-step wizard with persisted drafts, eligibility, time capture, server validation, folio receipt, organizer review with mandatory reasons, status history, edit locks.

## Next

- **Deliverable 5 – Export engine**: blocked on reference `.mdb` (docs/export-engine.md).
- **Deliverable 6 – Quality**: pgTAP tests, component tests for the wizard, code splitting, Sentry, accessibility audit, production checklist.
- Custom athlete fields UI (tables exist: `competition_custom_fields`, `athlete_custom_values`).
- Team logo / athlete photo upload UI (buckets and policies exist).
- Email notifications on status changes (Supabase Edge Function + provider).

## Stage 2 – NATIUM Meet (not started by design)

Heats/series, lanes, seeding, timing, results, DQs, rankings, records, reports, public results, sport history.
