import { describe, expect, it } from 'vitest'
import { defaultPromo, formatCountdown, getPromo, isPromoLive, promoCountdown, promoHref } from './promo'
import type { StudioInfo } from '@/types'

const on = { ...defaultPromo, active: true }

describe('isPromoLive', () => {
  const now = new Date(2026, 10, 23, 15, 0) // 23/11/2026 15h
  it('desligado ou sem título não aparece', () => {
    expect(isPromoLive({ ...on, active: false }, now)).toBe(false)
    expect(isPromoLive({ ...on, title: '  ' }, now)).toBe(false)
  })
  it('respeita as datas, contando o dia final inteiro', () => {
    expect(isPromoLive({ ...on, startsOn: '2026-11-24' }, now)).toBe(false)
    expect(isPromoLive({ ...on, startsOn: '2026-11-23', endsOn: '2026-11-23' }, now)).toBe(true)
    expect(isPromoLive({ ...on, endsOn: '2026-11-22' }, now)).toBe(false)
    expect(isPromoLive(on, now)).toBe(true) // sem datas
  })
})

describe('contagem', () => {
  it('conta até 23:59:59 do último dia', () => {
    const c = promoCountdown('2026-11-30', new Date(2026, 10, 28, 12, 0, 0))!
    expect(c.days).toBe(2)
    expect(c.hours).toBe(11)
    expect(formatCountdown(c)).toBe('2d 11h 59m')
  })
  it('sem data final não tem contagem; depois do fim fica zerada', () => {
    expect(promoCountdown('')).toBeNull()
    expect(promoCountdown('2026-11-01', new Date(2026, 10, 23))!.totalMs).toBe(0)
  })
  it('perto do fim mostra minutos e segundos', () => {
    expect(formatCountdown({ days: 0, hours: 0, minutes: 4, seconds: 7, totalMs: 247000 })).toBe('04m 07s')
  })
})

describe('promoHref e padrão', () => {
  const studio = { whatsapp: '5532991809867' } as StudioInfo
  it('leva para o simulador, agendamento ou WhatsApp', () => {
    expect(promoHref(on, studio)).toEqual({ href: '/orcamento', external: false })
    expect(promoHref({ ...on, ctaLink: 'booking' }, studio).href).toBe('/agendar')
    const wa = promoHref({ ...on, ctaLink: 'whatsapp' }, studio)
    expect(wa.external).toBe(true)
    expect(decodeURIComponent(wa.href)).toContain('promoção Black Friday de 30%')
  })
  it('estúdio antigo sem promo usa o exemplo desligado', () => {
    expect(getPromo(studio)).toMatchObject({ active: false, title: 'Black Friday' })
  })
})
