import { memo } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { SlidePanel } from '@/components/editor/SlidePanel'
import { CanvasStage } from '@/components/editor/CanvasStage'
import { PrototypeCanvas } from '@/components/editor/prototype/PrototypeCanvas'
import { InspectorPanel } from '@/components/editor/InspectorPanel'
import { PresentationOverlay } from '@/components/editor/PresentationOverlay'
import { AIChat } from '@/components/editor/AIChat'
import { ViewerOverlay } from '@/components/editor/presentation/ViewerOverlay'
import { UnsavedChangesModal } from '@/components/ui/UnsavedChangesModal'
import { usePermissions } from '@/context/PermissionContext'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { MobileFloatingDock } from '@/components/editor/toolbar/MobileFloatingDock'
import { Tour } from '@/components/ui/tour/Tour'
import { useOnboardingTrigger } from '@/hooks/useOnboardingTrigger'
import { TimelinePanel } from '@/components/editor/TimelinePanel'
import { GitPanel } from '@/components/editor/git/GitPanel'
import { PRReviewOverlay } from '@/components/editor/git/PRReviewOverlay'

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
    <div className="h-screen flex flex-col bg-(--ms-bg-base) overflow-hidden transition-colors relative">
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

