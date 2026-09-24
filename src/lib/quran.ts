// Every surah in Juz 29–30 in mushaf order: surah number, ayat count and
// starting page (Madinah mushaf, 604 pages). Several short surahs share a
// page; surahForPage returns the first one on it.
export type Surah = { number: number; ayat: number; page: number; latin: string; arabic: string }

const SURAHS: Surah[] = [
  { number: 67, ayat: 30, page: 562, latin: 'Al-Mulk', arabic: 'الملك' },
  { number: 68, ayat: 52, page: 564, latin: 'Al-Qalam', arabic: 'القلم' },
  { number: 69, ayat: 52, page: 566, latin: 'Al-Haqqah', arabic: 'الحاقة' },
  { number: 70, ayat: 44, page: 568, latin: "Al-Ma'arij", arabic: 'المعارج' },
  { number: 71, ayat: 28, page: 570, latin: 'Nuh', arabic: 'نوح' },
  { number: 72, ayat: 28, page: 572, latin: 'Al-Jinn', arabic: 'الجن' },
  { number: 73, ayat: 20, page: 574, latin: 'Al-Muzzammil', arabic: 'المزمل' },
  { number: 74, ayat: 56, page: 575, latin: 'Al-Muddatstsir', arabic: 'المدثر' },
  { number: 75, ayat: 40, page: 577, latin: 'Al-Qiyamah', arabic: 'القيامة' },
  { number: 76, ayat: 31, page: 578, latin: 'Al-Insan', arabic: 'الإنسان' },
  { number: 77, ayat: 50, page: 580, latin: 'Al-Mursalat', arabic: 'المرسلات' },
  { number: 78, ayat: 40, page: 582, latin: "An-Naba'", arabic: 'النبأ' },
  { number: 79, ayat: 46, page: 583, latin: "An-Nazi'at", arabic: 'النازعات' },
  { number: 80, ayat: 42, page: 585, latin: "'Abasa", arabic: 'عبس' },
  { number: 81, ayat: 29, page: 586, latin: 'At-Takwir', arabic: 'التكوير' },
  { number: 82, ayat: 19, page: 587, latin: 'Al-Infitar', arabic: 'الانفطار' },
  { number: 83, ayat: 36, page: 587, latin: 'Al-Mutaffifin', arabic: 'المطففين' },
  { number: 84, ayat: 25, page: 589, latin: 'Al-Insyiqaq', arabic: 'الانشقاق' },
  { number: 85, ayat: 22, page: 590, latin: 'Al-Buruj', arabic: 'البروج' },
  { number: 86, ayat: 17, page: 591, latin: 'At-Tariq', arabic: 'الطارق' },
  { number: 87, ayat: 19, page: 591, latin: "Al-A'la", arabic: 'الأعلى' },
  { number: 88, ayat: 26, page: 592, latin: "Al-Ghasyiyah", arabic: 'الغاشية' },
  { number: 89, ayat: 30, page: 593, latin: 'Al-Fajr', arabic: 'الفجر' },
  { number: 90, ayat: 20, page: 594, latin: 'Al-Balad', arabic: 'البلد' },
  { number: 91, ayat: 15, page: 595, latin: 'Asy-Syams', arabic: 'الشمس' },
  { number: 92, ayat: 21, page: 595, latin: 'Al-Lail', arabic: 'الليل' },
  { number: 93, ayat: 11, page: 596, latin: 'Ad-Duha', arabic: 'الضحى' },
  { number: 94, ayat: 8, page: 596, latin: 'Al-Insyirah', arabic: 'الشرح' },
  { number: 95, ayat: 8, page: 597, latin: 'At-Tin', arabic: 'التين' },
  { number: 96, ayat: 19, page: 597, latin: "Al-'Alaq", arabic: 'العلق' },
  { number: 97, ayat: 5, page: 598, latin: 'Al-Qadr', arabic: 'القدر' },
  { number: 98, ayat: 8, page: 598, latin: 'Al-Bayyinah', arabic: 'البينة' },
  { number: 99, ayat: 8, page: 599, latin: 'Az-Zalzalah', arabic: 'الزلزلة' },
  { number: 100, ayat: 11, page: 599, latin: "Al-'Adiyat", arabic: 'العاديات' },
  { number: 101, ayat: 11, page: 600, latin: "Al-Qari'ah", arabic: 'القارعة' },
  { number: 102, ayat: 8, page: 600, latin: 'At-Takatsur', arabic: 'التكاثر' },
  { number: 103, ayat: 3, page: 601, latin: "Al-'Asr", arabic: 'العصر' },
  { number: 104, ayat: 9, page: 601, latin: 'Al-Humazah', arabic: 'الهمزة' },
  { number: 105, ayat: 5, page: 601, latin: 'Al-Fil', arabic: 'الفيل' },
  { number: 106, ayat: 4, page: 602, latin: 'Quraisy', arabic: 'قريش' },
  { number: 107, ayat: 7, page: 602, latin: "Al-Ma'un", arabic: 'الماعون' },
  { number: 108, ayat: 3, page: 602, latin: 'Al-Kautsar', arabic: 'الكوثر' },
  { number: 109, ayat: 6, page: 603, latin: 'Al-Kafirun', arabic: 'الكافرون' },
  { number: 110, ayat: 3, page: 603, latin: 'An-Nasr', arabic: 'النصر' },
  { number: 111, ayat: 5, page: 603, latin: 'Al-Lahab', arabic: 'المسد' },
  { number: 112, ayat: 4, page: 604, latin: 'Al-Ikhlas', arabic: 'الإخلاص' },
  { number: 113, ayat: 5, page: 604, latin: 'Al-Falaq', arabic: 'الفلق' },
  { number: 114, ayat: 6, page: 604, latin: 'An-Nas', arabic: 'الناس' },
]

export function surahForPage(page: number | null | undefined) {
  if (!page) return null
  // First surah starting on this page, else the last one starting before it.
  return SURAHS.find((s) => s.page === page) ?? SURAHS.filter((s) => s.page < page).at(-1) ?? null
}

/** Surahs that start on or after `fromPage` and end before `page` (i.e. fully passed). */
export function surahsBetween(fromPage: number, page: number) {
  return SURAHS.filter((s, i) => {
    const next = SURAHS[i + 1]
    return s.page >= fromPage && next && next.page <= page
  }).length
}

export const JUZ_RANGE = {
  tadarus: { min: 582, max: 604, label: 'Tadarus Juz 30' },
  juz30: { min: 582, max: 604, label: 'Hafalan Juz 30' },
  juz29: { min: 562, max: 581, label: 'Hafalan Juz 29' },
} as const

// Pages per Iqro jilid, in the edition the school uses.
export const IQRO_PAGES = [36, 32, 32, 32, 32, 32] as const

type JuzTrack = keyof typeof JUZ_RANGE

/** Surahs of a Juz track in memorization order (mushaf order, from the first surah of the juz). */
export function surahsForTrack(track: JuzTrack): Surah[] {
  const juz29 = track === 'juz29'
  return SURAHS.filter((s) => (juz29 ? s.number <= 77 : s.number >= 78))
}

export function surahByNumber(n: number | null | undefined): Surah | null {
  return SURAHS.find((s) => s.number === n) ?? null
}

type PositionLog = {
  type: string
  iqro_level: number | null
  iqro_page: number | null
  juz_page: number | null
  surah_number?: number | null
  ayat?: number | null
}

/** Surah of a Quran-track log: exact when recorded, else inferred from the page (older rows). */
export function logSurah(log: PositionLog): Surah | null {
  if (log.type === 'iqro') return null
  return surahByNumber(log.surah_number) ?? surahForPage(log.juz_page)
}

/** "Iqro 3 · Hal. 12" or "Hafalan Juz 30 · Al-Fajr ayat 16" (page shown only for older rows). */
export function positionLabel(log: PositionLog, sep = ' · '): string {
  if (log.type === 'iqro') return `Iqro ${log.iqro_level}${sep}Hal. ${log.iqro_page}`
  const track = JUZ_RANGE[log.type as JuzTrack]?.label ?? log.type
  const surah = logSurah(log)
  if (log.ayat && surah) return `${track}${sep}${surah.latin} ayat ${log.ayat}`
  return `${track}${sep}Hal. ${log.juz_page ?? '—'}${surah ? `${sep}${surah.latin}` : ''}`
}
