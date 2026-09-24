'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient, SERVICE_KEY_MISSING } from '@/lib/supabase/admin'
import { requireAdmin, generatePassword } from '@/lib/auth'
import { JUZ_RANGE } from '@/lib/quran'

type ProgressType = 'iqro' | 'tadarus' | 'juz30' | 'juz29'

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

/** A login the import just provisioned. Shown to the admin once, never stored. */
export type NewCredential = {
  nama_siswa: string
  email: string
  password: string
}

export type SkippedRow = {
  rowNum: number
  nama_siswa: string
  reason: string
}

export type ImportResult =
  | {
      ok: true
      created: number
      matched: number
      accountsCreated: number
      credentials: NewCredential[]
      skipped: SkippedRow[]
    }
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
    if (track !== 'iqro' && track !== 'tadarus' && track !== 'juz30' && track !== 'juz29')
      errors.push('Track harus "iqro", "tadarus", "juz30", atau "juz29"')

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
    } else if (track === 'tadarus' || track === 'juz30') {
      juzHalaman = parseInt(r.juz_halaman)
      const r30 = JUZ_RANGE[track]
      if (isNaN(juzHalaman) || juzHalaman < r30.min || juzHalaman > r30.max)
        errors.push(`juz_halaman untuk Tadarus/Juz 30 harus antara ${r30.min}–${r30.max}`)
    } else if (track === 'juz29') {
      juzHalaman = parseInt(r.juz_halaman)
      const r29 = JUZ_RANGE.juz29
      if (isNaN(juzHalaman) || juzHalaman < r29.min || juzHalaman > r29.max)
        errors.push(`juz_halaman untuk Juz 29 harus antara ${r29.min}–${r29.max}`)
    }

    return {
      rowNum,
      nama_siswa: r.nama_siswa,
      kelas: r.kelas,
      email_akun: r.email_akun,
      track: (['iqro', 'tadarus', 'juz30', 'juz29'].includes(track) ? track : 'iqro') as ProgressType,
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
  const admin = await requireAdmin()
  if (!admin.ok) return { rows: [], validCount: 0, errorCount: 0 }

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
  const guard = await requireAdmin()
  if (!guard.ok) return { ok: false, error: guard.error }

  const supabase = await createClient()

  // Needed to create logins for families that don't have one yet. Reached only
  // after the admin check above.
  const adminDb = createAdminClient()

  const previewJson = formData.get('preview_json') as string | null
  if (!previewJson) return { ok: false, error: 'Pratinjau sudah tidak tersedia. Unggah ulang file lalu coba lagi.' }

  const { data: activeYear } = await supabase
    .from('academic_years')
    .select('id')
    .eq('is_active', true)
    .single()
  if (!activeYear) return { ok: false, error: 'Belum ada tahun ajaran aktif. Aktifkan tahun ajaran dulu sebelum mengimpor.' }

  let valid: ParsedRow[]
  try {
    valid = JSON.parse(previewJson) as ParsedRow[]
  } catch {
    return { ok: false, error: 'Data impor tidak terbaca. Unggah ulang file lalu coba lagi.' }
  }

  if (valid.length === 0) return { ok: false, error: 'Tidak ada baris yang bisa diimpor. Perbaiki baris yang ditandai merah di pratinjau.' }

  let created = 0
  let matched = 0
  let accountsCreated = 0
  const credentials: NewCredential[] = []
  const skipped: SkippedRow[] = []

  const skip = (row: ParsedRow, reason: string) =>
    skipped.push({ rowNum: row.rowNum, nama_siswa: row.nama_siswa, reason })

  for (const row of valid) {
    const { data: existingClass } = await supabase
      .from('classes')
      .select('id, teacher_id')
      .eq('name', row.kelas)
      .eq('academic_year_id', activeYear.id)
      .single()

    if (!existingClass) {
      skip(row, `Kelas "${row.kelas}" belum ada di tahun ajaran aktif`)
      continue
    }

    const { data: existingAuthUsers } = await supabase
      .from('users')
      .select('id')
      .eq('email', row.email_akun)

    let userId = existingAuthUsers?.[0]?.id ?? null

    if (userId) {
      matched++
    } else {
      // No login yet — provision one. `handle_new_user` (a trigger on
      // auth.users) creates the matching public.users row with the
      // student_parent role, so only the auth user is created here.
      if (!adminDb) {
        skip(row, `Belum punya akun login dan tidak bisa dibuatkan: ${SERVICE_KEY_MISSING}`)
        continue
      }

      const password = generatePassword()
      const { data: newUser, error: createError } = await adminDb.auth.admin.createUser({
        email: row.email_akun,
        password,
        email_confirm: true,
      })

      if (createError || !newUser?.user) {
        skip(row, `Akun login gagal dibuat: ${createError?.message ?? 'penyebab tidak diketahui'}`)
        continue
      }

      userId = newUser.user.id
      accountsCreated++
      credentials.push({ nama_siswa: row.nama_siswa, email: row.email_akun, password })
    }

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
      if (studentError || !newStudent) {
        skip(row, `Data siswa gagal disimpan: ${studentError?.message ?? 'penyebab tidak diketahui'}`)
        continue
      }
      studentId = newStudent.id
      created++
    }

    const { error: enrollError } = await supabase
      .from('enrollments')
      .upsert(
        { student_id: studentId, class_id: existingClass.id, academic_year_id: activeYear.id },
        { onConflict: 'student_id,academic_year_id' }
      )
    if (enrollError) {
      skip(row, `Pendaftaran ke kelas gagal: ${enrollError.message}`)
      continue
    }

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
    } else if ((row.track === 'tadarus' || row.track === 'juz30' || row.track === 'juz29') && row.juz_halaman) {
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

  return { ok: true, created, matched, accountsCreated, credentials, skipped }
}
