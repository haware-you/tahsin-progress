import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SiswaView from './SiswaView'

export default async function SiswaPage({
  searchParams,
}: {
  searchParams: Promise<{ student_id?: string }>
}) {
  const { student_id } = await searchParams
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
  if (profile?.role !== 'student_parent' && !isAdmin) redirect('/dashboard')

  let studentQuery = supabase.from('students').select('id, name')
  if (isAdmin && student_id) {
    studentQuery = studentQuery.eq('id', student_id)
  } else {
    studentQuery = studentQuery.eq('user_id', user.id)
  }
  const { data: student } = await studentQuery.single()

  if (isAdmin && !student) redirect('/admin')
  if (!student) redirect('/login')

  const [{ data: progressLogs }, { data: assessments }, { data: activeYear }] =
    await Promise.all([
      supabase
        .from('progress_logs')
        .select('id, log_date, type, iqro_level, iqro_page, juz_page, notes, is_opening_position')
        .eq('student_id', student.id)
        .order('log_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('assessments')
        .select('id, juz_type, juz_page, outcome, reason, assessed_at')
        .eq('student_id', student.id)
        .order('assessed_at', { ascending: false })
        .limit(20),
      supabase.from('academic_years').select('id').eq('is_active', true).maybeSingle(),
    ])

  let className: string | null = null
  let teacherName: string | null = null

  if (activeYear) {
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('classes(name, teachers(name))')
      .eq('student_id', student.id)
      .eq('academic_year_id', activeYear.id)
      .maybeSingle()

    if (enrollment?.classes) {
      const cls = enrollment.classes as unknown as { name: string; teachers: { name: string } | null }
      className = cls.name
      teacherName = cls.teachers?.name ?? null
    }
  }

  return (
    <SiswaView
      studentId={student.id}
      now={Date.now()}
      role={isAdmin ? 'admin' : 'student_parent'}
      studentName={student.name ?? user.email ?? 'Siswa'}
      className={className}
      teacherName={teacherName}
      progressLogs={progressLogs ?? []}
      assessments={assessments ?? []}
    />
  )
}
