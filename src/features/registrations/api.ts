import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase, type Enums, type Tables } from '@/lib/supabase'
import { unwrap } from '@/lib/errors'
import { useAuth } from '@/features/auth/AuthProvider'
import { athleteKeys } from '@/features/athletes/api'

export type Registration = Tables<'registrations'>
export type RegistrationAthlete = Tables<'registration_athletes'> & {
  athlete: Pick<
    Tables<'athletes'>,
    'id' | 'display_id' | 'first_name' | 'last_name' | 'birth_date' | 'sex' | 'status'
  > | null
  category: Pick<Tables<'competition_categories'>, 'id' | 'name'> | null
}
export type RegistrationEntry = Tables<'registration_entries'>
export type RegistrationDetail = Registration & {
  competition: Tables<'competitions'> | null
  team: Pick<Tables<'teams'>, 'id' | 'name' | 'short_name' | 'code'> | null
  athletes: RegistrationAthlete[]
  entries: RegistrationEntry[]
}
export type RegistrationListItem = Registration & {
  competition: Pick<
    Tables<'competitions'>,
    'id' | 'name' | 'code' | 'start_date' | 'registration_closes_at'
  > | null
  team: Pick<Tables<'teams'>, 'id' | 'name' | 'short_name'> | null
  athletes_count: number
  entries_count: number
}
export interface ValidationIssue {
  level: 'error' | 'warning'
  code: string
  message: string
  athlete_id?: string
  entry_id?: string
}

export const registrationKeys = {
  all: ['registrations'] as const,
  mine: () => [...registrationKeys.all, 'mine'] as const,
  org: (competitionId?: string) =>
    [...registrationKeys.all, 'org', competitionId ?? 'all'] as const,
  detail: (id: string) => [...registrationKeys.all, id] as const,
  history: (id: string) => [...registrationKeys.all, id, 'history'] as const,
  validation: (id: string) => [...registrationKeys.all, id, 'validation'] as const,
}

const LIST_SELECT =
  '*, competition:competitions(id, name, code, start_date, registration_closes_at), team:teams(id, name, short_name), athletes:registration_athletes(count), entries:registration_entries(count)'
type RawList = Omit<RegistrationListItem, 'athletes_count' | 'entries_count'> & {
  athletes: { count: number }[]
  entries: { count: number }[]
}
const mapList = (rows: RawList[]): RegistrationListItem[] =>
  rows.map(({ athletes, entries, ...r }) => ({
    ...r,
    athletes_count: athletes[0]?.count ?? 0,
    entries_count: entries[0]?.count ?? 0,
  }))

/** Registrations of the teams the coach belongs to (RLS restricts). */
export function useMyRegistrations() {
  const { user } = useAuth()
  return useQuery({
    queryKey: registrationKeys.mine(),
    enabled: !!user,
    queryFn: async () =>
      mapList(
        unwrap(
          await supabase
            .from('registrations')
            .select(LIST_SELECT)
            .order('updated_at', { ascending: false }),
        ) as unknown as RawList[],
      ),
  })
}

/** Non-draft registrations the organizer can see, optionally for one competition. */
export function useOrgRegistrations(
  competitionId?: string,
  status?: Enums<'registration_status'> | '',
) {
  return useQuery({
    queryKey: [...registrationKeys.org(competitionId), status ?? ''],
    queryFn: async () => {
      let q = supabase
        .from('registrations')
        .select(LIST_SELECT)
        .neq('status', 'draft')
        .order('submitted_at', { ascending: false })
      if (competitionId) q = q.eq('competition_id', competitionId)
      if (status) q = q.eq('status', status)
      return mapList(unwrap(await q) as unknown as RawList[])
    },
  })
}

export function useRegistration(id: string | undefined) {
  return useQuery({
    queryKey: registrationKeys.detail(id ?? ''),
    enabled: !!id,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('registrations')
          .select(
            '*, competition:competitions(*), team:teams(id, name, short_name, code), athletes:registration_athletes(*, athlete:athletes(id, display_id, first_name, last_name, birth_date, sex, status), category:competition_categories(id, name)), entries:registration_entries(*)',
          )
          .eq('id', id!)
          .single(),
      ) as unknown as RegistrationDetail,
  })
}

export function useRegistrationHistory(id: string | undefined) {
  return useQuery({
    queryKey: registrationKeys.history(id ?? ''),
    enabled: !!id,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('registration_status_history')
          .select('*, actor:profiles(full_name)')
          .eq('registration_id', id!)
          .order('changed_at', { ascending: false }),
      ),
  })
}

export function useValidation(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: registrationKeys.validation(id ?? ''),
    enabled: !!id && enabled,
    staleTime: 0,
    queryFn: async () =>
      (unwrap(await supabase.rpc('validate_registration', { p_registration_id: id! })) ??
        []) as unknown as ValidationIssue[],
  })
}

export function useGetOrCreateRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ competitionId, teamId }: { competitionId: string; teamId: string }) =>
      unwrap(
        await supabase.rpc('get_or_create_registration', {
          p_competition_id: competitionId,
          p_team_id: teamId,
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: registrationKeys.all }),
  })
}

/** Make the registration's athlete set equal to `athleteIds` (entries of removed athletes cascade). */
export function useSetRegistrationAthletes(registrationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (athleteIds: string[]) => {
      const current = unwrap(
        await supabase
          .from('registration_athletes')
          .select('id, athlete_id')
          .eq('registration_id', registrationId),
      )
      const have = new Set(current.map((c) => c.athlete_id))
      const toRemove = current.filter((c) => !athleteIds.includes(c.athlete_id)).map((c) => c.id)
      const toAdd = athleteIds.filter((id) => !have.has(id))
      if (toRemove.length)
        unwrap(await supabase.from('registration_athletes').delete().in('id', toRemove))
      if (toAdd.length)
        unwrap(
          await supabase
            .from('registration_athletes')
            .insert(toAdd.map((athlete_id) => ({ registration_id: registrationId, athlete_id }))),
        )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: registrationKeys.detail(registrationId) }),
  })
}

export interface EntryDraft {
  registration_athlete_id: string
  competition_event_id: string
  entry_time_cs: number | null
  no_time: boolean
}

/** Sync entries: upsert the given drafts, delete those not present. */
export function useSyncEntries(registrationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (drafts: EntryDraft[]) => {
      const current = unwrap(
        await supabase
          .from('registration_entries')
          .select('id, registration_athlete_id, competition_event_id')
          .eq('registration_id', registrationId),
      )
      const key = (e: { registration_athlete_id: string; competition_event_id: string }) =>
        `${e.registration_athlete_id}|${e.competition_event_id}`
      const wanted = new Map(drafts.map((d) => [key(d), d]))
      const toDelete = current.filter((c) => !wanted.has(key(c))).map((c) => c.id)
      if (toDelete.length)
        unwrap(await supabase.from('registration_entries').delete().in('id', toDelete))
      if (drafts.length) {
        unwrap(
          await supabase.from('registration_entries').upsert(
            drafts.map((d) => ({ ...d, registration_id: registrationId })),
            { onConflict: 'registration_athlete_id,competition_event_id' },
          ),
        )
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationKeys.detail(registrationId) })
      qc.invalidateQueries({ queryKey: registrationKeys.validation(registrationId) })
    },
  })
}

export function useSubmitRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(await supabase.rpc('submit_registration', { p_registration_id: id })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationKeys.all })
      qc.invalidateQueries({ queryKey: athleteKeys.all })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useReviewRegistration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      reason,
    }: {
      id: string
      status: Enums<'registration_status'>
      reason?: string
    }) =>
      unwrap(
        await supabase.rpc('review_registration', {
          p_registration_id: id,
          p_status: status,
          p_reason: reason,
        }),
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: registrationKeys.all })
      qc.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useDeleteDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) =>
      unwrap(await supabase.from('registrations').delete().eq('id', id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: registrationKeys.all }),
  })
}

export function useSaveMarkFromEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (entryId: string) =>
      unwrap(await supabase.rpc('save_mark_from_entry', { p_entry_id: entryId })),
    onSuccess: () => qc.invalidateQueries({ queryKey: athleteKeys.all }),
  })
}
