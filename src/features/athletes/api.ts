import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase, type Enums, type Tables } from '@/lib/supabase'
import { unwrap } from '@/lib/errors'
import { useAuth } from '@/features/auth/AuthProvider'

export type Athlete = Tables<'athletes'>
export type AthleteWithTeam = Athlete & {
  team: Pick<Tables<'teams'>, 'id' | 'name' | 'short_name'> | null
}

export const athleteSchema = z.object({
  first_name: z.string().trim().min(1, 'Requerido').max(80),
  last_name: z.string().trim().min(1, 'Requerido').max(120),
  birth_date: z
    .string()
    .min(1, 'Requerido')
    .refine((d) => !Number.isNaN(Date.parse(d)) && new Date(d) <= new Date(), 'Fecha inválida'),
  sex: z.enum(['F', 'M'], { message: 'Selecciona una opción' }),
  team_id: z.uuid('Selecciona un equipo'),
})
export type AthleteInput = z.infer<typeof athleteSchema>

export const athleteKeys = {
  all: ['athletes'] as const,
  list: (f: AthleteFilters) => [...athleteKeys.all, 'list', f] as const,
  detail: (id: string) => [...athleteKeys.all, id] as const,
  history: (id: string) => [...athleteKeys.all, id, 'history'] as const,
  marks: (id: string) => [...athleteKeys.all, id, 'marks'] as const,
}

export interface AthleteFilters {
  teamId?: string
  search?: string
  status?: Enums<'record_status'> | 'all'
  sex?: Enums<'athlete_sex'> | ''
}

export function useAthletes(filters: AthleteFilters) {
  const { user } = useAuth()
  return useQuery({
    queryKey: athleteKeys.list(filters),
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from('athletes')
        .select('*, team:teams(id, name, short_name)')
        .order('last_name')
        .order('first_name')
      if (filters.teamId) q = q.eq('team_id', filters.teamId)
      if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status)
      if (filters.sex) q = q.eq('sex', filters.sex)
      if (filters.search?.trim()) {
        const s = filters.search.trim().replace(/[%,]/g, '')
        q = q.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,display_id.ilike.%${s}%`)
      }
      return unwrap(await q) as AthleteWithTeam[]
    },
  })
}

export function useAthlete(id: string | undefined) {
  return useQuery({
    queryKey: athleteKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('athletes')
          .select('*, team:teams(id, name, short_name)')
          .eq('id', id!)
          .single(),
      ) as AthleteWithTeam,
  })
}

export function useAthleteHistory(id: string | undefined) {
  return useQuery({
    queryKey: athleteKeys.history(id ?? ''),
    enabled: !!id,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('registration_athletes')
          .select(
            'id, created_at, registration:registrations(id, folio, status, competition:competitions(id, name, start_date)), entries:registration_entries(id, entry_time_cs, no_time, event:competition_events(event:event_catalog(name)))',
          )
          .eq('athlete_id', id!)
          .order('created_at', { ascending: false }),
      ),
  })
}

export function useAthleteMarks(id: string | undefined) {
  return useQuery({
    queryKey: athleteKeys.marks(id ?? ''),
    enabled: !!id,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('athlete_marks')
          .select('*, event:event_catalog(name, distance_m, stroke)')
          .eq('athlete_id', id!)
          .order('time_cs'),
      ),
  })
}

export function useSimilarAthletes(input: {
  teamId: string
  first: string
  last: string
  birth?: string
}) {
  const enabled = !!input.teamId && input.first.trim().length >= 2 && input.last.trim().length >= 2
  return useQuery({
    queryKey: [...athleteKeys.all, 'similar', input],
    enabled,
    queryFn: async () =>
      unwrap(
        await supabase.rpc('find_similar_athletes', {
          p_team_id: input.teamId,
          p_first_name: input.first,
          p_last_name: input.last,
          p_birth_date: input.birth || undefined,
        }),
      ),
  })
}

export function useCreateAthlete() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (input: AthleteInput) =>
      unwrap(
        await supabase
          .from('athletes')
          .insert({ ...athleteSchema.parse(input), created_by: user!.id })
          .select()
          .single(),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: athleteKeys.all }),
  })
}

export function useUpdateAthlete(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<AthleteInput> & { status?: Enums<'record_status'> }) =>
      unwrap(await supabase.from('athletes').update(input).eq('id', id).select().single()),
    onSuccess: () => qc.invalidateQueries({ queryKey: athleteKeys.all }),
  })
}

export function useAddManualMark(athleteId: string) {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (input: {
      event_catalog_id: string
      pool_course: Enums<'pool_course'>
      time_cs: number
      recorded_at: string
    }) =>
      unwrap(
        await supabase
          .from('athlete_marks')
          .insert({ ...input, athlete_id: athleteId, source: 'manual', created_by: user!.id })
          .select()
          .single(),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: athleteKeys.marks(athleteId) }),
  })
}

export function useDeleteMark(athleteId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (markId: string) =>
      unwrap(await supabase.from('athlete_marks').delete().eq('id', markId)),
    onSuccess: () => qc.invalidateQueries({ queryKey: athleteKeys.marks(athleteId) }),
  })
}
