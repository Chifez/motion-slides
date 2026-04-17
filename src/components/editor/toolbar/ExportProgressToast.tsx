import type { ExportProgress } from '@/lib/exportEngine'

interface Props {
  progress: ExportProgress | null
}

export function ExportProgressToast({ progress }: Props) {
  if (!progress) return null

  return (
    <div className="fixed bottom-6 right-6 bg-[#1a1a1a] border border-white/8 rounded-lg p-4 shadow-2xl z-999 min-w-[260px]">
      <div className="text-[11px] font-semibold text-neutral-300 mb-1.5">
        {progress.stage === 'done' ? '✓ Export Complete' : 'Exporting…'}
      </div>
      <div className="text-[10px] text-neutral-500 mb-2">{progress.message}</div>
      {progress.stage === 'recording' && (
        <div className="w-full bg-white/6 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-blue-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${(progress.currentSlide / progress.totalSlides) * 100}%` }}
          />
        </div>
      )}
    </div>
  )
}
