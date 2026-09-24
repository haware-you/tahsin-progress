'use client'

import { useActionState, useState } from 'react'
import { changeUserRole, resetUserPassword, type ResetResult } from '@/app/actions/users'

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

/**
 * Generates a temporary password and reveals it once. The admin reads it out
 * to the family; it is never stored anywhere we can show again.
 */
function ResetPasswordForm({ user }: { user: UserRow }) {
  const [result, action, isPending] = useActionState<ResetResult | null, FormData>(
    resetUserPassword,
    null
  )
  const [confirming, setConfirming] = useState(false)

  if (result?.ok) {
    return (
      <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
        <p className="text-xs text-amber-800 font-medium">Kata sandi sementara</p>
        <p className="font-mono text-sm text-stone-900 mt-1 break-all select-all">{result.password}</p>
        <p className="text-xs text-amber-700 mt-1.5">
          Catat sekarang — kata sandi ini tidak bisa ditampilkan lagi. Minta
          {' '}{user.student_name ?? user.teacher_name ?? 'pengguna'} menggantinya setelah masuk.
        </p>
      </div>
    )
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-2 text-xs text-stone-500 hover:text-stone-800 underline underline-offset-2 min-h-[32px] cursor-pointer"
      >
        Reset kata sandi
      </button>
    )
  }

  return (
    <form action={action} className="mt-2 flex items-center gap-2 flex-wrap">
      <input type="hidden" name="user_id" value={user.id} />
      <span className="text-xs text-stone-500">Ganti kata sandi {user.email}?</span>
      <button
        type="submit"
        disabled={isPending}
        className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors min-h-[32px] disabled:opacity-40 cursor-pointer"
      >
        {isPending ? 'Memproses…' : 'Ya, reset'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-xs text-stone-500 px-2 py-1.5 min-h-[32px] cursor-pointer"
      >
        Batal
      </button>
      {result && !result.ok && <span className="text-xs text-red-600 w-full">{result.error}</span>}
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
            <ResetPasswordForm user={user} />
          </div>
        ))}
      </div>
    </div>
  )
}
