import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Check, Copy, Gift, X } from 'lucide-react'
import { useStudio } from '@/store/studio'
import { SAVED_COUPON_KEY, checkCoupon, getCouponPopup } from '@/lib/coupons'
import { splitMs } from '@/lib/promo'
import type { CouponPopup as PopupConfig } from '@/types'

/**
 * Popup que oferece o cupom ao visitante, com timer individual: começa quando
 * a pessoa vê o popup pela primeira vez (guardado no aparelho) e, ao zerar,
 * o popup some de vez. O cupom em si vale conforme a validade cadastrada.
 */

interface SeenState {
  firstSeen: number
  closed: boolean
}

const keyFor = (code: string) => `ae-coupon-popup:${code}`

function readSeen(code: string): SeenState | null {
  try {
    const raw = localStorage.getItem(keyFor(code))
    return raw ? (JSON.parse(raw) as SeenState) : null
  } catch {
    return null
  }
}

function writeSeen(code: string, s: SeenState) {
  try {
    localStorage.setItem(keyFor(code), JSON.stringify(s))
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
}

/** O cartão do popup (usado no site e na prévia do painel). */
export function CouponCard({
  config,
  percent,
  remainingMs,
  onUse,
  onClose,
}: {
  config: PopupConfig
  percent: number
  remainingMs: number
  onUse: () => void
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const t = splitMs(remainingMs)
  const mm = String(t.hours * 60 + t.minutes).padStart(2, '0')
  const ss = String(t.seconds).padStart(2, '0')

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(config.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* sem permissão: o código está visível para copiar à mão */
    }
  }

  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-violet/50 bg-gradient-to-b from-violet-dark via-ink to-ink p-6 text-center shadow-[0_0_80px_-20px_var(--color-violet)]">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-violet/40 blur-3xl" />
      <button type="button" className="absolute top-3 right-3 rounded-full p-1.5 text-mute hover:text-bone" onClick={onClose} aria-label="Fechar">
        <X size={18} />
      </button>
      <div className="relative">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-sun/40 bg-sun/10 text-sun">
          <Gift size={22} />
        </span>
        <p className="mt-3 font-display text-sm tracking-[0.3em] text-violet-light uppercase">{config.title || 'Presente para você'}</p>
        <p className="mt-1 font-display text-6xl leading-none tracking-wide text-sun">
          {percent}% <span className="text-3xl">OFF</span>
        </p>
        {config.text && <p className="mt-3 text-sm text-bone/80">{config.text}</p>}

        <button
          type="button"
          onClick={() => void copy()}
          className="mx-auto mt-4 flex items-center gap-2 rounded-md border-2 border-dashed border-sun/50 bg-sun/5 px-4 py-2 font-display text-2xl tracking-[0.2em] text-bone transition hover:bg-sun/10"
          aria-label={`Copiar o código ${config.code}`}
        >
          {config.code}
          {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={16} className="text-mute" />}
        </button>
        <p className="mt-1 text-xs text-mute">{copied ? 'Código copiado' : 'Toque no código para copiar'}</p>

        {remainingMs > 0 && (
          <div className="mt-4" aria-label={`Tempo restante: ${mm} minutos e ${ss} segundos`}>
            <p className="text-xs tracking-widest text-mute uppercase">Oferta disponível por</p>
            <p className="mt-1 font-display text-4xl tracking-wider tabular-nums text-bone">
              {mm}:{ss}
            </p>
          </div>
        )}

        <button type="button" className="btn btn-primary mt-5 w-full" onClick={onUse}>
          Usar meu cupom
        </button>
      </div>
    </div>
  )
}

/** Popup no site (não aparece no painel nem na tela de agendar). */
export function CouponPopup() {
  const studio = useStudio((s) => s.studio)
  const config = getCouponPopup(studio)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [percent, setPercent] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const code = config.code.trim().toUpperCase()
  const enabled = config.active && code.length >= 3 && pathname !== '/agendar'

  // Espera alguns segundos e confere se o cupom vale antes de mostrar
  useEffect(() => {
    if (!enabled) return
    const seen = readSeen(code)
    const durationMs = Math.max(1, config.timerMinutes) * 60_000
    if (seen?.closed || (seen && Date.now() - seen.firstSeen >= durationMs)) return
    let cancelled = false
    const t = setTimeout(async () => {
      const r = await checkCoupon(code)
      if (cancelled || !r.valid || !r.percent) return
      if (!readSeen(code)) writeSeen(code, { firstSeen: Date.now(), closed: false })
      setPercent(r.percent)
      setVisible(true)
    }, seen ? 800 : Math.max(0, config.delaySeconds) * 1000)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [enabled, code, config.delaySeconds, config.timerMinutes])

  // Relógio do timer; quando zera, o popup some e não volta
  // (o cupom continua valendo pela validade cadastrada)
  useEffect(() => {
    if (!visible) return
    const t = setInterval(() => {
      const s = readSeen(code)
      const left = (s?.firstSeen ?? Date.now()) + Math.max(1, config.timerMinutes) * 60_000 - Date.now()
      if (left <= 0) {
        writeSeen(code, { firstSeen: s?.firstSeen ?? Date.now(), closed: true })
        setVisible(false)
      } else setNow(Date.now())
    }, 1000)
    return () => clearInterval(t)
  }, [visible, code, config.timerMinutes])

  if (!visible || !enabled || percent === null) return null
  const seen = readSeen(code)
  const remaining = (seen?.firstSeen ?? now) + Math.max(1, config.timerMinutes) * 60_000 - now
  if (remaining <= 0) return null

  const close = () => {
    writeSeen(code, { firstSeen: seen?.firstSeen ?? Date.now(), closed: true })
    setVisible(false)
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Cupom de desconto">
      <div className="animate-fade-up">
        <CouponCard
          config={{ ...config, code }}
          percent={percent}
          remainingMs={remaining}
          onClose={close}
          onUse={() => {
            try {
              localStorage.setItem(SAVED_COUPON_KEY, code)
            } catch {
              /* sem armazenamento: o cliente digita o código no agendamento */
            }
            close()
            navigate('/orcamento')
          }}
        />
      </div>
    </div>
  )
}
