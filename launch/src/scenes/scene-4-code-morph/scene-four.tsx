import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { AppEditorShell } from '../../components/editor-app/app-editor-shell';
import { SlideItem } from '../../components/editor-app/app-slide-panel';
import { AppCodeElement, CodeLine } from '../../components/editor-app/elements/app-code-element';
import { CameraRig } from '../../components/shared/camera-rig';
import { CursorPointer } from '../../components/shared/cursor-pointer';
import { CinematicBackground } from '../../components/shared/cinematic-background';
import { SceneIntroOverlay } from '../../components/shared/scene-intro-overlay';
import { SceneTransitionWrapper } from '../../components/shared/scene-transition-wrapper';
import { SPRING_PRESETS } from '../../constants/spring-presets';
import { useAbsoluteFrame } from '../../hooks/use-absolute-frame';

// ─── Scene 3 Art Direction ────────────────────────────────────────────────────
// Badge:    terminal-brackets ([ SHIKI CODE MORPHING ] expands horizontally)
// Text:     horizon-flip (rotateX -60°→0°, translateY 40px→0) with cyan scanline
// Handoff:  depth-zoom exit (text expands past camera lens)
//           Editor enters from horizon: translateY(100px→0) + scale(0.88→1.0)

export function SceneFour() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absoluteFrame = useAbsoluteFrame('scene3');

  // ─── Milestones ───────────────────────────────────────────────────────────
  // 0 - 78f   : Standalone Centered Intro Interstitial (+200ms reading time)
  // 78f+      : Editor Workspace Enters with Horizon Rise Physics
  // 108f      : Click Slide 5 thumbnail (pointer cursor)
  // 120f+     : Smooth Shiki LCS Code Morphing & Spring Height Expansion
  // 350f      : Exit dolly

  const isEditorVisible = frame >= 78;
  const isMorphActive = frame >= 120;

  const morphSpring = spring({
    frame: Math.max(0, frame - 120),
    fps,
    config: SPRING_PRESETS.morph,
  });

  const slides: SlideItem[] = [
    { id: 's-1', title: 'Welcome', subtitle: 'MotionSlides', layerCount: 2, previewType: 'title' },
    { id: 's-2', title: 'Architecture', subtitle: 'Service Blueprint', layerCount: 7, previewType: 'architecture' },
    { id: 's-3', title: 'Scaled System', subtitle: 'Scalable Architecture', layerCount: 11, previewType: 'scaled' },
    { id: 's-4', title: 'Code Diffs', subtitle: 'Code-Aware Transitions', layerCount: 4, previewType: 'code' },
    { id: 's-5', title: 'Line Morphing', subtitle: 'Dynamic Line Morphing', layerCount: 6, previewType: 'code' },
  ];

  const codeLines: CodeLine[] = [
    { key: 'fn-def', text: 'function renderCanvas() {', type: 'keyword', status: 'unchanged' },
    { key: 'const-stage', text: '  const stage = getStage();', type: 'variable', status: 'unchanged' },
    { key: 'comment-line', text: '  // Magic Move resolves transitions', type: 'comment', status: 'added' },
    { key: 'anim-stage', text: '  stage.animate();', type: 'expression', status: 'unchanged' },
    { key: 'log-line', text: "  logState('rendered');", type: 'expression', status: 'added' },
    { key: 'fn-end', text: '}', type: 'keyword', status: 'unchanged' },
  ];

  // ─── Editor Entrance: Horizon Zoom-In ────────────────────────────────────
  // Editor rises from the horizon line (translateY 100px → 0) + zooms into focus (scale 0.88 → 1.0)
  const editorEntrance = spring({
    frame: Math.max(0, frame - 78),
    fps,
    config: { damping: 22, mass: 0.9, stiffness: 140, overshootClamping: true },
  });
  const editorTranslateY = interpolate(editorEntrance, [0, 1], [100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const editorScale = interpolate(editorEntrance, [0, 1], [0.88, 1]);
  const editorOpacity = interpolate(editorEntrance, [0, 1], [0, 1]);

  // ─── Camera Zoom Keyframes (Gentle, balanced focus) ──────────────────────
  const cameraKeyframes = [
    { startFrame: 0, scale: 1.0, originX: '50%', originY: '50%' },
    { startFrame: 85, scale: 1.06, originX: '20%', originY: '70%' }, // Subtle focus toward Slide 5 thumbnail
    { startFrame: 118, scale: 1.12, originX: '50%', originY: '50%', springConfig: SPRING_PRESETS.camera }, // Gentle focus on code block (holds through scene exit)
  ];

  // ─── Cursor Waypoints ─────────────────────────────────────────────────────
  const cursorWaypoints = [
    { frame: 78, x: 800, y: 450, cursorState: 'default' as const },
    { frame: 94, x: 245, y: 814, cursorState: 'pointer' as const },   // Move to Slide 5 thumbnail
    { frame: 108, x: 245, y: 814, click: true, cursorState: 'pointer' as const }, // Click Slide 5
    { frame: 140, x: 960, y: 520, cursorState: 'default' as const },  // Move to code block center
    { frame: 280, x: 1050, y: 520, cursorState: 'default' as const },
  ];

  // Scene exit
  const exitStartFrame = 350;

  return (
    <SceneTransitionWrapper
      entryStartFrame={0}
      exitStartFrame={exitStartFrame}
      exitDurationFrames={20}
    >
      <CinematicBackground absoluteFrame={absoluteFrame}>
        {/* Phase 1: Intro Interstitial (0 - 78f) — terminal-brackets badge + horizon-flip text (+200ms) */}
        <SceneIntroOverlay
          badge="Shiki Code Morphing"
          badgeColor="#60a5fa"
          title="Smooth Magic morph for your code"
          subtitle="Line-level LCS diffing with syntax-aware transitions"
          startFrame={0}
          durationInFrames={78}
          textVariant="horizon-flip"
          badgeVariant="terminal-brackets"
          exitVariant="depth-zoom"
        />

        {/* Phase 2: Editor — Horizon Zoom-In from 100px below */}
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
                transform: `translateY(${editorTranslateY}px) scale(${editorScale})`,
                willChange: 'transform',
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
                {/* Canvas Area: Centered Code Block */}
                <div
                  style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
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

            <CursorPointer waypoints={cursorWaypoints} />
          </CameraRig>
        )}
      </CinematicBackground>
    </SceneTransitionWrapper>
  );
}
