import { describe, expect, it } from 'vitest'
import { formatPriceRange, parseMoney } from './format'

describe('parseMoney', () => {
  it('entende os jeitos comuns de digitar valor', () => {
    expect(parseMoney('450')).toBe(450)
    expect(parseMoney('1.500')).toBe(1500)
    expect(parseMoney('1.500,50')).toBe(1500.5)
    expect(parseMoney('350,5')).toBe(350.5)
    expect(parseMoney('350.5')).toBe(350.5)
    expect(parseMoney('R$ 2.000')).toBe(2000)
    expect(parseMoney('  ')).toBeNull()
    expect(parseMoney('abc')).toBeNaN()
  })
})

describe('formatPriceRange', () => {
  it('mostra a faixa, ou um valor só quando a margem é zero', () => {
    expect(formatPriceRange(340, 460).replace(/\s/g, ' ')).toBe('R$ 340 – R$ 460')
    expect(formatPriceRange(400, 400).replace(/\s/g, ' ')).toBe('R$ 400')
    expect(formatPriceRange(340, 460, ' a ').replace(/\s/g, ' ')).toBe('R$ 340 a R$ 460')
  })
})
