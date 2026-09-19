'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  House,
  Users,
  Upload,
  CalendarDays,
  UserCog,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { initials } from '@/lib/format'

type Role = 'admin' | 'teacher' | 'student_parent'

type NavItem = { href: string; label: string; icon: LucideIcon }

const NAV: Record<Role, NavItem[]> = {
  student_parent: [{ href: '/siswa', label: 'Beranda', icon: House }],
  teacher: [{ href: '/guru', label: 'Kelas', icon: Users }],
  admin: [
    { href: '/admin', label: 'Beranda', icon: House },
    { href: '/guru', label: 'Kelas', icon: Users },
    { href: '/admin/import', label: 'Import', icon: Upload },
    { href: '/admin/users', label: 'Pengguna', icon: UserCog },
    { href: '/admin/years', label: 'Tahun Ajaran', icon: CalendarDays },
  ],
}

function Mark() {
  return (
    <span
      className="font-arabic text-2xl leading-none text-accent select-none"
      aria-hidden
    >
      ب
    </span>
  )
}

export default function AppShell({
  role,
  userName,
  userMeta,
  aside,
  children,
}: {
  role: Role
  userName: string
  userMeta?: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const items = NAV[role]
  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname === href || pathname.startsWith(href + '/')

  return (
    <div className="min-h-screen bg-paper lg:flex">
      {/* Rail — desktop */}
      <nav
        aria-label="Navigasi utama"
        className="hidden lg:flex fixed inset-y-0 left-0 w-[72px] flex-col items-center py-6 border-r border-line bg-paper z-20"
      >
        <Link href="/dashboard" className="w-11 h-11 flex items-center justify-center" aria-label="Al Bayyinah">
          <Mark />
        </Link>
        <ul className="flex-1 flex flex-col items-center justify-center gap-4">
          {items.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                title={label}
                aria-label={label}
                aria-current={isActive(href) ? 'page' : undefined}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                  isActive(href) ? 'bg-accent text-surface' : 'text-ink-2 hover:bg-panel'
                }`}
              >
                <Icon size={20} strokeWidth={1.75} />
              </Link>
            </li>
          ))}
        </ul>
        <form action={logout}>
          <button
            type="submit"
            title="Keluar"
            aria-label="Keluar"
            className="w-11 h-11 rounded-full border border-line flex items-center justify-center text-ink-2 hover:text-warn hover:border-warn transition-colors cursor-pointer"
          >
            <LogOut size={18} strokeWidth={1.75} />
          </button>
        </form>
      </nav>

      <div className="flex-1 lg:pl-[72px] min-w-0">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px] min-h-screen">
          {/* Main column */}
          <div className="min-w-0 px-4 sm:px-8 xl:px-12 pt-5 pb-28 lg:pb-12">
            <header className="flex items-center justify-between gap-4 mb-8 lg:mb-10">
              <Link href="/dashboard" className="lg:hidden flex items-center gap-2" aria-label="Al Bayyinah">
                <Mark />
                <span className="font-serif text-lg text-ink">Al Bayyinah</span>
              </Link>
              <p className="hidden lg:block text-xs text-ink-3 tracking-wide">
                Al Bayyinah School · Sistem Progres Tahsin
              </p>
              <UserChip name={userName} meta={userMeta} className="lg:hidden" />
            </header>
            {children}
          </div>

          {/* Side panel */}
          <aside className="bg-panel px-4 sm:px-8 pt-8 lg:pt-5 pb-28 lg:pb-12 lg:min-h-screen">
            <div className="hidden lg:flex justify-end mb-10">
              <UserChip name={userName} meta={userMeta} />
            </div>
            {aside}
          </aside>
        </div>
      </div>

      {/* Tab bar — mobile */}
      <nav
        aria-label="Navigasi utama"
        className="lg:hidden fixed bottom-0 inset-x-0 z-20 bg-surface/95 backdrop-blur border-t border-line pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="flex items-stretch justify-around h-16 px-2">
          {items.map(({ href, label, icon: Icon }) => (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={isActive(href) ? 'page' : undefined}
                className={`h-full flex flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                  isActive(href) ? 'text-accent' : 'text-ink-3'
                }`}
              >
                <Icon size={20} strokeWidth={isActive(href) ? 2 : 1.75} />
                {label}
              </Link>
            </li>
          ))}
          <li className="flex-1">
            <form action={logout} className="h-full">
              <button
                type="submit"
                className="w-full h-full flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-ink-3 cursor-pointer"
              >
                <LogOut size={20} strokeWidth={1.75} />
                Keluar
              </button>
            </form>
          </li>
        </ul>
      </nav>
    </div>
  )
}

function UserChip({ name, meta, className = '' }: { name: string; meta?: string; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="w-10 h-10 rounded-full bg-accent-soft text-accent text-sm font-semibold flex items-center justify-center shrink-0">
        {initials(name)}
      </span>
      <div className="hidden sm:block min-w-0">
        <p className="text-sm font-medium text-ink truncate max-w-[180px]">{name}</p>
        {meta && <p className="text-xs text-ink-3 truncate max-w-[180px]">{meta}</p>}
      </div>
    </div>
  )
}
