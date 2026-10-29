import { describe, expect, it } from 'vitest'
import type { Booking, BookingStatus } from '@/types'
import { buildReport, delta, periodLabel, revenueSeries, shiftPeriod, type Period } from './reports'

let seq = 0
function bk(o: {
  date: string
  status?: BookingStatus
  phone?: string
  name?: string
  style?: string
  places?: string[]
  value?: number
  finalPrice?: number | null
  hours?: number
}): Booking {
  const places = o.places ?? ['Antebraço interno']
  return {
    id: `b${++seq}`,
    createdAt: '2026-01-01T00:00:00Z',
    status: o.status ?? 'done',
    client: { name: o.name ?? 'Ana', phone: o.phone ?? '32999990001', instagram: '' },
    tattoo: {
      placements: places.map((p) => ({ zoneId: null, areaId: p, sizeCm: 10 })),
      placementLabels: places,
      styleId: 'x',
      styleName: o.style ?? 'Blackwork',
      color: false,
      description: '',
    },
    estimate: { low: 0, high: 0, value: o.value ?? 300, hours: o.hours ?? 2, deposit: 0, oversized: false, items: [] },
    date: o.date,
    time: '10:00',
    notes: '',
    finalPrice: o.finalPrice,
  }
}

const OUT: Period = { mode: 'month', year: 2026, month: 9 }

describe('períodos', () => {
  it('navega entre meses virando o ano', () => {
    expect(shiftPeriod({ mode: 'month', year: 2026, month: 0 }, -1)).toMatchObject({ year: 2025, month: 11 })
    expect(shiftPeriod({ mode: 'month', year: 2026, month: 11 }, 1)).toMatchObject({ year: 2027, month: 0 })
    expect(shiftPeriod({ mode: 'year', year: 2026, month: 3 }, -1)).toMatchObject({ year: 2025 })
  })
  it('escreve o nome do período', () => {
    expect(periodLabel(OUT)).toBe('Outubro de 2026')
    expect(periodLabel({ ...OUT, mode: 'year' })).toBe('2026')
  })
})

describe('buildReport', () => {
  const data = [
    bk({ date: '2026-10-03', phone: '32999990001', name: 'Ana', value: 300, finalPrice: 350, places: ['Antebraço interno', 'Costas'] }),
    bk({ date: '2026-10-20', phone: '5532999990001', name: 'Ana Souza', value: 500, style: 'Rastelado' }),
    bk({ date: '2026-10-15', phone: '32988880002', name: 'Bruno', value: 400, style: 'Rastelado', places: ['Costas'] }),
    bk({ date: '2026-10-28', status: 'confirmed', phone: '32977770003', value: 600 }),
    bk({ date: '2026-10-29', status: 'cancelled', phone: '32977770004' }),
    bk({ date: '2026-09-10', phone: '32988880002', name: 'Bruno', value: 200 }), // Bruno já veio em setembro
    bk({ date: '2026-11-02', phone: '32966660005' }), // fora do período
  ]
  const r = buildReport(data, OUT)

  it('soma só sessões concluídas no mês, usando o valor cobrado quando existe', () => {
    expect(r.sessions).toBe(3)
    expect(r.revenue).toBe(350 + 500 + 400)
    expect(r.estimated).toBe(2)
    expect(r.avgTicket).toBeCloseTo(1250 / 3)
    expect(r.tattoos).toBe(4) // a primeira sessão teve 2 locais
    expect(r.hours).toBe(6)
  })

  it('junta o mesmo cliente pelo telefone (com ou sem 55) e marca quem voltou', () => {
    expect(r.clients).toHaveLength(2)
    const ana = r.clients[0]
    expect(ana).toMatchObject({ name: 'Ana Souza', sessions: 2, revenue: 850, returning: false, last: '2026-10-20' })
    expect(r.clients[1]).toMatchObject({ name: 'Bruno', sessions: 1, returning: true })
    expect(r.newClients).toBe(1)
    expect(r.returningClients).toBe(1)
  })

  it('ranqueia estilos e locais', () => {
    expect(r.byStyle.map((s) => [s.label, s.count])).toEqual([['Rastelado', 2], ['Blackwork', 1]])
    // Empate em 2: desempata pelo valor (antebraço 175 + 500, costas 175 + 400)
    expect(r.byArea.map((a) => [a.label, a.count])).toEqual([['Antebraço interno', 2], ['Costas', 2]])
    expect(r.byArea[1].revenue).toBeCloseTo(175 + 400)
  })

  it('conta agendados, pedidos e cancelados do mês', () => {
    expect(r.scheduled).toEqual({ count: 1, value: 600 })
    expect(r.requests).toBe(5)
    expect(r.cancelled).toBe(1)
  })

  it('filtra por estilo em tudo', () => {
    const f = buildReport(data, OUT, { style: 'Rastelado' })
    expect(f.sessions).toBe(2)
    expect(f.revenue).toBe(900)
    expect(f.byStyle).toHaveLength(1)
  })

  it('modo ano pega o ano inteiro', () => {
    expect(buildReport(data, { ...OUT, mode: 'year' }).sessions).toBe(5)
  })
})

describe('revenueSeries', () => {
  const data = [bk({ date: '2026-10-03', value: 300 }), bk({ date: '2026-05-01', value: 100 }), bk({ date: '2026-03-01', value: 999 })]
  it('mostra os 6 meses até o escolhido, com ele em destaque', () => {
    const s = revenueSeries(data, OUT)
    expect(s.map((p) => p.key)).toEqual(['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'])
    expect(s.at(-1)).toMatchObject({ revenue: 300, selected: true })
    expect(s[0].revenue).toBe(100)
  })
  it('atravessa a virada do ano', () => {
    expect(revenueSeries(data, { mode: 'month', year: 2027, month: 1 }).map((p) => p.key)[0]).toBe('2026-09')
  })
  it('no modo ano mostra os 12 meses', () => {
    const s = revenueSeries(data, { ...OUT, mode: 'year' })
    expect(s).toHaveLength(12)
    expect(s[2].revenue).toBe(999)
  })
})

describe('delta', () => {
  it('compara com o período anterior', () => {
    expect(delta(150, 100)).toBe(50)
    expect(delta(100, 0)).toBeNull()
  })
})
