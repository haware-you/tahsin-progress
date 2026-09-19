import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from '@react-pdf/renderer'
import path from 'path'
import React from 'react'

Font.register({
  family: 'Amiri',
  src: path.join(process.cwd(), 'public/fonts/amiri-regular.ttf'),
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
    color: '#1c1917',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#15803d',
  },
  schoolName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
  },
  schoolSub: {
    fontSize: 9,
    color: '#78716c',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 32,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 8,
    color: '#78716c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#57534e',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e7e5e4',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f4',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#d6d3d1',
    marginBottom: 2,
  },
  colDate: { width: '14%', fontSize: 9 },
  colType: { width: '12%', fontSize: 9 },
  colPos: { width: '26%', fontSize: 9 },
  colNotes: { width: '48%', fontSize: 9 },
  colAssDate: { width: '18%', fontSize: 9 },
  colSurah: { width: '28%', fontSize: 9 },
  colOutcome: { width: '14%', fontSize: 9 },
  colReason: { width: '40%', fontSize: 9 },
  headerText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: '#78716c',
  },
  noData: {
    fontSize: 9,
    color: '#a8a29e',
    fontStyle: 'italic',
    paddingVertical: 6,
  },
  arabic: {
    fontFamily: 'Amiri',
    fontSize: 11,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e7e5e4',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    color: '#a8a29e',
  },
  badgeGreen: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  badgeAmber: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
})

const JUZ_LABEL: Record<string, string> = {
  tadarus: 'Tadarus Juz 30',
  juz30: 'Juz 30',
  juz29: 'Juz 29',
}

type ProgressLog = {
  log_date: string
  type: string
  iqro_level: number | null
  iqro_page: number | null
  juz_page: number | null
  notes: string | null
}

type Assessment = {
  assessed_at: string
  outcome: string
  reason: string
  juz_type: string
  juz_page: number | null
}

function positionLabel(log: ProgressLog): string {
  if (log.type === 'iqro') return `Iqro ${log.iqro_level}, Hal. ${log.iqro_page}`
  const label = JUZ_LABEL[log.type] ?? log.type
  return `${label} Hal. ${log.juz_page ?? '—'}`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function PdfDocument({
  studentName,
  className,
  yearLabel,
  teacherName,
  logs,
  assessments,
  generatedAt,
}: {
  studentName: string
  className: string
  yearLabel: string
  teacherName: string
  logs: ProgressLog[]
  assessments: Assessment[]
  generatedAt: string
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>Al Bayyinah School</Text>
          <Text style={styles.schoolSub}>Laporan Progres Tahsin Al-Quran</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Nama Siswa</Text>
              <Text style={styles.metaValue}>{studentName}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Kelas</Text>
              <Text style={styles.metaValue}>{className}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Tahun Ajaran</Text>
              <Text style={styles.metaValue}>{yearLabel}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Ustadz/Ustadzah</Text>
              <Text style={styles.metaValue}>{teacherName}</Text>
            </View>
          </View>
        </View>

        {/* Progress logs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Riwayat Progres ({logs.length} catatan)</Text>
          {logs.length === 0 ? (
            <Text style={styles.noData}>Belum ada catatan progres.</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.colDate, styles.headerText]}>Tanggal</Text>
                <Text style={[styles.colType, styles.headerText]}>Track</Text>
                <Text style={[styles.colPos, styles.headerText]}>Posisi</Text>
                <Text style={[styles.colNotes, styles.headerText]}>Catatan</Text>
              </View>
              {logs.map((log, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.colDate}>{formatDate(log.log_date)}</Text>
                  <Text style={styles.colType}>{log.type === 'iqro' ? 'Iqro' : (JUZ_LABEL[log.type] ?? log.type)}</Text>
                  <Text style={styles.colPos}>{positionLabel(log)}</Text>
                  <Text style={styles.colNotes}>{log.notes ?? '—'}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Assessments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Riwayat Evaluasi Murajaah ({assessments.length} catatan)
          </Text>
          {assessments.length === 0 ? (
            <Text style={styles.noData}>Belum ada evaluasi murajaah.</Text>
          ) : (
            <>
              <View style={styles.tableHeader}>
                <Text style={[styles.colAssDate, styles.headerText]}>Tanggal</Text>
                <Text style={[styles.colSurah, styles.headerText]}>Posisi</Text>
                <Text style={[styles.colOutcome, styles.headerText]}>Hasil</Text>
                <Text style={[styles.colReason, styles.headerText]}>Catatan</Text>
              </View>
              {assessments.map((a, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={styles.colAssDate}>{formatDate(a.assessed_at)}</Text>
                  <Text style={styles.colSurah}>
                    {(JUZ_LABEL[a.juz_type] ?? a.juz_type) + ` Hal. ${a.juz_page ?? '—'}`}
                  </Text>
                  <View style={styles.colOutcome}>
                    <Text style={a.outcome === 'lanjut' ? styles.badgeGreen : styles.badgeAmber}>
                      {a.outcome === 'lanjut' ? 'Lanjut' : 'Ulang'}
                    </Text>
                  </View>
                  <Text style={styles.colReason}>{a.reason}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Dicetak: {generatedAt}</Text>
          <Text style={styles.footerText}>Al Bayyinah School — Sistem Progres Tahsin</Text>
        </View>
      </Page>
    </Document>
  )
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = req.nextUrl
  const studentId = searchParams.get('student_id')
  const yearId = searchParams.get('year_id')

  if (!studentId) return new Response('student_id diperlukan', { status: 400 })

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) return new Response('Unauthorized', { status: 401 })

  // Resolve year
  let resolvedYearId = yearId
  if (!resolvedYearId) {
    const { data: activeYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_active', true)
      .single()
    resolvedYearId = activeYear?.id ?? null
  }
  if (!resolvedYearId) return new Response('Tidak ada tahun ajaran aktif', { status: 400 })

  // Student info
  const { data: student } = await supabase
    .from('students')
    .select('id, name, user_id')
    .eq('id', studentId)
    .single()

  if (!student) return new Response('Siswa tidak ditemukan', { status: 404 })

  // Access control: student/parent can only export their own record
  if (profile.role === 'student_parent' && student.user_id !== user.id) {
    return new Response('Forbidden', { status: 403 })
  }

  // Enrollment → class + teacher
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('class_id, classes(name, teachers(name))')
    .eq('student_id', studentId)
    .eq('academic_year_id', resolvedYearId)
    .single()

  const classRaw = enrollment?.classes as unknown
  const classInfo = (Array.isArray(classRaw) ? classRaw[0] : classRaw) as
    | { name: string; teachers: { name: string } | { name: string }[] | null }
    | null

  const className = classInfo?.name ?? '—'
  const teacherRaw = classInfo?.teachers
  const teacherName = (
    (Array.isArray(teacherRaw) ? teacherRaw[0] : teacherRaw) as { name: string } | null
  )?.name ?? '—'

  // Academic year label
  const { data: year } = await supabase
    .from('academic_years')
    .select('label')
    .eq('id', resolvedYearId)
    .single()

  // Progress logs
  const { data: logsData } = await supabase
    .from('progress_logs')
    .select('log_date, type, iqro_level, iqro_page, juz_page, notes')
    .eq('student_id', studentId)
    .eq('academic_year_id', resolvedYearId)
    .order('log_date', { ascending: false })
    .order('created_at', { ascending: false })

  // Assessments
  const { data: assessmentsData } = await supabase
    .from('assessments')
    .select('assessed_at, outcome, reason, juz_type, juz_page')
    .eq('student_id', studentId)
    .eq('academic_year_id', resolvedYearId)
    .order('assessed_at', { ascending: false })

  const logs = (logsData ?? []) as unknown as ProgressLog[]
  const assessments = (assessmentsData ?? []) as unknown as Assessment[]

  const generatedAt = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const pdfBuffer = await renderToBuffer(
    <PdfDocument
      studentName={student.name}
      className={className}
      yearLabel={year?.label ?? '—'}
      teacherName={teacherName}
      logs={logs}
      assessments={assessments}
      generatedAt={generatedAt}
    />
  )

  const safeName = student.name.replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '-')

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="laporan-${safeName}.pdf"`,
    },
  })
}
