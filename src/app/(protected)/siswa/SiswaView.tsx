'use client'

import { useState } from 'react'
import { FileDown } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { SectionTitle, WeekStrip, Progress, relativeDay, currentWeek, dateKey, SCHOOL_DAYS } from '@/components/ui'
import { JUZ_RANGE, logSurah, positionLabel } from '@/lib/quran'
import { computeJourney, type JourneyLog } from '@/lib/progress'
import { computeStreak } from '@/lib/streak'
import { firstName } from '@/lib/format'
import { Perjalanan, EarnedBadges, type Badge, type EarnedBadge } from './Laporan'

type ProgressLog = {
  id: string
  log_date: string
  type: 'iqro' | 'tadarus' | 'juz30' | 'juz29'
  iqro_level: number | null
  iqro_page: number | null
  juz_page: number | null
  surah_number: number | null
  ayat: number | null
  outcome: 'lanjut' | 'ulang'
  notes: string | null
  is_opening_position: boolean
}

type Assessment = {
  id: string
  juz_type: 'juz30' | 'juz29'
  juz_page: number
  outcome: 'lanjut' | 'ulang'
  reason: string
  assessed_at: string
}

type Props = {
  studentId: string
  studentName: string
  className?: string | null
  teacherName?: string | null
  role: 'admin' | 'student_parent'
  now: number
  progressLogs: ProgressLog[]
  /** Every entry (lightweight columns) so the progress bars see the furthest position. */
  journeyLogs: JourneyLog[]
  assessments: Assessment[]
  badges: Badge[]
  earnedBadges: EarnedBadge[]
}


export default function SiswaView({
  studentId,
  studentName,
  className,
  teacherName,
  role,
  now,
  progressLogs,
  journeyLogs,
  assessments,
  badges,
  earnedBadges,
}: Props) {
  const [view, setView] = useState<'siswa' | 'ortu'>('siswa')

  const realLogs = progressLogs.filter((l) => !l.is_opening_position)
  const journey = computeJourney(journeyLogs)
  const latest = progressLogs[0] ?? null
  const streak = computeStreak(realLogs.map((l) => l.log_date))

  const counts: Record<string, number> = {}
  realLogs.forEach((l) => (counts[l.log_date] = (counts[l.log_date] ?? 0) + 1))
  const weekDays = currentWeek(new Date(now)).filter((d) => counts[dateKey(d)]).length

  const surah = latest ? logSurah(latest) : null
  const range = latest && latest.type !== 'iqro' ? JUZ_RANGE[latest.type] : null
  const juzBar = latest && latest.type !== 'iqro' ? journey.juz.find((j) => j.track === latest.type) : null
  const iqroBar = latest?.type === 'iqro' ? journey.iqro[(latest.iqro_level ?? 1) - 1] : null
  const where = latest?.ayat && surah
    ? `surah ${surah.latin} ayat ${latest.ayat}`
    : `halaman ${latest?.juz_page}${surah ? ` — surah ${surah.latin}` : ''}`

  // One list of recent sessions. The parent view adds teacher notes and the
  // older murajaah evaluations (recorded before L/U moved onto each entry).
  type Note = { id: string; date: string; title: string; ulang: boolean; note: string | null; arabic: string }
  const notes: Note[] = [
    ...realLogs.map((l) => ({
      id: 'l' + l.id,
      date: l.log_date,
      title: positionLabel(l),
      ulang: l.outcome === 'ulang',
      note: view === 'ortu' ? l.notes : null,
      arabic: l.type === 'iqro' ? String(l.iqro_level) : (logSurah(l)?.arabic ?? ''),
    })),
    ...(view === 'ortu'
      ? assessments.map((a) => ({
          id: 'a' + a.id,
          date: a.assessed_at.slice(0, 10),
          title: `Murajaah ${JUZ_RANGE[a.juz_type].label} · Hal. ${a.juz_page}`,
          ulang: a.outcome === 'ulang',
          note: a.reason && a.reason !== '-' ? a.reason : null,
          arabic: '',
        }))
      : []),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5)

  const heroLine = latest
    ? latest.type === 'iqro'
      ? `Sekarang di Iqro ${latest.iqro_level}, halaman ${latest.iqro_page}. Sedikit demi sedikit, insyaAllah lancar.`
      : latest.type === 'tadarus'
        ? `Sedang tadarus Juz 30, ${where}. Lancarkan bacaan sebelum mulai menghafal.`
        : `Sekarang di ${range?.label}, ${where}. Teruskan murajaah di rumah.`
    : 'Belum ada catatan dari ustadz/ustadzah. Catatan pertama akan muncul di sini.'

  const aside = (
    <section>
      <SectionTitle>Minggu Ini</SectionTitle>
      <WeekStrip
        counts={counts}
        caption={
          streak > 1
            ? `${weekDays} dari ${SCHOOL_DAYS} hari sekolah minggu ini · ${streak} minggu berturut-turut`
            : `${weekDays} dari ${SCHOOL_DAYS} hari sekolah minggu ini`
        }
      />
    </section>
  )

  return (
    <AppShell
      role={role}
      userName={studentName}
      userMeta={[className, teacherName].filter(Boolean).join(' · ') || undefined}
      aside={aside}
    >
      {/* Hero */}
      <section className="grid gap-10 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] 2xl:items-center">
        <div>
          <h1 className="font-serif text-[40px] sm:text-5xl xl:text-[56px] font-medium leading-[1.05] text-ink">
            Assalamu&apos;alaikum,
            <br />
            {firstName(studentName)}
          </h1>
          <p className="text-[15px] text-ink-2 leading-relaxed mt-5 max-w-md">{heroLine}</p>
          <div className="flex flex-wrap gap-3 mt-7">
            <a
              href={`/api/export/pdf?student_id=${studentId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full border border-line text-ink text-sm font-medium hover:bg-surface"
            >
              <FileDown size={15} /> Laporan PDF
            </a>
          </div>
        </div>

        {/* Current position — the "open book" */}
        <div className="rounded-[28px] bg-surface p-7 sm:p-9 shadow-[0_1px_2px_rgba(29,33,27,0.06)]">
          {latest ? (
            <>
              <p className="text-xs font-medium text-ink-3 uppercase tracking-[0.14em]">Posisi saat ini</p>
              <p
                dir="rtl"
                lang="ar"
                className="font-arabic text-5xl sm:text-6xl text-ink text-right leading-[1.6] mt-2"
              >
                {latest.type === 'iqro' ? `إقرأ ${latest.iqro_level}` : (surah?.arabic ?? 'جزء')}
              </p>
              <h2 className="font-serif text-3xl text-ink mt-1">
                {latest.type === 'iqro' ? `Iqro ${latest.iqro_level}` : (surah?.latin ?? range?.label)}
              </h2>
              <p className="text-sm text-ink-2 mt-1">
                {latest.type === 'iqro' ? (
                  <>
                    Halaman <span className="font-semibold text-gold">{latest.iqro_page}</span> / {iqroBar?.pages} · jilid{' '}
                    {latest.iqro_level} dari 6
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-gold">{juzBar?.doneAyat ?? 0}</span> / {juzBar?.totalAyat} ayat{' '}
                    {range?.label}
                  </>
                )}
              </p>
              <div className="mt-5">
                {latest.type === 'iqro' ? (
                  <Progress value={iqroBar?.done ?? 0} max={iqroBar?.pages ?? 1} />
                ) : (
                  <Progress value={juzBar?.doneAyat ?? 0} max={juzBar?.totalAyat ?? 1} />
                )}
              </div>
              <p className="text-xs text-ink-3 mt-4 text-right">— diperbarui {relativeDay(latest.log_date).toLowerCase()}</p>
            </>
          ) : (
            <div className="py-10 text-center">
              <p dir="rtl" lang="ar" className="font-arabic text-5xl text-ink-3 leading-[1.6]">
                بسم الله
              </p>
              <p className="text-sm text-ink-3 mt-3">Menunggu catatan pertama</p>
            </div>
          )}
        </div>
      </section>

      <Perjalanan journey={journey} />

      <section className="mt-14" id="catatan">
        <SectionTitle
          action={
            <div className="flex rounded-full bg-surface p-1 text-xs font-medium" role="tablist">
              {(['siswa', 'ortu'] as const).map((v) => (
                <button
                  key={v}
                  role="tab"
                  aria-selected={view === v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 min-h-[32px] rounded-full transition-colors cursor-pointer ${
                    view === v ? 'bg-ink text-paper' : 'text-ink-2'
                  }`}
                >
                  {v === 'siswa' ? 'Siswa' : 'Orang Tua'}
                </button>
              ))}
            </div>
          }
        >
          {view === 'ortu' ? 'Catatan Guru' : 'Sesi Terakhir'}
        </SectionTitle>
        {notes.length === 0 ? (
          <p className="text-sm text-ink-3">Belum ada sesi yang tercatat.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="flex items-center gap-4 rounded-2xl bg-surface px-5 py-4 min-h-[56px]">
                <span
                  dir="rtl"
                  lang="ar"
                  className="font-arabic text-2xl text-accent w-12 text-center shrink-0 leading-none"
                  aria-hidden
                >
                  {n.arabic}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {n.title}
                    {n.ulang && <span className="ml-2 text-xs font-semibold text-gold">U · Ulang</span>}
                  </p>
                  {n.note && <p className="text-xs italic text-ink-2 mt-0.5 line-clamp-3">{n.note}</p>}
                </div>
                <span className="text-xs text-ink-3 shrink-0">{relativeDay(n.date)}</span>
              </li>
            ))}
          </ul>
        )}
        {view === 'ortu' && teacherName && <p className="text-xs text-ink-3 mt-3">Dicatat oleh {teacherName}.</p>}
      </section>

      <EarnedBadges badges={badges} earned={earnedBadges} />
    </AppShell>
  )
}
