import type { Booking, CoverType, Estimate } from '@/types'

/**
 * Triagem do pedido: a maioria vai direto para a agenda.
 * Cobertura, reforma e fechamento (acima da maior faixa) passam antes por uma
 * avaliação do artista: chegam com foto, sem data, e ele agenda depois.
 */

export const COVER_LABEL: Record<CoverType, string> = { cover: 'Cobertura', rework: 'Reforma' }

export type EvaluationReason = 'cover' | 'rework' | 'oversized'

export function evaluationReason(cover: CoverType | null, estimate: Pick<Estimate, 'oversized'> | null): EvaluationReason | null {
  if (cover) return cover
  if (estimate?.oversized) return 'oversized'
  return null
}

export const REASON_TEXT: Record<EvaluationReason, { title: string; text: string; photo: string; photoRequired: boolean }> = {
  cover: {
    title: 'Cobertura passa por uma avaliação',
    text: 'Cobrir uma tattoo antiga depende do tamanho, da cor e de quanto a pele já está marcada. O Mike olha a foto e te chama no WhatsApp com o valor e as datas.',
    photo: 'Foto da tattoo que você quer cobrir',
    photoRequired: true,
  },
  rework: {
    title: 'Reforma passa por uma avaliação',
    text: 'Para reformar, o Mike precisa ver como a tattoo está hoje. Ele olha a foto e te chama no WhatsApp com o valor e as datas.',
    photo: 'Foto da tattoo que você quer reformar',
    photoRequired: true,
  },
  oversized: {
    title: 'Projeto grande passa por uma avaliação',
    text: 'Fechamentos e peças grandes costumam ser feitos em mais de uma sessão. O Mike avalia o projeto e te chama no WhatsApp para combinar valor e datas.',
    photo: 'Referência do projeto',
    photoRequired: false,
  },
}

export const isEvaluation = (b: Pick<Booking, 'kind'>) => b.kind === 'evaluation'
/** Avaliação ainda aberta: o artista precisa responder. */
export const isOpenEvaluation = (b: Pick<Booking, 'kind' | 'status'>) => b.kind === 'evaluation' && b.status === 'pending'

/** Dicas para quem vai fazer a primeira tattoo (tela de sucesso e mensagem de confirmação). */
export const FIRST_TATTOO_TIPS = [
  'Durma bem na noite anterior e faça uma boa refeição antes de vir.',
  'Evite bebida alcoólica na véspera e no dia.',
  'Venha com uma roupa confortável, que deixe a região livre.',
  'Pode trazer água, um lanche e fone de ouvido. Qualquer dúvida, é só perguntar.',
]
