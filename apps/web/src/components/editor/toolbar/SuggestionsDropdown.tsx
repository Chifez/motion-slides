import { useRef, useState } from 'react'
import { GitBranch, X } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useClickOutside } from '@/hooks/useClickOutside'

const buttonBaseClass = "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors cursor-pointer border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
const activeButtonBaseClass = "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors cursor-pointer border border-blue-500 bg-blue-600 text-white"

export function SuggestionsDropdown() {
  const suggestions = useEditorStore(state => state.suggestions)
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
    <div className="relative" ref={ref}>
      <button
        className={reviewingSuggestionId ? activeButtonBaseClass : buttonBaseClass}
        onClick={() => setOpen(!open)}
        title="Review Suggestions"
      >
        <GitBranch size={13} className={reviewingSuggestionId ? 'animate-pulse' : ''} />
        <span>
          {reviewingSuggestionId 
            ? `Reviewing: ${activeReviewing?.authorName ?? 'Suggestion'}` 
            : `${pendingSuggestions.length} ${pendingSuggestions.length === 1 ? 'Suggestion' : 'Suggestions'}`
          }
        </span>
      </button>
 
      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-lg shadow-2xl z-999 p-3 w-80 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold text-(--ms-text-secondary) uppercase tracking-wider">Pending Suggestions</span>
            <button onClick={() => setOpen(false)} className="p-0.5 rounded text-(--ms-text-muted) hover:text-(--ms-text-primary) bg-transparent border-none cursor-pointer">
              <X size={12} />
            </button>
          </div>
 
          <div className="space-y-2">
            {pendingSuggestions.length === 0 ? (
              <p className="text-xs text-(--ms-text-muted) text-center py-2">No pending suggestions.</p>
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
                      className={`shrink-0 flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded cursor-pointer transition-colors border-none ${isCurrent 
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
