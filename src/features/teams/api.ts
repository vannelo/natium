import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { supabase, type Tables } from '@/lib/supabase'
import { unwrap } from '@/lib/errors'
import { useAuth } from '@/features/auth/AuthProvider'

export type Team = Tables<'teams'>
export type TeamMember = Tables<'team_members'> & {
  profile?: Pick<Tables<'profiles'>, 'full_name' | 'email'> | null
}

export const teamSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(120),
  short_name: z.string().trim().min(1, 'Requerido').max(20, 'Máximo 20 caracteres'),
  code: z.string().trim().max(12).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  state: z.string().trim().max(80).optional().or(z.literal('')),
  country: z.string().trim().length(2, 'Código de 2 letras').toUpperCase().default('MX'),
  contact_name: z.string().trim().max(120).optional().or(z.literal('')),
  contact_email: z.email('Correo inválido').optional().or(z.literal('')),
  contact_phone: z.string().trim().max(30).optional().or(z.literal('')),
})
export type TeamInput = z.input<typeof teamSchema>

const nullify = <T extends Record<string, unknown>>(obj: T) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === '' ? null : v])) as T

export const teamKeys = {
  all: ['teams'] as const,
  mine: () => [...teamKeys.all, 'mine'] as const,
  detail: (id: string) => [...teamKeys.all, id] as const,
  members: (id: string) => [...teamKeys.all, id, 'members'] as const,
  myMemberships: () => [...teamKeys.all, 'memberships'] as const,
}

/** Teams where the current user is an approved member. */
export function useMyTeams() {
  const { user } = useAuth()
  return useQuery({
    queryKey: teamKeys.mine(),
    enabled: !!user,
    queryFn: async () => {
      const members = unwrap(
        await supabase.from('team_members').select('team_id, role, status').eq('user_id', user!.id),
      )
      const approvedIds = members.filter((m) => m.status === 'approved').map((m) => m.team_id)
      if (approvedIds.length === 0) return [] as (Team & { my_role: string })[]
      const teams = unwrap(
        await supabase.from('teams').select('*').in('id', approvedIds).order('name'),
      )
      return teams.map((t) => ({
        ...t,
        my_role: members.find((m) => m.team_id === t.id)?.role ?? 'coach',
      }))
    },
  })
}

/** All memberships of the current user (including pending requests). */
export function useMyMemberships() {
  const { user } = useAuth()
  return useQuery({
    queryKey: teamKeys.myMemberships(),
    enabled: !!user,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('team_members')
          .select('*, team:teams(id, name, short_name)')
          .eq('user_id', user!.id),
      ),
  })
}

export function useTeam(teamId: string | undefined) {
  return useQuery({
    queryKey: teamKeys.detail(teamId ?? ''),
    enabled: !!teamId,
    queryFn: async () =>
      unwrap(await supabase.from('teams').select('*').eq('id', teamId!).single()),
  })
}

export function useTeamMembers(teamId: string | undefined) {
  return useQuery({
    queryKey: teamKeys.members(teamId ?? ''),
    enabled: !!teamId,
    queryFn: async () =>
      unwrap(
        await supabase
          .from('team_members')
          .select('*, profile:profiles!team_members_user_id_fkey(full_name, email)')
          .eq('team_id', teamId!)
          .order('requested_at'),
      ) as TeamMember[],
  })
}

export function useSearchTeamsDirectory(query: string) {
  return useQuery({
    queryKey: [...teamKeys.all, 'directory', query],
    enabled: query.trim().length >= 2,
    queryFn: async () => unwrap(await supabase.rpc('search_teams_directory', { p_query: query })),
  })
}

export function useCreateTeam() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (input: TeamInput) => {
      const values = nullify(teamSchema.parse(input))
      return unwrap(
        await supabase
          .from('teams')
          .insert({ ...values, created_by: user!.id })
          .select()
          .single(),
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.all }),
  })
}

export function useUpdateTeam(teamId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: Partial<TeamInput> & { is_active?: boolean }) => {
      const { is_active, ...rest } = input
      const values = nullify(teamSchema.partial().parse(rest))
      return unwrap(
        await supabase
          .from('teams')
          .update({ ...values, ...(is_active !== undefined ? { is_active } : {}) })
          .eq('id', teamId)
          .select()
          .single(),
      )
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.all }),
  })
}

export function useRequestTeamAccess() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (teamId: string) =>
      unwrap(await supabase.rpc('request_team_access', { p_team_id: teamId })),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.all }),
  })
}

export function useDecideTeamAccess(teamId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, approve }: { userId: string; approve: boolean }) =>
      unwrap(
        await supabase.rpc('decide_team_access', {
          p_team_id: teamId,
          p_user_id: userId,
          p_approve: approve,
        }),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.all }),
  })
}

export function useRevokeTeamAccess(teamId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) =>
      unwrap(await supabase.rpc('revoke_team_access', { p_team_id: teamId, p_user_id: userId })),
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.all }),
  })
}
