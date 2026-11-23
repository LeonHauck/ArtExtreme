import { describe, expect, it } from 'vitest'
import { applyCouponDiscount, normalizeCode, removeCouponDiscount } from './coupons'
import type { Estimate } from '@/types'

const est: Estimate = { low: 450, high: 550, value: 500, hours: 2, deposit: 200, oversized: false, items: [] }

describe('cupom', () => {
  it('normaliza o código digitado', () => {
    expect(normalizeCode('  art 40!')).toBe('ART40')
    expect(normalizeCode('bf-2026_x')).toBe('BF-2026_X')
  })
  it('aplica o desconto em tudo e o sinal acompanha (mesma proporção)', () => {
    const e = applyCouponDiscount(est, 40)
    expect(e).toMatchObject({ low: 270, high: 330, value: 300, deposit: 120 })
    expect(e.original).toEqual({ low: 450, high: 550, value: 500, deposit: 200 })
  })
  it('sinal de 100% continua sendo o valor todo', () => {
    expect(applyCouponDiscount({ ...est, deposit: 500 }, 30)).toMatchObject({ value: 350, deposit: 350 })
  })
  it('trocar de cupom parte sempre do valor original (não acumula)', () => {
    expect(applyCouponDiscount(applyCouponDiscount(est, 40), 10).value).toBe(450)
  })
  it('tirar o cupom volta ao valor original', () => {
    expect(removeCouponDiscount(applyCouponDiscount(est, 40))).toEqual(est)
  })
})
