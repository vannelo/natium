import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Users } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardSkeleton,
  EmptyState,
  Modal,
  PageHeader,
} from '@/shared/ui'
import { toast } from '@/shared/ui/Toaster'
import { toAppError } from '@/lib/errors'
import { ErrorState } from '@/shared/ui/StatusPages'
import { membershipStatusLabel } from '@/shared/utils/labels'
import { useCreateTeam, useMyMemberships, useMyTeams } from '../api'
import { TeamForm } from '../components/TeamForm'
import { TeamDirectorySearch } from '../components/TeamDirectorySearch'

export function TeamsPage() {
  const navigate = useNavigate()
  const teams = useMyTeams()
  const memberships = useMyMemberships()
  const create = useCreateTeam()
  const [modal, setModal] = useState<'none' | 'create' | 'search'>('none')

  const pending = memberships.data?.filter((m) => m.status === 'pending') ?? []

  return (
    <>
      <PageHeader
        title="Equipos"
        description="Administra los equipos en los que participas y sus entrenadores autorizados."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<Search className="size-4" />}
              onClick={() => setModal('search')}
            >
              Buscar equipo
            </Button>
            <Button leftIcon={<Plus className="size-4" />} onClick={() => setModal('create')}>
              Nuevo equipo
            </Button>
          </>
        }
      />

      {pending.length > 0 && (
        <Card className="mb-5">
          <CardBody className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-navy">Solicitudes pendientes:</span>
            {pending.map((m) => (
              <Badge key={m.team_id} tone="warning">
                {(m as { team?: { name: string } | null }).team?.name} ·{' '}
                {membershipStatusLabel[m.status]}
              </Badge>
            ))}
          </CardBody>
        </Card>
      )}

      {teams.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}
      {teams.isError && (
        <ErrorState message={toAppError(teams.error).message} onRetry={() => teams.refetch()} />
      )}
      {teams.data && teams.data.length === 0 && (
        <Card>
          <EmptyState
            icon={<Users className="size-6" />}
            title="Aún no perteneces a ningún equipo"
            description="Busca tu equipo si ya existe y solicita acceso, o crea uno nuevo para comenzar a registrar nadadores."
            action={
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setModal('search')}>
                  Buscar equipo
                </Button>
                <Button onClick={() => setModal('create')}>Crear equipo</Button>
              </div>
            }
          />
        </Card>
      )}
      {teams.data && teams.data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.data.map((t) => (
            <Link
              key={t.id}
              to={`/teams/${t.id}`}
              className="group block rounded-lg focus-visible:outline-2"
            >
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-float">
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-11 items-center justify-center rounded-md bg-navy text-sm font-extrabold text-aqua">
                      {t.short_name.slice(0, 3).toUpperCase()}
                    </div>
                    <div className="flex gap-1">
                      {t.my_role === 'owner' && <Badge tone="aqua">Propietario</Badge>}
                      {!t.is_active && <Badge tone="neutral">Inactivo</Badge>}
                    </div>
                  </div>
                  <h3 className="mt-3 truncate text-base font-bold text-navy">{t.name}</h3>
                  <p className="truncate text-sm text-steel-600">
                    {[t.city, t.state].filter(Boolean).join(', ') || 'Sin ubicación'}
                    {t.code ? ` · ${t.code}` : ''}
                  </p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={modal === 'create'}
        onClose={() => setModal('none')}
        title="Nuevo equipo"
        description="Antes de crear, verifica que el equipo no exista ya."
        size="lg"
      >
        <TeamForm
          submitLabel="Crear equipo"
          onCancel={() => setModal('none')}
          onSubmit={async (values) => {
            try {
              const team = await create.mutateAsync(values)
              toast.success('Equipo creado')
              setModal('none')
              navigate(`/teams/${team.id}`)
            } catch (err) {
              const e = toAppError(err)
              toast.error(
                e.code === 'duplicate'
                  ? 'Ya existe un equipo con ese nombre o clave. Búscalo y solicita acceso.'
                  : e.message,
              )
            }
          }}
        />
      </Modal>
      <Modal
        open={modal === 'search'}
        onClose={() => setModal('none')}
        title="Buscar equipo existente"
        description="Evita duplicados: solicita acceso a tu equipo si ya está registrado."
      >
        <TeamDirectorySearch />
      </Modal>
    </>
  )
}
