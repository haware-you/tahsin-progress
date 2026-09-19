'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type RolloverResult =
  | { ok: true; classes: number; students: number }
  | { ok: false; error: string }

export async function createYear(
  _prevState: string | null,
  formData: FormData
): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'Sesi tidak valid.'

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return 'Akses ditolak.'

  const label = (formData.get('label') as string).trim()
  if (!label) return 'Label tahun ajaran wajib diisi.'
  if (!/^\d{4}\/\d{4}$/.test(label)) return 'Format: TTTT/TTTT (contoh: 2025/2026)'

  const { error } = await supabase.from('academic_years').insert({ label })
  if (error) {
    if (error.code === '23505') return 'Tahun ajaran sudah ada.'
    return 'Gagal membuat tahun ajaran.'
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
  if (!user) return 'Sesi tidak valid.'

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return 'Akses ditolak.'

  const yearId = formData.get('year_id') as string
  if (!yearId) return 'ID tahun ajaran tidak valid.'

  // Deactivate current active year first (unique partial index requires this)
  await supabase.from('academic_years').update({ is_active: false }).eq('is_active', true)

  const { error } = await supabase
    .from('academic_years')
    .update({ is_active: true })
    .eq('id', yearId)

  if (error) return 'Gagal mengaktifkan tahun ajaran.'

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
  if (!user) return { ok: false, error: 'Sesi tidak valid.' }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { ok: false, error: 'Akses ditolak.' }

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

  revalidatePath('/admin/years')
  revalidatePath('/guru')
  return { ok: true, classes: rolledClasses, students: rolledStudents }
}
