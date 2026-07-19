import { useState, useEffect } from 'react'
import { X, Send, GitPullRequest, Layout, AlertCircle, Plus, Check } from 'lucide-react'
import { useEditorStore } from '@/store/editorStore'
import { getRemoteProjectAction } from '@/lib/actions/project'
import type { Project, Slide } from '@motionslides/shared'

interface PullRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

export function PullRequestModal({ isOpen, onClose }: PullRequestModalProps) {
  const activeProjectId = useEditorStore(state => state.activeProjectId)
  const projectsList = useEditorStore(state => state.projects)
  const project = projectsList.find(p => p.id === activeProjectId)
  const createPR = useEditorStore(state => state.createPR)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetProject, setTargetProject] = useState<Project | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slideDiffs, setSlideDiffs] = useState<{ id: string; name: string; type: 'added' | 'deleted' | 'modified' }[]>([])

  useEffect(() => {
    if (!isOpen || !project || !project.forkedFromId) return

    // Load upstream project to display target info and calculate diffs
    const loadUpstream = async () => {
      try {
        const upstream = await getRemoteProjectAction({ 
          data: { 
            projectId: project.forkedFromId!,
            shareKey: project.shareKey 
          } 
        })
        if (upstream) {
          setTargetProject(upstream as unknown as Project)
          calculateDiffs(project, upstream as unknown as Project)
        }
      } catch (err) {
        console.error('Failed to load upstream project info:', err)
        setError('Failed to fetch parent project info.')
      }
    }

    loadUpstream()
  }, [isOpen, project])

  const calculateDiffs = (src: Project, tgt: Project) => {
    const diffs: typeof slideDiffs = []

    // 1. Added or Modified
    src.slides.forEach(slide => {
      const tgtSlide = tgt.slides.find(s => s.id === slide.id)
      if (!tgtSlide) {
        diffs.push({ id: slide.id, name: slide.name, type: 'added' })
      } else {
        const hasChanges = JSON.stringify(slide) !== JSON.stringify(tgtSlide)
        if (hasChanges) {
          diffs.push({ id: slide.id, name: slide.name, type: 'modified' })
        }
      }
    })

    // 2. Deleted
    tgt.slides.forEach(slide => {
      const srcSlide = src.slides.find(s => s.id === slide.id)
      if (!srcSlide) {
        diffs.push({ id: slide.id, name: slide.name, type: 'deleted' })
      }
    })

    setSlideDiffs(diffs)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !project.forkedFromId || !title.trim()) return

    setIsSubmitting(true)
    setError(null)
    try {
      await createPR(project.forkedFromId, title, description)
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to submit Pull Request.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !project || !project.forkedFromId) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-(--ms-bg-elevated) border border-(--ms-border-strong) rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="px-6 py-4 border-b border-(--ms-border) flex items-center justify-between bg-(--ms-bg-surface)">
          <div className="flex items-center gap-2 text-blue-500">
            <GitPullRequest size={20} />
            <h2 className="text-sm font-semibold text-(--ms-text-primary)">
              Create Merge/Pull Request
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-(--ms-text-muted) hover:text-(--ms-text-primary) hover:bg-(--ms-border) rounded-lg transition border-none cursor-pointer bg-transparent"
          >
            <X size={16} />
          </button>
        </header>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl text-xs">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Merge branches mapping banner */}
          <div className="flex items-center justify-between gap-4 p-3 bg-(--ms-bg-base) border border-(--ms-border) rounded-xl text-xs font-semibold text-(--ms-text-secondary)">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] text-(--ms-text-muted) font-medium">SOURCE (BRANCH)</span>
              <span className="truncate text-(--ms-text-primary)">{project.name}</span>
            </div>
            <div className="shrink-0 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              to merge into
            </div>
            <div className="flex flex-col min-w-0 text-right">
              <span className="text-[10px] text-(--ms-text-muted) font-medium">TARGET (UPSTREAM)</span>
              <span className="truncate text-(--ms-text-primary)">{targetProject?.name || 'Upstream parent'}</span>
            </div>
          </div>

          {/* Inputs */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-(--ms-text-secondary)">Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Added revised EBITDA V2 charts"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-(--ms-bg-surface) text-(--ms-text-primary) border border-(--ms-border) rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-(--ms-text-secondary)">Description</label>
            <textarea
              rows={3}
              placeholder="Provide a summary of the slide updates and element modifications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-(--ms-bg-surface) text-(--ms-text-primary) border border-(--ms-border) rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Diffs / Changes Overview list */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-(--ms-text-secondary)">
              Changes Overview ({slideDiffs.length} slide{slideDiffs.length !== 1 ? 's' : ''} affected)
            </span>
            {slideDiffs.length === 0 ? (
              <div className="text-xs text-(--ms-text-muted) italic bg-(--ms-bg-surface)/40 border border-(--ms-border) rounded-xl p-4 text-center">
                No slide content changes detected between branch and upstream base.
              </div>
            ) : (
              <div className="border border-(--ms-border) rounded-xl divide-y divide-(--ms-border) overflow-hidden max-h-48 overflow-y-auto bg-(--ms-bg-surface)/20">
                {slideDiffs.map(diff => {
                  let badgeColor = 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  let label = 'Modified'
                  if (diff.type === 'added') {
                    badgeColor = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    label = 'Added'
                  } else if (diff.type === 'deleted') {
                    badgeColor = 'bg-red-500/10 text-red-400 border border-red-500/20'
                    label = 'Deleted'
                  }

                  return (
                    <div key={diff.id} className="flex items-center justify-between p-3 text-xs bg-(--ms-bg-elevated)/40">
                      <div className="flex items-center gap-2 min-w-0">
                        <Layout size={14} className="text-(--ms-text-muted) shrink-0" />
                        <span className="truncate font-medium text-(--ms-text-primary)">
                          {diff.name || 'Untitled Slide'}
                        </span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>
                        {label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </form>

        {/* Footer actions */}
        <footer className="px-6 py-4 border-t border-(--ms-border) flex items-center justify-end gap-3 bg-(--ms-bg-surface)/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-(--ms-border) bg-(--ms-bg-elevated) text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border) rounded-xl text-xs font-semibold cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            disabled={isSubmitting || slideDiffs.length === 0}
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition disabled:opacity-50 border-none shadow-md shadow-blue-500/10"
          >
            <Send size={13} />
            <span>Create Request</span>
          </button>
        </footer>
      </div>
    </div>
  )
}
