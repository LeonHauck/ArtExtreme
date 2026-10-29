import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, Table2, BarChart3 } from 'lucide-react'
import type { RankItem, SeriesPoint } from '@/lib/reports'

/*
 * Gráficos do painel (SVG puro, sem biblioteca).
 * Cores validadas contra o fundo dos cards (#0f0d14): roxo da marca para o
 * destaque, cinza #6b6478 (contraste 3:1) para o contexto.
 */
const ACCENT = '#be38f3'
const ACCENT_HOVER = '#d16bff'
const CONTEXT = '#6b6478'
const CONTEXT_HOVER = '#8a8299'
const GRID = 'rgba(243, 238, 250, 0.08)'

/** Card de gráfico com título e alternância para a tabela (versão acessível). */
export function ChartCard({
  title,
  subtitle,
  table,
  children,
}: {
  title: string
  subtitle?: ReactNode
  table?: ReactNode
  children: ReactNode
}) {
  const [showTable, setShowTable] = useState(false)
  return (
    <section className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-wide">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-mute">{subtitle}</p>}
        </div>
        {table && (
          <button className="btn btn-ghost btn-sm shrink-0 px-2" onClick={() => setShowTable((v) => !v)} aria-pressed={showTable}>
            {showTable ? <BarChart3 size={15} /> : <Table2 size={15} />}
            <span className="hidden sm:inline">{showTable ? 'Ver gráfico' : 'Ver tabela'}</span>
          </button>
        )}
      </div>
      <div className="mt-4">{showTable && table ? table : children}</div>
    </section>
  )
}

/* ─── Indicadores ─────────────────────────────────────────────────────── */

export function Delta({ value, label }: { value: number | null; label: string }) {
  if (value === null) return <span className="text-xs text-mute">sem base em {label}</span>
  const up = value >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className="inline-flex items-center gap-0.5 text-xs">
      <span className={`inline-flex items-center font-semibold ${up ? 'text-emerald-400' : 'text-pink'}`}>
        <Icon size={14} />
        {up ? '+' : '−'}
        {Math.abs(value).toFixed(0)}%
      </span>
      <span className="text-mute">vs {label}</span>
    </span>
  )
}

export function StatTile({ label, value, sub }: { label: string; value: string; sub?: ReactNode }) {
  return (
    <div className="card p-4">
      <p className="font-display text-xs tracking-[0.25em] text-mute uppercase">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {sub && <div className="mt-1 text-xs text-mute">{sub}</div>}
    </div>
  )
}

/* ─── Colunas por mês ─────────────────────────────────────────────────── */

function niceTicks(max: number): number[] {
  if (max <= 0) return [0]
  const rough = max / 3
  const mag = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= rough) ?? 10 * mag
  const ticks: number[] = []
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(v)
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step)
  return ticks
}

/** Coluna com o topo arredondado (4px) e a base reta. */
function columnPath(x: number, y: number, w: number, base: number) {
  const h = base - y
  if (h <= 0) return ''
  const r = Math.min(4, w / 2, h)
  return `M${x},${base}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${base}Z`
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

export function ColumnChart({
  points,
  format,
  compact,
}: {
  points: SeriesPoint[]
  format: (n: number) => string
  compact: (n: number) => string
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)

  const PLOT_H = 170
  const TOP = 22 // espaço para o rótulo em cima da coluna
  const AXIS = 26 // faixa dos nomes dos meses
  const GUTTER = 56 // valores do eixo Y
  const height = TOP + PLOT_H + AXIS

  const ticks = niceTicks(Math.max(...points.map((p) => p.revenue), 0))
  const max = ticks[ticks.length - 1] || 1
  const plotW = Math.max(0, width - GUTTER)
  const slot = points.length ? plotW / points.length : 0
  const barW = Math.min(24, slot * 0.56)
  const base = TOP + PLOT_H
  const y = (v: number) => base - (v / max) * PLOT_H
  const hasSelection = points.some((p) => p.selected)
  // Rótulo direto só onde importa: o mês escolhido (ou o maior, no modo ano)
  const labelIdx = hasSelection
    ? points.findIndex((p) => p.selected)
    : points.reduce((best, p, i) => (p.revenue > points[best].revenue ? i : best), 0)
  const narrow = slot < 30

  const tip = hover !== null ? points[hover] : null
  const tipX = hover !== null ? GUTTER + slot * hover + slot / 2 : 0

  return (
    <div ref={ref} className="relative select-none" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label="Faturamento por mês" className="block overflow-visible">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={GUTTER} x2={width} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} shapeRendering="crispEdges" />
              <text x={GUTTER - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-mute text-[11px] tabular-nums">
                {compact(t)}
              </text>
            </g>
          ))}
          {points.map((p, i) => {
            const x = GUTTER + slot * i + (slot - barW) / 2
            const emph = !hasSelection || p.selected
            const fill = hover === i ? (emph ? ACCENT_HOVER : CONTEXT_HOVER) : emph ? ACCENT : CONTEXT
            const label = narrow ? p.label.charAt(0).toUpperCase() : p.label
            return (
              <g key={p.key}>
                <path d={columnPath(x, y(p.revenue), barW, base)} fill={fill} />
                {i === labelIdx && p.revenue > 0 && (
                  <text x={x + barW / 2} y={y(p.revenue) - 7} textAnchor="middle" className="fill-bone text-[11px] font-semibold">
                    {compact(p.revenue)}
                  </text>
                )}
                <text
                  x={GUTTER + slot * i + slot / 2}
                  y={base + 17}
                  textAnchor="middle"
                  className={`text-[11px] ${p.selected ? 'fill-bone font-semibold' : 'fill-mute'}`}
                >
                  {label}
                </text>
                {/* Área de toque: a coluna inteira do mês, maior que a barra */}
                <rect
                  x={GUTTER + slot * i}
                  y={TOP - 10}
                  width={slot}
                  height={PLOT_H + 10 + AXIS}
                  fill="transparent"
                  tabIndex={0}
                  role="button"
                  aria-label={`${p.longLabel}: ${format(p.revenue)}, ${p.sessions} sessões`}
                  className="cursor-pointer outline-none"
                  onPointerEnter={() => setHover(i)}
                  onPointerDown={() => setHover(i)}
                  onPointerLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                />
              </g>
            )
          })}
          <line x1={GUTTER} x2={width} y1={base} y2={base} stroke="rgba(243,238,250,0.18)" strokeWidth={1} shapeRendering="crispEdges" />
        </svg>
      )}
      {tip && (
        <div
          className="pointer-events-none absolute top-0 z-10 w-max max-w-44 -translate-x-1/2 rounded-md border border-bone/15 bg-ash px-3 py-2 text-sm shadow-xl"
          style={{ left: Math.min(Math.max(tipX, 80), width - 80) }}
          role="status"
        >
          <p className="font-semibold">{format(tip.revenue)}</p>
          <p className="text-xs text-mute">
            {tip.sessions} {tip.sessions === 1 ? 'sessão' : 'sessões'} · {tip.longLabel}
          </p>
        </div>
      )}
    </div>
  )
}

export function SeriesTable({ points, format }: { points: SeriesPoint[]; format: (n: number) => string }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-bone/10 text-left text-xs text-mute">
          <th className="py-2 font-medium">Mês</th>
          <th className="py-2 text-right font-medium">Sessões</th>
          <th className="py-2 text-right font-medium">Faturamento</th>
        </tr>
      </thead>
      <tbody>
        {points.map((p) => (
          <tr key={p.key} className={`border-b border-bone/5 ${p.selected ? 'font-semibold' : ''}`}>
            <td className="py-2 capitalize">{p.longLabel}</td>
            <td className="py-2 text-right tabular-nums">{p.sessions}</td>
            <td className="py-2 text-right tabular-nums">{format(p.revenue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/* ─── Ranking em barras horizontais ───────────────────────────────────── */

const MAX_ROWS = 6

/** Junta o que passar de 6 itens em "Outros" (nunca mais cores, nunca lista infinita). */
function foldTail(items: RankItem[]): (RankItem & { other?: boolean })[] {
  if (items.length <= MAX_ROWS) return items
  const head = items.slice(0, MAX_ROWS - 1)
  const tail = items.slice(MAX_ROWS - 1)
  return [...head, { label: `Outros (${tail.length})`, count: tail.reduce((s, i) => s + i.count, 0), revenue: tail.reduce((s, i) => s + i.revenue, 0), other: true }]
}

/** Só existe campeão se ninguém empatar com o primeiro. */
export const leader = (items: RankItem[]) => (items[0] && (!items[1] || items[0].count > items[1].count) ? items[0] : null)

export function RankBars({
  items,
  unit,
  format,
  empty,
}: {
  items: RankItem[]
  unit: [string, string]
  format: (n: number) => string
  empty: string
}) {
  if (!items.length) return <p className="py-6 text-center text-sm text-mute">{empty}</p>
  const rows = foldTail(items)
  // "Outros" soma vários itens: fica em cinza e não define a escala
  const max = Math.max(...rows.filter((r) => !r.other).map((r) => r.count), 1)
  const top = leader(items)
  return (
    <ol className="space-y-3">
      {rows.map((r, i) => (
        <li key={r.label} className="group">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate">
              {i === 0 && top && <span className="mr-1.5 text-sun" aria-label="mais feito">★</span>}
              {r.label}
            </span>
            <span className="shrink-0">
              <span className="font-semibold">
                {r.count} {r.count === 1 ? unit[0] : unit[1]}
              </span>
              <span className="text-mute"> · {format(r.revenue)}</span>
            </span>
          </div>
          <div className="mt-1.5 h-2">
            <div
              className="h-2 rounded-r-[4px] transition-[filter] group-hover:brightness-125"
              style={{ width: `${Math.min(100, Math.max(2, (r.count / max) * 100))}%`, background: r.other ? CONTEXT : ACCENT }}
            />
          </div>
        </li>
      ))}
    </ol>
  )
}
