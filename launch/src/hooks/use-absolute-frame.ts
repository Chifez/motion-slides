import { useCurrentFrame } from 'remotion';
import { SCENE_TIMINGS } from '../constants/timing';

type SceneKey = keyof typeof SCENE_TIMINGS;

/**
 * Returns the absolute global frame within the master 33.66s (2,020 frame) timeline.
 *
 * Remotion's <Series.Sequence> resets useCurrentFrame() to 0 inside each child scene.
 * This hook corrects that by adding the scene's startFrame offset, so that
 * continuous cross-scene effects (ambient halo color morph, noise2D drift, transition vectors)
 * are computed on an uninterrupted global timeline rather than resetting at every scene cut.
 *
 * Usage:
 *   const absoluteFrame = useAbsoluteFrame('scene2');
 *   // absoluteFrame will count from 270 onward, not from 0
 */
export function useAbsoluteFrame(scene: SceneKey): number {
  const localFrame = useCurrentFrame();
  return SCENE_TIMINGS[scene].startFrame + localFrame;
}
