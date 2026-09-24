import { Sprout, BookCheck, BookOpenCheck, CalendarCheck, Check, ChevronDown, type LucideIcon } from 'lucide-react'
import { SectionTitle, Progress } from '@/components/ui'
import type { Journey, JuzBar } from '@/lib/progress'

export type Badge = {
  id: string
  name: string
  description: string
  trigger_type: string
  trigger_value: string
}

export type EarnedBadge = { badge_id: string; awarded_at: string }

// Curriculum path: Iqro 1–6 → Tadarus Juz 30 (reading) → Hafalan Juz 30 → Hafalan Juz 29.
const STAGES = ['Iqro 1', 'Iqro 2', 'Iqro 3', 'Iqro 4', 'Iqro 5', 'Iqro 6', 'Tadarus', 'Hafal 30', 'Hafal 29']
// Nine labels don't fit side by side at 375 px, so phones get short ones.
const STAGES_SHORT = ['1', '2', '3', '4', '5', '6', 'Tdr', 'H30', 'H29']
const JUZ_STAGES = ['tadarus', 'juz30', 'juz29'] as const

/** Where the student is on the whole path, with the current juz's surahs one tap away. */
export function Perjalanan({ journey }: { journey: Journey }) {
  const current = Math.min(STAGES.length - 1, Math.floor(journey.position))
  const juz: JuzBar | undefined =
    current >= 6 ? journey.juz.find((j) => j.track === JUZ_STAGES[current - 6]) : undefined

  return (
    <section className="mt-14" id="perjalanan">
      <SectionTitle>Perjalanan</SectionTitle>
      <div className="rounded-[28px] bg-surface p-6 sm:p-8">
        <p className="text-sm text-ink-2">
          Tahap <span className="font-semibold text-ink">{STAGES[current]}</span>
        </p>
        <ol className="grid grid-cols-9 mt-4 text-center">
          {STAGES.map((s, i) => (
            <li key={s} className="flex flex-col items-center gap-1.5">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  i < current ? 'bg-accent text-surface' : i === current ? 'bg-gold ring-4 ring-gold/20' : 'bg-line'
                }`}
              >
                {i < current && <Check size={12} strokeWidth={3} aria-label="Selesai" />}
              </span>
              <span
                className={`text-[10px] sm:text-[11px] leading-tight ${i === current ? 'text-ink font-semibold' : 'text-ink-3'}`}
              >
                <span className="sm:hidden">{STAGES_SHORT[i]}</span>
                <span className="hidden sm:inline">{s}</span>
              </span>
            </li>
          ))}
        </ol>

        {juz && (
          <details className="group mt-6 border-t border-line pt-4">
            <summary className="list-none cursor-pointer flex items-center justify-between gap-3 min-h-[44px] text-sm text-ink-2 [&::-webkit-details-marker]:hidden">
              <span>
                <span className="font-semibold text-ink">{juz.surahsDone}</span> dari {juz.surahs.length} surah{' '}
                {juz.track === 'tadarus' ? 'lancar dibaca' : 'dihafal'}
              </span>
              <span className="flex items-center gap-1 text-xs text-ink-3 shrink-0">
                Lihat per surah
                <ChevronDown size={14} className="transition-transform group-open:rotate-180" aria-hidden />
              </span>
            </summary>
            <ol className="mt-3 space-y-2">
              {juz.surahs.map(({ surah, done }) => (
                <li key={surah.number} className="grid grid-cols-[1fr_4.5rem_2.5rem] items-center gap-3">
                  <span className={`text-xs truncate ${done ? 'text-ink' : 'text-ink-3'}`}>
                    {surah.number}. {surah.latin}
                  </span>
                  <Progress value={done} max={surah.ayat} />
                  <span className="text-[11px] text-ink-3 text-right">
                    {done === surah.ayat ? (
                      <Check size={13} className="text-accent inline" aria-label="Selesai" />
                    ) : (
                      `${done}/${surah.ayat}`
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </details>
        )}
      </div>
    </section>
  )
}

const ICONS: Record<string, LucideIcon> = {
  first_log: Sprout,
  iqro_level: BookCheck,
  juz_complete: BookOpenCheck,
  weekly_streak: CalendarCheck,
}

/** Badges already earned. Locked ones stay hidden: no progress bars towards rewards. */
export function EarnedBadges({ badges, earned }: { badges: Badge[]; earned: EarnedBadge[] }) {
  const at = new Map(earned.map((e) => [e.badge_id, e.awarded_at]))
  const got = badges.filter((b) => at.has(b.id))
  if (got.length === 0) return null

  return (
    <section className="mt-14">
      <SectionTitle>Lencana</SectionTitle>
      <ul className="flex flex-wrap gap-2">
        {got.map((b) => {
          const Icon = ICONS[b.trigger_type] ?? BookCheck
          const when = new Date(at.get(b.id)!).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
          return (
            <li key={b.id} className="flex items-center gap-2.5 rounded-full bg-surface pl-1.5 pr-4 py-1.5" title={`${b.description} · ${when}`}>
              <span className="w-8 h-8 rounded-full bg-accent text-surface flex items-center justify-center shrink-0">
                <Icon size={15} strokeWidth={1.75} />
              </span>
              <span className="text-sm font-medium text-ink">{b.name}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
