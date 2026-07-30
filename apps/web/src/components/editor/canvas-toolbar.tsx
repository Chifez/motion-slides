import { useEditorStore } from '@/store/editorStore'
import { SlideBackgroundPicker } from './SlideBackgroundPicker'
import { SyncStatusButton } from './SyncStatusButton'

interface Props {
    slideName: string
    isAuthenticated: boolean
    isReadOnly: boolean
}

export function CanvasToolbar({ slideName, isAuthenticated, isReadOnly }: Props) {
    return (
        <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="text-[10px] text-(--ms-text-muted) font-medium bg-(--ms-bg-surface)/80 backdrop-blur-sm border border-(--ms-border) rounded-md px-2 py-1">
                {slideName}
            </span>
            <SlideBackgroundPicker />
            <SyncStatusButton isAuthenticated={isAuthenticated} isReadOnly={isReadOnly} />
        </div>
    )
}