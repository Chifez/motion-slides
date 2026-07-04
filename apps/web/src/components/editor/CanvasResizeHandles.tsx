import React from 'react'

export interface CanvasResizeHandlesProps {
  canvasW: number
  canvasH: number
  scale: number
  translateX: number
  translateY: number
  onResize: (edge: 'right' | 'bottom' | 'both') => (e: React.PointerEvent) => void
}

export function CanvasResizeHandles({
  canvasW,
  canvasH,
  scale,
  translateX,
  translateY,
  onResize,
}: CanvasResizeHandlesProps) {
  const EDGE_HIT = 8
  const CORNER = 16

  // Mathematical boundaries of the board in stage coordinates
  const relLeft = translateX
  const relTop = translateY
  const relRight = translateX + canvasW * scale
  const relBottom = translateY + canvasH * scale
  const boardWidth = canvasW * scale
  const boardHeight = canvasH * scale

  return (
    <>
      {/* Right edge */}
      <div
        title="Drag to resize canvas width"
        style={{
          position: 'absolute',
          left: relRight,
          top: relTop,
          width: EDGE_HIT,
          height: boardHeight,
          cursor: 'ew-resize',
          zIndex: 100,
        }}
        className="hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors"
        onPointerDown={onResize('right')}
      />

      {/* Bottom edge */}
      <div
        title="Drag to resize canvas height"
        style={{
          position: 'absolute',
          left: relLeft,
          top: relBottom,
          width: boardWidth,
          height: EDGE_HIT,
          cursor: 'ns-resize',
          zIndex: 100,
        }}
        className="hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors"
        onPointerDown={onResize('bottom')}
      />

      {/* Corner */}
      <div
        title="Drag to resize canvas"
        style={{
          position: 'absolute',
          left: relRight,
          top: relBottom,
          width: CORNER,
          height: CORNER,
          cursor: 'nwse-resize',
          zIndex: 101,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          padding: 2,
        }}
        className="hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors"
        onPointerDown={onResize('both')}
      >
        <svg width="8" height="8" viewBox="0 0 8 8" className="text-blue-500 opacity-60">
          <line x1="6" y1="0" x2="6" y2="8" stroke="currentColor" strokeWidth="1.5" />
          <line x1="0" y1="6" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>
    </>
  )
}
