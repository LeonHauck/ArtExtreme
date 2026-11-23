import type { CSSProperties } from 'react'
import type { PromoTheme } from '@/types'

/**
 * Enfeites dos banners temáticos. Ficam atrás do conteúdo, não recebem toque
 * e param de se mexer para quem pediu "reduzir movimento" no aparelho.
 */

// Posições fixas (parecem aleatórias, mas não mudam a cada renderização)
const rand = (i: number, seed: number) => {
  const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const LIGHT_COLORS = ['#ff4d6d', '#ffd23f', '#34d399', '#60a5fa', '#ff8a1f']

/** Fio de pisca-pisca no topo, com lâmpadas piscando em sequência. */
function ChristmasLights() {
  const bulbs = 18
  return (
    <div className="absolute inset-x-0 top-0 h-10">
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 40" preserveAspectRatio="none" aria-hidden>
        <path d="M0 6 Q 22 22 44 8 T 88 8 T 132 8 T 176 8 T 220 8 T 264 8 T 308 8 T 352 8 T 400 8" fill="none" stroke="rgba(243,238,250,0.35)" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      </svg>
      {Array.from({ length: bulbs }, (_, i) => {
        const left = 3 + (i * 94) / (bulbs - 1)
        const top = 10 + Math.abs(Math.sin((left / 100) * Math.PI * 9)) * 9
        const color = LIGHT_COLORS[i % LIGHT_COLORS.length]
        return (
          <span
            key={i}
            className="promo-twinkle absolute h-3 w-2 rounded-b-full rounded-t-sm"
            style={{ left: `${left}%`, top, backgroundColor: color, color, animationDelay: `${(i % 6) * 0.27}s` }}
          />
        )
      })}
    </div>
  )
}

function Snow() {
  return (
    <>
      {Array.from({ length: 28 }, (_, i) => {
        const size = 2 + rand(i, 1) * 3.5
        return (
          <span
            key={i}
            className="promo-snow absolute -top-3 rounded-full bg-white"
            style={
              {
                left: `${rand(i, 2) * 100}%`,
                width: size,
                height: size,
                opacity: 0.45 + rand(i, 3) * 0.45,
                animationDuration: `${7 + rand(i, 4) * 7}s`,
                animationDelay: `-${rand(i, 5) * 12}s`,
                '--drift': `${(rand(i, 6) - 0.5) * 40}px`,
              } as CSSProperties
            }
          />
        )
      })}
    </>
  )
}

/** Gorro do Papai Noel (vai em cima do número do desconto). */
export function SantaHat({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 100" aria-hidden>
      <path d="M18 78 C 30 40, 58 12, 96 22 C 86 34, 84 52, 92 74 Z" fill="#e11d48" />
      <path d="M40 40 C 55 26, 75 20, 96 22 C 90 28, 86 34, 84 42 C 70 36, 55 36, 40 40 Z" fill="#be123c" opacity="0.55" />
      <rect x="10" y="70" width="92" height="20" rx="10" fill="#f8f5fc" />
      <circle cx="100" cy="22" r="11" fill="#f8f5fc" />
    </svg>
  )
}

const BURST_COLORS = ['#ffd23f', '#ff4fd8', '#d16bff', '#ff8a1f']

/** Fogos de artifício estourando em pontos diferentes. */
function Fireworks() {
  const bursts = [
    // Nos cantos e nas bordas, longe do texto, do contador e do botão
    { left: '90%', top: '-6%', size: 100, delay: 0 },
    { left: '72%', top: '-10%', size: 64, delay: 1.3 },
    { left: '97%', top: '62%', size: 72, delay: 0.7 },
    { left: '3%', top: '-8%', size: 70, delay: 1.9 },
    { left: '62%', top: '80%', size: 58, delay: 2.4 },
  ]
  return (
    <>
      {bursts.map((b, i) => {
        const color = BURST_COLORS[i % BURST_COLORS.length]
        return (
          <svg
            key={i}
            className="promo-firework absolute opacity-80"
            style={{ left: b.left, top: b.top, width: b.size, height: b.size, marginLeft: -b.size / 2, animationDelay: `${b.delay}s` }}
            viewBox="-50 -50 100 100"
            aria-hidden
          >
            {Array.from({ length: 14 }, (_, r) => {
              const a = (r / 14) * Math.PI * 2
              return (
                <g key={r}>
                  <line x1={Math.cos(a) * 12} y1={Math.sin(a) * 12} x2={Math.cos(a) * 38} y2={Math.sin(a) * 38} stroke={color} strokeWidth="2.2" strokeLinecap="round" />
                  <circle cx={Math.cos(a) * 45} cy={Math.sin(a) * 45} r="2.4" fill={color} />
                </g>
              )
            })}
          </svg>
        )
      })}
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className="promo-twinkle absolute h-1 w-1 rounded-full"
          style={{ left: `${rand(i, 7) * 100}%`, top: `${rand(i, 8) * 100}%`, backgroundColor: '#ffd23f', color: '#ffd23f', animationDelay: `${rand(i, 9) * 1.6}s` }}
        />
      ))}
    </>
  )
}

/** Coelho estilizado em traço neon. */
export function Bunny({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 120" fill="none" aria-hidden>
      <g stroke="#ff4fd8" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M36 52 C 26 30, 26 8, 34 4 C 42 0, 46 24, 46 48" />
        <path d="M64 52 C 74 30, 76 8, 68 4 C 60 0, 54 24, 54 48" />
        <path d="M37 40 C 34 28, 34 16, 36 12" stroke="#ffd23f" strokeWidth="2" opacity="0.8" />
        <path d="M63 40 C 66 28, 66 16, 64 12" stroke="#ffd23f" strokeWidth="2" opacity="0.8" />
        <ellipse cx="50" cy="74" rx="27" ry="24" fill="rgba(255,79,216,0.12)" />
        <path d="M44 80 Q 50 86 56 80" />
        <path d="M24 76 L 38 78 M24 84 L 38 82 M76 76 L 62 78 M76 84 L 62 82" stroke="#f3eefa" strokeWidth="1.6" opacity="0.7" />
      </g>
      <circle cx="40" cy="70" r="3.2" fill="#f3eefa" />
      <circle cx="60" cy="70" r="3.2" fill="#f3eefa" />
      <path d="M47 77 L 53 77 L 50 81 Z" fill="#ffd23f" />
    </svg>
  )
}

/** Ovinho de Páscoa decorado. */
function Egg({ color, className = '', style }: { color: string; className?: string; style?: CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 40 52" aria-hidden>
      <ellipse cx="20" cy="28" rx="16" ry="22" fill={color} opacity="0.9" />
      <path d="M5 24 L 11 20 L 17 24 L 23 20 L 29 24 L 35 20" stroke="#0f0d14" strokeWidth="2" fill="none" opacity="0.5" />
      <path d="M5 34 Q 20 40 35 34" stroke="#f3eefa" strokeWidth="2" fill="none" opacity="0.6" />
    </svg>
  )
}

function Easter() {
  return (
    <>
      <Bunny className="promo-bob absolute top-3 right-3 h-24 w-20 opacity-90 sm:right-6 md:h-20 md:w-16" />
      {/* Ovinhos no canto de baixo (no celular o botão ocupa esse espaço) */}
      <div className="absolute right-6 bottom-2 hidden items-end gap-1 md:flex">
        <Egg color="#ffd23f" className="h-8 w-6 -rotate-12 opacity-80" />
        <Egg color="#d16bff" className="h-10 w-8 rotate-6 opacity-80" />
        <Egg color="#ff8a1f" className="h-7 w-5 rotate-12 opacity-70" />
      </div>
    </>
  )
}

/** Brilho de 4 pontas (estrelinha prateada). */
function Sparkle({ style }: { style: CSSProperties }) {
  return (
    <svg className="promo-twinkle absolute" style={style} viewBox="0 0 20 20" aria-hidden>
      <path d="M10 0 C 11 7, 13 9, 20 10 C 13 11, 11 13, 10 20 C 9 13, 7 11, 0 10 C 7 9, 9 7, 10 0 Z" fill="#f4f4f5" />
    </svg>
  )
}

/** Fileira de lâmpadas prateadas (letreiro de show), acendendo alternado. */
function SilverMarquee({ edge }: { edge: 'top' | 'bottom' }) {
  const n = 26
  return (
    <div className={`absolute inset-x-3 flex justify-between ${edge === 'top' ? 'top-2' : 'bottom-2'}`}>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          className="promo-twinkle h-1.5 w-1.5 rounded-full bg-zinc-100"
          style={{ color: '#ffffff', animationDelay: `${(i % 2) * 0.8 + (edge === 'bottom' ? 0.4 : 0)}s`, animationDuration: '1.6s' }}
        />
      ))}
    </div>
  )
}

function BlackFriday() {
  return (
    <>
      {/* Feixe de luz passando devagar */}
      <div className="promo-sweep absolute -top-1/2 left-0 h-[200%] w-24 bg-gradient-to-r from-transparent via-white/10 to-transparent blur-md" />
      <SilverMarquee edge="top" />
      <SilverMarquee edge="bottom" />
      {Array.from({ length: 16 }, (_, i) => {
        const size = 6 + rand(i, 11) * 10
        return (
          <Sparkle
            key={i}
            style={{
              left: `${rand(i, 12) * 100}%`,
              top: `${12 + rand(i, 13) * 76}%`,
              width: size,
              height: size,
              opacity: 0.35 + rand(i, 14) * 0.5,
              color: '#ffffff',
              animationDelay: `${rand(i, 15) * 2}s`,
              animationDuration: `${1.4 + rand(i, 16) * 1.6}s`,
            }}
          />
        )
      })}
    </>
  )
}

export const isSeasonal = (theme: PromoTheme) => theme === 'xmas' || theme === 'newyear' || theme === 'easter' || theme === 'blackfriday'

/** Camada de enfeites atrás do conteúdo do banner. */
export function PromoDecor({ theme }: { theme: PromoTheme }) {
  if (!isSeasonal(theme)) return null
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {theme === 'xmas' && (
        <>
          <Snow />
          <ChristmasLights />
        </>
      )}
      {theme === 'newyear' && <Fireworks />}
      {theme === 'easter' && <Easter />}
      {theme === 'blackfriday' && <BlackFriday />}
    </div>
  )
}
