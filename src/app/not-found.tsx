import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <p dir="rtl" lang="ar" className="font-arabic text-5xl text-accent leading-[1.6]" aria-hidden>
          ب
        </p>
        <p className="text-[11px] font-medium tracking-[0.28em] uppercase text-ink-3 mt-4">Kesalahan 404</p>
        <h1 className="font-serif text-[40px] sm:text-5xl font-medium leading-[1.05] text-ink mt-3">
          Halaman tidak ditemukan
        </h1>
        <p className="text-[15px] text-ink-2 leading-relaxed mt-5">
          Mungkin tautannya salah atau halamannya sudah dipindahkan. Kembali ke beranda Anda untuk melanjutkan.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition-colors"
          >
            Ke beranda <ArrowUpRight size={15} />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center h-10 px-5 rounded-full border border-line text-ink text-sm font-medium hover:bg-surface transition-colors"
          >
            Masuk
          </Link>
        </div>
      </div>
    </main>
  )
}
