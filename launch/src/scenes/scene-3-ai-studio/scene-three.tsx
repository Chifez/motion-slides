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
import { SceneIntroOverlay } from '../../components/shared/scene-intro-overlay';
import { SPRING_PRESETS } from '../../constants/spring-presets';

export function SceneThree() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ─── Milestones: ─────────────────────────────────────────────────
  // 0 - 70f   : Standalone Centered Intro Interstitial
  // 65f+      : Editor Workspace Enters with Spring Physics
  // 100f      : Click Ask AI toolbar button (x: 1485, y: 126)
  // 105f      : Drawer opens, Camera zooms smoothly toward input
  // 115 - 180f: Prompt types into capsule
  // 185f      : Click Send button (x: 1735, y: 940)
  // 190 - 300f: Multi-step AI reasoning & tool execution streaming
  // 300f      : Slide 4 creates in sidebar + Camera pulls back
  // 305 - 500f: Staggered animated cascade of AWS VPC, Nodes & Connectors on canvas

  const isEditorVisible = frame >= 65;
  const isChatOpen = frame >= 105;
  const isSubmitted = frame >= 185;

  // Multi-step AI tool execution
  const stepIndex = frame < 195 ? 0 : frame < 225 ? 1 : frame < 255 ? 2 : frame < 295 ? 3 : 4;
  const isComplete = frame >= 295;
  const isGenerated = frame >= 300;

  const initialSlides: SlideItem[] = [
    { id: 's-1', title: 'Welcome', subtitle: 'MotionSlides', layerCount: 2, previewType: 'title' },
    { id: 's-2', title: 'Architecture', subtitle: 'Service Blueprint', layerCount: 7, previewType: 'architecture' },
    { id: 's-3', title: 'Scaled System', subtitle: 'Scalable Architecture', layerCount: 11, previewType: 'scaled' },
  ];

  const generatedSlide: SlideItem = {
    id: 's-4',
    title: 'AWS Serverless',
    subtitle: 'Serverless Microservices',
    layerCount: 8,
    previewType: 'architecture',
  };

  const slides = isGenerated ? [...initialSlides, generatedSlide] : initialSlides;
  const activeSlideIndex = isGenerated ? 3 : 2;

  // ─── Editor Window Spring Entrance (enters at frame 65) ──────────
  const editorEntrance = spring({
    frame: Math.max(0, frame - 65),
    fps,
    config: { damping: 20, mass: 0.85, stiffness: 150 },
  });
  const editorScale = interpolate(editorEntrance, [0, 1], [0.94, 1]);
  const editorOpacity = interpolate(editorEntrance, [0, 1], [0, 1]);

  // ─── Camera Zoom Keyframes ───────────────────────────────────────
  const cameraKeyframes = [
    { startFrame: 0, scale: 1.0, originX: '50%', originY: '50%' },
    {
      startFrame: 105,
      scale: 1.25,
      originX: '85%',
      originY: '85%',
      springConfig: { damping: 20, mass: 0.85, stiffness: 140 },
    },
    {
      startFrame: 295,
      scale: 1.0,
      originX: '50%',
      originY: '50%',
      springConfig: { damping: 28, mass: 1.2, stiffness: 70 },
    },
  ];

  // ─── Cursor Waypoints (Active once editor is visible) ────────────
  const cursorWaypoints = [
    { frame: 65, x: 960, y: 540 },
    { frame: 90, x: 1485, y: 126 }, // Move to Ask AI button
    { frame: 100, x: 1485, y: 126, click: true }, // Click Ask AI
    { frame: 120, x: 1580, y: 940 }, // Move to input capsule
    { frame: 180, x: 1735, y: 940 }, // Move to Send button
    { frame: 185, x: 1735, y: 940, click: true }, // Click Send
    { frame: 220, x: 1580, y: 600 }, // Hover over streaming response
    { frame: 310, x: 700, y: 450 }, // Move to canvas as nodes materialize
  ];

  // ─── Staggered Animated Entrances for Canvas Elements ────────────
  const vpcSpring = spring({
    frame: Math.max(0, frame - 300),
    fps,
    config: { damping: 18, mass: 0.8, stiffness: 180 },
  });

  const node1Spring = spring({
    frame: Math.max(0, frame - 305),
    fps,
    config: { damping: 16, mass: 0.7, stiffness: 200 },
  });

  const node2Spring = spring({
    frame: Math.max(0, frame - 320),
    fps,
    config: { damping: 16, mass: 0.7, stiffness: 200 },
  });

  const node3Spring = spring({
    frame: Math.max(0, frame - 335),
    fps,
    config: { damping: 16, mass: 0.7, stiffness: 200 },
  });

  const node4Spring = spring({
    frame: Math.max(0, frame - 350),
    fps,
    config: { damping: 16, mass: 0.7, stiffness: 200 },
  });

  const sceneExitOpacity = interpolate(frame, [485, 510], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'relative',
        width: 1920,
        height: 1080,
        background: '#08090a',
        overflow: 'hidden',
        opacity: sceneExitOpacity,
      }}
    >
      {/* Subtle Linear diffuse cool halo */}
      <div
        style={{
          position: 'absolute',
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 1100,
          height: 700,
          background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.05) 0%, rgba(8, 9, 10, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Phase 1: Standalone Centered Intro Interstitial (0 - 70f) ── */}
      <SceneIntroOverlay
        badge="Agentic AI Studio"
        badgeColor="#c084fc"
        title="Prompt-to-slide generation in seconds"
        subtitle="Describe your infrastructure to synthesize resilient cloud architectures"
        startFrame={0}
        durationInFrames={65}
      />

      {/* ── Phase 2: Editor & AI Studio (65f+) ──────────────────────── */}
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
              transform: `scale(${editorScale})`,
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
                  typingStartFrame={115}
                  typingSpeed={1.0}
                  isSubmitted={isSubmitted}
                  stepIndex={stepIndex}
                  isComplete={isComplete}
                />
              }
            >
              {/* Canvas Area */}
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {isGenerated ? (
                  /* Generated Slide 4: Staggered Animated AWS Cloud Architecture */
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

                    {/* Node 1: API Gateway (stagger 1) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 80,
                        top: 220,
                        width: 90,
                        height: 90,
                        zIndex: 10,
                        opacity: node1Spring,
                        transform: `scale(${interpolate(node1Spring, [0, 1], [0.6, 1])})`,
                      }}
                    >
                      <AppShapeElement
                        shape="api-gateway"
                        label="API Gateway"
                      />
                    </div>

                    {/* Node 2: Lambda Compute (stagger 2) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 310,
                        top: 150,
                        width: 90,
                        height: 90,
                        zIndex: 10,
                        opacity: node2Spring,
                        transform: `scale(${interpolate(node2Spring, [0, 1], [0.6, 1])})`,
                      }}
                    >
                      <AppShapeElement
                        shape="lambda"
                        label="Lambda Fn"
                        selected
                      />
                    </div>

                    {/* Node 3: DynamoDB / RDS (stagger 3) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 540,
                        top: 150,
                        width: 90,
                        height: 90,
                        zIndex: 10,
                        opacity: node3Spring,
                        transform: `scale(${interpolate(node3Spring, [0, 1], [0.6, 1])})`,
                      }}
                    >
                      <AppShapeElement
                        shape="database"
                        color="#3b82f6"
                        label="RDS Postgres"
                      />
                    </div>

                    {/* Node 4: S3 Asset Storage (stagger 4) */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 770,
                        top: 280,
                        width: 90,
                        height: 90,
                        zIndex: 10,
                        opacity: node4Spring,
                        transform: `scale(${interpolate(node4Spring, [0, 1], [0.6, 1])})`,
                      }}
                    >
                      <AppShapeElement
                        shape="s3"
                        label="S3 Bucket"
                      />
                    </div>

                    {/* Progressive Connectors */}
                    {frame >= 325 && (
                      <AppLineElement
                        id="conn-api-lambda"
                        p1={{ x: 170, y: 265 }}
                        p2={{ x: 310, y: 195 }}
                        lineType="elbow"
                        style="solid"
                        strokeColor="#60a5fa"
                      />
                    )}

                    {frame >= 340 && (
                      <AppLineElement
                        id="conn-lambda-rds"
                        p1={{ x: 400, y: 195 }}
                        p2={{ x: 540, y: 195 }}
                        lineType="straight"
                        style="solid"
                        strokeColor="#60a5fa"
                      />
                    )}

                    {frame >= 355 && (
                      <AppLineElement
                        id="conn-rds-s3"
                        p1={{ x: 630, y: 195 }}
                        p2={{ x: 770, y: 325 }}
                        lineType="elbow"
                        style="dashed"
                        strokeColor="#a855f7"
                      />
                    )}
                  </div>
                ) : (
                  /* Pre-generation placeholder */
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#71717a',
                    }}
                  >
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: 'rgba(168, 85, 247, 0.1)',
                        border: '1px solid rgba(168, 85, 247, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 12,
                      }}
                    >
                      <Sparkles size={24} color="#c084fc" />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#e4e4e7' }}>
                      AI Design Studio Active
                    </span>
                    <span style={{ fontSize: 11, color: '#a1a1aa', marginTop: 4 }}>
                      Describe your infrastructure architecture to generate slides
                    </span>
                  </div>
                )}
              </div>
            </AppEditorShell>

            {/* Clean macOS cursor inside CameraRig for locked spatial precision */}
            <CursorPointer waypoints={cursorWaypoints} />
          </div>
        </CameraRig>
      )}
    </div>
  );
}
