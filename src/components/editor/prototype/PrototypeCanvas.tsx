import { useCallback, useMemo } from 'react'
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
import { nanoid } from '@/lib/nanoid'
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
  const initialNodes: Node[] = useMemo(() =>
    slides.map((slide, i) => ({
      id: slide.id,
      type: 'slideNode',
      position: prototypeLayout[slide.id] || { x: i * 320, y: 100 },
      data: { slide, index: i, isActive: i === activeSlideIndex },
    })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const [nodes, , onNodesChange] = useNodesState(initialNodes)

  // ── Edges: derived DIRECTLY from store transitions every render ──
  // This is the source of truth — no parallel local edge state needed.
  const edges: Edge[] = useMemo(() =>
    transitions.map((t) => ({
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
    })),
    [transitions, selectedTransitionId],
  )

  // ── Node position changes → persist to store ──
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes)
    for (const change of changes) {
      if (change.type === 'position' && change.position && !change.dragging) {
        updateSlidePosition(change.id, change.position)
      }
    }
  }, [onNodesChange, updateSlidePosition])

  // ── Edge changes: only handle deletion (no local state needed) ──
  const handleEdgesChange = useCallback((changes: EdgeChange[]) => {
    for (const change of changes) {
      if (change.type === 'remove') {
        deleteTransition(change.id)
      }
    }
  }, [deleteTransition])

  // ── Connect: generate ID upfront so edge.id === transition.id ──
  const handleConnect = useCallback((connection: RFConnection) => {
    if (!connection.source || !connection.target) return

    // Prevent duplicate transitions between same pair
    const exists = transitions.some(
      (t) => t.fromSlideId === connection.source && t.toSlideId === connection.target,
    )
    if (exists) return

    // Generate the ID here so ReactFlow edge and store transition share it
    const id = nanoid()
    addTransition({
      id,
      fromSlideId: connection.source,
      toSlideId: connection.target,
      animation: 'slide-left',
      duration: 500,
      ease: { ...DEFAULT_PLAYBACK_SETTINGS.transitionEase },
      trigger: 'click',
    })
    // Edges are derived from store, so ReactFlow will auto-reflect the new one
  }, [transitions, addTransition])

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedTransition(edge.id) // edge.id === transition.id now
  }, [setSelectedTransition])

  const handlePaneClick = useCallback(() => {
    setSelectedTransition(null)
  }, [setSelectedTransition])

  const selectedTransition = transitions.find((t) => t.id === selectedTransitionId)

  return (
    <div className="flex-1 relative" style={{ background: '#0d0d0d' }}>
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
        style={{ background: '#0d0d0d' }}
      >
        <Background color="#222" gap={20} size={1} />
        <Controls
          showInteractive={false}
          className="bg-[#1a1a1a]! border-white/8! rounded-lg! shadow-xl! [&>button]:bg-[#1c1c1c]! [&>button]:border-white/8! [&>button]:text-neutral-400! [&>button:hover]:bg-white/6!"
        />
        <MiniMap
          nodeColor="#1e3a5f"
          maskColor="rgba(0,0,0,0.7)"
          className="bg-[#111]! border-white/8! rounded-lg!"
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
