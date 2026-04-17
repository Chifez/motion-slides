import { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection as RFConnection,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  type Edge,
  type NodeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useEditorStore } from '@/store/editorStore'
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

  // Build nodes from slides
  const initialNodes: Node[] = useMemo(() =>
    slides.map((slide, i) => ({
      id: slide.id,
      type: 'slideNode',
      position: prototypeLayout[slide.id] || { x: i * 300, y: 100 },
      data: {
        slide,
        index: i,
        isActive: i === activeSlideIndex,
      },
    })),
    [slides, prototypeLayout, activeSlideIndex],
  )

  // Build edges from transitions
  const initialEdges: Edge[] = useMemo(() =>
    transitions.map((t) => ({
      id: t.id,
      source: t.fromSlideId,
      target: t.toSlideId,
      type: 'transitionEdge',
      data: {
        animation: t.animation,
        duration: t.duration,
        ease: t.ease,
        trigger: t.trigger,
        transitionId: t.id,
      },
    })),
    [transitions],
  )

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Sync node positions back to store on drag end
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    onNodesChange(changes)
    for (const change of changes) {
      if (change.type === 'position' && change.position && !change.dragging) {
        updateSlidePosition(change.id, change.position)
      }
    }
  }, [onNodesChange, updateSlidePosition])

  // Create transition on edge connect
  const handleConnect = useCallback((connection: RFConnection) => {
    if (!connection.source || !connection.target) return
    // Prevent duplicate transitions
    const exists = transitions.some(
      (t) => t.fromSlideId === connection.source && t.toSlideId === connection.target,
    )
    if (exists) return

    addTransition({
      fromSlideId: connection.source,
      toSlideId: connection.target,
      animation: 'slide-left',
      duration: 500,
      ease: { ...DEFAULT_PLAYBACK_SETTINGS.transitionEase },
      trigger: 'click',
    })

    // Also add the edge to local state
    setEdges((eds) => addEdge({
      ...connection,
      type: 'transitionEdge',
      data: {
        animation: 'slide-left',
        duration: 500,
        ease: { ...DEFAULT_PLAYBACK_SETTINGS.transitionEase },
        trigger: 'click',
      },
    }, eds))
  }, [transitions, addTransition, setEdges])

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedTransition(edge.id)
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
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        defaultEdgeOptions={{
          type: 'transitionEdge',
          animated: true,
        }}
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
        {/* Arrow defs */}
        <svg style={{ position: 'absolute', width: 0, height: 0 }}>
          <defs>
            <marker id="proto-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#555" />
            </marker>
          </defs>
        </svg>
      </ReactFlow>

      {/* Transition settings panel */}
      {selectedTransition && (
        <TransitionPanel
          transition={selectedTransition}
          onUpdate={(updates) => updateTransition(selectedTransition.id, updates)}
          onDelete={() => {
            deleteTransition(selectedTransition.id)
            setEdges((eds) => eds.filter((e) => e.id !== selectedTransition.id))
          }}
          onClose={() => setSelectedTransition(null)}
        />
      )}
    </div>
  )
}
