'use client'

import { use, useActionState } from 'react'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { requestPasswordReset } from '@/app/actions/auth'
import { AuthShell, FormError, inputCls, buttonCls } from '../AuthShell'

export default function LupaPage({
  searchParams,
}: {
  searchParams: Promise<{ gagal?: string }>
}) {
  const { gagal } = use(searchParams)
  const [state, action, pending] = useActionState(requestPasswordReset, null)

  return (
    <AuthShell
      back={{ href: '/login', label: 'Masuk' }}
      title="Lupa Kata Sandi"
      subtitle="Masukkan email akun Anda. Kami kirimkan tautan untuk membuat kata sandi baru."
      footer={
        <>
          Tidak menerima email?{' '}
          <span className="text-ink font-medium">Hubungi wali kelas atau admin sekolah.</span>
        </>
      }
    >
      {state?.ok ? (
        <div className="text-center space-y-6">
          <div className="w-14 h-14 rounded-full bg-accent-soft text-accent flex items-center justify-center mx-auto">
            <MailCheck size={24} strokeWidth={1.75} />
          </div>
          <p role="status" className="text-[15px] text-ink-2 leading-relaxed">
            {state.message}
          </p>
          <Link
            href="/login"
            className={`${buttonCls} inline-flex items-center justify-center no-underline`}
          >
            Kembali ke halaman masuk
          </Link>
        </div>
      ) : (
        <form action={action} className="space-y-5">
          {gagal && (
            <FormError>
              Tautan tersebut sudah kedaluwarsa atau pernah dipakai. Minta tautan baru di bawah ini.
            </FormError>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="nama@email.com"
              className={inputCls}
            />
          </div>

          {state && !state.ok && <FormError>{state.message}</FormError>}

          <button type="submit" disabled={pending} className={buttonCls}>
            {pending ? 'Sedang mengirim…' : 'Kirim tautan'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
