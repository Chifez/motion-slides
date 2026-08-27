import React from 'react';
import { ZoomIn } from 'lucide-react';
import { AppEditorToolbar } from './app-editor-toolbar';
import { AppSlidePanel, SlideItem } from './app-slide-panel';
import { AppInspectorPanel, InspectorProp } from './app-inspector-panel';

export interface AppEditorShellProps {
  projectName?: string;
  slides: SlideItem[];
  activeSlideIndex: number;
  onSelectSlide?: (index: number) => void;
  inspectorElementLabel?: string;
  inspectorProps?: InspectorProp[];
  inspectorMotionId?: string;
  children: React.ReactNode;
  isChatOpen?: boolean;
  chatDrawerNode?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  style?: React.CSSProperties;
}

export function AppEditorShell({
  projectName = 'Distributed Architecture Deck',
  slides,
  activeSlideIndex = 0,
  onSelectSlide,
  inspectorElementLabel,
  inspectorProps,
  inspectorMotionId,
  children,
  isChatOpen = false,
  chatDrawerNode,
  width = 1620,
  height = 880,
  style,
}: AppEditorShellProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        background: '#111111',
        boxShadow: '0 40px 120px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Top Toolbar */}
      <AppEditorToolbar projectName={projectName} isChatOpen={isChatOpen} />

      {/* Main Workspace Body */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* Left Slide Panel */}
        <AppSlidePanel
          slides={slides}
          activeSlideIndex={activeSlideIndex}
          onSelectSlide={onSelectSlide}
        />

        {/* Center Canvas Stage */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            background: '#070708',
            backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Top-Right Zoom Badge */}
          <div
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              zIndex: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 6,
              padding: '3px 8px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              color: '#71717a',
            }}
          >
            <ZoomIn size={10} color="#71717a" />
            <span>100%</span>
          </div>

          {/* Canvas Slide Viewport (1000 x 562.5 / 16:9) */}
          <div
            style={{
              width: 1000,
              height: 562.5,
              position: 'relative',
              background: '#09090b',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.06)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
              overflow: 'hidden',
            }}
          >
            {children}
          </div>

          {/* Bottom Slide Counter Dots */}
          <div
            style={{
              position: 'absolute',
              bottom: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              zIndex: 20,
            }}
          >
            {slides.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === activeSlideIndex ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === activeSlideIndex ? '#60a5fa' : '#3f3f46',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Right Inspector Panel */}
        <AppInspectorPanel
          elementLabel={inspectorElementLabel}
          props={inspectorProps}
          motionId={inspectorMotionId}
        />

        {/* AI Chat Slide-over Drawer */}
        {isChatOpen && chatDrawerNode}
      </div>
    </div>
  );
}
