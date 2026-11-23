# Export engine — status: BLOCKED on reference file

The organizer's meet-management software works with Microsoft Access `.mdb` files. Implementing the adapter without a real reference file would mean inventing a structure, which the project explicitly forbids.

## What exists today

- Format-agnostic tables: `export_profiles` (per organization; `format` = adapter key, `config` JSON), `export_jobs` (per competition, optional per team, `version`, `status`, `file_path`, `error_report`), `export_job_items` (per registration).
- Data needed by any adapter is already captured: team `code`, `event_catalog.external_code`, `competition_events.external_code` and `event_number`, category codes, `entry_time_cs`, `no_time`, `folio`.
- The `accepted → exported` transition and the private `exports` bucket with organizer-only read policy.

## Dependency to resolve

Provide, in a new folder `reference/` (git-ignored if it contains personal data):

1. A real `.mdb` exported/used by the organizer's software, ideally with a few teams, athletes and entries.
2. The software name and version, and whether it imports `.mdb` directly or via another format (e.g. Hy-Tek `.hy3`/`.sd3`, Splash Lenex `.lef/.lxf`, CSV).
3. Any import documentation or sample import files.

## Analysis plan (Deliverable 5)

1. Inspect tables, columns, types, PK/FK with `mdbtools` (`mdb-schema`, `mdb-export`) or a Windows/Access session.
2. Identify how teams, athletes, events, categories and times are encoded (codes, units, string formats).
3. Determine the minimum set of tables required for an entries import.
4. Write `docs/export-mapping.md`: NATIUM field → external field, transformations, constants.
5. Choose the generator: if a true `.mdb` must be produced, evaluate writing via Jackcess (Java) or `mdbtools` + template file, run server-side (Edge Function or job runner with the template stored privately). Never rename CSV/JSON/SQLite as `.mdb`.
6. Implement `export_jobs` processing: validate accepted registrations → build file → upload to `exports/<competition_id>/<job_id>.mdb` → mark items → transition registrations to `exported`.
7. Verify by importing the generated file into the organizer's real software before declaring the exporter done.
