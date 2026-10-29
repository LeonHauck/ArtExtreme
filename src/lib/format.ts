const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

export const formatBRL = (n: number) => brl.format(n)

const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

/** R$ 850 · R$ 1,3 mil · R$ 12,5 mil (eixos e rótulos de gráfico) */
export const formatBRLCompact = (n: number) => brlCompact.format(n)

export function formatHours(h: number): string {
  const whole = Math.floor(h)
  const min = Math.round((h - whole) * 60)
  if (whole === 0) return `${min} min`
  return min ? `${whole}h${String(min).padStart(2, '0')}` : `${whole}h`
}

/** "2026-11-03" → "ter, 03 nov" */
export function formatDateShort(iso: string): string {
  const d = parseISODate(iso)
  return d
    .toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
    .replace(/\./g, '')
}

/** "2026-11-03" → "terça-feira, 3 de novembro" */
export function formatDateLong(iso: string): string {
  return parseISODate(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

/** Converte "YYYY-MM-DD" em Date local (sem o deslocamento de fuso do construtor ISO). */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Mantém só dígitos — usado em telefones. */
export const onlyDigits = (s: string) => s.replace(/\D/g, '')

/** Máscara simples para celular BR: (11) 99999-9999 */
export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

/** Gera um id legível a partir de um nome: "Neo Tradicional" → "neo-tradicional" */
export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** "5532991809867" → "(32) 99180-9867" (remove o DDI 55 do Brasil para exibir). */
export function formatWhatsApp(digits: string): string {
  const d = onlyDigits(digits)
  return maskPhone(d.length > 11 && d.startsWith('55') ? d.slice(2) : d)
}

/**
 * Valor digitado em reais: "1.500" → 1500 · "350,50" → 350.5 · "350.5" → 350.5.
 * Vazio → null. Texto inválido → NaN.
 */
export function parseMoney(input: string): number | null {
  const s = input.trim().replace(/^R\$\s*/i, '')
  if (!s) return null
  if (s.includes(',')) return Number(s.replace(/\./g, '').replace(',', '.'))
  // Sem vírgula: ponto seguido de 3 dígitos é milhar (1.500); senão, decimal (350.5)
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g, ''))
  return Number(s)
}
