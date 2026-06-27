import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export const createSupabaseClient = (url: string, anonKey: string) =>
  createClient<Database>(url, anonKey)

export type { Database }
export * from './types'
