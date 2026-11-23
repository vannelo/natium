import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ClipboardList,
  FileOutput,
  Plus,
  Trophy,
  UserRound,
  Users,
  Waves,
} from 'lucide-react'
import { Alert, Badge, Button, Card, CardHeader, PageHeader, StatCard } from '@/shared/ui'
import { fmtDateTime } from '@/shared/utils/dates'
import { registrationStatusLabel, registrationStatusTone } from '@/shared/utils/labels'
import { useMyOrganization } from '@/features/competitions/api'
import { useOrgRegistrations } from '@/features/registrations/api'
import { useOrganizerDashboard } from './api'

export function OrganizerDashboardPage() {
  const org = useMyOrganization()
  const dash = useOrganizerDashboard()
  const pending = useOrgRegistrations(undefined, 'submitted')
  const d = dash.data

  return (
    <>
      <PageHeader
        title="Panel del organizador"
        description={
          org.data?.name ?? 'Competencias, equipos inscritos y revisión de inscripciones.'
        }
        actions={
          <Link to="/org/competitions/new">
            <Button leftIcon={<Plus className="size-4" />} disabled={!org.data}>
              Nueva competencia
            </Button>
          </Link>
        }
      />
      {org.data === null && (
        <Alert tone="info" title="Configura tu organización" className="mb-5">
          Registra tu organización para comenzar a crear competencias.{' '}
          <Link to="/org/organization" className="font-semibold underline">
            Ir a Organización
          </Link>
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Competencias activas"
          value={d?.active_competitions}
          icon={<Trophy className="size-5" />}
          to="/org/competitions"
          tone="aqua"
          loading={dash.isLoading}
        />
        <StatCard
          label="Equipos inscritos"
          value={d?.teams}
          icon={<Users className="size-5" />}
          loading={dash.isLoading}
        />
        <StatCard
          label="Atletas registrados"
          value={d?.athletes}
          icon={<UserRound className="size-5" />}
          loading={dash.isLoading}
        />
        <StatCard
          label="Inscripciones"
          value={d?.registrations}
          icon={<ClipboardList className="size-5" />}
          to="/org/registrations"
          loading={dash.isLoading}
        />
        <StatCard
          label="Pruebas registradas"
          value={d?.entries}
          icon={<Waves className="size-5" />}
          loading={dash.isLoading}
        />
        <StatCard
          label="Pendientes de revisión"
          value={d?.pending_review}
          icon={<ClipboardList className="size-5" />}
          to="/org/registrations"
          tone="warning"
          loading={dash.isLoading}
        />
        <StatCard
          label="En corrección"
          value={d?.needs_correction}
          icon={<AlertTriangle className="size-5" />}
          to="/org/registrations"
          tone="warning"
          loading={dash.isLoading}
        />
        <StatCard
          label="Exportaciones"
          value={d?.exports}
          icon={<FileOutput className="size-5" />}
          loading={dash.isLoading}
        />
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader
            title="Inscripciones por revisar"
            description="Enviadas recientemente por los equipos."
            action={
              <Link
                to="/org/registrations"
                className="text-xs font-semibold text-ocean hover:underline"
              >
                Ver todas
              </Link>
            }
          />
          <ul className="divide-y divide-ice-200">
            {pending.data?.slice(0, 8).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div className="min-w-0">
                  <Link
                    to={`/registrations/${r.id}`}
                    className="block truncate font-semibold text-navy hover:text-ocean"
                  >
                    {r.team?.name} · <span className="tnum">{r.folio}</span>
                  </Link>
                  <p className="truncate text-xs text-steel-600">
                    {r.competition?.name} · {r.athletes_count} atletas · {r.entries_count} pruebas ·{' '}
                    {fmtDateTime(r.submitted_at)}
                  </p>
                </div>
                <Badge tone={registrationStatusTone[r.status]}>
                  {registrationStatusLabel[r.status]}
                </Badge>
              </li>
            ))}
            {pending.data?.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-steel-600">
                No hay inscripciones pendientes.
              </li>
            )}
          </ul>
        </Card>
        <Card className="h-fit">
          <CardHeader title="Estado de exportaciones" />
          <div className="px-5 py-4 text-sm text-steel-800">
            <p>
              El motor de exportación quedará habilitado cuando se analice el archivo de referencia
              del software del organizador.
            </p>
            <p className="mt-2 text-xs text-steel-600">
              Ver <code className="rounded bg-ice px-1">docs/export-engine.md</code> para la
              dependencia pendiente.
            </p>
          </div>
        </Card>
      </div>
    </>
  )
}
