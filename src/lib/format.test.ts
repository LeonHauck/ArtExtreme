import { describe, expect, it } from 'vitest'
import { parseMoney } from './format'

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
