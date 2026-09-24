'use client'

import { useState } from 'react'
import { ArrowUpRight, FileDown } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { SectionTitle, WeekStrip, Timeline, Chip, Progress, relativeDay, currentWeek, dateKey, SCHOOL_DAYS, type TimelineItem } from '@/components/ui'
import { JUZ_RANGE, logSurah, positionLabel } from '@/lib/quran'
import { computeStreak } from '@/lib/streak'
import { firstName } from '@/lib/format'
import Laporan, { type Badge, type EarnedBadge } from './Laporan'

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
  assessments,
  badges,
  earnedBadges,
}: Props) {
  const [view, setView] = useState<'siswa' | 'ortu'>('siswa')

  const realLogs = progressLogs.filter((l) => !l.is_opening_position)
  const latest = progressLogs[0] ?? null
  const streak = computeStreak(realLogs.map((l) => l.log_date))

  const counts: Record<string, number> = {}
  realLogs.forEach((l) => (counts[l.log_date] = (counts[l.log_date] ?? 0) + 1))
  const weekDays = currentWeek(new Date(now)).filter((d) => counts[dateKey(d)]).length

  const surah = latest ? logSurah(latest) : null
  const range = latest && latest.type !== 'iqro' ? JUZ_RANGE[latest.type] : null
  const where = latest?.ayat && surah
    ? `surah ${surah.latin} ayat ${latest.ayat}`
    : `halaman ${latest?.juz_page}${surah ? ` — surah ${surah.latin}` : ''}`

  const teacher = teacherName ?? 'Ustadz/Ustadzah'
  const timeline: TimelineItem[] = [
    ...realLogs
      .filter((l) => view === 'ortu' ? !!l.notes : true)
      .slice(0, 8)
      .map((l) => ({
        id: 'l' + l.id,
        name: teacher,
        note: l.notes,
        tag: positionLabel(l),
        tone: 'accent' as const,
        when: relativeDay(l.log_date),
        sort: l.log_date,
      })),
    ...(view === 'ortu'
      ? assessments.slice(0, 8).map((a) => ({
          id: 'a' + a.id,
          name: `Murajaah ${JUZ_RANGE[a.juz_type].label}`,
          note: a.reason || null,
          tag: a.outcome === 'lanjut' ? `Lanjut · Hal. ${a.juz_page}` : `Ulang · Hal. ${a.juz_page}`,
          tone: a.outcome === 'lanjut' ? ('accent' as const) : ('warn' as const),
          when: relativeDay(a.assessed_at),
          sort: a.assessed_at.slice(0, 10),
        }))
      : []),
  ]
    .sort((a, b) => (a.sort < b.sort ? 1 : -1))
    .slice(0, 8)

  const heroLine = latest
    ? latest.type === 'iqro'
      ? `Sekarang di Iqro ${latest.iqro_level}, halaman ${latest.iqro_page}. Sedikit demi sedikit, insyaAllah lancar.`
      : latest.type === 'tadarus'
        ? `Sedang tadarus Juz 30, ${where}. Lancarkan bacaan sebelum mulai menghafal.`
        : `Sekarang di ${range?.label}, ${where}. Teruskan murajaah di rumah.`
    : 'Belum ada catatan dari ustadz/ustadzah. Catatan pertama akan muncul di sini.'

  const aside = (
    <div className="space-y-12">
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

      <section>
        <SectionTitle
          action={
            <div className="flex rounded-full bg-surface p-1 text-xs font-medium" role="tablist">
              {(['siswa', 'ortu'] as const).map((v) => (
                <button
                  key={v}
                  role="tab"
                  aria-selected={view === v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
                    view === v ? 'bg-ink text-paper' : 'text-ink-2'
                  }`}
                >
                  {v === 'siswa' ? 'Siswa' : 'Orang Tua'}
                </button>
              ))}
            </div>
          }
        >
          {view === 'ortu' ? 'Catatan Guru' : 'Riwayat'}
        </SectionTitle>
        <Timeline
          items={timeline}
          empty={view === 'ortu' ? 'Belum ada catatan atau evaluasi dari guru.' : 'Belum ada sesi yang tercatat.'}
        />
      </section>
    </div>
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
              href="#laporan"
              className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-ink text-paper text-sm font-medium"
            >
              Lihat laporan <ArrowUpRight size={15} />
            </a>
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
                    Halaman <span className="font-semibold text-gold">{latest.iqro_page}</span> · jilid{' '}
                    {latest.iqro_level} dari 6
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-gold">{(latest.juz_page ?? 0) - (range?.min ?? 0) + 1}</span> /{' '}
                    {(range?.max ?? 0) - (range?.min ?? 0) + 1} halaman {range?.label}
                  </>
                )}
              </p>
              <div className="mt-5">
                {latest.type === 'iqro' ? (
                  <Progress value={latest.iqro_level ?? 0} max={6} />
                ) : (
                  <Progress value={(latest.juz_page ?? 0) - (range?.min ?? 0) + 1} max={(range?.max ?? 1) - (range?.min ?? 0) + 1} />
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

      {/* Figures */}
      <section className="mt-14 grid grid-cols-3 divide-x divide-line border-y border-line">
        {[
          { v: realLogs.length, l: 'sesi tercatat' },
          { v: `${weekDays}/${SCHOOL_DAYS}`, l: 'hari sekolah minggu ini' },
          { v: streak, l: 'minggu beruntun' },
        ].map((f) => (
          <div key={f.l} className="py-5 px-3 sm:px-6 text-center sm:text-left">
            <p className="font-serif text-3xl sm:text-4xl text-ink">{f.v}</p>
            <p className="text-xs text-ink-3 mt-1">{f.l}</p>
          </div>
        ))}
      </section>

      <Laporan
        logs={progressLogs}
        badges={badges}
        earned={earnedBadges}
        lanjutCount={assessments.filter((a) => a.outcome === 'lanjut').length}
      />

      {/* Session list */}
      <section className="mt-14" id="riwayat">
        <SectionTitle>Sesi Terakhir</SectionTitle>
        {realLogs.length === 0 ? (
          <p className="text-sm text-ink-3">Belum ada sesi yang tercatat.</p>
        ) : (
          <ul className="space-y-2">
            {realLogs.slice(0, 10).map((log) => {
              const s = logSurah(log)
              return (
                <li key={log.id} className="flex items-center gap-4 rounded-2xl bg-surface px-5 py-4 min-h-[56px]">
                  <span
                    dir="rtl"
                    lang="ar"
                    className="font-arabic text-2xl text-accent w-16 text-center shrink-0 leading-none"
                    aria-hidden
                  >
                    {log.type === 'iqro' ? log.iqro_level : (s?.arabic ?? '')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">
                      {positionLabel(log)}
                      {log.outcome === 'ulang' && <span className="ml-2 text-xs font-semibold text-warn">U · Ulang</span>}
                    </p>
                    {view === 'ortu' && log.notes && (
                      <p className="text-xs italic text-ink-2 mt-0.5 line-clamp-2">{log.notes}</p>
                    )}
                  </div>
                  <span className="text-xs text-ink-3 shrink-0">{relativeDay(log.log_date)}</span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {view === 'ortu' && assessments.length > 0 && (
        <section className="mt-14">
          <SectionTitle>Evaluasi Murajaah</SectionTitle>
          <ul className="space-y-2">
            {assessments.slice(0, 10).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 rounded-2xl bg-surface px-5 py-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    {JUZ_RANGE[a.juz_type].label} · Hal. {a.juz_page}
                  </p>
                  {a.reason && <p className="text-xs italic text-ink-2 mt-0.5">{a.reason}</p>}
                </div>
                <Chip tone={a.outcome === 'lanjut' ? 'accent' : 'warn'}>
                  {a.outcome === 'lanjut' ? 'Lanjut' : 'Ulang'}
                </Chip>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  )
}
