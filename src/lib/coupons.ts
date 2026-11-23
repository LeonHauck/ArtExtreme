import { supabase } from './supabase'
import type { Coupon, CouponPopup, Estimate, StudioInfo } from '@/types'

/**
 * Cupons de desconto. A lista fica na tabela `coupons` (só o artista vê);
 * o cliente valida um código por vez pela função `check_coupon` do banco,
 * que também confere se aquele WhatsApp já usou o cupom.
 */

const roundTo10 = (n: number) => Math.round(n / 10) * 10

/** "  art 40!" → "ART40" (só letras, números, - e _) */
export const normalizeCode = (raw: string) => raw.toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 20)

/** Aplica o desconto na estimativa, guardando os valores originais. O sinal acompanha. */
export function applyCouponDiscount(estimate: Estimate, percent: number): Estimate {
  const base = estimate.original ?? { low: estimate.low, high: estimate.high, value: estimate.value, deposit: estimate.deposit }
  const k = 1 - Math.min(90, Math.max(0, percent)) / 100
  const depositRatio = base.value > 0 ? base.deposit / base.value : 0
  const value = roundTo10(base.value * k)
  return {
    ...estimate,
    low: roundTo10(base.low * k),
    high: roundTo10(base.high * k),
    value,
    deposit: roundTo10(value * depositRatio),
    original: base,
  }
}

/** Volta para os valores sem cupom. */
export function removeCouponDiscount(estimate: Estimate): Estimate {
  if (!estimate.original) return estimate
  const { original, ...rest } = estimate
  return { ...rest, ...original }
}

export interface CouponCheck {
  valid: boolean
  percent: number | null
  reason: string | null
}

export class CouponError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CouponError'
  }
}

/** Confere um código (e, com o telefone, se a pessoa já usou). */
export async function checkCoupon(code: string, phone?: string): Promise<CouponCheck> {
  const c = normalizeCode(code)
  if (c.length < 3) return { valid: false, percent: null, reason: 'Digite o código do cupom' }
  if (!supabase) return { valid: false, percent: null, reason: 'Cupons funcionam com o banco de dados configurado' }
  const { data, error } = await supabase.rpc('check_coupon', { p_code: c, p_phone: phone || null })
  if (error) return { valid: false, percent: null, reason: 'Não foi possível conferir o cupom agora. Tente de novo.' }
  const row = (Array.isArray(data) ? data[0] : data) as CouponCheck | undefined
  return row ?? { valid: false, percent: null, reason: 'Cupom inválido' }
}

/* ─── Painel: lista de cupons ─────────────────────────────────────────── */

/** O banco ainda não tem a tabela (supabase/coupons.sql não rodou). */
export const isMissingTable = (e: unknown) => {
  const code = (e as { code?: string } | null)?.code
  return code === '42P01' || code === 'PGRST205'
}

export async function listCoupons(): Promise<Coupon[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data as Coupon[]
}

export async function createCoupon(c: Pick<Coupon, 'code' | 'percent' | 'ends_on' | 'note'>): Promise<void> {
  if (!supabase) throw new Error('Cupons funcionam com o banco de dados configurado')
  const { error } = await supabase.from('coupons').insert({ ...c, code: normalizeCode(c.code) })
  if (error) throw new Error(error.code === '23505' ? 'Já existe um cupom com esse código' : 'Não foi possível criar o cupom')
}

export async function updateCoupon(code: string, patch: Partial<Omit<Coupon, 'code'>>): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('coupons').update(patch).eq('code', code)
  if (error) throw new Error('Não foi possível salvar o cupom')
}

export async function deleteCoupon(code: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('coupons').delete().eq('code', code)
  if (error) throw new Error('Não foi possível apagar o cupom')
}

/* ─── Popup ───────────────────────────────────────────────────────────── */

export const defaultCouponPopup: CouponPopup = {
  active: false,
  code: '',
  title: 'Presente para você',
  text: 'Use este cupom no final do agendamento e garanta o desconto na sua tattoo.',
  timerMinutes: 15,
  delaySeconds: 6,
}

export const getCouponPopup = (studio: StudioInfo): CouponPopup => ({ ...defaultCouponPopup, ...studio.couponPopup })

/** Onde o cupom do popup fica guardado até o cliente agendar. */
export const SAVED_COUPON_KEY = 'ae-coupon'
