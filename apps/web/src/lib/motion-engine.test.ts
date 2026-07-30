import { describe, it, expect } from 'vitest'
import { getHeuristicMatchingMap } from './motion-engine'
import type { Slide, SceneElement } from '@motionslides/shared'

describe('Heuristic Magic Move Matching', () => {
  it('should match strictly by ID first', () => {
    const elA: SceneElement = {
      id: 'node-1',
      type: 'shape',
      position: { x: 100, y: 100 },
      size: { width: 80, height: 80 },
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      content: { shapeType: 'circle', label: 'Start' } as any,
    }
    const elB: SceneElement = {
      id: 'node-1',
      type: 'shape',
      position: { x: 120, y: 120 },
      size: { width: 80, height: 80 },
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      content: { shapeType: 'circle', label: 'Start' } as any,
    }

    const fromSlide: Slide = { id: 's1', name: 'Slide 1', elements: [elA], background: '#000' }
    const toSlide: Slide = { id: 's2', name: 'Slide 2', elements: [elB], background: '#000' }

    const map = getHeuristicMatchingMap(fromSlide, toSlide)
    expect(map['node-1']).toBe('node-1')
  })

  it('should pair different IDs heuristically if they share type, label, and proximity', () => {
    const elA: SceneElement = {
      id: 'node-old-id',
      type: 'shape',
      position: { x: 100, y: 100 },
      size: { width: 80, height: 80 },
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      content: { shapeType: 'aws-icon', iconPath: 'aws-ec2', label: 'Web Server' } as any,
    }
    const elB: SceneElement = {
      id: 'node-new-id',
      type: 'shape',
      position: { x: 110, y: 110 },
      size: { width: 80, height: 80 },
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      content: { shapeType: 'aws-icon', iconPath: 'aws-ec2', label: 'Web Server' } as any,
    }

    const fromSlide: Slide = { id: 's1', name: 'Slide 1', elements: [elA], background: '#000' }
    const toSlide: Slide = { id: 's2', name: 'Slide 2', elements: [elB], background: '#000' }

    const map = getHeuristicMatchingMap(fromSlide, toSlide)
    expect(map['node-new-id']).toBe('node-old-id')
  })

  it('should not pair elements if their type is different', () => {
    const elA: SceneElement = {
      id: 'node-old-id',
      type: 'text',
      position: { x: 100, y: 100 },
      size: { width: 80, height: 80 },
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      content: { value: 'Web Server' } as any,
    }
    const elB: SceneElement = {
      id: 'node-new-id',
      type: 'shape',
      position: { x: 100, y: 100 },
      size: { width: 80, height: 80 },
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      content: { shapeType: 'aws-icon', label: 'Web Server' } as any,
    }

    const fromSlide: Slide = { id: 's1', name: 'Slide 1', elements: [elA], background: '#000' }
    const toSlide: Slide = { id: 's2', name: 'Slide 2', elements: [elB], background: '#000' }

    const map = getHeuristicMatchingMap(fromSlide, toSlide)
    expect(map['node-new-id']).toBeUndefined()
  })
})
