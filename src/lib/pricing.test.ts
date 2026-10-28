import { describe, expect, it } from 'vitest'
import { estimate, findSizeTier } from './pricing'
import type { Placement, PricingConfig, TattooRequest } from '@/types'

const config: PricingConfig = {
  sizes: [
    { id: 'g', name: 'Grande', maxCm: 20, basePrice: 1000, hours: 4 },
    { id: 'p', name: 'Pequena', maxCm: 10, basePrice: 400, hours: 1.5 },
  ],
  areas: [
    { id: 'braco', name: 'Braço', multiplier: 1, active: true },
    { id: 'costela', name: 'Costela', multiplier: 1.5, active: true },
  ],
  styles: [{ id: 'real', name: 'Realismo', description: '', multiplier: 1.25, active: true }],
  settings: { minPrice: 300, colorMultiplier: 1.2, variance: 0.1, depositPercent: 0.3 },
}

const place = (patch: Partial<Placement> = {}): Placement => ({ zoneId: null, areaId: 'braco', sizeCm: 8, ...patch })

const req = (patch: Partial<TattooRequest> = {}): TattooRequest => ({
  placements: [place()],
  styleId: 'real',
  color: false,
  description: '',
  ...patch,
})

describe('findSizeTier', () => {
  it('escolhe a menor faixa que comporta o tamanho, mesmo fora de ordem', () => {
    expect(findSizeTier(config.sizes, 10)?.id).toBe('p')
    expect(findSizeTier(config.sizes, 11)?.id).toBe('g')
  })

  it('usa a maior faixa quando passa do limite', () => {
    expect(findSizeTier(config.sizes, 50)?.id).toBe('g')
  })
})

describe('estimate', () => {
  it('multiplica base × área × estilo', () => {
    // 400 × 1 × 1.25 = 500
    expect(estimate(config, req())?.value).toBe(500)
    // 400 × 1.5 × 1.25 = 750
    expect(estimate(config, req({ placements: [place({ areaId: 'costela' })] }))?.value).toBe(750)
  })

  it('aplica adicional de cor', () => {
    // 500 × 1.2 = 600
    expect(estimate(config, req({ color: true }))?.value).toBe(600)
  })

  it('gera faixa ± variância e sinal arredondados', () => {
    const e = estimate(config, req())!
    expect(e.low).toBe(450)
    expect(e.high).toBe(550)
    expect(e.deposit).toBe(150)
    expect(e.hours).toBe(1.5)
  })

  it('respeita o valor mínimo por local', () => {
    const cheap = { ...config, settings: { ...config.settings, minPrice: 800 } }
    const e = estimate(cheap, req())!
    expect(e.value).toBe(800)
    expect(e.low).toBe(800)
  })

  it('soma valores e tempos de vários locais', () => {
    const e = estimate(
      config,
      req({ placements: [place(), place({ areaId: 'costela', sizeCm: 15, zoneId: 'costela_e' })] }),
    )!
    // braço 8 cm: 500 · costela 15 cm: 1000 × 1.5 × 1.25 = 1875 → 1880
    expect(e.items.map((i) => i.value)).toEqual([500, 1880])
    expect(e.value).toBe(2380)
    expect(e.hours).toBe(5.5)
    expect(e.items[1].tierName).toBe('Grande')
  })

  it('sinaliza projetos acima da maior faixa', () => {
    expect(estimate(config, req({ placements: [place({ sizeCm: 25 })] }))?.oversized).toBe(true)
    expect(estimate(config, req({ placements: [place({ sizeCm: 20 })] }))?.oversized).toBe(false)
  })

  it('retorna null sem locais, ou com área/estilo inexistentes', () => {
    expect(estimate(config, req({ placements: [] }))).toBeNull()
    expect(estimate(config, req({ placements: [place({ areaId: 'x' })] }))).toBeNull()
    expect(estimate(config, req({ styleId: 'x' }))).toBeNull()
  })
})
