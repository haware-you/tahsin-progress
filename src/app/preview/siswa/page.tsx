import SiswaView from '@/app/(protected)/siswa/SiswaView'
import { siswaLogs, siswaAssessments } from '../mock'

export default function PreviewSiswa() {
  return (
    <SiswaView
      studentId="preview"
      now={Date.now()}
      role="student_parent"
      studentName="Ahmad Fauzi"
      className="Kelas A"
      teacherName="Ustadz Hamzah"
      progressLogs={siswaLogs}
      assessments={siswaAssessments}
    />
  )
}
