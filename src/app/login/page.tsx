'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import Image from 'next/image'
import Link from 'next/link'

export default function LoginPage() {
  const [error, action, pending] = useActionState(login, null)

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white relative">
      {/* Mobile background (visible only on mobile) */}
      <div className="md:hidden absolute inset-0 z-0">
        <Image
          src="/login-illustration.png"
          alt="Background"
          fill
          sizes="(max-width: 768px) 100vw, 0vw"
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]" />
      </div>

      {/* Left Side: Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 lg:p-16 relative z-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-stone-500 hover:text-green-700 transition-colors mb-12">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali ke Beranda
          </Link>

          <div className="mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-700 mb-6 shadow-sm">
              <span className="font-arabic text-xl text-white leading-none">ب</span>
            </div>
            <h1 className="text-3xl font-bold font-serif text-stone-900 tracking-tight">Selamat Datang</h1>
            <p className="text-stone-500 text-base mt-2">Masuk ke Sistem Progres Tahsin Al Bayyinah.</p>
          </div>

          <form action={action} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-4 py-3.5 rounded-xl border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base transition-shadow"
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1.5">
                Kata Sandi
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3.5 rounded-xl border border-stone-200 text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-base transition-shadow"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm rounded-lg bg-red-50 px-3 py-2.5 border border-red-100">{error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full py-3.5 px-4 bg-green-700 text-white font-bold rounded-xl hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-base shadow-sm mt-2"
            >
              {pending ? 'Memproses...' : 'Masuk ke Akun'}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-stone-100">
            <p className="text-sm text-stone-500">
              Belum punya akun? <span className="text-green-700 font-semibold cursor-help" title="Silakan hubungi admin sekolah">Dibuat oleh admin.</span>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Illustration */}
      <div className="hidden md:flex w-1/2 bg-green-50 p-12 items-center justify-center relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 w-full h-full opacity-50 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl" />
        </div>
        
        <div className="relative w-full max-w-[480px] aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white/60 bg-white">
           <Image
             src="/login-illustration.png"
             alt="Al Bayyinah Illustration"
             fill
             sizes="(min-width: 768px) 50vw, 0vw"
             className="object-cover"
             priority
           />
        </div>
      </div>
    </div>
  )
}
