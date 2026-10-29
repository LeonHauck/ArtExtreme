import { supabase } from './supabase'
import { busyFromBookings, type BusySlot } from './schedule'
import { useStudio } from '@/store/studio'
import type { Booking, BookingStatus } from '@/types'

/**
 * Acesso aos agendamentos. Com Supabase, tudo vai para o banco (e o artista vê
 * no painel de qualquer aparelho); sem ele, fica no próprio aparelho.
 */

/** Erro quando outro cliente reservou o mesmo horário segundos antes. */
export class SlotTakenError extends Error {
  constructor() {
    super('Esse horário acabou de ser reservado. Escolha outro, por favor.')
    this.name = 'SlotTakenError'
  }
}

interface BookingRow {
  id: string
  created_at: string
  status: BookingStatus
  client_name: string
  client_phone: string
  client_instagram: string | null
  tattoo: Booking['tattoo']
  estimate: Booking['estimate']
  session_date: string
  start_time: string
  hours: number | string
  notes: string | null
  final_price?: number | string | null
}

const fromRow = (r: BookingRow): Booking => ({
  id: r.id,
  createdAt: r.created_at,
  status: r.status,
  client: { name: r.client_name, phone: r.client_phone, instagram: r.client_instagram ?? '' },
  tattoo: r.tattoo,
  estimate: r.estimate,
  date: r.session_date,
  time: r.start_time.slice(0, 5),
  notes: r.notes ?? '',
  finalPrice: r.final_price == null ? null : Number(r.final_price),
})

const toRow = (b: Booking) => ({
  id: b.id,
  status: b.status,
  client_name: b.client.name,
  client_phone: b.client.phone,
  client_instagram: b.client.instagram || null,
  tattoo: b.tattoo,
  estimate: b.estimate,
  session_date: b.date,
  start_time: b.time,
  hours: b.estimate.hours,
  notes: b.notes || null,
})

/** Horários ocupados num intervalo de datas (sem nenhum dado de cliente). */
export async function fetchBusy(from: string, to: string): Promise<BusySlot[]> {
  if (!supabase) return busyFromBookings(useStudio.getState().bookings)
  const { data, error } = await supabase.rpc('busy_slots', { from_date: from, to_date: to })
  if (error) throw error
  return (data as { session_date: string; start_time: string; hours: number | string }[]).map((r) => ({
    date: r.session_date,
    time: r.start_time.slice(0, 5),
    hours: Number(r.hours),
  }))
}

/** Cria o pedido do cliente (sempre "pendente"). */
export async function createBooking(b: Booking): Promise<void> {
  if (!supabase) {
    useStudio.getState().addBooking(b)
    return
  }
  // Sem .select(): o visitante pode criar, mas não pode ler pedidos de volta
  const { error } = await supabase.from('bookings').insert(toRow(b))
  if (error) {
    if (error.code === 'P0001' || /indispon/i.test(error.message)) throw new SlotTakenError()
    throw error
  }
}

/** Todos os pedidos (só o artista logado consegue ler). */
export async function listBookings(): Promise<Booking[]> {
  if (!supabase) return useStudio.getState().bookings
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true })
  if (error) throw error
  return (data as BookingRow[]).map(fromRow)
}

export async function setBookingStatus(id: string, status: BookingStatus): Promise<void> {
  if (!supabase) return useStudio.getState().setBookingStatus(id, status)
  const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
  if (error) {
    if (error.code === 'P0001') throw new SlotTakenError()
    throw error
  }
}

/** Conclui a sessão guardando quanto foi cobrado (ou só corrige o valor depois). */
export async function setBookingDone(id: string, finalPrice: number | null): Promise<void> {
  if (!supabase) return useStudio.getState().updateBooking(id, { status: 'done', finalPrice })
  const { error } = await supabase.from('bookings').update({ status: 'done', final_price: finalPrice }).eq('id', id)
  if (error?.code === 'PGRST204') {
    // Banco ainda sem a coluna final_price (supabase/reports.sql não rodou): conclui sem o valor
    const retry = await supabase.from('bookings').update({ status: 'done' }).eq('id', id)
    if (retry.error) throw retry.error
    return
  }
  if (error) throw error
}

export async function deleteBooking(id: string): Promise<void> {
  if (!supabase) return useStudio.getState().removeBooking(id)
  const { error } = await supabase.from('bookings').delete().eq('id', id)
  if (error) throw error
}

/** Avisa quando chega/muda um pedido (tempo real). Retorna a função para parar. */
export function onBookingsChange(callback: () => void): () => void {
  if (!supabase) return useStudio.subscribe((s, prev) => s.bookings !== prev.bookings && callback())
  const client = supabase
  const channel = client
    .channel('bookings-admin')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => callback())
    .subscribe()
  return () => {
    void client.removeChannel(channel)
  }
}
