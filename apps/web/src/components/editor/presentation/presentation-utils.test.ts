import { describe, expect, it } from 'vitest'
import { isValidAudioFile } from '@/lib/utils'
import {
  clampSlideElapsedTime,
  resolveNextPresentationSlide,
} from './presentation-utils'

describe('presentation playback & audio helpers', () => {
  it('advances normally under autoplay even when a click transition exists', () => {
    expect(
      resolveNextPresentationSlide({
        activeSlideIndex: 0,
        totalSlides: 3,
        loop: false,
        autoTransitionTargetIndex: null,
        clickTransitionTargetIndex: 1,
      }),
    ).toEqual({ action: 'goto', index: 1 })
  })

  it('loops back to slide 0 from the last slide when loop is enabled', () => {
    expect(
      resolveNextPresentationSlide({
        activeSlideIndex: 2,
        totalSlides: 3,
        loop: true,
        autoTransitionTargetIndex: null,
        clickTransitionTargetIndex: null,
      }),
    ).toEqual({ action: 'goto', index: 0 })
  })

  it('pauses on the last slide when loop is disabled, including wrapping auto transitions', () => {
    expect(
      resolveNextPresentationSlide({
        activeSlideIndex: 2,
        totalSlides: 3,
        loop: false,
        autoTransitionTargetIndex: null,
        clickTransitionTargetIndex: null,
      }),
    ).toEqual({ action: 'pause' })

    expect(
      resolveNextPresentationSlide({
        activeSlideIndex: 2,
        totalSlides: 3,
        loop: false,
        autoTransitionTargetIndex: 0,
        clickTransitionTargetIndex: null,
      }),
    ).toEqual({ action: 'pause' })
  })

  it('clamps elapsed slide time so captions do not leak into subsequent slides', () => {
    expect(clampSlideElapsedTime(-1, 3)).toBe(0)
    expect(clampSlideElapsedTime(1.5, 3)).toBe(1.5)
    expect(clampSlideElapsedTime(12.4, 3)).toBe(2.98)
  })

  it('accepts recorded WebM/MP4/AAC/Opus/FLAC and standard audio uploads while rejecting non-audio files', () => {
    expect(isValidAudioFile(new File(['a'], 'voiceover.webm', { type: 'audio/webm;codecs=opus' }))).toBe(true)
    expect(isValidAudioFile(new File(['a'], 'voiceover.webm', { type: 'video/webm' }))).toBe(true)
    expect(isValidAudioFile(new File(['a'], 'clip.m4a', { type: '' }))).toBe(true)
    expect(isValidAudioFile(new File(['a'], 'notes.txt', { type: 'text/plain' }))).toBe(false)
    expect(isValidAudioFile(new File(['a'], 'image.png', { type: 'image/png' }))).toBe(false)
  })
})
