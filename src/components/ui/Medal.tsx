const METAL = {
  1: { fill: '#ffd23f', ring: '#b8860b', label: '1º lugar' },
  2: { fill: '#d9dbe4', ring: '#8a8d99', label: '2º lugar' },
  3: { fill: '#e0965a', ring: '#9a5a2a', label: '3º lugar' },
} as const

/** Medalha com fita: ouro, prata ou bronze. */
export function Medal({ place, size = 30 }: { place: 1 | 2 | 3; size?: number }) {
  const m = METAL[place]
  return (
    <svg width={size} height={size * 1.25} viewBox="0 0 32 40" role="img" aria-label={m.label}>
      <path d="M8 0h7l3 14H11Z" fill="#be38f3" />
      <path d="M24 0h-7l-3 14h7Z" fill="#ff8a1f" />
      <circle cx="16" cy="25" r="12" fill={m.fill} stroke={m.ring} strokeWidth="2" />
      <circle cx="16" cy="25" r="8" fill="none" stroke={m.ring} strokeOpacity="0.45" strokeWidth="1" />
      <text x="16" y="29.5" textAnchor="middle" fontSize="12" fontWeight="800" fill="#2a1a00" fontFamily="system-ui, sans-serif">
        {place}
      </text>
    </svg>
  )
}
