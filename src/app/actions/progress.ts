'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { JUZ_RANGE } from '@/lib/quran'

// Badges are awarded by the `award_badges_after_progress_log` trigger in
// supabase/migrations/20260920000001_badge_award_trigger.sql — not from here.
// RLS blocks teacher writes to student_badges, so awarding must run as definer.

export async function logProgress(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return 'Sesi Anda sudah berakhir. Silakan masuk kembali.'

  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!teacher) return 'Akun ini belum terdaftar sebagai guru. Hubungi admin sekolah.'

  const { data: activeYear } = await supabase
    .from('academic_years')
    .select('id')
    .eq('is_active', true)
    .single()
  if (!activeYear) return 'Belum ada tahun ajaran aktif. Minta admin mengaktifkannya terlebih dahulu.'

  const type = formData.get('type') as string
  const studentId = formData.get('student_id') as string

  if (!studentId) return 'Siswa tidak ditemukan. Muat ulang halaman lalu coba lagi.'

  if (type === 'iqro') {
    const iqroLevel = parseInt(formData.get('iqro_level') as string)
    const iqroPage = parseInt(formData.get('iqro_page') as string)
    const notes = (formData.get('notes') as string).trim() || null

    if (!iqroLevel || !iqroPage || isNaN(iqroLevel) || isNaN(iqroPage))
      return 'Level dan halaman Iqro wajib diisi.'
    if (iqroLevel < 1 || iqroLevel > 6) return 'Pilih level Iqro 1 sampai 6.'
    if (iqroPage < 1) return 'Nomor halaman minimal 1.'

    const { error } = await supabase.from('progress_logs').insert({
      student_id: studentId,
      teacher_id: teacher.id,
      academic_year_id: activeYear.id,
      type: 'iqro',
      iqro_level: iqroLevel,
      iqro_page: iqroPage,
      notes,
    })

    if (error) return 'Catatan belum tersimpan. Periksa koneksi internet lalu coba lagi.'


  } else if (type === 'tadarus' || type === 'juz30' || type === 'juz29') {
    const juzPage = parseInt(formData.get('juz_page') as string)
    const notes = (formData.get('notes') as string).trim() || null
    const range = JUZ_RANGE[type]

    if (!juzPage || isNaN(juzPage)) return 'Nomor halaman wajib diisi.'
    if (juzPage < range.min || juzPage > range.max)
      return `Halaman ${range.label} harus antara ${range.min}–${range.max}.`

    const { error: progressError } = await supabase.from('progress_logs').insert({
      student_id: studentId,
      teacher_id: teacher.id,
      academic_year_id: activeYear.id,
      type,
      juz_page: juzPage,
      notes,
    })

    if (progressError) return 'Catatan belum tersimpan. Periksa koneksi internet lalu coba lagi.'

    // Murajaah assessment (optional, hafalan only)
    const murajaah = type !== 'tadarus' && formData.get('murajaah') === 'true'
    if (murajaah) {
      const outcome = formData.get('murajaah_outcome') as string
      const reason = (formData.get('murajaah_reason') as string).trim()

      if (outcome !== 'lanjut' && outcome !== 'ulang')
        return 'Pilih hasil murajaah: Lanjut atau Ulang.'
      if (outcome === 'ulang' && !reason)
        return 'Tuliskan alasan singkat mengapa murajaah perlu diulang.'

      const { error: assessmentError } = await supabase.from('assessments').insert({
        student_id: studentId,
        teacher_id: teacher.id,
        academic_year_id: activeYear.id,
        juz_type: type,
        juz_page: juzPage,
        outcome,
        reason: reason || '-',
      })

      if (assessmentError) return 'Progres sudah tersimpan, tetapi hasil murajaah belum. Simpan ulang hasil murajaahnya.'
    }


  } else {
    return 'Jenis catatan tidak dikenal. Muat ulang halaman lalu coba lagi.'
  }

  revalidatePath('/guru')
  return null
}
