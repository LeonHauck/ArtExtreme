import { describe, expect, it } from 'vitest'
import { availableSlots, bookableDates, busyFromBookings } from './schedule'
import type { Booking, ScheduleConfig } from '@/types'

const schedule: ScheduleConfig = {
  weekdays: [1, 2, 3, 4, 5], // seg a sex
  open: '10:00',
  close: '18:00',
  stepMinutes: 60,
  daysAhead: 14,
  blockedDates: ['2026-11-04'],
}

// 2026-11-02 é uma segunda-feira
const MONDAY = '2026-11-02'

const booking = (date: string, time: string, hours: number, status: Booking['status'] = 'confirmed') =>
  ({ id: time, date, time, status, estimate: { hours } }) as Booking

describe('bookableDates', () => {
  it('começa amanhã, pula fins de semana e datas bloqueadas', () => {
    const dates = bookableDates(schedule, new Date(2026, 10, 1)) // domingo, 1º nov
    expect(dates[0]).toBe(MONDAY)
    expect(dates).not.toContain('2026-11-04')
    expect(dates).not.toContain('2026-11-07') // sábado
  })
})

describe('availableSlots', () => {
  it('oferece horários que terminam até o fechamento', () => {
    const slots = availableSlots(schedule, [], MONDAY, 2)
    expect(slots[0]).toBe('10:00')
    expect(slots.at(-1)).toBe('16:00')
  })

  it('remove horários que sobrepõem agendamentos ativos', () => {
    const slots = availableSlots(schedule, busyFromBookings([booking(MONDAY, '12:00', 2)]), MONDAY, 1)
    expect(slots).toEqual(['10:00', '11:00', '14:00', '15:00', '16:00', '17:00'])
  })

  it('ignora agendamentos cancelados', () => {
    const slots = availableSlots(schedule, busyFromBookings([booking(MONDAY, '10:00', 8, 'cancelled')]), MONDAY, 1)
    expect(slots).toHaveLength(8)
  })

  it('sessão maior que o expediente só pode começar na abertura', () => {
    expect(availableSlots(schedule, [], MONDAY, 10)).toEqual(['10:00'])
  })

  it('aceita horários ocupados vindos do banco', () => {
    expect(availableSlots(schedule, [{ date: MONDAY, time: '10:00', hours: 3 }], MONDAY, 1)[0]).toBe('13:00')
  })

  it('não oferece nada em dia fechado', () => {
    expect(availableSlots(schedule, [], '2026-11-07', 1)).toEqual([])
  })
})
