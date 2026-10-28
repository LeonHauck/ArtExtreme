/** Logo oficial do estúdio (lettering laranja). */
export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const h = { sm: 'h-6', md: 'h-7 sm:h-8', lg: 'h-12 sm:h-14' }[size]
  return (
    <img
      src="/brand/logo.webp"
      alt="ArtExtreme"
      width={900}
      height={200}
      className={`${h} w-auto drop-shadow-[0_0_14px_rgba(255,138,31,0.25)] select-none`}
      draggable={false}
    />
  )
}

/** Monograma usado em ícones e marcas d'água: "A" com escorrido de tinta. */
export function Mark({ size = 34, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id="ax-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d16bff" />
          <stop offset="0.55" stopColor="#ff8a1f" />
          <stop offset="1" stopColor="#ffd23f" />
        </linearGradient>
      </defs>
      <path
        fill="url(#ax-grad)"
        d="M27 8h10l15 38h-9l-3-8H24l-3 8h-9Zm-.5 22h11L32 15Z M14 46h5v7a2.5 2.5 0 0 1-5 0Z M45 46h5v11a2.5 2.5 0 0 1-5 0Z"
      />
    </svg>
  )
}
