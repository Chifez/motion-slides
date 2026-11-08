import { PanelLeft } from 'lucide-react'
import { useEditorStore } from '@/store/editor-store'
import { useIsMobile } from '@/hooks/use-media-query'
import { SlideBackgroundPicker } from './slide-background-picker'
import { SyncStatusButton } from './sync-status-button'

interface Props {
    slideName: string
    isAuthenticated: boolean
    isReadOnly: boolean
}

export function CanvasToolbar({ slideName, isAuthenticated, isReadOnly }: Props) {
    const isMobile = useIsMobile()
    const mobileSlidesOpen = useEditorStore(s => s.mobileSlidesOpen)
    const setMobileSlidesOpen = useEditorStore(s => s.setMobileSlidesOpen)

    return (
        <div 
            className="absolute top-3 left-3 z-30 flex items-center gap-1.5 sm:gap-2"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            {isMobile && (
                <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation()
                        setMobileSlidesOpen(!mobileSlidesOpen)
                    }}
                    className={`flex items-center justify-center h-7 w-7 sm:h-8 sm:w-8 rounded-lg backdrop-blur-sm border transition cursor-pointer shadow-xs shrink-0 ${
                        mobileSlidesOpen
                            ? 'bg-blue-600/20 text-blue-400 border-blue-500/40'
                            : 'bg-(--ms-bg-surface)/90 border-(--ms-border) text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border)/50'
                    }`}
                    title={mobileSlidesOpen ? 'Close Slides Panel' : 'Open Slides Panel'}
                    aria-label="Toggle Slides Panel"
                >
                    <PanelLeft size={15} />
                </button>
            )}
            <span className="text-[10px] text-(--ms-text-muted) font-medium bg-(--ms-bg-surface)/80 backdrop-blur-sm border border-(--ms-border) rounded-md px-2 py-1">
                {slideName}
            </span>
            <SlideBackgroundPicker />
            <SyncStatusButton isAuthenticated={isAuthenticated} isReadOnly={isReadOnly} />
        </div>
    )
}