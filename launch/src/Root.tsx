import React from 'react';
import { Composition, Folder, Series } from 'remotion';
import { VIDEO_CONFIG, SCENE_TIMINGS } from './constants/timing';

// Scenes — 5 sequential chapters across 33.66 seconds at 60 FPS
import { SceneOne } from './scenes/scene-1-hook/scene-one';
import { SceneTwo } from './scenes/scene-2-magic-move/scene-two';
import { SceneThree } from './scenes/scene-3-ai-studio/scene-three';
import { SceneFour } from './scenes/scene-4-code-morph/scene-four';
import { SceneFive } from './scenes/scene-5-export-outro/scene-five';
import { SoundController } from './audio/SoundController';

export function MasterLaunchVideo() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#08090a' }}>
      <SoundController />
      <Series>
        {/* Scene 1: Kinetic Problem Hook & Brand Reveal (0s – 4.5s / 0–270f) */}
        <Series.Sequence durationInFrames={SCENE_TIMINGS.scene1.durationInFrames}>
          <SceneOne />
        </Series.Sequence>

        {/* Scene 2: Unified Presentation Studio & Magic Move FLIP (4.5s – 12.5s / 270–750f) */}
        <Series.Sequence durationInFrames={SCENE_TIMINGS.scene2.durationInFrames}>
          <SceneTwo />
        </Series.Sequence>

        {/* Scene 3: Shiki Code LCS Diffing & Morphing (12.5s – 18.66s / 750–1120f) */}
        <Series.Sequence durationInFrames={SCENE_TIMINGS.scene3.durationInFrames}>
          <SceneFour />
        </Series.Sequence>

        {/* Scene 4: Agentic AI Design Studio & Architecture Generation (18.66s – 27.16s / 1120–1630f) */}
        <Series.Sequence durationInFrames={SCENE_TIMINGS.scene4.durationInFrames}>
          <SceneThree />
        </Series.Sequence>

        {/* Scene 5: Deterministic 4K Export Studio & Brand Outro (27.16s – 33.66s / 1630–2020f) */}
        <Series.Sequence durationInFrames={SCENE_TIMINGS.scene5.durationInFrames}>
          <SceneFive />
        </Series.Sequence>
      </Series>
    </div>
  );
}

export function Root() {
  return (
    <>
      {/* Master 33.66-Second 60FPS Launch Video */}
      <Composition
        id="MotionSlidesLaunch"
        component={MasterLaunchVideo}
        durationInFrames={VIDEO_CONFIG.totalFrames}
        fps={VIDEO_CONFIG.fps}
        width={VIDEO_CONFIG.width}
        height={VIDEO_CONFIG.height}
      />

      {/* Individual Scene Compositions for Isolated Editing & Review */}
      <Folder name="Individual-Scenes">
        <Composition
          id="Scene1Hook"
          component={SceneOne}
          durationInFrames={SCENE_TIMINGS.scene1.durationInFrames}
          fps={VIDEO_CONFIG.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Scene2MagicMoveStudio"
          component={SceneTwo}
          durationInFrames={SCENE_TIMINGS.scene2.durationInFrames}
          fps={VIDEO_CONFIG.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Scene3CodeMorph"
          component={SceneFour}
          durationInFrames={SCENE_TIMINGS.scene3.durationInFrames}
          fps={VIDEO_CONFIG.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Scene4AiStudio"
          component={SceneThree}
          durationInFrames={SCENE_TIMINGS.scene4.durationInFrames}
          fps={VIDEO_CONFIG.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Scene5ExportOutro"
          component={SceneFive}
          durationInFrames={SCENE_TIMINGS.scene5.durationInFrames}
          fps={VIDEO_CONFIG.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
      </Folder>
    </>
  );
}
