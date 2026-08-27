import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AppEditorShell } from '../../components/editor-app/app-editor-shell';
import { SlideItem } from '../../components/editor-app/app-slide-panel';
import { AppShapeElement } from '../../components/editor-app/elements/app-shape-element';
import { AppSectionElement } from '../../components/editor-app/elements/app-section-element';
import { AppLineElement } from '../../components/editor-app/elements/app-line-element';
import { CursorPointer } from '../../components/shared/cursor-pointer';
import { CameraRig } from '../../components/shared/camera-rig';
import { SceneIntroOverlay } from '../../components/shared/scene-intro-overlay';
import { SPRING_PRESETS } from '../../constants/spring-presets';

export function SceneTwo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ─── Milestones: ─────────────────────────────────────────────────
  // 0 - 70f   : Standalone Centered Intro Interstitial
  // 65f+      : Editor Workspace Enters with Spring Physics
  // 120f      : Click Slide 2 thumbnail (x: 245, y: 400)
  // 120 - 245f: Slide 2 Active (Service Blueprint)
  // 245f      : Click Slide 3 thumbnail (x: 245, y: 538)
  // 245 - 480f: Slide 3 Active (Magic Move FLIP Morphing across canvas)

  const isEditorVisible = frame >= 65;
  const isSlide2Active = frame >= 120;
  const isSlide3Active = frame >= 245;
  const activeSlideIndex = isSlide3Active ? 2 : isSlide2Active ? 1 : 0;

  const slides: SlideItem[] = [
    { id: 's-1', title: 'Welcome', subtitle: 'MotionSlides', layerCount: 2, previewType: 'title' },
    { id: 's-2', title: 'Architecture', subtitle: 'Service Blueprint', layerCount: 7, previewType: 'architecture' },
    { id: 's-3', title: 'Scaled System', subtitle: 'Scalable Architecture', layerCount: 11, previewType: 'scaled' },
    { id: 's-4', title: 'Code Diffs', subtitle: 'Code-Aware Transitions', layerCount: 4, previewType: 'code' },
    { id: 's-5', title: 'Line Morphing', subtitle: 'Dynamic Line Morphing', layerCount: 6, previewType: 'code' },
  ];

  // ─── Editor Window Spring Entrance (enters at frame 65) ──────────
  const editorEntrance = spring({
    frame: Math.max(0, frame - 65),
    fps,
    config: { damping: 20, mass: 0.85, stiffness: 150 },
  });
  const editorScale = interpolate(editorEntrance, [0, 1], [0.94, 1]);
  const editorOpacity = interpolate(editorEntrance, [0, 1], [0, 1]);

  // ─── Cursor Waypoints (Active once editor is visible) ────────────
  const cursorWaypoints = [
    { frame: 65, x: 960, y: 540 },
    { frame: 95, x: 245, y: 400 }, // Move to Slide 2 thumbnail
    { frame: 120, x: 245, y: 400, click: true }, // Click Slide 2
    { frame: 160, x: 1010, y: 450 }, // Inspect Lambda node on canvas
    { frame: 220, x: 245, y: 538 }, // Move down to Slide 3 thumbnail
    { frame: 245, x: 245, y: 538, click: true }, // Click Slide 3
    { frame: 295, x: 1010, y: 550 }, // Glide to RDS node
    { frame: 370, x: 1180, y: 480 }, // Glide to S3 node
  ];

  // ─── FLIP Morphing Spring (Slide 2 -> Slide 3) ───────────────────
  const flipProgress = spring({
    frame: Math.max(0, frame - 245),
    fps,
    config: {
      damping: 20,
      mass: 0.75,
      stiffness: 220,
      overshootClamping: false,
    },
  });

  // Dynamic FLIP Coordinates
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

  // Scaled new nodes (RDS & S3) spring entrances
  const rdsSpring = spring({
    frame: Math.max(0, frame - 265),
    fps,
    config: SPRING_PRESETS.snappy,
  });
  const rdsOpacity = interpolate(rdsSpring, [0, 1], [0, 1]);
  const rdsScale = interpolate(rdsSpring, [0, 1], [0.75, 1]);

  const s3Spring = spring({
    frame: Math.max(0, frame - 285),
    fps,
    config: SPRING_PRESETS.snappy,
  });
  const s3Opacity = interpolate(s3Spring, [0, 1], [0, 1]);
  const s3Scale = interpolate(s3Spring, [0, 1], [0.75, 1]);

  // Slide 2 initial entrance spring
  const slide2Entrance = spring({
    frame: Math.max(0, frame - 120),
    fps,
    config: { damping: 20, mass: 0.8, stiffness: 220 },
  });

  const sceneExitOpacity = interpolate(frame, [455, 480], [1, 0], {
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
        badge="Magic Move FLIP"
        badgeColor="#3b82f6"
        title="Fluid FLIP transitions across your architecture"
        subtitle="Nodes, sections, and connectors morph with physical identity"
        startFrame={0}
        durationInFrames={65}
      />

      {/* ── Phase 2: Editor Presentation Studio (65f+) ──────────────── */}
      {isEditorVisible && (
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
                /* Slide 2 & 3: Live Service Blueprint with Magic Move FLIP Morphing */
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
                    <AppShapeElement
                      shape="lambda"
                      label="Lambda Fn"
                      selected={!isSlide3Active}
                    />
                  </div>

                  {/* DB / Cache Node */}
                  <div style={{ position: 'absolute', left: dbX, top: dbY, width: 90, height: 90, zIndex: 10 }}>
                    <AppShapeElement
                      shape="database"
                      color="#3b82f6"
                      label={isSlide3Active ? 'Local Cache' : 'Main DB'}
                    />
                  </div>

                  {/* RDS Node (Pops in on Slide 3) */}
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
                      <AppShapeElement
                        shape="database"
                        color="#3b82f6"
                        label="AWS RDS"
                      />
                    </div>
                  )}

                  {/* S3 Node (Pops in on Slide 3) */}
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
                      <AppShapeElement
                        shape="s3"
                        label="S3 Store"
                      />
                    </div>
                  )}

                  {/* Clean Dynamic Connectors */}
                  <AppLineElement
                    id="conn-client-server"
                    p1={{ x: 190, y: 265 }}
                    p2={{ x: serverX, y: serverY + 45 }}
                    lineType="elbow"
                    style="dashed"
                    startHandle="right"
                    endHandle="left"
                  />

                  <AppLineElement
                    id="conn-server-lambda"
                    p1={{
                      x: serverX + (isSlide3Active ? 45 : 90),
                      y: serverY + (isSlide3Active ? 0 : 45),
                    }}
                    p2={{ x: lambdaX, y: lambdaY + 45 }}
                    lineType={isSlide3Active ? 'elbow' : 'straight'}
                    style="solid"
                    startHandle={isSlide3Active ? 'top' : 'right'}
                    endHandle="left"
                  />

                  <AppLineElement
                    id="conn-server-db"
                    p1={{
                      x: isSlide3Active ? serverX + 45 : lambdaX + 90,
                      y: isSlide3Active ? serverY + 90 : lambdaY + 45,
                    }}
                    p2={{ x: dbX, y: dbY + 45 }}
                    lineType="elbow"
                    style={isSlide3Active ? 'solid' : 'dashed'}
                    startHandle={isSlide3Active ? 'bottom' : 'right'}
                    endHandle="left"
                  />

                  {/* Extra Slide 3 Connectors */}
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

          {/* Clean macOS cursor inside editor frame */}
          <CursorPointer waypoints={cursorWaypoints} />
        </div>
      )}
    </div>
  );
}
