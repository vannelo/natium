import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ClipboardList,
  Flag,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Shield,
  Trophy,
  Users,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { Avatar } from '@/shared/ui/Avatar'
import { Logo } from '@/shared/ui/Logo'
import { cn } from '@/shared/utils/cn'
import { roleLabel } from '@/shared/utils/labels'
import type { Enums } from '@/lib/supabase'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

const navByRole: Record<Enums<'app_role'>, NavItem[]> = {
  coach: [
    { to: '/dashboard', label: 'Panel', icon: <LayoutDashboard className="size-4" />, end: true },
    { to: '/teams', label: 'Equipos', icon: <Users className="size-4" /> },
    { to: '/athletes', label: 'Atletas', icon: <UserRound className="size-4" /> },
    { to: '/competitions', label: 'Competencias', icon: <Trophy className="size-4" /> },
    { to: '/registrations', label: 'Inscripciones', icon: <ClipboardList className="size-4" /> },
  ],
  organizer: [
    { to: '/org', label: 'Panel', icon: <LayoutDashboard className="size-4" />, end: true },
    { to: '/org/competitions', label: 'Competencias', icon: <Trophy className="size-4" /> },
    {
      to: '/org/registrations',
      label: 'Inscripciones',
      icon: <ClipboardList className="size-4" />,
    },
    { to: '/org/catalog', label: 'Catálogo de pruebas', icon: <BookOpen className="size-4" /> },
    { to: '/org/organization', label: 'Organización', icon: <Flag className="size-4" /> },
  ],
  platform_admin: [
    { to: '/admin', label: 'Panel', icon: <LayoutDashboard className="size-4" />, end: true },
    { to: '/admin/users', label: 'Usuarios', icon: <Shield className="size-4" /> },
    { to: '/admin/audit', label: 'Auditoría', icon: <ScrollText className="size-4" /> },
    { to: '/org/catalog', label: 'Catálogo de pruebas', icon: <BookOpen className="size-4" /> },
  ],
}

export function AppShell() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const items = navByRole[profile?.role ?? 'coach']

  useEffect(() => setOpen(false), [location.pathname])

  const nav = (
    <nav aria-label="Principal" className="flex flex-1 flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors',
              isActive ? 'bg-white/10 text-white' : 'text-steel hover:bg-white/5 hover:text-white',
            )
          }
        >
          {({ isActive }) => (
            <>
              <span className={cn(isActive ? 'text-aqua' : 'text-steel')}>{item.icon}</span>
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )

  const footer = (
    <div className="mt-auto border-t border-white/10 pt-4">
      <div className="flex items-center gap-3 px-2">
        <Avatar name={profile?.full_name || profile?.email || '?'} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {profile?.full_name || profile?.email}
          </p>
          <p className="truncate text-xs text-steel">{profile ? roleLabel[profile.role] : ''}</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await signOut()
            navigate('/login', { replace: true })
          }}
          aria-label="Cerrar sesión"
          className="rounded-md p-2 text-steel transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-ice">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy p-4 lg:flex">
        <div className="mb-8 px-2 pt-2">
          <Logo variant="light" />
        </div>
        {nav}
        {footer}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-navy/60 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-navy p-4 shadow-float animate-rise">
            <div className="mb-6 flex items-center justify-between px-2 pt-2">
              <Logo variant="light" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="rounded-md p-2 text-steel hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            {nav}
            {footer}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ice-200 bg-white/90 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="rounded-md p-2 text-navy hover:bg-ice"
          >
            <Menu className="size-5" />
          </button>
          <Logo compact />
          <Avatar name={profile?.full_name || profile?.email || '?'} size="sm" />
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div key={location.pathname} className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
