'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, SERVICE_KEY_MISSING } from '@/lib/supabase/admin'
import { requireAdmin, generatePassword } from '@/lib/auth'

export async function changeUserRole(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.error

  const targetId = formData.get('user_id') as string
  const newRole = formData.get('role') as string

  if (!targetId) return 'Pengguna tidak ditemukan. Muat ulang halaman lalu coba lagi.'
  if (!['admin', 'teacher', 'student_parent'].includes(newRole)) return 'Pilih salah satu peran: Admin, Guru, atau Siswa/Orang Tua.'
  if (targetId === guard.userId && newRole !== 'admin') return 'Anda tidak dapat melepas peran admin dari akun sendiri. Minta admin lain melakukannya.'

  const supabase = await createClient()
  const { error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', targetId)

  if (error) return 'Peran belum berubah. Periksa koneksi internet lalu coba lagi.'

  revalidatePath('/admin/users')
  return null
}

export type ResetResult =
  | { ok: true; email: string; password: string }
  | { ok: false; error: string }

/**
 * Set a new temporary password for another account and hand it back once, for
 * the admin to pass on. Used when a family can't receive the self-service
 * reset email (see /login/lupa) — the common case until real SMTP is set up.
 */
export async function resetUserPassword(
  _prevState: ResetResult | null,
  formData: FormData
): Promise<ResetResult> {
  const guard = await requireAdmin()
  if (!guard.ok) return { ok: false, error: guard.error }

  const targetId = formData.get('user_id') as string
  if (!targetId) return { ok: false, error: 'Pengguna tidak ditemukan. Muat ulang halaman lalu coba lagi.' }
  if (targetId === guard.userId)
    return { ok: false, error: 'Untuk akun sendiri, gunakan "Lupa kata sandi" di halaman masuk.' }

  const adminDb = createAdminClient()
  if (!adminDb) return { ok: false, error: SERVICE_KEY_MISSING }

  const password = generatePassword()
  const { data, error } = await adminDb.auth.admin.updateUserById(targetId, { password })

  if (error || !data?.user)
    return { ok: false, error: 'Kata sandi belum diganti. Periksa koneksi internet lalu coba lagi.' }

  return { ok: true, email: data.user.email ?? '', password }
}
