import { useMemo, useState } from 'react'
import { Check, CheckCheck, Inbox, Trash2, X } from 'lucide-react'
import { useStudio } from '@/store/studio'
import type { Booking, BookingStatus } from '@/types'
import { formatBRL, formatDateLong, formatHours, maskPhone, toISODate } from '@/lib/format'
import { bookingMessageToClient, waLink } from '@/lib/whatsapp'
import { WhatsAppIcon, InstagramIcon } from '@/components/ui/BrandIcons'

const STATUS: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'border-sun/40 bg-sun/10 text-sun' },
  confirmed: { label: 'Confirmado', className: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' },
  done: { label: 'Concluído', className: 'border-bone/20 bg-bone/5 text-bone/70' },
  cancelled: { label: 'Cancelado', className: 'border-violet/40 bg-violet/10 text-violet-light' },
}

type Filter = 'upcoming' | 'pending' | 'history' | 'all'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'upcoming', label: 'Próximos' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'history', label: 'Histórico' },
  { id: 'all', label: 'Todos' },
]

function Stat({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="card p-4">
      <p className="font-display text-xs tracking-[0.25em] text-mute uppercase">{label}</p>
      <p className={`mt-1 font-display text-3xl tracking-wide tabular-nums ${accent ? 'text-violet-light' : ''}`}>
        {value}
      </p>
    </div>
  )
}

function BookingCard({ b }: { b: Booking }) {
  const setStatus = useStudio((s) => s.setBookingStatus)
  const remove = useStudio((s) => s.removeBooking)
  const studioName = useStudio((s) => s.studio.name)
  const st = STATUS[b.status]
  const active = b.status === 'pending' || b.status === 'confirmed'

  return (
    <article className="card p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <div className="w-16 shrink-0 text-center">
          <p className="font-display text-2xl leading-none tracking-wide">{b.time}</p>
          <p className="mt-1 text-xs text-mute">{formatHours(b.estimate.hours)}</p>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{b.client.name}</h3>
            <span className={`rounded-full border px-2 py-0.5 text-[0.7rem] font-medium ${st.className}`}>
              {st.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-bone/90">
            {b.tattoo.styleName}
            {b.tattoo.color ? ' · colorida' : ' · preto e cinza'}
          </p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {b.tattoo.placements.map((p, i) => (
              <li
                key={i}
                className="rounded-full border border-violet/30 bg-violet/10 px-2.5 py-0.5 text-xs text-bone/85"
              >
                {b.tattoo.placementLabels[i] ?? p.areaId} · {p.sizeCm} cm
              </li>
            ))}
          </ul>
          {b.tattoo.description && <p className="mt-1 text-sm text-mute italic">“{b.tattoo.description}”</p>}
          {b.notes && <p className="mt-1 text-sm text-mute">Obs.: {b.notes}</p>}
          <p className="mt-2 text-sm">
            <span className="text-violet-light">
              {formatBRL(b.estimate.low)} – {formatBRL(b.estimate.high)}
            </span>
            <span className="text-mute"> · sinal {formatBRL(b.estimate.deposit)}</span>
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-mute">
            <span>{maskPhone(b.client.phone.replace(/^55/, ''))}</span>
            {b.client.instagram && (
              <a
                href={`https://instagram.com/${b.client.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-bone"
              >
                <InstagramIcon size={12} />@{b.client.instagram}
              </a>
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-bone/5 pt-3">
        <a
          href={waLink(b.client.phone.length <= 11 ? `55${b.client.phone}` : b.client.phone, bookingMessageToClient(b, studioName))}
          target="_blank"
          rel="noreferrer"
          className="btn btn-outline btn-sm"
        >
          <WhatsAppIcon size={15} /> Conversar
        </a>
        {b.status === 'pending' && (
          <button className="btn btn-outline btn-sm" onClick={() => setStatus(b.id, 'confirmed')}>
            <Check size={15} /> Confirmar
          </button>
        )}
        {b.status === 'confirmed' && (
          <button className="btn btn-outline btn-sm" onClick={() => setStatus(b.id, 'done')}>
            <CheckCheck size={15} /> Concluir
          </button>
        )}
        {active && (
          <button className="btn btn-ghost btn-sm" onClick={() => setStatus(b.id, 'cancelled')}>
            <X size={15} /> Cancelar
          </button>
        )}
        {!active && (
          <button
            className="btn btn-ghost btn-sm ml-auto"
            onClick={() => confirm('Excluir este agendamento?') && remove(b.id)}
            aria-label="Excluir"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </article>
  )
}

export default function Agenda() {
  const bookings = useStudio((s) => s.bookings)
  const [filter, setFilter] = useState<Filter>('upcoming')
  const today = toISODate(new Date())

  const stats = useMemo(() => {
    const upcoming = bookings.filter((b) => b.date >= today)
    const confirmed = upcoming.filter((b) => b.status === 'confirmed')
    return {
      pending: bookings.filter((b) => b.status === 'pending').length,
      confirmed: confirmed.length,
      forecast: confirmed.reduce((sum, b) => sum + b.estimate.value, 0),
      done: bookings.filter((b) => b.status === 'done').length,
    }
  }, [bookings, today])

  const groups = useMemo(() => {
    const list = bookings
      .filter((b) => {
        if (filter === 'upcoming') return b.date >= today && (b.status === 'pending' || b.status === 'confirmed')
        if (filter === 'pending') return b.status === 'pending'
        if (filter === 'history') return b.date < today || b.status === 'done' || b.status === 'cancelled'
        return true
      })
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    if (filter === 'history') list.reverse()

    const map = new Map<string, Booking[]>()
    for (const b of list) map.set(b.date, [...(map.get(b.date) ?? []), b])
    return [...map.entries()]
  }, [bookings, filter, today])

  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-4xl tracking-wide">Agenda</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Pendentes" value={stats.pending} accent={stats.pending > 0} />
        <Stat label="Confirmados" value={stats.confirmed} />
        <Stat label="Previsto" value={formatBRL(stats.forecast)} />
        <Stat label="Concluídos" value={stats.done} />
      </div>

      <div className="mt-8 flex gap-2 overflow-x-auto scrollbar-none">
        {FILTERS.map((f) => (
          <button key={f.id} className="chip shrink-0" data-active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="mt-16 text-center text-mute">
          <Inbox className="mx-auto" size={36} strokeWidth={1.4} />
          <p className="mt-3">Nenhum agendamento aqui.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {groups.map(([date, list]) => (
            <section key={date}>
              <h2 className="mb-3 font-display text-lg tracking-widest text-mute uppercase">
                {date === today ? 'Hoje · ' : ''}
                {formatDateLong(date)}
              </h2>
              <div className="space-y-3">
                {list.map((b) => (
                  <BookingCard key={b.id} b={b} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
