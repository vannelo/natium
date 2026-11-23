import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Alert, Button, Field, Input } from '@/shared/ui'

const schema = z
  .object({ password: z.string().min(8, 'Mínimo 8 caracteres'), confirm: z.string() })
  .refine((d) => d.password === d.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  })
type Input_ = z.infer<typeof schema>

export function UpdatePasswordPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState } = useForm<Input_>({ resolver: zodResolver(schema) })
  const onSubmit = handleSubmit(async ({ password }) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) setError(error.message)
    else navigate('/', { replace: true })
  })
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-navy">Nueva contraseña</h1>
      <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Contraseña" error={formState.errors.password?.message} required>
          {(p) => (
            <Input {...p} type="password" autoComplete="new-password" {...register('password')} />
          )}
        </Field>
        <Field label="Confirmar" error={formState.errors.confirm?.message} required>
          {(p) => (
            <Input {...p} type="password" autoComplete="new-password" {...register('confirm')} />
          )}
        </Field>
        <Button type="submit" size="lg" loading={formState.isSubmitting}>
          Guardar
        </Button>
      </form>
    </div>
  )
}
