# Design system

Tokens are defined once in `src/index.css` (`@theme`) and consumed through Tailwind utilities.

## Palette

| Token                            | Hex                         | Use                                                     |
| -------------------------------- | --------------------------- | ------------------------------------------------------- |
| `navy`                           | #081826                     | Sidebar, primary buttons, headings                      |
| `ocean`                          | #173D55                     | Links, secondary accents                                |
| `aqua`                           | #43C9E8                     | Primary accent, active states, focus ring               |
| `ice`                            | #EEF6FA                     | App background                                          |
| `steel`                          | #97ADBD                     | Muted text, borders (with `steel-600/800` for contrast) |
| `white`                          | #FFFFFF                     | Content surfaces                                        |
| `success` / `warning` / `danger` | #1F9D6D / #D9930D / #D1434D | Status                                                  |

Typography: Manrope (Google Fonts), tabular numerals via `.tnum` for times and metrics.

## Components (`src/shared/ui`)

Button (primary/secondary/ghost/danger/aqua; loading), Input/Textarea/Select/Checkbox, Field (label + error + a11y wiring), Card/CardHeader/CardBody, Badge (tones), DataTable (responsive: `hideOnMobile`, skeleton rows, empty slot, row click), Modal/ConfirmDialog (native `<dialog>`), EmptyState, PageHeader (breadcrumbs, actions), StatCard, Alert, SearchInput, Pagination, Tabs, Avatar, Skeleton, TimeInput, Toaster (sonner), Logo, status pages (Forbidden/NotFound/ErrorState), FullPageLoader.

## Motion

Keyframes `fade-in`, `rise`, `pop`, `wave`, `shimmer`. Page transitions use `animate-fade-in`; cards `animate-rise`; modals `animate-pop`; login uses two slow wave layers. `prefers-reduced-motion` disables all animation globally.

## Rules

- Forms: compact, 2-column grid on ≥640px, labels uppercase 12px.
- Tables: never horizontal page scroll; secondary columns hidden on mobile and folded into the first cell.
- Every page: loading skeleton, empty state with a real action, error state with retry, toast on success.
- No decorative buttons: every visible action performs a real operation.
