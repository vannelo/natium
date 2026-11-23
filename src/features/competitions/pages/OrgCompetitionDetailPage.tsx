import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardSkeleton,
  Checkbox,
  ConfirmDialog,
  DataTable,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Tabs,
  type Column,
} from '@/shared/ui'
import { toast } from '@/shared/ui/Toaster'
import { toAppError } from '@/lib/errors'
import { ErrorState } from '@/shared/ui/StatusPages'
import { fmtDate, fmtDateTime } from '@/shared/utils/dates'
import {
  competitionStatusLabel,
  competitionStatusTone,
  poolCourseLabel,
  registrationStatusLabel,
  registrationStatusTone,
  sexLabel,
} from '@/shared/utils/labels'
import { useEventCatalog } from '@/features/catalog/api'
import { useOrgRegistrations, type RegistrationListItem } from '@/features/registrations/api'
import type { Enums } from '@/lib/supabase'
import {
  categorySchema,
  useCategories,
  useCompetition,
  useCompetitionEvents,
  useDeleteCategory,
  useSaveCategory,
  useSetCompetitionStatus,
  useSyncCompetitionEvents,
  useUpdateCompetitionEvent,
  type Category,
  type CategoryInput,
} from '../api'

type Tab = 'general' | 'categories' | 'events' | 'registrations'

export function OrgCompetitionDetailPage() {
  const { competitionId = '' } = useParams()
  const navigate = useNavigate()
  const comp = useCompetition(competitionId)
  const cats = useCategories(competitionId)
  const events = useCompetitionEvents(competitionId)
  const regs = useOrgRegistrations(competitionId)
  const setStatus = useSetCompetitionStatus(competitionId)
  const [tab, setTab] = useState<Tab>('general')
  const [statusTarget, setStatusTarget] = useState<Enums<'competition_status'> | null>(null)

  if (comp.isLoading) return <CardSkeleton lines={8} />
  if (comp.isError || !comp.data)
    return (
      <ErrorState
        message={comp.error ? toAppError(comp.error).message : undefined}
        onRetry={() => comp.refetch()}
      />
    )
  const c = comp.data
  const activeEvents = events.data?.filter((e) => e.is_active).length ?? 0
  const canPublish = c.status === 'draft' && activeEvents > 0

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Competencias', to: '/org/competitions' }, { label: c.code }]}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {c.name}
            <Badge tone={competitionStatusTone[c.status]}>{competitionStatusLabel[c.status]}</Badge>
          </span>
        }
        description={`${fmtDate(c.start_date)}${c.end_date !== c.start_date ? ` – ${fmtDate(c.end_date)}` : ''} · ${[c.venue, c.city].filter(Boolean).join(', ') || 'Sin sede'} · ${poolCourseLabel[c.pool_course]}`}
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<Pencil className="size-4" />}
              onClick={() => navigate(`/org/competitions/${c.id}/edit`)}
            >
              Editar
            </Button>
            {c.status === 'draft' && (
              <Button
                variant="aqua"
                disabled={!canPublish}
                title={!canPublish ? 'Habilita al menos una prueba' : undefined}
                onClick={() => setStatusTarget('published')}
              >
                Publicar
              </Button>
            )}
            {c.status === 'published' && (
              <Button variant="secondary" onClick={() => setStatusTarget('closed')}>
                Cerrar inscripciones
              </Button>
            )}
            {c.status === 'closed' && (
              <>
                <Button variant="secondary" onClick={() => setStatusTarget('published')}>
                  Reabrir
                </Button>
                <Button onClick={() => setStatusTarget('finished')}>Finalizar</Button>
              </>
            )}
          </>
        }
      />
      {c.status === 'draft' && activeEvents === 0 && (
        <Alert tone="warning" className="mb-5">
          Habilita las pruebas de la competencia antes de publicarla.
        </Alert>
      )}
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { key: 'general', label: 'General' },
          { key: 'categories', label: 'Categorías', count: cats.data?.length },
          { key: 'events', label: 'Pruebas', count: activeEvents },
          { key: 'registrations', label: 'Inscripciones', count: regs.data?.length },
        ]}
      />

      {tab === 'general' && (
        <Card>
          <CardHeader title="Configuración" />
          <CardBody>
            <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              {[
                ['Identificador', c.code],
                ['Apertura', fmtDateTime(c.registration_opens_at)],
                ['Cierre', fmtDateTime(c.registration_closes_at)],
                ['Alberca', `${poolCourseLabel[c.pool_course]} · ${c.pool_length_m} m`],
                ['Edad de referencia', fmtDate(c.age_reference_date ?? c.start_date)],
                ['Máx. pruebas por atleta', c.max_entries_per_athlete ?? 'Sin límite'],
                ['Sin tiempo (NT)', c.allow_no_time ? 'Permitido' : 'No permitido'],
                ['Folios emitidos', c.folio_seq],
              ].map(([k, v]) => (
                <div key={String(k)}>
                  <dt className="text-xs font-semibold tracking-wide text-steel-600 uppercase">
                    {k}
                  </dt>
                  <dd className="text-navy">{v}</dd>
                </div>
              ))}
            </dl>
            {c.description && (
              <p className="mt-4 text-sm whitespace-pre-wrap text-steel-800">{c.description}</p>
            )}
          </CardBody>
        </Card>
      )}
      {tab === 'categories' && (
        <CategoriesTab
          competitionId={c.id}
          categories={cats.data ?? []}
          locked={c.status !== 'draft'}
        />
      )}
      {tab === 'events' && <EventsTab competitionId={c.id} locked={c.status === 'finished'} />}
      {tab === 'registrations' && <RegistrationsTab rows={regs.data} loading={regs.isLoading} />}

      <ConfirmDialog
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        title={statusTarget ? `Cambiar a “${competitionStatusLabel[statusTarget]}”` : ''}
        message={
          statusTarget === 'published'
            ? 'Los entrenadores podrán ver la convocatoria e inscribirse dentro del periodo configurado.'
            : statusTarget === 'closed'
              ? 'No se aceptarán nuevas inscripciones ni envíos.'
              : 'Confirma el cambio de estado.'
        }
        loading={setStatus.isPending}
        onConfirm={() =>
          setStatus.mutate(statusTarget!, {
            onSuccess: () => {
              toast.success('Estado actualizado')
              setStatusTarget(null)
            },
            onError: (e) => toast.error(toAppError(e).message),
          })
        }
      />
    </>
  )
}

function CategoriesTab({
  competitionId,
  categories,
  locked,
}: {
  competitionId: string
  categories: Category[]
  locked: boolean
}) {
  const save = useSaveCategory(competitionId)
  const del = useDeleteCategory(competitionId)
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const form = useForm<CategoryInput>({ resolver: zodResolver(categorySchema) })
  const open = (c: Category | 'new') => {
    setEditing(c)
    form.reset(
      c === 'new'
        ? {
            name: '',
            code: '',
            sex: '',
            min_age: 0,
            max_age: 99,
            sort_order: categories.length + 1,
          }
        : {
            name: c.name,
            code: c.code ?? '',
            sex: c.sex ?? '',
            min_age: c.min_age,
            max_age: c.max_age,
            sort_order: c.sort_order,
          },
    )
  }
  return (
    <Card>
      <CardHeader
        title="Categorías por edad"
        description={
          locked
            ? 'Las categorías se bloquean al publicar para no invalidar inscripciones.'
            : 'La categoría de cada atleta se calcula con la fecha de referencia. Sin categorías, todos son elegibles.'
        }
        action={
          !locked && (
            <Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={() => open('new')}>
              Agregar
            </Button>
          )
        }
      />
      <ul className="divide-y divide-ice-200">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
            <div>
              <span className="font-semibold text-navy">{c.name}</span>
              {c.code && <span className="tnum ml-2 text-xs text-steel-600">{c.code}</span>}
            </div>
            <div className="flex items-center gap-2">
              <span className="tnum text-xs text-steel-600">
                {c.sex ? sexLabel[c.sex] : 'Mixta'} · {c.min_age}–{c.max_age} años
              </span>
              {!locked && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => open(c)} aria-label="Editar">
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteId(c.id)}
                    aria-label="Eliminar"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
        {categories.length === 0 && (
          <li className="px-5 py-6 text-center text-sm text-steel-600">
            Sin categorías configuradas.
          </li>
        )}
      </ul>
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Nueva categoría' : 'Editar categoría'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              loading={save.isPending}
              onClick={form.handleSubmit(async (v) => {
                try {
                  await save.mutateAsync({
                    ...v,
                    id: editing && editing !== 'new' ? editing.id : undefined,
                  })
                  toast.success('Categoría guardada')
                  setEditing(null)
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
        <div className="grid gap-4 grid-cols-2">
          <Field
            label="Nombre"
            error={form.formState.errors.name?.message}
            required
            className="col-span-2"
          >
            {(p) => <Input {...p} {...form.register('name')} placeholder="11-12 años" />}
          </Field>
          <Field label="Código" error={form.formState.errors.code?.message}>
            {(p) => <Input {...p} {...form.register('code')} />}
          </Field>
          <Field label="Rama">
            {(p) => (
              <Select {...p} {...form.register('sex')}>
                <option value="">Mixta</option>
                <option value="F">Femenil</option>
                <option value="M">Varonil</option>
              </Select>
            )}
          </Field>
          <Field label="Edad mínima" error={form.formState.errors.min_age?.message} required>
            {(p) => <Input {...p} type="number" {...form.register('min_age')} />}
          </Field>
          <Field label="Edad máxima" error={form.formState.errors.max_age?.message} required>
            {(p) => <Input {...p} type="number" {...form.register('max_age')} />}
          </Field>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        tone="danger"
        title="Eliminar categoría"
        message="Las pruebas restringidas a esta categoría también se eliminarán."
        confirmLabel="Eliminar"
        loading={del.isPending}
        onConfirm={() =>
          del.mutate(deleteId!, {
            onSuccess: () => {
              toast.success('Categoría eliminada')
              setDeleteId(null)
            },
            onError: (e) => toast.error(toAppError(e).message),
          })
        }
      />
    </Card>
  )
}

function EventsTab({ competitionId, locked }: { competitionId: string; locked: boolean }) {
  const catalog = useEventCatalog()
  const events = useCompetitionEvents(competitionId)
  const sync = useSyncCompetitionEvents(competitionId)
  const update = useUpdateCompetitionEvent(competitionId)
  const [picker, setPicker] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const openPicker = () => {
    setSelected(
      new Set(
        (events.data ?? [])
          .filter((e) => !e.category_id)
          .map((e) => `${e.event_catalog_id}|${e.sex ?? ''}`),
      ),
    )
    setPicker(true)
  }
  const toggle = (key: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(key)) n.delete(key)
      else n.add(key)
      return n
    })
  const sorted = useMemo(
    () => [...(events.data ?? [])].sort((a, b) => (a.event_number ?? 0) - (b.event_number ?? 0)),
    [events.data],
  )

  return (
    <Card>
      <CardHeader
        title="Pruebas habilitadas"
        description="Solo las pruebas habilitadas podrán seleccionarse al inscribir. Asigna número y código externo para la exportación."
        action={
          !locked && (
            <Button size="sm" leftIcon={<Plus className="size-3.5" />} onClick={openPicker}>
              Seleccionar pruebas
            </Button>
          )
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ice-200 bg-ice/60 text-[11px] font-bold tracking-wider text-steel-800 uppercase">
              <th className="px-4 py-2 text-left w-20">#</th>
              <th className="px-4 py-2 text-left">Prueba</th>
              <th className="px-4 py-2 text-left">Rama</th>
              <th className="hidden px-4 py-2 text-left md:table-cell">Código ext.</th>
              <th className="px-4 py-2 text-right">Activa</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((e) => (
              <tr key={e.id} className="border-b border-ice-200 last:border-0">
                <td className="px-4 py-1.5">
                  <Input
                    type="number"
                    defaultValue={e.event_number ?? ''}
                    disabled={locked}
                    className="h-8 w-16 tnum"
                    aria-label="Número"
                    onBlur={(ev) => {
                      const n = ev.target.value ? Number(ev.target.value) : null
                      if (n !== e.event_number)
                        update.mutate(
                          { id: e.id, event_number: n },
                          { onError: (er) => toast.error(toAppError(er).message) },
                        )
                    }}
                  />
                </td>
                <td className="px-4 py-1.5 font-semibold text-navy">
                  {e.event?.name}
                  {e.category && (
                    <span className="ml-2 text-xs font-normal text-steel-600">
                      {e.category.name}
                    </span>
                  )}
                </td>
                <td className="px-4 py-1.5">{e.sex ? sexLabel[e.sex] : 'Mixto'}</td>
                <td className="hidden px-4 py-1.5 md:table-cell">
                  <Input
                    defaultValue={e.external_code ?? ''}
                    disabled={locked}
                    className="h-8 w-28 tnum"
                    aria-label="Código externo"
                    onBlur={(ev) => {
                      const v = ev.target.value.trim() || null
                      if (v !== e.external_code)
                        update.mutate(
                          { id: e.id, external_code: v },
                          { onError: (er) => toast.error(toAppError(er).message) },
                        )
                    }}
                  />
                </td>
                <td className="px-4 py-1.5 text-right">
                  <Checkbox
                    checked={e.is_active}
                    disabled={locked}
                    aria-label="Activa"
                    onChange={(ev) =>
                      update.mutate(
                        { id: e.id, is_active: ev.target.checked },
                        { onError: (er) => toast.error(toAppError(er).message) },
                      )
                    }
                  />
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-center text-steel-600">
                  Ninguna prueba habilitada todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Modal
        open={picker}
        onClose={() => setPicker(false)}
        title="Seleccionar pruebas"
        description="Marca las pruebas por rama. Se crean con numeración consecutiva; puedes ajustarla después."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPicker(false)}>
              Cancelar
            </Button>
            <Button
              loading={sync.isPending}
              onClick={() =>
                sync.mutate(
                  [...selected].map((k) => {
                    const [id, sex] = k.split('|')
                    return { event_catalog_id: id!, sex: (sex || null) as 'F' | 'M' | null }
                  }),
                  {
                    onSuccess: () => {
                      toast.success('Pruebas actualizadas')
                      setPicker(false)
                    },
                    onError: (e) => toast.error(toAppError(e).message),
                  },
                )
              }
            >
              Guardar selección
            </Button>
          </>
        }
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] font-bold tracking-wider text-steel-800 uppercase">
              <th className="py-1 text-left">Prueba</th>
              <th className="py-1 text-center w-20">Femenil</th>
              <th className="py-1 text-center w-20">Varonil</th>
              <th className="py-1 text-center w-20">Mixto</th>
            </tr>
          </thead>
          <tbody>
            {catalog.data
              ?.filter((c) => c.is_active)
              .map((c) => (
                <tr key={c.id} className="border-t border-ice-200">
                  <td className="py-1.5 font-semibold text-navy">{c.name}</td>
                  {(['F', 'M', ''] as const).map((sx) => {
                    const key = `${c.id}|${sx}`
                    return (
                      <td key={sx} className="py-1.5 text-center">
                        <Checkbox
                          checked={selected.has(key)}
                          onChange={() => toggle(key)}
                          aria-label={`${c.name} ${sx || 'mixto'}`}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </Modal>
    </Card>
  )
}

function RegistrationsTab({
  rows,
  loading,
}: {
  rows: RegistrationListItem[] | undefined
  loading: boolean
}) {
  const navigate = useNavigate()
  const columns: Column<RegistrationListItem>[] = [
    {
      key: 'team',
      header: 'Equipo',
      cell: (r) => (
        <div>
          <p className="font-semibold">{r.team?.name}</p>
          <p className="tnum text-xs text-steel-600">{r.folio ?? 'Sin folio'}</p>
        </div>
      ),
    },
    {
      key: 'athletes',
      header: 'Atletas',
      hideOnMobile: true,
      align: 'center',
      cell: (r) => <span className="tnum">{r.athletes_count}</span>,
    },
    {
      key: 'entries',
      header: 'Pruebas',
      hideOnMobile: true,
      align: 'center',
      cell: (r) => <span className="tnum">{r.entries_count}</span>,
    },
    {
      key: 'submitted',
      header: 'Enviada',
      hideOnMobile: true,
      cell: (r) => fmtDateTime(r.submitted_at),
    },
    {
      key: 'status',
      header: 'Estado',
      align: 'right',
      cell: (r) => (
        <Badge tone={registrationStatusTone[r.status]}>{registrationStatusLabel[r.status]}</Badge>
      ),
    },
  ]
  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        loading={loading}
        onRowClick={(r) => navigate(`/registrations/${r.id}`)}
        emptyState={
          <div className="p-8 text-center text-sm text-steel-600">
            Aún no se han recibido inscripciones. Los borradores de los equipos no son visibles
            hasta que se envían.
          </div>
        }
      />
      <p className="mt-3 text-xs text-steel-600">
        La exportación al software del organizador se habilitará cuando se analice el archivo de
        referencia.{' '}
        <Link to="/org/registrations" className="font-semibold text-ocean hover:underline">
          Ver todas las inscripciones
        </Link>
      </p>
    </>
  )
}
