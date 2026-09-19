'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// useLayoutEffect warns on the server; the effect only matters in the browser.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

type RevealState = 'visible' | 'waiting' | 'revealed'

/** Fades and lifts children in as they approach the viewport.
 *  Content is visible in the server HTML and without JS. Only sections still below
 *  the fold at hydration are hidden (before first paint), and they start revealing
 *  ahead of arrival so fast scrolling never lands on blank paper. */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<RevealState>('visible')

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Already on screen or scrolled past (reload mid-page, anchor jump): leave it alone.
    if (el.getBoundingClientRect().top < window.innerHeight) return

    setState('waiting')
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('revealed')
          io.disconnect()
        }
      },
      // Trigger a quarter-screen early so the fade is underway by the time it's seen.
      { rootMargin: '0px 0px 25% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const motion =
    state === 'visible'
      ? ''
      : `transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          state === 'waiting' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`

  return (
    <div
      ref={ref}
      className={`${motion} ${className}`}
      style={state === 'revealed' && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

/** One-time page-load entrance for the hero. Pure CSS, so it plays before hydration
 *  and never leaves content hidden. Disabled under reduced motion (see globals.css). */
export function Entrance({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div className="hero-entrance" style={delay ? { animationDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  )
}

/** Hero card stack: starts tilted and small, straightens and grows as the page scrolls.
 *  Writes a --p (0–1) CSS variable directly so scrolling never re-renders React.
 *  Server HTML renders the settled state (--p: 1), so it reads correctly without JS. */
export function GrowStack({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const measure = () => {
      const vh = window.innerHeight
      // 0 when the stack's top is at the bottom of the viewport, 1 when it reaches 20% from the top
      const rect = el.getBoundingClientRect()
      const p = Math.max(0, Math.min(1, (vh - rect.top) / (vh * 0.8)))
      // Fan peaks when the stack is centred in the viewport and folds as it leaves.
      // Gated by p so the fan only opens once the card has straightened.
      const d = Math.abs(rect.top + rect.height / 2 - vh / 2) / (vh * 0.5)
      const near = Math.max(0, Math.min(1, 1 - d))
      const f = near * near * (3 - 2 * near) * p
      el.style.setProperty('--p', String(p))
      el.style.setProperty('--f', f.toFixed(3))
    }
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }
    measure() // synchronous, before first paint: no jump from settled to tilted
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const layer = (tiltMul: number, scaleMul: number) =>
    ({
      transform: `rotate(calc(-4deg * (1 - var(--p)) * ${tiltMul})) scale(calc((0.86 + 0.14 * var(--p)) * ${scaleMul}))`,
      transformOrigin: 'center top',
    }) as React.CSSProperties

  // Outer wrappers follow scroll (no transition, so they track the wheel exactly);
  // inner .fan-layer elements fan out from --f: scroll-driven, or full on hover (see globals.css).
  return (
    <div ref={ref} className="relative fan-stack" style={{ '--p': 1 } as React.CSSProperties}>
      <div className="absolute inset-x-6 -top-5 h-full" style={layer(1.8, 0.97)} aria-hidden>
        <div className="fan-layer fan-left h-full rounded-[32px] bg-panel p-6">
          <p className="text-xs text-ink-3">Pekan lalu</p>
          <p className="font-serif text-lg text-ink-2">Al-Ghasyiyah ✓</p>
        </div>
      </div>
      <div className="absolute inset-x-3 -top-2.5 h-full" style={layer(1.2, 0.985)} aria-hidden>
        <div className="fan-layer fan-right h-full rounded-[32px] bg-accent-soft p-6 text-right">
          <p className="text-xs text-accent/70">Kemarin</p>
          <p className="font-serif text-lg text-accent">Al-Fajr ✓</p>
        </div>
      </div>
      <div className="relative" style={layer(1, 1)}>
        <div className="fan-layer fan-front">{children}</div>
      </div>
    </div>
  )
}
