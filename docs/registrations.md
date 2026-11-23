# Registrations (NATIUM Entry)

## State machine

```
            submit              review
 draft ─────────────▶ submitted ─────────▶ in_review ──▶ accepted ──▶ exported
   ▲                     │  │                 │  │           │            │
   │                     │  └── accepted ◀────┘  │           └─ in_review ◀┘ (controlled reopen)
   │                     ├── needs_correction ◀──┤
   │                     └── rejected ◀──────────┘
   │                                          │
   └──────── (coach edits) ◀── needs_correction ──submit──▶ submitted
```

Allowed transitions are the single source of truth in `registration_transition_allowed()` and enforced by trigger:

| From                    | To                                              | Actor                         |
| ----------------------- | ----------------------------------------------- | ----------------------------- |
| draft, needs_correction | submitted                                       | coach (`submit_registration`) |
| submitted               | in_review, accepted, needs_correction, rejected | organizer                     |
| in_review               | accepted, needs_correction, rejected            | organizer                     |
| accepted                | exported, in_review                             | export job / organizer        |
| exported, rejected      | in_review                                       | organizer (controlled change) |

Every transition stores actor, timestamp, previous/new status and reason in `registration_status_history`. Reason is mandatory for `needs_correction` and `rejected`.

Coaches can edit athletes/entries only in `draft` and `needs_correction` (trigger `registration_children_guard`). Exported registrations are read-only for coaches; the organizer must reopen them.

## Duplicate prevention

- `unique (competition_id, team_id)` on `registrations`: one registration per team per competition. `get_or_create_registration` is idempotent so concurrent clicks return the same draft.
- `unique (registration_id, athlete_id)` and `unique (registration_athlete_id, competition_event_id)`.
- Validation warns when an athlete already appears in another team's submitted registration for the same competition.

## Validation (`validate_registration`)

Errors (blocking): competition not published / window closed, no athletes, athlete inactive, no category when the competition defines categories, no entries for an athlete, more entries than `max_entries_per_athlete`, missing time when `no_time` is false, `no_time` when the competition disallows NT, event not eligible for sex/category.
Warnings: athlete already registered by another team.

The wizard shows the same issues in step 5 and the submit button is disabled while errors exist. The server re-runs validation inside `submit_registration`, so a stale client cannot submit invalid data.

## Wizard (5 steps)

1. **Competencia** — convocatoria, dates, rules, enabled event count.
2. **Nadadores** — multi-select active athletes of the team; category badge computed client-side (`eligibility.ts` mirrors SQL).
3. **Pruebas** — per-athlete eligible events, respecting the per-athlete limit.
4. **Marcas** — `TimeInput` (mm:ss.cc) with normalization; NT checkbox only when allowed.
5. **Confirmación** — server validation, summary, submit → digital receipt with folio.

Drafts persist on every "Siguiente" (athlete set sync, entry upsert/delete). Going back never loses data.

## Time representation

Stored as **integer centiseconds** (`entry_time_cs`, `time_cs`), max 59:59.99. Parsing/formatting in `src/shared/utils/time.ts` (unit-tested). Accepted inputs: `00:29.45`, `1:05.3`, `29.45`, `29,45`, `30`.

Three distinct concepts: entry time (`registration_entries`), best mark (`athlete_marks`, never auto-updated; `save_mark_from_entry` is an explicit action), official result (Stage 2).

## Folio

`<competition code>-<4-digit sequence>` e.g. `CDP27-0001`, assigned at first submission from `competitions.folio_seq` under row lock; preserved on re-submission after corrections.
