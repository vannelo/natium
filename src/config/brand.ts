/**
 * White-label identity. Everything user-facing that names the product reads
 * from here, so the brand can change without touching feature code.
 */
export const brand = {
  name: import.meta.env.VITE_BRAND_NAME ?? 'NATIUM',
  product: import.meta.env.VITE_BRAND_PRODUCT ?? 'NATIUM Entry',
  tagline: import.meta.env.VITE_BRAND_TAGLINE ?? 'Cada segundo cuenta.',
  descriptor: import.meta.env.VITE_BRAND_DESCRIPTOR ?? 'Swimming Competition Platform',
  modules: {
    teams: 'Teams',
    athletes: 'Athletes',
    events: 'Events',
    entry: 'Entry',
  },
} as const
