interface ToggleProps {
  checked: boolean
  onChange: (value: boolean) => void
  label?: string
  id?: string
}

export function Toggle({ checked, onChange, label, id }: ToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition ${
        checked ? 'border-violet bg-violet/80' : 'border-bone/20 bg-smoke'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-bone shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}
