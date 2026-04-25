import type { ExportProgressEvent } from '@/lib/exportClient'

interface Props {
  progress: ExportProgressEvent | null
}

export function ExportProgressToast({ progress }: Props) {
  if (!progress) return null

  const isDone = progress.stage === 'done'
  const isError = progress.stage === 'error'
  const showProgress = progress.stage === 'capturing' || progress.stage === 'encoding'

  return (
    <div className="fixed bottom-6 right-6 bg-[#1a1a1a] border border-white/8 rounded-lg p-4 shadow-2xl z-999 min-w-[260px]">
      <div className={`text-[11px] font-semibold mb-1.5 ${isError ? 'text-red-400' : 'text-neutral-300'}`}>
        {isDone ? '✓ Export Complete' : isError ? '✕ Export Failed' : 'Exporting…'}
      </div>
      <div className="text-[10px] text-neutral-500 mb-2">{progress.message}</div>
      {showProgress && (
        <div className="w-full bg-white/6 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-blue-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      )}
    </div>
  )
}
