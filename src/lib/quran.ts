// Starting page (Madinah mushaf, 604 pages) of every surah in Juz 29–30.
// Several short surahs share a page; surahForPage returns the first one on it.
const SURAHS: { page: number; latin: string; arabic: string }[] = [
  { page: 562, latin: 'Al-Mulk', arabic: 'الملك' },
  { page: 564, latin: 'Al-Qalam', arabic: 'القلم' },
  { page: 566, latin: 'Al-Haqqah', arabic: 'الحاقة' },
  { page: 568, latin: "Al-Ma'arij", arabic: 'المعارج' },
  { page: 570, latin: 'Nuh', arabic: 'نوح' },
  { page: 572, latin: 'Al-Jinn', arabic: 'الجن' },
  { page: 574, latin: 'Al-Muzzammil', arabic: 'المزمل' },
  { page: 575, latin: 'Al-Muddatstsir', arabic: 'المدثر' },
  { page: 577, latin: 'Al-Qiyamah', arabic: 'القيامة' },
  { page: 578, latin: 'Al-Insan', arabic: 'الإنسان' },
  { page: 580, latin: 'Al-Mursalat', arabic: 'المرسلات' },
  { page: 582, latin: "An-Naba'", arabic: 'النبأ' },
  { page: 583, latin: "An-Nazi'at", arabic: 'النازعات' },
  { page: 585, latin: "'Abasa", arabic: 'عبس' },
  { page: 586, latin: 'At-Takwir', arabic: 'التكوير' },
  { page: 587, latin: 'Al-Infitar', arabic: 'الانفطار' },
  { page: 587, latin: 'Al-Mutaffifin', arabic: 'المطففين' },
  { page: 589, latin: 'Al-Insyiqaq', arabic: 'الانشقاق' },
  { page: 590, latin: 'Al-Buruj', arabic: 'البروج' },
  { page: 591, latin: 'At-Tariq', arabic: 'الطارق' },
  { page: 591, latin: "Al-A'la", arabic: 'الأعلى' },
  { page: 592, latin: "Al-Ghasyiyah", arabic: 'الغاشية' },
  { page: 593, latin: 'Al-Fajr', arabic: 'الفجر' },
  { page: 594, latin: 'Al-Balad', arabic: 'البلد' },
  { page: 595, latin: 'Asy-Syams', arabic: 'الشمس' },
  { page: 595, latin: 'Al-Lail', arabic: 'الليل' },
  { page: 596, latin: 'Ad-Duha', arabic: 'الضحى' },
  { page: 596, latin: 'Al-Insyirah', arabic: 'الشرح' },
  { page: 597, latin: 'At-Tin', arabic: 'التين' },
  { page: 597, latin: "Al-'Alaq", arabic: 'العلق' },
  { page: 598, latin: 'Al-Qadr', arabic: 'القدر' },
  { page: 598, latin: 'Al-Bayyinah', arabic: 'البينة' },
  { page: 599, latin: 'Az-Zalzalah', arabic: 'الزلزلة' },
  { page: 599, latin: "Al-'Adiyat", arabic: 'العاديات' },
  { page: 600, latin: "Al-Qari'ah", arabic: 'القارعة' },
  { page: 600, latin: 'At-Takatsur', arabic: 'التكاثر' },
  { page: 601, latin: "Al-'Asr", arabic: 'العصر' },
  { page: 601, latin: 'Al-Humazah', arabic: 'الهمزة' },
  { page: 601, latin: 'Al-Fil', arabic: 'الفيل' },
  { page: 602, latin: 'Quraisy', arabic: 'قريش' },
  { page: 602, latin: "Al-Ma'un", arabic: 'الماعون' },
  { page: 602, latin: 'Al-Kautsar', arabic: 'الكوثر' },
  { page: 603, latin: 'Al-Kafirun', arabic: 'الكافرون' },
  { page: 603, latin: 'An-Nasr', arabic: 'النصر' },
  { page: 603, latin: 'Al-Lahab', arabic: 'المسد' },
  { page: 604, latin: 'Al-Ikhlas', arabic: 'الإخلاص' },
  { page: 604, latin: 'Al-Falaq', arabic: 'الفلق' },
  { page: 604, latin: 'An-Nas', arabic: 'الناس' },
]

export function surahForPage(page: number | null | undefined) {
  if (!page) return null
  let found: (typeof SURAHS)[number] | null = null
  for (const s of SURAHS) {
    if (s.page < page || (s.page === page && found?.page !== page)) found = s
    else if (s.page > page) break
  }
  return found
}

/** Surahs that start on or after `fromPage` and end before `page` (i.e. fully passed). */
export function surahsBetween(fromPage: number, page: number) {
  return SURAHS.filter((s, i) => {
    const next = SURAHS[i + 1]
    return s.page >= fromPage && next && next.page <= page
  }).length
}

export const JUZ_RANGE = {
  juz30: { min: 582, max: 604, label: 'Juz 30' },
  juz29: { min: 562, max: 581, label: 'Juz 29' },
} as const
