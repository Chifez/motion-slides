import { useState, useRef, useEffect } from 'react'
import { GitCommit as GitCommitIcon, Calendar, User, Info, ArrowRight } from 'lucide-react'
import type { GitCommit } from '@/lib/actions/git'

interface CommitTreeProps {
  commits: GitCommit[]
  upstreamCommits: GitCommit[]
  activeCommitId: string | null
  onCheckout: (commitId: string | null) => void
  onBranch: (commit: GitCommit) => void
}

function formatDate(ts: number) {
  try {
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
    const diff = Math.round((ts - Date.now()) / 1000)
    if (Math.abs(diff) < 60) return 'Just now'
    const diffMin = Math.round(diff / 60)
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')
    const diffHour = Math.round(diffMin / 60)
    if (Math.abs(diffHour) < 24) return rtf.format(diffHour, 'hour')
    const diffDay = Math.round(diffHour / 24)
    return rtf.format(diffDay, 'day')
  } catch {
    return new Date(ts).toLocaleDateString()
  }
}

export function CommitTree({
  commits,
  upstreamCommits,
  activeCommitId,
  onCheckout,
  onBranch,
}: CommitTreeProps) {
  const [hoveredCommitId, setHoveredCommitId] = useState<string | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null)
  
  const allCommits = [...commits]
  // Deduplicate upstream commits that are already in commits
  upstreamCommits.forEach(uc => {
    if (!allCommits.some(c => c.id === uc.id)) {
      allCommits.push(uc)
    }
  })

  // Sort chronologically descending
  allCommits.sort((a, b) => b.createdAt - a.createdAt)

  // --- Strand-based lane assignment ---
  // Instead of grouping by projectId (which causes the inherited base commit from a parent
  // to land in a different lane than the branch's own commits), we walk each commit's
  // parentCommitId chain and assign lanes based on continuous strands of ancestry.
  //
  // Algorithm:
  // 1. Build a lookup map: commitId → commit
  // 2. Find all "strand heads" — commits that are not referenced as a parent by any other commit
  //    (i.e., the latest commit on each diverged line).
  // 3. Walk each strand head down its parent chain, assigning it to the current lane.
  //    When we reach a commit that is already assigned a lane (shared ancestor / merge point),
  //    we stop — it keeps its already-assigned lane.

  const commitById = new Map<string, GitCommit>()
  allCommits.forEach(c => commitById.set(c.id, c))

  // Set of all commit IDs that are someone else's parent
  const isParentOf = new Set<string>()
  allCommits.forEach(c => { if (c.parentCommitId) isParentOf.add(c.parentCommitId) })

  // Strand heads = commits that are NOT a parent of any other commit in the visible set
  const strandHeads = allCommits.filter(c => !isParentOf.has(c.id))

  // Sort strand heads so that "own branch" commits come first (deterministic order)
  strandHeads.sort((a, b) => b.createdAt - a.createdAt)

  const commitLaneMap = new Map<string, number>()
  let nextLane = 0

  for (const head of strandHeads) {
    let curr: GitCommit | undefined = head
    while (curr) {
      if (commitLaneMap.has(curr.id)) break // already assigned (shared ancestor)
      commitLaneMap.set(curr.id, nextLane)
      curr = curr.parentCommitId ? commitById.get(curr.parentCommitId) : undefined
    }
    nextLane++
  }

  // Any commits not reached by the strand walk (orphans) get their own lane
  allCommits.forEach(c => {
    if (!commitLaneMap.has(c.id)) {
      commitLaneMap.set(c.id, nextLane++)
    }
  })

  const numLanes = nextLane

  // Lane colors matching the reference image aesthetics
  const laneColors = [
    '#2563eb', // Blue
    '#f97316', // Orange
    '#ef4444', // Red
    '#10b981', // Emerald
    '#8b5cf6', // Violet
  ]

  const getLaneColor = (commitId: string) => {
    const idx = commitLaneMap.get(commitId) ?? 0
    return laneColors[idx % laneColors.length]
  }

  // Calculate coordinates for nodes
  const rowHeight = 60
  const laneWidth = 30
  const leftOffset = 25

  const getNodeCoords = (commitId: string) => {
    const index = allCommits.findIndex(c => c.id === commitId)
    if (index === -1) return null

    const lane = commitLaneMap.get(commitId) ?? 0

    return {
      x: lane * laneWidth + leftOffset,
      y: index * rowHeight + rowHeight / 2,
    }
  }

  // Calculate diff statistics compared to parent commit
  const getDiffStats = (commit: GitCommit) => {
    const parent = allCommits.find(c => c.id === commit.parentCommitId)
    const commitSlides = commit.slides || []
    if (!parent) {
      // Root commit
      const slidesCount = commitSlides.length
      const elementsCount = commitSlides.reduce((acc, s) => acc + (s?.elements?.length || 0), 0)
      return { slides: slidesCount, elementsAdded: elementsCount, elementsDeleted: 0 }
    }

    const parentSlides = parent.slides || []

    let slidesAddedOrModified = 0
    let elementsAdded = 0
    let elementsDeleted = 0

    commitSlides.forEach(slide => {
      if (!slide) return
      const parentSlide = parentSlides.find(s => s?.id === slide.id)
      if (!parentSlide) {
        slidesAddedOrModified++
        elementsAdded += slide.elements?.length || 0
      } else {
        const hasSlideChanges = JSON.stringify(slide) !== JSON.stringify(parentSlide)
        if (hasSlideChanges) {
          slidesAddedOrModified++
          // Check elements diff
          const localElementIds = slide.elements?.map(e => e.id) || []
          const parentElementIds = parentSlide.elements?.map(e => e.id) || []

          elementsAdded += localElementIds.filter(id => !parentElementIds.includes(id)).length
          elementsDeleted += parentElementIds.filter(id => !localElementIds.includes(id)).length
        }
      }
    })

    // Slides deleted
    const parentSlideIds = parentSlides.map(s => s?.id).filter(Boolean)
    const commitSlideIds = commitSlides.map(s => s?.id).filter(Boolean)
    const slidesDeleted = parentSlideIds.filter(id => !commitSlideIds.includes(id)).length

    return {
      slides: slidesAddedOrModified + slidesDeleted,
      elementsAdded,
      elementsDeleted,
    }
  }

  const handleMouseEnterRow = (commitId: string, event: React.MouseEvent) => {
    setHoveredCommitId(commitId)
    const rect = event.currentTarget.getBoundingClientRect()
    // Position tooltip nicely to the right outside the panel
    setTooltipPos({
      x: rect.right + 12,
      y: rect.top,
    })
  }

  const handleMouseLeaveRow = () => {
    setHoveredCommitId(null)
    setTooltipPos(null)
  }

  if (allCommits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-(--ms-text-muted)">
        <GitCommitIcon size={24} className="mb-2 opacity-50" />
        <span>No version commits found. Make your first commit below!</span>
      </div>
    )
  }

  const svgHeight = allCommits.length * rowHeight

  return (
    <div className="relative w-full max-h-[300px] overflow-y-auto border border-(--ms-border) rounded-xl bg-(--ms-bg-surface)/50">
      {/* SVG Connection Layer */}
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        style={{ width: numLanes * laneWidth + 50, height: svgHeight }}
      >
        <g>
          {allCommits.map(commit => {
            if (!commit.parentCommitId) return null
            const start = getNodeCoords(commit.id)
            const end = getNodeCoords(commit.parentCommitId)
            if (!start || !end) return null

            // Same lane: just a straight line
            const laneColor = getLaneColor(commit.id)
            if (start.x === end.x) {
              return (
                <path
                  key={`line-${commit.id}`}
                  d={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                  fill="none"
                  stroke={laneColor}
                  strokeWidth="2"
                  strokeOpacity="0.65"
                />
              )
            }

            // Different lane: GitHub style tight curve
            const controlOffset = 30
            return (
              <path
                key={`line-${commit.id}`}
                d={`M ${start.x} ${start.y} C ${start.x} ${start.y + controlOffset}, ${end.x} ${end.y - controlOffset}, ${end.x} ${end.y}`}
                fill="none"
                stroke={laneColor}
                strokeWidth="2"
                strokeOpacity="0.65"
              />
            )
          })}
        </g>
      </svg>

      {/* Commit Rows list */}
      <div className="flex flex-col relative" style={{ height: svgHeight }}>
        {allCommits.map((commit, index) => {
          const coords = getNodeCoords(commit.id)
          const isCheckout = activeCommitId === commit.id
          const laneColor = getLaneColor(commit.id)

          return (
            <div
              key={commit.id}
              className={`absolute left-0 right-0 flex items-center justify-between gap-2 px-3 cursor-pointer group hover:bg-(--ms-border) transition duration-150 border-b border-(--ms-border)/30`}
              style={{
                top: index * rowHeight,
                height: rowHeight,
                paddingLeft: (coords?.x || 0) + 20,
              }}
              onMouseEnter={(e) => handleMouseEnterRow(commit.id, e)}
              onMouseLeave={handleMouseLeaveRow}
            >
              {/* Commit Node Overlay (clickable indicator) */}
              {coords && (
                <div
                  className="absolute pointer-events-none flex items-center justify-center transition duration-150"
                  style={{
                    left: coords.x - 6,
                    top: rowHeight / 2 - 6,
                    width: 12,
                    height: 12,
                  }}
                >
                  <div
                    className={`w-2.5 h-2.5 rounded-full border border-(--ms-bg-surface) transition-transform group-hover:scale-125 ${
                      isCheckout ? 'scale-125 ring-2 ring-blue-500' : ''
                    }`}
                    style={{ backgroundColor: laneColor }}
                  />
                </div>
              )}

              {/* Commit Row Content */}
              <div className="flex flex-col min-w-0 flex-1 py-1">
                <span className="text-xs font-semibold text-(--ms-text-primary) truncate">
                  {commit.message}
                </span>
                <span className="text-[10px] text-(--ms-text-muted) truncate flex items-center gap-1 mt-0.5">
                  <User size={10} />
                  <span className="font-medium text-(--ms-text-secondary)">{commit.authorName}</span>
                  <span>·</span>
                  <Calendar size={10} />
                  <span>{formatDate(commit.createdAt)}</span>
                </span>
              </div>

              {/* Actions & Stats */}
              <div className="flex items-center gap-2 shrink-0">
                {isCheckout && (
                  <span className="text-[9px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded-md">
                    HEAD
                  </span>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCheckout(isCheckout ? null : commit.id)
                  }}
                  className={`text-[10px] font-medium border rounded-md px-2.5 py-1 cursor-pointer transition ${
                    isCheckout
                      ? 'bg-blue-600 border-blue-600 text-white font-semibold'
                      : 'bg-(--ms-bg-elevated) border-(--ms-border) text-(--ms-text-secondary) hover:text-(--ms-text-primary) hover:bg-(--ms-border)'
                  }`}
                  title={isCheckout ? "Return to active sandbox" : "Checkout state at this commit"}
                >
                  {isCheckout ? "Reset" : "Checkout"}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating Hover Card / Tooltip */}
      {hoveredCommitId && tooltipPos && (
        (() => {
          const commit = allCommits.find(c => c.id === hoveredCommitId)
          if (!commit) return null
          const stats = getDiffStats(commit)

          return (
            <div
              className="fixed z-[100] w-64 bg-(--ms-bg-elevated)/95 backdrop-blur-md border border-(--ms-border-strong) rounded-xl p-3 shadow-xl pointer-events-none flex flex-col gap-1.5"
              style={{
                left: tooltipPos.x,
                top: tooltipPos.y,
              }}
            >
              <div className="flex items-center justify-between border-b border-(--ms-border) pb-1.5 mb-1">
                <span className="text-[10px] text-(--ms-text-muted) font-mono">
                  {commit.id.substring(0, 8)}
                </span>
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-(--ms-bg-base) text-(--ms-text-secondary)">
                  {commit.projectId.substring(0, 5)}...
                </span>
              </div>
              <p className="text-xs font-semibold text-(--ms-text-primary) leading-relaxed">
                {commit.message}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-(--ms-text-muted)">
                <div className="w-4 h-4 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                  {commit.authorName.charAt(0).toUpperCase()}
                </div>
                <span>by {commit.authorName}</span>
                <span>·</span>
                <span>{formatDate(commit.createdAt)}</span>
              </div>

              {/* Semantic diff counts */}
              <div className="flex items-center gap-2 border-t border-(--ms-border) pt-1.5 mt-1 text-[10px] font-medium text-(--ms-text-secondary)">
                <span>Changes:</span>
                {stats.slides > 0 && (
                  <span className="text-blue-400">
                    {stats.slides} slide{stats.slides > 1 ? 's' : ''}
                  </span>
                )}
                {stats.elementsAdded > 0 && (
                  <span className="text-emerald-400">
                    +{stats.elementsAdded}
                  </span>
                )}
                {stats.elementsDeleted > 0 && (
                  <span className="text-red-400">
                    -{stats.elementsDeleted}
                  </span>
                )}
                {stats.slides === 0 && stats.elementsAdded === 0 && stats.elementsDeleted === 0 && (
                  <span className="text-(--ms-text-muted)">No canvas diff</span>
                )}
              </div>
            </div>
          )
        })()
      )}
    </div>
  )
}
