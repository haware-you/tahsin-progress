import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import StudentRoster, { type StudentWithProgress } from './StudentRoster'

const INACTIVE_DAYS = 28

export default async function GuruPage({
  searchParams,
}: {
  searchParams: Promise<{ year_id?: string }>
}) {
  const { year_id } = await searchParams
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

  const isAdmin = profile?.role === 'admin'
  if (profile?.role !== 'teacher' && !isAdmin) redirect('/dashboard')

  const { data: teacher } = isAdmin
    ? { data: null }
    : await supabase
        .from('teachers')
        .select('id, name')
        .eq('user_id', user.id)
        .single()

  const { data: allYears } = await supabase
    .from('academic_years')
    .select('id, label, is_active')
    .order('created_at', { ascending: false })

  const activeYear = allYears?.find((y) => y.is_active)
  const selectedYear = year_id
    ? (allYears?.find((y) => y.id === year_id) ?? activeYear)
    : activeYear

  const isReadonly = selectedYear?.id !== activeYear?.id

  const classesQuery = supabase
    .from('classes')
    .select('id, name')
    .eq('academic_year_id', selectedYear?.id ?? '')
    .order('name')

  if (!isAdmin) classesQuery.eq('teacher_id', teacher?.id ?? '')

  const { data: classes } = await classesQuery

  const inactiveCutoff = new Date(Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000)

  type ClassWithStudents = { id: string; name: string; students: StudentWithProgress[] }

  const classesWithStudents: ClassWithStudents[] = await Promise.all(
    (classes ?? []).map(async (cls) => {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id, students(id, name)')
        .eq('class_id', cls.id)
        .eq('academic_year_id', selectedYear?.id ?? '')

      const studentIds = (enrollments ?? []).map((e) => e.student_id as string)

      type LogRow = {
        student_id: string
        type: string
        iqro_level: number | null
        iqro_page: number | null
        juz_page: number | null
        log_date: string | null
      }

      let logs: LogRow[] = []
      let assessedStudentIds = new Set<string>()

      if (studentIds.length) {
        const [logsResult, assessmentsResult] = await Promise.all([
          supabase
            .from('progress_logs')
            .select('student_id, type, iqro_level, iqro_page, juz_page, log_date')
            .in('student_id', studentIds)
            .eq('academic_year_id', selectedYear?.id ?? '')
            .order('log_date', { ascending: false })
            .order('created_at', { ascending: false }),
          supabase
            .from('assessments')
            .select('student_id')
            .in('student_id', studentIds)
            .eq('academic_year_id', selectedYear?.id ?? ''),
        ])

        logs = (logsResult.data ?? []) as unknown as LogRow[]
        assessedStudentIds = new Set(
          (assessmentsResult.data ?? []).map((a) => a.student_id as string)
        )
      }

      const latestByStudent = new Map<string, LogRow>()
      logs.forEach((log) => {
        if (!latestByStudent.has(log.student_id)) latestByStudent.set(log.student_id, log)
      })

      const students: StudentWithProgress[] = (enrollments ?? [])
        .map((e) => {
          const raw = e.students as unknown
          const s = (Array.isArray(raw) ? raw[0] : raw) as { id: string; name: string } | null
          const log = latestByStudent.get(e.student_id as string) ?? null
          const isInactive = !log?.log_date || new Date(log.log_date) < inactiveCutoff
          const hasAssessment = assessedStudentIds.has(e.student_id as string)

          return {
            id: s?.id ?? (e.student_id as string),
            name: s?.name ?? '—',
            isInactive,
            hasAssessment,
            latestProgress: log
              ? {
                  type: log.type as 'iqro' | 'juz30' | 'juz29',
                  iqro_level: log.iqro_level,
                  iqro_page: log.iqro_page,
                  juz_page: log.juz_page,
                  log_date: log.log_date,
                }
              : null,
          }
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'id'))

      return { id: cls.id, name: cls.name, students }
    })
  )

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="px-4 py-4 max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">
                {isAdmin ? 'Admin' : 'Ustadz/Ustadzah'}
              </p>
              <h1 className="text-base font-bold text-stone-900">
                {isAdmin ? 'Semua Kelas' : (teacher?.name ?? user.email)}
              </h1>
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

          {(allYears ?? []).length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {(allYears ?? []).map((year) => (
                <a
                  key={year.id}
                  href={year.is_active ? '/guru' : `/guru?year_id=${year.id}`}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedYear?.id === year.id
                      ? 'bg-green-700 text-white'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {year.label}
                  {year.is_active && <span className="ml-1 opacity-70">· Aktif</span>}
                </a>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {isReadonly && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-700">
            Arsip tahun ajaran {selectedYear?.label} — hanya baca.
          </div>
        )}

        {classesWithStudents.length > 0 ? (
          classesWithStudents.map((cls) => (
            <section key={cls.id}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-stone-900">{cls.name}</h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  {cls.students.length} siswa
                </span>
              </div>
              <StudentRoster students={cls.students} isReadonly={isReadonly} isAdmin={isAdmin} />
            </section>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-stone-100 p-6 text-center">
            <p className="text-stone-500 text-sm">
              Belum ada kelas yang ditetapkan untuk tahun ajaran ini.
            </p>
            <p className="text-stone-400 text-xs mt-1">
              Hubungi admin untuk pengaturan kelas.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
