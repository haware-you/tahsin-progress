import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowUpRight, Upload, UserCog, CalendarDays } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { SectionTitle, WeekStrip, Chip } from '@/components/ui'

const INACTIVE_DAYS = 28
const ACTIVE_DAYS = 7

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: activeYear } = await supabase
    .from('academic_years')
    .select('id, label')
    .eq('is_active', true)
    .single()

  // No active year — show setup prompt
  if (!activeYear) {
    return (
      <AppShell role="admin" userName="Admin" userMeta="Al Bayyinah" aside={null}>
        <h1 className="font-serif text-[40px] sm:text-5xl font-medium leading-[1.05] text-ink">
          Assalamu&apos;alaikum,
          <br />
          Admin
        </h1>
        <p className="text-[15px] text-ink-2 mt-5">Belum ada tahun ajaran aktif. Buat satu untuk mulai.</p>
        <a
          href="/admin/years"
          className="inline-flex items-center gap-1.5 h-10 px-5 mt-7 rounded-full bg-ink text-paper text-sm font-medium"
        >
          Buat Tahun Ajaran <ArrowUpRight size={15} />
        </a>
      </AppShell>
    )
  }

  const cutoffDate = new Date(Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  const [classesResult, enrollmentsResult, recentLogsResult, trackLogsResult] = await Promise.all([
    supabase
      .from('classes')
      .select('id, name, teacher_id, teachers(name)')
      .eq('academic_year_id', activeYear.id)
      .order('name'),
    supabase
      .from('enrollments')
      .select('student_id, class_id')
      .eq('academic_year_id', activeYear.id),
    supabase
      .from('progress_logs')
      .select('student_id, log_date')
      .eq('academic_year_id', activeYear.id)
      .gte('log_date', cutoffDate)
      .order('log_date', { ascending: false }),
    supabase
      .from('progress_logs')
      .select('student_id, type, log_date')
      .eq('academic_year_id', activeYear.id)
      .order('log_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1000),
  ])

  const classes = classesResult.data ?? []
  const enrollments = enrollmentsResult.data ?? []
  const recentLogs = recentLogsResult.data ?? []
  const trackLogs = trackLogsResult.data ?? []

  const weekCutoff = new Date(Date.now() - ACTIVE_DAYS * 24 * 60 * 60 * 1000)

  // Latest log within the 28-day window per student
  const latestLogByStudent = new Map<string, string>()
  recentLogs.forEach((log) => {
    const sid = log.student_id as string
    if (!latestLogByStudent.has(sid)) latestLogByStudent.set(sid, log.log_date as string)
  })

  // Global KPIs
  const allStudentIds = [...new Set(enrollments.map((e) => e.student_id as string))]
  const totalStudents = allStudentIds.length
  const activeThisWeek = allStudentIds.filter((id) => {
    const d = latestLogByStudent.get(id)
    return d && new Date(d) >= weekCutoff
  }).length
  const inactiveTotal = allStudentIds.filter((id) => !latestLogByStudent.has(id)).length
  const totalClasses = classes.length
  const totalTeachers = new Set(classes.map((c) => c.teacher_id)).size

  // Track breakdown — deduplicate to latest log per student
  const latestTypeByStudent = new Map<string, string>()
  trackLogs.forEach((log) => {
    const sid = log.student_id as string
    if (!latestTypeByStudent.has(sid)) latestTypeByStudent.set(sid, log.type as string)
  })
  const iqroCount = allStudentIds.filter((id) => latestTypeByStudent.get(id) === 'iqro').length
  const quranCount = allStudentIds.filter((id) => {
    const t = latestTypeByStudent.get(id)
    return t === 'juz30' || t === 'juz29'
  }).length
  const notStartedCount = allStudentIds.filter((id) => !latestTypeByStudent.has(id)).length

  // Per-class stats
  type ClassStat = {
    id: string
    name: string
    teacher: string
    studentCount: number
    inactiveCount: number
    lastActivity: string | null
  }

  const classStats: ClassStat[] = classes.map((cls) => {
    const studentIds = enrollments
      .filter((e) => e.class_id === cls.id)
      .map((e) => e.student_id as string)

    const inactiveCount = studentIds.filter((id) => !latestLogByStudent.has(id)).length

    const lastActivity =
      studentIds
        .map((id) => latestLogByStudent.get(id) ?? null)
        .filter((d): d is string => d !== null)
        .sort()
        .at(-1) ?? null

    const raw = cls.teachers as unknown
    const teacher =
      ((Array.isArray(raw) ? raw[0] : raw) as { name?: string } | null)?.name ?? '—'

    return { id: cls.id, name: cls.name, teacher, studentCount: studentIds.length, inactiveCount, lastActivity }
  })

  const weekCounts: Record<string, number> = {}
  recentLogs.forEach((l) => {
    const d = l.log_date as string
    weekCounts[d] = (weekCounts[d] ?? 0) + 1
  })

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
