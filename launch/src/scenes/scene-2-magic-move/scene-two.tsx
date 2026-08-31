import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AppEditorShell } from '../../components/editor-app/app-editor-shell';
import { SlideItem } from '../../components/editor-app/app-slide-panel';
import { AppShapeElement } from '../../components/editor-app/elements/app-shape-element';
import { AppSectionElement } from '../../components/editor-app/elements/app-section-element';
import { AppLineElement } from '../../components/editor-app/elements/app-line-element';
import { CursorPointer } from '../../components/shared/cursor-pointer';
import { CameraRig } from '../../components/shared/camera-rig';
import { CinematicBackground } from '../../components/shared/cinematic-background';
import { SceneIntroOverlay } from '../../components/shared/scene-intro-overlay';
import { SceneTransitionWrapper } from '../../components/shared/scene-transition-wrapper';
import { SPRING_PRESETS } from '../../constants/spring-presets';
import { useAbsoluteFrame } from '../../hooks/use-absolute-frame';

// ─── Scene 2 Art Direction ────────────────────────────────────────────────────
// Badge:    elastic-drop (bounces in from -35px above with glass sheen sweep)
// Text:     masked-rise with hero word "Fluid" scaling 1.75→1.0 from depth
// Handoff:  Vertical Page Scroll Push-Up — text scrolls to -280px as editor
//           scrolls up from +650px with 3D tilt rotateX(10°→0°)

export function SceneTwo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absoluteFrame = useAbsoluteFrame('scene2');

  // ─── Milestones ───────────────────────────────────────────────────────────
  // 0 - 78f   : Standalone Centered Intro Interstitial (+200ms reading time)
  // 78f+      : Editor Workspace Enters with 3D Tilt Scroll-Up Physics
  // 125f      : Click Slide 2 thumbnail (pointer cursor)
  // 125 - 245f: Slide 2 Active (Service Blueprint)
  // 245f      : Click Slide 3 thumbnail (pointer cursor)
  // 245 - 480f: Slide 3 Active (Magic Move FLIP Morphing across canvas)

  const isEditorVisible = frame >= 78;
  const isSlide2Active = frame >= 125;
  const isSlide3Active = frame >= 245;
  const activeSlideIndex = isSlide3Active ? 2 : isSlide2Active ? 1 : 0;

  const slides: SlideItem[] = [
    { id: 's-1', title: 'Welcome', subtitle: 'MotionSlides', layerCount: 2, previewType: 'title' },
    { id: 's-2', title: 'Architecture', subtitle: 'Service Blueprint', layerCount: 7, previewType: 'architecture' },
    { id: 's-3', title: 'Scaled System', subtitle: 'Scalable Architecture', layerCount: 11, previewType: 'scaled' },
    { id: 's-4', title: 'Code Diffs', subtitle: 'Code-Aware Transitions', layerCount: 4, previewType: 'code' },
    { id: 's-5', title: 'Line Morphing', subtitle: 'Dynamic Line Morphing', layerCount: 6, previewType: 'code' },
  ];

  // ─── Editor Window: 3D Tilt Scroll-Up Entrance ───────────────────────────
  // Editor scrolls UP from 650px below with a perspective tilt that settles flat.
  // This is the "Vertical Page Scroll" handoff from the intro text.
  const editorEntrance = spring({
    frame: Math.max(0, frame - 78),
    fps,
    config: { damping: 22, mass: 0.9, stiffness: 140, overshootClamping: true },
  });
  // Y scrolls from +650px up to 0
  const editorTranslateY = interpolate(editorEntrance, [0, 1], [650, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // 3D tilt: starts angled back (10°), settles flat
  const editorRotateX = interpolate(editorEntrance, [0, 1], [10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const editorScale = interpolate(editorEntrance, [0, 1], [0.92, 1]);
  const editorOpacity = interpolate(editorEntrance, [0, 1], [0, 1]);

  // ─── Cursor Waypoints (with contextual cursor state) ──────────────────────
  const cursorWaypoints = [
    { frame: 78, x: 960, y: 540, cursorState: 'default' as const },
    { frame: 104, x: 245, y: 400, cursorState: 'pointer' as const },  // Move to Slide 2 thumbnail
    { frame: 125, x: 245, y: 400, click: true, cursorState: 'pointer' as const }, // Click Slide 2
    { frame: 165, x: 1010, y: 450, cursorState: 'default' as const }, // Inspect Lambda node
    { frame: 220, x: 245, y: 538, cursorState: 'pointer' as const },  // Move to Slide 3 thumbnail
    { frame: 245, x: 245, y: 538, click: true, cursorState: 'pointer' as const }, // Click Slide 3
    { frame: 295, x: 1010, y: 550, cursorState: 'default' as const }, // Glide to RDS node
    { frame: 335, x: 1180, y: 480, cursorState: 'default' as const }, // Glide to S3 node
  ];

  // ─── FLIP Morphing Spring (Slide 2 → Slide 3) ────────────────────────────
  const flipProgress = spring({
    frame: Math.max(0, frame - 245),
    fps,
    config: { ...SPRING_PRESETS.morph, stiffness: 220 },
  });

  const vpcW = interpolate(flipProgress, [0, 1], [420, 700]);
  const vpcH = interpolate(flipProgress, [0, 1], [280, 420]);
  const vpcX = interpolate(flipProgress, [0, 1], [260, 240]);
  const vpcY = interpolate(flipProgress, [0, 1], [70, 80]);
  const serverX = interpolate(flipProgress, [0, 1], [320, 300]);
  const serverY = interpolate(flipProgress, [0, 1], [120, 220]);
  const dbX = interpolate(flipProgress, [0, 1], [740, 520]);
  const dbY = interpolate(flipProgress, [0, 1], [220, 345]);
  const lambdaX = interpolate(flipProgress, [0, 1], [530, 520]);
  const lambdaY = interpolate(flipProgress, [0, 1], [120, 120]);

  // New nodes pop in with physical spring
  const rdsSpring = spring({ frame: Math.max(0, frame - 265), fps, config: SPRING_PRESETS.pop });
  const rdsOpacity = interpolate(rdsSpring, [0, 1], [0, 1]);
  const rdsScale = interpolate(rdsSpring, [0, 1], [0.75, 1]);

  const s3Spring = spring({ frame: Math.max(0, frame - 285), fps, config: SPRING_PRESETS.pop });
  const s3Opacity = interpolate(s3Spring, [0, 1], [0, 1]);
  const s3Scale = interpolate(s3Spring, [0, 1], [0.75, 1]);

  const slide2Entrance = spring({
    frame: Math.max(0, frame - 125),
    fps,
    config: { damping: 22, mass: 0.85, stiffness: 200, overshootClamping: true },
  });

  // Scene exit — dolly push into Scene 3 (crisp transition after S3 inspection)
  const exitStartFrame = 360;

  return (
    <SceneTransitionWrapper
      entryStartFrame={0}
      exitStartFrame={exitStartFrame}
      exitDurationFrames={20}
    >
      <CinematicBackground absoluteFrame={absoluteFrame}>
        {/* Phase 1: Intro Interstitial (0 - 78f) — elastic-drop badge + cascade-slide-right text (+200ms) */}
        <SceneIntroOverlay
          badge="Magic Move FLIP"
          badgeColor="#3b82f6"
          title="Fluid FLIP transitions across your architecture"
          subtitle="Nodes, sections, and connectors morph with physical identity"
          startFrame={0}
          durationInFrames={78}
          textVariant="cascade-slide-right"
          badgeVariant="elastic-drop"
          exitVariant="scroll-up"
        />

        {/* Phase 2: Editor — 3D Tilt Scroll-Up from +650px below viewport */}
        {isEditorVisible && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: editorOpacity,
              // 3D tilt scroll-up: perspective wraps the tilt, translateY scrolls up from below
              perspective: '1200px',
              perspectiveOrigin: '50% 120%',
            }}
          >
            <div
              style={{
                transform: `translateY(${editorTranslateY}px) rotateX(${editorRotateX}deg) scale(${editorScale})`,
                transformOrigin: '50% 100%',
                willChange: 'transform',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
            <AppEditorShell
              projectName="Distributed Architecture Deck"
              slides={slides}
              activeSlideIndex={activeSlideIndex}
              inspectorElementLabel={
                isSlide3Active
                  ? 'Section · VPC Core Network'
                  : isSlide2Active
                  ? 'Shape · AWS Lambda'
                  : 'Text · Slide Title'
              }
              inspectorMotionId={
                isSlide3Active ? 'section-boundary' : isSlide2Active ? 'lambda-node' : 'hero-text'
              }
              inspectorProps={
                isSlide3Active
                  ? [
                      { name: 'Label', value: 'AWS VPC Core Network' },
                      { name: 'Width', value: `${Math.round(vpcW)}px` },
                      { name: 'Height', value: `${Math.round(vpcH)}px` },
                      { name: 'Border', value: 'Dashed (White 10%)' },
                      { name: 'Corner Radius', value: '16px' },
                    ]
                  : isSlide2Active
                  ? [
                      { name: 'Component', value: 'AWS Compute' },
                      { name: 'X', value: '530px' },
                      { name: 'Y', value: '120px' },
                      { name: 'Width', value: '90px' },
                      { name: 'Height', value: '90px' },
                      { name: 'Runtime', value: 'Node.js 22' },
                    ]
                  : [
                      { name: 'Font', value: 'DM Serif Display' },
                      { name: 'Size', value: '54px' },
                      { name: 'Color', value: '#ffffff' },
                      { name: 'Opacity', value: '100%' },
                      { name: 'Alignment', value: 'Center' },
                    ]
              }
            >
              {/* Canvas Slide Viewport */}
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {!isSlide2Active ? (
                  /* Slide 1: Welcome */
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      padding: 40,
                      boxSizing: 'border-box',
                    }}
                  >
                    <h1
                      style={{
                        fontFamily: '"DM Serif Display", Georgia, serif',
                        fontStyle: 'italic',
                        fontSize: 54,
                        fontWeight: 400,
                        color: '#ffffff',
                        letterSpacing: '-0.02em',
                        margin: 0,
                        lineHeight: 1.1,
                      }}
                    >
                      MotionSlides
                    </h1>
                    <p
                      style={{
                        fontFamily: 'Inter, system-ui, sans-serif',
                        fontSize: 18,
                        color: '#a1a1aa',
                        marginTop: 14,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      Magic Move &amp; Architecture Diagrams in the Browser
                    </p>
                  </div>
                ) : (
                  /* Slide 2 & 3: Live Service Blueprint with Magic Move FLIP */
                  <div style={{ position: 'relative', width: '100%', height: '100%', opacity: slide2Entrance }}>
                    {/* Interpolating VPC Section Boundary */}
                    <div style={{ position: 'absolute', left: vpcX, top: vpcY, zIndex: 1 }}>
                      <AppSectionElement
                        label={isSlide3Active ? 'AWS VPC Core Network' : 'AWS VPC Subnet'}
                        width={vpcW}
                        height={vpcH}
                      />
                    </div>

                    {/* Client App Node */}
                    <div style={{ position: 'absolute', left: 100, top: 220, width: 90, height: 90, zIndex: 10 }}>
                      <AppShapeElement shape="circle" color="#3b82f6" label="Client App" />
                    </div>

                    {/* App Server / EC2 Node */}
                    <div style={{ position: 'absolute', left: serverX, top: serverY, width: 90, height: 90, zIndex: 10 }}>
                      <AppShapeElement
                        shape="server"
                        color="#3b82f6"
                        label={isSlide3Active ? 'App Server' : 'EC2 Server'}
                      />
                    </div>

                    {/* Lambda Node */}
                    <div style={{ position: 'absolute', left: lambdaX, top: lambdaY, width: 90, height: 90, zIndex: 10 }}>
                      <AppShapeElement shape="lambda" label="Lambda Fn" selected={!isSlide3Active} />
                    </div>

                    {/* DB / Cache Node */}
                    <div style={{ position: 'absolute', left: dbX, top: dbY, width: 90, height: 90, zIndex: 10 }}>
                      <AppShapeElement
                        shape="database"
                        color="#3b82f6"
                        label={isSlide3Active ? 'Local Cache' : 'Main DB'}
                      />
                    </div>

                    {/* RDS Node — pops in on Slide 3 */}
                    {isSlide3Active && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 740,
                          top: 345,
                          width: 90,
                          height: 90,
                          zIndex: 10,
                          opacity: rdsOpacity,
                          transform: `scale(${rdsScale})`,
                        }}
                      >
                        <AppShapeElement shape="rds" label="AWS RDS" />
                      </div>
                    )}

                    {/* S3 Node — pops in on Slide 3 */}
                    {isSlide3Active && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 820,
                          top: 230,
                          width: 90,
                          height: 90,
                          zIndex: 10,
                          opacity: s3Opacity,
                          transform: `scale(${s3Scale})`,
                        }}
                      >
                        <AppShapeElement shape="s3" label="S3 Store" />
                      </div>
                    )}

                    {/* Dynamic Connectors */}
                    {/* conn-client-server: hardcoded per-slide final positions — never follows the FLIP spring.
                        Path length is constant within each slide → no dash-flicker.
                        Slide 2: EC2 Server left-center = (320, 165)  → elbow down from client (190,265)
                        Slide 3: App Server left-center = (300, 265)  → straight across from client (190,265) */}
                    <AppLineElement
                      id="conn-client-server"
                      p1={{ x: 190, y: 265 }}
                      p2={isSlide3Active ? { x: 300, y: 265 } : { x: 320, y: 165 }}
                      lineType={isSlide3Active ? 'straight' : 'elbow'}
                      style="dashed"
                      startHandle="right"
                      endHandle="left"
                    />
                    <AppLineElement
                      id="conn-server-lambda"
                      p1={{ x: serverX + (isSlide3Active ? 45 : 90), y: serverY + (isSlide3Active ? 0 : 45) }}
                      p2={{ x: lambdaX, y: lambdaY + 45 }}
                      lineType={isSlide3Active ? 'elbow' : 'straight'}
                      style="solid"
                      startHandle={isSlide3Active ? 'top' : 'right'}
                      endHandle="left"
                    />

                    {/* Slide 2: Lambda -> Main DB connector */}
                    {!isSlide3Active && (
                      <AppLineElement
                        id="conn-lambda-db"
                        p1={{ x: lambdaX + 90, y: lambdaY + 45 }}
                        p2={{ x: dbX, y: dbY + 45 }}
                        lineType="elbow"
                        style="dashed"
                        startHandle="right"
                        endHandle="left"
                      />
                    )}

                    {/* Slide 3: Server -> Local Cache connector */}
                    {isSlide3Active && (
                      <AppLineElement
                        id="conn-server-db"
                        p1={{ x: serverX + 45, y: serverY + 90 }}
                        p2={{ x: dbX, y: dbY + 45 }}
                        lineType="elbow"
                        style="solid"
                        startHandle="bottom"
                        endHandle="left"
                      />
                    )}

                    {/* Slide 3: Lambda -> RDS and RDS -> S3 connectors */}
                    {isSlide3Active && (
                      <>
                        <AppLineElement
                          id="conn-lambda-rds"
                          p1={{ x: lambdaX + 90, y: lambdaY + 45 }}
                          p2={{ x: 740, y: 390 }}
                          lineType="elbow"
                          style="solid"
                          startHandle="right"
                          endHandle="left"
                        />
                        <AppLineElement
                          id="conn-rds-s3"
                          p1={{ x: 785, y: 345 }}
                          p2={{ x: 865, y: 320 }}
                          lineType="elbow"
                          style="dashed"
                          startHandle="top"
                          endHandle="bottom"
                        />
                      </>
                    )}

                    {/* Slide 2: Bottom bypass Client App -> Main DB connector */}
                    {!isSlide3Active && (
                      <AppLineElement
                        id="conn-client-db"
                        p1={{ x: 145, y: 310 }}
                        p2={{ x: 785, y: 310 }}
                        lineType="elbow"
                        style="solid"
                        startHandle="bottom"
                        endHandle="bottom"
                      />
                    )}
                  </div>
                )}
              </div>
            </AppEditorShell>

            </div>{/* end 3D tilt scroll-up inner wrapper */}
            <CursorPointer waypoints={cursorWaypoints} />
          </div>
        )}
      </CinematicBackground>
    </SceneTransitionWrapper>
  );
}
