'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function changeUserRole(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Sesi tidak valid.'

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return 'Akses ditolak.'

  const targetId = formData.get('user_id') as string
  const newRole = formData.get('role') as string

  if (!targetId) return 'ID pengguna tidak valid.'
  if (!['admin', 'teacher', 'student_parent'].includes(newRole)) return 'Peran tidak valid.'
  if (targetId === user.id && newRole !== 'admin') return 'Tidak dapat mengubah peran akun sendiri.'

  const { error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', targetId)

  if (error) return 'Gagal mengubah peran pengguna.'

  revalidatePath('/admin/users')
  return null
}
