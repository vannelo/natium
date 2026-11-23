import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, UserRound, X } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardSkeleton,
  ConfirmDialog,
  PageHeader,
  Tabs,
} from '@/shared/ui'
import { toast } from '@/shared/ui/Toaster'
import { toAppError } from '@/lib/errors'
import { ErrorState } from '@/shared/ui/StatusPages'
import { fmtDate } from '@/shared/utils/dates'
import { membershipStatusLabel } from '@/shared/utils/labels'
import {
  useDecideTeamAccess,
  useRevokeTeamAccess,
  useTeam,
  useTeamMembers,
  useUpdateTeam,
} from '../api'
import { TeamForm } from '../components/TeamForm'
import { useAthletes } from '@/features/athletes/api'

type Tab = 'general' | 'members' | 'athletes'

export function TeamDetailPage() {
  const { teamId = '' } = useParams()
  const { user } = useAuth()
  const team = useTeam(teamId)
  const members = useTeamMembers(teamId)
  const athletes = useAthletes({ teamId, status: 'all' })
  const update = useUpdateTeam(teamId)
  const decide = useDecideTeamAccess(teamId)
  const revoke = useRevokeTeamAccess(teamId)
  const [tab, setTab] = useState<Tab>('general')
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)
  const [toggleActive, setToggleActive] = useState(false)

  const myMembership = members.data?.find((m) => m.user_id === user?.id)
  const isOwner = myMembership?.role === 'owner' && myMembership.status === 'approved'
  const pendingCount = members.data?.filter((m) => m.status === 'pending').length ?? 0

  if (team.isLoading) return <CardSkeleton lines={6} />
  if (team.isError || !team.data)
    return (
      <ErrorState
        message={team.error ? toAppError(team.error).message : undefined}
        onRetry={() => team.refetch()}
      />
    )
  const t = team.data

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Equipos', to: '/teams' }, { label: t.name }]}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {t.name}
            {!t.is_active && <Badge>Inactivo</Badge>}
          </span>
        }
        description={`${t.short_name}${t.code ? ` · ${t.code}` : ''} · Registrado el ${fmtDate(t.created_at)}`}
        actions={
          <Link to={`/athletes?team=${t.id}`}>
            <Button variant="secondary" leftIcon={<UserRound className="size-4" />}>
              Ver atletas
            </Button>
          </Link>
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'general', label: 'Datos del equipo' },
          { key: 'members', label: 'Entrenadores', count: pendingCount || undefined },
          { key: 'athletes', label: 'Atletas', count: athletes.data?.length },
        ]}
      />

      {tab === 'general' && (
        <Card>
          <CardHeader
            title="Información general"
            description={
              isOwner
                ? 'Solo los propietarios pueden editar estos datos.'
                : 'Solo lectura: no eres propietario de este equipo.'
            }
            action={
              isOwner && (
                <Button
                  variant={t.is_active ? 'secondary' : 'aqua'}
                  size="sm"
                  onClick={() => setToggleActive(true)}
                >
                  {t.is_active ? 'Desactivar equipo' : 'Reactivar equipo'}
                </Button>
              )
            }
          />
          <CardBody>
            {isOwner ? (
              <TeamForm
                initial={t}
                onSubmit={async (values) => {
                  try {
                    await update.mutateAsync(values)
                    toast.success('Equipo actualizado')
                  } catch (err) {
                    toast.error(toAppError(err).message)
                  }
                }}
              />
            ) : (
              <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                {[
                  ['Ciudad', t.city],
                  ['Estado', t.state],
                  ['País', t.country],
                  ['Responsable', t.contact_name],
                  ['Correo', t.contact_email],
                  ['Teléfono', t.contact_phone],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-semibold tracking-wide text-steel-600 uppercase">
                      {k}
                    </dt>
                    <dd className="text-navy">{v || '—'}</dd>
                  </div>
                ))}
              </dl>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'members' && (
        <Card>
          <CardHeader
            title="Entrenadores autorizados"
            description="Las solicitudes de acceso aparecen aquí para su aprobación."
          />
          <ul className="divide-y divide-ice-200">
            {members.data?.map((m) => (
              <li
                key={m.user_id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy">
                    {m.profile?.full_name || m.profile?.email || 'Usuario'}
                    {m.user_id === user?.id && <span className="text-steel-600"> (tú)</span>}
                  </p>
                  <p className="truncate text-xs text-steel-600">
                    {m.profile?.email} · {m.role === 'owner' ? 'Propietario' : 'Entrenador'} ·
                    Solicitado {fmtDate(m.requested_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    tone={
                      m.status === 'approved'
                        ? 'success'
                        : m.status === 'pending'
                          ? 'warning'
                          : 'neutral'
                    }
                  >
                    {membershipStatusLabel[m.status]}
                  </Badge>
                  {isOwner && m.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        variant="aqua"
                        leftIcon={<Check className="size-3.5" />}
                        loading={
                          decide.isPending &&
                          decide.variables?.userId === m.user_id &&
                          decide.variables.approve
                        }
                        onClick={() =>
                          decide.mutate(
                            { userId: m.user_id, approve: true },
                            {
                              onSuccess: () => toast.success('Acceso aprobado'),
                              onError: (e) => toast.error(toAppError(e).message),
                            },
                          )
                        }
                      >
                        Aprobar
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<X className="size-3.5" />}
                        onClick={() =>
                          decide.mutate(
                            { userId: m.user_id, approve: false },
                            {
                              onSuccess: () => toast.success('Solicitud rechazada'),
                              onError: (e) => toast.error(toAppError(e).message),
                            },
                          )
                        }
                      >
                        Rechazar
                      </Button>
                    </>
                  )}
                  {isOwner && m.status === 'approved' && m.user_id !== user?.id && (
                    <Button size="sm" variant="ghost" onClick={() => setRevokeTarget(m.user_id)}>
                      Revocar
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'athletes' && (
        <Card>
          <CardHeader
            title="Atletas del equipo"
            description={`${athletes.data?.filter((a) => a.status === 'active').length ?? 0} activos`}
            action={
              <Link to={`/athletes?team=${t.id}`}>
                <Button size="sm">Administrar atletas</Button>
              </Link>
            }
          />
          <ul className="divide-y divide-ice-200">
            {athletes.data?.slice(0, 10).map((a) => (
              <li key={a.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
                <Link to={`/athletes/${a.id}`} className="font-semibold text-navy hover:text-ocean">
                  {a.last_name}, {a.first_name}
                </Link>
                <span className="text-xs text-steel-600">{a.display_id}</span>
              </li>
            ))}
            {athletes.data && athletes.data.length === 0 && (
              <li className="px-5 py-6 text-center text-sm text-steel-600">
                Sin atletas registrados.
              </li>
            )}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        tone="danger"
        title="Revocar acceso"
        message="El entrenador dejará de ver y administrar los atletas de este equipo."
        confirmLabel="Revocar"
        loading={revoke.isPending}
        onConfirm={() =>
          revoke.mutate(revokeTarget!, {
            onSuccess: () => {
              toast.success('Acceso revocado')
              setRevokeTarget(null)
            },
            onError: (e) => toast.error(toAppError(e).message),
          })
        }
      />
      <ConfirmDialog
        open={toggleActive}
        onClose={() => setToggleActive(false)}
        title={t.is_active ? 'Desactivar equipo' : 'Reactivar equipo'}
        message={
          t.is_active
            ? 'El equipo se marcará como inactivo. Sus atletas e historial se conservan.'
            : 'El equipo volverá a estar activo.'
        }
        loading={update.isPending}
        onConfirm={() =>
          update.mutate(
            { is_active: !t.is_active },
            {
              onSuccess: () => {
                toast.success('Equipo actualizado')
                setToggleActive(false)
              },
              onError: (e) => toast.error(toAppError(e).message),
            },
          )
        }
      />
    </>
  )
}
