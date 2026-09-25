import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requestTime } from '@/lib/time'
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

  const inactiveCutoff = new Date(requestTime() - INACTIVE_DAYS * 24 * 60 * 60 * 1000)

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
        surah_number: number | null
        ayat: number | null
        outcome: 'lanjut' | 'ulang'
        is_opening_position: boolean
        log_date: string | null
      }

      let logs: LogRow[] = []

      if (studentIds.length) {
        const { data } = await supabase
          .from('progress_logs')
          .select('student_id, type, iqro_level, iqro_page, juz_page, surah_number, ayat, outcome, log_date, is_opening_position')
          .in('student_id', studentIds)
          .eq('academic_year_id', selectedYear?.id ?? '')
          .order('log_date', { ascending: false })
          .order('created_at', { ascending: false })

        logs = (data ?? []) as unknown as LogRow[]
        logs.forEach((l) => {
          // Opening positions carried from last year are not sessions.
          if (l.log_date && !l.is_opening_position) weekCounts[l.log_date] = (weekCounts[l.log_date] ?? 0) + 1
        })
      }

      const latestByStudent = new Map<string, LogRow>()
      logs.forEach((log) => {
        if (!latestByStudent.has(log.student_id)) latestByStudent.set(log.student_id, log)
      })
      const lastSessionByStudent = new Map<string, string>()
      logs.forEach((log) => {
        if (!log.is_opening_position && log.log_date && !lastSessionByStudent.has(log.student_id))
          lastSessionByStudent.set(log.student_id, log.log_date)
      })

      const students: StudentWithProgress[] = (enrollments ?? [])
        .map((e) => {
          const raw = e.students as unknown
          const s = (Array.isArray(raw) ? raw[0] : raw) as { id: string; name: string } | null
          const log = latestByStudent.get(e.student_id as string) ?? null
          const lastSession = lastSessionByStudent.get(e.student_id as string)
          const isInactive = !lastSession || new Date(lastSession) < inactiveCutoff

          return {
            id: s?.id ?? (e.student_id as string),
            name: s?.name ?? '—',
            isInactive,
            needsRepeat: log?.outcome === 'ulang',
            latestProgress: log
              ? {
                  type: log.type as 'iqro' | 'tadarus' | 'juz30' | 'juz29',
                  iqro_level: log.iqro_level,
                  iqro_page: log.iqro_page,
                  juz_page: log.juz_page,
                  surah_number: log.surah_number,
                  ayat: log.ayat,
                  isOpening: log.is_opening_position,
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
      now={requestTime()}
      allYears={allYears ?? []}
      selectedYear={selectedYear}
      isReadonly={isReadonly}
      classesWithStudents={classesWithStudents}
      weekCounts={weekCounts}
    />
  )
}
