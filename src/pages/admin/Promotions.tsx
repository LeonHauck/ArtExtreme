import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Eye, Gift, Loader2, Plus, TicketPercent, Trash2 } from 'lucide-react'
import { useStudio } from '@/store/studio'
import { Toggle } from '@/components/ui/Toggle'
import { NumberField } from '@/components/ui/NumberField'
import { PROMO_THEMES, PromoHero, PromoStrip } from '@/components/promo/PromoBanner'
import { getPromo, isPromoLive } from '@/lib/promo'
import { formatDateShort, toISODate } from '@/lib/format'
import { CouponCard } from '@/components/promo/CouponPopup'
import { createCoupon, deleteCoupon, getCouponPopup, isMissingTable, listCoupons, normalizeCode, updateCoupon } from '@/lib/coupons'
import { listBookings } from '@/lib/bookingsRepo'
import type { Coupon, CouponPopup, PromoBanner, PromoTheme } from '@/types'

/** Modelos prontos: preenchem o texto e o visual; o Mike ajusta o resto. */
const TEMPLATES: { name: string; patch: Partial<PromoBanner> }[] = [
  {
    name: 'Black Friday',
    patch: { title: 'Black Friday', percent: 30, theme: 'blackfriday', text: 'Desconto especial para tattoos agendadas durante a Black Friday.', ctaLabel: 'Quero meu desconto' },
  },
  {
    name: 'Natal',
    patch: { title: 'Natal ArtExtreme', percent: 20, theme: 'xmas', text: 'Presenteie (ou se presenteie) com uma tattoo. Condição especial de fim de ano.', ctaLabel: 'Ver condição de Natal' },
  },
  {
    name: 'Ano Novo',
    patch: { title: 'Ano novo, tattoo nova', percent: 15, theme: 'newyear', text: 'Comece o ano com aquela tattoo que você vem adiando.', ctaLabel: 'Simular minha tattoo' },
  },
  {
    name: 'Páscoa',
    patch: { title: 'Páscoa ArtExtreme', percent: 15, theme: 'easter', text: 'Troque o chocolate por uma tattoo que dura para sempre.', ctaLabel: 'Quero aproveitar' },
  },
]

function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-mute">{hint}</span>}
    </label>
  )
}

function Status({ promo }: { promo: PromoBanner }) {
  const today = toISODate(new Date())
  const [text, cls] = !promo.active
    ? ['Desligado', 'border-bone/15 text-mute']
    : isPromoLive(promo)
      ? ['No ar agora', 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400']
      : promo.startsOn && today < promo.startsOn
        ? [`Agendado · começa ${formatDateShort(promo.startsOn)}`, 'border-sun/40 bg-sun/10 text-sun']
        : ['Encerrado', 'border-pink/40 bg-pink/10 text-pink']
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>{text}</span>
}

function BannerEditor({ coupons }: { coupons: Coupon[] }) {
  const studio = useStudio((s) => s.studio)
  const updateStudio = useStudio((s) => s.updateStudio)
  const promo = getPromo(studio)
  const set = (patch: Partial<PromoBanner>) => updateStudio({ promo: { ...promo, ...patch } })
  // Cupom ligado: o % do banner vem dele (se pausar ou vencer, volta ao % manual)
  const linked = promo.couponCode ? coupons.find((c) => c.code === promo.couponCode) : undefined
  const linkedOk = !!linked && couponStatus(linked).text === 'Valendo'
  const previewPercent = linkedOk ? linked.percent : null

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl tracking-wide">
            Banner do site <Status promo={promo} />
          </h2>
          <p className="mt-0.5 text-sm text-mute">Destaque na página inicial e faixa no topo. Salva sozinho.</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Toggle checked={promo.active} label="Mostrar no site" onChange={(active) => set({ active })} />
          Mostrar no site
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-mute">Modelos:</span>
        {TEMPLATES.map((t) => (
          <button key={t.name} type="button" className="chip text-sm" onClick={() => set(t.patch)}>
            {t.name}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_10rem]">
        <Field label="Título">
          <input className="input" value={promo.title} maxLength={40} onChange={(e) => set({ title: e.target.value })} />
        </Field>
        <Field label="Desconto" hint={linkedOk ? 'Vem do cupom' : '0 = sem número'}>
          {linkedOk ? (
            <p className="input flex items-center text-mute">{linked.percent}%</p>
          ) : (
            <NumberField value={promo.percent} min={0} max={100} suffix="%" onCommit={(percent) => set({ percent: Math.round(percent) })} />
          )}
        </Field>
        <Field
          label="Cupom da promoção"
          className="sm:col-span-2"
          hint="O banner mostra o % e o código do cupom. Quem tocar no botão já chega no agendamento com o cupom aplicado."
        >
          <select className="input" value={promo.couponCode ?? ''} onChange={(e) => set({ couponCode: e.target.value })}>
            <option value="">Nenhum (usar o % digitado)</option>
            {coupons.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} · {c.percent}% {couponStatus(c).text !== 'Valendo' ? `(${couponStatus(c).text.toLowerCase()})` : ''}
              </option>
            ))}
          </select>
        </Field>
        {promo.couponCode && !linkedOk && (
          <p className="text-sm text-sun sm:col-span-2">
            {linked ? 'Esse cupom não está valendo agora:' : 'Esse cupom não existe mais:'} o banner usa o {promo.percent}% digitado e não mostra
            código.
          </p>
        )}
        <Field label="Texto" className="sm:col-span-2">
          <textarea className="input min-h-16" value={promo.text} maxLength={160} onChange={(e) => set({ text: e.target.value })} />
        </Field>
        <Field label="Texto do botão">
          <input className="input" value={promo.ctaLabel} maxLength={30} onChange={(e) => set({ ctaLabel: e.target.value })} />
        </Field>
        <Field label="O botão leva para">
          <select className="input" value={promo.ctaLink} onChange={(e) => set({ ctaLink: e.target.value as PromoBanner['ctaLink'] })}>
            <option value="simulator">Simulador</option>
            <option value="booking">Agendar</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </Field>
        <Field label="Começa em" hint="Vazio = já começa">
          <input type="date" className="input" value={promo.startsOn} onChange={(e) => set({ startsOn: e.target.value })} />
        </Field>
        <Field label="Termina em" hint="Vazio = sem fim (sem contagem)">
          <input type="date" className="input" value={promo.endsOn} min={promo.startsOn || undefined} onChange={(e) => set({ endsOn: e.target.value })} />
        </Field>
      </div>

      <span className="label mt-5">Visual</span>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(PROMO_THEMES) as PromoTheme[]).map((k) => (
          <button key={k} type="button" className="chip" data-active={promo.theme === k} onClick={() => set({ theme: k })}>
            {PROMO_THEMES[k].label}
          </button>
        ))}
      </div>

      <span className="label mt-5">Onde aparece</span>
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4 accent-violet" checked={promo.showHome} onChange={(e) => set({ showHome: e.target.checked })} />
          Destaque na página inicial
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" className="h-4 w-4 accent-violet" checked={promo.showStrip} onChange={(e) => set({ showStrip: e.target.checked })} />
          Faixa no topo de todas as páginas
        </label>
      </div>

      <p className="mt-6 flex items-center gap-1.5 font-display text-sm tracking-[0.25em] text-mute uppercase">
        <Eye size={15} /> Prévia
      </p>
      <div className="mt-2 space-y-3 rounded-lg border border-bone/10 bg-ink/60 p-3">
        {promo.showStrip && <PromoStrip promo={promo} preview couponPercent={previewPercent} />}
        {promo.showHome && <PromoHero promo={promo} preview couponPercent={previewPercent} />}
        {!promo.showStrip && !promo.showHome && <p className="py-6 text-center text-sm text-mute">Escolha onde o banner aparece.</p>}
      </div>
      <p className="mt-3 text-xs text-mute">
        O banner divulga a promoção. O desconto em si só entra pelo cupom (ligado acima ou digitado pelo cliente) ou pelo valor combinado na
        Agenda.
      </p>
    </section>
  )
}

/* ─── Cupons ──────────────────────────────────────────────────────────── */

interface CouponsState {
  list: Coupon[] | null
  usage: Map<string, number>
  missing: boolean
  error: string | null
  reload: () => Promise<void>
}

function useCoupons(): CouponsState {
  const [list, setList] = useState<Coupon[] | null>(null)
  const [usage, setUsage] = useState<Map<string, number>>(new Map())
  const [missing, setMissing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reload = useCallback(async () => {
    try {
      const [coupons, bookings] = await Promise.all([listCoupons(), listBookings()])
      // Usos = pedidos com o cupom que não foram cancelados
      const u = new Map<string, number>()
      for (const b of bookings) if (b.coupon && b.status !== 'cancelled') u.set(b.coupon.code, (u.get(b.coupon.code) ?? 0) + 1)
      setList(coupons)
      setUsage(u)
      setMissing(false)
      setError(null)
    } catch (e) {
      if (isMissingTable(e)) setMissing(true)
      else setError('Não foi possível carregar os cupons. Verifique a internet.')
      setList([])
    }
  }, [])
  useEffect(() => {
    void reload()
  }, [reload])
  return { list, usage, missing, error, reload }
}

const couponStatus = (c: Coupon) => {
  const today = toISODate(new Date())
  if (!c.active) return { text: 'Pausado', cls: 'border-bone/15 text-mute' }
  if (c.ends_on && today > c.ends_on) return { text: 'Expirado', cls: 'border-pink/40 bg-pink/10 text-pink' }
  if (c.starts_on && today < c.starts_on) return { text: `Começa ${formatDateShort(c.starts_on)}`, cls: 'border-sun/40 bg-sun/10 text-sun' }
  return { text: 'Valendo', cls: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400' }
}

function CouponsPanel({ state }: { state: CouponsState }) {
  const { list, usage, missing, error, reload } = state
  const [code, setCode] = useState('')
  const [percent, setPercent] = useState('20')
  const [endsOn, setEndsOn] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const pct = Number(percent)
  const valid = code.length >= 3 && pct >= 1 && pct <= 90 && !busy

  const run = async (action: () => Promise<void>, ok?: string) => {
    setBusy(true)
    setMsg(null)
    try {
      await action()
      if (ok) setMsg({ ok: true, text: ok })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Algo deu errado. Tente de novo.' })
    }
    await reload()
    setBusy(false)
  }

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-display text-2xl tracking-wide">
        <TicketPercent size={20} className="text-violet-light" /> Cupons de desconto
      </h2>
      <p className="mt-0.5 text-sm text-mute">
        O cliente digita o código no final do agendamento e já vê o valor com desconto. Cada WhatsApp usa cada cupom uma vez.
      </p>

      {missing ? (
        <p className="mt-4 rounded-md border border-sun/40 bg-sun/10 p-3 text-sm">
          Para usar cupons, rode o arquivo <strong>supabase/coupons.sql</strong> no Supabase (SQL Editor). Depois é só recarregar esta página.
        </p>
      ) : (
        <>
          <form
            className="mt-5 grid gap-3 rounded-md border border-bone/10 p-3 sm:grid-cols-[1.2fr_7rem_1fr_1.4fr_auto] sm:items-end"
            onSubmit={(e) => {
              e.preventDefault()
              if (!valid) return
              void run(async () => {
                await createCoupon({ code, percent: pct, ends_on: endsOn || null, note: note.trim() || null })
                setCode('')
                setNote('')
                setEndsOn('')
              }, `Cupom ${code} criado.`)
            }}
          >
            <Field label="Código">
              <input className="input font-semibold tracking-wider uppercase" placeholder="ART40" value={code} maxLength={20} onChange={(e) => setCode(normalizeCode(e.target.value))} />
            </Field>
            <Field label="Desconto">
              <div className="relative">
                <input className="input pr-8" inputMode="numeric" value={percent} onChange={(e) => setPercent(e.target.value.replace(/\D/g, '').slice(0, 2))} />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-mute">%</span>
              </div>
            </Field>
            <Field label="Vale até" hint="Vazio = sem prazo">
              <input type="date" className="input" value={endsOn} min={toISODate(new Date())} onChange={(e) => setEndsOn(e.target.value)} />
            </Field>
            <Field label="Anotação (só você vê)">
              <input className="input" placeholder="Ex.: seguidores do Instagram" value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <button className="btn btn-primary" disabled={!valid}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Criar
            </button>
          </form>
          {msg && <p className={`mt-2 text-sm ${msg.ok ? 'text-emerald-400' : 'text-pink'}`}>{msg.text}</p>}
          {error && <p className="mt-2 text-sm text-pink">{error}</p>}

          {list === null ? (
            <div className="mt-6 flex justify-center text-mute">
              <Loader2 className="animate-spin" />
            </div>
          ) : list.length === 0 ? (
            <p className="mt-6 text-center text-sm text-mute">Nenhum cupom ainda. Crie o primeiro acima.</p>
          ) : (
            <ul className="mt-4 divide-y divide-bone/5">
              {list.map((c) => {
                const st = couponStatus(c)
                const uses = usage.get(c.code) ?? 0
                return (
                  <li key={c.code} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-xl tracking-[0.15em]">{c.code}</span>
                        <span className="rounded-sm bg-sun/15 px-1.5 text-sm font-semibold text-sun">−{c.percent}%</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[0.7rem] font-medium ${st.cls}`}>{st.text}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-mute">
                        {c.ends_on ? `Vale até ${formatDateShort(c.ends_on)}` : 'Sem prazo'} · {uses} {uses === 1 ? 'uso' : 'usos'}
                        {c.note && ` · ${c.note}`}
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-mute">
                      <Toggle checked={c.active} label={`Cupom ${c.code} ativo`} onChange={(active) => void run(() => updateCoupon(c.code, { active }))} />
                      {c.active ? 'Ativo' : 'Pausado'}
                    </label>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm px-2 hover:text-pink"
                      aria-label={`Apagar cupom ${c.code}`}
                      onClick={() => confirm(`Apagar o cupom ${c.code}? Quem já usou continua com o desconto no pedido.`) && void run(() => deleteCoupon(c.code))}
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}
    </section>
  )
}

/* ─── Popup do cupom ──────────────────────────────────────────────────── */

function PopupPanel({ coupons }: { coupons: Coupon[] }) {
  const studio = useStudio((s) => s.studio)
  const updateStudio = useStudio((s) => s.updateStudio)
  const popup = getCouponPopup(studio)
  const set = (patch: Partial<CouponPopup>) => updateStudio({ couponPopup: { ...popup, ...patch } })
  const selected = coupons.find((c) => c.code === popup.code)
  const usable = selected && couponStatus(selected).text === 'Valendo'

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl tracking-wide">
            <Gift size={20} className="text-violet-light" /> Popup do cupom
          </h2>
          <p className="mt-0.5 text-sm text-mute">Aparece para o visitante com um timer só dele, a partir da primeira vez que vê.</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Toggle checked={popup.active} label="Mostrar popup no site" onChange={(active) => set({ active })} />
          Mostrar no site
        </label>
      </div>

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[1fr_auto]">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cupom oferecido" className="sm:col-span-2">
            <select className="input" value={popup.code} onChange={(e) => set({ code: e.target.value })}>
              <option value="">Escolha um cupom</option>
              {coupons.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} · {c.percent}% {couponStatus(c).text !== 'Valendo' ? `(${couponStatus(c).text.toLowerCase()})` : ''}
                </option>
              ))}
            </select>
          </Field>
          {popup.code && !usable && (
            <p className="text-sm text-sun sm:col-span-2">Esse cupom não está valendo agora, então o popup não aparece no site.</p>
          )}
          <Field label="Título" className="sm:col-span-2">
            <input className="input" value={popup.title} maxLength={40} onChange={(e) => set({ title: e.target.value })} />
          </Field>
          <Field label="Texto" className="sm:col-span-2">
            <textarea className="input min-h-16" value={popup.text} maxLength={160} onChange={(e) => set({ text: e.target.value })} />
          </Field>
          <Field label="Timer" hint="Minutos para cada visitante">
            <NumberField value={popup.timerMinutes} min={1} max={120} suffix="min" onCommit={(timerMinutes) => set({ timerMinutes: Math.round(timerMinutes) })} />
          </Field>
          <Field label="Aparece depois de" hint="Segundos navegando no site">
            <NumberField value={popup.delaySeconds} min={0} max={60} suffix="s" onCommit={(delaySeconds) => set({ delaySeconds: Math.round(delaySeconds) })} />
          </Field>
          <p className="text-xs text-mute sm:col-span-2">
            Quando o timer de um visitante acaba, o popup some para ele, mas o cupom continua valendo até a data cadastrada. Evite textos
            como “última chance” para não parecer propaganda enganosa.
          </p>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-1.5 font-display text-sm tracking-[0.25em] text-mute uppercase">
            <Eye size={15} /> Prévia
          </p>
          {selected ? (
            <CouponCard config={popup} percent={selected.percent} remainingMs={popup.timerMinutes * 60_000} onUse={() => {}} onClose={() => {}} />
          ) : (
            <p className="w-72 rounded-md border border-dashed border-bone/20 p-6 text-center text-sm text-mute">Escolha um cupom para ver a prévia.</p>
          )}
        </div>
      </div>
    </section>
  )
}

export default function Promotions() {
  const coupons = useCoupons()
  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-4xl tracking-wide">Promoções</h1>
        <p className="text-xs text-mute">Alterações salvas automaticamente</p>
      </div>
      <BannerEditor coupons={coupons.list ?? []} />
      <CouponsPanel state={coupons} />
      {!coupons.missing && <PopupPanel coupons={coupons.list ?? []} />}
    </div>
  )
}
