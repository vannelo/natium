import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardSkeleton,
  Checkbox,
  Field,
  Input,
  PageHeader,
  Select,
  Textarea,
} from '@/shared/ui'
import { toast } from '@/shared/ui/Toaster'
import { toAppError } from '@/lib/errors'
import { toDateTimeLocalInput } from '@/shared/utils/dates'
import {
  competitionSchema,
  useCompetition,
  useMyOrganization,
  useSaveCompetition,
  type CompetitionInput,
} from '../api'

export function CompetitionFormPage() {
  const { competitionId } = useParams()
  const navigate = useNavigate()
  const org = useMyOrganization()
  const existing = useCompetition(competitionId)
  const save = useSaveCompetition()
  const form = useForm<CompetitionInput>({
    resolver: zodResolver(competitionSchema),
    defaultValues: {
      pool_course: 'SCM',
      pool_length_m: 25,
      allow_no_time: false,
      code: '',
      name: '',
      start_date: '',
      end_date: '',
      registration_opens_at: '',
      registration_closes_at: '',
    },
  })
  const { register, handleSubmit, formState, watch, setValue, reset } = form
  const e = formState.errors

  useEffect(() => {
    const c = existing.data
    if (!c) return
    reset({
      name: c.name,
      code: c.code,
      description: c.description ?? '',
      start_date: c.start_date,
      end_date: c.end_date,
      venue: c.venue ?? '',
      city: c.city ?? '',
      registration_opens_at: toDateTimeLocalInput(c.registration_opens_at),
      registration_closes_at: toDateTimeLocalInput(c.registration_closes_at),
      pool_course: c.pool_course,
      pool_length_m: c.pool_length_m,
      age_reference_date: c.age_reference_date ?? '',
      max_entries_per_athlete: c.max_entries_per_athlete ?? '',
      allow_no_time: c.allow_no_time,
      requirements: c.requirements ?? '',
    })
  }, [existing.data, reset])

  const course = watch('pool_course')
  useEffect(() => {
    if (course === 'SCM') setValue('pool_length_m', 25)
    if (course === 'LCM') setValue('pool_length_m', 50)
  }, [course, setValue])

  if (competitionId && existing.isLoading) return <CardSkeleton lines={10} />

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Competencias', to: '/org/competitions' },
          { label: competitionId ? 'Editar' : 'Nueva' },
        ]}
        title={competitionId ? 'Editar competencia' : 'Nueva competencia'}
        description="Define la convocatoria. Podrás configurar categorías y pruebas después de guardar."
      />
      <form
        noValidate
        onSubmit={handleSubmit(async (values) => {
          try {
            const c = await save.mutateAsync({
              ...values,
              id: competitionId,
              organization_id: org.data!.id,
            })
            toast.success(competitionId ? 'Competencia actualizada' : 'Competencia creada')
            navigate(`/org/competitions/${c.id}`)
          } catch (err) {
            const er = toAppError(err)
            toast.error(
              er.code === 'duplicate'
                ? 'Ya existe una competencia con ese identificador.'
                : er.message,
            )
          }
        })}
        className="flex flex-col gap-5"
      >
        <Card>
          <CardHeader title="Identidad" />
          <CardBody className="grid gap-4 sm:grid-cols-[1fr_200px]">
            <Field label="Nombre" error={e.name?.message} required>
              {(p) => <Input {...p} {...register('name')} />}
            </Field>
            <Field
              label="Identificador"
              error={e.code?.message}
              required
              hint="Se usa en folios y exportaciones"
            >
              {(p) => (
                <Input
                  {...p}
                  {...register('code')}
                  className="uppercase tnum"
                  placeholder="CDP27"
                />
              )}
            </Field>
            <Field
              label="Descripción / convocatoria"
              error={e.description?.message}
              className="sm:col-span-2"
            >
              {(p) => <Textarea {...p} rows={4} {...register('description')} />}
            </Field>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Fechas y sede" />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Fecha de inicio" error={e.start_date?.message} required>
              {(p) => <Input {...p} type="date" {...register('start_date')} />}
            </Field>
            <Field label="Fecha de fin" error={e.end_date?.message} required>
              {(p) => <Input {...p} type="date" {...register('end_date')} />}
            </Field>
            <Field label="Sede" error={e.venue?.message}>
              {(p) => <Input {...p} {...register('venue')} />}
            </Field>
            <Field label="Ciudad" error={e.city?.message}>
              {(p) => <Input {...p} {...register('city')} />}
            </Field>
            <Field
              label="Apertura de inscripciones"
              error={e.registration_opens_at?.message}
              required
            >
              {(p) => <Input {...p} type="datetime-local" {...register('registration_opens_at')} />}
            </Field>
            <Field
              label="Cierre de inscripciones"
              error={e.registration_closes_at?.message}
              required
            >
              {(p) => (
                <Input {...p} type="datetime-local" {...register('registration_closes_at')} />
              )}
            </Field>
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Reglas"
            description="Nada está fijo: cada competencia define sus propias reglas."
          />
          <CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Tipo de alberca" required>
              {(p) => (
                <Select {...p} {...register('pool_course')}>
                  <option value="SCM">Curso corto (25 m)</option>
                  <option value="LCM">Curso largo (50 m)</option>
                  <option value="OTHER">Otra</option>
                </Select>
              )}
            </Field>
            <Field label="Longitud (m)" error={e.pool_length_m?.message} required>
              {(p) => (
                <Input
                  {...p}
                  type="number"
                  {...register('pool_length_m')}
                  disabled={course !== 'OTHER'}
                />
              )}
            </Field>
            <Field
              label="Fecha de referencia de edad"
              error={e.age_reference_date?.message}
              hint="Vacío = fecha de inicio"
            >
              {(p) => <Input {...p} type="date" {...register('age_reference_date')} />}
            </Field>
            <Field
              label="Máximo de pruebas por atleta"
              error={e.max_entries_per_athlete?.message}
              hint="Vacío = sin límite"
            >
              {(p) => (
                <Input {...p} type="number" min={1} {...register('max_entries_per_athlete')} />
              )}
            </Field>
            <label className="flex items-center gap-2 text-sm text-navy sm:col-span-2">
              <Checkbox {...register('allow_no_time')} /> Permitir inscripciones sin tiempo (NT)
            </label>
            <Field
              label="Requisitos especiales"
              error={e.requirements?.message}
              className="sm:col-span-2"
            >
              {(p) => <Textarea {...p} rows={3} {...register('requirements')} />}
            </Field>
          </CardBody>
        </Card>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Cancelar
          </Button>
          <Button type="submit" loading={formState.isSubmitting || save.isPending}>
            {competitionId ? 'Guardar cambios' : 'Crear competencia'}
          </Button>
        </div>
      </form>
    </>
  )
}
