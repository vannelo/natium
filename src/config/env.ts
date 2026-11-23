import { z } from 'zod'

const schema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(10, 'VITE_SUPABASE_ANON_KEY is required'),
})

const parsed = schema.safeParse(import.meta.env)
if (!parsed.success) {
  // Fail fast with a readable message instead of cryptic runtime errors.
  const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n')
  throw new Error(`Invalid environment configuration:\n${issues}\nSee .env.example`)
}

export const env = {
  supabaseUrl: parsed.data.VITE_SUPABASE_URL,
  supabaseAnonKey: parsed.data.VITE_SUPABASE_ANON_KEY,
}
