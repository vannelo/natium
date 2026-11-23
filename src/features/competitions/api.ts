import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase, type Enums, type Tables } from '@/lib/supabase'
import { unwrap } from '@/lib/errors'
import { useAuth } from '@/features/auth/AuthProvider'

export type Competition = Tables<'competitions'>
export type Category = Tables<'competition_categories'>
export type CompetitionEvent = Tables<'competition_events'> & {
  event: Pick<Tables<'event_catalog'>, 'id' | 'name' | 'distance_m' | 'stroke'> | null
  category?: Pick<Category, 'id' | 'name'> | null
}
export type Organization = Tables<'organizations'>

export const competitionSchema = z
  .object({
    name: z.string().trim().min(3, 'Mínimo 3 caracteres').max(160),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9-]{2,12}$/, 'Solo letras, números y guiones (2-12)'),
    description: z.string().trim().max(2000).optional().or(z.literal('')),
    start_date: z.string().min(1, 'Requerido'),
    end_date: z.string().min(1, 'Requerido'),
    venue: z.string().trim().max(160).optional().or(z.literal('')),
    city: z.string().trim().max(80).optional().or(z.literal('')),
    registration_opens_at: z.string().min(1, 'Requerido'),
    registration_closes_at: z.string().min(1, 'Requerido'),
    pool_course: z.enum(['SCM', 'LCM', 'OTHER']),
    pool_length_m: z.coerce.number().int().positive(),
    age_reference_date: z.string().optional().or(z.literal('')),
    max_entries_per_athlete: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .or(z.literal(''))
      .or(z.nan()),
    allow_no_time: z.boolean().default(false),
    requirements: z.string().trim().max(2000).optional().or(z.literal('')),
  })
  .refine((d) => d.end_date >= d.start_date, {
    message: 'Debe ser igual o posterior al inicio',
    path: ['end_date'],
  })
  .refine((d) => new Date(d.registration_closes_at) > new Date(d.registration_opens_at), {
    message: 'Debe ser posterior a la apertura',
    path: ['registration_closes_at'],
  })
export type CompetitionInput = z.input<typeof competitionSchema>

export const categorySchema = z
  .object({
    name: z.string().trim().min(1, 'Requerido').max(60),
    code: z.string().trim().max(12).optional().or(z.literal('')),
    sex: z.enum(['F', 'M', '']).default(''),
    min_age: z.coerce.number().int().min(0).max(99),
    max_age: z.coerce.number().int().min(0).max(99),
    sort_order: z.coerce.number().int().default(0),
  })
  .refine((d) => d.max_age >= d.min_age, {
    message: 'Debe ser mayor o igual a la mínima',
    path: ['max_age'],
  })
export type CategoryInput = z.input<typeof categorySchema>

export const competitionKeys = {
  all: ['competitions'] as const,
  open: () => [...competitionKeys.all, 'open'] as const,
  org: () => [...competitionKeys.all, 'org'] as const,
  detail: (id: string) => [...competitionKeys.all, id] as const,
  categories: (id: string) => [...competitionKeys.all, id, 'categories'] as const,
  events: (id: string) => [...competitionKeys.all, id, 'events'] as const,
}

export function useMyOrganization() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['organization', 'mine'],
    enabled: !!user,
    queryFn: async () => {
      const members = unwrap(
        await supabase
          .from('organization_members')
          .select('organization_id, role')
          .eq('user_id', user!.id)
          .limit(1),
      )
      const m = members[0]
      if (!m) return null
      const org = unwrap(
        await supabase.from('organizations').select('*').eq('id', m.organization_id).single(),
      )
      return { ...org, my_role: m.role }
    },
  })
}

export const organizationSchema = z.object({
  name: z.string().trim().min(3).max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{3,40}$/, 'Solo minúsculas, números y guiones'),
  contact_email: z.email('Correo inválido').optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  state: z.string().trim().max(80).optional().or(z.literal('')),
  country: z.string().trim().length(2).toUpperCase().default('MX'),
})
export type OrganizationInput = z.input<typeof organizationSchema>

export function useSaveOrganization() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ id, ...input }: OrganizationInput & { id?: string }) => {
      const v = organizationSchema.parse(input)
      const row = {
        ...v,
        contact_email: v.contact_email || null,
        city: v.city || null,
        state: v.state || null,
      }
      if (id)
        return unwrap(
          await supabase.from('organizations').update(row).eq('id', id).select().single(),
        )
      return unwrap(
        await supabase
          .from('organizations')
          .insert({ ...row, created_by: user!.id })
          .select()
          .single(),
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['organization'] }),
  })
}

/** Published competitions visible to coaches. */
export function useOpenCompetitions() {
  return useQuery({
    queryKey: competitionKeys.open(),
    queryFn: async () =>
      unwrap(
        await supabase
          .from('competitions')
          .select('*, organization:organizations(name)')
          .neq('status', 'draft')
          .order('registration_closes_at'),
      ),
  })
}

export function useOrgCompetitions() {
  const org = useMyOrganization()
  return useQuery({
    queryKey: competitionKeys.org(),
    enabled: !!org.data,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('competitions')
          .select('*')
          .eq('organization_id', org.data!.id)
          .order('start_date', { ascending: false }),
      ),
  })
}

export function useCompetition(id: string | undefined) {
  return useQuery({
    queryKey: competitionKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('competitions')
          .select('*, organization:organizations(name)')
          .eq('id', id!)
          .single(),
      ),
  })
}

export function useCategories(competitionId: string | undefined) {
  return useQuery({
    queryKey: competitionKeys.categories(competitionId ?? ''),
    enabled: !!competitionId,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('competition_categories')
          .select('*')
          .eq('competition_id', competitionId!)
          .order('sort_order')
          .order('min_age'),
      ),
  })
}

export function useCompetitionEvents(competitionId: string | undefined) {
  return useQuery({
    queryKey: competitionKeys.events(competitionId ?? ''),
    enabled: !!competitionId,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('competition_events')
          .select(
            '*, event:event_catalog(id, name, distance_m, stroke), category:competition_categories(id, name)',
          )
          .eq('competition_id', competitionId!)
          .order('sort_order')
          .order('event_number'),
      ) as CompetitionEvent[],
  })
}

const toPayload = (v: z.output<typeof competitionSchema>) => ({
  ...v,
  description: v.description || null,
  venue: v.venue || null,
  city: v.city || null,
  requirements: v.requirements || null,
  age_reference_date: v.age_reference_date || null,
  max_entries_per_athlete:
    typeof v.max_entries_per_athlete === 'number' && !Number.isNaN(v.max_entries_per_athlete)
      ? v.max_entries_per_athlete
      : null,
  registration_opens_at: new Date(v.registration_opens_at).toISOString(),
  registration_closes_at: new Date(v.registration_closes_at).toISOString(),
})

export function useSaveCompetition() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({
      id,
      organization_id,
      ...input
    }: CompetitionInput & { id?: string; organization_id: string }) => {
      const payload = toPayload(competitionSchema.parse(input))
      if (id)
        return unwrap(
          await supabase.from('competitions').update(payload).eq('id', id).select().single(),
        )
      return unwrap(
        await supabase
          .from('competitions')
          .insert({ ...payload, organization_id, created_by: user!.id })
          .select()
          .single(),
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: competitionKeys.all }),
  })
}

export function useSetCompetitionStatus(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (status: Enums<'competition_status'>) =>
      unwrap(await supabase.from('competitions').update({ status }).eq('id', id).select().single()),
    onSuccess: () => qc.invalidateQueries({ queryKey: competitionKeys.all }),
  })
}

export function useSaveCategory(competitionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: CategoryInput & { id?: string }) => {
      const v = categorySchema.parse(input)
      const row = { ...v, sex: v.sex || null, code: v.code || null, competition_id: competitionId }
      if (id)
        return unwrap(
          await supabase.from('competition_categories').update(row).eq('id', id).select().single(),
        )
      return unwrap(await supabase.from('competition_categories').insert(row).select().single())
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: competitionKeys.detail(competitionId) }),
  })
}

export function useDeleteCategory(competitionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(await supabase.from('competition_categories').delete().eq('id', id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: competitionKeys.detail(competitionId) }),
  })
}

/** Replace the enabled set of events for a competition with the given selection. */
export function useSyncCompetitionEvents(competitionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (
      selection: { event_catalog_id: string; sex: Enums<'athlete_sex'> | null }[],
    ) => {
      const existing = unwrap(
        await supabase
          .from('competition_events')
          .select('id, event_catalog_id, sex, category_id')
          .eq('competition_id', competitionId),
      )
      const keyOf = (e: { event_catalog_id: string; sex: string | null }) =>
        `${e.event_catalog_id}|${e.sex ?? ''}`
      const wanted = new Set(selection.map(keyOf))
      const have = new Map(existing.filter((e) => !e.category_id).map((e) => [keyOf(e), e.id]))
      const toDelete = [...have.entries()].filter(([k]) => !wanted.has(k)).map(([, id]) => id)
      const toInsert = selection.filter((s) => !have.has(keyOf(s)))
      if (toDelete.length)
        unwrap(await supabase.from('competition_events').delete().in('id', toDelete))
      if (toInsert.length) {
        let n = existing.length
        unwrap(
          await supabase
            .from('competition_events')
            .insert(
              toInsert.map((s) => ({
                competition_id: competitionId,
                event_catalog_id: s.event_catalog_id,
                sex: s.sex,
                event_number: ++n,
                sort_order: n,
              })),
            ),
        )
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: competitionKeys.events(competitionId) }),
  })
}

export function useUpdateCompetitionEvent(competitionId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: {
      id: string
      external_code?: string | null
      event_number?: number | null
      is_active?: boolean
    }) =>
      unwrap(
        await supabase.from('competition_events').update(patch).eq('id', id).select().single(),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: competitionKeys.events(competitionId) }),
  })
}

export function registrationWindow(
  c: Pick<Competition, 'status' | 'registration_opens_at' | 'registration_closes_at'>,
) {
  const now = Date.now()
  if (c.status !== 'published') return 'closed' as const
  if (now < Date.parse(c.registration_opens_at)) return 'upcoming' as const
  if (now > Date.parse(c.registration_closes_at)) return 'closed' as const
  return 'open' as const
}
