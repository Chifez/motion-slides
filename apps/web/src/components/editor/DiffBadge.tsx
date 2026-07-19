interface DiffBadgeProps {
  status: 'added' | 'modified' | null
}

export function DiffBadge({ status }: DiffBadgeProps) {
  if (status === 'added') {
    return (
      <div className="absolute inset-0 border-2 border-emerald-500 rounded-sm pointer-events-none z-[10] select-none">
        <span className="absolute -top-5 left-0 bg-emerald-500 text-white text-[9px] font-semibold px-1 py-0.5 rounded shadow whitespace-nowrap">
          Added
        </span>
      </div>
    )
  }

  if (status === 'modified') {
    return (
      <div className="absolute inset-0 border-2 border-dashed border-blue-500 rounded-sm pointer-events-none z-[10] select-none">
        <span className="absolute -top-5 left-0 bg-blue-500 text-white text-[9px] font-semibold px-1 py-0.5 rounded shadow whitespace-nowrap">
          Modified
        </span>
      </div>
    )
  }

  return null
}
