import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { unwrap } from '@/lib/errors'

export interface CoachDashboard {
  teams: number
  athletes: number
  open_competitions: number
  active_registrations: number
  needs_correction: number
  pending_requests: number
  deadlines: { id: string; name: string; closes_at: string }[]
}
export interface OrganizerDashboard {
  active_competitions: number
  teams: number
  athletes: number
  registrations: number
  entries: number
  pending_review: number
  needs_correction: number
  exports: number
}

export const useCoachDashboard = () =>
  useQuery({
    queryKey: ['dashboard', 'coach'],
    queryFn: async () => unwrap(await supabase.rpc('coach_dashboard')) as unknown as CoachDashboard,
  })

export const useOrganizerDashboard = () =>
  useQuery({
    queryKey: ['dashboard', 'organizer'],
    queryFn: async () =>
      unwrap(await supabase.rpc('organizer_dashboard')) as unknown as OrganizerDashboard,
  })
