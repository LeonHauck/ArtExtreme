import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ArrowRight, CalendarX2, Camera, Check, ClipboardCheck, Loader2, Pencil, ScanLine, Sparkles, X } from 'lucide-react'
import { useStudio } from '@/store/studio'
import { useEstimate } from '@/hooks/useEstimate'
import { availableSlots, bookableDates, type BusySlot } from '@/lib/schedule'
import { createBooking, fetchBusy, SlotTakenError } from '@/lib/bookingsRepo'
import { uploadReference } from '@/lib/referenceRepo'
import { FIRST_TATTOO_TIPS, REASON_TEXT, evaluationReason } from '@/lib/triage'
import { formatBRL, formatDateLong, formatHours, maskPhone, onlyDigits, parseISODate, uid } from '@/lib/format'
import { bookingMessageToStudio, waLink } from '@/lib/whatsapp'
import { WhatsAppIcon } from '@/components/ui/BrandIcons'
import { Ornament } from '@/components/ui/Ornament'
import type { Booking as BookingT, CoverType } from '@/types'

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

/** Botões de escolha (uma opção) das perguntas da triagem. */
function Choice<T extends string | boolean>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T | null
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div>
      <p className="label">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className="chip"
            data-active={value === o.value}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Primeira tattoo: boas-vindas e dicas para o dia. */
function FirstTattooCard() {
  return (
    <div className="card mt-5 border-sun/30 p-6 text-left">
      <p className="flex items-center gap-2 font-semibold">
        <Sparkles size={17} className="text-sun" /> Sua primeira tattoo!
      </p>
      <p className="mt-1 text-sm text-mute">
        Fica tranquilo(a): o Mike vai te explicar tudo com calma. Algumas dicas para o dia:
      </p>
      <ul className="mt-3 space-y-1.5 text-sm text-bone/85">
        {FIRST_TATTOO_TIPS.map((t) => (
          <li key={t} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sun" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Success({ booking }: { booking: BookingT }) {
  const studio = useStudio((s) => s.studio)
  const evaluation = booking.kind === 'evaluation'
  return (
    <div className="mx-auto max-w-lg animate-fade-up px-4 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-violet bg-violet/15">
        {evaluation ? <ClipboardCheck size={28} className="text-bone" /> : <Check size={30} className="text-bone" />}
      </div>
      <h1 className="mt-6 font-display text-5xl tracking-wide">
        {evaluation ? 'Pedido de avaliação enviado' : 'Pedido enviado'}
      </h1>
      <p className="mt-2 text-mute">
        {evaluation
          ? 'O Mike vai avaliar seu projeto e te chamar no WhatsApp com o valor e as datas.'
          : `${formatDateLong(booking.date)} às ${booking.time}`}
      </p>
      <Ornament className="my-8" />

      {booking.firstTattoo && <FirstTattooCard />}

      <div className="card mt-5 p-6 text-left">
        <p className="font-semibold">{evaluation ? 'Quer adiantar?' : 'Falta só um passo'}</p>
        <p className="mt-1 text-sm text-mute">
          {evaluation ? (
            'Se quiser, mande mais referências ou conte mais da ideia pelo WhatsApp do estúdio.'
          ) : (
            <>
              Envie a mensagem abaixo no WhatsApp do estúdio com suas referências. O horário é confirmado após o
              pagamento do sinal de <span className="text-bone">{formatBRL(booking.estimate.deposit)}</span>.
            </>
          )}
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
  const resetDraft = useStudio((s) => s.resetDraft)
  const { draft, placements, style, ready, estimate } = useEstimate()

  const [date, setDate] = useState<string | null>(null)
  const [time, setTime] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [done, setDone] = useState<BookingT | null>(null)
  const [busy, setBusy] = useState<BusySlot[] | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Triagem: "primeira tattoo?" e "cobertura ou reforma?"
  const [firstTattoo, setFirstTattoo] = useState<boolean | null>(null)
  const [cover, setCover] = useState<CoverType | 'no'>('no')
  const [photo, setPhoto] = useState<File | null>(null)
  const photoPreview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo])
  useEffect(
    () => () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    },
    [photoPreview],
  )

  const dates = useMemo(() => bookableDates(schedule), [schedule])

  // Horários ocupados (no banco, sem dados de clientes)
  const loadBusy = useCallback(async () => {
    if (!dates.length) return setBusy([])
    try {
      setBusy(await fetchBusy(dates[0], dates[dates.length - 1]))
    } catch {
      setBusy([])
      setError('Não foi possível carregar a agenda. Verifique sua internet e tente de novo.')
    }
  }, [dates])

  useEffect(() => {
    void loadBusy()
  }, [loadBusy])

  const hours = estimate?.hours ?? 1
  const days = useMemo(
    () => dates.map((iso) => ({ iso, free: availableSlots(schedule, busy ?? [], iso, hours).length })),
    [dates, schedule, busy, hours],
  )
  const slots = useMemo(
    () => (date ? availableSlots(schedule, busy ?? [], date, hours) : []),
    [schedule, busy, date, hours],
  )

  if (done) return <Success booking={done} />
  if (!ready || !estimate || !style) return <NeedsSimulation />

  // Cobertura, reforma ou fechamento: vira pedido de avaliação (sem data)
  const reason = evaluationReason(cover === 'no' ? null : cover, estimate)
  const evaluation = reason !== null
  const reasonText = reason ? REASON_TEXT[reason] : null
  const personOk = form.name.trim().length >= 2 && onlyDigits(form.phone).length >= 10 && form.adult && !sending
  const valid = evaluation ? personOk && (!reasonText?.photoRequired || !!photo) : !!(date && time) && personOk

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setSending(true)
    setError(null)
    let referencePath: string | null = null
    if (photo) {
      try {
        referencePath = await uploadReference(photo)
      } catch (err) {
        setSending(false)
        setError(err instanceof Error ? err.message : 'Não foi possível enviar a foto.')
        return
      }
    }
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
      date: evaluation ? '' : date!,
      time: evaluation ? '' : time!,
      notes: form.notes.trim(),
      kind: evaluation ? 'evaluation' : 'session',
      firstTattoo,
      cover: cover === 'no' ? null : cover,
      referencePath,
    }
    try {
      await createBooking(booking)
      resetDraft()
      setDone(booking)
      window.scrollTo({ top: 0 })
    } catch (err) {
      if (err instanceof SlotTakenError) {
        // Alguém reservou segundos antes: atualiza a agenda e pede outro horário
        setTime(null)
        await loadBusy()
        setError(err.message)
      } else {
        setError('Não foi possível enviar o pedido. Verifique sua internet e tente de novo.')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-3xl px-4 pt-8 pb-28 sm:px-6 md:pb-10">
      <header className="mb-8">
        <p className="eyebrow">Agendamento</p>
        <h1 className="mt-2 font-display text-5xl tracking-wide sm:text-6xl">
          {evaluation ? 'Peça sua avaliação' : 'Reserve seu horário'}
        </h1>
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
              {evaluation
                ? `a partir de ${formatBRL(estimate.low)}`
                : `${formatBRL(estimate.low)} – ${formatBRL(estimate.high)}`}
            </p>
            <p className="text-xs text-mute">{evaluation ? 'valor final na avaliação' : 'estimativa'}</p>
          </div>
          <Link to="/orcamento" className="btn btn-outline btn-sm" aria-label="Editar tattoo">
            <Pencil size={15} />
          </Link>
        </div>
      </section>

      {/* Triagem rápida */}
      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        <Choice
          label="É sua primeira tattoo?"
          value={firstTattoo}
          options={[
            { value: true, label: 'Sim, a primeira!' },
            { value: false, label: 'Não' },
          ]}
          onChange={setFirstTattoo}
        />
        <Choice
          label="É cobertura ou reforma de uma tattoo antiga?"
          value={cover}
          options={[
            { value: 'no', label: 'Não' },
            { value: 'cover', label: 'Cobertura' },
            { value: 'rework', label: 'Reforma' },
          ]}
          onChange={setCover}
        />
        {firstTattoo && (
          <p className="flex items-start gap-2 text-sm text-mute sm:col-span-2">
            <Sparkles size={16} className="mt-0.5 shrink-0 text-sun" />
            Que demais! O Mike vai saber que é sua primeira vez e te guiar em tudo.
          </p>
        )}
      </section>

      {/* Avaliação: cobertura, reforma ou fechamento */}
      {evaluation && reasonText && (
        <section className="card mt-8 animate-fade-up border-violet/40 p-5">
          <p className="flex items-center gap-2 font-display text-2xl tracking-wide">
            <ClipboardCheck size={20} className="shrink-0 text-violet-light" /> {reasonText.title}
          </p>
          <p className="mt-1 text-sm text-mute">{reasonText.text}</p>
          <p className="label mt-5">
            {reasonText.photo}{' '}
            {!reasonText.photoRequired && <span className="normal-case tracking-normal opacity-60">(opcional)</span>}
          </p>
          {photo && photoPreview ? (
            <div className="relative inline-block">
              <img src={photoPreview} alt="Foto escolhida" className="h-40 w-40 rounded-md object-cover" />
              <button
                type="button"
                className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-bone ring-1 ring-bone/20"
                onClick={() => setPhoto(null)}
                aria-label="Remover foto"
              >
                <X size={15} />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-bone/25 py-6 text-sm text-mute transition hover:border-violet hover:text-bone">
              <Camera size={18} /> Tirar ou escolher foto
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file && file.type.startsWith('image/')) setPhoto(file)
                  e.target.value = ''
                }}
              />
            </label>
          )}
          <p className="mt-3 text-xs text-mute">Sem horário reservado ainda: o Mike agenda com você depois de avaliar.</p>
        </section>
      )}

      {/* Data (só no agendamento direto) */}
      {!evaluation && (
        <section className="mt-10">
          <h2 className="label">Escolha o dia</h2>
          {busy === null ? (
            <p className="flex items-center gap-2 text-mute">
              <Loader2 size={18} className="animate-spin" /> Carregando horários livres…
            </p>
          ) : days.length === 0 ? (
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
      )}

      {/* Horário */}
      {!evaluation && date && (
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
            placeholder="Alergias, cicatriz no local, alguma preocupação…"
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

      {error && (
        <p className="mt-8 rounded-md border border-pink/40 bg-pink/10 p-3 text-sm text-bone" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary mt-6 w-full" disabled={!valid}>
        {sending ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <>
            {evaluation ? 'Enviar para avaliação' : 'Solicitar horário'}
            {!evaluation && date && time ? ` · ${time}` : ''}
          </>
        )}
      </button>
      <p className="mt-3 text-center text-xs text-mute">
        {evaluation
          ? reasonText?.photoRequired && !photo
            ? 'Envie a foto para continuar.'
            : 'O Mike recebe seu pedido na hora e te chama no WhatsApp.'
          : 'O horário fica reservado como pendente até a confirmação do sinal.'}
      </p>
    </form>
  )
}
