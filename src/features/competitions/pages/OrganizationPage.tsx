import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardSkeleton,
  Field,
  Input,
  PageHeader,
} from '@/shared/ui'
import { toast } from '@/shared/ui/Toaster'
import { toAppError } from '@/lib/errors'
import {
  organizationSchema,
  useMyOrganization,
  useSaveOrganization,
  type OrganizationInput,
} from '../api'

export function OrganizationPage() {
  const org = useMyOrganization()
  const save = useSaveOrganization()
  const { register, handleSubmit, formState, reset, watch, setValue } = useForm<OrganizationInput>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { country: 'MX', name: '', slug: '' },
  })
  const e = formState.errors
  useEffect(() => {
    if (org.data)
      reset({
        name: org.data.name,
        slug: org.data.slug,
        contact_email: org.data.contact_email ?? '',
        city: org.data.city ?? '',
        state: org.data.state ?? '',
        country: org.data.country,
      })
  }, [org.data, reset])
  const name = watch('name')
  useEffect(() => {
    if (!org.data && name)
      setValue(
        'slug',
        name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 40),
      )
  }, [name, org.data, setValue])

  if (org.isLoading) return <CardSkeleton lines={6} />
  return (
    <>
      <PageHeader
        title="Organización"
        description="Entidad organizadora bajo la cual se publican tus competencias."
      />
      <Card>
        <CardHeader
          title={org.data ? 'Datos de la organización' : 'Registrar organización'}
          description={
            org.data ? `Tu rol: ${org.data.my_role}` : 'Es necesario para crear competencias.'
          }
        />
        <CardBody>
          <form
            noValidate
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={handleSubmit(async (v) => {
              try {
                await save.mutateAsync({ ...v, id: org.data?.id })
                toast.success('Organización guardada')
              } catch (err) {
                toast.error(toAppError(err).message)
              }
            })}
          >
            <Field label="Nombre" error={e.name?.message} required className="sm:col-span-2">
              {(p) => <Input {...p} {...register('name')} />}
            </Field>
            <Field label="Identificador (slug)" error={e.slug?.message} required>
              {(p) => <Input {...p} {...register('slug')} />}
            </Field>
            <Field label="Correo de contacto" error={e.contact_email?.message}>
              {(p) => <Input {...p} type="email" {...register('contact_email')} />}
            </Field>
            <Field label="Ciudad" error={e.city?.message}>
              {(p) => <Input {...p} {...register('city')} />}
            </Field>
            <Field label="Estado" error={e.state?.message}>
              {(p) => <Input {...p} {...register('state')} />}
            </Field>
            <Field label="País" error={e.country?.message}>
              {(p) => <Input {...p} {...register('country')} maxLength={2} className="uppercase" />}
            </Field>
            <div className="flex justify-end sm:col-span-2">
              <Button type="submit" loading={save.isPending}>
                Guardar
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  )
}
