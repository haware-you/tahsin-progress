import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

// Faint eight-point star lattice for the quote panel.
const PATTERN = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#f5f1e6" stroke-width="1"><rect x="18" y="18" width="28" height="28"/><rect x="18" y="18" width="28" height="28" transform="rotate(45 32 32)"/></svg>'
)}")`

export const inputCls =
  'w-full h-12 px-4 rounded-2xl bg-surface border border-line text-ink text-[15px] placeholder:text-ink-3 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition'

export const buttonCls =
  'w-full h-12 rounded-full bg-accent text-paper text-[15px] font-medium hover:bg-ink disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer'

/** Two-panel auth layout: hadith on the left, form on the right. */
export function AuthShell({
  back = { href: '/', label: 'Beranda' },
  title,
  subtitle,
  footer,
  children,
}: {
  back?: { href: string; label: string }
  title: string
  subtitle: string
  footer?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-paper p-0 md:p-4 lg:p-6 flex">
      <div className="flex-1 flex flex-col md:flex-row md:rounded-[32px] overflow-hidden md:bg-surface md:shadow-[0_1px_2px_rgba(29,33,27,0.06)]">
        {/* Quote panel */}
        <section
          className="relative md:w-[46%] bg-accent text-paper px-6 pt-6 pb-6 md:p-12 flex flex-col justify-between md:min-h-0 md:rounded-[28px] md:m-2"
          aria-label="Kutipan"
        >
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none md:rounded-[28px]" style={{ backgroundImage: PATTERN }} aria-hidden />

          <div className="relative flex items-center gap-4">
            <span className="text-[11px] font-medium tracking-[0.28em] uppercase">Sebuah Hikmah</span>
            <span className="h-px w-24 bg-paper/50" />
          </div>

          <div className="relative mt-4 md:mt-0">
            <p dir="rtl" lang="ar" className="font-arabic text-2xl md:text-4xl leading-[1.9] text-paper/90">
              خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
            </p>
            <h2 className="hidden md:block font-serif text-5xl lg:text-6xl leading-[1.02] font-medium mt-4">
              Belajar dan
              <br />
              Mengajarkan
              <br />
              Al-Qur&apos;an
            </h2>
            <p className="text-xs md:text-sm text-paper/75 leading-relaxed mt-1 md:mt-5 max-w-sm">
              &ldquo;Sebaik-baik kalian adalah yang belajar Al-Qur&apos;an dan mengajarkannya.&rdquo; (HR. Bukhari)
            </p>
          </div>
        </section>

        {/* Form */}
        <section className="flex-1 flex flex-col px-6 py-8 md:px-12 md:py-10">
          <header className="flex items-center justify-between">
            <Link href={back.href} className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink transition-colors">
              <ArrowLeft size={16} /> {back.label}
            </Link>
            <div className="flex items-center gap-2">
              <span className="font-arabic text-2xl leading-none text-accent" aria-hidden>ب</span>
              <span className="font-serif text-xl text-ink">Al Bayyinah</span>
            </div>
          </header>

          <div className="flex-1 flex items-center justify-center py-10 md:py-12">
            <div className="w-full max-w-sm">
              <div className="text-center mb-10">
                <h1 className="font-serif text-[40px] md:text-5xl font-medium leading-[1.05] text-ink">{title}</h1>
                <p className="text-[15px] text-ink-2 mt-3">{subtitle}</p>
              </div>
              {children}
            </div>
          </div>

          {footer && <div className="text-center text-sm text-ink-3">{footer}</div>}
        </section>
      </div>
    </div>
  )
}

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="text-sm text-warn bg-warn-soft rounded-2xl px-4 py-3">
      {children}
    </p>
  )
}
