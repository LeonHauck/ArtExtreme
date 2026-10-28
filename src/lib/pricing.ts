import type { Estimate, EstimateItem, Placement, PricingConfig, SizeTier, TattooRequest, TattooStyle } from '@/types'

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

/**
 * Valor de um único local:
 *   base da faixa × ajuste da área × ajuste do estilo × (cor ? ajuste de cor : 1)
 * respeitando o valor mínimo por tattoo.
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
  const raw = tier.basePrice * area.multiplier * style.multiplier * (color ? colorMultiplier : 1)
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
