'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function changeUserRole(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Sesi Anda sudah berakhir. Silakan masuk kembali.'

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return 'Hanya admin yang dapat mengubah peran pengguna.'

  const targetId = formData.get('user_id') as string
  const newRole = formData.get('role') as string

  if (!targetId) return 'Pengguna tidak ditemukan. Muat ulang halaman lalu coba lagi.'
  if (!['admin', 'teacher', 'student_parent'].includes(newRole)) return 'Pilih salah satu peran: Admin, Guru, atau Siswa/Orang Tua.'
  if (targetId === user.id && newRole !== 'admin') return 'Anda tidak dapat melepas peran admin dari akun sendiri. Minta admin lain melakukannya.'

  const { error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', targetId)

  if (error) return 'Peran belum berubah. Periksa koneksi internet lalu coba lagi.'

  revalidatePath('/admin/users')
  return null
}
