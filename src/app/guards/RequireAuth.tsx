import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthProvider'
import { FullPageLoader } from '@/shared/ui/FullPageLoader'

export function RequireAuth() {
  const { session, profile, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoader />
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!profile) return <FullPageLoader label="Preparando tu perfil…" />
  return <Outlet />
}

export function RedirectIfAuthed() {
  const { session, loading } = useAuth()
  if (loading) return <FullPageLoader />
  if (session) return <Navigate to="/" replace />
  return <Outlet />
}
