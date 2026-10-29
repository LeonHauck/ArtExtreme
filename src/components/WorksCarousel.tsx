import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { ArrowUpRight, Hand, Pause, Play } from 'lucide-react'
import type { Work } from '@/data/content'

/** Velocidade da esteira, em pixels por segundo (dá tempo de ver cada tattoo). */
const SPEED_PX_S = 38
/** Movimento mínimo (px) para considerar arraste em vez de clique. */
const DRAG_THRESHOLD = 6

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Esteira infinita de trabalhos, de ponta a ponta da tela.
 *
 * A lista é renderizada duas vezes lado a lado; quando a primeira cópia sai
 * inteira da tela, o deslocamento "dá a volta" sem salto visível. O cliente
 * pode pausar/retomar no botão ou arrastar a esteira com o dedo/mouse.
 */
export function WorksCarousel({ works }: { works: Work[] }) {
  const root = useRef<HTMLDivElement>(null)
  const belt = useRef<HTMLDivElement>(null)
  const firstCopy = useRef<HTMLUListElement>(null)
  const offset = useRef(0)
  const drag = useRef<{ x: number; start: number; moved: boolean } | null>(null)

  const [playing, setPlaying] = useState(() => !prefersReducedMotion())
  const [hovering, setHovering] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [visible, setVisible] = useState(false)
  const running = playing && !hovering && !dragging && visible

  /** Aplica o deslocamento, mantendo-o dentro de uma volta (loop infinito). */
  const apply = () => {
    const width = firstCopy.current?.offsetWidth ?? 0
    if (width > 0) offset.current = ((offset.current % width) + width) % width
    if (belt.current) belt.current.style.transform = `translate3d(${-offset.current}px,0,0)`
  }

  // Motor da esteira
  useEffect(() => {
    if (!running) return
    let last = performance.now()
    let raf = 0
    const loop = (now: number) => {
      // limita o passo se a aba ficou em segundo plano
      offset.current += (SPEED_PX_S * Math.min(now - last, 100)) / 1000
      last = now
      apply()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running])

  // Só anda quando está na tela (economiza bateria)
  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Arraste com dedo ou mouse
  const onPointerDown = (e: ReactPointerEvent) => {
    drag.current = { x: e.clientX, start: offset.current, moved: false }
    setDragging(true)
  }
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    if (Math.abs(dx) > DRAG_THRESHOLD && !d.moved) {
      d.moved = true
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
    if (d.moved) {
      offset.current = d.start - dx
      apply()
    }
  }
  const endDrag = () => {
    setDragging(false)
    // mantém `drag` até o click ser processado, para saber se foi arraste
    setTimeout(() => {
      drag.current = null
    }, 0)
  }
  /** Se foi arraste, não abre o link. */
  const onClickCapture = (e: ReactMouseEvent) => {
    if (drag.current?.moved) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const renderCopy = (copy: 0 | 1) => (
    <ul
      ref={copy === 0 ? firstCopy : undefined}
      className="flex shrink-0 gap-4 pr-4"
      aria-hidden={copy === 1}
    >
      {works.map((w, i) => (
        <li key={`${copy}-${w.src}`} className="w-[68vw] shrink-0 sm:w-[40vw] md:w-[30vw] lg:w-[21rem]">
          <a
            href={w.url || undefined}
            target="_blank"
            rel="noreferrer"
            tabIndex={copy === 1 ? -1 : undefined}
            draggable={false}
            className="group relative block aspect-[3/4] overflow-hidden rounded-xl border border-bone/10 bg-ash"
          >
            <img
              src={w.src}
              alt={copy === 0 ? `${w.title}${w.tag ? `, ${w.tag}` : ''}: tatuagem feita pelo Mike` : ''}
              loading={i < 4 ? 'eager' : 'lazy'}
              draggable={false}
              className="h-full w-full object-cover transition duration-700 select-none group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink via-ink/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
              <div className="min-w-0">
                {w.tag && (
                  <span className="mb-1.5 inline-block rounded-full bg-violet/85 px-2.5 py-0.5 text-[0.7rem] font-semibold tracking-wide text-bone uppercase">
                    {w.tag}
                  </span>
                )}
                <p className="truncate font-display text-2xl tracking-wide text-bone">{w.title}</p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-bone/25 bg-ink/60 text-bone backdrop-blur transition group-hover:border-flame group-hover:text-flame">
                <ArrowUpRight size={18} />
              </span>
            </div>
          </a>
        </li>
      ))}
    </ul>
  )

  return (
    <div ref={root} role="region" aria-roledescription="carrossel" aria-label="Trabalhos recentes">
      {/* Esteira de ponta a ponta da tela */}
      <div
        className={`overflow-hidden py-1 ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ touchAction: 'pan-y' }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        <div ref={belt} className="flex w-max will-change-transform">
          {renderCopy(0)}
          {renderCopy(1)}
        </div>
      </div>

      {/* Controles */}
      <div className="mx-auto mt-6 flex max-w-6xl items-center justify-center gap-4 px-4 sm:px-6">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="inline-flex items-center gap-2 rounded-full border border-bone/20 py-2 pr-4 pl-2 text-sm text-bone transition hover:border-violet-light hover:bg-violet/15"
          aria-pressed={!playing}
          aria-label={playing ? 'Pausar carrossel' : 'Retomar carrossel'}
        >
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full ${playing ? 'bg-violet' : 'bg-rave text-ink'}`}
          >
            {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
          </span>
          {playing ? 'Pausar' : 'Continuar'}
        </button>
        <span className="hidden items-center gap-1.5 text-xs text-mute sm:inline-flex">
          <Hand size={13} /> Arraste para ver no seu ritmo
        </span>
      </div>
    </div>
  )
}
