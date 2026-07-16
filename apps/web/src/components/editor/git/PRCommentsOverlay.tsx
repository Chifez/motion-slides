import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, CheckCircle2 } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { useShallow } from 'zustand/react/shallow'

export function PRCommentsOverlay() {
  const {
    prComments,
    isCommentToolActive,
    showPRCommentsInEditor,
    setCommentToolActive,
    createPRComment,
    resolvePRComment,
    activeSlideId,
    activeProjectId,
    user
  } = useEditorStore(
    useShallow((state) => ({
      prComments: state.prComments,
      isCommentToolActive: state.isCommentToolActive,
      showPRCommentsInEditor: state.showPRCommentsInEditor,
      setCommentToolActive: state.setCommentToolActive,
      createPRComment: state.createPRComment,
      resolvePRComment: state.resolvePRComment,
      activeSlideId: state.activeSlide()?.id,
      activeProjectId: state.activeProjectId,
      user: state.user
    }))
  )

  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)

  // Show either if tool is active OR toggle is on
  if (!isCommentToolActive && !showPRCommentsInEditor) return null
  if (!activeSlideId) return null

  // Filter comments for the current slide
  const slideComments = prComments.filter(c => c.slideId === activeSlideId)
  const { prsList } = useEditorStore.getState()
  // Try to find a PR related to this project
  const currentPR = prsList.find(pr => pr.targetProjectId === activeProjectId || pr.sourceProjectId === activeProjectId)

  return (
    <div className="absolute inset-0 pointer-events-none z-[100]">
      {/* Interaction layer for creating new comments */}
      {isCommentToolActive && currentPR && (
        <div
          className="absolute inset-0 pointer-events-auto cursor-crosshair"
          onClick={(e) => {
            // Avoid creating if we clicked on an existing comment
            if ((e.target as HTMLElement).closest('.pr-comment-badge')) return

            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            // Ask for comment
            const content = window.prompt("Enter your comment:")
            if (content && content.trim()) {
              createPRComment(currentPR.id, activeSlideId, null, content, x, y)
              setCommentToolActive(false)
            }
          }}
        />
      )}

      {/* Render comments */}
      {slideComments.map(comment => (
        <div
          key={comment.id}
          className="absolute pointer-events-auto pr-comment-badge"
          style={{
            left: comment.x !== null ? comment.x : '50%',
            top: comment.y !== null ? comment.y : '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <button
            onClick={() => setActiveCommentId(activeCommentId === comment.id ? null : comment.id)}
            className={`
              relative w-8 h-8 rounded-full flex items-center justify-center 
              shadow-lg transition-all duration-200 cursor-pointer border-2
              ${comment.resolved
                ? 'bg-green-500 border-green-400 text-white'
                : 'bg-blue-500 border-blue-400 text-white'}
              ${activeCommentId === comment.id ? 'scale-110 ring-4 ring-blue-500/20' : 'hover:scale-110'}
            `}
          >
            {comment.resolved ? <CheckCircle2 size={16} /> : <MessageSquare size={16} />}

            {/* Ping animation for unresolved */}
            {!comment.resolved && !activeCommentId && (
              <span className="absolute inset-0 rounded-full animate-ping bg-blue-400 opacity-40"></span>
            )}
          </button>

          {/* Comment Thread Popover */}
          <AnimatePresence>
            {activeCommentId === comment.id && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-(--ms-bg-elevated) border border-(--ms-border) rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-(--ms-border) bg-(--ms-bg-surface)">
                  <div className="text-[11px] font-medium text-(--ms-text-muted)">
                    {comment.resolved ? 'Resolved Thread' : 'Open Thread'}
                  </div>
                  <button
                    onClick={() => setActiveCommentId(null)}
                    className="p-1 rounded hover:bg-(--ms-border) text-(--ms-text-muted) transition"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-3 max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-(--ms-text-primary)">{comment.authorName}</span>
                      <span className="text-[10px] text-(--ms-text-muted)">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[13px] text-(--ms-text-secondary) leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-3 border-t border-(--ms-border) bg-(--ms-bg-surface) flex justify-end gap-2">
                  <button
                    onClick={() => resolvePRComment(comment.id, !comment.resolved)}
                    className={`
                      px-3 py-1.5 rounded-lg text-[11px] font-medium transition cursor-pointer
                      ${comment.resolved
                        ? 'bg-(--ms-border) hover:bg-(--ms-border-strong) text-(--ms-text-primary)'
                        : 'bg-green-500/10 hover:bg-green-500/20 text-green-500'}
                    `}
                  >
                    {comment.resolved ? 'Reopen Thread' : 'Mark as Resolved'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}
