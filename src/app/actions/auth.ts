'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    if (error.status === 429) return 'Terlalu banyak percobaan masuk. Tunggu beberapa menit lalu coba lagi.'
    if (error.code === 'invalid_credentials' || error.status === 400)
      return 'Email atau kata sandi tidak cocok. Periksa ejaan email dan huruf besar/kecil pada kata sandi.'
    return 'Belum bisa masuk. Periksa koneksi internet lalu coba lagi.'
  }

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
