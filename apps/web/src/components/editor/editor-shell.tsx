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
  
  const isMobile = useIsMobile()
  const showEditorUI = !isPresenting && mode === 'edit'
  const isViewOnly = mode === 'view' || mode === 'present'

  useOnboardingTrigger('editor', showEditorUI)

  return (
    <div className="h-dvh flex flex-col bg-(--ms-bg-base) overflow-hidden transition-colors relative">
      <Tour.Root />
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

