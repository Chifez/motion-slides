import React from 'react';
import { Audio, staticFile, Sequence } from 'remotion';

export interface SoundCue {
  frame: number;
  file: string;
  volume: number;
}

// Frame-aligned sound cues across the 2,020-frame cut (60 FPS / ~33.6s)
export const SFX_CUES: SoundCue[] = [
  // ─── Scene 1: Hook & Brand Reveal (0 - 270f) ──────────────────
  { frame: 5, file: 'audio/bass_drop.wav', volume: 0.65 },
  { frame: 60, file: 'audio/whoosh.wav', volume: 0.4 },
  { frame: 130, file: 'audio/bass_drop.wav', volume: 0.8 },

  // ─── Scene 2: Intro Interstitial & Magic Move (270 - 750f) ─────
  { frame: 270, file: 'audio/whoosh.wav', volume: 0.35 }, // Intro text
  { frame: 335, file: 'audio/whoosh.wav', volume: 0.3 },  // Editor shell enters
  { frame: 390, file: 'audio/click.wav', volume: 0.6 },   // Slide 2 click
  { frame: 515, file: 'audio/click.wav', volume: 0.6 },   // Slide 3 click
  { frame: 520, file: 'audio/whoosh.wav', volume: 0.45 }, // FLIP morph

  // ─── Scene 3: Intro Interstitial & AI Studio (750 - 1260f) ────
  { frame: 750, file: 'audio/whoosh.wav', volume: 0.35 }, // Intro text
  { frame: 815, file: 'audio/whoosh.wav', volume: 0.3 },  // Editor shell enters
  { frame: 850, file: 'audio/click.wav', volume: 0.7 },   // Ask AI click
  { frame: 868, file: 'audio/keystroke.wav', volume: 0.3 },
  { frame: 880, file: 'audio/keystroke.wav', volume: 0.3 },
  { frame: 895, file: 'audio/keystroke.wav', volume: 0.3 },
  { frame: 910, file: 'audio/keystroke.wav', volume: 0.3 },
  { frame: 935, file: 'audio/click.wav', volume: 0.75 },  // Send click
  { frame: 1045, file: 'audio/chime.wav', volume: 0.75 }, // Synthesis complete!
  { frame: 1055, file: 'audio/whoosh.wav', volume: 0.4 }, // Nodes cascade

  // ─── Scene 4: Intro Interstitial & Code Morph (1260 - 1630f) ──
  { frame: 1260, file: 'audio/whoosh.wav', volume: 0.35 }, // Intro text
  { frame: 1325, file: 'audio/whoosh.wav', volume: 0.3 },  // Editor shell enters
  { frame: 1360, file: 'audio/click.wav', volume: 0.6 },   // Slide 5 click
  { frame: 1375, file: 'audio/whoosh.wav', volume: 0.4 },  // Code diff morph

  // ─── Scene 5: 4K Export, Open Source & Outro (1630 - 2020f) ───
  { frame: 1630, file: 'audio/whoosh.wav', volume: 0.4 },  // Modal open
  { frame: 1760, file: 'audio/chime.wav', volume: 0.7 },   // Export complete 100%
  { frame: 1765, file: 'audio/whoosh.wav', volume: 0.4 },  // Open Source reveal
  { frame: 1835, file: 'audio/bass_drop.wav', volume: 0.85 }, // Grand Outro Impact
];

export function SoundController() {
  return (
    <>
      {/* Background Launch Soundtrack */}
      <Audio
        src={staticFile('audio/soundtrack.wav')}
        volume={0.7}
      />

      {/* Synchronized Micro-SFX Cues */}
      {SFX_CUES.map((cue, idx) => (
        <Sequence key={idx} from={cue.frame} durationInFrames={120}>
          <Audio
            src={staticFile(cue.file)}
            volume={cue.volume}
          />
        </Sequence>
      ))}
    </>
  );
}
