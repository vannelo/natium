import { Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import type { Enums } from '@/lib/supabase'
import { ForbiddenPage } from '@/shared/ui/StatusPages'

/** UI-level gate. Real enforcement lives in RLS/RPC; this only shapes navigation. */
export function RequireRole({ roles }: { roles: Enums<'app_role'>[] }) {
  const { profile } = useAuth()
  if (!profile || !roles.includes(profile.role)) return <ForbiddenPage />
  return <Outlet />
}
