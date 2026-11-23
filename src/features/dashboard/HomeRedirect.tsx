import { Navigate } from 'react-router-dom'
import { homeForRole, useAuth } from '@/features/auth/AuthProvider'

export function HomeRedirect() {
  const { profile } = useAuth()
  return <Navigate to={homeForRole(profile?.role)} replace />
}
