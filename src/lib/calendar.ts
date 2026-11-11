import type { Booking, ScheduleConfig } from '@/types'
import { toISODate } from './format'
import { fromMinutes, isOpenDay, toMinutes } from './schedule'

/**
 * Calendário do painel: monta o mês e resume cada dia (quem vem, quanto do
 * expediente já está ocupado e quais janelas ainda estão livres).
 */

export interface MonthDay {
  iso: string
  day: number
  /** Dia do mês anterior/seguinte, só para completar a grade */
  outside: boolean
}

/** Semanas do mês (domingo a sábado), completando com os dias vizinhos. */
export function monthGrid(year: number, month: number): MonthDay[][] {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  const last = new Date(year, month + 1, 0)
  const weeks: MonthDay[][] = []
  const cursor = new Date(start)
  while (cursor <= last || cursor.getDay() !== 0) {
    if (cursor.getDay() === 0) weeks.push([])
    weeks[weeks.length - 1].push({ iso: toISODate(cursor), day: cursor.getDate(), outside: cursor.getMonth() !== month })
    cursor.setDate(cursor.getDate() + 1)
  }
  return weeks
}

/** Sessões que aparecem no calendário: com data e não canceladas. */
export const calendarSessions = (bookings: Booking[]) =>
  bookings.filter((b) => b.date && b.kind !== 'evaluation' && b.status !== 'cancelled')

export interface DaySummary {
  iso: string
  open: boolean
  sessions: Booking[]
  /** 0 a 1: quanto do expediente está ocupado */
  occupancy: number
  bookedMinutes: number
  /** Janelas livres (já descontando a pausa entre sessões), em "HH:MM" */
  free: { start: string; end: string }[]
  /** Aberto, mas sem janela livre de pelo menos `minFreeMinutes` */
  full: boolean
}

export function summarizeDay(schedule: ScheduleConfig, bookings: Booking[], iso: string, minFreeMinutes = 60): DaySummary {
  const sessions = calendarSessions(bookings)
    .filter((b) => b.date === iso)
    .sort((a, b) => a.time.localeCompare(b.time))
  const open = isOpenDay(schedule, iso)
  const start = toMinutes(schedule.open)
  const end = toMinutes(schedule.close)
  const pause = Math.max(0, Math.round(schedule.bufferMinutes ?? 0))

  // Intervalos ocupados dentro do expediente (sessões ativas + pausa antes e depois)
  const busy = sessions
    .filter((b) => b.status === 'pending' || b.status === 'confirmed')
    .map((b) => {
      const s = toMinutes(b.time)
      return [s - pause, s + Math.round(b.estimate.hours * 60) + pause] as const
    })
    .sort((a, b) => a[0] - b[0])

  const free: { start: string; end: string }[] = []
  if (open) {
    let cursor = start
    for (const [s, e] of busy) {
      if (s > cursor) free.push({ start: fromMinutes(cursor), end: fromMinutes(Math.min(s, end)) })
      cursor = Math.max(cursor, e)
      if (cursor >= end) break
    }
    if (cursor < end) free.push({ start: fromMinutes(cursor), end: fromMinutes(end) })
  }
  const freeLong = free.filter((w) => toMinutes(w.end) - toMinutes(w.start) >= minFreeMinutes)

  // Ocupação: horas das sessões (de qualquer status, menos canceladas) dentro do expediente
  const bookedMinutes = sessions.reduce((sum, b) => {
    const s = toMinutes(b.time)
    const e = s + Math.round(b.estimate.hours * 60)
    return sum + Math.max(0, Math.min(e, end) - Math.max(s, start))
  }, 0)
  const total = Math.max(1, end - start)

  return {
    iso,
    open,
    sessions,
    occupancy: Math.min(1, bookedMinutes / total),
    bookedMinutes,
    free: freeLong,
    full: open && freeLong.length === 0,
  }
}

/** "10h–13h" / "17h30–19h" */
export const formatWindow = (w: { start: string; end: string }) =>
  `${w.start.replace(':00', 'h').replace(':', 'h')}–${w.end.replace(':00', 'h').replace(':', 'h')}`
