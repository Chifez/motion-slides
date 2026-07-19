import { useEditorStore } from '@/store/editorStore'
import { MotionStage } from './MotionStage'
import { GroupBoundingBox } from './GroupBoundingBox'
import { ConnectionAnchors } from './BoundingBox'
import { AlignmentGuides } from './AlignmentGuides'
import { CanvasSpotlightOverlay } from './elements/CanvasSpotlightOverlay'
import { PRCommentsOverlay } from './git/PRCommentsOverlay'

interface LassoRect { x1: number; y1: number; x2: number; y2: number }

interface Props {
    canvasW: number
    canvasH: number
    translateX: number
    translateY: number
    scale: number
    zoom: number
    slideBackground: string
    lasso: LassoRect | null
}

export function CanvasBoard({
    canvasW, canvasH, translateX, translateY,
    scale, zoom, slideBackground, lasso,
}: Props) {
    const slide = useEditorStore(state => state.activeSlide())
    const playbackSettings = useEditorStore(state => state.playbackSettings)
    const selectedElementIds = useEditorStore(state => state.selectedElementIds)
    const selectedElements = slide?.elements.filter(el => selectedElementIds.includes(el.id)) ?? []
    const isGroupSelection =
        selectedElements.length > 1 ||
        (selectedElements.length === 1 && !!selectedElements[0].groupId)

    const hasFocal = slide?.elements.some(el => el.isFocal || el.isHotspot) ?? false

    return (
        <div
            data-canvas-board
            className={`absolute rounded-sm shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_32px_80px_rgba(0,0,0,0.8)] ${playbackSettings.clipContent ? 'overflow-hidden' : ''
                }`}
            style={{
                top: 0,
                left: 0,
                width: canvasW,
                height: canvasH,
                backgroundColor: slideBackground.startsWith('url') ? 'transparent' : slideBackground,
                backgroundImage: slideBackground.startsWith('url') ? slideBackground : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                transform: `translate(${translateX}px, ${translateY}px) scale(${scale * zoom})`,
                transformOrigin: 'top left',
            }}
        >
            <MotionStage mode="editor" slide={slide} previousSlide={null} settings={playbackSettings} />
            <CanvasSpotlightOverlay isVisible={hasFocal} />
            <ConnectionAnchors />
            {isGroupSelection && <GroupBoundingBox elements={selectedElements} />}
            <AlignmentGuides />
            <PRCommentsOverlay />

            {lasso && (
                <div
                    className="absolute border-2 border-blue-500 bg-blue-500/10 pointer-events-none z-1000"
                    style={{
                        left: Math.min(lasso.x1, lasso.x2),
                        top: Math.min(lasso.y1, lasso.y2),
                        width: Math.abs(lasso.x2 - lasso.x1),
                        height: Math.abs(lasso.y2 - lasso.y1),
                    }}
                />
            )}
        </div>
    )
}