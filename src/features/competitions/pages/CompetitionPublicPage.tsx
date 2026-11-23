import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
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
  Select,
} from '@/shared/ui'
import { toast } from '@/shared/ui/Toaster'
import { toAppError } from '@/lib/errors'
import { ErrorState } from '@/shared/ui/StatusPages'
import { fmtDate, fmtDateTime } from '@/shared/utils/dates'
import {
  competitionStatusLabel,
  competitionStatusTone,
  poolCourseLabel,
  sexLabel,
} from '@/shared/utils/labels'
import { useMyTeams } from '@/features/teams/api'
import { useGetOrCreateRegistration, useMyRegistrations } from '@/features/registrations/api'
import { registrationStatusLabel, registrationStatusTone } from '@/shared/utils/labels'
import { registrationWindow, useCategories, useCompetition, useCompetitionEvents } from '../api'

export function CompetitionPublicPage() {
  const { competitionId = '' } = useParams()
  const navigate = useNavigate()
  const comp = useCompetition(competitionId)
  const cats = useCategories(competitionId)
  const events = useCompetitionEvents(competitionId)
  const teams = useMyTeams()
  const myRegs = useMyRegistrations()
  const start = useGetOrCreateRegistration()
  const [pickTeam, setPickTeam] = useState(false)
  const [teamId, setTeamId] = useState('')

  if (comp.isLoading) return <CardSkeleton lines={8} />
  if (comp.isError || !comp.data)
    return (
      <ErrorState
        message={comp.error ? toAppError(comp.error).message : undefined}
        onRetry={() => comp.refetch()}
      />
    )
  const c = comp.data
  const win = registrationWindow(c)
  const regsHere = myRegs.data?.filter((r) => r.competition_id === c.id) ?? []

  const begin = async (tid: string) => {
    try {
      const reg = await start.mutateAsync({ competitionId: c.id, teamId: tid })
      navigate(
        reg.status === 'draft' || reg.status === 'needs_correction'
          ? `/registrations/${reg.id}/wizard`
          : `/registrations/${reg.id}`,
      )
    } catch (err) {
      toast.error(toAppError(err).message)
    }
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Competencias', to: '/competitions' }, { label: c.code }]}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {c.name}
            <Badge tone={competitionStatusTone[c.status]}>{competitionStatusLabel[c.status]}</Badge>
          </span>
        }
        description={`${(c.organization as { name: string } | null)?.name ?? ''} · ${fmtDate(c.start_date)}${c.end_date !== c.start_date ? ` – ${fmtDate(c.end_date)}` : ''} · ${[c.venue, c.city].filter(Boolean).join(', ')}`}
        actions={
          win === 'open' && (
            <Button
              leftIcon={<ClipboardList className="size-4" />}
              loading={start.isPending}
              onClick={() => {
                if (!teams.data?.length) {
                  toast.error('Necesitas pertenecer a un equipo para inscribir.')
                  return
                }
                if (teams.data.length === 1) void begin(teams.data[0]!.id)
                else {
                  setTeamId(teams.data[0]!.id)
                  setPickTeam(true)
                }
              }}
            >
              Inscribir nadadores
            </Button>
          )
        }
      />

      {win === 'upcoming' && (
        <Alert tone="info" className="mb-5">
          Las inscripciones abren el {fmtDateTime(c.registration_opens_at)}.
        </Alert>
      )}
      {win === 'closed' && (
        <Alert tone="warning" className="mb-5">
          El periodo de inscripción está cerrado.
        </Alert>
      )}

      {regsHere.length > 0 && (
        <Card className="mb-5">
          <CardHeader title="Tus inscripciones en esta competencia" />
          <ul className="divide-y divide-ice-200">
            {regsHere.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
              >
                <span className="font-semibold text-navy">
                  {(r.team as { name: string } | null)?.name}
                  {r.folio ? ` · ${r.folio}` : ''}
                </span>
                <div className="flex items-center gap-2">
                  <Badge tone={registrationStatusTone[r.status]}>
                    {registrationStatusLabel[r.status]}
                  </Badge>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      navigate(
                        r.status === 'draft' || r.status === 'needs_correction'
                          ? `/registrations/${r.id}/wizard`
                          : `/registrations/${r.id}`,
                      )
                    }
                  >
                    {r.status === 'draft' || r.status === 'needs_correction'
                      ? 'Continuar'
                      : 'Ver detalle'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Convocatoria" />
            <CardBody className="text-sm whitespace-pre-wrap text-steel-800">
              {c.description || 'Sin descripción.'}
              {c.requirements && (
                <>
                  <h4 className="mt-4 mb-1 font-bold text-navy">Requisitos especiales</h4>
                  {c.requirements}
                </>
              )}
            </CardBody>
          </Card>
          <Card>
            <CardHeader
              title="Pruebas disponibles"
              description={`${events.data?.filter((e) => e.is_active).length ?? 0} pruebas habilitadas`}
            />
            <ul className="grid gap-x-6 divide-y divide-ice-200 sm:grid-cols-2 sm:divide-y-0">
              {events.data
                ?.filter((e) => e.is_active)
                .map((e) => (
                  <li key={e.id} className="flex items-center justify-between px-5 py-2 text-sm">
                    <span>
                      <span className="tnum mr-2 text-xs text-steel-600">
                        #{e.event_number ?? '—'}
                      </span>
                      {e.event?.name}
                    </span>
                    <span className="text-xs text-steel-600">
                      {e.sex ? sexLabel[e.sex] : 'Mixto'}
                      {e.category ? ` · ${e.category.name}` : ''}
                    </span>
                  </li>
                ))}
            </ul>
          </Card>
        </div>
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Datos generales" />
            <CardBody>
              <dl className="flex flex-col gap-3 text-sm">
                {[
                  ['Apertura de inscripciones', fmtDateTime(c.registration_opens_at)],
                  ['Cierre de inscripciones', fmtDateTime(c.registration_closes_at)],
                  ['Alberca', `${poolCourseLabel[c.pool_course]} · ${c.pool_length_m} m`],
                  ['Edad de referencia', fmtDate(c.age_reference_date ?? c.start_date)],
                  ['Máximo de pruebas por atleta', c.max_entries_per_athlete ?? 'Sin límite'],
                  ['Inscripción sin tiempo', c.allow_no_time ? 'Permitida (NT)' : 'No permitida'],
                ].map(([k, v]) => (
                  <div key={String(k)}>
                    <dt className="text-xs font-semibold tracking-wide text-steel-600 uppercase">
                      {k}
                    </dt>
                    <dd className="text-navy">{v}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Categorías" />
            <ul className="divide-y divide-ice-200">
              {cats.data?.map((cat) => (
                <li key={cat.id} className="flex items-center justify-between px-5 py-2 text-sm">
                  <span className="font-semibold text-navy">{cat.name}</span>
                  <span className="tnum text-xs text-steel-600">
                    {cat.sex ? sexLabel[cat.sex] : 'Mixta'} · {cat.min_age}–{cat.max_age} años
                  </span>
                </li>
              ))}
              {cats.data?.length === 0 && (
                <li className="px-5 py-4 text-sm text-steel-600">
                  Sin categorías por edad: todos los atletas son elegibles.
                </li>
              )}
            </ul>
          </Card>
        </div>
      </div>

      <Modal
        open={pickTeam}
        onClose={() => setPickTeam(false)}
        title="¿Con qué equipo inscribes?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPickTeam(false)}>
              Cancelar
            </Button>
            <Button loading={start.isPending} onClick={() => begin(teamId)}>
              Continuar
            </Button>
          </>
        }
      >
        <Field label="Equipo" required>
          {(p) => (
            <Select {...p} value={teamId} onChange={(e) => setTeamId(e.target.value)}>
              {teams.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </Modal>
    </>
  )
}
