import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface CodeLine {
  key: string;
  text: string;
  type: 'keyword' | 'variable' | 'expression' | 'comment';
  status?: 'unchanged' | 'added' | 'removed';
  addedAtFrame?: number; // frame at which this line animates in
}

export interface AppCodeElementProps {
  lines: CodeLine[];
  language?: string;
  morphProgress?: number; // 0 to 1
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

export function AppCodeElement({
  lines,
  language = 'typescript',
  morphProgress = 0,
  width = 560,
  height = 300,
  style,
}: AppCodeElementProps) {
  const getTokenColor = (type: CodeLine['type']) => {
    switch (type) {
      case 'keyword':
        return '#60a5fa'; // text-blue-400
      case 'variable':
        return '#c084fc'; // text-purple-400
      case 'comment':
        return '#71717a'; // text-zinc-500
      case 'expression':
      default:
        return '#e4e4e7'; // text-zinc-200
    }
  };

  return (
    <div
      style={{
        width,
        height,
        background: '#0a0a0c',
        border: '1px solid rgba(39, 39, 42, 0.8)',
        borderRadius: 16,
        padding: 20,
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 12,
        color: '#d4d4d8',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {/* Code Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 10,
          marginBottom: 12,
          borderBottom: '1px solid rgba(39, 39, 42, 0.4)',
          opacity: 0.85,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
          <span
            style={{
              fontSize: 9,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              paddingLeft: 8,
              color: '#a1a1aa',
              fontWeight: 700,
            }}
          >
            {language}
          </span>
        </div>

        {morphProgress > 0 && (
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#60a5fa',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '2px 8px',
              borderRadius: 4,
              letterSpacing: '0.04em',
            }}
          >
            +2 lines morphing
          </div>
        )}
      </div>

      {/* Code Body with Smooth Line Morphing */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        {lines.map((line, idx) => {
          const isAdded = line.status === 'added';
          const lineProgress = isAdded ? morphProgress : 1;

          const lineHeight = isAdded ? interpolate(lineProgress, [0, 1], [0, 26]) : 26;
          const lineOpacity = isAdded ? interpolate(lineProgress, [0, 0.3, 1], [0, 0.4, 1]) : 1;
          const lineTranslateX = isAdded ? interpolate(lineProgress, [0, 1], [-12, 0]) : 0;

          return (
            <div
              key={line.key}
              style={{
                height: lineHeight,
                opacity: lineOpacity,
                transform: `translateX(${lineTranslateX}px)`,
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                background:
                  isAdded && lineProgress > 0.1
                    ? 'rgba(59, 130, 246, 0.12)'
                    : 'transparent',
                borderRadius: 4,
                padding: '0 4px',
                marginBottom: 2,
                transition: 'background 0.2s ease',
              }}
            >
              {/* Diff Indicator Badge */}
              <span
                style={{
                  width: 14,
                  fontSize: 10,
                  fontWeight: 700,
                  color: isAdded ? '#60a5fa' : 'transparent',
                  userSelect: 'none',
                }}
              >
                {isAdded ? '+' : ''}
              </span>

              {/* Line Number */}
              <span
                style={{
                  color: '#52525b',
                  width: 20,
                  textAlign: 'right',
                  paddingRight: 10,
                  fontSize: 10,
                  userSelect: 'none',
                }}
              >
                {idx + 1}
              </span>

              {/* Line Content */}
              <span
                style={{
                  color: getTokenColor(line.type),
                  fontStyle: line.type === 'comment' ? 'italic' : 'normal',
                  fontWeight: line.type === 'keyword' ? 600 : 400,
                  whiteSpace: 'pre',
                }}
              >
                {line.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
