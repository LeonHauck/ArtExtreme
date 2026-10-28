import type { ReactNode } from 'react'
import { AlertTriangle, Clock, Wallet } from 'lucide-react'
import type { Estimate } from '@/types'
import { formatBRL, formatHours } from '@/lib/format'

interface EstimateCardProps {
  estimate: Estimate | null
  /** O que ainda falta escolher para calcular. */
  missing: string[]
  /** Nome de cada local, na mesma ordem de `estimate.items`. */
  labels?: string[]
  children?: ReactNode
}

export function EstimateCard({ estimate, missing, labels = [], children }: EstimateCardProps) {
  const ok = estimate && missing.length === 0
  return (
    <div className="card relative overflow-hidden p-6">
      <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-violet/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-flame/15 blur-3xl" />
      <p className="eyebrow relative">Estimativa</p>

      {ok ? (
        <div className="relative">
          <p className="text-rave mt-2 font-display text-5xl tracking-wide tabular-nums">
            {formatBRL(estimate.low)}
            <span className="mx-2 text-3xl">–</span>
            {formatBRL(estimate.high)}
          </p>

          {/* Detalhamento por local (só quando há mais de um) */}
          {estimate.items.length > 1 && (
            <ul className="mt-4 divide-y divide-bone/5 rounded-md border border-bone/10 bg-ink/40 text-sm">
              {estimate.items.map((item, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="min-w-0 truncate text-bone/85">
                    {labels[i] ?? item.areaId} <span className="text-mute">· {item.sizeCm} cm</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-bone/70">~{formatBRL(item.value)}</span>
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md bg-ash/80 p-3">
              <dt className="flex items-center gap-1.5 text-mute">
                <Clock size={14} /> {estimate.items.length > 1 ? 'Tempo total' : 'Sessão'}
              </dt>
              <dd className="mt-1 font-display text-xl tracking-wide">~{formatHours(estimate.hours)}</dd>
            </div>
            <div className="rounded-md bg-ash/80 p-3">
              <dt className="flex items-center gap-1.5 text-mute">
                <Wallet size={14} /> Sinal
              </dt>
              <dd className="mt-1 font-display text-xl tracking-wide">{formatBRL(estimate.deposit)}</dd>
            </div>
          </dl>
          {estimate.oversized && (
            <p className="mt-4 flex gap-2 rounded-md border border-sun/30 bg-sun/10 p-3 text-sm text-sun">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              Projeto grande: pode precisar de mais de uma sessão. O valor final é definido na avaliação.
            </p>
          )}
          <p className="mt-4 text-xs leading-relaxed text-mute">
            Valor aproximado. O orçamento final é fechado pelo artista após ver suas referências.
          </p>
        </div>
      ) : (
        <p className="relative mt-3 text-mute">
          Escolha <span className="text-bone">{missing.join(' e ')}</span> para ver o valor.
        </p>
      )}

      {children && <div className="relative mt-6">{children}</div>}
    </div>
  )
}
