import { useState, useEffect, memo } from 'react'

interface Props {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}

/** 
 * Reusable labeled numeric input for the inspector grid layout.
 * Allows being cleared during typing but enforces limits on blur.
 */
export const PropPair = memo(function PropPair({ label, value, onChange, min, max, step }: Props) {
  const [localValue, setLocalValue] = useState<string>(value.toString())

  useEffect(() => {
    setLocalValue(value.toString())
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setLocalValue(val)
    
    const numeric = parseFloat(val)
    if (!isNaN(numeric)) {
      let clamped = numeric
      if (min !== undefined) clamped = Math.max(min, clamped)
      if (max !== undefined) clamped = Math.min(max, clamped)
      onChange(clamped)
    }
  }

  const handleBlur = () => {
    let numeric = parseFloat(localValue)
    
    if (isNaN(numeric)) {
      numeric = min !== undefined ? min : 0
    }

    if (min !== undefined) numeric = Math.max(min, numeric)
    if (max !== undefined) numeric = Math.min(max, numeric)
    
    setLocalValue(numeric.toString())
    onChange(numeric)
  }

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-(--ms-text-muted) uppercase tracking-wider">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleBlur()
        }}
        className="w-full bg-(--ms-bg-base) border border-(--ms-border) rounded-md px-2 py-1.5 text-[12px] text-(--ms-text-primary) focus:outline-none focus:border-blue-500 transition-colors"
      />
    </div>
  )
})
