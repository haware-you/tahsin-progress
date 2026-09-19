import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowUpRight, PencilLine, Eye, CalendarCog, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Progress } from '@/components/ui'
import { Reveal, Entrance, GrowStack } from './landing-motion'

const NAV = [
  { href: '#jalur', label: 'Jalur Belajar' },
  { href: '#orang-tua', label: 'Untuk Orang Tua' },
  { href: '#peran', label: 'Cara Kerja' },
]

const STAGES = ['Iqro 1', 'Iqro 2', 'Iqro 3', 'Iqro 4', 'Iqro 5', 'Iqro 6', 'Tadarus', 'Hafalan Juz 30', 'Hafalan Juz 29']
// Matches the example card above: this student is currently on Hafalan Juz 30.
const CURRENT_STAGE = 7

const TRACKS = [
  { k: 'Iqro 1–6', v: 'Mengenal huruf dan membaca terbata-bata sampai lancar.' },
  { k: 'Tadarus Juz 30', v: 'Membaca Juz 30 dengan lancar dan benar, belum menghafal.' },
  { k: 'Hafalan Juz 30, lalu 29', v: 'Menghafal halaman demi halaman, dengan murajaah dari guru.' },
]

const ROLES = [
  {
    icon: PencilLine,
    role: 'Guru',
    title: 'Mencatat dalam 30 detik',
    body: 'Ketuk nama siswa, halaman sudah terisi dari sesi sebelumnya, simpan. Bisa sambil berdiri, dengan satu tangan.',
  },
  {
    icon: Eye,
    role: 'Orang Tua',
    title: 'Melihat di hari yang sama',
    body: 'Posisi terbaru, catatan ustadz/ustadzah, dan hasil murajaah. Tanpa menunggu rapor atau grup WhatsApp.',
  },
  {
    icon: CalendarCog,
    role: 'Admin',
    title: 'Mengatur tahun ajaran',
    body: 'Impor daftar siswa, buat kelas, dan pindahkan progres ke tahun berikutnya dalam beberapa langkah.',
  },
]

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-paper/95 border-b border-line/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 min-h-11" aria-label="Al Bayyinah, beranda">
            <span className="font-arabic text-3xl leading-none text-accent" aria-hidden>ب</span>
            <span className="font-serif text-xl">Al Bayyinah</span>
          </Link>
          <nav aria-label="Navigasi halaman" className="hidden md:block">
            <ul className="flex items-center gap-1 rounded-full bg-surface px-2 py-1.5">
              {NAV.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="block px-4 py-1.5 rounded-full text-sm text-ink-2 hover:text-ink hover:bg-panel transition-colors">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 h-11 px-5 rounded-full bg-accent text-paper text-sm font-medium hover:bg-ink transition-colors"
          >
            Masuk <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-8 pt-12 sm:pt-20 text-center overflow-x-clip">
          <Entrance>
            <p dir="rtl" lang="ar" className="font-arabic text-2xl sm:text-3xl text-accent leading-[1.8]">
              بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
            </p>
            <h1 className="font-serif text-[44px] sm:text-6xl lg:text-7xl font-medium leading-[1.02] mt-4 max-w-4xl mx-auto">
              Catatan tahsin, dari kelas sampai ke rumah
            </h1>
            <p className="text-[15px] sm:text-base text-ink-2 leading-relaxed mt-6 max-w-xl mx-auto">
              Sistem progres belajar Al-Qur&apos;an Al Bayyinah School. Guru mencatat setelah kelas, orang tua melihatnya
              sore itu juga.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-9">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 h-12 px-6 rounded-full bg-accent text-paper text-[15px] font-medium hover:bg-ink transition-colors"
              >
                Masuk ke akun <ArrowUpRight size={16} />
              </Link>
              <a
                href="#jalur"
                className="inline-flex items-center h-12 px-6 rounded-full border border-line text-ink text-[15px] font-medium hover:bg-surface transition-colors"
              >
                Lihat jalur belajar
              </a>
            </div>
          </Entrance>

          {/* Growing record card */}
          <div className="mt-16 sm:mt-24 max-w-4xl mx-auto">
            <GrowStack>
              <div className="rounded-[32px] bg-surface shadow-[0_1px_2px_rgba(29,33,27,0.06)] p-7 sm:p-12 text-left grid gap-8 sm:grid-cols-[1.1fr_1fr] sm:items-center">
                <div>
                  <p className="text-xs font-medium text-ink-3 uppercase tracking-[0.14em]">Posisi saat ini</p>
                  <p dir="rtl" lang="ar" className="font-arabic text-6xl sm:text-7xl text-ink text-right sm:text-left leading-[1.6] mt-2">
                    البلد
                  </p>
                  <h2 className="font-serif text-3xl sm:text-4xl">Al-Balad</h2>
                  <p className="text-sm text-ink-2 mt-1">
                    <span className="font-semibold text-gold">13</span> / 23 halaman Hafalan Juz 30
                  </p>
                  <div className="mt-5">
                    <Progress value={13} max={23} />
                  </div>
                </div>
                <div className="rounded-3xl bg-paper p-6">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-accent-soft text-accent text-xs font-semibold flex items-center justify-center">UH</span>
                    <div>
                      <p className="text-[15px] font-semibold">Ustadz Hamzah</p>
                      <p className="text-xs text-ink-3">Hari ini · Kelas A</p>
                    </div>
                  </div>
                  <p className="text-sm italic text-ink-2 leading-relaxed mt-4">
                    &ldquo;Bacaan surah Al-Balad sudah lancar, mad thabi&apos;i perlu dijaga.&rdquo;
                  </p>
                  <p className="inline-flex items-center gap-1 text-xs font-medium text-accent mt-4">
                    <Check size={12} strokeWidth={2.5} /> Murajaah · Lanjut
                  </p>
                </div>
              </div>
            </GrowStack>
            <p className="text-xs text-ink-3 mt-6">Contoh tampilan. Data asli hanya terlihat oleh siswa, orang tua, dan gurunya.</p>
          </div>
        </section>

        {/* Statement */}
        <section className="max-w-5xl mx-auto px-4 sm:px-8 py-28 sm:py-40 text-center">
          <Reveal>
            <p className="font-serif text-[30px] sm:text-5xl leading-[1.2] text-ink">
              Setiap halaman yang dibaca anak di kelas tercatat hari itu juga, lengkap dengan catatan ustadznya. Orang tua
              tidak perlu menunggu rapor untuk <span className="text-accent">melihat perjalanannya</span>.
            </p>
          </Reveal>
        </section>

        {/* Journey */}
        <section id="jalur" className="bg-panel scroll-mt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-24 sm:py-32">
            <Reveal className="text-center">
              <p className="text-[11px] font-medium tracking-[0.28em] uppercase text-ink-3">Jalur Belajar</p>
              <h2 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-medium mt-4">Iqro sampai Hafalan</h2>
              <p className="text-[15px] text-ink-2 mt-6 max-w-xl mx-auto leading-relaxed">
                Setiap siswa menempuh jalur yang sama. Guru mencatat tahap dan halamannya, sistem menunjukkan seberapa jauh
                perjalanannya.
              </p>
            </Reveal>

            <Reveal delay={150} className="mt-16">
              <ol className="grid grid-cols-3 sm:grid-cols-9 gap-y-8">
                {STAGES.map((s, i) => (
                  <li key={s} className="flex flex-col items-center gap-3 text-center">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        i < CURRENT_STAGE ? 'bg-accent' : i === CURRENT_STAGE ? 'bg-accent-soft ring-2 ring-accent' : 'bg-line'
                      }`}
                      aria-hidden
                    />
                    <span className={`text-sm ${i === CURRENT_STAGE ? 'font-semibold text-accent' : i < CURRENT_STAGE ? 'font-medium' : 'text-ink-3'}`}>
                      {s}
                      {i === CURRENT_STAGE && <span className="sr-only"> (tahap saat ini)</span>}
                    </span>
                  </li>
                ))}
              </ol>
              <dl className="grid sm:grid-cols-3 mt-16 border-t border-line">
                {TRACKS.map((x, i) => (
                  <div key={x.k} className={`py-6 sm:px-6 ${i > 0 ? 'border-t sm:border-t-0 sm:border-l border-line' : 'sm:pl-0'}`}>
                    <dt className="font-serif text-2xl">{x.k}</dt>
                    <dd className="text-sm text-ink-2 mt-2 leading-relaxed max-w-[34ch]">{x.v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        {/* What parents see */}
        <section id="orang-tua" className="max-w-6xl mx-auto px-4 sm:px-8 py-24 sm:py-32 scroll-mt-20">
          <Reveal className="text-center">
            <h2 className="font-serif text-4xl sm:text-6xl font-medium leading-[1.05]">
              Yang dilihat
              <br />
              orang tua
            </h2>
          </Reveal>
          <div className="grid lg:grid-cols-2 gap-5 mt-14">
            <Reveal className="rounded-[28px] bg-surface p-7 sm:p-9">
              <h3 className="font-serif text-2xl">Laporan perjalanan</h3>
              <div className="flex items-baseline justify-between mt-6">
                <p className="text-sm text-ink-2">
                  Tahap <span className="font-semibold text-ink">Hafalan Juz 30</span>
                </p>
                <p className="font-serif text-4xl">
                  84<span className="text-base text-ink-3">%</span>
                </p>
              </div>
              <div className="mt-4">
                <Progress value={7.6} max={9} />
              </div>
              <p className="text-[15px] text-ink-2 leading-relaxed mt-8 pt-6 border-t border-line">
                Sejak awal tahun: <span className="font-serif text-2xl text-ink">42</span> sesi belajar,{' '}
                <span className="font-serif text-2xl text-ink">12</span> surah dilalui, dan{' '}
                <span className="font-serif text-2xl text-ink">5</span> kali murajaah dinyatakan lanjut.
              </p>
            </Reveal>

            <Reveal delay={120} className="rounded-[28px] bg-accent text-paper p-7 sm:p-9 flex flex-col">
              <h3 className="font-serif text-2xl">Minggu ini</h3>
              <ol className="grid grid-cols-4 gap-2 text-center mt-6">
                {[
                  { d: 'Sen', n: true },
                  { d: 'Sel', n: true },
                  { d: 'Rab', n: false },
                  { d: 'Kam', n: true },
                ].map((x) => (
                  <li key={x.d} className="flex flex-col items-center gap-2 py-4 rounded-full bg-paper/10">
                    <span className="text-xs text-paper/70">{x.d}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${x.n ? 'bg-gold' : 'bg-transparent'}`} />
                  </li>
                ))}
              </ol>
              <p className="text-sm text-paper/75 mt-4">3 dari 4 hari sekolah · 4 minggu berturut-turut</p>
              <div className="mt-auto pt-10">
                <p className="text-xs uppercase tracking-[0.14em] text-paper/60">Pencapaian terakhir</p>
                <p className="font-serif text-2xl leading-snug mt-2">Selesai membaca Juz 30 dengan lancar, lalu mulai menghafal.</p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Roles */}
        <section id="peran" className="max-w-6xl mx-auto px-4 sm:px-8 pb-24 sm:pb-32 scroll-mt-20">
          <Reveal className="text-center">
            <h2 className="font-serif text-4xl sm:text-6xl font-medium leading-[1.05]">Satu catatan, tiga peran</h2>
          </Reveal>
          <Reveal className="mt-14">
            <ol className="grid md:grid-cols-3 border-t border-line">
              {ROLES.map(({ icon: Icon, role, title, body }, i) => (
                <li key={role} className={`py-8 md:px-8 ${i > 0 ? 'border-t md:border-t-0 md:border-l border-line' : 'md:pl-0'}`}>
                  <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-accent">
                    <Icon size={16} strokeWidth={1.75} aria-hidden /> {role}
                  </p>
                  <h3 className="font-serif text-2xl mt-3">{title}</h3>
                  <p className="text-sm text-ink-2 leading-relaxed mt-3 max-w-[38ch]">{body}</p>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        {/* Closing banner */}
        <section className="max-w-6xl mx-auto px-4 sm:px-8">
          <Reveal className="relative overflow-hidden rounded-[32px] bg-accent text-paper px-7 py-16 sm:px-16 sm:py-20 text-center">
            <p dir="rtl" lang="ar" className="font-arabic text-3xl sm:text-5xl leading-[1.8] text-paper/90">
              خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ
            </p>
            <p className="text-sm text-paper/75 mt-4 max-w-md mx-auto">
              &ldquo;Sebaik-baik kalian adalah yang belajar Al-Qur&apos;an dan mengajarkannya.&rdquo; (HR. Bukhari)
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 h-12 px-6 mt-9 rounded-full bg-paper text-ink text-[15px] font-medium hover:bg-surface transition-colors"
            >
              Masuk ke akun <ArrowUpRight size={16} />
            </Link>
            <p className="text-sm text-paper/75 mt-5 max-w-sm mx-auto">
              Belum punya akun atau lupa kata sandi? Hubungi wali kelas atau admin sekolah.
            </p>
          </Reveal>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-ink-3">
        <div className="flex items-center gap-2">
          <span className="font-arabic text-2xl leading-none text-accent" aria-hidden>ب</span>
          <span className="font-serif text-lg text-ink">Al Bayyinah School</span>
        </div>
        <ul className="flex flex-wrap justify-center gap-x-6">
          {NAV.map((n) => (
            <li key={n.href}>
              <a href={n.href} className="inline-flex items-center min-h-11 hover:text-ink transition-colors">{n.label}</a>
            </li>
          ))}
          <li>
            <Link href="/login" className="inline-flex items-center min-h-11 hover:text-ink transition-colors">Masuk</Link>
          </li>
        </ul>
        <p>© {new Date().getFullYear()} Sistem Progres Tahsin</p>
      </footer>
    </div>
  )
}
