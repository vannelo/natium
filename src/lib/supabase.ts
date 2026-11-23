import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'
import { env } from '@/config/env'

// Only the anon key is ever used in the browser. RLS enforces authorization.
export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
