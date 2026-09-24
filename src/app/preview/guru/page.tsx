import GuruView from '@/app/(protected)/guru/GuruView'
import { guruClasses, weekCountsFrom } from '../mock'
import { requestTime } from '@/lib/time'

export default function PreviewGuru() {
  const dates = guruClasses.flatMap((c) => c.students.map((s) => s.latestProgress.log_date))
  return (
    <GuruView
      isAdmin={false}
      displayName="Ustadz Hamzah"
      now={requestTime()}
      allYears={[
        { id: 'y2', label: '2025/2026', is_active: true },
        { id: 'y1', label: '2024/2025', is_active: false },
      ]}
      selectedYear={{ id: 'y2', label: '2025/2026' }}
      isReadonly={false}
      classesWithStudents={guruClasses}
      weekCounts={weekCountsFrom(dates)}
    />
  )
}
