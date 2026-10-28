import { useMemo } from 'react'
import { useStudio } from '@/store/studio'
import { estimate } from '@/lib/pricing'
import { placementLabel } from '@/components/body3d/zones'
import type { EstimateItem, Placement } from '@/types'

export interface ResolvedPlacement extends Placement {
  index: number
  label: string
  item: EstimateItem | undefined
}

/**
 * Estado derivado do rascunho do cliente: locais e estilo escolhidos,
 * o que falta preencher e a estimativa de valor (total e por local).
 */
export function useEstimate() {
  const pricing = useStudio((s) => s.pricing)
  const draft = useStudio((s) => s.draft)

  return useMemo(() => {
    // Ignora locais cuja área foi desativada/removida pelo artista
    const activeIds = new Set(pricing.areas.filter((a) => a.active).map((a) => a.id))
    const valid = draft.placements.filter((p) => activeIds.has(p.areaId))
    const style = pricing.styles.find((s) => s.id === draft.styleId && s.active)

    const missing: string[] = []
    if (!valid.length) missing.push('o local')
    if (!style) missing.push('o estilo')

    const result = style && valid.length ? estimate(pricing, { ...draft, placements: valid }) : null

    const placements: ResolvedPlacement[] = valid.map((p, i) => ({
      ...p,
      index: draft.placements.indexOf(p),
      label: placementLabel(p.zoneId, pricing.areas.find((a) => a.id === p.areaId)?.name),
      item: result?.items[i],
    }))

    return {
      draft: { ...draft, placements: valid },
      placements,
      style,
      missing,
      ready: missing.length === 0,
      estimate: result,
    }
  }, [pricing, draft])
}
