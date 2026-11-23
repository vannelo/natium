import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardSkeleton,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Tabs,
} from '@/shared/ui'
import { toast } from '@/shared/ui/Toaster'
import { toAppError } from '@/lib/errors'
import { ErrorState } from '@/shared/ui/StatusPages'
import { ageOn, fmtDate } from '@/shared/utils/dates'
import {
  poolCourseLabel,
  registrationStatusLabel,
  registrationStatusTone,
  sexLabel,
} from '@/shared/utils/labels'
import { formatCs, parseTimeToCs } from '@/shared/utils/time'
import { TimeInput } from '@/shared/ui/TimeInput'
import { useEventCatalog } from '@/features/catalog/api'
import {
  useAddManualMark,
  useAthlete,
  useAthleteHistory,
  useAthleteMarks,
  useDeleteMark,
  useUpdateAthlete,
} from '../api'
import { AthleteForm } from '../components/AthleteForm'

type Tab = 'profile' | 'history' | 'marks'

const markSchema = z.object({
  event_catalog_id: z.uuid('Selecciona la prueba'),
  pool_course: z.enum(['SCM', 'LCM', 'OTHER']),
  time: z.string().refine((t) => parseTimeToCs(t) !== null, 'Formato mm:ss.cc'),
  recorded_at: z.string().min(1, 'Requerido'),
})
type MarkInput = z.infer<typeof markSchema>

export function AthleteDetailPage() {
  const { athleteId = '' } = useParams()
  const athlete = useAthlete(athleteId)
  const history = useAthleteHistory(athleteId)
  const marks = useAthleteMarks(athleteId)
  const catalog = useEventCatalog()
  const update = useUpdateAthlete(athleteId)
  const addMark = useAddManualMark(athleteId)
  const deleteMark = useDeleteMark(athleteId)
  const [tab, setTab] = useState<Tab>('profile')
  const [confirmStatus, setConfirmStatus] = useState(false)
  const [markModal, setMarkModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const markForm = useForm<MarkInput>({
    resolver: zodResolver(markSchema),
    defaultValues: {
      pool_course: 'SCM',
      recorded_at: new Date().toISOString().slice(0, 10),
      time: '',
      event_catalog_id: '',
    },
  })

  if (athlete.isLoading) return <CardSkeleton lines={6} />
  if (athlete.isError || !athlete.data)
    return (
      <ErrorState
        message={athlete.error ? toAppError(athlete.error).message : undefined}
        onRetry={() => athlete.refetch()}
      />
    )
  const a = athlete.data

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Atletas', to: '/athletes' },
          { label: `${a.first_name} ${a.last_name}` },
        ]}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {a.first_name} {a.last_name}
            <Badge tone={a.status === 'active' ? 'success' : 'neutral'}>
              {a.status === 'active' ? 'Activo' : 'Inactivo'}
            </Badge>
          </span>
        }
        description={`${a.display_id} · ${sexLabel[a.sex]} · ${ageOn(a.birth_date)} años · ${a.team?.name ?? ''}`}
        actions={
          <Button variant="secondary" onClick={() => setConfirmStatus(true)}>
            {a.status === 'active' ? 'Desactivar expediente' : 'Reactivar expediente'}
          </Button>
        }
      />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'profile', label: 'Expediente' },
          { key: 'history', label: 'Inscripciones', count: history.data?.length },
          { key: 'marks', label: 'Mejores marcas', count: marks.data?.length },
        ]}
      />

      {tab === 'profile' && (
        <Card>
          <CardHeader
            title="Datos del atleta"
            description={`Creado ${fmtDate(a.created_at)} · Actualizado ${fmtDate(a.updated_at)}`}
          />
          <CardBody>
            <AthleteForm
              initial={a}
              onSubmit={async (values) => {
                try {
                  await update.mutateAsync(values)
                  toast.success('Expediente actualizado')
                } catch (err) {
                  toast.error(toAppError(err).message)
                }
              }}
            />
          </CardBody>
        </Card>
      )}

      {tab === 'history' && (
        <Card>
          <CardHeader
            title="Historial de inscripciones"
            description="Competencias en las que este atleta ha sido inscrito."
          />
          <ul className="divide-y divide-ice-200">
            {history.data?.map((h) => {
              const reg = h.registration as unknown as {
                id: string
                folio: string | null
                status: keyof typeof registrationStatusLabel
                competition: { id: string; name: string; start_date: string } | null
              } | null
              const entries = h.entries as unknown as {
                id: string
                entry_time_cs: number | null
                no_time: boolean
                event: { event: { name: string } | null } | null
              }[]
              return (
                <li key={h.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      to={`/registrations/${reg?.id}`}
                      className="font-semibold text-navy hover:text-ocean"
                    >
                      {reg?.competition?.name}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-steel-600">
                      {reg?.folio && <span className="tnum">{reg.folio}</span>}
                      {reg && (
                        <Badge tone={registrationStatusTone[reg.status]}>
                          {registrationStatusLabel[reg.status]}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-steel-600">
                    {fmtDate(reg?.competition?.start_date)} ·{' '}
                    {entries
                      .map(
                        (e) =>
                          `${e.event?.event?.name ?? ''} ${e.no_time ? 'NT' : formatCs(e.entry_time_cs, { compact: true })}`,
                      )
                      .join(' · ') || 'Sin pruebas'}
                  </p>
                </li>
              )
            })}
            {history.data && history.data.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-steel-600">
                Este atleta aún no tiene inscripciones.
              </li>
            )}
          </ul>
        </Card>
      )}

      {tab === 'marks' && (
        <Card>
          <CardHeader
            title="Mejores marcas"
            description="Registro histórico independiente de los tiempos de inscripción. Nunca se sobrescribe automáticamente."
            action={
              <Button
                size="sm"
                leftIcon={<Plus className="size-3.5" />}
                onClick={() => setMarkModal(true)}
              >
                Agregar marca
              </Button>
            }
          />
          <ul className="divide-y divide-ice-200">
            {marks.data?.map((m) => {
              const ev = m.event as unknown as { name: string } | null
              return (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm"
                >
                  <div>
                    <p className="font-semibold text-navy">{ev?.name}</p>
                    <p className="text-xs text-steel-600">
                      {poolCourseLabel[m.pool_course]} · {fmtDate(m.recorded_at)} ·{' '}
                      {m.source === 'entry'
                        ? 'De inscripción'
                        : m.source === 'official'
                          ? 'Oficial'
                          : 'Manual'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tnum text-base font-extrabold text-navy">
                      {formatCs(m.time_cs)}
                    </span>
                    {m.source === 'manual' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Eliminar marca"
                        onClick={() => setDeleteTarget(m.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
            {marks.data && marks.data.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-steel-600">
                Sin marcas registradas.
              </li>
            )}
          </ul>
        </Card>
      )}

      <ConfirmDialog
        open={confirmStatus}
        onClose={() => setConfirmStatus(false)}
        title={a.status === 'active' ? 'Desactivar expediente' : 'Reactivar expediente'}
        message={
          a.status === 'active'
            ? 'El atleta no podrá inscribirse, pero su historial se conserva íntegro.'
            : 'El atleta volverá a estar disponible para inscripciones.'
        }
        loading={update.isPending}
        onConfirm={() =>
          update.mutate(
            { status: a.status === 'active' ? 'inactive' : 'active' },
            {
              onSuccess: () => {
                toast.success('Expediente actualizado')
                setConfirmStatus(false)
              },
              onError: (e) => toast.error(toAppError(e).message),
            },
          )
        }
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        tone="danger"
        title="Eliminar marca"
        message="Solo las marcas capturadas manualmente pueden eliminarse."
        confirmLabel="Eliminar"
        loading={deleteMark.isPending}
        onConfirm={() =>
          deleteMark.mutate(deleteTarget!, {
            onSuccess: () => {
              toast.success('Marca eliminada')
              setDeleteTarget(null)
            },
            onError: (e) => toast.error(toAppError(e).message),
          })
        }
      />
      <Modal
        open={markModal}
        onClose={() => setMarkModal(false)}
        title="Agregar mejor marca"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMarkModal(false)}>
              Cancelar
            </Button>
            <Button
              loading={addMark.isPending}
              onClick={markForm.handleSubmit(async (v) => {
                try {
                  await addMark.mutateAsync({
                    event_catalog_id: v.event_catalog_id,
                    pool_course: v.pool_course,
                    time_cs: parseTimeToCs(v.time)!,
                    recorded_at: v.recorded_at,
                  })
                  toast.success('Marca guardada')
                  setMarkModal(false)
                  markForm.reset()
                } catch (err) {
                  toast.error(toAppError(err).message)
                }
              })}
            >
              Guardar
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Prueba"
            error={markForm.formState.errors.event_catalog_id?.message}
            required
            className="sm:col-span-2"
          >
            {(p) => (
              <Select {...p} {...markForm.register('event_catalog_id')}>
                <option value="">Selecciona…</option>
                {catalog.data
                  ?.filter((e) => e.is_active)
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                    </option>
                  ))}
              </Select>
            )}
          </Field>
          <Field label="Alberca" required>
            {(p) => (
              <Select {...p} {...markForm.register('pool_course')}>
                <option value="SCM">25 m</option>
                <option value="LCM">50 m</option>
                <option value="OTHER">Otra</option>
              </Select>
            )}
          </Field>
          <Field label="Tiempo" error={markForm.formState.errors.time?.message} required>
            {(p) => (
              <TimeInput
                {...p}
                value={markForm.watch('time')}
                onChange={(v) => markForm.setValue('time', v, { shouldValidate: true })}
              />
            )}
          </Field>
          <Field
            label="Fecha"
            error={markForm.formState.errors.recorded_at?.message}
            required
            className="sm:col-span-2"
          >
            {(p) => <Input {...p} type="date" {...markForm.register('recorded_at')} />}
          </Field>
        </div>
      </Modal>
    </>
  )
}
