import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-stone-100">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="font-bold text-stone-900 text-sm">Al Bayyinah</span>
          </div>
          <Link
            href="/login"
            className="text-sm font-semibold text-green-700 hover:text-green-800 transition-colors min-h-[44px] flex items-center px-2"
          >
            Masuk
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-green-800 text-white px-4 pt-14 pb-16 text-center relative overflow-hidden">
        {/* Decorative rings */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-white/10" />
        <div className="absolute -bottom-24 -left-16 w-80 h-80 rounded-full border border-white/10" />

        <div className="max-w-lg mx-auto relative">
          {/* Arabic heading */}
          <p
            className="text-2xl text-amber-300 mb-6 leading-relaxed"
            style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl' }}
          >
            بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ
          </p>

          <h1 className="text-2xl font-bold leading-snug mb-3">
            Sistem Progres Tahsin<br />
            <span className="text-amber-300">Al Bayyinah School</span>
          </h1>
          <p className="text-green-200 text-sm leading-relaxed max-w-xs mx-auto mb-8">
            Platform digital untuk memantau perkembangan belajar Al-Quran — untuk guru, orang tua, dan siswa.
          </p>

          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-green-900 font-bold px-8 py-3.5 rounded-2xl text-sm transition-colors min-h-[44px]"
          >
            Masuk ke Sistem
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-green-900 text-white">
        <div className="max-w-lg mx-auto px-4 py-5 grid grid-cols-3 divide-x divide-green-700">
          {[
            { value: '~350', label: 'Siswa' },
            { value: '15', label: 'Guru' },
            { value: 'Real-time', label: 'Pembaruan' },
          ].map((stat) => (
            <div key={stat.label} className="text-center px-2">
              <p className="text-amber-300 font-bold text-lg leading-none">{stat.value}</p>
              <p className="text-green-300 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="px-4 py-12 max-w-lg mx-auto">
        <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest text-center mb-2">Fitur Utama</p>
        <h2 className="text-xl font-bold text-stone-900 text-center mb-8">Dirancang untuk semua pihak</h2>

        <div className="space-y-4">
          {[
            {
              icon: (
                <svg className="w-6 h-6 text-green-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                </svg>
              ),
              title: 'Untuk Guru',
              desc: 'Catat progres siswa dalam hitungan detik langsung dari HP. Tidak perlu kertas, tidak perlu Excel.',
              tag: 'Iqro & Al-Quran',
              tagColor: 'bg-green-100 text-green-700',
            },
            {
              icon: (
                <svg className="w-6 h-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
              title: 'Untuk Orang Tua',
              desc: 'Pantau perkembangan belajar anak kapan saja, di mana saja — tanpa menunggu laporan bulanan.',
              tag: 'Pantau real-time',
              tagColor: 'bg-amber-100 text-amber-700',
            },
            {
              icon: (
                <svg className="w-6 h-6 text-green-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              ),
              title: 'Untuk Siswa',
              desc: 'Raih lencana dan streak mingguan sebagai penghargaan atas semangat belajar yang konsisten.',
              tag: 'Lencana & Streak',
              tagColor: 'bg-green-100 text-green-700',
            },
          ].map((card) => (
            <div key={card.title} className="bg-white rounded-2xl border border-stone-100 p-5 flex gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-stone-50 flex items-center justify-center shrink-0">
                {card.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-stone-900 text-sm">{card.title}</h3>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${card.tagColor}`}>
                    {card.tag}
                  </span>
                </div>
                <p className="text-stone-500 text-xs leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-stone-50 px-4 py-12">
        <div className="max-w-lg mx-auto">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest text-center mb-2">Cara Kerja</p>
          <h2 className="text-xl font-bold text-stone-900 text-center mb-8">Mudah digunakan setiap hari</h2>

          <div className="space-y-4">
            {[
              {
                step: '01',
                title: 'Guru mencatat progres',
                desc: 'Buka app, ketuk nama siswa, sesuaikan halaman atau ayat, simpan. Maksimal 3 ketukan.',
              },
              {
                step: '02',
                title: 'Orang tua memantau',
                desc: 'Login kapan saja untuk melihat catatan terbaru, lencana yang diraih, dan riwayat murajaah.',
              },
              {
                step: '03',
                title: 'Laporan siap dicetak',
                desc: 'Ekspor laporan PDF per siswa lengkap dengan riwayat progres dan nama guru.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-green-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {item.step}
                </div>
                <div className="pt-1">
                  <p className="font-semibold text-stone-900 text-sm mb-0.5">{item.title}</p>
                  <p className="text-stone-500 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA bottom ── */}
      <section className="bg-green-800 px-4 py-14 text-center">
        <div className="max-w-lg mx-auto">
          <p
            className="text-xl text-amber-300 mb-4"
            style={{ fontFamily: 'var(--font-arabic)', direction: 'rtl' }}
          >
            وَعَلَّمَكَ مَا لَمْ تَكُن تَعْلَمُ
          </p>
          <p className="text-green-200 text-xs mb-8 max-w-xs mx-auto">
            "Dan Dia mengajarkan kepadamu apa yang tidak engkau ketahui." — QS. An-Nisa: 113
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-green-900 font-bold px-8 py-3.5 rounded-2xl text-sm transition-colors min-h-[44px]"
          >
            Mulai Sekarang
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-green-900 px-4 py-6 text-center">
        <p className="text-green-400 text-xs">
          © 2026 Al Bayyinah School · Sistem Progres Tahsin
        </p>
      </footer>

    </div>
  )
}
