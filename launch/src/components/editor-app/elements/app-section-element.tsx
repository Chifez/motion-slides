import React from 'react';

export interface AppSectionElementProps {
  label: string;
  width: number;
  height: number;
  style?: React.CSSProperties;
}

export function AppSectionElement({
  label = 'AWS VPC Subnet',
  width,
  height,
  style,
}: AppSectionElementProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 16,
        border: '1px dashed rgba(255, 255, 255, 0.12)',
        background: 'rgba(255, 255, 255, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: 12,
        position: 'relative',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignSelf: 'flex-start',
          fontSize: 9,
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          background: '#101012',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 4,
          padding: '2px 6px',
          color: 'rgba(255, 255, 255, 0.5)',
          fontFamily: 'Inter, system-ui, sans-serif',
          userSelect: 'none',
        }}
      >
        {label}
      </div>
    </div>
  );
}
