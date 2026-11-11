import { describe, expect, it } from 'vitest'
import type { Booking, BookingStatus, ScheduleConfig } from '@/types'
import { formatWindow, monthGrid, summarizeDay } from './calendar'

const schedule: ScheduleConfig = {
  weekdays: [1, 2, 3, 4, 5, 6],
  open: '10:00',
  close: '19:00',
  stepMinutes: 60,
  daysAhead: 60,
  blockedDates: ['2026-11-20'],
}
const bk = (date: string, time: string, hours: number, status: BookingStatus = 'confirmed', kind: Booking['kind'] = 'session') =>
  ({ id: date + time, date, time, status, kind, estimate: { hours } }) as Booking

describe('monthGrid', () => {
  it('novembro de 2026 começa num domingo e fecha a última semana no sábado', () => {
    const weeks = monthGrid(2026, 10)
    expect(weeks[0][0]).toEqual({ iso: '2026-11-01', day: 1, outside: false })
    expect(weeks.every((w) => w.length === 7)).toBe(true)
    expect(weeks.at(-1)!.at(-1)!.iso).toBe('2026-12-05')
    expect(weeks.at(-1)!.at(-1)!.outside).toBe(true)
  })
  it('completa o começo com o mês anterior', () => {
    const weeks = monthGrid(2026, 9) // outubro de 2026 começa numa quinta
    expect(weeks[0][0]).toEqual({ iso: '2026-09-27', day: 27, outside: true })
    expect(weeks[0][4].iso).toBe('2026-10-01')
  })
})

describe('summarizeDay', () => {
  const day = '2026-11-12' // quinta
  it('dia vazio: tudo livre', () => {
    const s = summarizeDay(schedule, [], day)
    expect(s.open).toBe(true)
    expect(s.free.map(formatWindow)).toEqual(['10h–19h'])
    expect(s.occupancy).toBe(0)
    expect(s.full).toBe(false)
  })
  it('mostra as janelas livres entre as sessões, na ordem', () => {
    const s = summarizeDay(schedule, [bk(day, '14:00', 3), bk(day, '10:00', 2)], day)
    expect(s.sessions.map((b) => b.time)).toEqual(['10:00', '14:00'])
    expect(s.free.map(formatWindow)).toEqual(['12h–14h', '17h–19h'])
    expect(s.occupancy).toBeCloseTo(5 / 9)
  })
  it('respeita a pausa entre sessões', () => {
    const s = summarizeDay({ ...schedule, bufferMinutes: 30 }, [bk(day, '13:00', 2)], day)
    expect(s.free.map(formatWindow)).toEqual(['10h–12h30', '15h30–19h'])
  })
  it('lotado quando não sobra 1 hora livre', () => {
    const s = summarizeDay(schedule, [bk(day, '10:00', 4.5), bk(day, '14:30', 4.5)], day)
    expect(s.full).toBe(true)
    expect(s.occupancy).toBe(1)
  })
  it('cancelados e avaliações não ocupam; concluídos aparecem mas não bloqueiam', () => {
    const s = summarizeDay(schedule, [bk(day, '10:00', 9, 'cancelled'), bk('', '', 2, 'pending', 'evaluation'), bk(day, '15:00', 2, 'done')], day)
    expect(s.sessions.map((b) => b.status)).toEqual(['done'])
    expect(s.free.map(formatWindow)).toEqual(['10h–19h'])
  })
  it('domingo e folga ficam fechados', () => {
    expect(summarizeDay(schedule, [], '2026-11-15').open).toBe(false)
    expect(summarizeDay(schedule, [], '2026-11-20').open).toBe(false)
    expect(summarizeDay(schedule, [], '2026-11-20').full).toBe(false)
  })
})
