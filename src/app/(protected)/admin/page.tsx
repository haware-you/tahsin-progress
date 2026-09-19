import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'

const INACTIVE_DAYS = 28
const ACTIVE_DAYS = 7

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function KPICard({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: 'green' | 'amber' | 'sky'
}) {
  const color = accent === 'green'
    ? 'text-green-700'
    : accent === 'amber'
    ? 'text-amber-600'
    : accent === 'sky'
    ? 'text-sky-700'
    : 'text-stone-800'

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-stone-400 mt-0.5 leading-tight">{label}</p>
    </div>
  )
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
      <div className="min-h-screen bg-stone-50">
        <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto">
            <div>
              <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">Admin</p>
              <h1 className="text-base font-bold text-stone-900">Al Bayyinah</h1>
            </div>
            <form action={logout}>
              <button type="submit" className="text-sm text-stone-500 hover:text-red-600 transition-colors min-h-[44px] px-2">
                Keluar
              </button>
            </form>
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-10 text-center space-y-4">
          <p className="text-stone-500 text-sm">Belum ada tahun ajaran aktif.</p>
          <a href="/admin/years" className="inline-block bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-2xl">
            Buat Tahun Ajaran
          </a>
        </main>
      </div>
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

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto">
          <div>
            <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">Admin</p>
            <h1 className="text-base font-bold text-stone-900">Al Bayyinah</h1>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-stone-500 hover:text-red-600 transition-colors min-h-[44px] px-2"
            >
              Keluar
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Active year chip */}
        <div>
          <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
            Tahun Aktif: {activeYear.label}
          </span>
        </div>

        {/* KPIs */}
        <section className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <KPICard label="Total Siswa" value={totalStudents} accent="green" />
            <KPICard label="Aktif Minggu Ini" value={activeThisWeek} accent="sky" />
            <KPICard label="Tidak Aktif" value={inactiveTotal} accent={inactiveTotal > 0 ? 'amber' : undefined} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <KPICard label="Total Kelas" value={totalClasses} />
            <KPICard label="Total Guru" value={totalTeachers} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <KPICard label="Iqro" value={iqroCount} />
            <KPICard label="Al-Quran" value={quranCount} accent="green" />
            <KPICard label="Belum Mulai" value={notStartedCount} accent={notStartedCount > 0 ? 'amber' : undefined} />
          </div>
        </section>

        {/* Class summary */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-stone-900 text-sm">Ringkasan Kelas</h2>
            <a href="/guru" className="text-xs text-green-700 font-medium">
              Lihat semua →
            </a>
          </div>

          {classStats.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-100 p-5 text-center">
              <p className="text-stone-400 text-sm">Belum ada kelas untuk tahun ajaran ini.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {classStats.map((cls) => (
                <a
                  key={cls.id}
                  href="/guru"
                  className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center justify-between active:bg-stone-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-stone-900 text-sm">{cls.name}</p>
                      {cls.inactiveCount > 0 && (
                        <span className="shrink-0 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                          {cls.inactiveCount} tidak aktif
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-400">
                      <span>{cls.teacher}</span>
                      <span className="text-stone-200">·</span>
                      <span>{cls.studentCount} siswa</span>
                      {cls.lastActivity && (
                        <>
                          <span className="text-stone-200">·</span>
                          <span>{formatDate(cls.lastActivity)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className="text-stone-300 text-lg ml-3 shrink-0">›</span>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Settings / quick actions */}
        <section>
          <h2 className="font-semibold text-stone-900 text-sm mb-3">Pengaturan</h2>
          <div className="space-y-2">
            {[
              { label: 'Import CSV Siswa', desc: 'Unggah daftar siswa baru', href: '/admin/import' },
              { label: 'Manajemen Pengguna', desc: 'Kelola akun guru & siswa', href: '/admin/users' },
              { label: 'Tahun Ajaran', desc: 'Buat & atur tahun ajaran', href: '/admin/years' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center justify-between active:bg-stone-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-stone-900 text-sm">{item.label}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{item.desc}</p>
                </div>
                <span className="text-stone-400 text-lg">›</span>
              </a>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
