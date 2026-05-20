import { useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  type Connection as RFConnection,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useEditorStore } from '@/store/editorStore'
import { uuid } from '@/lib/uuid'
import { SlideNode } from './SlideNode'
import { TransitionEdge } from './TransitionEdge'
import { TransitionPanel } from './TransitionPanel'
import { DEFAULT_PLAYBACK_SETTINGS } from '@/constants/export'

const nodeTypes: NodeTypes = { slideNode: SlideNode }
const edgeTypes: EdgeTypes = { transitionEdge: TransitionEdge }

export function PrototypeCanvas() {
  const {
    activeProject, activeSlideIndex,
    addTransition, updateTransition, deleteTransition,
    selectedTransitionId, setSelectedTransition,
    updateSlidePosition,
  } = useEditorStore()

  const project = activeProject()
  if (!project) return null

  const { slides, transitions, prototypeLayout } = project

  // ── Nodes: built from slides, re-derived on every render ──
  const initialNodes: Node[] = slides.map((slide, i) => ({
    id: slide.id,
    type: 'slideNode',
    position: prototypeLayout[slide.id] || { x: i * 320, y: 100 },
    data: { slide, index: i, isActive: i === activeSlideIndex },
  }))

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [prevData, setPrevData] = useState({ slides, activeSlideIndex, prototypeLayout })

  if (
    slides !== prevData.slides ||
    activeSlideIndex !== prevData.activeSlideIndex ||
    prototypeLayout !== prevData.prototypeLayout
  ) {
    setPrevData({ slides, activeSlideIndex, prototypeLayout })
    const nodePosMap = new Map<string, { x: number; y: number }>()
    for (const node of nodes) {
      nodePosMap.set(node.id, node.position)
    }

    setNodes(
      slides.map((slide, i) => {
        const currentPos = nodePosMap.get(slide.id)
        const storePos = prototypeLayout[slide.id]
        const position = currentPos || storePos || { x: i * 320, y: 100 }

        return {
          id: slide.id,
          type: 'slideNode',
          position,
          data: { slide, index: i, isActive: i === activeSlideIndex },
        }
      })
    )
  }

  // ── Edges: derived DIRECTLY from store transitions every render ──
  // This is the source of truth — no parallel local edge state needed.
  const edges: Edge[] = transitions.map((t) => ({
    id: t.id,          // edge.id === transition.id, always in sync
    source: t.fromSlideId,
    target: t.toSlideId,
    type: 'transitionEdge',
    animated: true,
    selected: t.id === selectedTransitionId,
    data: {
      animation: t.animation,
      duration: t.duration,
      ease: t.ease,
      trigger: t.trigger,
      transitionId: t.id,
    },
  }))

  // ── Node position changes → persist to store ──
  function handleNodesChange(changes: NodeChange[]) {
    onNodesChange(changes)
    for (const change of changes) {
      if (change.type === 'position' && change.position && !change.dragging) {
        updateSlidePosition(change.id, change.position)
      }
    }
  }

  // ── Edge changes: only handle deletion (no local state needed) ──
  function handleEdgesChange(changes: EdgeChange[]) {
    for (const change of changes) {
      if (change.type === 'remove') {
        deleteTransition(change.id)
      }
    }
  }

  // ── Connect: generate ID upfront so edge.id === transition.id ──
  function handleConnect(connection: RFConnection) {
    if (!connection.source || !connection.target) return

    // Prevent duplicate transitions between same pair
    const exists = transitions.some(
      (t) => t.fromSlideId === connection.source && t.toSlideId === connection.target,
    )
    if (exists) return

    // Generate the ID here so ReactFlow edge and store transition share it
    const id = uuid()
    const transition: any = {
      id,
      fromSlideId: connection.source,
      toSlideId: connection.target,
      animation: 'slide-left',
      duration: 600,
      ease: { x1: 0.16, y1: 1, x2: 0.3, y2: 1 },
      trigger: 'click'
    }
    addTransition(transition)
    // Edges are derived from store, so ReactFlow will auto-reflect the new one
  }

  function handleEdgeClick(_: React.MouseEvent, edge: Edge) {
    setSelectedTransition(edge.id) // edge.id === transition.id now
  }

  function handlePaneClick() {
    setSelectedTransition(null)
  }

  const selectedTransition = transitions.find((t) => t.id === selectedTransitionId)

  return (
    <div className="flex-1 relative bg-(--ms-bg-base) transition-colors">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        defaultEdgeOptions={{ type: 'transitionEdge', animated: true }}
        proOptions={{ hideAttribution: true }}
        className="bg-(--ms-bg-base) transition-colors"
      >
        <Background color="var(--ms-border-strong)" gap={20} size={1} />
        <Controls
          showInteractive={false}
          className="bg-(--ms-bg-elevated)! border-(--ms-border)! rounded-lg! shadow-xl! [&>button]:bg-(--ms-bg-base)! [&>button]:border-(--ms-border)! [&>button]:text-(--ms-text-muted)! [&>button:hover]:bg-(--ms-border)! transition-colors"
        />
        <MiniMap
          nodeColor="var(--ms-accent)"
          maskColor="var(--ms-bg-base)"
          className="bg-(--ms-bg-elevated)! border-(--ms-border)! rounded-lg! opacity-80"
        />
      </ReactFlow>

      {/* Transition settings panel — shown when an edge is selected */}
      {selectedTransition && (
        <TransitionPanel
          transition={selectedTransition}
          onUpdate={(updates) => updateTransition(selectedTransition.id, updates)}
          onDelete={() => {
            deleteTransition(selectedTransition.id)
            setSelectedTransition(null)
          }}
          onClose={() => setSelectedTransition(null)}
        />
      )}
    </div>
  )
}
