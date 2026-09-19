'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { computeStreak } from '@/lib/streak'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type ProgressType = 'iqro' | 'tadarus' | 'juz30' | 'juz29'

const JUZ_PAGE_RANGE: Record<string, { min: number; max: number }> = {
  tadarus: { min: 582, max: 604 },
  juz30: { min: 582, max: 604 },
  juz29: { min: 562, max: 582 },
}

async function awardBadge(
  supabase: SupabaseClient,
  studentId: string,
  yearId: string,
  triggerType: string,
  triggerValue: string
): Promise<void> {
  const { data: badge } = await supabase
    .from('badges')
    .select('id')
    .eq('trigger_type', triggerType)
    .eq('trigger_value', triggerValue)
    .single()
  if (!badge) return
  await supabase
    .from('student_badges')
    .upsert(
      { student_id: studentId, badge_id: badge.id, academic_year_id: yearId },
      { onConflict: 'student_id,badge_id,academic_year_id' }
    )
}

async function tryAwardBadges(
  supabase: SupabaseClient,
  studentId: string,
  yearId: string,
  logType: ProgressType,
  iqroLevel: number | null,
  juzPage: number | null
): Promise<void> {
  // First log this year
  const { count } = await supabase
    .from('progress_logs')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('academic_year_id', yearId)
  if (count === 1) await awardBadge(supabase, studentId, yearId, 'first_log', '1')

  // Iqro book 6 milestone
  if (logType === 'iqro' && iqroLevel === 6) {
    await awardBadge(supabase, studentId, yearId, 'iqro_level', '6')
  }

  // Juz completion milestones
  if ((logType === 'tadarus' || logType === 'juz30' || logType === 'juz29') && juzPage !== null) {
    const range = JUZ_PAGE_RANGE[logType]
    if (juzPage >= range.max) {
      await awardBadge(supabase, studentId, yearId, 'juz_complete', logType)
    }
  }

  // Weekly streak (4 consecutive weeks)
  const { data: logs } = await supabase
    .from('progress_logs')
    .select('log_date')
    .eq('student_id', studentId)
    .eq('academic_year_id', yearId)
    .not('log_date', 'is', null)
  if (logs?.length) {
    const streak = computeStreak(logs.map(l => l.log_date as string))
    if (streak >= 4) await awardBadge(supabase, studentId, yearId, 'weekly_streak', '4')
  }
}

export async function logProgress(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 'Sesi tidak valid. Silakan login kembali.'

  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!teacher) return 'Akun guru tidak ditemukan.'

  const { data: activeYear } = await supabase
    .from('academic_years')
    .select('id')
    .eq('is_active', true)
    .single()
  if (!activeYear) return 'Tidak ada tahun ajaran aktif.'

  const type = formData.get('type') as string
  const studentId = formData.get('student_id') as string

  if (!studentId) return 'Data siswa tidak valid.'

  if (type === 'iqro') {
    const iqroLevel = parseInt(formData.get('iqro_level') as string)
    const iqroPage = parseInt(formData.get('iqro_page') as string)
    const notes = (formData.get('notes') as string).trim() || null

    if (!iqroLevel || !iqroPage || isNaN(iqroLevel) || isNaN(iqroPage))
      return 'Level dan halaman Iqro wajib diisi.'
    if (iqroLevel < 1 || iqroLevel > 6) return 'Level Iqro harus antara 1–6.'
    if (iqroPage < 1) return 'Halaman harus lebih dari 0.'

    const { error } = await supabase.from('progress_logs').insert({
      student_id: studentId,
      teacher_id: teacher.id,
      academic_year_id: activeYear.id,
      type: 'iqro',
      iqro_level: iqroLevel,
      iqro_page: iqroPage,
      notes,
    })

    if (error) return 'Gagal menyimpan catatan. Coba lagi.'

    try {
      await tryAwardBadges(supabase, studentId, activeYear.id, 'iqro', iqroLevel, null)
    } catch {}

  } else if (type === 'tadarus' || type === 'juz30' || type === 'juz29') {
    const juzPage = parseInt(formData.get('juz_page') as string)
    const notes = (formData.get('notes') as string).trim() || null
    const range = JUZ_PAGE_RANGE[type]

    if (!juzPage || isNaN(juzPage)) return 'Nomor halaman wajib diisi.'
    if (juzPage < range.min || juzPage > range.max)
      return `Halaman ${type === 'juz29' ? 'Juz 29' : 'Juz 30'} harus antara ${range.min}–${range.max}.`

    const { error: progressError } = await supabase.from('progress_logs').insert({
      student_id: studentId,
      teacher_id: teacher.id,
      academic_year_id: activeYear.id,
      type,
      juz_page: juzPage,
      notes,
    })

    if (progressError) return 'Gagal menyimpan catatan. Coba lagi.'

    // Murajaah assessment (optional, hafalan only)
    const murajaah = type !== 'tadarus' && formData.get('murajaah') === 'true'
    if (murajaah) {
      const outcome = formData.get('murajaah_outcome') as string
      const reason = (formData.get('murajaah_reason') as string).trim()

      if (outcome !== 'lanjut' && outcome !== 'ulang')
        return 'Hasil murajaah wajib dipilih.'
      if (outcome === 'ulang' && !reason)
        return 'Catatan wajib diisi jika hasil murajaah adalah Ulang.'

      const { error: assessmentError } = await supabase.from('assessments').insert({
        student_id: studentId,
        teacher_id: teacher.id,
        academic_year_id: activeYear.id,
        juz_type: type,
        juz_page: juzPage,
        outcome,
        reason: reason || '-',
      })

      if (assessmentError) return 'Progres tersimpan, tapi gagal menyimpan murajaah. Coba lagi.'
    }

    try {
      await tryAwardBadges(supabase, studentId, activeYear.id, type, null, juzPage)
    } catch {}

  } else {
    return 'Tipe progres tidak valid.'
  }

  revalidatePath('/guru')
  return null
}
