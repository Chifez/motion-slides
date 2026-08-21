import { memo } from 'react'
import { useEditorStore } from '@/store/editor-store'
import { EditorToolbar } from '@/components/editor/editor-toolbar'
import { SlidePanel } from '@/components/editor/slide-panel'
import { CanvasStage } from '@/components/editor/canvas-stage'
import { PrototypeCanvas } from '@/components/editor/prototype/prototype-canvas'
import { InspectorPanel } from '@/components/editor/inspector-panel'
import { PresentationOverlay } from '@/components/editor/presentation-overlay'
import { AIChat } from '@/components/editor/ai-chat'
import { ViewerOverlay } from '@/components/editor/presentation/viewer-overlay'
import { UnsavedChangesModal } from '@/components/ui/unsaved-changes-modal'
import { usePermissions } from '@/context/permission-context'
import { useIsMobile } from '@/hooks/use-media-query'
import { MobileFloatingDock } from '@/components/editor/toolbar/mobile-floating-dock'
import { Tour } from '@/components/ui/tour/tour'
import { useOnboardingTrigger } from '@/hooks/use-onboarding-trigger'
import { TimelinePanel } from '@/components/editor/timeline-panel'
import { GitPanel } from '@/components/editor/git/git-panel'
import { PRReviewOverlay } from '@/components/editor/git/pr-review-overlay'

import { GitCommit, LogOut } from 'lucide-react'

interface Props {
  projectId: string
  blocker: {
    proceed: (() => void) | undefined
    reset: (() => void) | undefined
    status: string
    syncProjects: () => Promise<void>
  }
}

export const EditorShell = memo(function EditorShell({ projectId, blocker }: Props) {
  const { mode } = usePermissions()
  const isPresenting = useEditorStore(s => s.isPresenting)
  const isPrototypeMode = useEditorStore(s => s.isPrototypeMode)
  const startPresentation = useEditorStore(s => s.startPresentation)
  const editorMode = useEditorStore(s => s.editorMode ?? 'design')
  const gitCheckedOutCommitId = useEditorStore(s => s.gitCheckedOutCommitId)
  const checkoutCommit = useEditorStore(s => s.checkoutCommit)
  
  const isMobile = useIsMobile()
  const showEditorUI = !isPresenting && mode === 'edit'
  const isViewOnly = mode === 'view' || mode === 'present'

  useOnboardingTrigger('editor', showEditorUI)

  return (
    <div className="h-dvh flex flex-col bg-(--ms-bg-base) overflow-hidden transition-colors relative">
      <Tour.Root />
      {gitCheckedOutCommitId && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between text-amber-200 text-xs z-50">
          <div className="flex items-center gap-2">
            <GitCommit size={14} className="text-amber-400" />
            <span className="font-semibold">Viewing Historical Commit (Read-Only Preview):</span>
            <span className="font-mono bg-amber-500/20 px-1.5 py-0.5 rounded text-[11px]">
              {gitCheckedOutCommitId.slice(0, 7)}
            </span>
          </div>
          <button
            onClick={() => checkoutCommit(null)}
            className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 border border-amber-500/40 rounded px-2.5 py-1 text-[11px] font-medium cursor-pointer transition"
          >
            <LogOut size={12} />
            <span>Return to HEAD (Live)</span>
          </button>
        </div>
      )}
      {showEditorUI && <EditorToolbar projectId={projectId} />}

      <div className="flex flex-1 overflow-hidden relative">
        {editorMode === 'timeline' ? (
          <TimelinePanel />
        ) : (
          <>
            {showEditorUI && !isPrototypeMode && <SlidePanel />}
            {isPrototypeMode ? <PrototypeCanvas /> : <CanvasStage />}
            {showEditorUI && !isPrototypeMode && <InspectorPanel />}
            {showEditorUI && <AIChat />}
          </>
        )}
      </div>

      {showEditorUI && isMobile && <MobileFloatingDock />}
      {showEditorUI && <GitPanel />}
      {showEditorUI && <PRReviewOverlay />}

      <PresentationOverlay />
      {isViewOnly && !isPresenting && <ViewerOverlay startPresentation={startPresentation} />}

      <UnsavedChangesModal
        isOpen={blocker.status === 'blocked'}
        onClose={() => blocker.reset?.()}
        onDiscard={() => blocker.proceed?.()}
        onConfirm={async () => {
          await blocker.syncProjects()
          blocker.proceed?.()
        }}
      />
    </div>
  )
})

