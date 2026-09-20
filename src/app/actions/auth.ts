'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

/** Absolute origin of this deployment, for building auth email redirect links. */
async function siteOrigin(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const protocol = h.get('x-forwarded-proto') ?? 'http'
  return `${protocol}://${host}`
}

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

/**
 * Send a recovery email. Never reveals whether the address is registered —
 * that would let anyone probe the school's account list.
 */
export async function requestPasswordReset(
  _prevState: { ok: boolean; message: string } | null,
  formData: FormData
): Promise<{ ok: boolean; message: string }> {
  const email = (formData.get('email') as string ?? '').trim()
  if (!email) return { ok: false, message: 'Masukkan alamat email Anda.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/reset`,
  })

  // An unregistered address is not an error — Supabase returns success for it,
  // which is what keeps this endpoint from confirming who has an account. So
  // anything that *does* come back is a real failure and must be surfaced,
  // otherwise a network outage looks identical to a sent email.
  if (error) {
    if (error.status === 429)
      return { ok: false, message: 'Terlalu banyak permintaan. Tunggu beberapa menit lalu coba lagi.' }
    return { ok: false, message: 'Tautan belum bisa dikirim. Periksa koneksi internet lalu coba lagi.' }
  }

  return {
    ok: true,
    message: 'Jika email tersebut terdaftar, tautan untuk mengganti kata sandi sudah kami kirim. Periksa juga folder spam.',
  }
}

const MIN_PASSWORD = 8

/** Set a new password for the recovery session opened by /auth/reset. */
export async function updatePassword(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const password = formData.get('password') as string
  const confirm = formData.get('password_confirm') as string

  if (!password || password.length < MIN_PASSWORD)
    return `Kata sandi baru minimal ${MIN_PASSWORD} karakter.`
  if (password !== confirm) return 'Kedua kata sandi belum sama. Periksa kembali.'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return 'Tautan ini sudah kedaluwarsa. Minta tautan baru lewat "Lupa kata sandi".'

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    if (error.status === 429) return 'Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.'
    if (error.code === 'same_password')
      return 'Kata sandi baru harus berbeda dari kata sandi lama.'
    if (error.code === 'weak_password')
      return 'Kata sandi terlalu mudah ditebak. Gunakan kombinasi huruf dan angka.'
    return 'Kata sandi belum tersimpan. Periksa koneksi internet lalu coba lagi.'
  }

  redirect('/dashboard')
}
