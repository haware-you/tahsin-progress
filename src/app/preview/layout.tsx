import { notFound } from 'next/navigation'

// Dev-only design previews with mock data — no auth, never in production.
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <>{children}</>
}
