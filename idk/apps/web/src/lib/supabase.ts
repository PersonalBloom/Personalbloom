import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@personalbloom/db'

// Client-side (use inside React components)
export const createClient = () =>
  createClientComponentClient<Database>()

// Server-side (use inside Server Components / Route Handlers)
export const createServerClient = () =>
  createServerComponentClient<Database>({ cookies })
