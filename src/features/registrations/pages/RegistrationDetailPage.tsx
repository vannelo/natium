import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Download, Pencil, Printer } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardSkeleton,
  Field,
  Modal,
  PageHeader,
  Textarea,
} from '@/shared/ui'
import { toast } from '@/shared/ui/Toaster'
import { toAppError } from '@/lib/errors'
import { ErrorState } from '@/shared/ui/StatusPages'
import { fmtDate, fmtDateTime } from '@/shared/utils/dates'
import { registrationStatusLabel, registrationStatusTone, sexShort } from '@/shared/utils/labels'
import { formatCs } from '@/shared/utils/time'
import { useCompetitionEvents } from '@/features/competitions/api'
import type { Enums } from '@/lib/supabase'
import {
  useRegistration,
  useRegistrationHistory,
  useReviewRegistration,
  useSaveMarkFromEntry,
} from '../api'
import { StatusTimeline } from '../components/StatusTimeline'

export function RegistrationDetailPage() {
  const { registrationId = '' } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const reg = useRegistration(registrationId)
  const history = useRegistrationHistory(registrationId)
  const events = useCompetitionEvents(reg.data?.competition_id)
  const review = useReviewRegistration()
  const saveMark = useSaveMarkFromEntry()
  const [reviewTarget, setReviewTarget] = useState<Enums<'registration_status'> | null>(null)
  const [reason, setReason] = useState('')

  const eventById = useMemo(() => new Map((events.data ?? []).map((e) => [e.id, e])), [events.data])

  if (reg.isLoading) return <CardSkeleton lines={8} />
  if (reg.isError || !reg.data)
    return (
      <ErrorState
        message={reg.error ? toAppError(reg.error).message : undefined}
        onRetry={() => reg.refetch()}
      />
    )
  const r = reg.data
  const isOrganizer = profile?.role === 'organizer' || profile?.role === 'platform_admin'
  const isCoachEditable = r.status === 'draft' || r.status === 'needs_correction'
  const entriesByAthlete = (raId: string) =>
    r.entries.filter((e) => e.registration_athlete_id === raId)

  const actionsFor: Partial<
    Record<
      Enums<'registration_status'>,
      {
        to: Enums<'registration_status'>
        label: string
        variant: 'primary' | 'secondary' | 'aqua' | 'danger'
      }[]
    >
  > = {
    submitted: [
      { to: 'in_review', label: 'Marcar en revisión', variant: 'secondary' },
      { to: 'accepted', label: 'Aceptar', variant: 'aqua' },
      { to: 'needs_correction', label: 'Solicitar corrección', variant: 'secondary' },
      { to: 'rejected', label: 'Rechazar', variant: 'danger' },
    ],
    in_review: [
      { to: 'accepted', label: 'Aceptar', variant: 'aqua' },
      { to: 'needs_correction', label: 'Solicitar corrección', variant: 'secondary' },
      { to: 'rejected', label: 'Rechazar', variant: 'danger' },
    ],
    accepted: [{ to: 'in_review', label: 'Reabrir revisión', variant: 'secondary' }],
    exported: [{ to: 'in_review', label: 'Reabrir (cambio controlado)', variant: 'secondary' }],
    rejected: [{ to: 'in_review', label: 'Reabrir revisión', variant: 'secondary' }],
  }
  const needsReason = reviewTarget === 'needs_correction' || reviewTarget === 'rejected'

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Inscripciones', to: isOrganizer ? '/org/registrations' : '/registrations' },
          { label: r.folio ?? 'Borrador' },
        ]}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {r.competition?.name}
            <Badge tone={registrationStatusTone[r.status]}>
              {registrationStatusLabel[r.status]}
            </Badge>
          </span>
        }
        description={`${r.team?.name} · ${r.athletes.length} atletas · ${r.entries.length} pruebas`}
        actions={
          <>
            {!isOrganizer && isCoachEditable && (
              <Button
                leftIcon={<Pencil className="size-4" />}
                onClick={() => navigate(`/registrations/${r.id}/wizard`)}
              >
                Continuar edición
              </Button>
            )}
            {r.folio && (
              <Button
                variant="secondary"
                leftIcon={<Printer className="size-4" />}
                onClick={() => window.print()}
              >
                Imprimir comprobante
              </Button>
            )}
            {isOrganizer &&
              actionsFor[r.status]?.map((a) => (
                <Button
                  key={a.to}
                  variant={a.variant}
                  onClick={() => {
                    setReason('')
                    setReviewTarget(a.to)
                  }}
                >
                  {a.label}
                </Button>
              ))}
          </>
        }
      />

      {r.status === 'needs_correction' && r.review_note && (
        <Alert tone="warning" title="El organizador solicita correcciones" className="mb-5">
          {r.review_note}
        </Alert>
      )}
      {r.status === 'rejected' && r.review_note && (
        <Alert tone="danger" title="Inscripción rechazada" className="mb-5">
          {r.review_note}
        </Alert>
      )}
      {r.status === 'exported' && (
        <Alert tone="info" className="mb-5">
          Esta inscripción ya fue exportada. Cualquier cambio debe solicitarse al organizador.
        </Alert>
      )}

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-5">
          {r.folio && (
            <Card className="print:shadow-none">
              <CardBody className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-full bg-success-100 text-success">
                    <CheckCircle2 className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-steel-600 uppercase">
                      Comprobante digital · Folio
                    </p>
                    <p className="tnum text-2xl font-extrabold text-navy">{r.folio}</p>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                  <dt className="text-steel-600">Enviada</dt>
                  <dd className="font-semibold text-navy">{fmtDateTime(r.submitted_at)}</dd>
                  <dt className="text-steel-600">Equipo</dt>
                  <dd className="font-semibold text-navy">{r.team?.name}</dd>
                  <dt className="text-steel-600">Competencia</dt>
                  <dd className="font-semibold text-navy">
                    {r.competition?.code} · {fmtDate(r.competition?.start_date)}
                  </dd>
                </dl>
              </CardBody>
            </Card>
          )}
          <Card>
            <CardHeader title="Atletas y pruebas" />
            <ul className="divide-y divide-ice-200">
              {r.athletes.map((ra) => (
                <li key={ra.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      to={!isOrganizer ? `/athletes/${ra.athlete?.id}` : '#'}
                      className="font-semibold text-navy hover:text-ocean"
                    >
                      {ra.athlete?.last_name}, {ra.athlete?.first_name}
                    </Link>
                    <span className="text-xs text-steel-600">
                      {ra.athlete?.display_id} · {ra.athlete ? sexShort[ra.athlete.sex] : ''} ·{' '}
                      {fmtDate(ra.athlete?.birth_date)}
                      {ra.category ? ` · ${ra.category.name}` : ''}
                    </span>
                  </div>
                  <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                    {entriesByAthlete(ra.id).map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center justify-between rounded bg-ice px-3 py-1.5 text-sm"
                      >
                        <span>
                          <span className="tnum mr-2 text-xs text-steel-600">
                            #{eventById.get(e.competition_event_id)?.event_number ?? '—'}
                          </span>
                          {eventById.get(e.competition_event_id)?.event?.name ?? '…'}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="tnum font-bold text-navy">
                            {e.no_time ? 'NT' : formatCs(e.entry_time_cs)}
                          </span>
                          {!isOrganizer &&
                            e.entry_time_cs &&
                            (r.status === 'accepted' || r.status === 'exported') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Guardar como mejor marca"
                                aria-label="Guardar como mejor marca"
                                onClick={() =>
                                  saveMark.mutate(e.id, {
                                    onSuccess: () =>
                                      toast.success('Marca guardada en el expediente'),
                                    onError: (er) => toast.error(toAppError(er).message),
                                  })
                                }
                              >
                                <Download className="size-3.5" />
                              </Button>
                            )}
                        </span>
                      </li>
                    ))}
                    {entriesByAthlete(ra.id).length === 0 && (
                      <li className="text-xs text-steel-600">Sin pruebas asignadas</li>
                    )}
                  </ul>
                </li>
              ))}
              {r.athletes.length === 0 && (
                <li className="px-5 py-6 text-center text-sm text-steel-600">
                  Sin atletas seleccionados.
                </li>
              )}
            </ul>
          </Card>
        </div>
        <Card className="h-fit print:hidden">
          <CardHeader title="Historial de estados" />
          <StatusTimeline rows={history.data as Parameters<typeof StatusTimeline>[0]['rows']} />
        </Card>
      </div>

      <Modal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title={reviewTarget ? `Cambiar a “${registrationStatusLabel[reviewTarget]}”` : ''}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant={reviewTarget === 'rejected' ? 'danger' : 'primary'}
              loading={review.isPending}
              disabled={needsReason && reason.trim().length < 5}
              onClick={() =>
                review.mutate(
                  { id: r.id, status: reviewTarget!, reason: reason.trim() || undefined },
                  {
                    onSuccess: () => {
                      toast.success('Estado actualizado')
                      setReviewTarget(null)
                    },
                    onError: (e) => toast.error(toAppError(e).message),
                  },
                )
              }
            >
              Confirmar
            </Button>
          </>
        }
      >
        {needsReason ? (
          <Field label="Motivo (visible para el entrenador)" required hint="Mínimo 5 caracteres">
            {(p) => (
              <Textarea
                {...p}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
              />
            )}
          </Field>
        ) : (
          <p className="text-sm text-steel-800">
            {reviewTarget === 'accepted'
              ? 'La inscripción quedará lista para exportación.'
              : 'Confirma el cambio de estado. Quedará registrado en el historial.'}
          </p>
        )}
      </Modal>
    </>
  )
}
