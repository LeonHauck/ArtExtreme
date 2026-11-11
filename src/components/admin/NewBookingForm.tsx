import { useMemo, useState, type FormEvent } from 'react'
import { CalendarPlus, Loader2, Plus, Trash2 } from 'lucide-react'
import { activeAreas, activeStyles, useStudio } from '@/store/studio'
import { estimate as computeEstimate } from '@/lib/pricing'
import { availableSlots, busyFromBookings } from '@/lib/schedule'
import { createBooking, SlotTakenError } from '@/lib/bookingsRepo'
import { formatBRL, formatHours, maskPhone, onlyDigits, parseMoney, toISODate, uid } from '@/lib/format'
import type { Booking, BookingStatus, Estimate } from '@/types'

type Mode = Extract<BookingStatus, 'confirmed' | 'pending' | 'done'>

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'confirmed', label: 'Confirmado', hint: 'Horário fechado com o cliente.' },
  { id: 'pending', label: 'Aguardando sinal', hint: 'Reserva o horário; o botão "Pedir sinal" fica disponível.' },
  { id: 'done', label: 'Já realizado', hint: 'Registrar uma sessão que já aconteceu (entra nos Relatórios).' },
]

interface PlaceRow {
  key: string
  areaId: string
  sizeCm: string
}

/**
 * O artista agenda alguém direto pelo painel, sem passar pelo fluxo do cliente.
 * Usa a mesma tabela de preços para sugerir valor e duração, e mostra os horários livres.
 */
export function NewBookingForm({
  bookings,
  initialDate = '',
  onCreated,
  onCancel,
}: {
  bookings: Booking[]
  /** Dia já escolhido (ex.: "Agendar neste dia" no calendário) */
  initialDate?: string
  onCreated: (b: Booking) => void
  onCancel: () => void
}) {
  const pricing = useStudio((s) => s.pricing)
  const schedule = useStudio((s) => s.schedule)
  const areas = useMemo(() => activeAreas(pricing.areas), [pricing.areas])
  const styles = useMemo(() => activeStyles(pricing.styles), [pricing.styles])

  const [mode, setMode] = useState<Mode>('confirmed')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [styleId, setStyleId] = useState(styles[0]?.id ?? '')
  const [color, setColor] = useState(false)
  const [places, setPlaces] = useState<PlaceRow[]>([{ key: uid(), areaId: '', sizeCm: '10' }])
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState('')
  const [hoursText, setHoursText] = useState('')
  const [priceText, setPriceText] = useState('')
  const [firstTattoo, setFirstTattoo] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const placements = places
    .map((p) => ({ zoneId: null, areaId: p.areaId, sizeCm: Math.round(Number(p.sizeCm.replace(',', '.'))) }))
    .filter((p) => p.areaId && p.sizeCm > 0)
  const est = useMemo(
    () => (styleId && placements.length ? computeEstimate(pricing, { placements, styleId, color, description: '' }) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pricing, styleId, color, JSON.stringify(placements)],
  )

  const hours = hoursText ? Number(hoursText.replace(',', '.')) : (est?.hours ?? 1)
  const price = parseMoney(priceText)
  const priceOk = price === null || (Number.isFinite(price) && price >= 0)

  // Horários livres do dia escolhido (mesma regra do site, com a pausa entre sessões)
  const free = useMemo(
    () => (date ? availableSlots({ ...schedule, weekdays: [0, 1, 2, 3, 4, 5, 6], blockedDates: [] }, busyFromBookings(bookings), date, hours) : []),
    [date, schedule, bookings, hours],
  )

  const valid =
    name.trim().length >= 2 &&
    onlyDigits(phone).length >= 10 &&
    !!est &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    /^\d{2}:\d{2}$/.test(time) &&
    hours > 0 &&
    hours <= 12 &&
    priceOk &&
    !saving

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid || !est) return
    const style = styles.find((s) => s.id === styleId)!
    // Valor combinado substitui a estimativa (o sinal acompanha)
    const agreed = mode !== 'done' && price !== null
    const estimate: Estimate = {
      ...est,
      hours,
      ...(agreed
        ? { value: price, low: price, high: price, deposit: Math.round((price * pricing.settings.depositPercent) / 10) * 10 }
        : {}),
    }
    const booking: Booking = {
      id: uid(),
      createdAt: new Date().toISOString(),
      status: mode,
      client: { name: name.trim(), phone: onlyDigits(phone), instagram: instagram.replace('@', '').trim() },
      tattoo: {
        placements,
        styleId,
        color,
        description: '',
        placementLabels: placements.map((p) => areas.find((a) => a.id === p.areaId)?.name ?? p.areaId),
        styleName: style.name,
      },
      estimate,
      date,
      time,
      notes: notes.trim(),
      kind: 'session',
      firstTattoo: firstTattoo || null,
      cover: null,
      referencePath: null,
      origin: 'studio',
      finalPrice: mode === 'done' ? price : null,
    }
    setSaving(true)
    setError(null)
    try {
      await createBooking(booking)
      onCreated(booking)
    } catch (err) {
      setError(
        err instanceof SlotTakenError
          ? 'Já existe outro agendamento ativo nesse horário. Escolha outro horário.'
          : 'Não foi possível salvar. Se persistir, rode o supabase/studio-booking.sql no Supabase.',
      )
    } finally {
      setSaving(false)
    }
  }

  const setPlace = (key: string, patch: Partial<PlaceRow>) => setPlaces((list) => list.map((p) => (p.key === key ? { ...p, ...patch } : p)))
  const today = toISODate(new Date())

  return (
    <form onSubmit={submit} className="card mt-6 animate-fade-up border-violet/40 p-4 sm:p-5">
      <p className="flex items-center gap-2 font-display text-2xl tracking-wide">
        <CalendarPlus size={20} className="text-violet-light" /> Novo agendamento
      </p>
      <p className="mt-0.5 text-sm text-mute">Para quando você mesmo marca o horário de alguém.</p>

      {/* Situação */}
      <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Situação">
        {MODES.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} className="chip" data-active={mode === m.id} onClick={() => setMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-mute">{MODES.find((m) => m.id === mode)!.hint}</p>

      {/* Cliente */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <label className="block sm:col-span-1">
          <span className="label">Nome</span>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        </label>
        <label className="block">
          <span className="label">WhatsApp</span>
          <input className="input" inputMode="tel" placeholder="(32) 99999-9999" value={phone} onChange={(e) => setPhone(maskPhone(e.target.value))} />
        </label>
        <label className="block">
          <span className="label">
            Instagram <span className="normal-case tracking-normal opacity-60">(opcional)</span>
          </span>
          <input className="input" placeholder="@perfil" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
        </label>
      </div>

      {/* Tattoo */}
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="label">Estilo</span>
          <select className="input" value={styleId} onChange={(e) => setStyleId(e.target.value)}>
            {styles.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="label">Cor</span>
          <div className="flex gap-2">
            <button type="button" className="chip" data-active={!color} onClick={() => setColor(false)}>
              Preto e cinza
            </button>
            <button type="button" className="chip" data-active={color} onClick={() => setColor(true)}>
              Colorida
            </button>
          </div>
        </div>
      </div>

      <span className="label mt-4">Locais</span>
      <div className="space-y-2">
        {places.map((p) => (
          <div key={p.key} className="flex items-center gap-2">
            <select className="input min-w-0 flex-1" value={p.areaId} onChange={(e) => setPlace(p.key, { areaId: e.target.value })} aria-label="Local">
              <option value="" disabled>
                Escolha o local
              </option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <div className="relative w-24 shrink-0">
              <input
                className="input pr-9"
                inputMode="numeric"
                value={p.sizeCm}
                onChange={(e) => setPlace(p.key, { sizeCm: e.target.value.replace(/[^0-9]/g, '') })}
                aria-label="Tamanho em cm"
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-mute">cm</span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm shrink-0 px-2"
              disabled={places.length === 1}
              onClick={() => setPlaces((list) => list.filter((x) => x.key !== p.key))}
              aria-label="Remover local"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setPlaces((list) => [...list, { key: uid(), areaId: '', sizeCm: '10' }])}
        >
          <Plus size={15} /> Adicionar local
        </button>
      </div>

      {/* Quando */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="label">Dia</span>
          <input type="date" className="input" min={mode === 'done' ? undefined : today} max={mode === 'done' ? today : undefined} value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="block">
          <span className="label">Início</span>
          <input type="time" className="input" step={900} value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <label className="block">
          <span className="label">Duração</span>
          <div className="relative">
            <input
              className="input pr-8"
              inputMode="decimal"
              placeholder={est ? String(est.hours) : '1'}
              value={hoursText}
              onChange={(e) => setHoursText(e.target.value.replace(/[^0-9.,]/g, ''))}
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-mute">h</span>
          </div>
        </label>
      </div>
      {date && mode !== 'done' && (
        <div className="mt-2">
          <p className="text-xs text-mute">
            {free.length ? `Horários livres para ${formatHours(hours)} (toque para escolher):` : 'Nenhum horário livre nesse dia para essa duração. Você ainda pode digitar um horário.'}
          </p>
          {free.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {free.map((t) => (
                <button key={t} type="button" className="chip px-3 py-1 text-sm" data-active={time === t} onClick={() => setTime(t)}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Valor */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div>
          <span className="label">Estimativa da tabela</span>
          <p className="flex h-[46px] items-center text-sm">
            {est ? (
              <>
                <span className="font-semibold">{formatBRL(est.value)}</span>
                <span className="ml-2 text-mute">· ~{formatHours(est.hours)}</span>
              </>
            ) : (
              <span className="text-mute">Escolha o estilo e os locais</span>
            )}
          </p>
        </div>
        <label className="block">
          <span className="label">
            {mode === 'done' ? 'Valor cobrado' : 'Valor combinado'}{' '}
            <span className="normal-case tracking-normal opacity-60">(opcional)</span>
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-mute">R$</span>
            <input
              className="input pl-9"
              inputMode="decimal"
              placeholder={est ? String(Math.round(est.value)) : ''}
              value={priceText}
              onChange={(e) => setPriceText(e.target.value.replace(/[^0-9.,]/g, ''))}
              aria-invalid={!priceOk}
            />
          </div>
        </label>
      </div>

      <label className="mt-4 flex cursor-pointer items-center gap-3 text-sm">
        <input type="checkbox" className="h-4 w-4 accent-violet" checked={firstTattoo} onChange={(e) => setFirstTattoo(e.target.checked)} />
        É a primeira tattoo da pessoa
      </label>

      <label className="mt-4 block">
        <span className="label">
          Observações <span className="normal-case tracking-normal opacity-60">(opcional)</span>
        </span>
        <textarea className="input min-h-16" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      {error && (
        <p className="mt-4 rounded-md border border-pink/40 bg-pink/10 p-3 text-sm" role="alert">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary" disabled={!valid}>
          {saving ? <Loader2 size={17} className="animate-spin" /> : <CalendarPlus size={17} />} Salvar agendamento
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
