import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface CursorWaypoint {
  frame: number;
  x: number;
  y: number;
  click?: boolean;
}

export interface CursorPointerProps {
  waypoints: CursorWaypoint[];
  style?: React.CSSProperties;
}

/**
 * Clean macOS-style cursor — no labels, no drift.
 * Motion: spring-driven snap between deliberate waypoints.
 * Click: 0.86x punch-down scale + expanding ring ripple.
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

  // Use a fast spring to glide toward next waypoint — no linear drift, always physics-driven
  const segmentFrames = isLastWaypoint ? 1 : Math.max(next.frame - current.frame, 1);
  const segmentFrame = frame - current.frame;

  const glideSpring = spring({
    frame: segmentFrame,
    fps,
    config: {
      // Fast, crisp glide: Slightly underdamped for purposeful momentum
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

  // Click detection — the 8-frame window after click waypoint
  const isClickWaypoint = current.click === true;
  const framesSinceClick = frame - current.frame;
  const isClicking = isClickWaypoint && framesSinceClick >= 0 && framesSinceClick < 24;

  // Click scale punch (0.86x, fast out)
  const clickScaleSpring = spring({
    frame: framesSinceClick,
    fps,
    config: { damping: 10, mass: 0.5, stiffness: 300, overshootClamping: false },
  });
  const clickScale = isClicking
    ? interpolate(clickScaleSpring, [0, 0.4, 1], [1, 0.86, 1])
    : 1;

  // Click ring ripple
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

      {/* macOS Arrow Cursor — clean, crisp, no label */}
      <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        style={{
          display: 'block',
          transform: `scale(${clickScale})`,
          transformOrigin: '3px 3px',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.7)) drop-shadow(0 1px 2px rgba(0,0,0,0.9))',
        }}
      >
        {/* Outer shadow stroke for contrast on any background */}
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
    </div>
  );
}
