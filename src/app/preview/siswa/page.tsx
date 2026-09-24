import SiswaView from '@/app/(protected)/siswa/SiswaView'
import { siswaLogs, siswaAssessments, badges, earnedBadges } from '../mock'
import { requestTime } from '@/lib/time'

export default function PreviewSiswa() {
  return (
    <SiswaView
      studentId="preview"
      now={requestTime()}
      role="student_parent"
      studentName="Ahmad Fauzi"
      className="Kelas A"
      teacherName="Ustadz Hamzah"
      progressLogs={siswaLogs}
      assessments={siswaAssessments}
      badges={badges}
      earnedBadges={earnedBadges}
    />
  )
}
