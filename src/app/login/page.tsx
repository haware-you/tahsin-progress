'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { login } from '@/app/actions/auth'
import { AuthShell, FormError, inputCls, buttonCls } from './AuthShell'

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <AuthShell
      title="Selamat Datang"
      subtitle="Masukkan email dan kata sandi untuk membuka akun Anda."
      footer={
        <>
          Belum punya akun?{' '}
          <span className="text-ink font-medium">Hubungi wali kelas atau admin sekolah.</span>
        </>
      }
    >
      <form action={action} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink mb-2">Email</label>
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

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink mb-2">Kata Sandi</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="Masukkan kata sandi"
              className={`${inputCls} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              aria-pressed={showPassword}
              aria-controls="password"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-ink-3 hover:text-ink hover:bg-panel transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
            </button>
          </div>
          <p className="text-xs mt-2 text-right">
            <Link href="/login/lupa" className="text-ink-3 hover:text-accent transition-colors">
              Lupa kata sandi?
            </Link>
          </p>
        </div>

        {error && <FormError>{error}</FormError>}

        <button type="submit" disabled={pending} className={buttonCls}>
          {pending ? 'Sedang masuk…' : 'Masuk'}
        </button>
      </form>
    </AuthShell>
  )
}
