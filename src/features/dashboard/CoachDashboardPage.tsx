import { Link } from 'react-router-dom'
import { AlertTriangle, ClipboardList, Plus, Timer, Trophy, UserRound, Users } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import { Badge, Button, Card, CardHeader, PageHeader, StatCard } from '@/shared/ui'
import { fmtDateTime, fmtRelative } from '@/shared/utils/dates'
import { registrationStatusLabel, registrationStatusTone } from '@/shared/utils/labels'
import { useMyRegistrations } from '@/features/registrations/api'
import { useCoachDashboard } from './api'

export function CoachDashboardPage() {
  const { profile } = useAuth()
  const dash = useCoachDashboard()
  const regs = useMyRegistrations()
  const d = dash.data
  const firstName = profile?.full_name?.split(' ')[0]

  return (
    <>
      <PageHeader
        title={`Hola${firstName ? `, ${firstName}` : ''}`}
        description="Resumen de tus equipos, nadadores e inscripciones."
        actions={
          <>
            <Link to="/athletes">
              <Button variant="secondary" leftIcon={<Plus className="size-4" />}>
                Agregar atleta
              </Button>
            </Link>
            <Link to="/competitions">
              <Button leftIcon={<ClipboardList className="size-4" />}>Inscribir nadadores</Button>
            </Link>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Atletas activos"
          value={d?.athletes}
          icon={<UserRound className="size-5" />}
          to="/athletes"
          loading={dash.isLoading}
        />
        <StatCard
          label="Equipos"
          value={d?.teams}
          icon={<Users className="size-5" />}
          to="/teams"
          loading={dash.isLoading}
        />
        <StatCard
          label="Competencias abiertas"
          value={d?.open_competitions}
          icon={<Trophy className="size-5" />}
          to="/competitions"
          tone="aqua"
          loading={dash.isLoading}
        />
        <StatCard
          label="Inscripciones activas"
          value={d?.active_registrations}
          icon={<ClipboardList className="size-5" />}
          to="/registrations"
          loading={dash.isLoading}
        />
      </div>
      {(d?.needs_correction ?? 0) > 0 || (d?.pending_requests ?? 0) > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(d?.needs_correction ?? 0) > 0 && (
            <StatCard
              label="Requieren corrección"
              value={d?.needs_correction}
              icon={<AlertTriangle className="size-5" />}
              to="/registrations"
              tone="warning"
            />
          )}
          {(d?.pending_requests ?? 0) > 0 && (
            <StatCard
              label="Solicitudes de acceso pendientes"
              value={d?.pending_requests}
              icon={<Users className="size-5" />}
              to="/teams"
              tone="warning"
            />
          )}
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Próximas fechas límite"
            description="Cierres de inscripción más cercanos."
          />
          <ul className="divide-y divide-ice-200">
            {d?.deadlines.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <Link
                  to={`/competitions/${c.id}`}
                  className="min-w-0 truncate font-semibold text-navy hover:text-ocean"
                >
                  {c.name}
                </Link>
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-steel-600">
                  <Timer className="size-3.5" />
                  {fmtRelative(c.closes_at)}
                </span>
              </li>
            ))}
            {d && d.deadlines.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-steel-600">
                No hay convocatorias abiertas.
              </li>
            )}
          </ul>
        </Card>
        <Card>
          <CardHeader
            title="Actividad reciente"
            description="Últimas inscripciones actualizadas."
            action={
              <Link
                to="/registrations"
                className="text-xs font-semibold text-ocean hover:underline"
              >
                Ver todas
              </Link>
            }
          />
          <ul className="divide-y divide-ice-200">
            {regs.data?.slice(0, 6).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <Link
                    to={
                      r.status === 'draft' || r.status === 'needs_correction'
                        ? `/registrations/${r.id}/wizard`
                        : `/registrations/${r.id}`
                    }
                    className="block truncate font-semibold text-navy hover:text-ocean"
                  >
                    {r.competition?.name}
                  </Link>
                  <p className="text-xs text-steel-600">
                    {r.team?.short_name} · {fmtDateTime(r.updated_at)}
                  </p>
                </div>
                <Badge tone={registrationStatusTone[r.status]}>
                  {registrationStatusLabel[r.status]}
                </Badge>
              </li>
            ))}
            {regs.data?.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-steel-600">
                Aún no tienes inscripciones.
              </li>
            )}
          </ul>
        </Card>
      </div>
    </>
  )
}
