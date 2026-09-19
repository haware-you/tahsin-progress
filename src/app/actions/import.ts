'use server'

import { createClient } from '@/lib/supabase/server'

type ProgressType = 'iqro' | 'juz30' | 'juz29'

export type CsvRow = {
  nama_siswa: string
  kelas: string
  email_akun: string
  track: string
  iqro_level: string
  iqro_halaman: string
  juz_halaman: string
}

export type ParsedRow = {
  rowNum: number
  nama_siswa: string
  kelas: string
  email_akun: string
  track: ProgressType
  iqro_level: number | null
  iqro_halaman: number | null
  juz_halaman: number | null
  errors: string[]
}

export type ImportPreview = {
  rows: ParsedRow[]
  validCount: number
  errorCount: number
}

export type ImportResult =
  | { ok: true; created: number; matched: number }
  | { ok: false; error: string }

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []

  const header = lines[0]
    .split(',')
    .map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'))

  return lines.slice(1).map((line) => {
    const cols = line.split(',').map((c) => c.trim())
    return {
      nama_siswa: cols[header.indexOf('nama_siswa')] ?? '',
      kelas: cols[header.indexOf('kelas')] ?? '',
      email_akun: cols[header.indexOf('email_akun')] ?? '',
      track: cols[header.indexOf('track')] ?? '',
      iqro_level: cols[header.indexOf('iqro_level')] ?? '',
      iqro_halaman: cols[header.indexOf('iqro_halaman')] ?? '',
      juz_halaman: cols[header.indexOf('juz_halaman')] ?? '',
    }
  })
}

function validateRows(rawRows: CsvRow[]): ParsedRow[] {
  return rawRows.map((r, i) => {
    const errors: string[] = []
    const rowNum = i + 2

    if (!r.nama_siswa) errors.push('Nama siswa kosong')
    if (!r.kelas) errors.push('Kelas kosong')
    if (!r.email_akun) errors.push('Email kosong')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email_akun)) errors.push('Format email tidak valid')

    const track = r.track?.toLowerCase() as ProgressType
    if (track !== 'iqro' && track !== 'juz30' && track !== 'juz29')
      errors.push('Track harus "iqro", "juz30", atau "juz29"')

    let iqroLevel: number | null = null
    let iqroHalaman: number | null = null
    let juzHalaman: number | null = null

    if (track === 'iqro') {
      iqroLevel = parseInt(r.iqro_level)
      iqroHalaman = parseInt(r.iqro_halaman)
      if (isNaN(iqroLevel) || iqroLevel < 1 || iqroLevel > 6)
        errors.push('iqro_level harus angka 1–6')
      if (isNaN(iqroHalaman) || iqroHalaman < 1)
        errors.push('iqro_halaman harus angka positif')
    } else if (track === 'juz30') {
      juzHalaman = parseInt(r.juz_halaman)
      if (isNaN(juzHalaman) || juzHalaman < 582 || juzHalaman > 604)
        errors.push('juz_halaman untuk Juz 30 harus antara 582–604')
    } else if (track === 'juz29') {
      juzHalaman = parseInt(r.juz_halaman)
      if (isNaN(juzHalaman) || juzHalaman < 562 || juzHalaman > 582)
        errors.push('juz_halaman untuk Juz 29 harus antara 562–582')
    }

    return {
      rowNum,
      nama_siswa: r.nama_siswa,
      kelas: r.kelas,
      email_akun: r.email_akun,
      track: (['iqro', 'juz30', 'juz29'].includes(track) ? track : 'iqro') as ProgressType,
      iqro_level: isNaN(iqroLevel ?? NaN) ? null : iqroLevel,
      iqro_halaman: isNaN(iqroHalaman ?? NaN) ? null : iqroHalaman,
      juz_halaman: isNaN(juzHalaman ?? NaN) ? null : juzHalaman,
      errors,
    }
  })
}

export async function previewCsvImport(
  _prev: ImportPreview | null,
  formData: FormData
): Promise<ImportPreview> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { rows: [], validCount: 0, errorCount: 0 }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { rows: [], validCount: 0, errorCount: 0 }

  const file = formData.get('csv_file') as File | null
  if (!file || file.size === 0) return { rows: [], validCount: 0, errorCount: 0 }

  const text = await file.text()
  const rawRows = parseCsv(text)
  const parsed = validateRows(rawRows)

  const emailCounts = new Map<string, number>()
  parsed.forEach((r) => {
    if (r.email_akun) emailCounts.set(r.email_akun, (emailCounts.get(r.email_akun) ?? 0) + 1)
  })
  parsed.forEach((r) => {
    if (r.email_akun && (emailCounts.get(r.email_akun) ?? 0) > 1) {
      if (!r.errors.includes('Email duplikat dalam file')) r.errors.push('Email duplikat dalam file')
    }
  })

  const validCount = parsed.filter((r) => r.errors.length === 0).length
  const errorCount = parsed.filter((r) => r.errors.length > 0).length

  return { rows: parsed, validCount, errorCount }
}

export async function commitCsvImport(
  _prev: ImportResult | null,
  formData: FormData
): Promise<ImportResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sesi tidak valid.' }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return { ok: false, error: 'Akses ditolak.' }

  const previewJson = formData.get('preview_json') as string | null
  if (!previewJson) return { ok: false, error: 'Data pratinjau tidak ditemukan.' }

  const { data: activeYear } = await supabase
    .from('academic_years')
    .select('id')
    .eq('is_active', true)
    .single()
  if (!activeYear) return { ok: false, error: 'Tidak ada tahun ajaran aktif.' }

  let valid: ParsedRow[]
  try {
    valid = JSON.parse(previewJson) as ParsedRow[]
  } catch {
    return { ok: false, error: 'Format data tidak valid.' }
  }

  if (valid.length === 0) return { ok: false, error: 'Tidak ada baris valid untuk diimpor.' }

  let created = 0
  let matched = 0

  for (const row of valid) {
    const { data: existingClass } = await supabase
      .from('classes')
      .select('id, teacher_id')
      .eq('name', row.kelas)
      .eq('academic_year_id', activeYear.id)
      .single()

    if (!existingClass) continue

    const { data: existingAuthUsers } = await supabase
      .from('users')
      .select('id')
      .eq('email', row.email_akun)

    if (!existingAuthUsers || existingAuthUsers.length === 0) continue

    const userId = existingAuthUsers[0].id
    matched++

    let studentId: string | null = null
    const { data: existingStudent } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingStudent) {
      studentId = existingStudent.id
    } else {
      const { data: newStudent, error: studentError } = await supabase
        .from('students')
        .insert({ user_id: userId, name: row.nama_siswa })
        .select('id')
        .single()
      if (studentError || !newStudent) continue
      studentId = newStudent.id
      created++
    }

    await supabase
      .from('enrollments')
      .upsert(
        { student_id: studentId, class_id: existingClass.id, academic_year_id: activeYear.id },
        { onConflict: 'student_id,academic_year_id' }
      )

    // Insert opening progress log
    if (row.track === 'iqro' && row.iqro_level && row.iqro_halaman) {
      await supabase.from('progress_logs').insert({
        student_id: studentId,
        teacher_id: existingClass.teacher_id,
        academic_year_id: activeYear.id,
        type: 'iqro',
        iqro_level: row.iqro_level,
        iqro_page: row.iqro_halaman,
        is_opening_position: true,
      })
    } else if ((row.track === 'juz30' || row.track === 'juz29') && row.juz_halaman) {
      await supabase.from('progress_logs').insert({
        student_id: studentId,
        teacher_id: existingClass.teacher_id,
        academic_year_id: activeYear.id,
        type: row.track,
        juz_page: row.juz_halaman,
        is_opening_position: true,
      })
    }
  }

  return { ok: true, created, matched }
}
