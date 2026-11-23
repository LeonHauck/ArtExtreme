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

/** Braço em cápsula (contorno + preenchimento), no traço dos mascotes. */
function limb(x1: number, y1: number, x2: number, y2: number, w: number, fill: string) {
  return (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1c1418" strokeWidth={w + 6.4} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={fill} strokeWidth={w} strokeLinecap="round" />
    </>
  )
}

/**
 * Papai Noel tatuado (desenho próprio, traço de flash de tattoo): manga
 * arregaçada e os dois antebraços tatuados (coração e estrela), braços para baixo.
 */
export function TattooSanta({ className = '' }: { className?: string }) {
  const line = '#1c1418'
  const red = '#dc2639'
  const redDark = '#a5162a'
  const fur = '#f8f5fc'
  const skin = '#f5c6a5'
  const glove = '#3b3238'
  return (
    <svg className={className} viewBox="0 0 200 262" aria-hidden>
      <g stroke={line} strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
        {/* Pernas e botas */}
        <rect x="62" y="224" width="28" height="22" fill={redDark} />
        <rect x="102" y="224" width="28" height="22" fill={redDark} />
        <path d="M56 244 H92 V254 Q92 258 88 258 H52 Q48 258 50 252 Q52 244 56 244 Z" fill={line} />
        <path d="M100 244 H136 Q140 244 142 252 Q144 258 140 258 H104 Q100 258 100 254 Z" fill={line} />
        {/* Casaco */}
        <path d="M60 146 C 44 166, 40 206, 50 228 L 142 228 C 152 206, 148 166, 132 146 Z" fill={red} />
        <rect x="88" y="150" width="16" height="74" fill={fur} />
        <rect x="46" y="218" width="100" height="14" rx="7" fill={fur} />
        <rect x="46" y="194" width="100" height="12" fill={line} />
        <rect x="86" y="191" width="20" height="18" rx="2" fill="none" stroke="#f5c542" strokeWidth="3.5" />
        {/* Braços para baixo, mangas arregaçadas e antebraços tatuados */}
        {/* Antebraço por baixo, manga vermelha inteira por cima, punho branco no fim da manga */}
        {limb(55, 176, 42, 212, 20, skin)}
        {limb(66, 150, 58, 170, 24, red)}
        <rect x="-15" y="-5.5" width="30" height="11" rx="5.5" transform="translate(55 180) rotate(20)" fill={fur} />
        {limb(137, 176, 150, 212, 20, skin)}
        {limb(126, 150, 134, 170, 24, red)}
        <rect x="-15" y="-5.5" width="30" height="11" rx="5.5" transform="translate(137 180) rotate(-20)" fill={fur} />
        {/* Tattoos: coração no braço esquerdo, estrela no direito */}
        <path d="M0 -2 c -2 -5, -10 -4, -9 2 c 1 4, 6 7, 9 10 c 3 -3, 8 -6, 9 -10 c 1 -6, -7 -7, -9 -2 Z" transform="translate(49 196) rotate(20) scale(0.75)" fill={red} strokeWidth="2.2" />
        <path d="M0 -6 l 1.8 3.8 l 4.2 .5 l -3.1 2.9 l .8 4.1 l -3.7 -2 l -3.7 2 l .8 -4.1 l -3.1 -2.9 l 4.2 -.5 Z" transform="translate(144 197) rotate(-20)" fill={line} strokeWidth="1" />
        <circle cx="41" cy="217" r="10" fill={glove} />
        <circle cx="151" cy="217" r="10" fill={glove} />
        {/* Rosto */}
        <ellipse cx="96" cy="96" rx="28" ry="24" fill={skin} />
        {/* Barba */}
        <path
          d="M64 96 C 54 108, 52 128, 60 142 C 64 156, 76 166, 86 164 C 92 172, 102 172, 108 164 C 118 166, 130 156, 134 142 C 142 128, 140 108, 128 96 C 122 112, 70 112, 64 96 Z"
          fill={fur}
        />
        <path d="M84 120 Q 96 136 108 120 Z" fill="#7f1d2d" />
        <path d="M96 110 C 86 103, 73 105, 68 114 C 77 119, 90 117, 96 112 C 102 117, 115 119, 124 114 C 119 105, 106 103, 96 110 Z" fill={fur} />
        <circle cx="96" cy="102" r="7" fill="#ee9b8a" />
        <path d="M78 92 Q 84 85 90 92 M102 92 Q 108 85 114 92" fill="none" strokeWidth="3.4" />
        {/* Gorro */}
        <path d="M54 70 C 60 34, 96 14, 132 22 C 152 27, 166 42, 168 60 C 160 54, 150 50, 140 52 L 140 70 Z" fill={red} />
        <rect x="48" y="62" width="98" height="18" rx="9" fill={fur} />
        <circle cx="168" cy="64" r="11" fill={fur} />
      </g>
      {/* Bochechas */}
      <circle cx="76" cy="101" r="6" fill="#f28b8b" opacity="0.75" />
      <circle cx="116" cy="101" r="6" fill="#f28b8b" opacity="0.75" />
    </svg>
  )
}

const BURST_COLORS =['#ffd23f', '#ff4fd8', '#d16bff', '#ff8a1f']

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

/**
 * Coelho tatuador (desenho próprio, mesmo traço do Papai Noel): bandana,
 * piscadinha e os dois braços tatuados (coração e cenoura), para baixo.
 */
export function TattooBunny({ className = '' }: { className?: string }) {
  const line = '#1c1418'
  const fur = '#f8f5fc'
  const pink = '#ffb3d9'
  return (
    <svg className={className} viewBox="0 0 200 262" aria-hidden>
      <g stroke={line} strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round">
        {/* Orelhas (uma dobrada) */}
        <path d="M70 76 C 56 44, 58 8, 75 5 C 92 2, 93 42, 88 76 Z" fill={fur} />
        <path d="M75 64 C 68 42, 69 18, 76 15 C 84 14, 84 42, 82 64 Z" fill={pink} strokeWidth="2" />
        <path d="M104 76 C 103 46, 112 20, 130 17 C 148 14, 154 30, 140 36 C 127 40, 121 54, 121 78 Z" fill={fur} />
        <path d="M110 68 C 110 48, 116 30, 129 27 C 138 26, 138 31, 131 33 C 120 37, 115 50, 115 68 Z" fill={pink} strokeWidth="2" />
        {/* Pés */}
        <ellipse cx="74" cy="242" rx="21" ry="11" fill={fur} />
        <ellipse cx="118" cy="242" rx="21" ry="11" fill={fur} />
        {/* Corpo e barriga */}
        <path d="M66 140 C 52 160, 50 206, 60 230 L 132 230 C 142 206, 140 160, 126 140 Z" fill={fur} />
        <ellipse cx="96" cy="192" rx="24" ry="30" fill="#fde4f0" strokeWidth="2.2" />
        {/* Braços para baixo, tatuados */}
        {limb(70, 150, 52, 200, 22, fur)}
        {limb(122, 150, 140, 200, 22, fur)}
        {/* Tattoo: coração no braço esquerdo */}
        <path d="M0 -2 c -2 -5, -10 -4, -9 2 c 1 4, 6 7, 9 10 c 3 -3, 8 -6, 9 -10 c 1 -6, -7 -7, -9 -2 Z" transform="translate(61 176) rotate(20) scale(0.8)" fill="#ff4fd8" strokeWidth="2" />
        {/* Tattoo: cenoura no braço direito */}
        <g transform="translate(131 178) rotate(-20)">
          <path d="M-4 -8 L 4 -8 L 0 10 Z" fill="#ff8a1f" strokeWidth="1.6" />
          <path d="M0 -8 l -4 -6 M0 -8 l 0 -7 M0 -8 l 4 -6" fill="none" stroke="#16a34a" strokeWidth="2" />
        </g>
        <circle cx="50" cy="204" r="10" fill={fur} />
        <circle cx="142" cy="204" r="10" fill={fur} />
        {/* Cabeça */}
        <ellipse cx="96" cy="102" rx="36" ry="32" fill={fur} />
        {/* Bandana */}
        <path d="M66 128 Q 96 146 126 128 L 122 140 Q 96 156 70 140 Z" fill="#ff4fd8" />
        <path d="M112 144 L 124 158 L 104 152 Z" fill="#ff4fd8" strokeWidth="2.4" />
        {/* Olho aberto e piscadinha */}
        <circle cx="82" cy="98" r="5.5" fill={line} stroke="none" />
        <circle cx="84" cy="96" r="1.8" fill="#fff" stroke="none" />
        <path d="M104 99 Q 110 92 116 99" fill="none" strokeWidth="3.4" />
        {/* Focinho, dentinhos e bigodes */}
        <path d="M91 108 L 101 108 L 96 114 Z" fill="#ff7ab8" strokeWidth="2.2" />
        <path d="M96 114 Q 96 119 89 120 M96 114 Q 96 119 103 120" fill="none" strokeWidth="2.4" />
        <path d="M92 120 H100 V127 Q100 128 99 128 H93 Q92 128 92 127 Z M96 120 V128" fill="#fff" strokeWidth="2" />
        <path d="M60 106 L 76 108 M60 114 L 76 112 M132 106 L 116 108 M132 114 L 116 112" fill="none" strokeWidth="1.6" />
      </g>
      {/* Bochechas */}
      <circle cx="74" cy="110" r="6" fill="#f28b8b" opacity="0.7" />
      <circle cx="118" cy="110" r="6" fill="#f28b8b" opacity="0.7" />
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
      {/* Ovinhos embaixo do desconto (no celular o botão ocupa esse espaço) */}
      <div className="absolute bottom-3 left-8 hidden items-end gap-1 md:flex">
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
