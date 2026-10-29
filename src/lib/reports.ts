import type { Booking } from '@/types'
import { onlyDigits } from './format'

/**
 * Relatórios do artista. Tudo é calculado a partir dos pedidos:
 * conta como "feita" a sessão com status concluído, na data da sessão.
 */

export type PeriodMode = 'month' | 'year'
export interface Period {
  mode: PeriodMode
  year: number
  /** 0 a 11 (usado no modo mês) */
  month: number
}

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
export const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const pad = (n: number) => String(n).padStart(2, '0')
const monthKey = (year: number, month: number) => `${year}-${pad(month + 1)}`

export function currentPeriod(mode: PeriodMode = 'month', today = new Date()): Period {
  return { mode, year: today.getFullYear(), month: today.getMonth() }
}

export function shiftPeriod(p: Period, dir: number): Period {
  if (p.mode === 'year') return { ...p, year: p.year + dir }
  const m = p.month + dir
  return { ...p, year: p.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 }
}

export function periodLabel(p: Period): string {
  return p.mode === 'year' ? String(p.year) : `${MONTHS[p.month][0].toUpperCase()}${MONTHS[p.month].slice(1)} de ${p.year}`
}

/** O período anterior, para comparar (mês passado ou ano passado). */
export const previousPeriod = (p: Period) => shiftPeriod(p, -1)

export function inPeriod(iso: string, p: Period): boolean {
  return p.mode === 'year' ? iso.startsWith(`${p.year}-`) : iso.startsWith(`${monthKey(p.year, p.month)}-`)
}

/** Início do período em ISO (para saber quem já tinha vindo antes). */
const periodStart = (p: Period) => (p.mode === 'year' ? `${p.year}-01-01` : `${monthKey(p.year, p.month)}-01`)

/** Valor da sessão: o cobrado, se o artista informou; senão, a estimativa. */
export const bookingValue = (b: Booking) => (b.finalPrice ?? null) !== null ? Number(b.finalPrice) : b.estimate.value

/** Mesmo cliente = mesmo telefone (sem DDI). */
export const clientKey = (b: Booking) => onlyDigits(b.client.phone).replace(/^55(?=\d{10,11}$)/, '')

export interface RankItem {
  label: string
  count: number
  revenue: number
}

export interface ClientRow {
  key: string
  name: string
  phone: string
  instagram: string
  sessions: number
  revenue: number
  last: string
  /** Já tinha feito sessão antes deste período */
  returning: boolean
}

export interface Report {
  revenue: number
  sessions: number
  tattoos: number
  hours: number
  avgTicket: number
  clients: ClientRow[]
  newClients: number
  returningClients: number
  /** Sessões concluídas sem o valor cobrado informado (entram pela estimativa) */
  estimated: number
  /** Confirmadas e ainda não feitas no período */
  scheduled: { count: number; value: number }
  requests: number
  cancelled: number
  byStyle: RankItem[]
  byArea: RankItem[]
}

const rank = (map: Map<string, RankItem>) =>
  [...map.values()].sort((a, b) => b.count - a.count || b.revenue - a.revenue || a.label.localeCompare(b.label))

export interface ReportFilter {
  /** Nome do estilo (como gravado no pedido); vazio = todos */
  style?: string
}

const matches = (b: Booking, f: ReportFilter) => !f.style || b.tattoo.styleName === f.style

export function buildReport(all: Booking[], period: Period, filter: ReportFilter = {}): Report {
  const list = all.filter((b) => matches(b, filter))
  const inP = list.filter((b) => inPeriod(b.date, period))
  const done = inP.filter((b) => b.status === 'done')
  const start = periodStart(period)

  // Quem já tinha feito sessão antes do período (em qualquer estilo)
  const before = new Set(all.filter((b) => b.status === 'done' && b.date < start).map(clientKey))

  const clients = new Map<string, ClientRow>()
  const styles = new Map<string, RankItem>()
  const areas = new Map<string, RankItem>()
  let revenue = 0
  let hours = 0
  let tattoos = 0
  let estimated = 0

  for (const b of done) {
    const value = bookingValue(b)
    revenue += value
    hours += b.estimate.hours
    tattoos += Math.max(1, b.tattoo.placements.length)
    if ((b.finalPrice ?? null) === null) estimated++

    const key = clientKey(b)
    const c = clients.get(key) ?? {
      key,
      name: b.client.name,
      phone: b.client.phone,
      instagram: b.client.instagram,
      sessions: 0,
      revenue: 0,
      last: b.date,
      returning: before.has(key),
    }
    c.sessions++
    c.revenue += value
    if (b.date >= c.last) {
      c.last = b.date
      c.name = b.client.name
    }
    clients.set(key, c)

    const s = styles.get(b.tattoo.styleName) ?? { label: b.tattoo.styleName, count: 0, revenue: 0 }
    s.count++
    s.revenue += value
    styles.set(s.label, s)

    // Valor da sessão dividido igualmente entre os locais tatuados nela
    const labels = b.tattoo.placements.map((p, i) => b.tattoo.placementLabels[i] ?? p.areaId)
    for (const label of labels) {
      const a = areas.get(label) ?? { label, count: 0, revenue: 0 }
      a.count++
      a.revenue += value / labels.length
      areas.set(label, a)
    }
  }

  const clientRows = [...clients.values()].sort((a, b) => b.sessions - a.sessions || b.revenue - a.revenue || a.name.localeCompare(b.name))
  const returningClients = clientRows.filter((c) => c.returning).length
  const scheduled = inP.filter((b) => b.status === 'confirmed')

  return {
    revenue,
    sessions: done.length,
    tattoos,
    hours,
    avgTicket: done.length ? revenue / done.length : 0,
    clients: clientRows,
    newClients: clientRows.length - returningClients,
    returningClients,
    estimated,
    scheduled: { count: scheduled.length, value: scheduled.reduce((s, b) => s + bookingValue(b), 0) },
    requests: inP.length,
    cancelled: inP.filter((b) => b.status === 'cancelled').length,
    byStyle: rank(styles),
    byArea: rank(areas),
  }
}

export interface SeriesPoint {
  key: string
  label: string
  /** Nome completo para tooltip e tabela */
  longLabel: string
  revenue: number
  sessions: number
  selected: boolean
}

/** Faturamento por mês: os 6 meses até o mês escolhido, ou os 12 meses do ano. */
export function revenueSeries(all: Booking[], period: Period, filter: ReportFilter = {}): SeriesPoint[] {
  const months: { year: number; month: number }[] =
    period.mode === 'year'
      ? Array.from({ length: 12 }, (_, m) => ({ year: period.year, month: m }))
      : Array.from({ length: 6 }, (_, i) => shiftPeriod(period, i - 5))

  const done = all.filter((b) => b.status === 'done' && matches(b, filter))
  return months.map(({ year, month }) => {
    const mk = monthKey(year, month)
    const items = done.filter((b) => b.date.startsWith(`${mk}-`))
    const showYear = period.mode === 'month' && (month === 0 || months[0].month === month)
    return {
      key: mk,
      label: MONTHS_SHORT[month] + (showYear ? ` ${String(year).slice(2)}` : ''),
      longLabel: `${MONTHS[month]} de ${year}`,
      revenue: items.reduce((s, b) => s + bookingValue(b), 0),
      sessions: items.length,
      selected: period.mode === 'year' ? false : year === period.year && month === period.month,
    }
  })
}

/** Variação em % (null quando não há base para comparar). */
export function delta(current: number, previous: number): number | null {
  if (!previous) return null
  return ((current - previous) / previous) * 100
}
