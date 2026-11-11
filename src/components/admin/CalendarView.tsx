import { useMemo, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useStudio } from '@/store/studio'
import { monthGrid, summarizeDay, type DaySummary } from '@/lib/calendar'
import { formatDateLong, toISODate } from '@/lib/format'
import type { Booking, BookingStatus } from '@/types'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

/** Cor de cada situação (a mesma das etiquetas da lista). */
const STATUS_MARK: Record<BookingStatus, { bar: string; label: string }> = {
  confirmed: { bar: 'bg-emerald-400', label: 'Confirmado' },
  pending: { bar: 'bg-sun', label: 'Pendente' },
  done: { bar: 'bg-bone/40', label: 'Concluído' },
  cancelled: { bar: 'bg-violet', label: 'Cancelado' },
}

const firstName = (name: string) => name.trim().split(/\s+/)[0]
/** "10:00" → "10h", "14:30" → "14h30" (sobra mais espaço para o nome na célula) */
const shortTime = (t: string) => t.replace(':00', 'h').replace(':', 'h')

function DayCell({
  summary,
  day,
  outside,
  isToday,
  isPast,
  selected,
  onSelect,
}: {
  summary: DaySummary
  day: number
  outside: boolean
  isToday: boolean
  isPast: boolean
  selected: boolean
  onSelect: () => void
}) {
  const { sessions, open, occupancy, full } = summary
  const shown = sessions.slice(0, 3)
  const more = sessions.length - shown.length
  const label = `${formatDateLong(summary.iso)}: ${
    open ? `${sessions.length} ${sessions.length === 1 ? 'agendamento' : 'agendamentos'}${full ? ', lotado' : ''}` : 'fechado'
  }`

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={label}
      aria-pressed={selected}
      className={`group relative flex min-h-16 min-w-0 flex-col rounded-md border p-1 text-left transition sm:min-h-28 sm:p-1.5 ${
        selected ? 'border-violet bg-violet/10 shadow-[0_0_24px_-12px_var(--color-violet)]' : 'border-bone/8 hover:border-bone/25'
      } ${outside ? 'opacity-35' : ''} ${
        !open ? 'bg-[repeating-linear-gradient(135deg,rgba(243,238,250,0.035)_0_5px,transparent_5px_11px)]' : 'bg-coal/60'
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs tabular-nums sm:text-sm ${
            isToday ? 'bg-violet font-semibold text-white' : isPast ? 'text-mute' : 'text-bone'
          }`}
        >
          {day}
        </span>
        {!open && <span className="hidden text-[0.65rem] text-mute sm:inline">fechado</span>}
        {full && <span className="hidden rounded-sm bg-flame/15 px-1 text-[0.65rem] font-semibold text-flame sm:inline">lotado</span>}
      </div>

      {/* Celular: pontinhos por agendamento */}
      {sessions.length > 0 && (
        <div className="mt-1 flex flex-wrap items-center gap-0.5 sm:hidden">
          {sessions.slice(0, 4).map((b) => (
            <span key={b.id} className={`h-1.5 w-1.5 rounded-full ${STATUS_MARK[b.status].bar}`} />
          ))}
          {sessions.length > 4 && <span className="text-[0.6rem] leading-none text-mute">+{sessions.length - 4}</span>}
        </div>
      )}

      {/* Tablet e computador: horário e nome */}
      <ul className="mt-1 hidden min-w-0 space-y-0.5 sm:block">
        {shown.map((b) => (
          <li key={b.id} className={`flex min-w-0 items-center gap-1 rounded-sm bg-bone/[0.04] py-0.5 pr-1 text-[0.7rem] leading-tight ${isPast ? 'opacity-70' : ''}`}>
            <span className={`h-3 w-0.5 shrink-0 rounded-full ${STATUS_MARK[b.status].bar}`} />
            <span className="shrink-0 tabular-nums text-mute">{shortTime(b.time)}</span>
            <span className="truncate">{firstName(b.client.name)}</span>
          </li>
        ))}
        {more > 0 && <li className="pl-1.5 text-[0.65rem] text-mute">+{more} mais</li>}
      </ul>

      {/* Ocupação do expediente */}
      {open && (
        <div className="mt-auto pt-1.5" aria-hidden>
          <div className="h-1 overflow-hidden rounded-full bg-bone/10">
            <div className={`h-full rounded-full ${full ? 'bg-flame' : 'bg-violet'}`} style={{ width: `${Math.round(occupancy * 100)}%` }} />
          </div>
        </div>
      )}
    </button>
  )
}

/**
 * Calendário do mês no painel: quem vem em cada dia, ocupação e dias fechados.
 * Tocar num dia mostra o detalhe (renderizado por quem usa o calendário).
 */
export function CalendarView({
  bookings,
  renderDetail,
}: {
  bookings: Booking[]
  renderDetail: (summary: DaySummary) => ReactNode
}) {
  const schedule = useStudio((s) => s.schedule)
  const todayIso = toISODate(new Date())
  const now = new Date()
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [selected, setSelected] = useState(todayIso)

  const weeks = useMemo(() => monthGrid(view.year, view.month), [view])
  const summaries = useMemo(() => {
    const map = new Map<string, DaySummary>()
    for (const w of weeks) for (const d of w) map.set(d.iso, summarizeDay(schedule, bookings, d.iso))
    return map
  }, [weeks, schedule, bookings])
  const selectedSummary = summaries.get(selected) ?? summarizeDay(schedule, bookings, selected)

  const monthStats = useMemo(() => {
    let sessions = 0
    let full = 0
    for (const w of weeks)
      for (const d of w) {
        if (d.outside) continue
        const s = summaries.get(d.iso)!
        sessions += s.sessions.length
        if (s.full) full++
      }
    return { sessions, full }
  }, [weeks, summaries])

  const shift = (dir: -1 | 1) => setView((v) => {
    const m = v.month + dir
    return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 }
  })
  const goToday = () => {
    setView({ year: now.getFullYear(), month: now.getMonth() })
    setSelected(todayIso)
  }

  return (
    <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="card p-3 sm:p-4" aria-label="Calendário">
        {/* Cabeçalho do mês */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button type="button" className="btn btn-ghost btn-sm px-2" onClick={() => shift(-1)} aria-label="Mês anterior">
              <ChevronLeft size={18} />
            </button>
            <h2 className="min-w-44 text-center font-display text-2xl tracking-wide" aria-live="polite">
              {MONTHS[view.month]} {view.year}
            </h2>
            <button type="button" className="btn btn-ghost btn-sm px-2" onClick={() => shift(1)} aria-label="Próximo mês">
              <ChevronRight size={18} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-mute">
              {monthStats.sessions} {monthStats.sessions === 1 ? 'agendamento' : 'agendamentos'}
              {monthStats.full > 0 && ` · ${monthStats.full} ${monthStats.full === 1 ? 'dia lotado' : 'dias lotados'}`}
            </span>
            <button type="button" className="btn btn-outline btn-sm" onClick={goToday}>
              Hoje
            </button>
          </div>
        </div>

        {/* Dias da semana */}
        <div className="mt-3 grid grid-cols-7 gap-1 text-center font-display text-xs tracking-widest text-mute uppercase sm:gap-1.5">
          {WEEKDAYS.map((w) => (
            <span key={w}>
              <span className="sm:hidden">{w[0]}</span>
              <span className="hidden sm:inline">{w}</span>
            </span>
          ))}
        </div>

        {/* Grade */}
        <div className="mt-1.5 grid grid-cols-7 gap-1 sm:gap-1.5">
          {weeks.flat().map((d) => (
            <DayCell
              key={d.iso}
              summary={summaries.get(d.iso)!}
              day={d.day}
              outside={d.outside}
              isToday={d.iso === todayIso}
              isPast={d.iso < todayIso}
              selected={d.iso === selected}
              onSelect={() => {
                setSelected(d.iso)
                if (d.outside) setView({ year: Number(d.iso.slice(0, 4)), month: Number(d.iso.slice(5, 7)) - 1 })
              }}
            />
          ))}
        </div>

        {/* Legenda */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-mute">
          {(['confirmed', 'pending', 'done'] as const).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${STATUS_MARK[s].bar}`} /> {STATUS_MARK[s].label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1 w-5 rounded-full bg-violet" /> Ocupação do dia
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-4 rounded-sm bg-[repeating-linear-gradient(135deg,rgba(243,238,250,0.25)_0_2px,transparent_2px_5px)]" /> Fechado
          </span>
        </div>
      </section>

      <aside className="lg:sticky lg:top-32">{renderDetail(selectedSummary)}</aside>
    </div>
  )
}
