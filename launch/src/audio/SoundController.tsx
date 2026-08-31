import React from 'react';
import { Audio, staticFile, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { VIDEO_CONFIG } from '../constants/timing';

export interface SoundCue {
  frame: number;
  file: string;
  volume: number;
  playbackRate?: number;
  durationInFrames?: number;
}

export interface VoiceoverCue {
  frame: number;
  file: string;
  durationInFrames: number;
  volume?: number;
}

/**
 * 5 Studio-grade Scene Voiceover Tracks (OpenAI TTS-1-HD "Onyx")
 * Timed continuously to flow seamlessly across the entire 32-second video without cutoffs.
 */
export const VO_CUES: VoiceoverCue[] = [
  { frame: 4, file: 'audio/vo/vo_scene_1.wav', durationInFrames: 350, volume: 1.0 },
  { frame: 350, file: 'audio/vo/vo_scene_2.wav', durationInFrames: 365, volume: 1.0 },
  { frame: 715, file: 'audio/vo/vo_scene_3.wav', durationInFrames: 345, volume: 1.0 },
  { frame: 1060, file: 'audio/vo/vo_scene_4.wav', durationInFrames: 335, volume: 1.0 },
  { frame: 1535, file: 'audio/vo/vo_scene_5.wav', durationInFrames: 390, volume: 1.0 },
];

/**
 * Modern Linear/Apple-grade sound design suite for MotionSlides launch video.
 * - Minimalist Driving Tech Synth (Option 1 - 112.5 BPM) with dynamic sidechain ducking.
 * - Synchronized 5-chapter studio narration tracks.
 * - 12 Bespoke tactile UI micro-sound effects frame-synchronized to every scene interaction.
 */
export const SFX_CUES: SoundCue[] = [
  // ─── Scene 1: Hook & Brand Reveal (0 - 270f) ──────────────────────────
  { frame: 1, file: 'audio/sub_impact.wav', volume: 0.35 },       // Problem statement sub-drop
  { frame: 72, file: 'audio/airy_swoosh.wav', volume: 0.18 },      // Solution question air transition (+200ms)
  { frame: 130, file: 'audio/pill_toggle.wav', volume: 0.28 },     // Logo mark entrance pop
  { frame: 155, file: 'audio/magnetic_morph.wav', volume: 0.16 },  // Wordmark expansion glide
  { frame: 190, file: 'audio/sub_impact.wav', volume: 0.32 },      // Brand lockup settle impact
  { frame: 196, file: 'audio/specular_glint.wav', volume: 0.30 },  // Crystalline specular sheen glint
  { frame: 204, file: 'audio/pill_toggle.wav', volume: 0.22, playbackRate: 1.0 },  // Badge 1 pop
  { frame: 216, file: 'audio/pill_toggle.wav', volume: 0.22, playbackRate: 1.15 }, // Badge 2 pop
  { frame: 228, file: 'audio/pill_toggle.wav', volume: 0.22, playbackRate: 1.3 },  // Badge 3 pop
  { frame: 252, file: 'audio/airy_swoosh.wav', volume: 0.20 },     // Forward dolly zoom handoff

  // ─── Scene 2: Presentation Studio & Magic Move (270 - 650f) ───────────
  { frame: 270, file: 'audio/pill_toggle.wav', volume: 0.30 },     // Scene 2 Interstitial
  { frame: 395, file: 'audio/button_click_1.wav', volume: 0.85 },  // Slide 2 thumbnail button click (+200ms)
  { frame: 398, file: 'audio/magnetic_morph.wav', volume: 0.26 },  // First canvas FLIP morph
  { frame: 515, file: 'audio/slide_click.wav', volume: 0.80 },     // Slide 3 thumbnail button click
  { frame: 518, file: 'audio/magnetic_morph.wav', volume: 0.28 },  // Lambda architecture FLIP morph
  { frame: 535, file: 'audio/node_snap.wav', volume: 0.25 },       // Connector snap

  // ─── Scene 3: Shiki Code Engine & Morph (650 - 1020f) ─────────────────
  { frame: 650, file: 'audio/pill_toggle.wav', volume: 0.30 },     // Scene 3 Interstitial
  { frame: 758, file: 'audio/button_click_1.wav', volume: 0.85 },  // Slide 5 thumbnail button click (+200ms)
  { frame: 770, file: 'audio/code_morph_shuffle.wav', volume: 0.40 }, // Organic code AST line diff shuffle

  // ─── Scene 4: Agentic AI Studio (1020 - 1530f) ────────────────────────
  { frame: 1020, file: 'audio/pill_toggle.wav', volume: 0.30 },    // Scene 4 Interstitial
  { frame: 1098, file: 'audio/airy_swoosh.wav', volume: 0.20 },    // Copilot drawer opens
  // Authentic mechanical keyboard typing flurry across full input duration
  { frame: 1112, file: 'audio/real_typing_flurry.wav', volume: 0.65 },
  // Send button click with authentic mechanical enter / commit sound
  { frame: 1205, file: 'audio/real_key_enter.wav', volume: 0.70 }, // Send button enter key press
  { frame: 1206, file: 'audio/button_click_1.wav', volume: 0.60 }, // Primary UI button snap
  { frame: 1212, file: 'audio/ai_reasoning.wav', volume: 0.35 },   // Ambient AI reasoning & telemetry shimmer
  { frame: 1255, file: 'audio/pill_toggle.wav', volume: 0.28 },    // Step 1: Topology analyzed
  { frame: 1290, file: 'audio/pill_toggle.wav', volume: 0.30 },    // Step 2: Connectors routed
  { frame: 1320, file: 'audio/crystal_chime.wav', volume: 0.48 },  // Synthesis complete chime
  { frame: 1325, file: 'audio/node_snap.wav', volume: 0.32 },      // Kafka cluster node pop
  { frame: 1332, file: 'audio/node_snap.wav', volume: 0.35 },      // Lambda processor node pop
  { frame: 1340, file: 'audio/node_snap.wav', volume: 0.38 },      // DynamoDB & Redis nodes pop

  // ─── Scene 5: 4K Export Studio & Brand Outro (1530 - 1920f) ───────────
  { frame: 1530, file: 'audio/pill_toggle.wav', volume: 0.30 },    // Scene 5 Interstitial
  { frame: 1540, file: 'audio/export_riser.wav', volume: 0.35, durationInFrames: 130 }, // 4K Export progress turbine (starts concurrently with progress bar at 1540)
  { frame: 1660, file: 'audio/crystal_chime.wav', volume: 0.50 },  // 100% Export complete ping
  { frame: 1695, file: 'audio/sub_impact.wav', volume: 0.35 },     // Open Source badge reveal
  { frame: 1750, file: 'audio/sub_impact.wav', volume: 0.50 },     // Grand 2.2x Outro Logo Impact (+200ms)
  { frame: 1804, file: 'audio/button_click_1.wav', volume: 0.85 }, // Cursor clicks "Try at https:..." button
  { frame: 1808, file: 'audio/specular_glint.wav', volume: 0.45 }, // Specular glint sweeps across Grand Logo
];

/** Set to true to enable AI keynote voiceovers, or false for pure soundtrack + tactile SFX mix */
export const ENABLE_VOICEOVER = false;

export function SoundController() {
  const frame = useCurrentFrame();
  const totalFrames = VIDEO_CONFIG.totalFrames;

  // Dynamic soundtrack sidechain automation curve:
  // - When VO is disabled: Full driving energy (0.38), dipping slightly during AI typing (0.22-0.26), swelling to 0.45 on AI bloom and 0.46 on Grand Outro
  // - When VO is enabled: Ducks to 0.20 during narration
  const soundtrackVolume = interpolate(
    frame,
    ENABLE_VOICEOVER
      ? [
          0, 20, 340, 350, 710, 715, 1050, 1060, 1385, 1420, 1530, 1535, 1750, 1800, 1880, 1920,
        ]
      : [
          0, 45, 1100, 1130, 1200, 1315, 1335, 1530, 1600, 1660, 1745, totalFrames - 90, totalFrames,
        ],
    ENABLE_VOICEOVER
      ? [
          0, 0.20, 0.20, 0.20, 0.20, 0.20, 0.20, 0.18, 0.20, 0.44, 0.44, 0.22, 0.22, 0.46, 0.46, 0,
        ]
      : [
          0, 0.38, 0.38, 0.22, 0.24, 0.26, 0.45, 0.38, 0.34, 0.46, 0.46, 0.46, 0,
        ],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <>
      {/* Background Launch Soundtrack (Option 1: Minimalist Tech Synth) */}
      <Audio
        src={staticFile('audio/soundtrack_opt1_minimal_tech.wav')}
        volume={soundtrackVolume}
      />

      {/* Studio Voiceover Narration Tracks (Toggled via ENABLE_VOICEOVER) */}
      {ENABLE_VOICEOVER &&
        VO_CUES.map((vo, idx) => (
          <Sequence key={`vo-${idx}`} from={vo.frame} durationInFrames={vo.durationInFrames}>
            <Audio
              src={staticFile(vo.file)}
              volume={vo.volume ?? 1.0}
            />
          </Sequence>
        ))}

      {/* Synchronized Tactile Micro-SFX Cues */}
      {SFX_CUES.map((cue, idx) => (
        <Sequence key={`sfx-${idx}`} from={cue.frame} durationInFrames={cue.durationInFrames ?? 75}>
          <Audio
            src={staticFile(cue.file)}
            volume={cue.volume}
            playbackRate={cue.playbackRate ?? 1.0}
          />
        </Sequence>
      ))}
    </>
  );
}
