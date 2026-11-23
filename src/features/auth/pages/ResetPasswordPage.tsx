import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Alert, Button, Field, Input } from '@/shared/ui'
import { resetSchema, type ResetInput } from '../schemas'

export function ResetPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState } = useForm<ResetInput>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    if (error) setError(error.message)
    else setSent(true)
  })

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight text-navy">Recuperar contraseña</h1>
      <p className="mt-1 text-sm text-steel-600">Te enviaremos un enlace para restablecerla.</p>
      {sent ? (
        <Alert tone="success" className="mt-6">
          Si el correo existe, recibirás un enlace en unos minutos.
        </Alert>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-6 flex flex-col gap-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Correo electrónico" error={formState.errors.email?.message} required>
            {(p) => <Input {...p} type="email" autoComplete="email" {...register('email')} />}
          </Field>
          <Button type="submit" size="lg" loading={formState.isSubmitting}>
            Enviar enlace
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="font-semibold text-ocean hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  )
}
