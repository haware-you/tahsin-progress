// First page (Madinah mushaf, 604 pages) of each surah in Juz 29–30.
// Used to show which surah a juz page falls in.
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
  { page: 589, latin: 'Al-Insyiqaq', arabic: 'الانشقاق' },
  { page: 590, latin: 'Al-Buruj', arabic: 'البروج' },
  { page: 591, latin: 'At-Tariq', arabic: 'الطارق' },
  { page: 592, latin: "Al-Ghasyiyah", arabic: 'الغاشية' },
  { page: 593, latin: 'Al-Fajr', arabic: 'الفجر' },
  { page: 594, latin: 'Al-Balad', arabic: 'البلد' },
  { page: 595, latin: 'Asy-Syams', arabic: 'الشمس' },
  { page: 596, latin: 'Ad-Duha', arabic: 'الضحى' },
  { page: 597, latin: 'At-Tin', arabic: 'التين' },
  { page: 598, latin: 'Al-Qadr', arabic: 'القدر' },
  { page: 599, latin: 'Az-Zalzalah', arabic: 'الزلزلة' },
  { page: 600, latin: "Al-Qari'ah", arabic: 'القارعة' },
  { page: 601, latin: "Al-'Asr", arabic: 'العصر' },
  { page: 602, latin: 'Quraisy', arabic: 'قريش' },
  { page: 603, latin: 'Al-Kafirun', arabic: 'الكافرون' },
  { page: 604, latin: 'Al-Ikhlas', arabic: 'الإخلاص' },
]

export function surahForPage(page: number | null | undefined) {
  if (!page) return null
  let found = null
  for (const s of SURAHS) {
    if (s.page <= page) found = s
    else break
  }
  return found
}

export const JUZ_RANGE = {
  juz30: { min: 582, max: 604, label: 'Juz 30' },
  juz29: { min: 562, max: 581, label: 'Juz 29' },
} as const
