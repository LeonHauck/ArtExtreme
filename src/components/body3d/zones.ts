/**
 * Zonas clicáveis do boneco 3D. Cada zona aponta para uma área de preço (`areaId`).
 * Lados esquerdo/direito compartilham a mesma área de preço, mas ficam registrados
 * separadamente no pedido para o artista saber exatamente onde é.
 *
 * Membros e pescoço são divididos em frente/trás (ex.: coxa x posterior da coxa),
 * pois mudam dor, tempo de trabalho e, portanto, preço.
 *
 * Convenção: o boneco olha para +Z (para a câmera), na posição anatômica
 * (palmas para a frente). O lado ESQUERDO do boneco fica em +X.
 */
export interface Zone {
  id: string
  areaId: string
  label: string
}

const zones: Zone[] = []
const add = (id: string, areaId: string, label: string) => zones.push({ id, areaId, label })

/** Zona simétrica: cria as versões esquerda (_e) e direita (_d). */
const pair = (id: string, areaId: string, label: string) => {
  add(`${id}_e`, areaId, `${label} · esquerdo`)
  add(`${id}_d`, areaId, `${label} · direito`)
}

add('cabeca', 'cabeca', 'Cabeça')
add('pescoco', 'pescoco', 'Pescoço (frente)')
add('nuca', 'nuca', 'Nuca')
add('peito', 'peito', 'Peito')
add('costela_e', 'costela', 'Costela · esquerda')
add('costela_d', 'costela', 'Costela · direita')
add('costas', 'costas', 'Costas')
add('abdomen', 'abdomen', 'Abdômen')
add('lombar', 'lombar', 'Lombar')
pair('ombro', 'ombro', 'Ombro')
pair('biceps', 'braco', 'Braço (bíceps)')
pair('triceps', 'triceps', 'Braço (tríceps)')
pair('antebraco_int', 'antebraco', 'Antebraço interno')
pair('antebraco_ext', 'antebraco_externo', 'Antebraço externo')
add('mao_e', 'mao', 'Mão · esquerda')
add('mao_d', 'mao', 'Mão · direita')
add('coxa_e', 'coxa', 'Coxa (frente) · esquerda')
add('coxa_d', 'coxa', 'Coxa (frente) · direita')
add('posterior_e', 'posterior_coxa', 'Posterior da coxa · esquerda')
add('posterior_d', 'posterior_coxa', 'Posterior da coxa · direita')
add('canela_e', 'canela', 'Canela · esquerda')
add('canela_d', 'canela', 'Canela · direita')
add('panturrilha_e', 'panturrilha', 'Panturrilha · esquerda')
add('panturrilha_d', 'panturrilha', 'Panturrilha · direita')
pair('pe', 'pe', 'Pé')

export const ZONES: Record<string, Zone> = Object.fromEntries(zones.map((z) => [z.id, z]))

/** Rótulo para exibir: zona específica, ou o nome da área quando escolhida pela lista. */
export function placementLabel(zoneId: string | null, areaName: string | undefined): string {
  if (zoneId && ZONES[zoneId]) return ZONES[zoneId].label
  return areaName ?? '—'
}
