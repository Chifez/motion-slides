import React from 'react';
import {
  ArrowLeft,
  GitBranch,
  ChevronDown,
  PenSquare,
  Film,
  Sparkles,
  Settings,
  Download,
  Users,
  Play,
} from 'lucide-react';
import { AppLogo } from './app-logo';

export interface AppEditorToolbarProps {
  projectName?: string;
  activeMode?: 'design' | 'prototype' | 'timeline';
  branchName?: string;
  isChatOpen?: boolean;
  deckScore?: number;
  style?: React.CSSProperties;
}

export function AppEditorToolbar({
  projectName = 'Distributed Architecture Deck',
  activeMode = 'design',
  branchName = 'main',
  isChatOpen = false,
  deckScore = 98,
  style,
}: AppEditorToolbarProps) {
  return (
    <header
      style={{
        height: 52,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: '#161616',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        fontFamily: 'Inter, system-ui, sans-serif',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Left Zone: Identity & Project */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div
          style={{
            padding: 6,
            borderRadius: 8,
            color: '#71717a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={16} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <AppLogo expanded={false} size={22} />
        </div>

        {/* Project Title Input */}
        <div
          style={{
            background: 'transparent',
            borderRadius: 8,
            padding: '4px 8px',
            fontSize: 13,
            fontWeight: 600,
            color: '#f4f4f5',
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
          }}
        >
          {projectName}
        </div>

        {/* Branch Menu Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 8,
            padding: '4px 8px',
            fontSize: 12,
            color: '#a1a1aa',
            cursor: 'pointer',
          }}
        >
          <GitBranch size={12} color="#3b82f6" />
          <span style={{ fontWeight: 500, color: '#e4e4e7' }}>{branchName}</span>
          <ChevronDown size={11} color="#71717a" />
        </div>
      </div>

      {/* Center Zone: Workflow Mode Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(17, 17, 17, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          padding: 2,
        }}
      >
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: 8,
            border: 'none',
            background: activeMode === 'design' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
            color: activeMode === 'design' ? '#f4f4f5' : '#71717a',
            cursor: 'pointer',
          }}
        >
          <PenSquare size={13} />
          <span>Design</span>
        </button>

        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: 8,
            border: 'none',
            background: activeMode === 'prototype' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
            color: activeMode === 'prototype' ? '#60a5fa' : '#71717a',
            cursor: 'pointer',
          }}
        >
          <GitBranch size={13} />
          <span>Prototype</span>
        </button>

        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: 8,
            border: 'none',
            background: activeMode === 'timeline' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
            color: activeMode === 'timeline' ? '#c084fc' : '#71717a',
            cursor: 'pointer',
          }}
        >
          <Film size={13} />
          <span>Timeline</span>
        </button>
      </div>

      {/* Right Zone: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Ask AI Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            background: isChatOpen ? 'rgba(147, 51, 234, 0.2)' : 'rgba(59, 7, 100, 0.3)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            color: '#d8b4fe',
            cursor: 'pointer',
          }}
        >
          <Sparkles size={13} color="#c084fc" />
          <span>Ask AI</span>
        </div>

        {/* Deck Score Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#34d399',
            padding: '4px 8px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          <Sparkles size={10} />
          <span>{deckScore}</span>
        </div>

        {/* Action Icon Buttons */}
        <div style={{ padding: 6, color: '#71717a', cursor: 'pointer' }}><Settings size={15} /></div>
        <div style={{ padding: 6, color: '#71717a', cursor: 'pointer' }}><Download size={15} /></div>
        <div style={{ padding: 6, color: '#71717a', cursor: 'pointer' }}><Users size={15} /></div>

        {/* Hero CTA Present Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#2563eb',
            color: '#ffffff',
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 700,
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.35)',
            cursor: 'pointer',
            marginLeft: 4,
          }}
        >
          <Play size={12} fill="#ffffff" />
          <span>Present</span>
        </div>
      </div>
    </header>
  );
}
