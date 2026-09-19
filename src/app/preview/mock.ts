// Mock data for /preview routes. Dates are relative to today.
export function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export const siswaLogs = [
  { id: '1', log_date: daysAgo(0), type: 'juz30' as const, iqro_level: null, iqro_page: null, juz_page: 594, notes: 'Bacaan surah Al-Balad sudah lancar, mad thabi\'i perlu dijaga.', is_opening_position: false },
  { id: '2', log_date: daysAgo(2), type: 'juz30' as const, iqro_level: null, iqro_page: null, juz_page: 593, notes: 'Al-Fajr ayat 1–15 lancar. Latihan di rumah ayat 16–30.', is_opening_position: false },
  { id: '3', log_date: daysAgo(4), type: 'juz30' as const, iqro_level: null, iqro_page: null, juz_page: 592, notes: null, is_opening_position: false },
  { id: '4', log_date: daysAgo(8), type: 'juz30' as const, iqro_level: null, iqro_page: null, juz_page: 591, notes: 'Makharijul huruf ع dan ح masih tertukar.', is_opening_position: false },
  { id: '5', log_date: daysAgo(15), type: 'juz30' as const, iqro_level: null, iqro_page: null, juz_page: 590, notes: null, is_opening_position: false },
  { id: '6', log_date: daysAgo(22), type: 'juz30' as const, iqro_level: null, iqro_page: null, juz_page: 589, notes: null, is_opening_position: false },
]

export const siswaAssessments = [
  { id: 'a1', juz_type: 'juz30' as const, juz_page: 590, outcome: 'lanjut' as const, reason: 'Hafalan Al-Buruj kuat.', assessed_at: daysAgo(9) },
  { id: 'a2', juz_type: 'juz30' as const, juz_page: 587, outcome: 'ulang' as const, reason: 'Al-Infitar ayat 10–19 belum lancar.', assessed_at: daysAgo(20) },
]

const names = ['Ahmad Fauzi', 'Aisyah Putri', 'Bilal Ramadhan', 'Fatimah Zahra', 'Hasan Basri', 'Khadijah Nur', 'Muhammad Rizki', 'Salman Alfarisi', 'Zainab Husna', 'Umar Hakim']

export const guruClasses = [
  {
    id: 'c1',
    name: 'Kelas A',
    students: names.map((name, i) => {
      const inactive = i === 3 || i === 7
      const iqro = i % 3 === 0
      const tadarus = i === 4 || i === 8
      return {
        id: 's' + i,
        name,
        isInactive: inactive,
        hasAssessment: i % 4 === 1,
        latestProgress: {
          type: (iqro ? 'iqro' : tadarus ? 'tadarus' : 'juz30') as 'iqro' | 'tadarus' | 'juz30',
          iqro_level: iqro ? (i % 6) + 1 : null,
          iqro_page: iqro ? 12 + i : null,
          juz_page: iqro ? null : 585 + i,
          log_date: daysAgo(inactive ? 35 + i : i % 5),
        },
      }
    }),
  },
]

export function weekCountsFrom(dates: string[]) {
  const c: Record<string, number> = {}
  dates.forEach((d) => (c[d] = (c[d] ?? 0) + 1))
  return c
}

export const badges = [
  { id: 'b1', name: 'Langkah Pertama', description: 'Catatan pertama di tahun ajaran ini', trigger_type: 'first_log', trigger_value: '1' },
  { id: 'b2', name: 'Khatam Iqro', description: 'Menyelesaikan Iqro Jilid 6', trigger_type: 'iqro_level', trigger_value: '6' },
  { id: 'b6', name: 'Khatam Tadarus', description: 'Selesai membaca Juz 30 dengan lancar (halaman 604)', trigger_type: 'juz_complete', trigger_value: 'tadarus' },
  { id: 'b3', name: 'Khatam Juz 30', description: 'Menyelesaikan hafalan Juz 30 (halaman 604)', trigger_type: 'juz_complete', trigger_value: 'juz30' },
  { id: 'b4', name: 'Khatam Juz 29', description: 'Menyelesaikan hafalan Juz 29', trigger_type: 'juz_complete', trigger_value: 'juz29' },
  { id: 'b5', name: '4 Minggu Konsisten', description: 'Mencatat kemajuan selama 4 minggu berturut', trigger_type: 'weekly_streak', trigger_value: '4' },
]

export const earnedBadges = [
  { badge_id: 'b1', awarded_at: daysAgo(120) },
  { badge_id: 'b2', awarded_at: daysAgo(90) },
  { badge_id: 'b6', awarded_at: daysAgo(30) },
]
