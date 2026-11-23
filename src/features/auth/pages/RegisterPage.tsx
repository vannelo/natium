import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Alert, Button, Field, Input } from '@/shared/ui'
import { cn } from '@/shared/utils/cn'
import { registerSchema, type RegisterInput } from '../schemas'

export function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [needsConfirm, setNeedsConfirm] = useState(false)
  const { register, handleSubmit, formState, watch, setValue } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'coach' },
  })
  const role = watch('role')

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { full_name: values.fullName, role: values.role } },
    })
    if (error) {
      setError(
        error.message.includes('already registered')
          ? 'Este correo ya está registrado.'
          : error.message,
      )
      return
    }
    if (data.session) navigate('/', { replace: true })
    else setNeedsConfirm(true)
  })

  if (needsConfirm) {
    return (
      <Alert tone="success" title="Revisa tu correo">
        Te enviamos un enlace para confirmar tu cuenta. Después podrás iniciar sesión.
      </Alert>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-navy">Crear cuenta</h1>
      <p className="mt-1 text-sm text-steel-600">
        Elige tu perfil para configurar tu espacio de trabajo.
      </p>
      <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <div role="radiogroup" aria-label="Tipo de cuenta" className="grid grid-cols-2 gap-2">
          {(
            [
              { value: 'coach', title: 'Entrenador', desc: 'Administro equipos y nadadores' },
              {
                value: 'organizer',
                title: 'Organizador',
                desc: 'Creo competencias y reviso inscripciones',
              },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={role === opt.value}
              onClick={() => setValue('role', opt.value)}
              className={cn(
                'rounded-md border p-3 text-left transition-all',
                role === opt.value
                  ? 'border-aqua bg-aqua-100/60 ring-2 ring-aqua/30'
                  : 'border-ice-200 bg-white hover:border-steel',
              )}
            >
              <span className="block text-sm font-bold text-navy">{opt.title}</span>
              <span className="block text-xs text-steel-600">{opt.desc}</span>
            </button>
          ))}
        </div>
        <Field label="Nombre completo" error={formState.errors.fullName?.message} required>
          {(p) => <Input {...p} autoComplete="name" {...register('fullName')} />}
        </Field>
        <Field label="Correo electrónico" error={formState.errors.email?.message} required>
          {(p) => <Input {...p} type="email" autoComplete="email" {...register('email')} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
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
        </div>
        <Button type="submit" size="lg" loading={formState.isSubmitting}>
          Crear cuenta
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-steel-600">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-ocean hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
