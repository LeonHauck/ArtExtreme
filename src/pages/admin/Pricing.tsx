import { useMemo, useState, type ReactNode } from 'react'
import { Lock, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useStudio } from '@/store/studio'
import { NumberField, PercentAdjustField } from '@/components/ui/NumberField'
import { Toggle } from '@/components/ui/Toggle'
import { ZONES } from '@/components/body3d/zones'
import { estimate, sortedSizes } from '@/lib/pricing'
import { formatBRL, formatHours, uid } from '@/lib/format'

type Tab = 'sizes' | 'areas' | 'styles' | 'rules'
const TABS: { id: Tab; label: string }[] = [
  { id: 'sizes', label: 'Tamanhos' },
  { id: 'areas', label: 'Áreas do corpo' },
  { id: 'styles', label: 'Estilos' },
  { id: 'rules', label: 'Regras gerais' },
]

/** Áreas ligadas ao boneco 3D: podem ser desativadas, mas não excluídas. */
const BODY_AREA_IDS = new Set(Object.values(ZONES).map((z) => z.areaId))

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <span className="label text-[0.7rem]">{label}</span>
      {children}
    </div>
  )
}

function DeleteButton({ onClick, disabled, title }: { onClick: () => void; disabled?: boolean; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="flex h-[46px] w-11 items-center justify-center rounded-sm text-mute transition hover:bg-violet/15 hover:text-violet-light disabled:opacity-30"
    >
      <Trash2 size={17} />
    </button>
  )
}

function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-bone/20 py-4 font-display text-lg tracking-wider text-mute uppercase transition hover:border-violet hover:text-bone"
    >
      <Plus size={18} /> {children}
    </button>
  )
}

function SizesTab() {
  const sizes = useStudio((s) => s.pricing.sizes)
  const upsert = useStudio((s) => s.upsertPricingItem)
  const remove = useStudio((s) => s.removePricingItem)
  const ordered = useMemo(() => sortedSizes(sizes), [sizes])

  const add = () => {
    const last = ordered.at(-1)
    upsert('sizes', {
      id: uid(),
      name: 'Nova faixa',
      maxCm: (last?.maxCm ?? 0) + 10,
      basePrice: (last?.basePrice ?? 200) + 300,
      hours: (last?.hours ?? 1) + 1,
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-mute">
        O tamanho informado pelo cliente (maior lado, em cm) cai na primeira faixa cujo limite seja maior ou igual a
        ele. A duração é usada para bloquear o tempo certo na agenda.
      </p>
      {ordered.map((s, i) => (
        <div key={s.id} className="card grid grid-cols-2 gap-3 p-4 sm:grid-cols-[1.6fr_1fr_1.2fr_1fr_auto] sm:items-end">
          <Field label="Nome" className="col-span-2 sm:col-span-1">
            <input className="input" value={s.name} onChange={(e) => upsert('sizes', { ...s, name: e.target.value })} />
          </Field>
          <Field label={i === 0 ? 'Até' : `De ${ordered[i - 1].maxCm + 1} até`}>
            <NumberField value={s.maxCm} min={1} suffix="cm" onCommit={(maxCm) => upsert('sizes', { ...s, maxCm })} />
          </Field>
          <Field label="Valor base">
            <NumberField value={s.basePrice} min={0} prefix="R$" onCommit={(basePrice) => upsert('sizes', { ...s, basePrice })} />
          </Field>
          <Field label="Duração">
            <NumberField value={s.hours} min={0.5} max={12} suffix="h" onCommit={(hours) => upsert('sizes', { ...s, hours })} />
          </Field>
          <div className="flex justify-end">
            <DeleteButton
              title={sizes.length <= 1 ? 'Precisa existir ao menos uma faixa' : 'Excluir faixa'}
              disabled={sizes.length <= 1}
              onClick={() => confirm(`Excluir a faixa "${s.name}"?`) && remove('sizes', s.id)}
            />
          </div>
        </div>
      ))}
      <AddButton onClick={add}>Adicionar faixa</AddButton>
    </div>
  )
}

function AreasTab() {
  const areas = useStudio((s) => s.pricing.areas)
  const upsert = useStudio((s) => s.upsertPricingItem)
  const remove = useStudio((s) => s.removePricingItem)

  return (
    <div className="space-y-3">
      <p className="text-sm text-mute">
        Ajuste em % sobre o valor base: regiões mais doloridas ou difíceis (costela, mão, pé) costumam custar mais.
        Áreas com <Lock size={12} className="inline" /> estão ligadas ao corpo 3D: dá para desativar, mas não excluir.
      </p>
      {areas.map((a) => {
        const locked = BODY_AREA_IDS.has(a.id)
        return (
          <div
            key={a.id}
            className={`card grid grid-cols-[1fr_auto] gap-3 p-4 sm:grid-cols-[1.6fr_1fr_auto_auto] sm:items-end ${a.active ? '' : 'opacity-55'}`}
          >
            <Field label="Área" className="col-span-2 sm:col-span-1">
              <div className="relative">
                <input className="input pr-9" value={a.name} onChange={(e) => upsert('areas', { ...a, name: e.target.value })} />
                {locked && <Lock size={14} className="absolute top-1/2 right-3 -translate-y-1/2 text-mute" />}
              </div>
            </Field>
            <Field label="Ajuste">
              <PercentAdjustField value={a.multiplier} onCommit={(multiplier) => upsert('areas', { ...a, multiplier })} />
            </Field>
            <Field label="Ativa">
              <div className="flex h-[46px] items-center">
                <Toggle checked={a.active} label="Área ativa" onChange={(active) => upsert('areas', { ...a, active })} />
              </div>
            </Field>
            <div className="col-span-2 flex justify-end sm:col-span-1">
              <DeleteButton
                title={locked ? 'Área do corpo 3D: desative em vez de excluir' : 'Excluir área'}
                disabled={locked}
                onClick={() => confirm(`Excluir a área "${a.name}"?`) && remove('areas', a.id)}
              />
            </div>
          </div>
        )
      })}
      <AddButton onClick={() => upsert('areas', { id: uid(), name: 'Nova área', multiplier: 1, active: true })}>
        Adicionar área
      </AddButton>
      <p className="text-xs text-mute">
        Áreas novas aparecem na lista do simulador (não no boneco 3D). Ex.: “Atrás da orelha”, “Dedos”.
      </p>
    </div>
  )
}

function StylesTab() {
  const styles = useStudio((s) => s.pricing.styles)
  const upsert = useStudio((s) => s.upsertPricingItem)
  const remove = useStudio((s) => s.removePricingItem)

  return (
    <div className="space-y-3">
      <p className="text-sm text-mute">
        Ajuste em % pela complexidade do estilo. A descrição aparece para o cliente no simulador e na página inicial.
      </p>
      {styles.map((st) => (
        <div
          key={st.id}
          className={`card grid grid-cols-[1fr_auto_auto_auto] items-end gap-3 p-4 sm:grid-cols-[1fr_2fr] lg:grid-cols-[1.2fr_2fr_0.9fr_auto_auto_auto] ${st.active ? '' : 'opacity-55'}`}
        >
          <Field label="Estilo" className="col-span-4 sm:col-span-1">
            <input className="input" value={st.name} onChange={(e) => upsert('styles', { ...st, name: e.target.value })} />
          </Field>
          <Field label="Descrição" className="col-span-4 sm:col-span-1">
            <input
              className="input"
              value={st.description}
              onChange={(e) => upsert('styles', { ...st, description: e.target.value })}
            />
          </Field>
          <div className="col-span-4 grid grid-cols-[1fr_auto_auto_auto] items-end gap-3 sm:col-span-2 lg:contents">
            <Field label="Ajuste">
              <PercentAdjustField value={st.multiplier} onCommit={(multiplier) => upsert('styles', { ...st, multiplier })} />
            </Field>
            <Field label="Destaque">
              <div className="flex h-[46px] items-center" title="Especialidade: aparece em destaque no site">
                <Toggle
                  checked={!!st.featured}
                  label="Especialidade em destaque"
                  onChange={(featured) => upsert('styles', { ...st, featured })}
                />
              </div>
            </Field>
            <Field label="Ativo">
              <div className="flex h-[46px] items-center">
                <Toggle checked={st.active} label="Estilo ativo" onChange={(active) => upsert('styles', { ...st, active })} />
              </div>
            </Field>
            <DeleteButton
              title="Excluir estilo"
              disabled={styles.length <= 1}
              onClick={() => confirm(`Excluir o estilo "${st.name}"?`) && remove('styles', st.id)}
            />
          </div>
        </div>
      ))}
      <AddButton
        onClick={() => upsert('styles', { id: uid(), name: 'Novo estilo', description: '', multiplier: 1, active: true })}
      >
        Adicionar estilo
      </AddButton>
    </div>
  )
}

function RulesTab() {
  const pricing = useStudio((s) => s.pricing)
  const update = useStudio((s) => s.updatePricingSettings)
  const reset = useStudio((s) => s.resetPricing)
  const { settings } = pricing

  // Exemplo ao vivo: primeira área e estilo ativos, 10 cm, preto e cinza
  const sample = useMemo(() => {
    const area = pricing.areas.find((a) => a.active)
    const style = pricing.styles.find((s) => s.active)
    if (!area || !style) return null
    const req = {
      placements: [{ zoneId: null, areaId: area.id, sizeCm: 10 }],
      styleId: style.id,
      color: false,
      description: '',
    }
    return { area, style, result: estimate(pricing, req), colored: estimate(pricing, { ...req, color: true }) }
  }, [pricing])

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="card space-y-5 p-5">
        <Field label="Valor mínimo de qualquer tattoo">
          <NumberField value={settings.minPrice} min={0} prefix="R$" onCommit={(minPrice) => update({ minPrice })} />
        </Field>
        <Field label="Adicional para tattoo colorida">
          <PercentAdjustField value={settings.colorMultiplier} onCommit={(colorMultiplier) => update({ colorMultiplier })} />
        </Field>
        <Field label="Margem da estimativa (±)">
          <NumberField
            value={settings.variance}
            min={0}
            max={50}
            suffix="%"
            toDisplay={(v) => v * 100}
            fromDisplay={(p) => p / 100}
            onCommit={(variance) => update({ variance })}
          />
        </Field>
        <Field label="Sinal para reservar">
          <NumberField
            value={settings.depositPercent}
            min={0}
            max={100}
            suffix="%"
            toDisplay={(v) => v * 100}
            fromDisplay={(p) => p / 100}
            onCommit={(depositPercent) => update({ depositPercent })}
          />
        </Field>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => confirm('Restaurar TODOS os preços para os valores padrão?') && reset()}
        >
          <RotateCcw size={15} /> Restaurar preços padrão
        </button>
      </div>

      {sample?.result && (
        <div className="card p-5">
          <p className="eyebrow">Como o cálculo funciona</p>
          <p className="mt-3 text-sm text-mute">
            Valor base da faixa × ajuste da área × ajuste do estilo × ajuste de cor. O cliente vê uma faixa de ±
            {Math.round(settings.variance * 100)}% em volta do resultado.
          </p>
          <div className="mt-5 rounded-sm bg-ash p-4 text-sm">
            <p className="text-mute">
              Exemplo: 10 cm · {sample.area.name} · {sample.style.name}
            </p>
            <p className="mt-2 font-display text-3xl tracking-wide">
              {formatBRL(sample.result.low)} – {formatBRL(sample.result.high)}
            </p>
            <p className="mt-1 text-mute">
              Colorida: {formatBRL(sample.colored!.low)} – {formatBRL(sample.colored!.high)} · sessão ~
              {formatHours(sample.result.hours)} · sinal {formatBRL(sample.result.deposit)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Pricing() {
  const [tab, setTab] = useState<Tab>('sizes')
  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-4xl tracking-wide">Preços</h1>
        <p className="text-xs text-mute">Alterações salvas automaticamente</p>
      </div>
      <div className="scrollbar-none mt-6 mb-6 flex gap-2 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} className="chip shrink-0" data-active={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'sizes' && <SizesTab />}
      {tab === 'areas' && <AreasTab />}
      {tab === 'styles' && <StylesTab />}
      {tab === 'rules' && <RulesTab />}
    </div>
  )
}
