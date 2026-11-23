export type VoiceoverProvider = 'cloudflare' | 'elevenlabs'

export interface VoiceOption {
  id: string
  name: string
  description: string
  provider: VoiceoverProvider
  category?: string
}

/** Built-in @cf/deepgram/aura-1 speakers provided out of the box via Cloudflare Workers AI. */
export const CLOUDFLARE_VOICES: readonly VoiceOption[] = [
  { id: 'asteria', name: 'Asteria', description: 'Female · US · Warm & clear', provider: 'cloudflare' },
  { id: 'orion', name: 'Orion', description: 'Male · US · Confident & technical', provider: 'cloudflare' },
  { id: 'luna', name: 'Luna', description: 'Female · US · Calm & conversational', provider: 'cloudflare' },
  { id: 'arcas', name: 'Arcas', description: 'Male · US · Balanced & natural', provider: 'cloudflare' },
  { id: 'athena', name: 'Athena', description: 'Female · UK · Crisp & executive', provider: 'cloudflare' },
  { id: 'helios', name: 'Helios', description: 'Male · UK · Polished & narrative', provider: 'cloudflare' },
  { id: 'stella', name: 'Stella', description: 'Female · US · Bright & engaging', provider: 'cloudflare' },
  { id: 'perseus', name: 'Perseus', description: 'Male · US · Deep & steady', provider: 'cloudflare' },
  { id: 'angus', name: 'Angus', description: 'Male · Irish · Warm & storytelling', provider: 'cloudflare' },
  { id: 'hera', name: 'Hera', description: 'Female · US · Direct & authoritative', provider: 'cloudflare' },
  { id: 'orpheus', name: 'Orpheus', description: 'Male · US · Smooth & studio', provider: 'cloudflare' },
  { id: 'zeus', name: 'Zeus', description: 'Male · US · Bold & resonant', provider: 'cloudflare' },
] as const

/** Fallback curated ElevenLabs voices if GET /v1/voices fails temporarily. */
export const DEFAULT_ELEVENLABS_VOICES: readonly VoiceOption[] = [
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', description: 'Female · US · Calm narration', provider: 'elevenlabs', category: 'premade' },
  { id: 'ErXwobaYiN019PkySvjV', name: 'Antoni', description: 'Male · US · Well-rounded', provider: 'elevenlabs', category: 'premade' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', description: 'Female · US · Expressive', provider: 'elevenlabs', category: 'premade' },
] as const

const CLOUDFLARE_VOICE_IDS = new Set(CLOUDFLARE_VOICES.map((voice) => voice.id))

export function isCloudflareVoiceId(voiceId: string): boolean {
  return CLOUDFLARE_VOICE_IDS.has(voiceId)
}
