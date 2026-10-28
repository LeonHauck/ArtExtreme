import { lazy, Suspense, useCallback, useMemo, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, Hand, Loader2, MousePointerClick, X } from 'lucide-react'
import { activeAreas, activeStyles, MAX_PLACEMENTS, useStudio } from '@/store/studio'
import { ZONES } from '@/components/body3d/zones'
import { EstimateCard } from '@/components/EstimateCard'
import { Toggle } from '@/components/ui/Toggle'
import { useEstimate } from '@/hooks/useEstimate'
import { sortedSizes } from '@/lib/pricing'
import { formatBRL } from '@/lib/format'
import { waLink } from '@/lib/whatsapp'
import type { BodyArea } from '@/types'

// O 3D é pesado: só baixa quando o cliente abre o simulador
const BodyViewer = lazy(() => import('@/components/body3d/BodyViewer'))

/** Agrupa as áreas da lista para não virar uma "parede" de botões. */
const AREA_GROUPS: { title: string; ids: string[] }[] = [
  { title: 'Cabeça e pescoço', ids: ['cabeca', 'pescoco', 'nuca'] },
  { title: 'Tronco', ids: ['peito', 'costela', 'abdomen', 'costas', 'lombar'] },
  { title: 'Braços', ids: ['ombro', 'braco', 'triceps', 'antebraco', 'antebraco_externo', 'mao'] },
  { title: 'Pernas', ids: ['coxa', 'posterior_coxa', 'canela', 'panturrilha', 'pe'] },
]

function groupAreas(areas: BodyArea[]) {
  const known = new Set(AREA_GROUPS.flatMap((g) => g.ids))
  const groups = AREA_GROUPS.map((g) => ({
    title: g.title,
    areas: g.ids.map((id) => areas.find((a) => a.id === id)).filter((a): a is BodyArea => !!a),
  }))
  const others = areas.filter((a) => !known.has(a.id))
  if (others.length) groups.push({ title: 'Outros', areas: others })
  return groups.filter((g) => g.areas.length)
}

function Step({ n, title, hint, children }: { n: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-t border-bone/10 py-7 first:border-t-0 first:pt-0">
      <div className="mb-4 flex items-baseline gap-3">
        <span className="font-marker text-3xl text-violet">{n}</span>
        <div>
          <h2 className="font-display text-2xl tracking-wide">{title}</h2>
          {hint && <p className="text-sm text-mute">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function ViewerFallback() {
  return (
    <div className="flex h-full items-center justify-center text-mute">
      <Loader2 className="animate-spin" size={22} />
      <span className="ml-2 font-display tracking-widest uppercase">Carregando corpo 3D</span>
    </div>
  )
}

export default function Simulator() {
  const navigate = useNavigate()
  const pricing = useStudio((s) => s.pricing)
  const studio = useStudio((s) => s.studio)
  const rawPlacements = useStudio((s) => s.draft.placements)
  const setDraft = useStudio((s) => s.setDraft)
  const togglePlacement = useStudio((s) => s.togglePlacement)
  const setPlacementSize = useStudio((s) => s.setPlacementSize)
  const removePlacement = useStudio((s) => s.removePlacement)
  const { draft, placements, style, missing, ready, estimate } = useEstimate()

  const areas = useMemo(() => activeAreas(pricing.areas), [pricing.areas])
  const groups = useMemo(() => groupAreas(areas), [areas])
  const styles = useMemo(() => activeStyles(pricing.styles), [pricing.styles])
  const enabledAreas = useMemo(() => new Set(areas.map((a) => a.id)), [areas])
  const sizes = useMemo(() => sortedSizes(pricing.sizes), [pricing.sizes])
  const largest = sizes.at(-1)?.maxCm ?? 40
  const maxCm = largest + 10

  // O que acende no boneco: zonas clicadas + áreas escolhidas pela lista
  const selectedZones = useMemo(
    () => new Set(rawPlacements.flatMap((p) => (p.zoneId ? [p.zoneId] : []))),
    [rawPlacements],
  )
  const selectedAreas = useMemo(
    () => new Set(rawPlacements.flatMap((p) => (p.zoneId ? [] : [p.areaId]))),
    [rawPlacements],
  )
  const markedAreas = useMemo(() => new Set(rawPlacements.map((p) => p.areaId)), [rawPlacements])
  const full = rawPlacements.length >= MAX_PLACEMENTS

  const onSelectZone = useCallback(
    (zoneId: string) => togglePlacement({ zoneId, areaId: ZONES[zoneId].areaId }),
    [togglePlacement],
  )

  /** Chip da lista: se a área já está marcada (no 3D ou na lista), desmarca tudo dela. */
  const onToggleArea = (areaId: string) => {
    if (markedAreas.has(areaId)) setDraft({ placements: rawPlacements.filter((p) => p.areaId !== areaId) })
    else togglePlacement({ zoneId: null, areaId })
  }

  const goBook = () => navigate('/agendar')
  const summary = placements.length === 1 ? placements[0].label : `${placements.length} locais`

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-40 sm:px-6 md:pb-28 lg:pb-10">
      <header className="mb-8">
        <p className="eyebrow">Simulador</p>
        <h1 className="mt-2 font-display text-5xl tracking-wide sm:text-6xl">Monte sua tattoo</h1>
        <p className="mt-2 max-w-xl text-mute">
          Gire o corpo e toque em um ou mais locais. Cada local tem seu tamanho e o valor é somado na hora.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
        {/* Corpo 3D */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="card relative h-[58vh] min-h-[380px] overflow-hidden md:h-[62vh] lg:h-[calc(100dvh-8rem)]">
            <Suspense fallback={<ViewerFallback />}>
              <BodyViewer
                selectedZones={selectedZones}
                selectedAreas={selectedAreas}
                enabledAreas={enabledAreas}
                onSelect={onSelectZone}
              />
            </Suspense>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-xs text-mute">
            <Hand size={13} /> Arraste para girar · toque para marcar/desmarcar · pinça para zoom
          </p>
        </div>

        {/* Formulário */}
        <div>
          <Step n="I" title="Locais" hint="Toque no corpo 3D ou escolha na lista. Pode marcar mais de um.">
            <div className="space-y-4">
              {groups.map((g) => (
                <div key={g.title}>
                  <p className="mb-2 font-display text-xs tracking-[0.25em] text-mute uppercase">{g.title}</p>
                  <div className="flex flex-wrap gap-2">
                    {g.areas.map((a) => {
                      const active = markedAreas.has(a.id)
                      return (
                        <button
                          key={a.id}
                          type="button"
                          data-active={active}
                          disabled={!active && full}
                          onClick={() => onToggleArea(a.id)}
                          className="chip disabled:opacity-40"
                        >
                          {a.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            {full && <p className="mt-3 text-xs text-sun">Máximo de {MAX_PLACEMENTS} locais por pedido.</p>}
          </Step>

          <Step n="II" title="Tamanho de cada local" hint="Medida aproximada do maior lado do desenho.">
            {placements.length === 0 ? (
              <p className="flex items-center gap-2 rounded-md border border-dashed border-bone/15 p-4 text-sm text-mute">
                <MousePointerClick size={18} className="shrink-0 text-violet-light" />
                Marque um local no corpo ou na lista para definir o tamanho.
              </p>
            ) : (
              <ul className="space-y-3">
                {placements.map((p) => {
                  const oversized = p.sizeCm > largest
                  return (
                    <li key={`${p.zoneId ?? p.areaId}`} className="rounded-lg border border-bone/10 bg-ash/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{p.label}</p>
                          <p className="text-xs text-mute">
                            {oversized ? 'Fechamento' : p.item?.tierName}
                            {p.item && ` · ~${formatBRL(p.item.value)}`}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="font-display text-3xl leading-none tracking-wide tabular-nums">
                            {p.sizeCm}
                            <span className="ml-0.5 text-base text-mute">cm</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removePlacement(p.index)}
                            className="rounded-full p-1.5 text-mute transition hover:bg-bone/10 hover:text-bone"
                            aria-label={`Remover ${p.label}`}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      <input
                        type="range"
                        className="range mt-4"
                        min={2}
                        max={maxCm}
                        value={p.sizeCm}
                        onChange={(e) => setPlacementSize(p.index, Number(e.target.value))}
                        aria-label={`Tamanho em centímetros: ${p.label}`}
                      />
                    </li>
                  )
                })}
              </ul>
            )}
            <p className="mt-3 text-xs text-mute">Referência: moeda ≈ 2,5 cm · palma da mão ≈ 9 cm · A4 ≈ 30 cm</p>
          </Step>

          <Step n="III" title="Estilo">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {styles.map((s) => {
                const active = draft.styleId === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setDraft({ styleId: s.id })}
                    className={`relative rounded-md border p-3.5 text-left transition ${
                      active
                        ? 'border-violet bg-violet/15 shadow-[0_0_24px_-10px_var(--color-violet)]'
                        : 'border-bone/10 bg-ash/50 hover:border-bone/30'
                    }`}
                  >
                    {s.featured && (
                      <span className="absolute top-3 right-3 rounded-full bg-sun/15 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-sun uppercase">
                        Especialidade
                      </span>
                    )}
                    <span className="block font-display text-xl tracking-wide">{s.name}</span>
                    <span className="block pr-2 text-xs text-mute">{s.description}</span>
                  </button>
                )
              })}
            </div>
          </Step>

          <Step n="IV" title="Cor">
            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-md border border-bone/10 bg-ash/50 p-4">
              <span>
                <span className="block font-medium">{draft.color ? 'Colorida' : 'Preto e cinza'}</span>
                <span className="block text-xs text-mute">
                  {draft.color ? 'Tattoo com pigmentos coloridos.' : 'Somente tinta preta e sombreados.'}
                </span>
              </span>
              <Toggle checked={draft.color} onChange={(color) => setDraft({ color })} label="Tattoo colorida" />
            </label>
          </Step>

          <Step n="V" title="Sua ideia" hint="Conte o que você imagina. Referências você envia no WhatsApp.">
            <textarea
              className="input min-h-28 resize-y"
              placeholder="Ex.: lobo em blackwork no antebraço e uma frase pequena na costela…"
              value={draft.description}
              maxLength={600}
              onChange={(e) => setDraft({ description: e.target.value })}
            />
          </Step>

          <EstimateCard estimate={estimate} missing={missing} labels={placements.map((p) => p.label)}>
            <button className="btn btn-primary w-full" disabled={!ready} onClick={goBook}>
              Agendar sessão <ArrowRight size={18} />
            </button>
            {ready && style && (
              <p className="mt-3 text-center text-xs text-mute">
                {style.name}
                {draft.color ? ' colorida' : ''} · {summary}
              </p>
            )}
          </EstimateCard>

          <p className="mt-4 text-center text-sm text-mute">
            Prefere conversar antes?{' '}
            <a
              href={waLink(studio.whatsapp, 'Olá! Quero tirar uma dúvida sobre uma tattoo.')}
              target="_blank"
              rel="noreferrer"
              className="text-bone underline-offset-4 hover:underline"
            >
              Fale com o estúdio
            </a>
          </p>
        </div>
      </div>

      {/* Barra fixa no celular/tablet: valor sempre visível */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-bone/10 bg-coal/95 px-4 py-3 backdrop-blur-md md:bottom-0 md:px-6 lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-xs tracking-[0.3em] text-mute uppercase">
              Estimativa{placements.length > 1 ? ` · ${placements.length} locais` : ''}
            </p>
            <p className="truncate font-display text-2xl tracking-wide tabular-nums">
              {ready && estimate ? `${formatBRL(estimate.low)} – ${formatBRL(estimate.high)}` : `Falta ${missing.join(' e ')}`}
            </p>
          </div>
          <button className="btn btn-primary btn-sm shrink-0" disabled={!ready} onClick={goBook}>
            Agendar
          </button>
        </div>
      </div>
    </div>
  )
}
