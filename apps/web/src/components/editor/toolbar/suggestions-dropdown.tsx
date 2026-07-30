import { useRef, useState } from 'react'
import { GitPullRequest, X } from 'lucide-react'
import { useEditorStore } from '@/store/editor-store'
import { useClickOutside } from '@/hooks/use-click-outside'

const buttonBaseClass = "inline-flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 bg-blue-500/10 backdrop-blur-sm border border-blue-500/30 rounded-md px-2 py-1 cursor-pointer transition-colors whitespace-nowrap"
const activeButtonBaseClass = "inline-flex items-center gap-1.5 text-[10px] text-white bg-blue-600 border border-blue-500 rounded-md px-2 py-1 cursor-pointer transition-colors whitespace-nowrap"

import { useQuery } from '@tanstack/react-query'
import { listSuggestionsAction } from '@/lib/actions/suggestions'
import type { ProjectSuggestion } from '@/lib/actions/suggestions'

export function SuggestionsDropdown() {
  const activeProjectId = useEditorStore(state => state.activeProjectId)
  const user = useEditorStore(state => state.user)
  const project = useEditorStore(state => state.projects.find(p => p.id === activeProjectId))
  const shouldFetchSuggestions = !!project && !!user?.id && project.ownerId === user.id

  const { data: suggestions = [] } = useQuery<ProjectSuggestion[]>({
    queryKey: ['suggestions', activeProjectId],
    queryFn: async () => {
      if (!activeProjectId) return []
      const res = await listSuggestionsAction({ data: { projectId: activeProjectId } })
      return res as ProjectSuggestion[]
    },
    enabled: shouldFetchSuggestions
  })
  
  const reviewingSuggestionId = useEditorStore(state => state.reviewingSuggestionId)
  const startReview = useEditorStore(state => state.startReview)
  const cancelReview = useEditorStore(state => state.cancelReview)

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setOpen(false))

  const pendingSuggestions = suggestions.filter(suggestion => suggestion.status === 'pending')

  if (pendingSuggestions.length === 0 && !reviewingSuggestionId) return null

  const activeReviewing = pendingSuggestions.find(suggestion => suggestion.id === reviewingSuggestionId)

  return (
    <div className="relative flex items-center" ref={ref}>
      <button
        className={reviewingSuggestionId ? activeButtonBaseClass : buttonBaseClass}
        onClick={() => setOpen(!open)}
        title={
          reviewingSuggestionId 
            ? `Reviewing: ${activeReviewing?.authorName ?? 'Request'}` 
            : `${pendingSuggestions.length} pending request${pendingSuggestions.length === 1 ? '' : 's'}`
        }
      >
        <GitPullRequest size={11} className={reviewingSuggestionId ? 'animate-pulse' : ''} />
        <span>{reviewingSuggestionId ? `Reviewing: ${activeReviewing?.authorName ?? 'Request'}` : 'Requests'}</span>
        {!reviewingSuggestionId && pendingSuggestions.length > 0 && (
          <span className="bg-blue-500 text-white rounded-full px-1 min-w-[14px] h-3.5 flex items-center justify-center text-[9px] font-semibold -mr-0.5 select-none">
            {pendingSuggestions.length}
          </span>
        )}
      </button>
 
      {open && (
        <div className="absolute left-0 top-full mt-1.5 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-lg shadow-2xl z-999 p-3 w-80 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-(--ms-text-secondary) uppercase tracking-wider">Pending Requests</span>
            <button onClick={() => setOpen(false)} className="p-0.5 rounded text-(--ms-text-muted) hover:text-(--ms-text-primary) bg-transparent border-none cursor-pointer">
              <X size={12} />
            </button>
          </div>
 
          <div className="space-y-2">
            {pendingSuggestions.length === 0 ? (
              <p className="text-xs text-(--ms-text-muted) text-center py-2">No pending requests.</p>
            ) : (
              pendingSuggestions.map((suggestionItem) => {
                const isCurrent = reviewingSuggestionId === suggestionItem.id
                return (
                  <div 
                    key={suggestionItem.id} 
                    className={`flex items-center justify-between p-2 rounded-md border ${isCurrent ? 'bg-blue-500/10 border-blue-500/30' : 'bg-(--ms-bg-base) border-(--ms-border)'}`}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                      <span className="text-xs font-semibold text-(--ms-text-primary) truncate">
                        {suggestionItem.authorName}
                      </span>
                      <span className="text-[10px] text-(--ms-text-muted)">
                        {new Date(suggestionItem.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => {
                        if (isCurrent) {
                          cancelReview()
                        } else {
                          startReview(suggestionItem.id)
                        }
                        setOpen(false)
                      }}
                      className={`shrink-0 flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded cursor-pointer transition-colors border-none whitespace-nowrap ${isCurrent 
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                        : 'bg-blue-600 text-white hover:bg-blue-500'
                      }`}
                    >
                      {isCurrent ? 'Close' : 'Review'}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
