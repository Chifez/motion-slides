import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export type CursorState = 'default' | 'pointer' | 'text';

export interface CursorWaypoint {
  frame: number;
  x: number;
  y: number;
  click?: boolean;
  /** Cursor type at this waypoint. Defaults to 'default'. */
  cursorState?: CursorState;
}

export interface CursorPointerProps {
  waypoints: CursorWaypoint[];
  style?: React.CSSProperties;
}

// ── macOS Arrow SVG (default) ─────────────────────────────────────────────────
function ArrowCursor({ scale }: { scale: number }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      style={{
        display: 'block',
        transform: `scale(${scale})`,
        transformOrigin: '3px 3px',
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.7)) drop-shadow(0 1px 2px rgba(0,0,0,0.9))',
      }}
    >
      {/* Outer shadow stroke */}
      <path
        d="M3 2L3 17.5L7 13.5L10.5 19L12.5 18L9 12.5L14.5 12.5L3 2Z"
        fill="none"
        stroke="rgba(0,0,0,0.5)"
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* White fill arrow */}
      <path
        d="M3 2L3 17.5L7 13.5L10.5 19L12.5 18L9 12.5L14.5 12.5L3 2Z"
        fill="#ffffff"
        stroke="#111111"
        strokeWidth="1.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── macOS Pointing Hand SVG (pointer) ─────────────────────────────────────────
function PointingHandCursor({ scale }: { scale: number }) {
  return (
    <svg
      width="22"
      height="26"
      viewBox="0 0 22 26"
      fill="none"
      style={{
        display: 'block',
        transform: `scale(${scale})`,
        transformOrigin: '7px 2px',
        filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.65)) drop-shadow(0 1px 2px rgba(0,0,0,0.85))',
      }}
    >
      {/* Outer shadow outline */}
      <path
        d="M7 1.5 C5.9 1.5 5 2.4 5 3.5 L5 12.2 C4.4 11.6 3.6 11.2 2.7 11.2 C1.5 11.2 0.5 12.2 0.5 13.4 C0.5 14.3 0.9 15.1 1.6 15.6 L5.2 19.8 C6.4 21.2 8.1 22 9.9 22 L14.5 22 C17.3 22 19.5 19.8 19.5 17 L19.5 12 C19.5 10.9 18.6 10 17.5 10 C17.2 10 16.9 10.1 16.7 10.2 C16.3 9.3 15.4 8.7 14.5 8.7 C14.2 8.7 13.9 8.8 13.7 8.9 C13.3 8.1 12.4 7.5 11.5 7.5 C11.2 7.5 10.9 7.6 10.7 7.7 L10.7 3.5 C10.7 2.4 9.8 1.5 8.7 1.5 L7 1.5 Z"
        fill="none"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Crisp White Hand Fill & Solid Outline */}
      <path
        d="M7 1.5 C5.9 1.5 5 2.4 5 3.5 L5 12.2 C4.4 11.6 3.6 11.2 2.7 11.2 C1.5 11.2 0.5 12.2 0.5 13.4 C0.5 14.3 0.9 15.1 1.6 15.6 L5.2 19.8 C6.4 21.2 8.1 22 9.9 22 L14.5 22 C17.3 22 19.5 19.8 19.5 17 L19.5 12 C19.5 10.9 18.6 10 17.5 10 C17.2 10 16.9 10.1 16.7 10.2 C16.3 9.3 15.4 8.7 14.5 8.7 C14.2 8.7 13.9 8.8 13.7 8.9 C13.3 8.1 12.4 7.5 11.5 7.5 C11.2 7.5 10.9 7.6 10.7 7.7 L10.7 3.5 C10.7 2.4 9.8 1.5 8.7 1.5 L7 1.5 Z"
        fill="#ffffff"
        stroke="#111111"
        strokeWidth="1.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Finger Creases */}
      <path d="M10.7 12.5 L10.7 16" stroke="#111111" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M13.7 13 L13.7 16.5" stroke="#111111" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M16.7 13.5 L16.7 17" stroke="#111111" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

// ── macOS Text I-Beam SVG (text) ──────────────────────────────────────────────
function TextCursor({ scale }: { scale: number }) {
  return (
    <svg
      width="12"
      height="26"
      viewBox="0 0 12 26"
      fill="none"
      style={{
        display: 'block',
        transform: `scale(${scale})`,
        transformOrigin: '6px 13px',
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.7)) drop-shadow(0 1px 2px rgba(0,0,0,0.9))',
      }}
    >
      {/* Outer shadow */}
      <line x1="6" y1="3" x2="6" y2="23" stroke="rgba(0,0,0,0.5)" strokeWidth="4" strokeLinecap="round" />
      <line x1="2" y1="3" x2="10" y2="3" stroke="rgba(0,0,0,0.5)" strokeWidth="3" strokeLinecap="round" />
      <line x1="2" y1="23" x2="10" y2="23" stroke="rgba(0,0,0,0.5)" strokeWidth="3" strokeLinecap="round" />
      {/* White I-beam */}
      <line x1="6" y1="3" x2="6" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="2" y1="3" x2="10" y2="3" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="2" y1="23" x2="10" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * CursorPointer — context-aware macOS cursor with spring physics.
 *
 * Features:
 *  - Spring-driven waypoint gliding (fast crisp momentum between deliberate positions)
 *  - Contextual state: 'default' arrow | 'pointer' pointing hand | 'text' I-beam
 *  - 0.86× punch-down scale on click + expanding ring ripple
 *  - All SVG cursors drawn in-house — no external image assets needed
 */
export function CursorPointer({ waypoints, style }: CursorPointerProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (waypoints.length === 0) return null;

  // Find which waypoint segment we're in
  let activeIndex = 0;
  for (let i = 0; i < waypoints.length; i++) {
    if (frame >= waypoints[i].frame) activeIndex = i;
  }

  const current = waypoints[activeIndex];
  const next = waypoints[Math.min(activeIndex + 1, waypoints.length - 1)];
  const isLastWaypoint = activeIndex === waypoints.length - 1;

  const segmentFrame = frame - current.frame;

  const glideSpring = spring({
    frame: segmentFrame,
    fps,
    config: {
      damping: 22,
      mass: 0.7,
      stiffness: 260,
      overshootClamping: true,
    },
  });

  const currentX = isLastWaypoint
    ? current.x
    : interpolate(glideSpring, [0, 1], [current.x, next.x]);

  const currentY = isLastWaypoint
    ? current.y
    : interpolate(glideSpring, [0, 1], [current.y, next.y]);

  // ── Cursor state transition ─────────────────────────────────────────────
  const currentState: CursorState = current.cursorState ?? 'default';
  const nextState: CursorState = (isLastWaypoint ? current : next).cursorState ?? 'default';
  // Cross-fade between states over 8 frames
  const stateProgress = interpolate(glideSpring, [0.6, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const showNextState = stateProgress > 0.5;
  const activeState = showNextState ? nextState : currentState;

  // ── Click detection ─────────────────────────────────────────────────────
  const isClickWaypoint = current.click === true;
  const framesSinceClick = frame - current.frame;
  const isClicking = isClickWaypoint && framesSinceClick >= 0 && framesSinceClick < 24;

  const clickScaleSpring = spring({
    frame: framesSinceClick,
    fps,
    config: { damping: 10, mass: 0.5, stiffness: 300, overshootClamping: false },
  });
  const clickScale = isClicking
    ? interpolate(clickScaleSpring, [0, 0.4, 1], [1, 0.86, 1])
    : 1;

  // ── Click ring ripple ───────────────────────────────────────────────────
  const rippleProgress = spring({
    frame: framesSinceClick,
    fps,
    config: { damping: 20, mass: 0.8, stiffness: 180, overshootClamping: false },
  });
  const rippleScale = isClicking ? interpolate(rippleProgress, [0, 1], [0.4, 2.6]) : 1;
  const rippleOpacity = isClicking
    ? interpolate(framesSinceClick, [0, 8, 24], [0, 0.7, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        transform: `translate3d(${currentX}px, ${currentY}px, 0)`,
        pointerEvents: 'none',
        zIndex: 9999,
        ...style,
      }}
    >
      {/* Click Ripple Ring */}
      <div
        style={{
          position: 'absolute',
          top: -14,
          left: -14,
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '1.5px solid rgba(255, 255, 255, 0.85)',
          transform: `scale(${rippleScale})`,
          opacity: rippleOpacity,
          pointerEvents: 'none',
        }}
      />

      {/* Contextual Cursor Graphic */}
      {activeState === 'default' && <ArrowCursor scale={clickScale} />}
      {activeState === 'pointer' && <PointingHandCursor scale={clickScale} />}
      {activeState === 'text' && <TextCursor scale={clickScale} />}
    </div>
  );
}
