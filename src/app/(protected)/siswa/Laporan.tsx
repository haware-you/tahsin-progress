import { Sprout, BookCheck, BookOpenCheck, CalendarCheck, Lock, Check, ChevronDown, type LucideIcon } from 'lucide-react'
import { SectionTitle, Progress } from '@/components/ui'
import { computeStreak } from '@/lib/streak'
import type { Journey, JuzBar } from '@/lib/progress'

type Log = {
  log_date: string
  is_opening_position: boolean
}

export type Badge = {
  id: string
  name: string
  description: string
  trigger_type: string
  trigger_value: string
}

export type EarnedBadge = { badge_id: string; awarded_at: string }

const STAGES = ['Iqro 1', 'Iqro 2', 'Iqro 3', 'Iqro 4', 'Iqro 5', 'Iqro 6', 'Tadarus', 'Hafal 30', 'Hafal 29']
// Nine labels don't fit side by side at 375 px, so phones get short ones.
const STAGES_SHORT = ['1', '2', '3', '4', '5', '6', 'Tdr', 'H30', 'H29']

const ICONS: Record<string, LucideIcon> = {
  first_log: Sprout,
  iqro_level: BookCheck,
  juz_complete: BookOpenCheck,
  weekly_streak: CalendarCheck,
}

export default function Laporan({
  logs,
  journey,
  badges,
  earned,
}: {
  logs: Log[]
  journey: Journey
  badges: Badge[]
  earned: EarnedBadge[]
}) {
  const real = logs.filter((l) => !l.is_opening_position)
  const pos = journey.position
  const current = Math.min(STAGES.length - 1, Math.floor(pos))
  const pct = Math.round((pos / STAGES.length) * 100)
  const streak = computeStreak(real.map((l) => l.log_date))
  const earnedMap = new Map(earned.map((e) => [e.badge_id, e.awarded_at]))
  const hafalan = journey.juz.filter((j) => j.track !== 'tadarus')
  const iqroLevel = journey.iqro.filter((b) => b.done === b.pages).length

  // Hint towards each badge not yet earned.
  function hint(b: Badge): { value: number; max: number } | null {
    if (b.trigger_type === 'weekly_streak') return { value: Math.min(streak, 4), max: 4 }
    if (b.trigger_type === 'iqro_level') return { value: iqroLevel, max: 6 }
    if (b.trigger_type === 'juz_complete') {
      const j = journey.juz.find((x) => x.track === b.trigger_value)
      return j ? { value: j.doneAyat, max: j.totalAyat } : null
    }
    if (b.trigger_type === 'first_log') return { value: Math.min(real.length, 1), max: 1 }
    return null
  }

  const achievements = [
    { v: real.length, l: 'sesi belajar' },
    { v: hafalan.reduce((n, j) => n + j.surahsDone, 0), l: 'surah dihafal' },
    { v: hafalan.reduce((n, j) => n + j.doneAyat, 0), l: 'ayat dihafal' },
    { v: streak, l: 'minggu beruntun' },
  ]

  return (
    <section className="mt-14" id="laporan">
      <SectionTitle>Laporan Perjalanan</SectionTitle>

      {/* Journey */}
      <div className="rounded-[28px] bg-surface p-6 sm:p-8">
        <div className="flex items-baseline justify-between gap-4">
          <p className="text-sm text-ink-2">
            Tahap <span className="font-semibold text-ink">{STAGES[current]}</span>
          </p>
          <p className="font-serif text-3xl text-ink">
            {pct}
            <span className="text-base text-ink-3">%</span>
          </p>
        </div>
        <div className="mt-4">
          <Progress value={pos} max={STAGES.length} />
        </div>
        <ol className="grid grid-cols-9 mt-3 text-center">
          {STAGES.map((s, i) => (
            <li key={s} className="flex flex-col items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  i < current ? 'bg-accent' : i === current ? 'bg-gold ring-4 ring-gold/20' : 'bg-line'
                }`}
              />
              <span
                className={`text-[10px] sm:text-[11px] leading-tight ${
                  i === current ? 'text-ink font-semibold' : 'text-ink-3'
                }`}
              >
                <span className="sm:hidden">{STAGES_SHORT[i]}</span>
                <span className="hidden sm:inline">{s}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-ink-3 mt-5">Jalur: Iqro 1–6 → Tadarus Juz 30 (membaca) → Hafalan Juz 30 → Hafalan Juz 29.</p>
      </div>

      {/* Iqro 1–6, by pages */}
      <h3 className="font-serif text-xl text-ink mt-10 mb-4">Iqro</h3>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {journey.iqro.map((b) => (
          <li key={b.level} className="rounded-2xl bg-surface px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className={`text-sm font-semibold ${b.done ? 'text-ink' : 'text-ink-3'}`}>Iqro {b.level}</p>
              {b.done === b.pages ? (
                <Check size={15} className="text-accent" aria-label="Selesai" />
              ) : (
                <span className="text-[11px] text-ink-3">
                  {b.done}/{b.pages} hal.
                </span>
              )}
            </div>
            <div className="mt-2.5">
              <Progress value={b.done} max={b.pages} />
            </div>
          </li>
        ))}
      </ul>

      {/* Tadarus + Hafalan, by ayat, with each surah */}
      <h3 className="font-serif text-xl text-ink mt-10 mb-4">Al-Qur&apos;an</h3>
      <div className="space-y-3">
        {journey.juz.map((j) => (
          <JuzCard key={j.track} bar={j} />
        ))}
      </div>

      {/* Achievements */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line rounded-2xl overflow-hidden mt-6">
        {achievements.map((a) => (
          <div key={a.l} className="bg-paper px-5 py-4">
            <p className="font-serif text-3xl text-ink">{a.v}</p>
            <p className="text-xs text-ink-3 mt-0.5">{a.l}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <h3 className="font-serif text-xl text-ink mt-10 mb-4">Lencana</h3>
      {badges.length === 0 ? (
        <p className="text-sm text-ink-3">Belum ada lencana yang diatur.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {badges.map((b) => {
            const at = earnedMap.get(b.id)
            const Icon = ICONS[b.trigger_type] ?? BookCheck
            const h = at ? null : hint(b)
            return (
              <li
                key={b.id}
                className={`flex gap-4 rounded-2xl px-5 py-4 ${at ? 'bg-surface' : 'bg-transparent border border-dashed border-line'}`}
              >
                <span
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    at ? 'bg-accent text-surface ring-4 ring-gold/30' : 'bg-panel text-ink-3'
                  }`}
                >
                  {at ? <Icon size={20} strokeWidth={1.75} /> : <Lock size={16} strokeWidth={1.75} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-semibold ${at ? 'text-ink' : 'text-ink-2'}`}>{b.name}</p>
                  <p className="text-xs text-ink-3 mt-0.5">{b.description}</p>
                  {at ? (
                    <p className="text-xs text-gold font-medium mt-2">
                      Diraih {new Date(at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  ) : h ? (
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="flex-1">
                        <Progress value={h.value} max={h.max} />
                      </div>
                      <span className="text-[11px] text-ink-3 shrink-0">
                        {h.value}/{h.max}
                      </span>
                    </div>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function JuzCard({ bar }: { bar: JuzBar }) {
  return (
    <details className="group rounded-2xl bg-surface">
      <summary className="list-none cursor-pointer px-5 py-4 min-h-[44px] [&::-webkit-details-marker]:hidden">
        <div className="flex items-baseline justify-between gap-3">
          <p className={`text-sm font-semibold ${bar.started ? 'text-ink' : 'text-ink-3'}`}>{bar.label}</p>
          <span className="flex items-center gap-2 text-[11px] text-ink-3 shrink-0">
            {bar.started ? `${bar.surahsDone}/${bar.surahs.length} surah · ${bar.doneAyat}/${bar.totalAyat} ayat` : 'Belum dimulai'}
            <ChevronDown size={14} className="transition-transform group-open:rotate-180" aria-hidden />
          </span>
        </div>
        <div className="mt-2.5">
          <Progress value={bar.doneAyat} max={bar.totalAyat} />
        </div>
      </summary>
      <ol className="px-5 pb-4 space-y-2">
        {bar.surahs.map(({ surah, done }) => (
          <li key={surah.number} className="grid grid-cols-[1fr_4.5rem_2.5rem] items-center gap-3">
            <span className={`text-xs truncate ${done ? 'text-ink' : 'text-ink-3'}`}>
              {surah.number}. {surah.latin}
            </span>
            <Progress value={done} max={surah.ayat} />
            <span className="text-[11px] text-ink-3 text-right">
              {done === surah.ayat ? <Check size={13} className="text-accent inline" aria-label="Selesai" /> : `${done}/${surah.ayat}`}
            </span>
          </li>
        ))}
      </ol>
    </details>
  )
}
