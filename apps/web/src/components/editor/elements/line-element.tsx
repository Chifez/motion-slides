import React from 'react'
import { motion } from 'framer-motion'
import type { LineContent, SceneElement } from '@motionslides/shared'
import { useMotionContext } from '@/context/MotionContext'
import { CODE_PHASE } from '@/lib/motionEngine'
import { useLineEditing } from '@/hooks/useLineEditing'
import { LineMarkers } from './LineMarkers'
import { LabelGroup } from './LabelGroup'
import {
  toSafeNum,
  hasValidCoordinates,
  buildElbowPoints,
  getPathMidpoint,
  getLabelPosition,
  buildLinePath,
  buildRoundedPath,
} from './lineHelpers'

interface Props { 
  element: SceneElement 
  isSelected?: boolean
}

export function LineElement({ element, isSelected }: Props) {
  const content = element.content as LineContent
  const { isTransitioning, durationSec } = useMotionContext()
  const EASE_IN_OUT: [number, number, number, number] = [0.37, 0, 0.63, 1]

  const { isEditing, inputRef, handleBlur, handleKeyDown } = useLineEditing(element.id, content)

  if (!hasValidCoordinates(content) && !content.customPath) {
    return (
      <div className="absolute inset-0 flex items-center justify-center opacity-0">
      </div>
    )
  }

  const pathTransition = isTransitioning
    ? {
        d: { duration: durationSec, ease: EASE_IN_OUT },
        stroke: { duration: durationSec * 0.6, ease: EASE_IN_OUT },
        strokeWidth: { duration: durationSec, ease: EASE_IN_OUT },
      }
    : { duration: 0 }

  const w = element.size.width
  const h = element.size.height

  const uniqueColors = Array.from(new Set([
    content.color,
    ...(content.branches?.map(b => b.color).filter(Boolean) as string[] || [])
  ]))

  const sanitizeId = (c: string) => c.replace(/[^a-zA-Z0-9]/g, '')
  const isFork = content.lineType === 'branching'
  const mainD = content.customPath || buildLinePath(w, h, { ...content, branches: undefined })
  const labelPos = getLabelPosition(w, h, content)
  
  return (
    <svg
      viewBox={`-50 -50 ${w + 100} ${h + 100}`}
      style={{
        position: 'absolute',
        left: -50,
        top: -50,
        width: w + 100,
        height: h + 100,
        overflow: 'visible',
        pointerEvents: 'none',
      }}
    >
      <LineMarkers uniqueColors={uniqueColors} sanitizeId={sanitizeId} />

      {!isFork && (
        <>
          <path
            d={mainD}
            fill="none"
            stroke="transparent"
            strokeWidth={Math.max(24, content.strokeWidth * 4)}
            style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
          />
          <motion.path
            d={mainD}
            fill="none"
            stroke={content.color}
            strokeWidth={content.strokeWidth}
            strokeDasharray={
              content.style === 'dashed' ? '8 5'
              : content.style === 'dotted' ? '2 4'
              : undefined
            }
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd={content.arrow !== 'none' ? `url(#arrow-end-${sanitizeId(content.color)})` : undefined}
            markerStart={content.arrow === 'both' ? `url(#arrow-start-${sanitizeId(content.color)})` : undefined}
            animate={{ d: mainD, stroke: content.color, strokeWidth: content.strokeWidth }}
            transition={pathTransition}
          />
          {isEditing ? (
            <foreignObject
              x={labelPos.x - 60}
              y={labelPos.y - 15}
              width={120}
              height={30}
              style={{ overflow: 'visible' }}
            >
              <input
                ref={inputRef}
                defaultValue={content.label ?? ''}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
                style={{
                  width: '100%',
                  fontSize: 10,
                  color: '#fff',
                  background: '#1a1a1a',
                  border: '1px solid #3b82f6',
                  borderRadius: 4,
                  padding: '2px 4px',
                  textAlign: 'center',
                  outline: 'none',
                  pointerEvents: 'auto',
                }}
              />
            </foreignObject>
          ) : (
            content.label && (
              <LabelGroup 
                text={content.label} 
                x={labelPos.x} 
                y={labelPos.y} 
                fontSize={content.labelFontSize || 10}
              />
            )
          )}
        </>
      )}

      {isFork && content.branches?.map((b, i) => {
        const bx = toSafeNum(b.x) * w
        const by = toSafeNum(b.y) * h
        const x1 = toSafeNum(content.x1) * w
        const y1 = toSafeNum(content.y1) * h
        
        const branchContent: LineContent = {
          ...content,
          startConnection: content.startConnection,
          endConnection: b.connection
        }
        const branchPoints = buildElbowPoints(x1, y1, bx, by, branchContent)
        const branchD = buildRoundedPath(branchPoints, 16)
        
        const branchColor = b.color || content.color
        const branchStyle = b.style || content.style
        const hasArrow = b.arrow === 'end' || (b.arrow === undefined && content.arrow !== 'none')

        const branchMid = getPathMidpoint(branchPoints)
        const lx = branchMid.x
        const ly = branchMid.y

        return (
          <React.Fragment key={i}>
            <path
              d={branchD}
              fill="none"
              stroke="transparent"
              strokeWidth={Math.max(24, content.strokeWidth * 4)}
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
            />
            <motion.path
              d={branchD}
              fill="none"
              stroke={branchColor}
              strokeWidth={content.strokeWidth}
              strokeDasharray={
                branchStyle === 'dashed' ? '8 5'
                : branchStyle === 'dotted' ? '2 4'
                : undefined
              }
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd={hasArrow ? `url(#arrow-end-${sanitizeId(branchColor)})` : undefined}
              animate={{ d: branchD, stroke: branchColor, strokeWidth: content.strokeWidth }}
              transition={pathTransition}
            />
            {b.label && (
              <LabelGroup 
                text={b.label} 
                x={lx} 
                y={ly} 
                fontSize={b.labelFontSize || content.labelFontSize || 10}
              />
            )}
          </React.Fragment>
        )
      })}
      
      {isSelected && (
        <rect
          x={-10}
          y={-10}
          width={w + 20}
          height={h + 20}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2}
          strokeDasharray="4 2"
          opacity={0.5}
        />
      )}
    </svg>
  )
}

export { CODE_PHASE }
