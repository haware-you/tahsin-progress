'use client'

import { useActionState } from 'react'
import { changeUserRole } from '@/app/actions/users'

type UserRow = {
  id: string
  email: string
  role: string
  teacher_name: string | null
  student_name: string | null
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  teacher: 'Guru',
  student_parent: 'Siswa/Orang Tua',
}

function RoleForm({ user }: { user: UserRow }) {
  const [error, action, isPending] = useActionState<string | null, FormData>(changeUserRole, null)

  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="user_id" value={user.id} />
      <select
        name="role"
        defaultValue={user.role}
        className="border border-stone-200 rounded-lg px-2 py-1.5 text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-green-600"
      >
        <option value="admin">Admin</option>
        <option value="teacher">Guru</option>
        <option value="student_parent">Siswa/Orang Tua</option>
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="text-xs bg-stone-100 text-stone-700 px-3 py-1.5 rounded-lg hover:bg-stone-200 transition-colors min-h-[32px] disabled:opacity-40"
      >
        {isPending ? '...' : 'Simpan'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </form>
  )
}

export default function UsersClient({ users }: { users: UserRow[] }) {
  const grouped = ['admin', 'teacher', 'student_parent'].flatMap(role =>
    users.filter(u => u.role === role)
  )

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100">
        <p className="text-sm font-semibold text-stone-800">{users.length} Pengguna</p>
      </div>
      <div className="divide-y divide-stone-100">
        {grouped.map(user => (
          <div key={user.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-900 truncate">
                  {user.teacher_name ?? user.student_name ?? '—'}
                </p>
                <p className="text-xs text-stone-400 truncate mt-0.5">{user.email}</p>
                <p className="text-xs text-stone-300 mt-0.5">{ROLE_LABELS[user.role] ?? user.role}</p>
              </div>
              <RoleForm user={user} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
