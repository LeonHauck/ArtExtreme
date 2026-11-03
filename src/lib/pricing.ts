import type { Estimate, EstimateItem, Placement, PricingConfig, PricingSettings, SizeTier, TattooRequest, TattooStyle } from '@/types'

/** Arredonda para a dezena mais próxima: valores "de balcão". */
const roundTo10 = (n: number) => Math.round(n / 10) * 10

/** Faixas ordenadas do menor para o maior limite. */
export function sortedSizes(sizes: SizeTier[]): SizeTier[] {
  return [...sizes].sort((a, b) => a.maxCm - b.maxCm)
}

/** Encontra a faixa de tamanho para uma medida em cm. Acima da maior, usa a maior. */
export function findSizeTier(sizes: SizeTier[], cm: number): SizeTier | undefined {
  const ordered = sortedSizes(sizes)
  return ordered.find((s) => cm <= s.maxCm) ?? ordered.at(-1)
}

/** Menor tamanho que o cliente consegue escolher no simulador. */
export const MIN_SIZE_CM = 2

export const DEFAULT_PRICE_PER_CM = 25

export const isPerCm = (s: PricingSettings) => s.sizeMode === 'perCm'
export const pricePerCm = (s: PricingSettings) => s.pricePerCm ?? DEFAULT_PRICE_PER_CM

/** Valor do tamanho antes dos ajustes: o da faixa, ou cm × valor por cm. */
export function sizeBase(config: PricingConfig, tier: SizeTier, cm: number): number {
  return isPerCm(config.settings) ? cm * pricePerCm(config.settings) : tier.basePrice
}

/** "Tattoos a partir de R$ X": a menor tattoo possível, sem ajustes. */
export function startingPrice(config: PricingConfig): number {
  const { minPrice } = config.settings
  const smallest = sortedSizes(config.sizes)[0]
  if (!smallest) return minPrice
  return Math.max(minPrice, roundTo10(sizeBase(config, smallest, MIN_SIZE_CM)))
}

/**
 * Valor de um único local:
 *   tamanho (base da faixa, ou cm × valor por cm) × ajuste da área × ajuste do estilo × (cor ? ajuste de cor : 1)
 * respeitando o valor mínimo por tattoo. A faixa sempre define a duração da sessão.
 */
export function estimatePlacement(
  config: PricingConfig,
  p: Placement,
  style: TattooStyle,
  color: boolean,
): EstimateItem | null {
  const tier = findSizeTier(config.sizes, p.sizeCm)
  const area = config.areas.find((a) => a.id === p.areaId)
  if (!tier || !area) return null

  const { minPrice, colorMultiplier } = config.settings
  const raw = sizeBase(config, tier, p.sizeCm) * area.multiplier * style.multiplier * (color ? colorMultiplier : 1)
  const largest = sortedSizes(config.sizes).at(-1)!

  return {
    areaId: p.areaId,
    zoneId: p.zoneId,
    sizeCm: p.sizeCm,
    tierName: tier.name,
    value: Math.max(minPrice, roundTo10(raw)),
    hours: tier.hours,
    oversized: p.sizeCm > largest.maxCm,
  }
}

/**
 * Estimativa do pedido inteiro: soma dos locais marcados.
 * O cliente vê uma faixa de ± variância em volta do total.
 */
export function estimate(config: PricingConfig, req: TattooRequest): Estimate | null {
  const style = config.styles.find((s) => s.id === req.styleId)
  if (!style || req.placements.length === 0) return null

  const items: EstimateItem[] = []
  for (const p of req.placements) {
    const item = estimatePlacement(config, p, style, req.color)
    if (!item) return null
    items.push(item)
  }

  const { minPrice, variance, depositPercent } = config.settings
  const value = items.reduce((sum, i) => sum + i.value, 0)
  const hours = items.reduce((sum, i) => sum + i.hours, 0)

  return {
    value,
    low: Math.max(minPrice, roundTo10(value * (1 - variance))),
    high: roundTo10(value * (1 + variance)),
    hours,
    deposit: roundTo10(value * depositPercent),
    oversized: items.some((i) => i.oversized),
    items,
  }
}
