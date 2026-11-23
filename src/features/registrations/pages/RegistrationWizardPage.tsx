import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Send } from 'lucide-react'
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardSkeleton,
  Checkbox,
  SearchInput,
} from '@/shared/ui'
import { toast } from '@/shared/ui/Toaster'
import { TimeInput } from '@/shared/ui/TimeInput'
import { toAppError } from '@/lib/errors'
import { ErrorState } from '@/shared/ui/StatusPages'
import { ageOn, fmtDate, fmtDateTime } from '@/shared/utils/dates'
import { poolCourseLabel, sexShort } from '@/shared/utils/labels'
import { formatCs, parseTimeToCs } from '@/shared/utils/time'
import { cn } from '@/shared/utils/cn'
import { useAthletes } from '@/features/athletes/api'
import {
  registrationWindow,
  useCategories,
  useCompetitionEvents,
} from '@/features/competitions/api'
import { eligibleEvents, resolveCategory } from '../eligibility'
import {
  useRegistration,
  useSetRegistrationAthletes,
  useSubmitRegistration,
  useSyncEntries,
  useValidation,
  type EntryDraft,
  type ValidationIssue,
} from '../api'

const STEPS = ['Competencia', 'Nadadores', 'Pruebas', 'Marcas', 'Confirmación'] as const

/** Local entry state keyed by `${registrationAthleteId}|${competitionEventId}` → time text. */
type EntryMap = Map<string, { time: string; noTime: boolean }>

export function RegistrationWizardPage() {
  const { registrationId = '' } = useParams()
  const navigate = useNavigate()
  const reg = useRegistration(registrationId)
  const comp = reg.data?.competition
  const cats = useCategories(comp?.id)
  const events = useCompetitionEvents(comp?.id)
  const athletes = useAthletes({ teamId: reg.data?.team_id, status: 'active' })
  const setAthletes = useSetRegistrationAthletes(registrationId)
  const syncEntries = useSyncEntries(registrationId)
  const submit = useSubmitRegistration()
  const [step, setStep] = useState(0)
  const [selectedAthletes, setSelectedAthletes] = useState<Set<string>>(new Set())
  const [entries, setEntries] = useState<EntryMap>(new Map())
  const [search, setSearch] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const validation = useValidation(registrationId, step === 4)

  // Hydrate local state from the saved draft once.
  useEffect(() => {
    if (!reg.data || hydrated) return
    setSelectedAthletes(new Set(reg.data.athletes.map((a) => a.athlete_id)))
    const m: EntryMap = new Map()
    for (const e of reg.data.entries)
      m.set(`${e.registration_athlete_id}|${e.competition_event_id}`, {
        time: e.entry_time_cs ? formatCs(e.entry_time_cs) : '',
        noTime: e.no_time,
      })
    setEntries(m)
    setHydrated(true)
  }, [reg.data, hydrated])

  const referenceDate = comp?.age_reference_date ?? comp?.start_date ?? ''
  const activeEvents = useMemo(() => (events.data ?? []).filter((e) => e.is_active), [events.data])
  const raByAthlete = useMemo(
    () => new Map((reg.data?.athletes ?? []).map((ra) => [ra.athlete_id, ra])),
    [reg.data],
  )
  const eventById = useMemo(() => new Map(activeEvents.map((e) => [e.id, e])), [activeEvents])

  if (reg.isLoading || !hydrated) return <CardSkeleton lines={8} />
  if (reg.isError || !reg.data || !comp)
    return (
      <ErrorState
        message={reg.error ? toAppError(reg.error).message : undefined}
        onRetry={() => reg.refetch()}
      />
    )
  const r = reg.data
  if (r.status !== 'draft' && r.status !== 'needs_correction') {
    navigate(`/registrations/${r.id}`, { replace: true })
    return null
  }
  const win = registrationWindow(comp)

  const selectedList = (athletes.data ?? []).filter((a) => selectedAthletes.has(a.id))
  const filteredAthletes = (athletes.data ?? []).filter(
    (a) =>
      !search ||
      `${a.first_name} ${a.last_name} ${a.display_id}`.toLowerCase().includes(search.toLowerCase()),
  )
  const entriesFor = (athleteId: string) => {
    const ra = raByAthlete.get(athleteId)
    if (!ra) return []
    return [...entries.keys()].filter((k) => k.startsWith(`${ra.id}|`)).map((k) => k.split('|')[1]!)
  }
  const maxEntries = comp.max_entries_per_athlete

  // ----- persistence per step -----
  const saveAthletes = async () => {
    await setAthletes.mutateAsync([...selectedAthletes])
    await reg.refetch()
  }
  const saveEntries = async () => {
    const drafts: EntryDraft[] = []
    for (const [key, v] of entries) {
      const [raId, ceId] = key.split('|') as [string, string]
      if (!r.athletes.some((ra) => ra.id === raId)) continue
      drafts.push({
        registration_athlete_id: raId,
        competition_event_id: ceId,
        entry_time_cs: v.noTime ? null : parseTimeToCs(v.time),
        no_time: v.noTime,
      })
    }
    await syncEntries.mutateAsync(drafts)
  }
  const saving = setAthletes.isPending || syncEntries.isPending

  const next = async () => {
    try {
      if (step === 1) {
        if (selectedAthletes.size === 0) {
          toast.error('Selecciona al menos un nadador.')
          return
        }
        await saveAthletes()
      }
      if (step === 2 || step === 3) await saveEntries()
      setStep((s) => Math.min(s + 1, STEPS.length - 1))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      toast.error(toAppError(err).message)
    }
  }
  const back = () => {
    setStep((s) => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleAthlete = (id: string) =>
    setSelectedAthletes((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  const toggleEvent = (raId: string, ceId: string) =>
    setEntries((m) => {
      const n = new Map(m)
      const k = `${raId}|${ceId}`
      if (n.has(k)) n.delete(k)
      else {
        if (
          maxEntries &&
          [...n.keys()].filter((x) => x.startsWith(`${raId}|`)).length >= maxEntries
        ) {
          toast.error(`Máximo ${maxEntries} pruebas por atleta.`)
          return m
        }
        n.set(k, { time: '', noTime: false })
      }
      return n
    })
  const setTime = (k: string, time: string) =>
    setEntries((m) => {
      const n = new Map(m)
      n.set(k, { ...(n.get(k) ?? { noTime: false, time: '' }), time })
      return n
    })
  const setNoTime = (k: string, noTime: boolean) =>
    setEntries((m) => {
      const n = new Map(m)
      n.set(k, { time: noTime ? '' : (n.get(k)?.time ?? ''), noTime })
      return n
    })

  const localErrors: string[] = []
  if (step === 3)
    for (const [k, v] of entries)
      if (!v.noTime && v.time && parseTimeToCs(v.time) === null) localErrors.push(k)

  const issues = validation.data ?? []
  const blocking = issues.filter((i) => i.level === 'error')

  return (
    <>
      <div className="mb-6 animate-rise">
        <p className="text-xs font-semibold tracking-wide text-steel-600 uppercase">
          Asistente de inscripción · {r.team?.name}
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy md:text-3xl">
          {comp.name}
        </h1>
      </div>
      <Stepper step={step} />
      {r.status === 'needs_correction' && r.review_note && (
        <Alert tone="warning" title="Correcciones solicitadas por el organizador" className="mb-5">
          {r.review_note}
        </Alert>
      )}
      {win !== 'open' && (
        <Alert tone="danger" className="mb-5">
          El periodo de inscripción no está abierto. Puedes guardar el borrador pero no enviarlo.
        </Alert>
      )}

      {step === 0 && (
        <Card>
          <CardHeader
            title="Datos de la competencia"
            description="Revisa la convocatoria antes de continuar."
          />
          <CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              [
                'Fechas',
                `${fmtDate(comp.start_date)}${comp.end_date !== comp.start_date ? ` – ${fmtDate(comp.end_date)}` : ''}`,
              ],
              ['Sede', [comp.venue, comp.city].filter(Boolean).join(', ') || '—'],
              ['Alberca', `${poolCourseLabel[comp.pool_course]} · ${comp.pool_length_m} m`],
              ['Cierre de inscripciones', fmtDateTime(comp.registration_closes_at)],
              ['Edad de referencia', fmtDate(referenceDate)],
              ['Pruebas por atleta', maxEntries ?? 'Sin límite'],
              ['Sin tiempo (NT)', comp.allow_no_time ? 'Permitido' : 'No permitido'],
              ['Pruebas habilitadas', activeEvents.length],
            ].map(([k, v]) => (
              <div key={String(k)}>
                <p className="text-xs font-semibold tracking-wide text-steel-600 uppercase">{k}</p>
                <p className="text-sm font-semibold text-navy">{v}</p>
              </div>
            ))}
            {comp.description && (
              <p className="text-sm whitespace-pre-wrap text-steel-800 sm:col-span-2 lg:col-span-3">
                {comp.description}
              </p>
            )}
            {comp.requirements && (
              <Alert
                tone="info"
                title="Requisitos especiales"
                className="sm:col-span-2 lg:col-span-3"
              >
                {comp.requirements}
              </Alert>
            )}
          </CardBody>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader
            title="Selecciona a los nadadores"
            description={`${selectedAthletes.size} seleccionados · solo atletas activos del equipo`}
            action={
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Buscar atleta…"
                className="w-64 max-w-full"
              />
            }
          />
          <ul className="max-h-[60vh] divide-y divide-ice-200 overflow-y-auto">
            {filteredAthletes.map((a) => {
              const cat = resolveCategory(cats.data ?? [], a, referenceDate)
              const noCat = (cats.data?.length ?? 0) > 0 && !cat
              const checked = selectedAthletes.has(a.id)
              return (
                <li key={a.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-3 px-5 py-2.5 transition-colors hover:bg-ice/60',
                      checked && 'bg-aqua-100/40',
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() => toggleAthlete(a.id)}
                      disabled={noCat}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-navy">
                        {a.last_name}, {a.first_name}
                      </span>
                      <span className="block text-xs text-steel-600">
                        {a.display_id} · {sexShort[a.sex]} · {ageOn(a.birth_date, referenceDate)}{' '}
                        años
                      </span>
                    </span>
                    {noCat ? (
                      <Badge tone="danger">Sin categoría</Badge>
                    ) : cat ? (
                      <Badge tone="aqua">
                        {(cats.data ?? []).find((c) => c.id === cat.id)?.name}
                      </Badge>
                    ) : null}
                  </label>
                </li>
              )
            })}
            {filteredAthletes.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-steel-600">
                No hay atletas activos que coincidan.
              </li>
            )}
          </ul>
        </Card>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          {selectedList.map((a) => {
            const ra = raByAthlete.get(a.id)
            if (!ra) return null
            const elig = eligibleEvents(activeEvents, cats.data ?? [], a, referenceDate)
            const chosen = entriesFor(a.id)
            return (
              <Card key={a.id}>
                <CardHeader
                  title={`${a.last_name}, ${a.first_name}`}
                  description={`${elig.length} pruebas elegibles · ${chosen.length}${maxEntries ? `/${maxEntries}` : ''} seleccionadas`}
                />
                <CardBody className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {elig.map((e) => {
                    const k = `${ra.id}|${e.id}`
                    const on = entries.has(k)
                    return (
                      <label
                        key={e.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors',
                          on ? 'border-aqua bg-aqua-100/50' : 'border-ice-200 hover:border-steel',
                        )}
                      >
                        <Checkbox checked={on} onChange={() => toggleEvent(ra.id, e.id)} />
                        <span className="tnum text-xs text-steel-600">
                          #{e.event_number ?? '—'}
                        </span>
                        <span className="font-semibold text-navy">{e.event?.name}</span>
                      </label>
                    )
                  })}
                  {elig.length === 0 && (
                    <p className="text-sm text-steel-600 sm:col-span-3">
                      No hay pruebas elegibles para este atleta en la competencia.
                    </p>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <Alert tone="info">
            Formato <span className="tnum font-semibold">mm:ss.cc</span> (ej. 01:05.32).{' '}
            {comp.allow_no_time
              ? 'Marca NT si el nadador no tiene tiempo registrado.'
              : 'Esta competencia exige tiempo de inscripción en todas las pruebas.'}
          </Alert>
          {selectedList.map((a) => {
            const ra = raByAthlete.get(a.id)
            if (!ra) return null
            const chosen = entriesFor(a.id)
            if (chosen.length === 0) return null
            return (
              <Card key={a.id}>
                <CardHeader title={`${a.last_name}, ${a.first_name}`} />
                <CardBody className="grid gap-3 sm:grid-cols-2">
                  {chosen.map((ceId) => {
                    const k = `${ra.id}|${ceId}`
                    const v = entries.get(k)!
                    const bad = !v.noTime && v.time !== '' && parseTimeToCs(v.time) === null
                    return (
                      <div
                        key={ceId}
                        className="flex items-center gap-3 rounded-md border border-ice-200 px-3 py-2"
                      >
                        <span className="min-w-0 flex-1 text-sm font-semibold text-navy">
                          <span className="tnum mr-1 text-xs text-steel-600">
                            #{eventById.get(ceId)?.event_number ?? '—'}
                          </span>
                          {eventById.get(ceId)?.event?.name}
                        </span>
                        <TimeInput
                          value={v.time}
                          onChange={(t) => setTime(k, t)}
                          disabled={v.noTime}
                          className="w-28"
                          aria-label={`Tiempo ${eventById.get(ceId)?.event?.name}`}
                          aria-invalid={bad}
                        />
                        {comp.allow_no_time && (
                          <label className="flex items-center gap-1 text-xs font-semibold text-steel-800">
                            <Checkbox
                              checked={v.noTime}
                              onChange={(e) => setNoTime(k, e.target.checked)}
                            />
                            NT
                          </label>
                        )}
                      </div>
                    )
                  })}
                </CardBody>
              </Card>
            )
          })}
          {localErrors.length > 0 && (
            <Alert tone="danger">Hay {localErrors.length} tiempo(s) con formato inválido.</Alert>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-4">
          {validation.isLoading && <CardSkeleton lines={3} />}
          {validation.data &&
            (blocking.length > 0 ? (
              <Alert tone="danger" title={`${blocking.length} error(es) bloqueante(s)`}>
                Corrige los errores antes de enviar.
              </Alert>
            ) : (
              <Alert tone="success" title="Todo listo para enviar">
                {issues.length > 0
                  ? 'Hay advertencias que conviene revisar.'
                  : 'No se detectaron problemas.'}
              </Alert>
            ))}
          {issues.length > 0 && (
            <Card>
              <CardHeader title="Observaciones" />
              <ul className="divide-y divide-ice-200">
                {issues.map((i, idx) => (
                  <IssueRow key={idx} issue={i} />
                ))}
              </ul>
            </Card>
          )}
          <Card>
            <CardHeader
              title="Resumen"
              description={`${r.athletes.length} atletas · ${r.entries.length} pruebas`}
            />
            <ul className="divide-y divide-ice-200">
              {r.athletes.map((ra) => (
                <li key={ra.id} className="px-5 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-navy">
                      {ra.athlete?.last_name}, {ra.athlete?.first_name}
                    </span>
                    <span className="text-xs text-steel-600">
                      {ra.athlete ? sexShort[ra.athlete.sex] : ''} ·{' '}
                      {ra.athlete ? ageOn(ra.athlete.birth_date, referenceDate) : ''} años
                    </span>
                  </div>
                  <ul className="mt-1.5 flex flex-wrap gap-1.5">
                    {r.entries
                      .filter((e) => e.registration_athlete_id === ra.id)
                      .map((e) => (
                        <li key={e.id} className="rounded bg-ice px-2 py-1 text-xs">
                          <span className="text-steel-800">
                            {eventById.get(e.competition_event_id)?.event?.name}
                          </span>{' '}
                          <span className="tnum font-bold text-navy">
                            {e.no_time ? 'NT' : formatCs(e.entry_time_cs)}
                          </span>
                        </li>
                      ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <div className="sticky bottom-0 mt-6 -mx-4 flex items-center justify-between gap-3 border-t border-ice-200 bg-ice/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <Button
          variant="secondary"
          onClick={step === 0 ? () => navigate('/registrations') : back}
          leftIcon={<ChevronLeft className="size-4" />}
        >
          {step === 0 ? 'Salir' : 'Anterior'}
        </Button>
        <p className="hidden text-xs text-steel-600 sm:block">
          {saving ? 'Guardando borrador…' : 'El borrador se guarda al avanzar.'}
        </p>
        {step < 4 ? (
          <Button onClick={next} loading={saving} disabled={step === 3 && localErrors.length > 0}>
            Siguiente
            <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button
            variant="aqua"
            leftIcon={<Send className="size-4" />}
            loading={submit.isPending}
            disabled={validation.isLoading || blocking.length > 0 || win !== 'open'}
            onClick={() =>
              submit.mutate(r.id, {
                onSuccess: (res) => {
                  toast.success(`Inscripción enviada · Folio ${res.folio}`)
                  navigate(`/registrations/${res.id}`)
                },
                onError: (e) => {
                  toast.error(toAppError(e).message)
                  validation.refetch()
                },
              })
            }
          >
            Enviar inscripción
          </Button>
        )}
      </div>
    </>
  )
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="mb-6 flex items-center gap-2 overflow-x-auto" aria-label="Pasos">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            aria-current={i === step ? 'step' : undefined}
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
              i < step
                ? 'bg-aqua text-navy'
                : i === step
                  ? 'bg-navy text-white'
                  : 'bg-ice-200 text-steel-600',
            )}
          >
            {i < step ? <Check className="size-3.5" /> : i + 1}
          </span>
          <span
            className={cn(
              'text-sm font-semibold whitespace-nowrap',
              i === step ? 'text-navy' : 'text-steel-600',
            )}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <span
              aria-hidden
              className={cn('mx-1 h-px w-6 sm:w-10', i < step ? 'bg-aqua' : 'bg-ice-200')}
            />
          )}
        </li>
      ))}
    </ol>
  )
}

function IssueRow({ issue }: { issue: ValidationIssue }) {
  return (
    <li className="flex items-start gap-3 px-5 py-2.5 text-sm">
      <AlertTriangle
        className={cn(
          'mt-0.5 size-4 shrink-0',
          issue.level === 'error' ? 'text-danger' : 'text-warning',
        )}
      />
      <span className="text-navy">{issue.message}</span>
      <Badge tone={issue.level === 'error' ? 'danger' : 'warning'} className="ml-auto">
        {issue.level === 'error' ? 'Error' : 'Aviso'}
      </Badge>
    </li>
  )
}
