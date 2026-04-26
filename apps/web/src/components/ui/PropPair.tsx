interface Props {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}

/** Reusable labeled numeric input for the inspector grid layout */
export function PropPair({ label, value, onChange, min, max, step }: Props) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full bg-(--ms-bg-base) border border-(--ms-border) rounded-md px-2 py-1.5 text-[12px] text-(--ms-text-primary) focus:outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-colors"
      />
    </div>
  )
}
