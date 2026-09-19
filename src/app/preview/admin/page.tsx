import AdminView from '@/app/(protected)/admin/AdminView'
import { daysAgo, weekCountsFrom } from '../mock'

export default function PreviewAdmin() {
  return (
    <AdminView
      activeYear={{ label: '2025/2026' }}
      totalStudents={348}
      activeThisWeek={271}
      inactiveTotal={19}
      totalClasses={15}
      totalTeachers={15}
      iqroCount={120}
      tadarusCount={22}
      quranCount={187}
      notStartedCount={19}
      classStats={[
        { id: '1', name: 'Kelas 1A', teacher: 'Ustadz Hamzah', studentCount: 24, inactiveCount: 0, lastActivity: daysAgo(0) },
        { id: '2', name: 'Kelas 1B', teacher: 'Ustadzah Maryam', studentCount: 22, inactiveCount: 3, lastActivity: daysAgo(1) },
        { id: '3', name: 'Kelas 2A', teacher: 'Ustadz Yusuf', studentCount: 25, inactiveCount: 1, lastActivity: daysAgo(0) },
        { id: '4', name: 'Kelas 2B', teacher: 'Ustadzah Hafsah', studentCount: 23, inactiveCount: 6, lastActivity: daysAgo(5) },
      ]}
      weekCounts={weekCountsFrom([daysAgo(0), daysAgo(0), daysAgo(1), daysAgo(2), daysAgo(3), daysAgo(4)])}
    />
  )
}
