import { describe, expect, it } from 'vitest'
import { evaluationReason, isOpenEvaluation } from './triage'

describe('triagem', () => {
  it('pedido comum vai direto para a agenda', () => {
    expect(evaluationReason(null, { oversized: false })).toBeNull()
  })
  it('cobertura e reforma viram avaliação', () => {
    expect(evaluationReason('cover', { oversized: false })).toBe('cover')
    expect(evaluationReason('rework', null)).toBe('rework')
  })
  it('fechamento (acima da maior faixa) vira avaliação', () => {
    expect(evaluationReason(null, { oversized: true })).toBe('oversized')
  })
  it('a resposta do cliente vem antes do tamanho', () => {
    expect(evaluationReason('cover', { oversized: true })).toBe('cover')
  })
  it('avaliação aberta é só a pendente', () => {
    expect(isOpenEvaluation({ kind: 'evaluation', status: 'pending' })).toBe(true)
    expect(isOpenEvaluation({ kind: 'evaluation', status: 'cancelled' })).toBe(false)
    expect(isOpenEvaluation({ kind: 'session', status: 'pending' })).toBe(false)
    expect(isOpenEvaluation({ status: 'pending' })).toBe(false)
  })
})
