'use client'

import { useActionState, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { updatePassword } from '@/app/actions/auth'
import { AuthShell, FormError, inputCls, buttonCls } from '../AuthShell'

export default function ResetPage() {
  const [error, action, pending] = useActionState(updatePassword, null)
  const [show, setShow] = useState(false)

  return (
    <AuthShell
      back={{ href: '/login', label: 'Masuk' }}
      title="Kata Sandi Baru"
      subtitle="Buat kata sandi baru untuk akun Anda. Minimal 8 karakter."
    >
      <form action={action} className="space-y-5">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink mb-2">
            Kata Sandi Baru
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={show ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              className={`${inputCls} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              aria-pressed={show}
              aria-controls="password"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-ink-3 hover:text-ink hover:bg-panel transition-colors cursor-pointer"
            >
              {show ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="password_confirm" className="block text-sm font-medium text-ink mb-2">
            Ulangi Kata Sandi Baru
          </label>
          <input
            id="password_confirm"
            name="password_confirm"
            type={show ? 'text' : 'password'}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="Ketik ulang kata sandi"
            className={inputCls}
          />
        </div>

        {error && <FormError>{error}</FormError>}

        <button type="submit" disabled={pending} className={buttonCls}>
          {pending ? 'Menyimpan…' : 'Simpan kata sandi'}
        </button>
      </form>
    </AuthShell>
  )
}
