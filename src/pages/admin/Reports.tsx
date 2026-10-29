import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Info, Loader2, RefreshCw, Repeat2, UserPlus } from 'lucide-react'
import { listBookings, onBookingsChange } from '@/lib/bookingsRepo'
import {
  MONTHS_SHORT,
  buildReport,
  currentPeriod,
  delta,
  periodLabel,
  previousPeriod,
  revenueSeries,
  shiftPeriod,
  type Period,
  type PeriodMode,
} from '@/lib/reports'
import { formatBRL, formatBRLCompact, formatDateShort, formatHours, maskPhone } from '@/lib/format'
import { toWhatsAppNumber, waLink } from '@/lib/whatsapp'
import { ChartCard, ColumnChart, Delta, RankBars, SeriesTable, StatTile, leader } from '@/components/admin/Charts'
import { WhatsAppIcon } from '@/components/ui/BrandIcons'
import type { Booking } from '@/types'

function useBookings() {
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [error, setError] = useState(false)
  const refresh = useCallback(async () => {
    try {
      setBookings(await listBookings())
      setError(false)
    } catch {
      setError(true)
    }
  }, [])
  useEffect(() => {
    void refresh()
    const stop = onBookingsChange(() => void refresh())
    return stop
  }, [refresh])
  return { bookings, error, refresh }
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export default function Reports() {
  const { bookings, error, refresh } = useBookings()
  const [period, setPeriod] = useState<Period>(() => currentPeriod())
  const [style, setStyle] = useState('')
  const [showAllClients, setShowAllClients] = useState(false)

  const all = useMemo(() => bookings ?? [], [bookings])
  const filter = useMemo(() => ({ style }), [style])
  const report = useMemo(() => buildReport(all, period, filter), [all, period, filter])
  const prev = useMemo(() => buildReport(all, previousPeriod(period), filter), [all, period, filter])
  const series = useMemo(() => revenueSeries(all, period, filter), [all, period, filter])
  const styleOptions = useMemo(() => [...new Set(all.map((b) => b.tattoo.styleName))].sort(), [all])

  const now = currentPeriod(period.mode)
  const atCurrent = period.mode === 'year' ? period.year >= now.year : period.year > now.year || (period.year === now.year && period.month >= now.month)
  const prevLabel = period.mode === 'year' ? String(period.year - 1) : MONTHS_SHORT[previousPeriod(period).month]
  const setMode = (mode: PeriodMode) => setPeriod((p) => ({ ...p, mode }))

  const clients = showAllClients ? report.clients : report.clients.slice(0, 8)

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-4xl tracking-wide">Relatórios</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => void refresh()} title="Atualizar">
          <RefreshCw size={15} /> <span className="hidden sm:inline">Atualizar</span>
        </button>
      </div>

      {/* Filtros: valem para tudo abaixo */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-bone/10 p-0.5" role="group" aria-label="Período">
          {(['month', 'year'] as const).map((m) => (
            <button
              key={m}
              className={`rounded-full px-3.5 py-1.5 text-sm transition ${period.mode === m ? 'bg-violet text-white' : 'text-mute hover:text-bone'}`}
              onClick={() => setMode(m)}
              aria-pressed={period.mode === m}
            >
              {m === 'month' ? 'Mês' : 'Ano'}
            </button>
          ))}
        </div>
        <div className="flex items-center rounded-full border border-bone/10">
          <button className="rounded-full p-2 text-mute hover:text-bone" onClick={() => setPeriod((p) => shiftPeriod(p, -1))} aria-label="Período anterior">
            <ChevronLeft size={17} />
          </button>
          <span className="min-w-36 text-center text-sm font-semibold" aria-live="polite">
            {periodLabel(period)}
          </span>
          <button
            className="rounded-full p-2 text-mute hover:text-bone disabled:opacity-30"
            onClick={() => setPeriod((p) => shiftPeriod(p, 1))}
            disabled={atCurrent}
            aria-label="Próximo período"
          >
            <ChevronRight size={17} />
          </button>
        </div>
        <select className="input w-auto py-1.5 pr-8 text-sm" value={style} onChange={(e) => setStyle(e.target.value)} aria-label="Estilo">
          <option value="">Todos os estilos</option>
          {styleOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mt-6 flex items-center justify-between gap-3 rounded-md border border-pink/40 bg-pink/10 p-3 text-sm" role="alert">
          Não foi possível carregar os dados. Verifique a internet.
          <button className="btn btn-ghost btn-sm" onClick={() => void refresh()}>
            <RefreshCw size={14} /> Tentar de novo
          </button>
        </p>
      )}

      {bookings === null ? (
        <div className="mt-16 flex justify-center text-mute">
          <Loader2 className="animate-spin" />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {/* Número principal */}
          <section className="card p-5 sm:p-6">
            <p className="font-display text-sm tracking-[0.25em] text-mute uppercase">Faturamento · {periodLabel(period)}</p>
            <p className="mt-1 text-5xl font-semibold sm:text-6xl">{formatBRL(report.revenue)}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
              <Delta value={delta(report.revenue, prev.revenue)} label={prevLabel} />
              <span className="text-sm text-mute">
                {plural(report.sessions, 'sessão concluída', 'sessões concluídas')}
                {report.scheduled.count > 0 && ` · ${formatBRL(report.scheduled.value)} ainda agendados`}
              </span>
            </div>
            {report.estimated > 0 && (
              <p className="mt-3 flex items-start gap-1.5 text-xs text-mute">
                <Info size={14} className="mt-px shrink-0" />
                {report.estimated === report.sessions ? 'Todos os valores' : plural(report.estimated, 'valor', 'valores')} vêm da
                estimativa do app. Ao concluir uma sessão na Agenda, informe quanto cobrou para o número ficar exato.
              </p>
            )}
          </section>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile
              label="Tatuagens"
              value={String(report.tattoos)}
              sub={<Delta value={delta(report.tattoos, prev.tattoos)} label={prevLabel} />}
            />
            <StatTile
              label="Clientes"
              value={String(report.clients.length)}
              sub={`${report.newClients} novos · ${report.returningClients} voltaram`}
            />
            <StatTile label="Ticket médio" value={formatBRL(report.avgTicket)} sub="por sessão" />
            <StatTile
              label="Horas tatuando"
              value={report.hours ? formatHours(report.hours) : '0h'}
              sub={report.requests ? `${plural(report.requests, 'pedido', 'pedidos')} · ${report.cancelled} cancelados` : 'nenhum pedido'}
            />
          </div>

          <ChartCard
            title="Faturamento por mês"
            subtitle={period.mode === 'year' ? `Meses de ${period.year}` : `Últimos 6 meses, com ${MONTHS_SHORT[period.month]} em destaque`}
            table={<SeriesTable points={series} format={formatBRL} />}
          >
            <ColumnChart points={series} format={formatBRL} compact={formatBRLCompact} />
          </ChartCard>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Estilos mais feitos" subtitle={leader(report.byStyle) ? `Campeão: ${leader(report.byStyle)!.label}` : report.byStyle.length ? 'Empate entre os estilos' : undefined}>
              <RankBars items={report.byStyle} unit={['sessão', 'sessões']} format={formatBRL} empty="Nenhuma sessão concluída neste período." />
            </ChartCard>
            <ChartCard title="Locais mais tatuados" subtitle={leader(report.byArea) ? `Mais pedido: ${leader(report.byArea)!.label}` : report.byArea.length ? 'Sem um local campeão ainda' : undefined}>
              <RankBars items={report.byArea} unit={['tattoo', 'tattoos']} format={formatBRL} empty="Nenhuma sessão concluída neste período." />
            </ChartCard>
          </div>

          <section className="card p-4 sm:p-5">
            <h2 className="font-display text-2xl tracking-wide">Clientes do período</h2>
            <p className="mt-0.5 text-sm text-mute">Quem fez sessão, quantas vezes e quanto gastou.</p>
            {report.clients.length === 0 ? (
              <p className="py-6 text-center text-sm text-mute">Nenhum cliente atendido neste período.</p>
            ) : (
              <>
                <ul className="mt-3 divide-y divide-bone/5">
                  {clients.map((c) => (
                    <li key={c.key} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-x-2 font-semibold">
                          <span className="truncate">{c.name}</span>
                          {c.returning ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-violet/40 bg-violet/10 px-2 py-0.5 text-[0.7rem] font-medium text-violet-light">
                              <Repeat2 size={11} /> voltou
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-bone/15 px-2 py-0.5 text-[0.7rem] font-medium text-mute">
                              <UserPlus size={11} /> novo
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-mute">
                          {maskPhone(c.phone.replace(/^55/, ''))} · última em {formatDateShort(c.last)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold">{formatBRL(c.revenue)}</p>
                        <p className="text-xs text-mute">{plural(c.sessions, 'sessão', 'sessões')}</p>
                      </div>
                      <a
                        href={waLink(toWhatsAppNumber(c.phone), `Olá, ${c.name.split(' ')[0]}!`)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-sm shrink-0 px-2"
                        aria-label={`Conversar com ${c.name}`}
                      >
                        <WhatsAppIcon size={16} />
                      </a>
                    </li>
                  ))}
                </ul>
                {report.clients.length > 8 && (
                  <button className="btn btn-ghost btn-sm mt-2 w-full" onClick={() => setShowAllClients((v) => !v)}>
                    {showAllClients ? 'Mostrar menos' : `Ver todos (${report.clients.length})`}
                  </button>
                )}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
