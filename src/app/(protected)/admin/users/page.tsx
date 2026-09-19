import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: usersRaw } = await supabase
    .from('users')
    .select('id, email, role, teachers(name), students(name)')
    .order('role')
    .order('email')

  const users = (usersRaw ?? []).map(u => {
    const teacherRaw = u.teachers as unknown
    const studentRaw = u.students as unknown
    const teacherName = Array.isArray(teacherRaw)
      ? (teacherRaw[0] as { name: string } | undefined)?.name ?? null
      : (teacherRaw as { name: string } | null)?.name ?? null
    const studentName = Array.isArray(studentRaw)
      ? (studentRaw[0] as { name: string } | undefined)?.name ?? null
      : (studentRaw as { name: string } | null)?.name ?? null

    return {
      id: u.id,
      email: u.email,
      role: u.role as string,
      teacher_name: teacherName,
      student_name: studentName,
    }
  })

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-4 max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="text-stone-400 hover:text-stone-700 transition-colors min-h-[44px] flex items-center"
            >
              ‹
            </a>
            <div>
              <p className="text-xs text-stone-400 font-medium uppercase tracking-wide">Admin</p>
              <h1 className="text-base font-bold text-stone-900">Manajemen Pengguna</h1>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-stone-500 hover:text-red-600 transition-colors min-h-[44px] px-2"
            >
              Keluar
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <UsersClient users={users} />
      </main>
    </div>
  )
}
