/**
 * Social media export presets.
 * Each preset defines the platform name, aspect ratio, resolution,
 * and recommended max duration.
 */

import type { AspectRatioKey } from '@motionslides/shared'

export interface SocialPreset {
  id: string
  name: string
  aspectRatio: AspectRatioKey
  resolution: { width: number; height: number; label: string }
  maxDurationHint?: string
  color: string
}

export const SOCIAL_PRESETS: SocialPreset[] = [
  {
    id: 'tiktok',
    name: 'TikTok',
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920, label: '1080×1920 (Full HD)' },
    maxDurationHint: '60s',
    color: '#010101',
  },
  {
    id: 'instagram-reels',
    name: 'IG Reels',
    aspectRatio: '9:16',
    resolution: { width: 1080, height: 1920, label: '1080×1920 (Full HD)' },
    maxDurationHint: '90s',
    color: '#E1306C',
  },
  {
    id: 'instagram-post',
    name: 'IG Post',
    aspectRatio: '1:1',
    resolution: { width: 1080, height: 1080, label: '1080×1080 (Full HD)' },
    color: '#833AB4',
  },
  {
    id: 'twitter',
    name: 'X / Twitter',
    aspectRatio: '16:9',
    resolution: { width: 1920, height: 1080, label: '1080p (Full HD)' },
    maxDurationHint: '140s',
    color: '#000000',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    aspectRatio: '16:9',
    resolution: { width: 1920, height: 1080, label: '1080p (Full HD)' },
    color: '#FF0000',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    aspectRatio: '16:9',
    resolution: { width: 1920, height: 1080, label: '1080p (Full HD)' },
    maxDurationHint: '10 min',
    color: '#0A66C2',
  },
]
