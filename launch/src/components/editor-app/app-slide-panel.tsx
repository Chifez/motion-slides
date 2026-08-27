import React from 'react';
import { Plus } from 'lucide-react';

export interface SlideItem {
  id: string;
  title: string;
  subtitle: string;
  layerCount: number;
  previewType?: 'title' | 'architecture' | 'scaled' | 'code';
}

export interface AppSlidePanelProps {
  slides: SlideItem[];
  activeSlideIndex: number;
  onSelectSlide?: (index: number) => void;
  style?: React.CSSProperties;
}

export function AppSlidePanel({
  slides,
  activeSlideIndex = 0,
  onSelectSlide,
  style,
}: AppSlidePanelProps) {
  return (
    <aside
      style={{
        width: 190,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#161616',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
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
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#71717a',
          }}
        >
          Slides &amp; Layers
        </span>
        <div style={{ color: '#71717a', cursor: 'pointer' }}>
          <Plus size={14} />
        </div>
      </div>

      {/* Slide Thumbnails List */}
      <div
        style={{
          flex: 1,
          overflowY: 'hidden',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {slides.map((s, idx) => {
          const isActive = activeSlideIndex === idx;

          return (
            <div
              key={s.id}
              onClick={() => onSelectSlide?.(idx)}
              style={{
                position: 'relative',
                flexShrink: 0,
                borderRadius: 12,
                overflow: 'hidden',
                cursor: 'pointer',
                border: isActive ? '2px solid #3b82f6' : '2px solid #27272a',
                background: '#09090b',
                boxShadow: isActive
                  ? '0 0 0 3px rgba(59, 130, 246, 0.15), 0 8px 20px rgba(0, 0, 0, 0.6)'
                  : '0 4px 12px rgba(0, 0, 0, 0.4)',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Aspect-Video Preview Area */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                  background: '#0a0a0c',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 8,
                }}
              >
                {/* Visual Thumbnail Elements */}
                {s.previewType === 'title' && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ height: 6, width: 44, borderRadius: 2, background: 'rgba(255, 255, 255, 0.7)' }} />
                    <div style={{ height: 3, width: 60, borderRadius: 2, background: 'rgba(161, 161, 170, 0.5)' }} />
                  </div>
                )}

                {(s.previewType === 'architecture' || s.previewType === 'scaled') && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid #3b82f6', background: 'rgba(59, 130, 246, 0.15)' }} />
                    <div style={{ width: 14, height: 14, borderRadius: 3, border: '1px solid #e4e4e7', background: 'rgba(255, 255, 255, 0.1)' }} />
                    <div style={{ width: 14, height: 14, borderRadius: 3, border: '1px solid #ec4899', background: 'rgba(236, 72, 153, 0.15)' }} />
                  </div>
                )}

                {s.previewType === 'code' && (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3, padding: '0 4px' }}>
                    <div style={{ height: 2.5, width: '60%', background: '#60a5fa', borderRadius: 2 }} />
                    <div style={{ height: 2.5, width: '85%', background: '#c084fc', borderRadius: 2 }} />
                    <div style={{ height: 2.5, width: '45%', background: '#71717a', borderRadius: 2 }} />
                  </div>
                )}

                {/* Slide Number Badge Top-Right */}
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    padding: '2px 5px',
                    borderRadius: 4,
                    background: 'rgba(0, 0, 0, 0.65)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(4px)',
                    fontSize: 9,
                    fontWeight: 700,
                    color: 'rgba(255, 255, 255, 0.8)',
                    lineHeight: 1,
                  }}
                >
                  {idx + 1}
                </div>
              </div>

              {/* Thumbnail Footer */}
              <div
                style={{
                  padding: '6px 8px',
                  background: isActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: isActive ? '#ffffff' : '#a1a1aa',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {s.subtitle}
                </div>
                <div style={{ fontSize: 9, color: '#52525b', marginTop: 2 }}>
                  {s.layerCount} layers
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
