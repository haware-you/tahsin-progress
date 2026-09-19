import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { type StudentWithProgress } from './StudentRoster'
import GuruView from './GuruView'

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

  const weekCounts: Record<string, number> = {}

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
        logs.forEach((l) => {
          if (l.log_date) weekCounts[l.log_date] = (weekCounts[l.log_date] ?? 0) + 1
        })
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
    <GuruView
      isAdmin={isAdmin}
      displayName={isAdmin ? 'Admin' : (teacher?.name ?? user.email ?? 'Ustadz')}
      now={Date.now()}
      allYears={allYears ?? []}
      selectedYear={selectedYear}
      isReadonly={isReadonly}
      classesWithStudents={classesWithStudents}
      weekCounts={weekCounts}
    />
  )
}
