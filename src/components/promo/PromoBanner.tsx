import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, Flame, X } from 'lucide-react'
import { useStudio } from '@/store/studio'
import { formatCountdown, getPromo, isPromoLive, promoCountdown, promoHref, promoKey, type Countdown } from '@/lib/promo'
import type { PromoBanner, PromoTheme } from '@/types'
import { PromoDecor, SantaHat } from './PromoDecor'

/** Três visuais, todos dentro da paleta do estúdio. */
export const PROMO_THEMES: Record<PromoTheme, { label: string; box: string; glowA: string; glowB: string; accent: string; cta: string; strip: string; chip: string }> = {
  gold: {
    label: 'Dourado (Black Friday)',
    box: 'border-sun/40 bg-ink',
    glowA: 'bg-sun/25',
    glowB: 'bg-flame/20',
    accent: 'text-sun',
    cta: 'bg-sun text-ink hover:bg-sun/90',
    strip: 'bg-ink text-bone border-b border-sun/30',
    chip: 'border-sun/30 bg-sun/10',
  },
  rave: {
    label: 'Neon roxo',
    box: 'border-violet/50 bg-gradient-to-br from-violet-dark via-ink to-ink',
    glowA: 'bg-violet/40',
    glowB: 'bg-pink/25',
    accent: 'text-violet-light',
    cta: 'bg-violet text-white hover:bg-violet-light',
    strip: 'bg-gradient-to-r from-violet via-pink to-violet text-white',
    chip: 'border-violet/40 bg-violet/15',
  },
  xmas: {
    label: 'Natal (pisca-pisca e neve)',
    box: 'border-rose-500/50 bg-gradient-to-br from-rose-950 via-ink to-emerald-950',
    glowA: 'bg-rose-600/30',
    glowB: 'bg-emerald-500/20',
    accent: 'text-rose-400',
    cta: 'bg-rose-600 text-white hover:bg-rose-500',
    strip: 'bg-gradient-to-r from-rose-800 via-emerald-800 to-rose-800 text-white',
    chip: 'border-rose-400/40 bg-rose-500/10',
  },
  newyear: {
    label: 'Ano Novo (fogos)',
    box: 'border-sun/40 bg-gradient-to-br from-[#0b0820] via-ink to-violet-dark/60',
    glowA: 'bg-violet/30',
    glowB: 'bg-sun/20',
    accent: 'text-sun',
    cta: 'bg-sun text-ink hover:bg-sun/90',
    strip: 'bg-gradient-to-r from-ink via-violet-dark to-ink text-sun border-b border-sun/30',
    chip: 'border-sun/30 bg-sun/10',
  },
  easter: {
    label: 'Páscoa (coelho)',
    box: 'border-pink/40 bg-gradient-to-br from-pink/20 via-ink to-violet-dark/50',
    glowA: 'bg-pink/30',
    glowB: 'bg-sun/15',
    accent: 'text-pink',
    cta: 'bg-pink text-ink hover:bg-pink/90',
    strip: 'bg-gradient-to-r from-pink via-violet-light to-pink text-ink',
    chip: 'border-pink/40 bg-pink/10',
  },
  fire: {
    label: 'Fogo (laranja)',
    box: 'border-flame/50 bg-gradient-to-br from-flame/25 via-ink to-ink',
    glowA: 'bg-flame/35',
    glowB: 'bg-sun/20',
    accent: 'text-flame',
    cta: 'bg-flame text-ink hover:bg-flame/90',
    strip: 'bg-gradient-to-r from-flame via-sun to-flame text-ink',
    chip: 'border-flame/40 bg-flame/10',
  },
}

/** Relógio que atualiza a contagem (a cada segundo na última hora, senão a cada 30 s). */
function useCountdown(endsOn: string): Countdown | null {
  const [now, setNow] = useState(() => new Date())
  const c = promoCountdown(endsOn, now)
  const fast = c !== null && c.totalMs < 3_600_000
  useEffect(() => {
    if (!endsOn) return
    const t = setInterval(() => setNow(new Date()), fast ? 1000 : 30_000)
    return () => clearInterval(t)
  }, [endsOn, fast])
  return c
}

function Cta({ promo, className }: { promo: PromoBanner; className: string }) {
  const studio = useStudio((s) => s.studio)
  const { href, external } = promoHref(promo, studio)
  const body = (
    <>
      {promo.ctaLabel || 'Ver promoção'} <ArrowRight size={18} />
    </>
  )
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {body}
    </a>
  ) : (
    <Link to={href} className={className}>
      {body}
    </Link>
  )
}

function usePromo(override?: PromoBanner) {
  const studio = useStudio((s) => s.studio)
  return override ?? getPromo(studio)
}

/** Destaque grande da página inicial. `preview` mostra mesmo desligado (painel). */
export function PromoHero({ promo: override, preview = false }: { promo?: PromoBanner; preview?: boolean }) {
  const promo = usePromo(override)
  const countdown = useCountdown(promo.endsOn)
  if (!preview && (!isPromoLive(promo) || !promo.showHome)) return null
  const t = PROMO_THEMES[promo.theme] ?? PROMO_THEMES.gold
  const ended = countdown !== null && countdown.totalMs === 0

  return (
    <section className={preview ? '' : 'mx-auto max-w-6xl px-4 pt-14 sm:px-6'} aria-label={`Promoção ${promo.title}`}>
      <div className={`relative overflow-hidden rounded-2xl border p-6 sm:p-9 ${t.box}`}>
        <div className={`pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full blur-3xl ${t.glowA}`} />
        <div className={`pointer-events-none absolute -right-20 -bottom-28 h-72 w-72 rounded-full blur-3xl ${t.glowB}`} />
        <PromoDecor theme={promo.theme} />
        <div className="relative grid items-center gap-6 md:grid-cols-[auto_1fr_auto] md:gap-10">
          {promo.percent > 0 && (
            <p className={`relative font-display leading-none tracking-wide ${t.accent} ${promo.theme === 'xmas' ? 'pt-9 sm:pt-11' : ''}`}>
              {promo.theme === 'xmas' && <SantaHat className="absolute top-0 -left-3 h-12 w-14 -rotate-[16deg] sm:-left-4 sm:h-14 sm:w-16" />}
              <span className="text-7xl sm:text-8xl">{promo.percent}%</span>
              <span className="ml-2 align-top text-3xl sm:text-4xl">OFF</span>
            </p>
          )}
          <div className="min-w-0">
            <p className={`flex items-center gap-1.5 font-display text-sm tracking-[0.3em] uppercase ${t.accent}`}>
              <Flame size={15} /> Promoção
            </p>
            <h2 className="mt-1 font-display text-4xl tracking-wide text-bone sm:text-5xl">{promo.title || 'Título da promoção'}</h2>
            {promo.text && <p className="mt-2 max-w-xl text-bone/80">{promo.text}</p>}
            {countdown && !ended && (
              <div className="mt-4 flex flex-wrap items-center gap-2" aria-label={`Termina em ${formatCountdown(countdown)}`}>
                <span className="text-xs tracking-widest text-mute uppercase">Termina em</span>
                {[
                  [countdown.days, 'dias'],
                  [countdown.hours, 'horas'],
                  [countdown.minutes, 'min'],
                  ...(countdown.days === 0 ? [[countdown.seconds, 'seg'] as const] : []),
                ].map(([n, label]) => (
                  <span key={label} className={`flex min-w-12 flex-col items-center rounded-md border px-1.5 py-1 sm:min-w-14 sm:px-2 ${t.chip}`}>
                    <span className="font-display text-2xl leading-none tabular-nums text-bone">{String(n).padStart(2, '0')}</span>
                    <span className="text-[0.6rem] tracking-wider text-mute uppercase">{label}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <Cta promo={promo} className={`btn w-full md:w-auto ${t.cta}`} />
        </div>
      </div>
    </section>
  )
}

/** Faixa fina no topo de todas as páginas (o visitante pode fechar). */
export function PromoStrip({ promo: override, preview = false }: { promo?: PromoBanner; preview?: boolean }) {
  const promo = usePromo(override)
  const countdown = useCountdown(promo.endsOn)
  const [closed, setClosed] = useState(() => {
    try {
      return localStorage.getItem(promoKey(promo)) === '1'
    } catch {
      return false
    }
  })
  if (!preview && (!isPromoLive(promo) || !promo.showStrip || closed)) return null
  const t = PROMO_THEMES[promo.theme] ?? PROMO_THEMES.gold
  const { href, external } = promoHref(promo, useStudio.getState().studio)
  const content = (
    <>
      <Flame size={14} className="shrink-0" />
      <span className="truncate">
        <strong className="font-semibold">{promo.title}</strong>
        {promo.percent > 0 && <> · {promo.percent}% OFF</>}
        {countdown && countdown.totalMs > 0 && <span className="hidden sm:inline"> · termina em {formatCountdown(countdown)}</span>}
      </span>
      <ArrowRight size={14} className="shrink-0" />
    </>
  )

  return (
    <div className={`relative text-sm ${t.strip}`} role="region" aria-label="Promoção">
      <div className="mx-auto flex h-9 max-w-6xl items-center justify-center px-10">
        {external ? (
          <a href={href} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 hover:underline">
            {content}
          </a>
        ) : (
          <Link to={href} className="flex min-w-0 items-center gap-2 hover:underline">
            {content}
          </Link>
        )}
      </div>
      {!preview && (
        <button
          type="button"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 opacity-70 hover:opacity-100"
          aria-label="Fechar aviso da promoção"
          onClick={() => {
            setClosed(true)
            try {
              localStorage.setItem(promoKey(promo), '1')
            } catch {
              /* sem armazenamento: fecha só agora */
            }
          }}
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}
