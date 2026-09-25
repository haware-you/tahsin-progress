'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type RolloverResult =
  | { ok: true; classes: number; students: number; openings: number }
  | { ok: false; error: string }

export async function createYear(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Sesi Anda sudah berakhir. Silakan masuk kembali.'

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return 'Hanya admin yang dapat mengatur tahun ajaran.'

  const label = (formData.get('label') as string).trim()
  if (!label) return 'Isi nama tahun ajaran, misalnya 2025/2026.'
  if (!/^\d{4}\/\d{4}$/.test(label)) return 'Tulis tahun ajaran dengan format 2025/2026.'

  const { error } = await supabase.from('academic_years').insert({ label })
  if (error) {
    if (error.code === '23505') return 'Tahun ajaran ini sudah dibuat sebelumnya.'
    return 'Tahun ajaran belum tersimpan. Coba lagi.'
  }

  revalidatePath('/admin/years')
  return null
}

export async function activateYear(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Sesi Anda sudah berakhir. Silakan masuk kembali.'

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return 'Hanya admin yang dapat mengatur tahun ajaran.'

  const yearId = formData.get('year_id') as string
  if (!yearId) return 'Tahun ajaran tidak ditemukan. Muat ulang halaman lalu coba lagi.'

  // Deactivate current active year first (unique partial index requires this)
  await supabase.from('academic_years').update({ is_active: false }).eq('is_active', true)

  const { error } = await supabase
    .from('academic_years')
    .update({ is_active: true })
    .eq('id', yearId)

  if (error) return 'Tahun ajaran belum aktif. Coba lagi.'

  revalidatePath('/admin/years')
  revalidatePath('/guru')
  return null
}

export async function rolloverEnrollments(
  _prevState: RolloverResult | null,
  formData: FormData
): Promise<RolloverResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sesi Anda sudah berakhir. Silakan masuk kembali.' }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { ok: false, error: 'Hanya admin yang dapat mengatur tahun ajaran.' }

  const fromYearId = formData.get('from_year_id') as string
  const toYearId = formData.get('to_year_id') as string

  if (!fromYearId || !toYearId) return { ok: false, error: 'Pilih tahun sumber dan tujuan.' }
  if (fromYearId === toYearId) return { ok: false, error: 'Tahun sumber dan tujuan tidak boleh sama.' }

  const { data: sourceClasses } = await supabase
    .from('classes')
    .select('id, name, teacher_id')
    .eq('academic_year_id', fromYearId)

  if (!sourceClasses?.length) return { ok: false, error: 'Tidak ada kelas di tahun sumber.' }

  let rolledClasses = 0
  let rolledStudents = 0

  for (const cls of sourceClasses) {
    let newClassId: string | null = null

    const { data: existing } = await supabase
      .from('classes')
      .select('id')
      .eq('name', cls.name)
      .eq('academic_year_id', toYearId)
      .single()

    if (existing) {
      newClassId = existing.id
    } else {
      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert({ name: cls.name, teacher_id: cls.teacher_id, academic_year_id: toYearId })
        .select('id')
        .single()
      if (classError || !newClass) continue
      newClassId = newClass.id
      rolledClasses++
    }

    if (!newClassId) continue

    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('student_id')
      .eq('class_id', cls.id)
      .eq('academic_year_id', fromYearId)

    if (!enrollments?.length) continue

    for (const { student_id } of enrollments) {
      const { error: enrollError } = await supabase
        .from('enrollments')
        .insert({ student_id, class_id: newClassId, academic_year_id: toYearId })
      if (!enrollError) rolledStudents++
    }
  }

  // Opening positions: each student's last entry from the source year, copied
  // in the database (see carry_forward_positions) so no row limit applies.
  // Safe to re-run: students who already have an entry are skipped.
  const { data: openings, error: carryError } = await supabase.rpc('carry_forward_positions', {
    p_from_year: fromYearId,
    p_to_year: toYearId,
  })
  if (carryError)
    return {
      ok: false,
      error: 'Siswa sudah dipindahkan, tetapi posisi awal belum terbawa. Jalankan rollover sekali lagi.',
    }

  revalidatePath('/admin/years')
  revalidatePath('/guru')
  return { ok: true, classes: rolledClasses, students: rolledStudents, openings: openings ?? 0 }
}
