import type { Slide, SlideTransition } from '@motionslides/shared'
import {
  AUDIO_TYPE_BGM,
  AUDIO_TYPE_VOICEOVER,
  AUDIO_DRAWER_VO,
  AUDIO_DRAWER_BGM,
} from './constants'

export type AudioKey =
  | { type: typeof AUDIO_TYPE_VOICEOVER; slideId: string }
  | { type: typeof AUDIO_TYPE_BGM }

export type AudioDrawer = typeof AUDIO_DRAWER_VO | typeof AUDIO_DRAWER_BGM | null

export interface SlideWithTiming {
  slide: Slide
  index: number
  start: number
  end: number
  duration: number
  transitionDuration: number
  outgoingTransition: SlideTransition | null
}

export interface MutedTracks {
  vo: boolean
  bgm: boolean
}

export interface ScrubState {
  active: boolean
  time: number
}

export interface ResizingSlideState {
  slideId: string
  duration: number
}
