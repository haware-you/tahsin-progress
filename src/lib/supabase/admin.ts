import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client. Bypasses RLS and can manage auth users.
 *
 * NEVER import this from a client component, and never call it before the
 * caller has been confirmed to be an admin (see `requireAdmin` in
 * src/lib/auth.ts). The window guard below turns an accidental client import
 * into a loud crash instead of a leaked key. Install the `server-only` package
 * and import it here to catch that at build time instead — see docs/GAPS.md.
 *
 * Returns null when SUPABASE_SERVICE_ROLE_KEY isn't configured, so features
 * that need it can degrade with a clear message instead of crashing.
 */
export function createAdminClient() {
  if (typeof window !== 'undefined')
    throw new Error('createAdminClient() must never run in the browser.')

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export const SERVICE_KEY_MISSING =
  'SUPABASE_SERVICE_ROLE_KEY belum diatur di server. Hubungi pengembang aplikasi.'
