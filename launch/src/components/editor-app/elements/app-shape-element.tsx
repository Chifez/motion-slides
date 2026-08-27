import React from 'react';

export type ShapeType =
  | 'circle'
  | 'server'
  | 'database'
  | 'cloud'
  | 'client'
  | 'lambda'
  | 'api-gateway'
  | 's3'
  | 'aws-icon';

export interface AppShapeElementProps {
  shape: ShapeType;
  color?: string;
  label?: string;
  iconPath?: string;
  selected?: boolean;
  style?: React.CSSProperties;
}

export function CircleShape({ color = '#3b82f6' }: { color?: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
      <circle cx="50" cy="50" r="45" fill="#09090b" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function ServerShape({ color = '#3b82f6' }: { color?: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', padding: 4, display: 'block' }}>
      <rect x="8" y="10" width="84" height="22" rx="3.5" fill="#09090b" stroke={color} strokeWidth="1.5" />
      <rect x="8" y="39" width="84" height="22" rx="3.5" fill="#09090b" stroke={color} strokeWidth="1.5" />
      <rect x="8" y="68" width="84" height="22" rx="3.5" fill="#09090b" stroke={color} strokeWidth="1.5" />
      <circle cx="80" cy="21" r="3.5" fill={color} />
      <circle cx="80" cy="50" r="3.5" fill={color} />
      <circle cx="80" cy="79" r="3.5" fill={color} />
    </svg>
  );
}

export function DatabaseShape({ color = '#3b82f6' }: { color?: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', padding: 4, display: 'block' }}>
      <ellipse cx="50" cy="18" rx="38" ry="9" fill="#09090b" stroke={color} strokeWidth="1.5" />
      <path d="M12 18 L12 82 A38 9 0 0 0 88 82 L88 18" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M12 18 L12 82 L88 82 L88 18 Z" fill="#09090b" stroke="none" />
      <ellipse cx="50" cy="82" rx="38" ry="9" fill="#09090b" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function LambdaShape() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.05))',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        borderRadius: 16,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(245, 158, 11, 0.15)',
      }}
    >
      <span
        style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: 34,
          fontWeight: 700,
          color: '#fbbf24',
          userSelect: 'none',
          lineHeight: 1,
        }}
      >
        λ
      </span>
    </div>
  );
}

export function ApiGatewayShape() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(147, 51, 234, 0.05))',
        border: '1px solid rgba(168, 85, 247, 0.4)',
        borderRadius: 16,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(168, 85, 247, 0.15)',
      }}
    >
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="1.75">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <line x1="4" y1="22" x2="4" y2="15" />
      </svg>
    </div>
  );
}

export function S3Shape() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05))',
        border: '1px solid rgba(16, 185, 129, 0.4)',
        borderRadius: 16,
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.15)',
      }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="1.75">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    </div>
  );
}

export function AppShapeElement({
  shape,
  color = '#3b82f6',
  label,
  selected = false,
  style,
}: AppShapeElementProps) {
  const renderShape = () => {
    switch (shape) {
      case 'circle':
        return <CircleShape color={color} />;
      case 'server':
        return <ServerShape color={color} />;
      case 'database':
        return <DatabaseShape color={color} />;
      case 'lambda':
        return <LambdaShape />;
      case 'api-gateway':
        return <ApiGatewayShape />;
      case 's3':
        return <S3Shape />;
      default:
        return <ServerShape color={color} />;
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        ...style,
      }}
    >
      <div style={{ width: '100%', height: '100%', flex: 1 }}>{renderShape()}</div>
      {label && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: 'rgba(255, 255, 255, 0.85)',
            marginTop: 8,
            whiteSpace: 'nowrap',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {label}
        </span>
      )}

      {/* Selected Element Bounding Outline */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            inset: -4,
            border: '1.5px solid #18a0fb',
            borderRadius: 8,
            pointerEvents: 'none',
          }}
        >
          <div style={{ position: 'absolute', top: -3, left: -3, width: 6, height: 6, background: '#fff', border: '1px solid #18a0fb' }} />
          <div style={{ position: 'absolute', top: -3, right: -3, width: 6, height: 6, background: '#fff', border: '1px solid #18a0fb' }} />
          <div style={{ position: 'absolute', bottom: -3, left: -3, width: 6, height: 6, background: '#fff', border: '1px solid #18a0fb' }} />
          <div style={{ position: 'absolute', bottom: -3, right: -3, width: 6, height: 6, background: '#fff', border: '1px solid #18a0fb' }} />
        </div>
      )}
    </div>
  );
}
