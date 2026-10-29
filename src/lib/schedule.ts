import type { Booking, ScheduleConfig } from '@/types'
import { parseISODate, toISODate } from './format'

/** Um horário ocupado: só o necessário para montar a agenda, sem dados do cliente. */
export interface BusySlot {
  date: string
  time: string
  hours: number
}

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export const fromMinutes = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

/** Agendamentos que ainda ocupam a agenda. */
export const isActive = (b: Booking) => b.status === 'pending' || b.status === 'confirmed'

/** Converte agendamentos (modo local) em horários ocupados. */
export const busyFromBookings = (bookings: Booking[]): BusySlot[] =>
  bookings.filter(isActive).map((b) => ({ date: b.date, time: b.time, hours: b.estimate.hours }))

/** O estúdio atende nesta data? (dia da semana liberado e data não bloqueada) */
export function isOpenDay(schedule: ScheduleConfig, iso: string): boolean {
  const weekday = parseISODate(iso).getDay()
  return schedule.weekdays.includes(weekday) && !schedule.blockedDates.includes(iso)
}

/** Datas agendáveis: de amanhã até `daysAhead` dias à frente. */
export function bookableDates(schedule: ScheduleConfig, now = new Date()): string[] {
  const dates: string[] = []
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  for (let i = 0; i < schedule.daysAhead; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const iso = toISODate(d)
    if (isOpenDay(schedule, iso)) dates.push(iso)
  }
  return dates
}

/**
 * Horários de início livres em uma data, para uma sessão de `hours` horas.
 * A sessão precisa terminar até o fechamento e não pode sobrepor um horário ocupado.
 * Sessões maiores que o expediente só podem começar na abertura.
 */
export function availableSlots(schedule: ScheduleConfig, busy: BusySlot[], iso: string, hours: number): string[] {
  if (!isOpenDay(schedule, iso)) return []

  const open = toMinutes(schedule.open)
  const close = toMinutes(schedule.close)
  const duration = Math.round(hours * 60)
  const lastStart = Math.max(open, close - duration)

  const taken = busy
    .filter((b) => b.date === iso)
    .map((b) => {
      const start = toMinutes(b.time)
      return [start, start + Math.round(b.hours * 60)] as const
    })

  const slots: string[] = []
  for (let t = open; t <= lastStart; t += schedule.stepMinutes) {
    const end = t + duration
    const overlaps = taken.some(([s, e]) => t < e && end > s)
    if (!overlaps) slots.push(fromMinutes(t))
  }
  return slots
}
