import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  switch (profile?.role) {
    case 'admin':
      redirect('/admin')
    case 'teacher':
      redirect('/guru')
    case 'student_parent':
      redirect('/siswa')
    default:
      redirect('/login')
  }
}
