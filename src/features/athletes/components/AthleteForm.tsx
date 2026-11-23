import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import { Alert, Button, Field, Input, Select } from '@/shared/ui'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { fmtDate } from '@/shared/utils/dates'
import { useMyTeams } from '@/features/teams/api'
import { athleteSchema, useSimilarAthletes, type Athlete, type AthleteInput } from '../api'

interface Props {
  initial?: Partial<Athlete>
  defaultTeamId?: string
  onSubmit: (values: AthleteInput) => Promise<unknown>
  onCancel?: () => void
  submitLabel?: string
}

export function AthleteForm({
  initial,
  defaultTeamId,
  onSubmit,
  onCancel,
  submitLabel = 'Guardar',
}: Props) {
  const teams = useMyTeams()
  const { register, handleSubmit, formState, watch } = useForm<AthleteInput>({
    resolver: zodResolver(athleteSchema),
    defaultValues: {
      first_name: initial?.first_name ?? '',
      last_name: initial?.last_name ?? '',
      birth_date: initial?.birth_date ?? '',
      sex: initial?.sex ?? undefined,
      team_id: initial?.team_id ?? defaultTeamId ?? '',
    },
  })
  const e = formState.errors
  const [first, last, birth, teamId] = watch(['first_name', 'last_name', 'birth_date', 'team_id'])
  const debounced = useDebounce({ first, last, birth, teamId }, 400)
  const similar = useSimilarAthletes({
    teamId: debounced.teamId,
    first: debounced.first,
    last: debounced.last,
    birth: debounced.birth,
  })
  const duplicates = (similar.data ?? []).filter((d) => d.id !== initial?.id)

  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit(v))}
      noValidate
      className="grid gap-4 sm:grid-cols-2"
    >
      <Field label="Nombre(s)" error={e.first_name?.message} required>
        {(p) => <Input {...p} {...register('first_name')} autoComplete="off" />}
      </Field>
      <Field label="Apellidos" error={e.last_name?.message} required>
        {(p) => <Input {...p} {...register('last_name')} autoComplete="off" />}
      </Field>
      <Field label="Fecha de nacimiento" error={e.birth_date?.message} required>
        {(p) => (
          <Input
            {...p}
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            {...register('birth_date')}
          />
        )}
      </Field>
      <Field label="Rama" error={e.sex?.message} required>
        {(p) => (
          <Select {...p} {...register('sex')}>
            <option value="">Selecciona…</option>
            <option value="F">Femenil</option>
            <option value="M">Varonil</option>
          </Select>
        )}
      </Field>
      <Field label="Equipo" error={e.team_id?.message} required className="sm:col-span-2">
        {(p) => (
          <Select {...p} {...register('team_id')} disabled={!!initial?.id}>
            <option value="">Selecciona…</option>
            {teams.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {duplicates.length > 0 && (
        <div className="sm:col-span-2">
          <Alert tone="warning" title="Posibles duplicados en este equipo">
            <ul className="mt-1 flex flex-col gap-0.5">
              {duplicates.map((d) => (
                <li key={d.id} className="flex items-center gap-2">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  <span>
                    {d.first_name} {d.last_name} · {fmtDate(d.birth_date)} · {d.display_id}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-1 text-xs">
              Verifica antes de guardar para no crear un expediente repetido.
            </p>
          </Alert>
        </div>
      )}

      <div className="flex justify-end gap-2 sm:col-span-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={formState.isSubmitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={formState.isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
