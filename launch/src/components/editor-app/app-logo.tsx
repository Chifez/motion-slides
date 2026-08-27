import React from 'react';
import { staticFile } from 'remotion';

export interface LogoProps {
  expanded?: boolean;
  size?: number;
  style?: React.CSSProperties;
}

/**
 * Exact MotionSlides Logo ported from apps/web/src/components/ui/logo.tsx
 */
export function AppLogo({ expanded = true, size = 28, style }: LogoProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        textDecoration: 'none',
        userSelect: 'none',
        fontFamily: 'Inter, system-ui, sans-serif',
        ...style,
      }}
    >
      <img
        src={staticFile('logo.png')}
        alt="MotionSlides"
        style={{ height: size, width: 'auto', display: 'block' }}
      />
      {expanded && (
        <span
          style={{
            fontSize: size * 0.65,
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: '#f4f4f5',
            lineHeight: 1,
          }}
        >
          Motion<span style={{ color: '#a1a1aa' }}>Slides</span>
        </span>
      )}
    </span>
  );
}
