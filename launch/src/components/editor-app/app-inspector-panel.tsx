import React from 'react';
import { AlignCenter, Trash2, Palette, Sparkles, Layers } from 'lucide-react';

export interface InspectorProp {
  name: string;
  value: string | number;
}

export interface AppInspectorPanelProps {
  elementLabel?: string;
  elementType?: string;
  props?: InspectorProp[];
  motionId?: string;
  style?: React.CSSProperties;
}

export function AppInspectorPanel({
  elementLabel = 'Shape · AWS Lambda',
  elementType = 'aws-icon',
  props = [
    { name: 'X', value: '520px' },
    { name: 'Y', value: '120px' },
    { name: 'Width', value: '90px' },
    { name: 'Height', value: '90px' },
    { name: 'Fill', value: '#09090b' },
    { name: 'Stroke', value: '#27272a' },
  ],
  motionId = 'lambda-node',
  style,
}: AppInspectorPanelProps) {
  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#161616',
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        fontFamily: 'Inter, system-ui, sans-serif',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlignCenter size={11} color="#71717a" />
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#71717a',
            }}
          >
            Inspector
          </span>
        </div>
        <div style={{ color: '#ef4444', opacity: 0.8, cursor: 'pointer' }}>
          <Trash2 size={13} />
        </div>
      </div>

      {/* Selected Element Title */}
      <div style={{ padding: '12px 12px 6px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Palette size={11} color="#60a5fa" />
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#f4f4f5' }}>
            {elementLabel}
          </span>
        </div>

        {/* Motion Match ID Tag */}
        {motionId && (
          <div
            style={{
              background: 'rgba(168, 85, 247, 0.1)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              borderRadius: 6,
              padding: '6px 8px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Layers size={11} color="#c084fc" />
              <span style={{ fontSize: 9, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase' }}>
                Magic Move ID
              </span>
            </div>
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#e4e4e7' }}>
              #{motionId}
            </span>
          </div>
        )}

        {/* Properties Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {props.map((prop) => (
            <div key={prop.name} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#71717a',
                }}
              >
                {prop.name}
              </span>
              <div
                style={{
                  background: '#111111',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 6,
                  padding: '5px 8px',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    color: '#e4e4e7',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {prop.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
