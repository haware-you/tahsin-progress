import { createClient } from '@/lib/supabase/server'

type AdminCheck =
  | { ok: true; userId: string }
  | { ok: false; error: string }

/**
 * Confirm the caller is a signed-in admin. Every server action that reaches
 * for the service-role client must pass this first.
 */
export async function requireAdmin(): Promise<AdminCheck> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sesi Anda sudah berakhir. Silakan masuk kembali.' }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin')
    return { ok: false, error: 'Hanya admin yang dapat melakukan tindakan ini.' }

  return { ok: true, userId: user.id }
}

// Unambiguous alphabet: no 0/O, 1/l/I — these get read aloud and retyped by
// parents from a printed sheet.
const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Generate a random initial password for an account the admin provisions. */
export function generatePassword(length = 12): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}
