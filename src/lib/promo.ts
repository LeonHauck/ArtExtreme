import type { PromoBanner, StudioInfo } from '@/types'
import { toISODate } from './format'
import { waLink } from './whatsapp'

/** Exemplo pronto (desligado) para o Mike só ajustar e ligar. */
export const defaultPromo: PromoBanner = {
  active: false,
  title: 'Black Friday',
  percent: 30,
  text: 'Desconto especial para tattoos agendadas durante a promoção.',
  ctaLabel: 'Quero meu desconto',
  ctaLink: 'simulator',
  theme: 'gold',
  startsOn: '',
  endsOn: '',
  showHome: true,
  showStrip: true,
}

export const getPromo = (studio: StudioInfo): PromoBanner => ({ ...defaultPromo, ...studio.promo })

/** O banner aparece agora? (ligado e dentro das datas, contando o dia final inteiro) */
export function isPromoLive(p: PromoBanner, now = new Date()): boolean {
  if (!p.active || !p.title.trim()) return false
  const today = toISODate(now)
  if (p.startsOn && today < p.startsOn) return false
  if (p.endsOn && today > p.endsOn) return false
  return true
}

export interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
}

/** Quanto falta para acabar (até 23:59:59 do dia final). Sem data final = null. */
export function promoCountdown(endsOn: string, now = new Date()): Countdown | null {
  if (!endsOn) return null
  const [y, m, d] = endsOn.split('-').map(Number)
  const end = new Date(y, m - 1, d, 23, 59, 59, 999)
  return splitMs(end.getTime() - now.getTime())
}

export function splitMs(ms: number): Countdown {
  const totalMs = Math.max(0, ms)
  const s = Math.floor(totalMs / 1000)
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60, totalMs }
}

/** "2d 05h 12m" / "05h 12m" / "12m 30s" */
export function formatCountdown(c: Countdown): string {
  const p = (n: number) => String(n).padStart(2, '0')
  if (c.days > 0) return `${c.days}d ${p(c.hours)}h ${p(c.minutes)}m`
  if (c.hours > 0) return `${p(c.hours)}h ${p(c.minutes)}m`
  return `${p(c.minutes)}m ${p(c.seconds)}s`
}

/** Para onde o botão do banner leva. */
export function promoHref(p: PromoBanner, studio: StudioInfo): { href: string; external: boolean } {
  if (p.ctaLink === 'whatsapp') {
    const pct = p.percent > 0 ? ` de ${p.percent}%` : ''
    return { href: waLink(studio.whatsapp, `Olá! Vi a promoção ${p.title}${pct} no site e quero saber mais.`), external: true }
  }
  return { href: p.ctaLink === 'booking' ? '/agendar' : '/orcamento', external: false }
}

/** Chave para lembrar que o visitante fechou a faixa desta promoção. */
export const promoKey = (p: PromoBanner) => `ae-promo-closed:${p.title}|${p.percent}|${p.endsOn}`
