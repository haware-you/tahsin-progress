import { IQRO_PAGES, JUZ_RANGE, surahsForTrack, logSurah, type Surah } from './quran'

// Curriculum path: Iqro 1–6 → Tadarus Juz 30 (reading) → Hafalan Juz 30 → Hafalan Juz 29.
const TRACKS = ['iqro', 'tadarus', 'juz30', 'juz29'] as const
type Track = (typeof TRACKS)[number]
type JuzTrack = Exclude<Track, 'iqro'>

export type JourneyLog = {
  type: Track
  iqro_level: number | null
  iqro_page: number | null
  juz_page: number | null
  surah_number?: number | null
  ayat?: number | null
  outcome?: 'lanjut' | 'ulang'
}

export type IqroBar = { level: number; pages: number; done: number }
export type SurahBar = { surah: Surah; done: number }
export type JuzBar = {
  track: JuzTrack
  label: string
  totalAyat: number
  doneAyat: number
  surahsDone: number
  surahs: SurahBar[]
  started: boolean
}

export type Journey = {
  iqro: IqroBar[]
  juz: JuzBar[]
  /** 0…9 across the nine stages (Iqro 1–6, Tadarus, Hafalan 30, Hafalan 29). */
  position: number
}

// Being on a stage at all means every earlier stage is behind the student,
// whatever the outcome. Within the current stage only L (Lanjut) counts:
// U (Ulang) records a session but never moves the bar.
export function computeJourney(logs: JourneyLog[]): Journey {
  const stage = Math.max(-1, ...logs.map((l) => TRACKS.indexOf(l.type)))
  const passed = (t: Track) => stage > TRACKS.indexOf(t)
  const lanjut = (l: JourneyLog) => l.outcome !== 'ulang'

  // Iqro: current level from any entry; pages within it from L entries.
  const iqroLogs = logs.filter((l) => l.type === 'iqro')
  const level = Math.max(0, ...iqroLogs.map((l) => l.iqro_level ?? 0))
  const pageAtLevel = Math.max(
    0,
    ...iqroLogs.filter((l) => lanjut(l) && l.iqro_level === level).map((l) => l.iqro_page ?? 0)
  )
  const iqro: IqroBar[] = IQRO_PAGES.map((pages, i) => {
    const lv = i + 1
    const done = passed('iqro') || lv < level ? pages : lv === level ? Math.min(pageAtLevel, pages) : 0
    return { level: lv, pages, done }
  })

  const juz: JuzBar[] = (['tadarus', 'juz30', 'juz29'] as const).map((track) => {
    const surahs = surahsForTrack(track)
    const totalAyat = surahs.reduce((n, s) => n + s.ayat, 0)
    const trackLogs = logs.filter((l) => l.type === track)
    const idxOf = (l: JourneyLog) => {
      const s = logSurah(l)
      return s ? surahs.indexOf(s) : -1
    }

    let bars: SurahBar[]
    if (passed(track)) {
      bars = surahs.map((surah) => ({ surah, done: surah.ayat }))
    } else {
      const current = Math.max(-1, ...trackLogs.map(idxOf))
      const ayatInCurrent = Math.max(
        0,
        ...trackLogs.filter((l) => lanjut(l) && idxOf(l) === current).map((l) => l.ayat ?? 0)
      )
      bars = surahs.map((surah, i) => ({
        surah,
        done: i < current ? surah.ayat : i === current ? Math.min(ayatInCurrent, surah.ayat) : 0,
      }))
    }

    const doneAyat = bars.reduce((n, b) => n + b.done, 0)
    return {
      track,
      label: JUZ_RANGE[track].label,
      totalAyat,
      doneAyat,
      surahsDone: bars.filter((b) => b.done === b.surah.ayat).length,
      surahs: bars,
      started: passed(track) || trackLogs.length > 0,
    }
  })

  const position =
    iqro.reduce((n, b) => n + b.done / b.pages, 0) + juz.reduce((n, b) => n + b.doneAyat / b.totalAyat, 0)

  return { iqro, juz, position }
}
