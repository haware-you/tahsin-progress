import { Check } from 'lucide-react'
import { initials } from '@/lib/format'

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export function dateKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Monday-first days of the current week. */
export function currentWeek(today = new Date()) {
  const monday = new Date(today)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export function relativeDay(dateStr: string) {
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.round((now.getTime() - d.getTime()) / 86400000)
  if (diff <= 0) return 'Hari ini'
  if (diff === 1) return 'Kemarin'
  if (diff < 7) return `${diff} hari lalu`
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export function SectionTitle({
  children,
  action,
  id,
}: {
  children: React.ReactNode
  action?: React.ReactNode
  id?: string
}) {
  return (
    <div className="flex items-end justify-between gap-4 mb-5" id={id}>
      <h2 className="font-serif text-[22px] sm:text-2xl font-medium text-ink leading-tight">{children}</h2>
      {action}
    </div>
  )
}

/** Week strip. `counts` maps YYYY-MM-DD → activity count. */
export function WeekStrip({ counts, caption }: { counts: Record<string, number>; caption?: string }) {
  const todayKey = dateKey(new Date())
  return (
    <div>
      <ol className="grid grid-cols-7 gap-1 text-center">
        {currentWeek().map((d) => {
          const key = dateKey(d)
          const isToday = key === todayKey
          const n = counts[key] ?? 0
          const isSunday = d.getDay() === 0
          return (
            <li
              key={key}
              className={`flex flex-col items-center gap-2 py-3 rounded-full ${isToday ? 'bg-accent-soft' : ''}`}
              aria-label={`${d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric' })}: ${n} catatan`}
            >
              <span className={`text-xs ${isSunday ? 'text-warn' : 'text-ink-3'}`}>{DAY_NAMES[d.getDay()]}</span>
              <span className={`text-sm font-semibold ${isToday ? 'text-accent' : 'text-ink'}`}>{d.getDate()}</span>
              <span className={`w-1 h-1 rounded-full ${n > 0 ? 'bg-accent' : 'bg-transparent'}`} />
            </li>
          )
        })}
      </ol>
      {caption && <p className="text-xs text-ink-3 mt-3 text-center">{caption}</p>}
    </div>
  )
}

export type TimelineItem = {
  id: string
  name: string
  note?: string | null
  tag?: string | null
  tone?: 'accent' | 'warn'
  when: string
}

export function Timeline({ items, empty }: { items: TimelineItem[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-ink-3">{empty}</p>
  return (
    <ol className="relative">
      <span className="absolute left-5 top-2 bottom-2 border-l border-dashed border-line" aria-hidden />
      {items.map((it) => (
        <li key={it.id} className="relative flex gap-4 pb-7 last:pb-0">
          <span className="relative z-[1] w-10 h-10 rounded-full bg-surface ring-4 ring-panel text-accent text-xs font-semibold flex items-center justify-center shrink-0">
            {initials(it.name)}
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[15px] font-semibold text-ink">{it.name}</p>
            {it.note && <p className="text-sm italic text-ink-2 mt-1 leading-relaxed">{it.note}</p>}
            <div className="flex items-center justify-between gap-3 mt-2">
              {it.tag ? (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium ${
                    it.tone === 'warn' ? 'text-warn' : 'text-accent'
                  }`}
                >
                  <Check size={12} strokeWidth={2.5} />
                  {it.tag}
                </span>
              ) : (
                <span />
              )}
              <span className="text-xs text-ink-3 shrink-0">{it.when}</span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function Chip({ tone = 'accent', children }: { tone?: 'accent' | 'warn' | 'muted'; children: React.ReactNode }) {
  const cls =
    tone === 'warn'
      ? 'bg-warn-soft text-warn'
      : tone === 'muted'
        ? 'bg-panel text-ink-2'
        : 'bg-accent-soft text-accent'
  return <span className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${cls}`}>{children}</span>
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className="h-1 rounded-full bg-line overflow-hidden" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
    </div>
  )
}
