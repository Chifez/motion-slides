import React from 'react';
import { Sparkles, CornerDownLeft, X, Bot, Check, Zap, Database, Server, Cloud, CheckCircle2 } from 'lucide-react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export interface AppAiChatDrawerProps {
  isOpen?: boolean;
  promptText?: string;
  typingStartFrame?: number;
  typingSpeed?: number;
  isSubmitted?: boolean;
  stepIndex?: number; // 0: prompt only, 1: tool 1 querying, 2: tool 1 done, 3: tool 2 synthesizing, 4: complete
  isComplete?: boolean;
  style?: React.CSSProperties;
}

export function AppAiChatDrawer({
  isOpen = true,
  promptText = 'Generate a resilient AWS architecture with API Gateway, Lambda, DynamoDB, and S3',
  typingStartFrame = 0,
  typingSpeed = 1.1,
  isSubmitted = false,
  stepIndex = 0,
  isComplete = false,
  style,
}: AppAiChatDrawerProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const elapsed = Math.max(0, frame - typingStartFrame);
  const chars = Math.min(promptText.length, Math.floor(elapsed / typingSpeed));
  const currentText = promptText.slice(0, chars);
  const isTypingDone = chars >= promptText.length;
  const showCursor = Math.floor(frame / 12) % 2 === 0;

  // Streamed Reasoning Phase 1
  const text1 = "Analyzing topology and service dependencies for high-availability multi-tier infrastructure...";
  const chars1 = Math.min(text1.length, Math.max(0, Math.floor((frame - (typingStartFrame + 60)) * 2.2)));

  // Streamed Reasoning Phase 2
  const text2 = "Synthesizing serverless VPC layout with auto-routed orthogonal connectors and Multi-AZ replication...";
  const chars2 = Math.min(text2.length, Math.max(0, Math.floor((frame - (typingStartFrame + 120)) * 2.2)));

  return (
    <aside
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 380,
        background: '#161616',
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.75)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        fontFamily: 'Inter, system-ui, sans-serif',
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Drawer Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#131313',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #3b82f6, #9333ea)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={13} color="#ffffff" />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f4f4f5' }}>
            AI Design Studio
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#c084fc',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              padding: '2px 5px',
              borderRadius: 4,
            }}
          >
            Claude 3.7
          </span>
        </div>

        <div style={{ color: '#71717a', cursor: 'pointer' }}>
          <X size={15} />
        </div>
      </div>

      {/* Message Thread */}
      <div
        style={{
          flex: 1,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          overflowY: 'hidden',
        }}
      >
        {/* User Prompt Bubble */}
        {isSubmitted && (
          <div
            style={{
              alignSelf: 'flex-end',
              maxWidth: '88%',
              background: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: '12px 12px 2px 12px',
              padding: '8px 12px',
              fontSize: 12,
              color: '#ffffff',
              lineHeight: 1.4,
            }}
          >
            {promptText}
          </div>
        )}

        {/* Assistant Response Box */}
        {isSubmitted && (
          <div
            style={{
              alignSelf: 'flex-start',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px 12px 12px 2px',
              padding: '10px 12px',
              fontSize: 11.5,
              color: '#e4e4e7',
              lineHeight: 1.45,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Bot size={13} color="#a855f7" />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#a855f7', textTransform: 'uppercase' }}>
                MotionSlides Copilot
              </span>
            </div>

            {/* Reasoning Text 1 */}
            <div>{text1.slice(0, chars1)}</div>

            {/* Tool Call 1: Service Catalog Query */}
            {stepIndex >= 1 && (
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: 6,
                  padding: '5px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 10,
                  color: '#93c5fd',
                  fontWeight: 600,
                }}
              >
                {stepIndex >= 2 ? (
                  <CheckCircle2 size={12} color="#34d399" />
                ) : (
                  <Zap size={12} color="#60a5fa" />
                )}
                <span>
                  {stepIndex >= 2
                    ? '✓ Service Catalog: APIGateway, Lambda, RDS, S3'
                    : '⚡ Tool Call: queryServiceCatalog(4 services)'}
                </span>
              </div>
            )}

            {/* Reasoning Text 2 */}
            {stepIndex >= 2 && chars2 > 0 && (
              <div>{text2.slice(0, chars2)}</div>
            )}

            {/* Tool Call 2: Architecture Slide Generation */}
            {stepIndex >= 3 && (
              <div
                style={{
                  background: isComplete ? 'rgba(16, 185, 129, 0.12)' : 'rgba(147, 51, 234, 0.15)',
                  border: isComplete ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: 6,
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 10,
                  color: isComplete ? '#6ee7b7' : '#d8b4fe',
                  fontWeight: 600,
                }}
              >
                {isComplete ? (
                  <Check size={12} color="#34d399" />
                ) : (
                  <Zap size={12} color="#c084fc" />
                )}
                <span>
                  {isComplete
                    ? '✨ Slide Created: "Serverless Microservices"'
                    : '⚡ Tool Call: generateArchitectureSlide(4 nodes)'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Capsule Box */}
      <div
        style={{
          padding: 10,
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#131313',
        }}
      >
        <div
          style={{
            background: '#09090b',
            border: isSubmitted ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(59, 130, 246, 0.5)',
            borderRadius: 10,
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 40,
          }}
        >
          <div style={{ fontSize: 12, color: '#f4f4f5', lineHeight: 1.4, flex: 1, paddingRight: 8 }}>
            {!isSubmitted ? (
              <>
                {currentText}
                {(!isTypingDone || showCursor) && (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 2,
                      height: 14,
                      background: '#3b82f6',
                      marginLeft: 2,
                      verticalAlign: 'middle',
                    }}
                  />
                )}
              </>
            ) : (
              <span style={{ color: '#52525b' }}>Ask a follow-up...</span>
            )}
          </div>

          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: isTypingDone && !isSubmitted ? '#2563eb' : '#27272a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <CornerDownLeft size={13} />
          </div>
        </div>
      </div>
    </aside>
  );
}
