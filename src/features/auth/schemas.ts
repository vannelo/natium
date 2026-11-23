import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Correo electrónico inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})
export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Ingresa tu nombre completo').max(120),
    email: z.email('Correo electrónico inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirm: z.string(),
    role: z.enum(['coach', 'organizer']),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm'],
  })
export type RegisterInput = z.infer<typeof registerSchema>

export const resetSchema = z.object({ email: z.email('Correo electrónico inválido') })
export type ResetInput = z.infer<typeof resetSchema>
