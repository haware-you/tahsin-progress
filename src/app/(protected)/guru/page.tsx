import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArrowUpRight } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { SectionTitle, WeekStrip, Timeline, Chip, relativeDay, type TimelineItem } from '@/components/ui'
import { firstName } from '@/lib/format'
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

  // Aggregate for hero + side panel
  const allStudents = classesWithStudents.flatMap((c) => c.students)
  const weekAgo = Date.now() - 7 * 86400000
  const loggedThisWeek = allStudents.filter(
    (s) => s.latestProgress?.log_date && new Date(s.latestProgress.log_date).getTime() >= weekAgo
  ).length
  const inactive = allStudents.filter((s) => s.isInactive)
  const displayName = isAdmin ? 'Admin' : (teacher?.name ?? user.email ?? 'Ustadz')

  const attention: TimelineItem[] = inactive.slice(0, 6).map((s) => ({
    id: s.id,
    name: s.name,
    note: s.latestProgress?.log_date
      ? `Terakhir dicatat ${relativeDay(s.latestProgress.log_date).toLowerCase()}.`
      : 'Belum pernah dicatat tahun ini.',
    tag: 'Tidak aktif 28+ hari',
    tone: 'warn',
    when: '',
  }))

  const aside = (
    <div className="space-y-12">
      <section>
        <SectionTitle>Minggu Ini</SectionTitle>
        <WeekStrip counts={weekCounts} caption={`${loggedThisWeek} dari ${allStudents.length} siswa dicatat 7 hari terakhir`} />
      </section>
      <section>
        <SectionTitle>Perlu Perhatian</SectionTitle>
        <Timeline items={attention} empty="Semua siswa aktif. Alhamdulillah." />
        {inactive.length > attention.length && (
          <p className="text-xs text-ink-3 mt-5">+{inactive.length - attention.length} siswa lainnya</p>
        )}
      </section>
    </div>
  )

  return (
    <AppShell
      role={isAdmin ? 'admin' : 'teacher'}
      userName={displayName}
      userMeta={isAdmin ? 'Semua kelas' : 'Ustadz/Ustadzah'}
      aside={aside}
    >
      <section>
        <h1 className="font-serif text-[40px] sm:text-5xl xl:text-[56px] font-medium leading-[1.05] text-ink">
          Assalamu&apos;alaikum,
          <br />
          {isAdmin ? 'Semua Kelas' : firstName(displayName)}
        </h1>
        <p className="text-[15px] text-ink-2 leading-relaxed mt-5 max-w-lg">
          {allStudents.length === 0
            ? 'Belum ada siswa di kelas Anda untuk tahun ajaran ini.'
            : `${allStudents.length} siswa di ${classesWithStudents.length} kelas. ${loggedThisWeek} sudah dicatat minggu ini${
                inactive.length ? `, ${inactive.length} belum dicatat lebih dari 4 minggu.` : '.'
              }`}
        </p>
        {!isReadonly && allStudents.length > 0 && (
          <a
            href="#kelas"
            className="inline-flex items-center gap-1.5 h-10 px-5 mt-7 rounded-full bg-ink text-paper text-sm font-medium"
          >
            Mulai mencatat <ArrowUpRight size={15} />
          </a>
        )}

        {(allYears ?? []).length > 1 && (
          <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
            {(allYears ?? []).map((year) => (
              <a
                key={year.id}
                href={year.is_active ? '/guru' : `/guru?year_id=${year.id}`}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedYear?.id === year.id ? 'bg-accent-soft text-accent' : 'text-ink-3 hover:bg-surface'
                }`}
              >
                {year.label}
                {year.is_active && <span className="ml-1 opacity-70">· Aktif</span>}
              </a>
            ))}
          </div>
        )}
      </section>

      {isReadonly && (
        <div className="mt-8 bg-warn-soft rounded-2xl px-5 py-3 text-sm text-warn">
          Arsip tahun ajaran {selectedYear?.label} — hanya baca.
        </div>
      )}

      <div id="kelas" className="mt-14 space-y-14 scroll-mt-6">
        {classesWithStudents.length > 0 ? (
          classesWithStudents.map((cls) => (
            <section key={cls.id}>
              <SectionTitle action={<Chip tone="muted">{cls.students.length} siswa</Chip>}>{cls.name}</SectionTitle>
              <StudentRoster students={cls.students} isReadonly={isReadonly} isAdmin={isAdmin} />
            </section>
          ))
        ) : (
          <div className="bg-surface rounded-2xl p-6 text-center">
            <p className="text-ink-2 text-sm">Belum ada kelas yang ditetapkan untuk tahun ajaran ini.</p>
            <p className="text-ink-3 text-xs mt-1">Hubungi admin untuk pengaturan kelas.</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
