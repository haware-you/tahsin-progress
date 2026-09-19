'use client'

import { useEffect, useRef, useState } from 'react'

/** Fades and lifts children in once they enter the viewport. Respects reduced motion. */
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
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`motion-safe:transition-[opacity,transform] motion-safe:duration-700 motion-safe:ease-out ${
        shown ? 'opacity-100 translate-y-0' : 'motion-safe:opacity-0 motion-safe:translate-y-6'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/** Hero card stack: starts tilted and small, straightens and grows as the page scrolls.
 *  Writes a --p (0–1) CSS variable directly so scrolling never re-renders React. */
export function GrowStack({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--p', '1')
      return
    }
    let raf = 0
    const update = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const vh = window.innerHeight
        // 0 when the stack's top is at the bottom of the viewport, 1 when it reaches 20% from the top
        const t = (vh - el.getBoundingClientRect().top) / (vh * 0.8)
        el.style.setProperty('--p', String(Math.max(0, Math.min(1, t))))
      })
    }
    update()
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

  return (
    <div ref={ref} className="relative" style={{ '--p': 0 } as React.CSSProperties}>
      <div className="absolute inset-x-6 -top-5 h-full rounded-[32px] bg-panel" style={layer(1.8, 0.97)} aria-hidden />
      <div className="absolute inset-x-3 -top-2.5 h-full rounded-[32px] bg-accent-soft" style={layer(1.2, 0.985)} aria-hidden />
      <div className="relative" style={layer(1, 1)}>
        {children}
      </div>
    </div>
  )
}
