import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowUpRight } from 'lucide-react'
import AppShell from '@/components/AppShell'
import AdminView, { type ClassStat } from './AdminView'

const INACTIVE_DAYS = 28
const ACTIVE_DAYS = 7

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
  const tadarusCount = allStudentIds.filter((id) => latestTypeByStudent.get(id) === 'tadarus').length
  const notStartedCount = allStudentIds.filter((id) => !latestTypeByStudent.has(id)).length

  // Per-class stats
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

  return (
    <AdminView
      activeYear={activeYear}
      totalStudents={totalStudents}
      activeThisWeek={activeThisWeek}
      inactiveTotal={inactiveTotal}
      totalClasses={totalClasses}
      totalTeachers={totalTeachers}
      iqroCount={iqroCount}
      quranCount={quranCount}
      tadarusCount={tadarusCount}
      notStartedCount={notStartedCount}
      classStats={classStats}
      weekCounts={weekCounts}
    />
  )
}
