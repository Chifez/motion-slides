import React from 'react';
import { useCameraZoom, ZoomKeyframe } from '../../hooks/use-camera-zoom';

export interface CameraRigProps {
  keyframes: ZoomKeyframe[];
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function CameraRig({ keyframes, children, style }: CameraRigProps) {
  const { scale, originX, originY, vignetteOpacity } = useCameraZoom(keyframes);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Zoomable Container */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${scale})`,
          transformOrigin: `${originX} ${originY}`,
          transition: 'none',
          willChange: 'transform',
        }}
      >
        {children}
      </div>

      {/* Cinematic Vignette Overlay during Focus Zoom */}
      {vignetteOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5, 5, 8, 0.7) 100%)',
            opacity: vignetteOpacity,
          }}
        />
      )}
    </div>
  );
}
