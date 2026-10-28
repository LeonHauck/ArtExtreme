import { useEffect, useState } from 'react'

interface NumberFieldProps {
  value: number
  onCommit: (value: number) => void
  min?: number
  max?: number
  step?: number
  prefix?: string
  suffix?: string
  label?: string
  id?: string
  /** Converte o valor guardado para o exibido e vice-versa (ex.: multiplicador ↔ %). */
  toDisplay?: (v: number) => number
  fromDisplay?: (v: number) => number
}

const round = (n: number) => Math.round(n * 100) / 100

/**
 * Campo numérico que só grava ao sair do campo (ou Enter). Assim o artista
 * pode digitar "1," ou apagar tudo sem o valor "pular" no meio da digitação.
 */
export function NumberField({
  value,
  onCommit,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  label,
  id,
  toDisplay = (v) => v,
  fromDisplay = (v) => v,
}: NumberFieldProps) {
  const shown = String(round(toDisplay(value))).replace('.', ',')
  const [text, setText] = useState(shown)

  useEffect(() => {
    setText(shown)
  }, [shown])

  const commit = () => {
    const n = Number(text.replace(',', '.'))
    if (text.trim() === '' || Number.isNaN(n)) return setText(shown)
    let v = n
    if (min !== undefined) v = Math.max(min, v)
    if (max !== undefined) v = Math.min(max, v)
    onCommit(round(fromDisplay(v)))
    setText(String(round(v)).replace('.', ','))
  }

  return (
    <div className="flex items-center rounded-sm border border-bone/15 bg-ash transition focus-within:border-violet">
      {prefix && <span className="pl-3 text-sm text-mute">{prefix}</span>}
      <input
        id={id}
        aria-label={label}
        inputMode="decimal"
        step={step}
        className="w-full min-w-0 bg-transparent px-3 py-2.5 text-bone tabular-nums focus:outline-none"
        value={text}
        onChange={(e) => setText(e.target.value.replace(/[^\d,.-]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
      />
      {suffix && <span className="pr-3 text-sm text-mute">{suffix}</span>}
    </div>
  )
}

/** Multiplicador exibido como ajuste percentual: 1.3 ↔ +30 %. */
export function PercentAdjustField(props: Omit<NumberFieldProps, 'toDisplay' | 'fromDisplay' | 'suffix'>) {
  return (
    <NumberField
      {...props}
      suffix="%"
      min={-90}
      max={500}
      toDisplay={(m) => (m - 1) * 100}
      fromDisplay={(p) => 1 + p / 100}
    />
  )
}
