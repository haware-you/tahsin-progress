import { ArrowUpRight, Upload, UserCog, CalendarDays } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { SectionTitle, WeekStrip, Chip } from '@/components/ui'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export type ClassStat = {
  id: string
  name: string
  teacher: string
  studentCount: number
  inactiveCount: number
  lastActivity: string | null
}

export type AdminViewProps = {
  activeYear: { label: string }
  totalStudents: number
  activeThisWeek: number
  inactiveTotal: number
  totalClasses: number
  totalTeachers: number
  iqroCount: number
  quranCount: number
  notStartedCount: number
  classStats: ClassStat[]
  weekCounts: Record<string, number>
}

export default function AdminView({
  activeYear,
  totalStudents,
  activeThisWeek,
  inactiveTotal,
  totalClasses,
  totalTeachers,
  iqroCount,
  quranCount,
  notStartedCount,
  classStats,
  weekCounts,
}: AdminViewProps) {
  const tracks = [
    { label: 'Iqro', value: iqroCount, cls: 'bg-gold' },
    { label: 'Al-Quran', value: quranCount, cls: 'bg-accent' },
    { label: 'Belum mulai', value: notStartedCount, cls: 'bg-line' },
  ]

  const actions = [
    { label: 'Import CSV Siswa', desc: 'Unggah daftar siswa baru', href: '/admin/import', icon: Upload },
    { label: 'Manajemen Pengguna', desc: 'Kelola akun guru & siswa', href: '/admin/users', icon: UserCog },
    { label: 'Tahun Ajaran', desc: 'Buat & atur tahun ajaran', href: '/admin/years', icon: CalendarDays },
  ]

  const aside = (
    <div className="space-y-12">
      <section>
        <SectionTitle>Minggu Ini</SectionTitle>
        <WeekStrip counts={weekCounts} caption={`${activeThisWeek} siswa dicatat 7 hari terakhir`} />
      </section>
      <section>
        <SectionTitle>Pengaturan</SectionTitle>
        <ul className="space-y-2">
          {actions.map(({ label, desc, href, icon: Icon }) => (
            <li key={href}>
              <a href={href} className="flex items-center gap-4 rounded-2xl bg-surface px-5 py-4 hover:bg-paper transition-colors">
                <span className="w-10 h-10 rounded-full bg-accent-soft text-accent flex items-center justify-center shrink-0">
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{label}</span>
                  <span className="block text-xs text-ink-3 mt-0.5">{desc}</span>
                </span>
                <ArrowUpRight size={16} className="text-ink-3 shrink-0" />
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )

  return (
    <AppShell role="admin" userName="Admin" userMeta={`Tahun ${activeYear.label}`} aside={aside}>
      <section>
        <Chip>Tahun Aktif · {activeYear.label}</Chip>
        <h1 className="font-serif text-[40px] sm:text-5xl xl:text-[56px] font-medium leading-[1.05] text-ink mt-5">
          Assalamu&apos;alaikum,
          <br />
          Admin
        </h1>
        <p className="text-[15px] text-ink-2 leading-relaxed mt-5 max-w-lg">
          {totalStudents} siswa belajar bersama {totalTeachers} guru di {totalClasses} kelas.{' '}
          {inactiveTotal > 0
            ? `${inactiveTotal} siswa belum dicatat dalam 4 minggu terakhir.`
            : 'Semua siswa tercatat dalam 4 minggu terakhir.'}
        </p>
        <a
          href="/guru"
          className="inline-flex items-center gap-1.5 h-10 px-5 mt-7 rounded-full bg-ink text-paper text-sm font-medium"
        >
          Lihat semua kelas <ArrowUpRight size={15} />
        </a>
      </section>

      <section className="mt-14 grid grid-cols-3 divide-x divide-line border-y border-line">
        {[
          { v: totalStudents, l: 'siswa' },
          { v: activeThisWeek, l: 'aktif minggu ini' },
          { v: inactiveTotal, l: 'tidak aktif', warn: inactiveTotal > 0 },
        ].map((f) => (
          <div key={f.l} className="py-5 px-3 sm:px-6 text-center sm:text-left">
            <p className={`font-serif text-3xl sm:text-4xl ${f.warn ? 'text-warn' : 'text-ink'}`}>{f.v}</p>
            <p className="text-xs text-ink-3 mt-1">{f.l}</p>
          </div>
        ))}
      </section>

      <section className="mt-14">
        <SectionTitle>Jalur Belajar</SectionTitle>
        <div className="flex h-2 rounded-full overflow-hidden bg-line">
          {tracks.map((t) =>
            t.value > 0 ? (
              <div key={t.label} className={t.cls} style={{ width: `${(t.value / Math.max(totalStudents, 1)) * 100}%` }} />
            ) : null
          )}
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
          {tracks.map((t) => (
            <li key={t.label} className="flex items-center gap-2 text-sm text-ink-2">
              <span className={`w-2.5 h-2.5 rounded-full ${t.cls}`} />
              {t.label} <span className="font-serif text-lg text-ink">{t.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <SectionTitle>Ringkasan Kelas</SectionTitle>
        {classStats.length === 0 ? (
          <p className="text-sm text-ink-3">Belum ada kelas untuk tahun ajaran ini.</p>
        ) : (
          <ul className="space-y-2">
            {classStats.map((cls) => (
              <li key={cls.id}>
                <a href="/guru" className="flex items-center gap-4 rounded-2xl bg-surface px-5 py-4 hover:bg-panel transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-ink text-[15px]">{cls.name}</p>
                      {cls.inactiveCount > 0 && <Chip tone="warn">{cls.inactiveCount} tidak aktif</Chip>}
                    </div>
                    <p className="text-xs text-ink-3 mt-0.5">
                      {cls.teacher} · {cls.studentCount} siswa
                      {cls.lastActivity ? ` · terakhir ${formatDate(cls.lastActivity)}` : ''}
                    </p>
                  </div>
                  <ArrowUpRight size={16} className="text-ink-3 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  )
}
