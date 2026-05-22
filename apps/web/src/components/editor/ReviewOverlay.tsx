import { useReviewResolver } from '@/hooks/useReviewResolver'
import { Check, X, AlertTriangle, RotateCcw } from 'lucide-react'

export function ReviewOverlay() {
  const {
    project,
    suggestion,
    reviewMode,
    isPending,
    error,
    isStale,
    toggleReviewMode,
    cancelReview,
    handleResolve,
  } = useReviewResolver()

  if (!project || !suggestion) return null

  return (
    <>
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-4 pointer-events-none">
        <div className="w-full bg-(--ms-bg-surface)/95 backdrop-blur-md border border-(--ms-border) shadow-xl rounded-full p-1.5 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3 pl-3.5 min-w-0">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-(--ms-text-muted) leading-none mb-0.5 uppercase tracking-wider font-semibold">Reviewing Suggestion</span>
              <span className="text-xs font-semibold text-(--ms-text-primary) truncate">
                by {suggestion.authorName}
              </span>
            </div>
            {isStale && (
              <div 
                className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-medium px-2 py-0.5 rounded-full select-none shrink-0 animate-pulse"
                title="This suggestion was created before the latest master changes."
              >
                <AlertTriangle size={10} />
                <span>Outdated Base</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 bg-(--ms-bg-base) border border-(--ms-border) rounded-full p-0.5">
            <button
              onClick={() => toggleReviewMode('original')}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-all cursor-pointer border-none ${
                reviewMode === 'original'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-(--ms-text-muted) hover:text-(--ms-text-primary) bg-transparent'
              }`}
            >
              Original View
            </button>
            <button
              onClick={() => toggleReviewMode('suggested')}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-all cursor-pointer border-none ${
                reviewMode === 'suggested'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-(--ms-text-muted) hover:text-(--ms-text-primary) bg-transparent'
              }`}
            >
              Suggested View
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-4 pointer-events-none">
        <div className="w-full bg-(--ms-bg-surface)/95 backdrop-blur-md border border-(--ms-border) shadow-xl rounded-2xl p-4 flex flex-col gap-3 pointer-events-auto">
          {error && (
            <div className="text-[11px] font-medium text-red-400 bg-red-500/15 border border-red-500/30 rounded-md p-2 flex items-center gap-2">
              <AlertTriangle size={12} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between gap-4">
            <p className="text-[11px] text-(--ms-text-muted) leading-relaxed max-w-sm hidden sm:block">
              {reviewMode === 'suggested' 
                ? "You can make adjustments directly on the canvas. Tweak slides, text, or shapes, then merge them below." 
                : "You are viewing the original slides. Switch to Suggested View to inspect the changes or make tweaks."}
            </p>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                disabled={isPending}
                onClick={cancelReview}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer border border-(--ms-border) bg-(--ms-bg-base) text-(--ms-text-primary) hover:bg-(--ms-border) disabled:opacity-50"
              >
                <RotateCcw size={13} />
                <span>Cancel</span>
              </button>

              <button
                disabled={isPending}
                onClick={() => handleResolve('rejected')}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
              >
                <X size={13} />
                <span>Reject</span>
              </button>

              <button
                disabled={isPending}
                onClick={() => handleResolve('merged')}
                className="flex items-center gap-1.5 text-xs font-semibold px-5 py-2 rounded-xl transition-colors cursor-pointer border-none bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/10 disabled:opacity-50"
              >
                <Check size={13} />
                <span>{reviewMode === 'suggested' ? 'Approve & Merge' : 'Merge Suggested'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
