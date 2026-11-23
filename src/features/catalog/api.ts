import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase, type Tables } from '@/lib/supabase'
import { unwrap } from '@/lib/errors'

export type CatalogEvent = Tables<'event_catalog'>

export const catalogEventSchema = z.object({
  distance_m: z.coerce.number().int().min(25).max(10000),
  stroke: z.enum(['free', 'back', 'breast', 'fly', 'medley']),
  name: z.string().trim().min(3).max(80),
  external_code: z.string().trim().max(20).optional().or(z.literal('')),
  is_relay: z.boolean().default(false),
  sort_order: z.coerce.number().int().default(0),
})
export type CatalogEventInput = z.input<typeof catalogEventSchema>

export const catalogKeys = { all: ['event_catalog'] as const }

export function useEventCatalog() {
  return useQuery({
    queryKey: catalogKeys.all,
    staleTime: 5 * 60_000,
    queryFn: async () =>
      unwrap(
        await supabase.from('event_catalog').select('*').order('sort_order').order('distance_m'),
      ),
  })
}

export function useUpsertCatalogEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: CatalogEventInput & { id?: string }) => {
      const v = catalogEventSchema.parse(input)
      const row = { ...v, external_code: v.external_code || null }
      if (id)
        return unwrap(
          await supabase.from('event_catalog').update(row).eq('id', id).select().single(),
        )
      return unwrap(await supabase.from('event_catalog').insert(row).select().single())
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.all }),
  })
}

export function useToggleCatalogEvent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) =>
      unwrap(
        await supabase.from('event_catalog').update({ is_active }).eq('id', id).select().single(),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: catalogKeys.all }),
  })
}
