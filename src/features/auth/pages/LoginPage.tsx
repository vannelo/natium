import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Alert, Button, Field, Input } from '@/shared/ui'
import { loginSchema, type LoginInput } from '../schemas'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    const { error } = await supabase.auth.signInWithPassword(values)
    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos.'
          : error.message,
      )
      return
    }
    navigate(location.state?.from ?? '/', { replace: true })
  })

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-navy">Iniciar sesión</h1>
      <p className="mt-1 text-sm text-steel-600">
        Accede a tu cuenta para administrar equipos e inscripciones.
      </p>
      <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Correo electrónico" error={formState.errors.email?.message} required>
          {(p) => <Input {...p} type="email" autoComplete="email" {...register('email')} />}
        </Field>
        <Field label="Contraseña" error={formState.errors.password?.message} required>
          {(p) => (
            <Input
              {...p}
              type="password"
              autoComplete="current-password"
              {...register('password')}
            />
          )}
        </Field>
        <div className="-mt-2 text-right">
          <Link to="/reset-password" className="text-xs font-semibold text-ocean hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Button type="submit" size="lg" loading={formState.isSubmitting}>
          Entrar
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-steel-600">
        ¿Aún no tienes cuenta?{' '}
        <Link to="/register" className="font-semibold text-ocean hover:underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  )
}
