import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { Sparkles } from 'lucide-react';
import { AppEditorShell } from '../../components/editor-app/app-editor-shell';
import { SlideItem } from '../../components/editor-app/app-slide-panel';
import { AppShapeElement } from '../../components/editor-app/elements/app-shape-element';
import { AppSectionElement } from '../../components/editor-app/elements/app-section-element';
import { AppLineElement } from '../../components/editor-app/elements/app-line-element';
import { AppAiChatDrawer } from '../../components/editor-app/app-ai-chat';
import { CursorPointer } from '../../components/shared/cursor-pointer';
import { CameraRig } from '../../components/shared/camera-rig';
import { CinematicBackground } from '../../components/shared/cinematic-background';
import { SceneIntroOverlay } from '../../components/shared/scene-intro-overlay';
import { SceneTransitionWrapper } from '../../components/shared/scene-transition-wrapper';
import { SPRING_PRESETS } from '../../constants/spring-presets';
import { useAbsoluteFrame } from '../../hooks/use-absolute-frame';

// ─── Scene 4 Art Direction ────────────────────────────────────────────────────
// Badge:    sparkle-starburst (dot icon spins 180° into place, violet radial aura bloom)
// Text:     radial-bloom (scale 0.82→1.0 with glowing violet text-shadow pulse)
// Handoff:  corner-pull exit (text sweeps diagonally top-left)
//           Editor diagonal swoop from bottom-left + 1.82× macro zoom into AI drawer

export function SceneThree() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absoluteFrame = useAbsoluteFrame('scene4');

  // ─── Milestones ───────────────────────────────────────────────────────────
  // 0 - 78f   : Standalone Centered Intro Interstitial (+200ms reading time)
  // 78f+      : Editor Workspace Enters with Down-Right Zoom-In into AI Input (1.85×)
  // 92 - 180f : Prompt types into input capsule in sharp macro focus
  // 185f      : Click Send button (pointer cursor → click)
  // 190f+     : Camera smoothly dollies out to 1.0× revealing AI reasoning stream
  // 300f      : Slide 6 thumbnail created in sidebar
  // 305 - 500f: Physical momentum drop-in of AWS VPC, Nodes & Connectors on canvas

  const isEditorVisible = frame >= 78;
  const isChatOpen = true; // Chat drawer open in focused studio mode
  const isSubmitted = frame >= 185;
  const stepIndex = frame < 195 ? 0 : frame < 225 ? 1 : frame < 255 ? 2 : frame < 295 ? 3 : 4;
  const isComplete = frame >= 295;
  const isGenerated = frame >= 300;

  const initialSlides: SlideItem[] = [
    { id: 's-1', title: 'Welcome', subtitle: 'MotionSlides', layerCount: 2, previewType: 'title' },
    { id: 's-2', title: 'Architecture', subtitle: 'Service Blueprint', layerCount: 7, previewType: 'architecture' },
    { id: 's-3', title: 'Scaled System', subtitle: 'Scalable Architecture', layerCount: 11, previewType: 'scaled' },
    { id: 's-4', title: 'Code Diffs', subtitle: 'Code-Aware Transitions', layerCount: 4, previewType: 'code' },
    { id: 's-5', title: 'Line Morphing', subtitle: 'Dynamic Line Morphing', layerCount: 6, previewType: 'code' },
  ];
  const generatedSlide: SlideItem = {
    id: 's-6',
    title: 'AWS Serverless',
    subtitle: 'Serverless Microservices',
    layerCount: 8,
    previewType: 'architecture',
  };
  const slides = isGenerated ? [...initialSlides, generatedSlide] : initialSlides;
  const activeSlideIndex = isGenerated ? 5 : 4;

  // ─── Editor Entrance: Diagonal Swoop from Bottom-Left ─────────────────────
  // Editor sweeps in from the bottom-left corner as intro text pulls toward top-left.
  // Camera then immediately executes the 1.82× macro zoom into the AI chat drawer.
  const editorEntrance = spring({
    frame: Math.max(0, frame - 78),
    fps,
    config: { damping: 22, mass: 0.9, stiffness: 140, overshootClamping: true },
  });
  const editorTranslateX = interpolate(editorEntrance, [0, 1], [-120, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const editorTranslateY = interpolate(editorEntrance, [0, 1], [80, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const editorScale = interpolate(editorEntrance, [0, 1], [0.88, 1]);
  const editorOpacity = interpolate(editorEntrance, [0, 1], [0, 1]);

  // ─── Camera Zoom Keyframes: Macro Zoom-In on Input → Grand Pullback on Send ──
  const cameraKeyframes = [
    { startFrame: 0, scale: 1.0, originX: '50%', originY: '50%' },
    // Slide down-right into AI input capsule on entrance
    { startFrame: 78, scale: 1.82, originX: '88%', originY: '88%', springConfig: { damping: 20, mass: 0.9, stiffness: 130 } },
    // On message send (frame 190), smoothly dolly back out to reveal full workspace
    { startFrame: 190, scale: 1.0, originX: '50%', originY: '50%', springConfig: { damping: 24, mass: 1.0, stiffness: 100 } },
  ];

  // ─── Cursor Waypoints — with contextual cursor states ─────────────────────
  const cursorWaypoints = [
    { frame: 78, x: 1560, y: 880, cursorState: 'default' as const },
    { frame: 92, x: 1580, y: 940, cursorState: 'text' as const },     // In input capsule while typing
    { frame: 175, x: 1735, y: 940, cursorState: 'pointer' as const }, // Move to Send button
    { frame: 185, x: 1735, y: 940, click: true, cursorState: 'pointer' as const }, // Click Send
    { frame: 230, x: 1580, y: 550, cursorState: 'default' as const }, // Inspect streaming response
    { frame: 320, x: 700, y: 450, cursorState: 'default' as const },  // Glide to generated canvas architecture
  ];

  // ─── Staggered Canvas Entrances with Directional Drop-in Physics ──────────
  const vpcSpring = spring({ frame: Math.max(0, frame - 300), fps, config: { damping: 20, mass: 0.85, stiffness: 160, overshootClamping: true } });
  const node1Spring = spring({ frame: Math.max(0, frame - 305), fps, config: { damping: 14, mass: 0.8, stiffness: 170, overshootClamping: false } });
  const node2Spring = spring({ frame: Math.max(0, frame - 320), fps, config: { damping: 14, mass: 0.8, stiffness: 170, overshootClamping: false } });
  const node3Spring = spring({ frame: Math.max(0, frame - 335), fps, config: { damping: 14, mass: 0.8, stiffness: 170, overshootClamping: false } });
  const node4Spring = spring({ frame: Math.max(0, frame - 350), fps, config: { damping: 14, mass: 0.8, stiffness: 170, overshootClamping: false } });

  // Scene exit
  const exitStartFrame = 490;

  return (
    <SceneTransitionWrapper
      entryStartFrame={0}
      exitStartFrame={exitStartFrame}
      exitDurationFrames={20}
    >
      <CinematicBackground absoluteFrame={absoluteFrame}>
        {/* Phase 1: Intro Interstitial (0 - 78f) — sparkle-starburst badge + radial-bloom text (+200ms) */}
        <SceneIntroOverlay
          badge="Fully Agentic AI Studio"
          badgeColor="#c084fc"
          title="Prompt-to-slide generation in seconds"
          subtitle="Describe your infrastructure to synthesize resilient cloud architectures"
          startFrame={0}
          durationInFrames={78}
          textVariant="radial-bloom"
          badgeVariant="sparkle-starburst"
          exitVariant="corner-pull"
        />

        {/* Phase 2: Editor & AI Studio — Diagonal Swoop from bottom-left + 1.82× macro zoom */}
        {isEditorVisible && (
          <CameraRig keyframes={cameraKeyframes}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: editorOpacity,
                transform: `translate(${editorTranslateX}px, ${editorTranslateY}px) scale(${editorScale})`,
                willChange: 'transform',
              }}
            >
              <AppEditorShell
                projectName="Distributed Architecture Deck"
                slides={slides}
                activeSlideIndex={activeSlideIndex}
                isChatOpen={isChatOpen}
                inspectorElementLabel={isGenerated ? 'Architecture · Serverless' : 'Slide · Presentation'}
                inspectorMotionId={isGenerated ? 'ai-gen-arch' : undefined}
                inspectorProps={
                  isGenerated
                    ? [
                        { name: 'Model', value: 'Claude 3.7 Sonnet' },
                        { name: 'Architecture', value: 'Serverless Multi-Tier' },
                        { name: 'Nodes Generated', value: '4 AWS Services' },
                        { name: 'VPC Routing', value: 'Auto-Routed Orthogonal' },
                        { name: 'Health Score', value: '99 / 100' },
                      ]
                    : [
                        { name: 'Deck', value: 'Cloud Architecture' },
                        { name: 'Slides', value: `${slides.length} slides` },
                        { name: 'Engine', value: 'Magic Move FLIP' },
                      ]
                }
                chatDrawerNode={
                  <AppAiChatDrawer
                    isOpen={isChatOpen}
                    promptText="Generate a resilient AWS architecture with API Gateway, Lambda, DynamoDB, and S3"
                    typingStartFrame={80}
                    typingSpeed={0.9}
                    isSubmitted={isSubmitted}
                    stepIndex={stepIndex}
                    isComplete={isComplete}
                  />
                }
              >
                {/* Canvas Area */}
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  {isGenerated ? (
                    /* Generated Slide 6: Staggered Animated AWS Cloud Architecture */
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      {/* Dashed VPC Boundary */}
                      <div
                        style={{
                          position: 'absolute',
                          left: 220,
                          top: 70,
                          zIndex: 1,
                          opacity: vpcSpring,
                          transform: `scale(${interpolate(vpcSpring, [0, 1], [0.95, 1])})`,
                        }}
                      >
                        <AppSectionElement label="AWS Serverless VPC Network" width={720} height={420} />
                      </div>

                      {/* Node 1: API Gateway with physical drop-in momentum */}
                      <div
                        style={{
                          position: 'absolute', left: 80, top: 220, width: 90, height: 90, zIndex: 10,
                          opacity: node1Spring,
                          transform: `translate3d(0, ${interpolate(node1Spring, [0, 1], [32, 0])}px, 0) scale(${interpolate(node1Spring, [0, 1], [0.75, 1])})`,
                        }}
                      >
                        <AppShapeElement shape="api-gateway" label="API Gateway" />
                      </div>

                      {/* Node 2: Lambda with physical drop-in momentum */}
                      <div
                        style={{
                          position: 'absolute', left: 310, top: 150, width: 90, height: 90, zIndex: 10,
                          opacity: node2Spring,
                          transform: `translate3d(0, ${interpolate(node2Spring, [0, 1], [32, 0])}px, 0) scale(${interpolate(node2Spring, [0, 1], [0.75, 1])})`,
                        }}
                      >
                        <AppShapeElement shape="lambda" label="Lambda Fn" selected />
                      </div>

                      {/* Node 3: RDS with physical drop-in momentum */}
                      <div
                        style={{
                          position: 'absolute', left: 540, top: 150, width: 90, height: 90, zIndex: 10,
                          opacity: node3Spring,
                          transform: `translate3d(0, ${interpolate(node3Spring, [0, 1], [32, 0])}px, 0) scale(${interpolate(node3Spring, [0, 1], [0.75, 1])})`,
                        }}
                      >
                        <AppShapeElement shape="rds" label="AWS RDS" />
                      </div>

                      {/* Node 4: S3 with physical drop-in momentum */}
                      <div
                        style={{
                          position: 'absolute', left: 770, top: 280, width: 90, height: 90, zIndex: 10,
                          opacity: node4Spring,
                          transform: `translate3d(0, ${interpolate(node4Spring, [0, 1], [32, 0])}px, 0) scale(${interpolate(node4Spring, [0, 1], [0.75, 1])})`,
                        }}
                      >
                        <AppShapeElement shape="s3" label="S3 Bucket" />
                      </div>

                      {/* Progressive Connectors */}
                      {frame >= 325 && (
                        <AppLineElement id="conn-api-lambda" p1={{ x: 170, y: 265 }} p2={{ x: 310, y: 195 }} lineType="elbow" style="solid" strokeColor="#60a5fa" />
                      )}
                      {frame >= 340 && (
                        <AppLineElement id="conn-lambda-rds" p1={{ x: 400, y: 195 }} p2={{ x: 540, y: 195 }} lineType="straight" style="solid" strokeColor="#60a5fa" />
                      )}
                      {frame >= 355 && (
                        <AppLineElement id="conn-rds-s3" p1={{ x: 630, y: 195 }} p2={{ x: 770, y: 325 }} lineType="elbow" style="dashed" strokeColor="#a855f7" />
                      )}
                    </div>
                  ) : (
                    /* Pre-generation canvas state: Clean uniform typography matching presentation deck aesthetic */
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: '0 40px',
                        boxSizing: 'border-box',
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: '"DM Serif Display", Georgia, serif',
                          fontStyle: 'italic',
                          fontSize: 42,
                          fontWeight: 400,
                          color: '#ffffff',
                          letterSpacing: '-0.02em',
                          margin: 0,
                          lineHeight: 1.15,
                        }}
                      >
                        Fully Agentic Architecture Generation
                      </h3>
                      <p
                        style={{
                          fontFamily: 'Inter, system-ui, sans-serif',
                          fontSize: 16,
                          fontWeight: 500,
                          color: '#a1a1aa',
                          marginTop: 12,
                          letterSpacing: '-0.01em',
                          maxWidth: 540,
                          margin: '12px auto 0',
                          lineHeight: 1.45,
                        }}
                      >
                        Describe your system topology — watch the AI design, position, and connect resilient cloud slides in real-time
                      </p>
                    </div>
                  )}
                </div>
              </AppEditorShell>

              <CursorPointer waypoints={cursorWaypoints} />
            </div>
          </CameraRig>
        )}
      </CinematicBackground>
    </SceneTransitionWrapper>
  );
}
