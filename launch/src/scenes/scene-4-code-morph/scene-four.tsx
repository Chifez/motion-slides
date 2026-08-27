import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AppEditorShell } from '../../components/editor-app/app-editor-shell';
import { SlideItem } from '../../components/editor-app/app-slide-panel';
import { AppCodeElement, CodeLine } from '../../components/editor-app/elements/app-code-element';
import { CameraRig } from '../../components/shared/camera-rig';
import { CursorPointer } from '../../components/shared/cursor-pointer';
import { SceneIntroOverlay } from '../../components/shared/scene-intro-overlay';
import { SPRING_PRESETS } from '../../constants/spring-presets';

export function SceneFour() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // ─── Milestones: ─────────────────────────────────────────────────
  // 0 - 70f   : Standalone Centered Intro Interstitial
  // 65f+      : Editor Workspace Enters with Spring Physics
  // 100f      : Click Slide 5 thumbnail (x: 245, y: 814)
  // 115f+     : Smooth Shiki LCS Code Morphing & Spring Height Expansion
  // 370f      : Exit fade

  const isEditorVisible = frame >= 65;
  const isMorphActive = frame >= 115;

  const morphSpring = spring({
    frame: Math.max(0, frame - 115),
    fps,
    config: {
      damping: 20,
      mass: 0.8,
      stiffness: 180,
    },
  });

  const slides: SlideItem[] = [
    { id: 's-1', title: 'Welcome', subtitle: 'MotionSlides', layerCount: 2, previewType: 'title' },
    { id: 's-2', title: 'Architecture', subtitle: 'Service Blueprint', layerCount: 7, previewType: 'architecture' },
    { id: 's-3', title: 'Scaled System', subtitle: 'Scalable Architecture', layerCount: 11, previewType: 'scaled' },
    { id: 's-4', title: 'Code Diffs', subtitle: 'Code-Aware Transitions', layerCount: 4, previewType: 'code' },
    { id: 's-5', title: 'Line Morphing', subtitle: 'Dynamic Line Morphing', layerCount: 6, previewType: 'code' },
  ];

  // Full set of code lines (with added flags)
  const codeLines: CodeLine[] = [
    { key: 'fn-def', text: 'function renderCanvas() {', type: 'keyword', status: 'unchanged' },
    { key: 'const-stage', text: '  const stage = getStage();', type: 'variable', status: 'unchanged' },
    { key: 'comment-line', text: '  // Magic Move resolves transitions', type: 'comment', status: 'added' },
    { key: 'anim-stage', text: '  stage.animate();', type: 'expression', status: 'unchanged' },
    { key: 'log-line', text: "  logState('rendered');", type: 'expression', status: 'added' },
    { key: 'fn-end', text: '}', type: 'keyword', status: 'unchanged' },
  ];

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
    { startFrame: 0, scale: 1, originX: '50%', originY: '50%' },
    { startFrame: 75, scale: 1.15, originX: '15%', originY: '75%' }, // Zoom on Slide 5 thumbnail
    {
      startFrame: 110,
      scale: 1.32,
      originX: '50%',
      originY: '50%',
      springConfig: { damping: 20, mass: 0.85, stiffness: 140 },
    }, // Zoom tight into code block
    {
      startFrame: 300,
      scale: 1,
      originX: '50%',
      originY: '50%',
      springConfig: { damping: 28, mass: 1.2, stiffness: 70 },
    }, // Zoom back out
  ];

  // ─── Cursor Waypoints (Active once editor is visible) ────────────
  const cursorWaypoints = [
    { frame: 65, x: 800, y: 450 },
    { frame: 85, x: 245, y: 814 }, // Move directly to Slide 5 thumbnail
    { frame: 100, x: 245, y: 814, click: true }, // Click Slide 5
    { frame: 135, x: 960, y: 520 }, // Move to code block center
    { frame: 280, x: 1050, y: 520 },
  ];

  const sceneExitOpacity = interpolate(frame, [345, 370], [1, 0], {
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
          background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.045) 0%, rgba(8, 9, 10, 0) 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Phase 1: Standalone Centered Intro Interstitial (0 - 70f) ── */}
      <SceneIntroOverlay
        badge="Shiki Code Morphing"
        badgeColor="#60a5fa"
        title="Smooth Magic morph for your code"
        subtitle="Line-level LCS diffing with syntax-aware transitions"
        startFrame={0}
        durationInFrames={65}
      />

      {/* ── Phase 2: Editor & Code Diffing (65f+) ───────────────────── */}
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
              activeSlideIndex={isMorphActive ? 4 : 3}
              inspectorElementLabel="Code Block · TypeScript"
              inspectorMotionId="canvas-code-block"
              inspectorProps={[
                { name: 'Language', value: 'TypeScript' },
                { name: 'Theme', value: 'One Dark Pro' },
                { name: 'Lines', value: isMorphActive ? '6 (+2 added)' : '4 lines' },
                { name: 'Diff Mode', value: 'Shiki LCS Diff' },
                { name: 'Width', value: '560px' },
                { name: 'Height', value: '300px' },
              ]}
            >
              {/* Canvas Area: Centered Code Block with Smooth Morphing */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AppCodeElement
                  lines={codeLines}
                  language="typescript"
                  morphProgress={morphSpring}
                  width={560}
                  height={300}
                />
              </div>
            </AppEditorShell>
          </div>

          {/* Clean macOS cursor inside CameraRig */}
          <CursorPointer waypoints={cursorWaypoints} />
        </CameraRig>
      )}
    </div>
  );
}
