import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Field, Input } from '@/shared/ui'
import { teamSchema, type TeamInput, type Team } from '../api'

interface TeamFormProps {
  initial?: Partial<Team>
  onSubmit: (values: TeamInput) => Promise<unknown>
  submitLabel?: string
  onCancel?: () => void
}

export function TeamForm({ initial, onSubmit, submitLabel = 'Guardar', onCancel }: TeamFormProps) {
  const { register, handleSubmit, formState } = useForm<TeamInput>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: initial?.name ?? '',
      short_name: initial?.short_name ?? '',
      code: initial?.code ?? '',
      city: initial?.city ?? '',
      state: initial?.state ?? '',
      country: initial?.country ?? 'MX',
      contact_name: initial?.contact_name ?? '',
      contact_email: initial?.contact_email ?? '',
      contact_phone: initial?.contact_phone ?? '',
    },
  })
  const e = formState.errors
  return (
    <form
      onSubmit={handleSubmit((v) => onSubmit(v))}
      noValidate
      className="grid gap-4 sm:grid-cols-2"
    >
      <Field label="Nombre oficial" error={e.name?.message} required className="sm:col-span-2">
        {(p) => <Input {...p} {...register('name')} placeholder="Club Acuático Delfines" />}
      </Field>
      <Field label="Nombre corto" error={e.short_name?.message} required>
        {(p) => <Input {...p} {...register('short_name')} placeholder="DELFINES" />}
      </Field>
      <Field label="Clave / código" error={e.code?.message} hint="Si el organizador lo requiere">
        {(p) => <Input {...p} {...register('code')} placeholder="DELF" className="uppercase" />}
      </Field>
      <Field label="Ciudad" error={e.city?.message}>
        {(p) => <Input {...p} {...register('city')} />}
      </Field>
      <Field label="Estado" error={e.state?.message}>
        {(p) => <Input {...p} {...register('state')} />}
      </Field>
      <Field label="País" error={e.country?.message} hint="Código ISO de 2 letras">
        {(p) => <Input {...p} {...register('country')} maxLength={2} className="uppercase" />}
      </Field>
      <Field label="Responsable" error={e.contact_name?.message}>
        {(p) => <Input {...p} {...register('contact_name')} />}
      </Field>
      <Field label="Correo de contacto" error={e.contact_email?.message}>
        {(p) => <Input {...p} type="email" {...register('contact_email')} />}
      </Field>
      <Field label="Teléfono" error={e.contact_phone?.message}>
        {(p) => <Input {...p} type="tel" {...register('contact_phone')} />}
      </Field>
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
