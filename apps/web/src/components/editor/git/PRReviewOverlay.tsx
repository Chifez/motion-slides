import { useState } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { Check, X, AlertTriangle, RotateCcw, GitPullRequest, MessageSquarePlus } from 'lucide-react'

export function PRReviewOverlay() {
  const activeProjectId = useEditorStore(state => state.activeProjectId)
  const project = useEditorStore(state => state.projects.find(p => p.id === activeProjectId))
  
  const reviewingPrId = useEditorStore(state => state.reviewingSuggestionId)
  const reviewMode = useEditorStore(state => state.reviewMode)
  const toggleReviewMode = useEditorStore(state => state.toggleReviewMode)
  const cancelReview = useEditorStore(state => state.cancelReview)
  const finishReview = useEditorStore(state => state.finishReview)
  const resolvePR = useEditorStore(state => state.resolvePR)
  const isCommentToolActive = useEditorStore(state => state.isCommentToolActive)
  const setCommentToolActive = useEditorStore(state => state.setCommentToolActive)
  
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // We are reviewing a PR if reviewingSuggestionId matches an open PR in the prsList
  const prsList = useEditorStore(state => state.prsList)
  const pr = (prsList || []).find(p => p.id === reviewingPrId)

  // If there's no active project or PR being reviewed, don't show the overlay
  if (!project || !reviewingPrId || !pr) return null

  const handleResolve = async (status: 'merged' | 'rejected') => {
    setIsPending(true)
    setError(null)
    try {
      if (status === 'merged') {
        // Resolve PR as merged on the server
        await resolvePR(reviewingPrId, 'merged')
        finishReview()
      } else {
        // Reject/close the PR
        await resolvePR(reviewingPrId, 'rejected')
        cancelReview()
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.message || `Failed to resolve Pull Request as ${status}`)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      {/* Top Banner Indicator */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-4 pointer-events-none">
        <div className="w-full bg-(--ms-bg-surface)/95 backdrop-blur-md border border-(--ms-border) shadow-xl rounded-full p-1.5 flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3 pl-3.5 min-w-0">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-blue-400 leading-none mb-0.5 uppercase tracking-wider font-semibold flex items-center gap-1">
                <GitPullRequest size={10} />
                <span>Reviewing Pull Request</span>
              </span>
              <span className="text-xs font-semibold text-(--ms-text-primary) truncate">
                {pr.title}
              </span>
            </div>
          </div>

          {/* Toggle between original (target) and proposed (source) slide diff */}
          <div className="flex items-center gap-1 bg-(--ms-bg-base) border border-(--ms-border) rounded-full p-0.5 shrink-0">
            <button
              onClick={() => toggleReviewMode('original')}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition cursor-pointer border-none whitespace-nowrap ${
                reviewMode === 'original'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-(--ms-text-muted) hover:text-(--ms-text-primary) bg-transparent'
              }`}
            >
              Original (Base)
            </button>
            <button
              onClick={() => toggleReviewMode('suggested')}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition cursor-pointer border-none whitespace-nowrap ${
                reviewMode === 'suggested'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-(--ms-text-muted) hover:text-(--ms-text-primary) bg-transparent'
              }`}
            >
              Proposed (PR)
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Action Card */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-4 pointer-events-none">
        <div className="w-full bg-(--ms-bg-surface)/95 backdrop-blur-md border border-(--ms-border) shadow-xl rounded-2xl p-4 flex flex-col gap-3 pointer-events-auto">
          {error && (
            <div className="text-[11px] font-medium text-red-400 bg-red-500/15 border border-red-500/30 rounded-md p-2 flex items-center gap-2">
              <AlertTriangle size={12} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="flex flex-col gap-4">
            <div className="flex flex-col min-w-0">
              <p className="text-[12px] text-(--ms-text-muted) leading-relaxed">
                {reviewMode === 'suggested' 
                  ? "You are viewing the proposed changes from the collaborator's branch. Inspect slides and layers, then merge them." 
                  : "You are viewing your current project base. Switch to Proposed to inspect what changes will be applied."}
              </p>
              {pr.description && (
                <p className="text-[11px] text-(--ms-text-muted) italic mt-1 truncate">
                  Description: {pr.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full justify-start md:justify-end shrink-0">
              <button
                disabled={isPending}
                onClick={cancelReview}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer border border-(--ms-border) bg-(--ms-bg-base) text-(--ms-text-primary) hover:bg-transparent disabled:opacity-50 whitespace-nowrap"
              >
                <RotateCcw size={13} />
                <span>Cancel</span>
              </button>

              <button
                onClick={() => setCommentToolActive(!isCommentToolActive)}
                className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer border whitespace-nowrap ${
                  isCommentToolActive 
                    ? 'border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' 
                    : 'border-(--ms-border) bg-(--ms-bg-base) text-(--ms-text-primary) hover:bg-transparent'
                }`}
              >
                <MessageSquarePlus size={13} />
                <span>Comment Tool</span>
              </button>

              <button
                disabled={isPending}
                onClick={() => handleResolve('rejected')}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50 whitespace-nowrap"
              >
                <X size={13} />
                <span>Close PR</span>
              </button>

              <button
                disabled={isPending}
                onClick={() => handleResolve('merged')}
                className="flex items-center gap-1.5 text-xs font-semibold px-5 py-2 rounded-xl transition cursor-pointer border-none bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/10 disabled:opacity-50 whitespace-nowrap"
              >
                <Check size={13} />
                <span>Merge Request</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
