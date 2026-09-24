'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { JUZ_RANGE, IQRO_PAGES, surahByNumber, surahsForTrack } from '@/lib/quran'

// Badges are awarded by the `award_badges_after_progress_log` trigger in
// supabase/migrations/20260920000001_badge_award_trigger.sql (Khatam Juz rule
// updated in 20260925000001_surah_ayat_outcome.sql) — not from here.
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
  const outcome = formData.get('outcome') as string
  const notes = ((formData.get('notes') as string | null) ?? '').trim() || null

  if (!studentId) return 'Siswa tidak ditemukan. Muat ulang halaman lalu coba lagi.'
  if (outcome !== 'lanjut' && outcome !== 'ulang') return 'Pilih L (Lanjut) atau U (Ulang).'

  const base = {
    student_id: studentId,
    teacher_id: teacher.id,
    academic_year_id: activeYear.id,
    outcome,
    notes,
  }

  if (type === 'iqro') {
    const iqroLevel = parseInt(formData.get('iqro_level') as string)
    const iqroPage = parseInt(formData.get('iqro_page') as string)

    if (isNaN(iqroLevel) || isNaN(iqroPage)) return 'Level dan halaman Iqro wajib diisi.'
    if (iqroLevel < 1 || iqroLevel > 6) return 'Pilih level Iqro 1 sampai 6.'
    const maxPage = IQRO_PAGES[iqroLevel - 1]
    if (iqroPage < 1 || iqroPage > maxPage) return `Halaman Iqro ${iqroLevel} antara 1–${maxPage}.`

    const { error } = await supabase
      .from('progress_logs')
      .insert({ ...base, type: 'iqro', iqro_level: iqroLevel, iqro_page: iqroPage })
    if (error) return 'Catatan belum tersimpan. Periksa koneksi internet lalu coba lagi.'
  } else if (type === 'tadarus' || type === 'juz30' || type === 'juz29') {
    const surah = surahByNumber(parseInt(formData.get('surah_number') as string))
    const ayat = parseInt(formData.get('ayat') as string)

    if (!surah || !surahsForTrack(type).includes(surah))
      return `Pilih surah dari ${JUZ_RANGE[type].label}.`
    if (isNaN(ayat) || ayat < 1 || ayat > surah.ayat)
      return `Ayat ${surah.latin} antara 1–${surah.ayat}.`

    // juz_page keeps the surah's starting page for older readers; the exact
    // position is surah_number + ayat.
    const { error } = await supabase.from('progress_logs').insert({
      ...base,
      type,
      surah_number: surah.number,
      ayat,
      juz_page: surah.page,
    })
    if (error) return 'Catatan belum tersimpan. Periksa koneksi internet lalu coba lagi.'
  } else {
    return 'Jenis catatan tidak dikenal. Muat ulang halaman lalu coba lagi.'
  }

  revalidatePath('/guru')
  return null
}
