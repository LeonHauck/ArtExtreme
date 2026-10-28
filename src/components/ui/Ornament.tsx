import type { ReactNode } from 'react'

/** Linha neon com o gradiente da marca. */
export function NeonRule({ className = '' }: { className?: string }) {
  return (
    <div className={`h-px bg-rave opacity-70 shadow-[0_0_12px_rgba(190,56,243,0.6)] ${className}`} aria-hidden="true" />
  )
}

/** Divisor curto centralizado: traço neon com ponto. */
export function Ornament({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`} aria-hidden="true">
      <span className="h-0.5 w-10 rounded-full bg-linear-to-r from-transparent to-violet" />
      <span className="h-1.5 w-1.5 rounded-full bg-flame shadow-[0_0_10px_var(--color-flame)]" />
      <span className="h-0.5 w-10 rounded-full bg-linear-to-l from-transparent to-sun" />
    </div>
  )
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = 'center',
}: {
  eyebrow?: string
  title: ReactNode
  subtitle?: string
  align?: 'center' | 'left'
}) {
  const center = align === 'center'
  return (
    <header className={center ? 'text-center' : ''}>
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h2 className="font-display text-4xl tracking-wide text-bone sm:text-5xl">{title}</h2>
      {subtitle && <p className={`mt-3 text-mute ${center ? 'mx-auto max-w-xl' : 'max-w-xl'}`}>{subtitle}</p>}
    </header>
  )
}
