import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ArrowRight, CalendarX2, Check, Pencil, ScanLine } from 'lucide-react'
import { useStudio } from '@/store/studio'
import { useEstimate } from '@/hooks/useEstimate'
import { availableSlots, bookableDates } from '@/lib/schedule'
import { formatBRL, formatDateLong, formatHours, maskPhone, onlyDigits, parseISODate, uid } from '@/lib/format'
import { bookingMessageToStudio, waLink } from '@/lib/whatsapp'
import { WhatsAppIcon } from '@/components/ui/BrandIcons'
import { Ornament } from '@/components/ui/Ornament'
import type { Booking as BookingT } from '@/types'

const emptyForm = { name: '', phone: '', instagram: '', notes: '', adult: false }

function NeedsSimulation() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <ScanLine className="mx-auto text-violet" size={40} strokeWidth={1.5} />
      <h1 className="mt-5 font-display text-4xl tracking-wide">Primeiro, monte sua tattoo</h1>
      <p className="mt-3 text-mute">
        Para reservar o tempo certo na agenda, precisamos saber o local, o tamanho e o estilo. Leva menos de um
        minuto.
      </p>
      <Link to="/orcamento" className="btn btn-primary mt-8">
        Abrir simulador <ArrowRight size={18} />
      </Link>
    </div>
  )
}

function Success({ booking }: { booking: BookingT }) {
  const studio = useStudio((s) => s.studio)
  return (
    <div className="mx-auto max-w-lg animate-fade-up px-4 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-violet bg-violet/15">
        <Check size={30} className="text-bone" />
      </div>
      <h1 className="mt-6 font-display text-5xl tracking-wide">Pedido enviado</h1>
      <p className="mt-2 text-mute">
        {formatDateLong(booking.date)} às {booking.time}
      </p>
      <Ornament className="my-8" />

      <div className="card p-6 text-left">
        <p className="font-semibold">Falta só um passo</p>
        <p className="mt-1 text-sm text-mute">
          Envie a mensagem abaixo no WhatsApp do estúdio com suas referências. O horário é confirmado após o
          pagamento do sinal de <span className="text-bone">{formatBRL(booking.estimate.deposit)}</span>.
        </p>
        <a
          href={waLink(studio.whatsapp, bookingMessageToStudio(booking))}
          target="_blank"
          rel="noreferrer"
          className="btn btn-primary mt-5 w-full"
        >
          <WhatsAppIcon size={20} /> Enviar no WhatsApp
        </a>
      </div>

      <Link to="/" className="mt-8 inline-block text-sm text-mute hover:text-bone">
        Voltar ao início
      </Link>
    </div>
  )
}

export default function Booking() {
  const schedule = useStudio((s) => s.schedule)
  const bookings = useStudio((s) => s.bookings)
  const addBooking = useStudio((s) => s.addBooking)
  const resetDraft = useStudio((s) => s.resetDraft)
  const { draft, placements, style, ready, estimate } = useEstimate()

  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [done, setDone] = useState<BookingT | null>(null)

  const hours = estimate?.hours ?? 1
  const days = useMemo(
    () => bookableDates(schedule).map((iso) => ({ iso, free: availableSlots(schedule, bookings, iso, hours).length })),
    [schedule, bookings, hours],
  )
  const slots = useMemo(
    () => (date ? availableSlots(schedule, bookings, date, hours) : []),
    [schedule, bookings, date, hours],
  )

  if (done) return <Success booking={done} />
  if (!ready || !estimate || !style) return <NeedsSimulation />

  const valid = date && time && form.name.trim().length >= 2 && onlyDigits(form.phone).length >= 10 && form.adult

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    const booking: BookingT = {
      id: uid(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      client: {
        name: form.name.trim(),
        phone: onlyDigits(form.phone),
        instagram: form.instagram.replace('@', '').trim(),
      },
      tattoo: { ...draft, placementLabels: placements.map((p) => p.label), styleName: style.name },
      estimate,
      date,
      time,
      notes: form.notes.trim(),
    }
    addBooking(booking)
    resetDraft()
    setDone(booking)
    window.scrollTo({ top: 0 })
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl px-4 pt-8 pb-28 sm:px-6 md:pb-10">
      <header className="mb-8">
        <p className="eyebrow">Agendamento</p>
        <h1 className="mt-2 font-display text-5xl tracking-wide sm:text-6xl">Reserve seu horário</h1>
      </header>

      {/* Resumo */}
      <section className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-display text-2xl tracking-wide">
            {style.name}
            <span className="text-mute"> · {draft.color ? 'colorida' : 'preto e cinza'}</span>
          </p>
          <ul className="mt-1.5 space-y-0.5 text-sm text-bone/80">
            {placements.map((p) => (
              <li key={p.zoneId ?? p.areaId} className="flex gap-2">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-light" />
                <span>
                  {p.label} <span className="text-mute">· ~{p.sizeCm} cm</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-mute">Tempo estimado: ~{formatHours(estimate.hours)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-4 sm:text-right">
          <div>
            <p className="text-rave font-display text-2xl tracking-wide tabular-nums">
              {formatBRL(estimate.low)} – {formatBRL(estimate.high)}
            </p>
            <p className="text-xs text-mute">estimativa</p>
          </div>
          <Link to="/orcamento" className="btn btn-outline btn-sm" aria-label="Editar tattoo">
            <Pencil size={15} />
          </Link>
        </div>
      </section>

      {/* Data */}
      <section className="mt-10">
        <h2 className="label">Escolha o dia</h2>
        {days.length === 0 ? (
          <p className="flex items-center gap-2 text-mute">
            <CalendarX2 size={18} /> Agenda fechada no momento. Fale com o estúdio pelo WhatsApp.
          </p>
        ) : (
          <div className="scrollbar-none -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
            {days.map(({ iso, free }) => {
              const d = parseISODate(iso)
              const active = date === iso
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={free === 0}
                  onClick={() => {
                    setDate(iso)
                    setTime(null)
                  }}
                  className={`flex w-16 shrink-0 snap-start flex-col items-center rounded-sm border py-3 transition disabled:opacity-30 ${
                    active ? 'border-violet bg-violet text-bone' : 'border-bone/10 bg-ash/50 hover:border-bone/30'
                  }`}
                >
                  <span className="font-display text-xs tracking-widest uppercase opacity-80">
                    {d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                  </span>
                  <span className="font-display text-3xl leading-none">{d.getDate()}</span>
                  <span className="text-[0.65rem] uppercase opacity-70">
                    {d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      {/* Horário */}
      {date && (
        <section className="mt-8 animate-fade-up">
          <h2 className="label">Horário · {formatDateLong(date)}</h2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {slots.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTime(t)}
                className={`rounded-sm border py-2.5 font-display text-lg tracking-wider transition ${
                  time === t ? 'border-violet bg-violet text-bone' : 'border-bone/10 bg-ash/50 hover:border-bone/30'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Dados */}
      <section className="mt-10 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="label">
            Nome completo
          </label>
          <input
            id="name"
            className="input"
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label htmlFor="phone" className="label">
            WhatsApp
          </label>
          <input
            id="phone"
            className="input"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(11) 99999-9999"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })}
            required
          />
        </div>
        <div>
          <label htmlFor="ig" className="label">
            Instagram <span className="normal-case tracking-normal opacity-60">(opcional)</span>
          </label>
          <input
            id="ig"
            className="input"
            placeholder="@seuperfil"
            value={form.instagram}
            onChange={(e) => setForm({ ...form, instagram: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="notes" className="label">
            Observações <span className="normal-case tracking-normal opacity-60">(opcional)</span>
          </label>
          <textarea
            id="notes"
            className="input min-h-20"
            placeholder="Alergias, cobertura de outra tattoo, cicatriz no local…"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <label className="flex cursor-pointer items-start gap-3 text-sm sm:col-span-2">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-violet"
            checked={form.adult}
            onChange={(e) => setForm({ ...form, adult: e.target.checked })}
          />
          <span className="text-bone/85">
            Tenho 18 anos ou mais e vou apresentar documento com foto no dia da sessão.
          </span>
        </label>
      </section>

      <button type="submit" className="btn btn-primary mt-10 w-full" disabled={!valid}>
        Solicitar horário
        {date && time ? ` · ${time}` : ''}
      </button>
      <p className="mt-3 text-center text-xs text-mute">
        O horário fica reservado como pendente até a confirmação do sinal.
      </p>
    </form>
  )
}
