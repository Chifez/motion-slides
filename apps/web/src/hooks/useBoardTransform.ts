import { useState, useEffect, useCallback, type RefObject } from 'react'
import { useEditorStore } from '@/store/editorStore'

export function useBoardTransform(
    stageRef: RefObject<HTMLDivElement | null>,
    canvasW: number,
    canvasH: number,
    scale: number,
    zoom: number,
    cameraX: number,
    cameraY: number,
) {
    const [stageSize, setStageSize] = useState({ w: 0, h: 0 })
    const setCustomCanvasDimensions = useEditorStore(s => s.setCustomCanvasDimensions)

    useEffect(() => {
        const el = stageRef.current
        if (!el) return
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect
            setStageSize({ w: width, h: height })
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [stageRef])

    const translateX = stageSize.w / 2 - (canvasW / 2) * scale * zoom + cameraX
    const translateY = stageSize.h / 2 - (canvasH / 2) * scale * zoom + cameraY

    const startCanvasResize = useCallback(
        (edge: 'right' | 'bottom' | 'both') => (e: React.PointerEvent) => {
            e.preventDefault()
            e.stopPropagation()
            const startW = canvasW
            const startH = canvasH
            const startX = e.clientX
            const startY = e.clientY
            const currentScale = scale * zoom

            const onPointerMove = (ev: PointerEvent) => {
                const dx = ev.clientX - startX
                const dy = ev.clientY - startY
                let nextW = startW
                let nextH = startH
                if (edge === 'right' || edge === 'both') nextW = Math.max(300, startW + dx / currentScale)
                if (edge === 'bottom' || edge === 'both') nextH = Math.max(200, startH + dy / currentScale)
                setCustomCanvasDimensions(nextW, nextH)
            }

            const onPointerUp = () => {
                window.removeEventListener('pointermove', onPointerMove)
                window.removeEventListener('pointerup', onPointerUp)
            }

            window.addEventListener('pointermove', onPointerMove)
            window.addEventListener('pointerup', onPointerUp)
        },
        [canvasW, canvasH, scale, zoom, setCustomCanvasDimensions],
    )

    return { translateX, translateY, startCanvasResize }
}