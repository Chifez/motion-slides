import React from 'react';
import { Composition, Folder, Series } from 'remotion';
import { VIDEO_CONFIG, SCENE_TIMINGS } from './constants/timing';

// Clean sequential scenes 1 to 5
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
        {/* Scene 1: Kinetic Problem Hook & Brand Reveal (0s - 4.5s) */}
        <Series.Sequence durationInFrames={SCENE_TIMINGS.scene1.durationInFrames}>
          <SceneOne />
        </Series.Sequence>

        {/* Scene 2: Unified Presentation Studio & Magic Move FLIP (4.5s - 11.5s) */}
        <Series.Sequence durationInFrames={SCENE_TIMINGS.scene2.durationInFrames}>
          <SceneTwo />
        </Series.Sequence>

        {/* Scene 3: Agentic AI Design Studio & Architecture Generation (11.5s - 19s) */}
        <Series.Sequence durationInFrames={SCENE_TIMINGS.scene3.durationInFrames}>
          <SceneThree />
        </Series.Sequence>

        {/* Scene 4: Shiki Code LCS Diffing & Morphing (19s - 24s) */}
        <Series.Sequence durationInFrames={SCENE_TIMINGS.scene4.durationInFrames}>
          <SceneFour />
        </Series.Sequence>

        {/* Scene 5: Deterministic 4K Export Studio & Brand Outro (24s - 30.5s) */}
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
      {/* Master 30.5-Second 60FPS Launch Video */}
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
          id="Scene3AiStudio"
          component={SceneThree}
          durationInFrames={SCENE_TIMINGS.scene3.durationInFrames}
          fps={VIDEO_CONFIG.fps}
          width={VIDEO_CONFIG.width}
          height={VIDEO_CONFIG.height}
        />
        <Composition
          id="Scene4CodeMorph"
          component={SceneFour}
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
