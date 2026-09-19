import { ArrowUpRight } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { SectionTitle, WeekStrip, Timeline, Chip, relativeDay, type TimelineItem } from '@/components/ui'
import { firstName } from '@/lib/format'
import StudentRoster, { type StudentWithProgress } from './StudentRoster'

export type GuruViewProps = {
  isAdmin: boolean
  displayName: string
  now: number
  allYears: { id: string; label: string; is_active: boolean }[]
  selectedYear?: { id: string; label: string } | null
  isReadonly: boolean
  classesWithStudents: { id: string; name: string; students: StudentWithProgress[] }[]
  weekCounts: Record<string, number>
}

export default function GuruView({
  isAdmin,
  displayName,
  now,
  allYears,
  selectedYear,
  isReadonly,
  classesWithStudents,
  weekCounts,
}: GuruViewProps) {
  // Aggregate for hero + side panel
  const allStudents = classesWithStudents.flatMap((c) => c.students)
  const weekAgo = now - 7 * 86400000
  const loggedThisWeek = allStudents.filter(
    (s) => s.latestProgress?.log_date && new Date(s.latestProgress.log_date).getTime() >= weekAgo
  ).length
  const inactive = allStudents.filter((s) => s.isInactive)

  const attention: TimelineItem[] = inactive.slice(0, 6).map((s) => ({
    id: s.id,
    name: s.name,
    note: s.latestProgress?.log_date
      ? `Terakhir dicatat ${relativeDay(s.latestProgress.log_date).toLowerCase()}.`
      : 'Belum pernah dicatat tahun ini.',
    tag: 'Tidak aktif 28+ hari',
    tone: 'warn',
    when: '',
  }))

  const aside = (
    <div className="space-y-12">
      <section>
        <SectionTitle>Minggu Ini</SectionTitle>
        <WeekStrip counts={weekCounts} caption={`${loggedThisWeek} dari ${allStudents.length} siswa dicatat 7 hari terakhir · Sen–Kam`} />
      </section>
      <section>
        <SectionTitle>Perlu Perhatian</SectionTitle>
        <Timeline items={attention} empty="Semua siswa aktif. Alhamdulillah." />
        {inactive.length > attention.length && (
          <p className="text-xs text-ink-3 mt-5">+{inactive.length - attention.length} siswa lainnya</p>
        )}
      </section>
    </div>
  )

  return (
    <AppShell
      role={isAdmin ? 'admin' : 'teacher'}
      userName={displayName}
      userMeta={isAdmin ? 'Semua kelas' : 'Ustadz/Ustadzah'}
      aside={aside}
    >
      <section>
        <h1 className="font-serif text-[40px] sm:text-5xl xl:text-[56px] font-medium leading-[1.05] text-ink">
          Assalamu&apos;alaikum,
          <br />
          {isAdmin ? 'Semua Kelas' : firstName(displayName)}
        </h1>
        <p className="text-[15px] text-ink-2 leading-relaxed mt-5 max-w-lg">
          {allStudents.length === 0
            ? 'Belum ada siswa di kelas Anda untuk tahun ajaran ini.'
            : `${allStudents.length} siswa di ${classesWithStudents.length} kelas. ${loggedThisWeek} sudah dicatat minggu ini${
                inactive.length ? `, ${inactive.length} belum dicatat lebih dari 4 minggu.` : '.'
              }`}
        </p>
        {!isReadonly && allStudents.length > 0 && (
          <a
            href="#kelas"
            className="inline-flex items-center gap-1.5 h-10 px-5 mt-7 rounded-full bg-ink text-paper text-sm font-medium"
          >
            Mulai mencatat <ArrowUpRight size={15} />
          </a>
        )}

        {(allYears ?? []).length > 1 && (
          <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
            {(allYears ?? []).map((year) => (
              <a
                key={year.id}
                href={year.is_active ? '/guru' : `/guru?year_id=${year.id}`}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedYear?.id === year.id ? 'bg-accent-soft text-accent' : 'text-ink-3 hover:bg-surface'
                }`}
              >
                {year.label}
                {year.is_active && <span className="ml-1 opacity-70">· Aktif</span>}
              </a>
            ))}
          </div>
        )}
      </section>

      {isReadonly && (
        <div className="mt-8 bg-warn-soft rounded-2xl px-5 py-3 text-sm text-warn">
          Arsip tahun ajaran {selectedYear?.label} — hanya baca.
        </div>
      )}

      <div id="kelas" className="mt-14 space-y-14 scroll-mt-6">
        {classesWithStudents.length > 0 ? (
          classesWithStudents.map((cls) => (
            <section key={cls.id}>
              <SectionTitle action={<Chip tone="muted">{cls.students.length} siswa</Chip>}>{cls.name}</SectionTitle>
              <StudentRoster students={cls.students} isReadonly={isReadonly} isAdmin={isAdmin} />
            </section>
          ))
        ) : (
          <div className="bg-surface rounded-2xl p-6 text-center">
            <p className="text-ink-2 text-sm">Belum ada kelas yang ditetapkan untuk tahun ajaran ini.</p>
            <p className="text-ink-3 text-xs mt-1">Hubungi admin untuk pengaturan kelas.</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
