import { useEffect, useState, type RefObject } from 'react'
import { useEditorStore } from '@/store/editorStore'

/**
 * useCanvasCamera — Handles zoom and pan interactions.
 * 
 * Includes:
 * 1. Ctrl + Wheel Zoom (standard Ctrl + pinch/scroll zoom)
 * 2. Normal Wheel Pan (vertical/horizontal scroll panning)
 * 3. Spacebar + Left Click Drag Panning (Eraser/Figma style)
 * 4. Middle Click Drag Panning (Eraser/Figma style)
 * 5. Left Click Drag Panning when Hand/Pan tool is active (Laptop trackpad friendly!)
 */
export function useCanvasCamera(containerRef: RefObject<HTMLElement | null>, disabled = false) {
  const setCamera = useEditorStore(s => s.setCamera)
  const activeTool = useEditorStore(s => s.activeTool)
  const [spacePressed, setSpacePressed] = useState(false)

  // Track spacebar state globally
  useEffect(() => {
    if (disabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting text input focus
      const activeEl = document.activeElement
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      )
      if (isInput) return

      if (e.code === 'Space') {
        // Prevent default space page scroll
        e.preventDefault()
        setSpacePressed(true)
      } else if (e.key.toLowerCase() === 'h') {
        useEditorStore.getState().setActiveTool('hand')
      } else if (e.key.toLowerCase() === 'v') {
        useEditorStore.getState().setActiveTool('select')
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [disabled])

  useEffect(() => {
    if (disabled) return

    const el = containerRef.current
    if (!el) return

    // Visual feedback for Space or Hand Tool cursor
    if (spacePressed || activeTool === 'hand') {
      el.style.cursor = 'grab'
    } else {
      el.style.cursor = ''
    }

    let isPanning = false
    let startX = 0
    let startY = 0
    let camStartX = 0
    let camStartY = 0

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        const { camera } = useEditorStore.getState()
        setCamera({
          zoom: Math.min(Math.max(camera.zoom * delta, 0.05), 10)
        })
      } else {
        const { camera } = useEditorStore.getState()
        setCamera({
          x: camera.x - e.deltaX,
          y: camera.y - e.deltaY
        })
      }
    }

    const handlePointerDown = (e: PointerEvent) => {
      // Middle click (e.button === 1), Left click with spacebar, or Hand tool left-click
      const isMiddleClick = e.button === 1
      const isLeftSpaceClick = e.button === 0 && spacePressed
      const isHandToolClick = e.button === 0 && activeTool === 'hand'

      if (isMiddleClick || isLeftSpaceClick || isHandToolClick) {
        e.preventDefault()
        isPanning = true
        startX = e.clientX
        startY = e.clientY
        
        const { camera } = useEditorStore.getState()
        camStartX = camera.x
        camStartY = camera.y

        el.style.cursor = 'grabbing'
        el.setPointerCapture(e.pointerId)
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!isPanning) return
      e.preventDefault()
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      setCamera({
        x: camStartX + dx,
        y: camStartY + dy
      })
    }

    const handlePointerUp = (e: PointerEvent) => {
      if (!isPanning) return
      isPanning = false
      el.releasePointerCapture(e.pointerId)
      el.style.cursor = (spacePressed || activeTool === 'hand') ? 'grab' : ''
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    el.addEventListener('pointerdown', handlePointerDown)
    el.addEventListener('pointermove', handlePointerMove)
    el.addEventListener('pointerup', handlePointerUp)

    return () => {
      el.removeEventListener('wheel', handleWheel)
      el.removeEventListener('pointerdown', handlePointerDown)
      el.removeEventListener('pointermove', handlePointerMove)
      el.removeEventListener('pointerup', handlePointerUp)
      el.style.cursor = ''
    }
  }, [containerRef, setCamera, disabled, spacePressed, activeTool])
}
