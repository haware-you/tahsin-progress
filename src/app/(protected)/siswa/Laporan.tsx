import { Sprout, BookCheck, BookOpenCheck, CalendarCheck, Lock, type LucideIcon } from 'lucide-react'
import { SectionTitle, Progress } from '@/components/ui'
import { surahsBetween, JUZ_RANGE } from '@/lib/quran'
import { computeStreak } from '@/lib/streak'

type Log = {
  log_date: string
  type: 'iqro' | 'juz30' | 'juz29'
  iqro_level: number | null
  juz_page: number | null
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

// Curriculum path: Iqro 1–6, then Juz 30, then Juz 29.
const STAGES = ['Iqro 1', 'Iqro 2', 'Iqro 3', 'Iqro 4', 'Iqro 5', 'Iqro 6', 'Juz 30', 'Juz 29']

function stagePosition(log: Log | null): number {
  if (!log) return 0
  if (log.type === 'iqro') return Math.max(0, (log.iqro_level ?? 1) - 1)
  const r = JUZ_RANGE[log.type]
  const frac = Math.min(1, ((log.juz_page ?? r.min) - r.min) / (r.max - r.min + 1))
  return (log.type === 'juz30' ? 6 : 7) + frac
}

const ICONS: Record<string, LucideIcon> = {
  first_log: Sprout,
  iqro_level: BookCheck,
  juz_complete: BookOpenCheck,
  weekly_streak: CalendarCheck,
}

export default function Laporan({
  logs,
  badges,
  earned,
  lanjutCount,
}: {
  logs: Log[]
  badges: Badge[]
  earned: EarnedBadge[]
  lanjutCount: number
}) {
  const real = logs.filter((l) => !l.is_opening_position)
  const latest = logs[0] ?? null
  const pos = stagePosition(latest)
  const current = Math.min(STAGES.length - 1, Math.floor(pos))
  const pct = Math.round((pos / STAGES.length) * 100)
  const streak = computeStreak(real.map((l) => l.log_date))
  const earnedMap = new Map(earned.map((e) => [e.badge_id, e.awarded_at]))

  // Hint towards each badge not yet earned.
  function hint(b: Badge): { value: number; max: number } | null {
    if (b.trigger_type === 'weekly_streak') return { value: Math.min(streak, 4), max: 4 }
    if (b.trigger_type === 'iqro_level') {
      if (latest?.type !== 'iqro') return latest ? { value: 6, max: 6 } : { value: 0, max: 6 }
      return { value: latest.iqro_level ?? 0, max: 6 }
    }
    if (b.trigger_type === 'juz_complete') {
      const juz = b.trigger_value as 'juz30' | 'juz29'
      const r = JUZ_RANGE[juz]
      const total = r.max - r.min + 1
      if (latest?.type === juz) return { value: (latest.juz_page ?? r.min) - r.min + 1, max: total }
      return { value: 0, max: total }
    }
    if (b.trigger_type === 'first_log') return { value: Math.min(real.length, 1), max: 1 }
    return null
  }

  const surahDone =
    latest && latest.type !== 'iqro' ? surahsBetween(JUZ_RANGE[latest.type].min, latest.juz_page ?? 0) : 0

  const achievements = [
    { v: real.length, l: 'sesi belajar' },
    { v: surahDone, l: 'surah dilalui' },
    { v: lanjutCount, l: 'murajaah lanjut' },
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
        <ol className="grid grid-cols-8 mt-3 text-center">
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
                {s.replace('Iqro ', 'Iqro ')}
              </span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-ink-3 mt-5">Jalur: Iqro 1–6, lalu Juz 30, lalu Juz 29.</p>
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
